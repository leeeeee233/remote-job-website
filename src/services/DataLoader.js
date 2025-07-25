// 数据加载器
// 处理并行API请求、数据合并和去重

import DeduplicationService from './DeduplicationService';

class DataLoader {
  constructor(apiAdapters, cacheService) {
    this.apiAdapters = apiAdapters;
    this.cacheService = cacheService;
    this.deduplicationService = new DeduplicationService();
    this.requestQueue = [];
    this.maxConcurrentRequests = 3;
    this.loadedJobsGlobal = new Set(); // 全局已加载工作追踪
  }

  /**
   * 从所有来源加载工作
   * @param {string} searchTerm - 搜索关键词
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 页面大小
   * @returns {Promise<Object>} - 加载结果
   */
  async loadJobsFromAllSources(searchTerm = '', filters = {}, page = 0, pageSize = 20) {
    console.log(`加载工作数据 - 搜索词: "${searchTerm}", 页码: ${page}, 页面大小: ${pageSize}`);
    
    try {
      // 为每个页面创建新的去重服务实例，但保持全局追踪
      const pageDeduplicationService = new DeduplicationService();
      
      // 将已知的全局工作添加到页面去重服务中
      for (const jobId of this.loadedJobsGlobal) {
        pageDeduplicationService.seenJobIds.add(jobId);
      }
      
      // 并行从所有来源获取数据
      const sourcePromises = Object.entries(this.apiAdapters).map(([sourceName, adapter]) => 
        this.loadJobsFromSource(sourceName, adapter, searchTerm, filters, page, pageSize)
      );
      
      const sourceResults = await Promise.allSettled(sourcePromises);
      
      // 收集成功的结果
      const jobsBySource = {};
      let totalAvailable = 0;
      
      sourceResults.forEach((result, index) => {
        const sourceName = Object.keys(this.apiAdapters)[index];
        
        if (result.status === 'fulfilled' && result.value.jobs.length > 0) {
          jobsBySource[sourceName] = result.value.jobs;
          totalAvailable += result.value.total || result.value.jobs.length;
          console.log(`来源 ${sourceName}: 获取到 ${result.value.jobs.length} 个工作`);
        } else if (result.status === 'rejected') {
          console.error(`来源 ${sourceName} 加载失败:`, result.reason);
          jobsBySource[sourceName] = [];
        }
      });
      
      // 使用增强的去重服务处理多源数据
      const uniqueJobs = pageDeduplicationService.deduplicateMultipleSources(jobsBySource);
      
      // 更新全局已加载工作追踪
      uniqueJobs.forEach(job => {
        if (job.id) {
          this.loadedJobsGlobal.add(job.id);
        }
      });
      
      // 应用额外的筛选和排序
      const filteredJobs = this.applyFilters(uniqueJobs, filters);
      const sortedJobs = this.sortJobs(filteredJobs, filters.sort || 'date');
      
      // 分页处理
      const startIndex = 0; // 因为我们已经在API层面处理了分页
      const endIndex = pageSize;
      const paginatedJobs = sortedJobs.slice(startIndex, endIndex);
      
      const result = {
        jobs: paginatedJobs,
        total: sortedJobs.length,
        totalAvailable: totalAvailable,
        page: page,
        pageSize: pageSize,
        hasMore: sortedJobs.length > pageSize,
        sources: Object.keys(jobsBySource).filter(source => jobsBySource[source].length > 0),
        deduplicationStats: pageDeduplicationService.getStats()
      };
      
      console.log(`数据加载完成 - 返回 ${paginatedJobs.length} 个唯一工作`);
      console.log('去重统计:', pageDeduplicationService.getStats());
      
      return result;
      
    } catch (error) {
      console.error('数据加载失败:', error);
      return {
        jobs: [],
        total: 0,
        totalAvailable: 0,
        page: page,
        pageSize: pageSize,
        hasMore: false,
        sources: [],
        error: error.message
      };
    }
  }

  /**
   * 从单个来源加载工作
   * @param {string} sourceName - 来源名称
   * @param {Object} adapter - API适配器
   * @param {string} searchTerm - 搜索关键词
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 页面大小
   * @returns {Promise<Object>} - 加载结果
   */
  async loadJobsFromSource(sourceName, adapter, searchTerm, filters, page, pageSize) {
    try {
      console.log(`从 ${sourceName} 加载数据...`);
      
      // 生成缓存键
      const cacheKey = this.generateCacheKey(sourceName, searchTerm, filters, page, pageSize);
      
      // 检查缓存
      if (this.cacheService) {
        const cachedData = await this.cacheService.get(cacheKey);
        if (cachedData) {
          console.log(`使用 ${sourceName} 的缓存数据`);
          return cachedData;
        }
      }
      
      // 调用API
      let result;
      if (adapter.searchJobsPaginated) {
        // 使用分页方法
        result = await adapter.searchJobsPaginated(searchTerm, filters, page, pageSize);
      } else if (adapter.searchJobs) {
        // 使用标准方法
        result = await adapter.searchJobs(searchTerm, filters, page);
      } else {
        throw new Error(`${sourceName} 适配器不支持工作搜索`);
      }
      
      // 确保结果格式正确
      if (!result || !Array.isArray(result.jobs)) {
        console.warn(`${sourceName} 返回了无效的数据格式`);
        return { jobs: [], total: 0 };
      }
      
      // 缓存结果
      if (this.cacheService && result.jobs.length > 0) {
        await this.cacheService.set(cacheKey, result);
      }
      
      return result;
      
    } catch (error) {
      console.error(`从 ${sourceName} 加载数据失败:`, error);
      return { jobs: [], total: 0, error: error.message };
    }
  }

