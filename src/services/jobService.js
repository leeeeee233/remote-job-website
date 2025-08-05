// 真实的工作数据服务
// 使用公开的API和RSS feed获取远程工作数据
import { 
  LinkedInApiAdapter, 
  WWRApiAdapter, 
  CacheService 
} from './api';

// 导入RemoteOK API服务
import { fetchRemoteOKJobs } from './realJobAPI';

// 导入Jobspresso服务
import JobspressoService from './jobspressoService';

// 导入新的数据加载器和去重服务
import DataLoader from './DataLoader';
import DeduplicationService from './DeduplicationService';

// 导入生产环境配置
import { config } from '../config/production';

// 创建API适配器实例
const linkedInAdapter = new LinkedInApiAdapter({
  clientId: process.env.REACT_APP_LINKEDIN_CLIENT_ID,
  clientSecret: process.env.REACT_APP_LINKEDIN_CLIENT_SECRET
});

const wwrAdapter = new WWRApiAdapter({
  apiKey: process.env.REACT_APP_RSS2JSON_API_KEY
});

// 创建Jobspresso服务实例
const jobspressoService = new JobspressoService();

// 创建缓存服务实例
const cacheService = new CacheService({
  memoryTTL: config.cache.memoryTTL,
  storageTTL: config.cache.storageTTL
});

// 创建数据加载器实例
const dataLoader = new DataLoader({
  LinkedIn: linkedInAdapter,
  WeWorkRemotely: wwrAdapter,
  Jobspresso: {
    searchJobs: async (searchTerm, filters, page) => {
      const result = await jobspressoService.fetchJobs(searchTerm, filters.category, page);
      return { jobs: result.jobs, total: result.total, page, pageSize: result.jobs.length };
    }
  },
  RemoteOK: { 
    searchJobs: async (searchTerm, filters, page) => {
      const jobs = await fetchRemoteOKJobs();
      return { jobs, total: jobs.length, page, pageSize: jobs.length };
    }
  }
}, cacheService);

// 创建全局去重服务实例
const globalDeduplicationService = new DeduplicationService();

// WeWorkRemotely API 集成
export const fetchWeWorkRemotelyJobs = async (searchTerm = '', category = '') => {
  try {
    // 生成缓存键
    const cacheKey = CacheService.generateKey('wwr_jobs', { searchTerm, category });
    
    // 检查缓存
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log('Using cached WeWorkRemotely jobs');
      return cachedData;
    }
    
    // 调用API
    console.log('Fetching WeWorkRemotely jobs with search term:', searchTerm, 'and category:', category);
    const result = await wwrAdapter.searchJobs(searchTerm, category);
    
    // 缓存结果
    await cacheService.set(cacheKey, result.jobs);
    
    return result.jobs;
  } catch (error) {
    console.error('Error fetching WeWorkRemotely jobs:', error);
    // 返回空数组
    return [];
  }
};

// LinkedIn Jobs API 集成
export const fetchLinkedInJobs = async (searchTerm = '', location = 'remote') => {
  try {
    // 生成缓存键
    const cacheKey = CacheService.generateKey('linkedin_jobs', { searchTerm, location });
    
    // 检查缓存
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log('Using cached LinkedIn jobs');
      return cachedData;
    }
    
    // 调用API
    console.log('Fetching LinkedIn jobs with search term:', searchTerm, 'and location:', location);
    const result = await linkedInAdapter.searchJobs(searchTerm, { location }, 0);
    
    // 缓存结果
    await cacheService.set(cacheKey, result.jobs);
    
    return result.jobs;
  } catch (error) {
    console.error('Error fetching LinkedIn jobs:', error);
    // 返回空数组
    return [];
  }
};

// Jobspresso Jobs API 集成
export const fetchJobspressoJobs = async (searchTerm = '', category = '') => {
  try {
    // 生成缓存键
    const cacheKey = CacheService.generateKey('jobspresso_jobs', { searchTerm, category });
    
    // 检查缓存
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log('Using cached Jobspresso jobs');
      return cachedData;
    }
    
    // 调用API
    console.log('Fetching Jobspresso jobs with search term:', searchTerm, 'and category:', category);
    const result = await jobspressoService.fetchJobs(searchTerm, category);
    
    // 缓存结果
    await cacheService.set(cacheKey, result.jobs);
    
    return result.jobs;
  } catch (error) {
    console.error('Error fetching Jobspresso jobs:', error);
    // 返回空数组
    return [];
  }
};

