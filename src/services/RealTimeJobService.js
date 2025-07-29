// 实时工作数据刷新服务
import { fetchRealRemoteJobs, fetchRemoteOKJobs, fetchWeWorkRemotelyJobs } from './realJobAPI';
import { mockJobs } from './mockData';

class RealTimeJobService {
  constructor() {
    this.jobs = [];
    this.lastUpdate = null;
    this.updateInterval = null;
    this.listeners = new Set();
    this.isUpdating = false;
    this.updateFrequency = 5 * 60 * 1000; // 5分钟更新一次
    this.sources = [];
    this.stats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      lastError: null
    };
  }

  // 开始实时更新
  startRealTimeUpdates() {
    console.log('🚀 启动实时工作数据更新服务');
    
    // 立即执行一次更新
    this.updateJobs();
    
    // 设置定期更新
    this.updateInterval = setInterval(() => {
      this.updateJobs();
    }, this.updateFrequency);
    
    return this;
  }

  // 停止实时更新
  stopRealTimeUpdates() {
    console.log('⏹️ 停止实时工作数据更新服务');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    return this;
  }

  // 手动触发更新
  async forceUpdate() {
    console.log('🔄 手动触发工作数据更新');
    return await this.updateJobs(true);
  }

  // 更新工作数据
  async updateJobs(force = false) {
    if (this.isUpdating && !force) {
      console.log('⏳ 更新正在进行中，跳过此次更新');
      return;
    }

    this.isUpdating = true;
    this.stats.totalUpdates++;
    
    try {
      console.log('🔄 开始获取最新工作数据...');
      
      // 并行调用多个数据源
      const dataPromises = [
        this.fetchFromRemoteOK(),
        this.fetchFromWeWorkRemotely(),
        this.fetchMockData()
      ];

      const results = await Promise.allSettled(dataPromises);
      
      // 合并所有成功的结果
      let newJobs = [];
      let activeSources = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.jobs.length > 0) {
          newJobs = [...newJobs, ...result.value.jobs];
          activeSources.push(result.value.source);
          console.log(`✅ ${result.value.source}: ${result.value.jobs.length} 个工作`);
        } else {
          const sources = ['RemoteOK', 'WeWorkRemotely', 'Mock Data'];
          console.warn(`❌ ${sources[index]} 获取失败:`, result.reason?.message);
        }
      });

      // 去重处理
      const uniqueJobs = this.deduplicateJobs(newJobs);
      
      // 添加时间戳和新工作标记
      const jobsWithTimestamp = uniqueJobs.map(job => ({
        ...job,
        fetchedAt: new Date().toISOString(),
        isNew: this.isNewJob(job)
      }));

      // 更新内部状态
      this.jobs = jobsWithTimestamp;
      this.sources = activeSources;
      this.lastUpdate = new Date();
      this.stats.successfulUpdates++;
      this.stats.lastError = null;

      console.log(`✅ 数据更新完成: ${uniqueJobs.length} 个唯一工作`);
      console.log(`📊 数据源: ${activeSources.join(', ')}`);

      // 通知所有监听器
      this.notifyListeners({
        jobs: this.jobs,
        sources: this.sources,
        lastUpdate: this.lastUpdate,
        stats: this.getStats()
      });

      return {
        success: true,
        jobs: this.jobs,
        sources: this.sources,
        count: this.jobs.length
      };

    } catch (error) {
      console.error('❌ 工作数据更新失败:', error);
      this.stats.failedUpdates++;
      this.stats.lastError = error.message;
      
      // 如果完全失败，至少返回模拟数据
      if (this.jobs.length === 0) {
        this.jobs = mockJobs.map(job => ({
          ...job,
          fetchedAt: new Date().toISOString(),
          isNew: false
        }));
        this.sources = ['Mock Data'];
      }

      return {
        success: false,
        error: error.message,
        jobs: this.jobs,
        sources: this.sources
      };
    } finally {
      this.isUpdating = false;
    }
  }

  // 从RemoteOK获取数据
  async fetchFromRemoteOK() {
    try {
      const jobs = await fetchRemoteOKJobs();
      return {
        jobs: jobs.map(job => ({ ...job, dataSource: 'RemoteOK' })),
        source: 'RemoteOK'
      };
    } catch (error) {
      throw new Error(`RemoteOK API 失败: ${error.message}`);
    }
  }

  // 从WeWorkRemotely获取数据
  async fetchFromWeWorkRemotely() {
    try {
      const jobs = await fetchWeWorkRemotelyJobs();
      return {
        jobs: jobs.map(job => ({ ...job, dataSource: 'WeWorkRemotely' })),
        source: 'WeWorkRemotely'
      };
    } catch (error) {
      throw new Error(`WeWorkRemotely API 失败: ${error.message}`);
    }
  }

  // 获取模拟数据作为备用
  async fetchMockData() {
    return {
      jobs: mockJobs.map(job => ({ 
        ...job, 
        dataSource: 'Mock Data',
        fetchedAt: new Date().toISOString()
      })),
      source: 'Mock Data'
    };
  }

  // 去重处理
  deduplicateJobs(jobs) {
    const seen = new Map();
    const uniqueJobs = [];

    for (const job of jobs) {
      // 创建唯一标识符
      const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        uniqueJobs.push(job);
      } else {
        console.log(`🔄 去重: ${job.title} @ ${job.company}`);
      }
    }

    return uniqueJobs;
  }

  // 检查是否为新工作
  isNewJob(job) {
    // 简单的新工作检测：发布时间为今天
    return job.postedDate === 'Today';
  }

  // 搜索工作
  searchJobs(searchTerm = '', filters = {}) {
    let filteredJobs = [...this.jobs];

    // 搜索词过滤
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredJobs = filteredJobs.filter(job => {
        return (
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          (job.skills && job.skills.some(skill => skill.toLowerCase().includes(term)))
        );
      });
    }

    // 应用筛选器
    if (filters.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.type && job.type.toLowerCase() === filters.jobType.toLowerCase()
      );
    }

    if (filters.team) {
      filteredJobs = filteredJobs.filter(job => 
        job.team && job.team.toLowerCase() === filters.team.toLowerCase()
      );
    }

    if (filters.salary) {
      const { min, max } = filters.salary;
      filteredJobs = filteredJobs.filter(job => 
        (!min || job.salary >= min) && (!max || job.salary <= max)
      );
    }

    // 排序
    filteredJobs = this.sortJobs(filteredJobs, filters.sortBy || 'date');

    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
      sources: this.sources,
      lastUpdate: this.lastUpdate,
      hasMore: false
    };
  }

  // 排序工作
  sortJobs(jobs, sortBy = 'date') {
    const sortedJobs = [...jobs];
    
    switch (sortBy) {
      case 'date':
        return sortedJobs.sort((a, b) => {
          // 新工作优先
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          
          // 按发布日期排序
          const dateOrder = ['Today', 'Yesterday', '2 days ago', '3 days ago', '1 week ago'];
          const indexA = dateOrder.indexOf(a.postedDate);
          const indexB = dateOrder.indexOf(b.postedDate);
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          
          return 0;
        });
      
      case 'salary':
        return sortedJobs.sort((a, b) => (b.salary || 0) - (a.salary || 0));
      
      case 'company':
        return sortedJobs.sort((a, b) => a.company.localeCompare(b.company));
      
      default:
        return sortedJobs;
    }
  }

  // 添加数据更新监听器
  addUpdateListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 通知所有监听器
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('监听器回调错误:', error);
      }
    });
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      totalJobs: this.jobs.length,
      newJobs: this.jobs.filter(job => job.isNew).length,
      sources: this.sources,
      lastUpdate: this.lastUpdate,
      isUpdating: this.isUpdating,
      updateFrequency: this.updateFrequency
    };
  }

  // 设置更新频率
  setUpdateFrequency(minutes) {
    this.updateFrequency = minutes * 60 * 1000;
    
    // 如果正在运行，重新启动定时器
    if (this.updateInterval) {
      this.stopRealTimeUpdates();
      this.startRealTimeUpdates();
    }
    
    console.log(`⏰ 更新频率设置为 ${minutes} 分钟`);
  }

  // 获取当前工作数据
  getCurrentJobs() {
    return {
      jobs: this.jobs,
      sources: this.sources,
      lastUpdate: this.lastUpdate,
      stats: this.getStats()
    };
  }
}

// 创建全局实例
const realTimeJobService = new RealTimeJobService();

export default realTimeJobService;