  /**
   * 应用筛选条件
   * @param {Array} jobs - 工作列表
   * @param {Object} filters - 筛选条件
   * @returns {Array} - 筛选后的工作列表
   */
  applyFilters(jobs, filters) {
    let filteredJobs = [...jobs];
    
    // 工作类型筛选
    if (filters.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.type && job.type.toLowerCase() === filters.jobType.toLowerCase()
      );
    }
    
    // 薪资范围筛选
    if (filters.salary) {
      const { min, max } = filters.salary;
      filteredJobs = filteredJobs.filter(job => {
        const salary = job.salary || 0;
        return (!min || salary >= min) && (!max || salary <= max);
      });
    }
    
    // 位置筛选
    if (filters.location && filters.location !== 'remote') {
      filteredJobs = filteredJobs.filter(job => 
        job.location && job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    // 技能筛选
    if (filters.skills && filters.skills.length > 0) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.skills || !Array.isArray(job.skills)) return false;
        return filters.skills.some(skill => 
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    }
    
    // 公司筛选
    if (filters.company) {
      filteredJobs = filteredJobs.filter(job => 
        job.company && job.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    // 发布时间筛选
    if (filters.dateRange) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.postedDate) return true;
        
        const daysAgo = this.parseDateToDaysAgo(job.postedDate);
        return daysAgo <= filters.dateRange;
      });
    }
    
    return filteredJobs;
  }

  /**
   * 排序工作列表
   * @param {Array} jobs - 工作列表
   * @param {string} sortBy - 排序方式
   * @returns {Array} - 排序后的工作列表
   */
  sortJobs(jobs, sortBy = 'date') {
    const sortedJobs = [...jobs];
    
    switch (sortBy) {
      case 'date':
        return sortedJobs.sort((a, b) => {
          const aDays = this.parseDateToDaysAgo(a.postedDate);
          const bDays = this.parseDateToDaysAgo(b.postedDate);
          return aDays - bDays; // 最新的在前面
        });
      
      case 'salary':
        return sortedJobs.sort((a, b) => (b.salary || 0) - (a.salary || 0));
      
      case 'company':
        return sortedJobs.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
      
      case 'title':
        return sortedJobs.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      
      case 'relevance':
        // 基于来源优先级和其他因素排序
        return sortedJobs.sort((a, b) => {
          const sourcePriority = { 'LinkedIn': 3, 'RemoteOK': 2, 'WeWorkRemotely': 1 };
          const aPriority = sourcePriority[a.source] || 0;
          const bPriority = sourcePriority[b.source] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          // 如果来源优先级相同，按日期排序
          const aDays = this.parseDateToDaysAgo(a.postedDate);
          const bDays = this.parseDateToDaysAgo(b.postedDate);
          return aDays - bDays;
        });
      
      default:
        return sortedJobs;
    }
  }

  /**
   * 解析日期字符串为天数
   * @param {string} dateStr - 日期字符串
   * @returns {number} - 天数
   */
  parseDateToDaysAgo(dateStr) {
    if (!dateStr) return 999;
    
    if (dateStr === 'Today') return 0;
    if (dateStr === 'Yesterday') return 1;
    
    const daysMatch = dateStr.match(/(\d+)\s*days?\s*ago/i);
    if (daysMatch) return parseInt(daysMatch[1], 10);
    
    const weeksMatch = dateStr.match(/(\d+)\s*weeks?\s*ago/i);
    if (weeksMatch) return parseInt(weeksMatch[1], 10) * 7;
    
    const monthsMatch = dateStr.match(/(\d+)\s*months?\s*ago/i);
    if (monthsMatch) return parseInt(monthsMatch[1], 10) * 30;
    
    return 999; // 未知日期排在最后
  }

  /**
   * 生成缓存键
   * @param {string} source - 数据源
   * @param {string} searchTerm - 搜索词
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 页面大小
   * @returns {string} - 缓存键
   */
  generateCacheKey(source, searchTerm, filters, page, pageSize) {
    const filterStr = JSON.stringify(filters);
    return `jobs_${source}_${searchTerm}_${filterStr}_${page}_${pageSize}`;
  }

  /**
   * 批量处理请求
   * @param {Array} requests - 请求列表
   * @returns {Promise<Array>} - 处理结果
   */
  async processBatchRequests(requests) {
    const batches = [];
    for (let i = 0; i < requests.length; i += this.maxConcurrentRequests) {
      batches.push(requests.slice(i, i + this.maxConcurrentRequests));
    }
    
    const results = [];
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 优化批量大小
   * @param {string} networkSpeed - 网络速度
   * @param {number} responseTime - 响应时间
   * @returns {number} - 优化后的批量大小
   */
  optimizeBatchSize(networkSpeed, responseTime) {
    let batchSize = 20; // 默认批量大小
    
    if (networkSpeed === 'fast' && responseTime < 1000) {
      batchSize = 50;
    } else if (networkSpeed === 'slow' || responseTime > 5000) {
      batchSize = 10;
    }
    
    return Math.min(batchSize, 100); // 最大不超过100
  }

  /**
   * 重置加载状态
   */
  reset() {
    this.requestQueue = [];
    this.loadedJobsGlobal.clear();
    this.deduplicationService.reset();
    console.log('DataLoader 状态已重置');
  }

  /**
   * 获取加载统计
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      loadedJobsCount: this.loadedJobsGlobal.size,
      queueLength: this.requestQueue.length,
      deduplicationStats: this.deduplicationService.getStats()
    };
  }

  /**
   * 设置最大并发请求数
   * @param {number} maxRequests - 最大并发数
   */
  setMaxConcurrentRequests(maxRequests) {
    this.maxConcurrentRequests = Math.max(1, Math.min(maxRequests, 10));
  }
}

export default DataLoader;