// 通用的远程工作搜索函数 - 使用新的DataLoader确保无重复
export const searchRemoteJobs = async (searchTerm = '', filters = {}, page = 0, pageSize = 50) => {
  try {
    console.log(`搜索远程工作 - 关键词: "${searchTerm}", 页码: ${page}, 页面大小: ${pageSize}`);
    
    // 使用DataLoader获取去重后的数据
    const result = await dataLoader.loadJobsFromAllSources(searchTerm, filters, page, pageSize);
    
    // 如果没有数据，尝试使用旧的方法作为备选
    if (result.jobs.length === 0 && page === 0) {
      console.log('DataLoader未返回数据，尝试备选方法...');
      return await searchRemoteJobsFallback(searchTerm, filters);
    }
    
    // 记录去重统计信息
    if (result.deduplicationStats) {
      console.log('去重统计:', result.deduplicationStats);
    }
    
    return {
      jobs: result.jobs,
      total: result.total,
      totalAvailable: result.totalAvailable,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      sources: result.sources || [],
      deduplicationStats: result.deduplicationStats
    };
    
  } catch (error) {
    console.error('Error searching remote jobs:', error);
    
    // 错误时尝试备选方法
    if (page === 0) {
      console.log('主要方法失败，尝试备选方法...');
      return await searchRemoteJobsFallback(searchTerm, filters);
    }
    
    // 返回空结果
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
};

// 备选的搜索方法（保持向后兼容）
const searchRemoteJobsFallback = async (searchTerm = '', filters = {}) => {
  try {
    console.log('使用备选搜索方法...');
    
    // 并行调用多个API，包括Jobspresso
    const [weWorkJobs, linkedInJobs, jobspressoJobs, remoteOKJobs] = await Promise.allSettled([
      fetchWeWorkRemotelyJobs(searchTerm, filters.category),
      fetchLinkedInJobs(searchTerm, filters.location || 'remote'),
      fetchJobspressoJobs(searchTerm, filters.category),
      fetchRemoteOKJobs()
    ]);
    
    // 合并结果
    const allJobs = [
      ...(weWorkJobs.status === 'fulfilled' ? weWorkJobs.value : []),
      ...(linkedInJobs.status === 'fulfilled' ? linkedInJobs.value : []),
      ...(jobspressoJobs.status === 'fulfilled' ? jobspressoJobs.value : []),
      ...(remoteOKJobs.status === 'fulfilled' ? remoteOKJobs.value : [])
    ];
    
    // 如果所有API都失败，返回空结果
    if (allJobs.length === 0) {
      console.error('Failed to fetch jobs from any source');
      return {
        jobs: [],
        total: 0,
        sources: []
      };
    }
    
    // 使用全局去重服务进行去重
    const uniqueJobs = globalDeduplicationService.deduplicateJobs(allJobs);
    
    // 按搜索词过滤
    let filteredJobs = uniqueJobs;
    if (searchTerm) {
      filteredJobs = uniqueJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.skills && job.skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }
    
    // 应用其他筛选条件
    if (filters.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.type && job.type.toLowerCase() === filters.jobType.toLowerCase()
      );
    }
    
    if (filters.salary) {
      const { min, max } = filters.salary;
      filteredJobs = filteredJobs.filter(job => 
        (!min || job.salary >= min) && (!max || job.salary <= max)
      );
    }
    
    // 排序
    const sortedJobs = sortJobs(filteredJobs, filters.sort || 'date');
    
    // 获取数据来源
    const sources = [...new Set(sortedJobs.map(job => job.source))];
    
    const result = {
      jobs: sortedJobs,
      total: sortedJobs.length,
      sources,
      deduplicationStats: globalDeduplicationService.getStats()
    };
    
    console.log(`备选方法完成 - 返回 ${sortedJobs.length} 个唯一工作`);
    console.log('去重统计:', globalDeduplicationService.getStats());
    
    return result;
  } catch (error) {
    console.error('Error in fallback search:', error);
    return {
      jobs: [],
      total: 0,
      sources: [],
      error: error.message
    };
  }
};

// 获取工作详情
export const getJobDetails = async (jobId, source) => {
  try {
    // 生成缓存键
    const cacheKey = `job_detail_${jobId}`;
    
    // 检查缓存
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log('Using cached job details');
      return cachedData;
    }
    
    // 根据来源选择适当的API适配器
    let jobDetail;
    switch (source) {
      case 'LinkedIn':
        jobDetail = await linkedInAdapter.getJobDetails(jobId);
        break;
      case 'WeWorkRemotely':
        jobDetail = await wwrAdapter.getJobDetails(jobId);
        break;
      default:
        // 如果没有指定来源或来源不支持，尝试从所有适配器获取
        const results = await Promise.allSettled([
          linkedInAdapter.getJobDetails(jobId),
          wwrAdapter.getJobDetails(jobId)
        ]);
        
        // 使用第一个成功的结果
        const successResult = results.find(result => result.status === 'fulfilled');
        if (successResult) {
          jobDetail = successResult.value;
        } else {
          throw new Error(`Job with ID ${jobId} not found`);
        }
    }
    
    // 缓存结果
    await cacheService.set(cacheKey, jobDetail);
    
    return jobDetail;
  } catch (error) {
    console.error(`Error fetching job details for ${jobId}:`, error);
    throw error;
  }
};

