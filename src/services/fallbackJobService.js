// 备用工作服务 - 只使用真实数据源
import { fetchRealRemoteJobs } from './realJobAPI';

// 简化的工作搜索服务，只使用真实数据
export const searchJobsWithFallback = async (searchTerm = '', filters = {}) => {
  console.log('🔄 开始搜索真实工作数据，搜索词:', searchTerm, '筛选器:', filters);
  
  try {
    // 只从真实API获取数据
    let jobs = [];
    console.log('🔄 开始获取真实工作数据...');
    
    // 尝试从真实API获取数据
    try {
      const realJobs = await fetchRealRemoteJobs(searchTerm, filters);
      if (realJobs && realJobs.jobs && realJobs.jobs.length > 0) {
        jobs = [...jobs, ...realJobs.jobs];
        console.log('✅ 获取了', realJobs.jobs.length, '个真实工作');
      }
    } catch (apiError) {
      console.warn('⚠️ 真实API调用失败:', apiError.message);
    }
    
    // 应用搜索和筛选
    const filteredJobs = applySearchAndFilters(jobs, searchTerm, filters);
    
    const result = {
      jobs: filteredJobs,
      total: filteredJobs.length,
      sources: getDataSources(filteredJobs),
      hasMore: false,
      page: 0,
      pageSize: filteredJobs.length
    };
    
    console.log('✅ 搜索完成，返回', result.jobs.length, '个工作');
    return result;
    
  } catch (error) {
    console.error('❌ 搜索服务完全失败:', error);
    
    // 如果完全失败，返回空结果
    return {
      jobs: [],
      total: 0,
      sources: ['No Data Available'],
      hasMore: false,
      page: 0,
      pageSize: 0,
      error: '无法获取工作数据，请稍后重试'
    };
  }
};

// 移除不再使用的函数

// 应用搜索和筛选逻辑
const applySearchAndFilters = (jobs, searchTerm, filters) => {
  let filteredJobs = [...jobs];
  
  // 搜索筛选
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
  
  // 职位类型筛选
  if (filters && Array.isArray(filters) && filters.length > 0) {
    filteredJobs = filteredJobs.filter(job => {
      return filters.some(filter => matchJobToFilter(job, filter));
    });
  }
  
  // 按相关性和日期排序
  return sortJobs(filteredJobs, searchTerm);
};

// 工作与筛选器匹配
const matchJobToFilter = (job, filter) => {
  const title = job.title.toLowerCase();
  const description = job.description ? job.description.toLowerCase() : '';
  const skills = job.skills ? job.skills.join(' ').toLowerCase() : '';
  
  const filterMap = {
    'frontend-developer': ['frontend', 'front-end', 'react', 'vue', 'angular', 'javascript'],
    'backend-developer': ['backend', 'back-end', 'api', 'server', 'node', 'python', 'java'],
    'fullstack-developer': ['full stack', 'fullstack', 'full-stack'],
    'ux-designer': ['ux designer', 'user experience', 'ux'],
    'ui-designer': ['ui designer', 'user interface', 'ui'],
    'product-designer': ['product designer', 'product design'],
    'data-scientist': ['data scientist', 'machine learning', 'data science'],
    'devops-engineer': ['devops', 'infrastructure', 'cloud', 'kubernetes'],
    'mobile-developer': ['mobile', 'ios', 'android', 'react native'],
    'marketing-specialist': ['marketing', 'content marketing', 'digital marketing'],
    'project-manager': ['project manager', 'program manager', 'scrum master']
  };
  
  const keywords = filterMap[filter] || [];
  return keywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword) || skills.includes(keyword)
  );
};

// 工作排序
const sortJobs = (jobs, searchTerm) => {
  return jobs.sort((a, b) => {
    // 如果有搜索词，按相关性排序
    if (searchTerm) {
      const scoreA = calculateRelevanceScore(a, searchTerm);
      const scoreB = calculateRelevanceScore(b, searchTerm);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }
    
    // 按发布日期排序
    const dateOrder = ['Today', 'Yesterday', '2 days ago', '3 days ago', '4 days ago', '5 days ago', '6 days ago', '1 week ago'];
    const indexA = dateOrder.indexOf(a.postedDate);
    const indexB = dateOrder.indexOf(b.postedDate);
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return 0;
  });
};

// 计算相关性分数
const calculateRelevanceScore = (job, searchTerm) => {
  if (!searchTerm) return 0;
  
  const term = searchTerm.toLowerCase();
  let score = 0;
  
  // 标题匹配（最高权重）
  if (job.title.toLowerCase().includes(term)) score += 10;
  
  // 公司匹配
  if (job.company.toLowerCase().includes(term)) score += 5;
  
  // 技能匹配
  if (job.skills && job.skills.some(skill => skill.toLowerCase().includes(term))) score += 8;
  
  // 描述匹配
  if (job.description && job.description.toLowerCase().includes(term)) score += 3;
  
  return score;
};

// 获取数据源
const getDataSources = (jobs) => {
  const sources = [...new Set(jobs.map(job => job.source || 'Mock Data'))];
  return sources;
};

export default {
  searchJobsWithFallback
};