// 刷新缓存
export const refreshCache = async () => {
  try {
    await cacheService.clear();
    console.log('Job cache cleared');
    return { success: true };
  } catch (error) {
    console.error('Error clearing job cache:', error);
    return { success: false, error: error.message };
  }
};

// 获取缓存统计
export const getCacheStats = () => {
  return cacheService.getStats();
};

// 增强的去重函数
const removeDuplicateJobs = (jobs) => {
  const seen = new Set();
  const seenIds = new Set();
  
  return jobs.filter(job => {
    // 首先检查ID是否重复
    if (job.id && seenIds.has(job.id)) {
      console.log(`Duplicate job ID found: ${job.id} - ${job.title} at ${job.company}`);
      return false;
    }
    
    // 创建多个唯一标识符来检查重复
    const titleCompanyKey = `${job.title}-${job.company}`.toLowerCase().replace(/\s+/g, '');
    const titleLocationKey = `${job.title}-${job.location}`.toLowerCase().replace(/\s+/g, '');
    const companyTitleKey = `${job.company}-${job.title}`.toLowerCase().replace(/\s+/g, '');
    
    // 检查是否已存在相似的工作
    if (seen.has(titleCompanyKey) || seen.has(titleLocationKey) || seen.has(companyTitleKey)) {
      console.log(`Duplicate job found: ${job.title} at ${job.company}`);
      return false;
    }
    
    // 额外检查：如果标题和公司名称非常相似，也认为是重复
    for (const existingKey of seen) {
      const similarity = calculateSimilarity(titleCompanyKey, existingKey);
      if (similarity > 0.85) { // 85%相似度阈值
        console.log(`Similar job found (${Math.round(similarity * 100)}% similarity): ${job.title} at ${job.company}`);
        return false;
      }
    }
    
    // 记录所有标识符
    if (job.id) seenIds.add(job.id);
    seen.add(titleCompanyKey);
    seen.add(titleLocationKey);
    seen.add(companyTitleKey);
    
    return true;
  });
};

// 计算字符串相似度的简单函数
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// 计算编辑距离
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// 排序函数
const sortJobs = (jobs, sortBy = 'date') => {
  const sortedJobs = [...jobs];
  
  switch (sortBy) {
    case 'date':
      // 按发布日期排序（最新的在前面）
      return sortedJobs.sort((a, b) => {
        // 优先显示"Today"
        if (a.postedDate === 'Today' && b.postedDate !== 'Today') return -1;
        if (a.postedDate !== 'Today' && b.postedDate === 'Today') return 1;
        
        // 优先显示"Yesterday"
        if (a.postedDate === 'Yesterday' && b.postedDate !== 'Yesterday' && b.postedDate !== 'Today') return -1;
        if (a.postedDate !== 'Yesterday' && a.postedDate !== 'Today' && b.postedDate === 'Yesterday') return 1;
        
        // 比较天数
        const getNumericDays = (dateStr) => {
          if (dateStr.includes('days ago')) {
            return parseInt(dateStr.split(' ')[0], 10);
          }
          if (dateStr.includes('weeks ago')) {
            return parseInt(dateStr.split(' ')[0], 10) * 7;
          }
          if (dateStr.includes('months ago')) {
            return parseInt(dateStr.split(' ')[0], 10) * 30;
          }
          return 0;
        };
        
        return getNumericDays(a.postedDate) - getNumericDays(b.postedDate);
      });
    
    case 'salary':
      // 按薪资排序（高的在前面）
      return sortedJobs.sort((a, b) => (b.salary || 0) - (a.salary || 0));
    
    case 'company':
      // 按公司名称排序
      return sortedJobs.sort((a, b) => a.company.localeCompare(b.company));
    
    case 'title':
      // 按职位名称排序
      return sortedJobs.sort((a, b) => a.title.localeCompare(b.title));
    
    default:
      return sortedJobs;
  }
};

export default {
  searchRemoteJobs,
  fetchWeWorkRemotelyJobs,
  fetchLinkedInJobs,
  getJobDetails,
  refreshCache,
  getCacheStats
};