import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import JobCard from '../components/JobCard';
import JobDetailsDrawer from '../components/JobDetailsDrawer';
// 移除mock数据依赖，添加实时刷新服务
import jobService from '../services/jobService';
import fallbackJobService from '../services/fallbackJobService';
import realTimeJobService from '../services/RealTimeJobService';
import refreshService from '../services/RefreshService';
import './JobFeed.css';

const JobFeed = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [refreshStats, setRefreshStats] = useState(null);
  const observer = useRef();
  const lastJobElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreJobs();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // 加载更多工作
  const loadMoreJobs = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const designSearchTerms = searchTerm || '';
      
      const result = await jobService.searchRemoteJobs(designSearchTerms, {
        ...activeFilters,
        category: 'design',
        page: nextPage
      });
      
      if (result.jobs.length === 0) {
        setHasMore(false);
      } else {
        // 处理新加载的工作数据
        const newJobs = filterJobs(result.jobs);
        
        if (newJobs.length === 0) {
          setHasMore(false);
        } else {
          setJobs(prevJobs => [...prevJobs, ...newJobs]);
          setFilteredJobs(prevFiltered => [...prevFiltered, ...newJobs]);
          setPage(nextPage);
          
          // 更新动态分类（基于所有已加载的工作）
          const allLoadedJobs = [...jobs, ...newJobs];
          const categories = generateDynamicCategories(allLoadedJobs);
          setDynamicCategories(categories);
        }
      }
    } catch (error) {
      console.error('Failed to load more jobs:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 根据工作数据自动生成分类 - 改进版本，更准确地匹配工作
  const generateDynamicCategories = (jobs) => {
    console.log('生成动态分类，工作数量:', jobs.length);
    
    // 定义更精确的分类规则和关键词
    const categoryRules = {
      'ux-designer': {
        label: 'UX Designer',
        primaryKeywords: ['ux designer', 'user experience designer', 'ux/ui designer', 'ui/ux designer'],
        secondaryKeywords: ['ux', 'user experience', 'interaction design', 'usability', 'user research'],
        excludeKeywords: ['ux writer', 'ux content'],
        count: 0,
        jobs: []
      },
      'ui-designer': {
        label: 'UI Designer',
        primaryKeywords: ['ui designer', 'user interface designer', 'interface designer'],
        secondaryKeywords: ['ui', 'user interface', 'visual design', 'interface design'],
        excludeKeywords: ['ui developer', 'ui engineer'],
        count: 0,
        jobs: []
      },
      'product-designer': {
        label: 'Product Designer',
        primaryKeywords: ['product designer', 'digital product designer'],
        secondaryKeywords: ['product design', 'design lead', 'senior designer'],
        excludeKeywords: ['product manager', 'product owner'],
        count: 0,
        jobs: []
      },
      'frontend-developer': {
        label: 'Frontend Developer',
        primaryKeywords: ['frontend developer', 'front-end developer', 'front end developer', 'react developer', 'vue developer', 'angular developer'],
        secondaryKeywords: ['frontend', 'front-end', 'javascript', 'react', 'vue', 'angular', 'html', 'css'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'backend-developer': {
        label: 'Backend Developer',
        primaryKeywords: ['backend developer', 'back-end developer', 'server developer', 'api developer'],
        secondaryKeywords: ['backend', 'back-end', 'server', 'api', 'node.js', 'python', 'java', 'php', 'ruby'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'fullstack-developer': {
        label: 'Full Stack Developer',
        primaryKeywords: ['full stack developer', 'fullstack developer', 'full-stack developer'],
        secondaryKeywords: ['full stack', 'fullstack', 'full-stack'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'data-scientist': {
        label: 'Data Scientist',
        primaryKeywords: ['data scientist', 'machine learning engineer', 'ai engineer'],
        secondaryKeywords: ['data science', 'machine learning', 'artificial intelligence', 'analytics', 'big data'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'devops-engineer': {
        label: 'DevOps Engineer',
        primaryKeywords: ['devops engineer', 'site reliability engineer', 'sre', 'cloud engineer'],
        secondaryKeywords: ['devops', 'infrastructure', 'cloud', 'aws', 'azure', 'kubernetes', 'docker'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'mobile-developer': {
        label: 'Mobile Developer',
        primaryKeywords: ['mobile developer', 'ios developer', 'android developer', 'react native developer'],
        secondaryKeywords: ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'graphic-designer': {
        label: 'Graphic Designer',
        primaryKeywords: ['graphic designer', 'visual designer', 'brand designer'],
        secondaryKeywords: ['graphic design', 'visual design', 'brand design', 'creative design'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'marketing-specialist': {
        label: 'Marketing Specialist',
        primaryKeywords: ['marketing specialist', 'digital marketing', 'marketing manager', 'growth marketer'],
        secondaryKeywords: ['marketing', 'content marketing', 'social media', 'seo', 'sem', 'growth'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      },
      'project-manager': {
        label: 'Project Manager',
        primaryKeywords: ['project manager', 'program manager', 'scrum master', 'product manager'],
        secondaryKeywords: ['project management', 'agile', 'scrum', 'product management'],
        excludeKeywords: [],
        count: 0,
        jobs: []
      }
    };
    
    // 分析每个工作，使用更智能的匹配逻辑
    jobs.forEach(job => {
      const title = job.title.toLowerCase();
      const description = job.description ? job.description.toLowerCase() : '';
      const skills = job.skills ? job.skills.join(' ').toLowerCase() : '';
      
      // 为每个分类计算匹配分数
      Object.entries(categoryRules).forEach(([categoryId, categoryInfo]) => {
        let matchScore = 0;
        
        // 检查主要关键词（高权重）
        const primaryMatch = categoryInfo.primaryKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );
        if (primaryMatch) matchScore += 10;
        
        // 检查次要关键词（低权重）
        const secondaryMatches = categoryInfo.secondaryKeywords.filter(keyword => 
          title.includes(keyword) || description.includes(keyword) || skills.includes(keyword)
        ).length;
        matchScore += secondaryMatches * 2;
        
        // 检查排除关键词（负权重）
        const excludeMatch = categoryInfo.excludeKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );
        if (excludeMatch) matchScore -= 5;
        
        // 如果匹配分数足够高，则归类到此分类
        if (matchScore >= 5) {
          categoryInfo.count++;
          categoryInfo.jobs.push(job);
        }
      });
    });
    
    // 只返回有工作的分类，并按数量排序
    const validCategories = Object.entries(categoryRules)
      .filter(([_, categoryInfo]) => categoryInfo.count > 0)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 8) // 最多显示8个分类
      .map(([categoryId, categoryInfo]) => ({
        id: categoryId,
        label: `${categoryInfo.label} (${categoryInfo.count})`,
        count: categoryInfo.count
      }));
    
    console.log('生成的动态分类:', validCategories);
    
    // 输出详细的分类信息用于调试
    validCategories.forEach(category => {
      const categoryRule = categoryRules[category.id];
      console.log(`${category.label}:`, categoryRule.jobs.slice(0, 3).map(job => job.title));
    });
    
    return validCategories;
  };

  // 过滤函数：保留所有工作，不再限制为设计工作
  const filterJobs = (jobs) => {
    console.log('处理工作数据，总数:', jobs.length);
    return jobs; // 返回所有工作
  };

  // 实时数据更新监听器 - 集成RefreshService确保每次都获取最新数据
  useEffect(() => {
    console.log('🚀 初始化实时工作数据服务和刷新服务');
    
    // 启动实时数据服务
    realTimeJobService.startRealTimeUpdates();
    
    // 添加数据更新监听器
    const unsubscribeRealTime = realTimeJobService.addUpdateListener((data) => {
      console.log('📡 收到实时数据更新:', data);
      
      // 更新工作数据
      setJobs(data.jobs);
      setDataSources(data.sources);
      setLastUpdate(data.lastUpdate);
      setRealTimeStats(data.stats);
      
      // 生成动态分类
      const categories = generateDynamicCategories(data.jobs);
      setDynamicCategories(categories);
      
      // 重新应用当前的搜索和筛选
      applyFiltersToJobs(activeFilters, data.jobs, searchTerm);
    });

    // 添加刷新服务监听器
    const unsubscribeRefresh = refreshService.addRefreshListener((data) => {
      console.log('🔄 收到刷新服务更新:', data);
      
      // 更新工作数据
      setJobs(data.jobs);
      setDataSources(data.sources);
      setLastUpdate(data.timestamp);
      
      // 生成动态分类
      const categories = generateDynamicCategories(data.jobs);
      setDynamicCategories(categories);
      
      // 重新应用当前的搜索和筛选
      applyFiltersToJobs(activeFilters, data.jobs, searchTerm);
    });
    
    // 获取初始数据 - 优先使用刷新服务强制获取最新数据
    const initializeData = async () => {
      setLoading(true);
      try {
        console.log('🔄 页面加载，强制刷新获取最新数据...');
        
        // 使用刷新服务强制获取最新数据
        const refreshResult = await refreshService.autoRefreshOnPageLoad(searchTerm, { 
          category: activeFilters.length > 0 ? activeFilters[0] : '' 
        });
        
        if (refreshResult.success && refreshResult.jobs.length > 0) {
          console.log('✅ 刷新服务获取数据成功:', refreshResult.jobs.length, '个工作');
          setJobs(refreshResult.jobs);
          setDataSources(refreshResult.sources);
          setLastUpdate(new Date());
          
          const categories = generateDynamicCategories(refreshResult.jobs);
          setDynamicCategories(categories);
          
          applyFiltersToJobs(activeFilters, refreshResult.jobs, searchTerm);
        } else {
          // 如果刷新服务失败，尝试使用实时服务
          console.log('⚠️ 刷新服务失败，尝试实时服务...');
          const currentData = realTimeJobService.getCurrentJobs();
          if (currentData.jobs.length > 0) {
            console.log('✅ 使用实时服务现有数据:', currentData.jobs.length, '个工作');
            setJobs(currentData.jobs);
            setDataSources(currentData.sources);
            setLastUpdate(currentData.lastUpdate);
            setRealTimeStats(currentData.stats);
            
            const categories = generateDynamicCategories(currentData.jobs);
            setDynamicCategories(categories);
            
            applyFiltersToJobs(activeFilters, currentData.jobs, searchTerm);
          } else {
            console.log('🔄 触发实时服务首次数据更新');
            await realTimeJobService.forceUpdate();
          }
        }
      } catch (error) {
        console.error('❌ 初始化数据失败:', error);
        // 不再使用mock数据，显示空状态
        setJobs([]);
        setFilteredJobs([]);
        setDataSources(['No Data Available']);
        setDynamicCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
    
    // 清理函数
    return () => {
      console.log('🛑 清理实时数据服务和刷新服务');
      unsubscribeRealTime();
      unsubscribeRefresh();
      realTimeJobService.stopRealTimeUpdates();
    };
  }, []); // 只在组件挂载时运行一次

  const handleSearch = (term) => {
    // 更新搜索词状态
    if (term !== undefined && term !== null) {
      setSearchTerm(term);
    }
    
    // 设置搜索状态为正在搜索
    setSearching(true);
    
    // 使用setTimeout模拟搜索延迟，提供更好的用户体验
    setTimeout(() => {
      // 重新应用筛选器，包括新的搜索词
      applyFiltersToJobs(activeFilters);
      setSearching(false);
    }, 300); // 300ms的延迟，提供更流畅的搜索体验
  };

  const handleFilter = (filterIds) => {
    console.log('筛选器更新:', filterIds);
    
    // 更新活动筛选器状态
    setActiveFilters(filterIds);
    
    // 立即应用筛选到当前已加载的工作
    applyFiltersToJobs(filterIds);
  };

  // 手动刷新数据 - 使用RefreshService确保获取最新数据
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    console.log('🔄 手动刷新工作数据');
    setIsRefreshing(true);
    
    try {
      // 优先使用RefreshService强制刷新所有数据源
      const refreshResult = await refreshService.forceRefreshAllSources(searchTerm, {
        category: activeFilters.length > 0 ? activeFilters[0] : ''
      });
      
      if (refreshResult.success) {
        console.log('✅ RefreshService刷新成功:', refreshResult.jobs.length, '个工作');
        setRefreshStats(refreshResult);
        // 数据会通过监听器自动更新UI
      } else {
        console.warn('⚠️ RefreshService刷新失败，尝试RealTimeJobService...');
        
        // 如果RefreshService失败，回退到RealTimeJobService
        const result = await realTimeJobService.forceUpdate();
        if (result.success) {
          console.log('✅ RealTimeJobService刷新成功');
        } else {
          console.error('❌ 所有刷新方法都失败:', result.error);
        }
      }
    } catch (error) {
      console.error('❌ 手动刷新异常:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 格式化最后更新时间
  const formatLastUpdate = (date) => {
    if (!date) return '未知';
    
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  // 统一的工作分类匹配函数 - 与generateDynamicCategories使用相同的逻辑
  const getJobCategoryMatch = (job, categoryId) => {
    const title = job.title.toLowerCase();
    const description = job.description ? job.description.toLowerCase() : '';
    const skills = job.skills ? job.skills.join(' ').toLowerCase() : '';
    
    // 使用与generateDynamicCategories相同的分类规则
    const categoryRules = {
      'ux-designer': {
        primaryKeywords: ['ux designer', 'user experience designer', 'ux/ui designer', 'ui/ux designer'],
        secondaryKeywords: ['ux', 'user experience', 'interaction design', 'usability', 'user research'],
        excludeKeywords: ['ux writer', 'ux content']
      },
      'ui-designer': {
        primaryKeywords: ['ui designer', 'user interface designer', 'interface designer'],
        secondaryKeywords: ['ui', 'user interface', 'visual design', 'interface design'],
        excludeKeywords: ['ui developer', 'ui engineer']
      },
      'product-designer': {
        primaryKeywords: ['product designer', 'digital product designer'],
        secondaryKeywords: ['product design', 'design lead', 'senior designer'],
        excludeKeywords: ['product manager', 'product owner']
      },
      'frontend-developer': {
        primaryKeywords: ['frontend developer', 'front-end developer', 'front end developer', 'react developer', 'vue developer', 'angular developer'],
        secondaryKeywords: ['frontend', 'front-end', 'javascript', 'react', 'vue', 'angular', 'html', 'css'],
        excludeKeywords: []
      },
      'backend-developer': {
        primaryKeywords: ['backend developer', 'back-end developer', 'server developer', 'api developer'],
        secondaryKeywords: ['backend', 'back-end', 'server', 'api', 'node.js', 'python', 'java', 'php', 'ruby'],
        excludeKeywords: []
      },
      'fullstack-developer': {
        primaryKeywords: ['full stack developer', 'fullstack developer', 'full-stack developer'],
        secondaryKeywords: ['full stack', 'fullstack', 'full-stack'],
        excludeKeywords: []
      },
      'data-scientist': {
        primaryKeywords: ['data scientist', 'machine learning engineer', 'ai engineer'],
        secondaryKeywords: ['data science', 'machine learning', 'artificial intelligence', 'analytics', 'big data'],
        excludeKeywords: []
      },
      'devops-engineer': {
        primaryKeywords: ['devops engineer', 'site reliability engineer', 'sre', 'cloud engineer'],
        secondaryKeywords: ['devops', 'infrastructure', 'cloud', 'aws', 'azure', 'kubernetes', 'docker'],
        excludeKeywords: []
      },
      'mobile-developer': {
        primaryKeywords: ['mobile developer', 'ios developer', 'android developer', 'react native developer'],
        secondaryKeywords: ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
        excludeKeywords: []
      },
      'graphic-designer': {
        primaryKeywords: ['graphic designer', 'visual designer', 'brand designer'],
        secondaryKeywords: ['graphic design', 'visual design', 'brand design', 'creative design'],
        excludeKeywords: []
      },
      'marketing-specialist': {
        primaryKeywords: ['marketing specialist', 'digital marketing', 'marketing manager', 'growth marketer'],
        secondaryKeywords: ['marketing', 'content marketing', 'social media', 'seo', 'sem', 'growth'],
        excludeKeywords: []
      },
      'project-manager': {
        primaryKeywords: ['project manager', 'program manager', 'scrum master', 'product manager'],
        secondaryKeywords: ['project management', 'agile', 'scrum', 'product management'],
        excludeKeywords: []
      }
    };
    
    const categoryInfo = categoryRules[categoryId];
    if (!categoryInfo) return false;
    
    let matchScore = 0;
    
    // 检查主要关键词（高权重）
    const primaryMatch = categoryInfo.primaryKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    if (primaryMatch) matchScore += 10;
    
    // 检查次要关键词（低权重）
    const secondaryMatches = categoryInfo.secondaryKeywords.filter(keyword => 
      title.includes(keyword) || description.includes(keyword) || skills.includes(keyword)
    ).length;
    matchScore += secondaryMatches * 2;
    
    // 检查排除关键词（负权重）
    const excludeMatch = categoryInfo.excludeKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    if (excludeMatch) matchScore -= 5;
    
    // 返回是否匹配（使用与generateDynamicCategories相同的阈值）
    return matchScore >= 5;
  };

  // 增强的搜索相关性评分函数
  const calculateSearchRelevance = (job, searchTerm) => {
    if (!searchTerm) return 0;
    
    const term = searchTerm.toLowerCase();
    const title = job.title.toLowerCase();
    const company = job.company.toLowerCase();
    const location = job.location.toLowerCase();
    const description = job.description ? job.description.toLowerCase() : '';
    const skills = job.skills ? job.skills.join(' ').toLowerCase() : '';
    
    let score = 0;
    
    // 标题匹配（最高权重）
    if (title.includes(term)) {
      if (title.startsWith(term)) score += 100; // 标题开头匹配
      else if (title.split(' ').some(word => word.startsWith(term))) score += 80; // 单词开头匹配
      else score += 60; // 标题包含
    }
    
    // 公司名称匹配（高权重）
    if (company.includes(term)) {
      if (company.startsWith(term)) score += 50;
      else score += 30;
    }
    
    // 技能匹配（中等权重）
    if (skills.includes(term)) {
      const skillWords = skills.split(' ');
      if (skillWords.some(skill => skill === term)) score += 40; // 精确技能匹配
      else score += 20; // 技能包含
    }
    
    // 描述匹配（较低权重）
    if (description.includes(term)) {
      const termCount = (description.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(termCount * 5, 25); // 最多25分，避免描述过度影响
    }
    
    // 位置匹配（较低权重）
    if (location.includes(term)) {
      score += 15;
    }
    
    // 多词搜索的额外评分
    const searchWords = term.split(' ').filter(word => word.length > 2);
    if (searchWords.length > 1) {
      const matchedWords = searchWords.filter(word => 
        title.includes(word) || company.includes(word) || skills.includes(word)
      );
      score += matchedWords.length * 10; // 每个匹配的词额外10分
    }
    
    return score;
  };

  // 应用筛选器到工作列表 - 使用统一的匹配逻辑和相关性排序
  const applyFiltersToJobs = (filterIds, jobsData = jobs, searchTermData = searchTerm) => {
    let results = [...jobsData];
    
    // 首先按搜索词过滤并计算相关性
    if (searchTermData) {
      results = results
        .map(job => ({
          ...job,
          relevanceScore: calculateSearchRelevance(job, searchTermData)
        }))
        .filter(job => job.relevanceScore > 0) // 只保留有相关性的工作
        .sort((a, b) => b.relevanceScore - a.relevanceScore); // 按相关性排序
      
      console.log(`搜索 "${searchTermData}" 找到 ${results.length} 个相关工作`);
      console.log('前5个最相关的工作:', results.slice(0, 5).map(job => ({
        title: job.title,
        company: job.company,
        score: job.relevanceScore
      })));
    }
    
    // 然后按职位类型筛选 - 使用与分类生成相同的智能匹配逻辑
    if (filterIds && filterIds.length > 0) {
      results = results.filter(job => {
        // 检查工作是否匹配任一激活的筛选器
        return filterIds.some(filterId => getJobCategoryMatch(job, filterId));
      });
    }
    
    console.log(`筛选结果: ${results.length} 个工作 (原始: ${jobs.length}, 筛选器: ${filterIds})`);
    
    // 输出调试信息，显示每个筛选器匹配到的工作
    if (filterIds && filterIds.length > 0) {
      filterIds.forEach(filterId => {
        const matchedJobs = results.filter(job => getJobCategoryMatch(job, filterId));
        console.log(`筛选器 ${filterId} 匹配到 ${matchedJobs.length} 个工作:`, 
          matchedJobs.slice(0, 3).map(job => job.title));
      });
    }
    
    setFilteredJobs(results);
  };
  


  // 处理工作卡片点击
  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setIsDrawerOpen(true);
  };
  
  // 处理关闭抽屉
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };
  
  // 处理申请工作
  const handleApplyJob = (jobId) => {
    console.log(`Applying for job: ${jobId}`);
    
    // 直接使用selectedJob，而不是从jobs数组中查找
    const job = selectedJob;
    
    if (!job) {
      console.error('No selected job found');
      alert('无法找到选中的工作');
      return;
    }
    
    // 详细记录工作对象，帮助调试
    console.log('Selected job details:', {
      id: job.id,
      title: job.title,
      company: job.company,
      source: job.source,
      sourceUrl: job.sourceUrl,
      sourceId: job.sourceId
    });
    
    // 创建一个隐藏的a标签来打开链接，这样可以避免弹出窗口被阻止
    const openLink = (url) => {
      console.log(`Attempting to open URL: ${url}`);
      
      // 创建一个隐藏的a标签
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // 添加到文档中并触发点击
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    };
    
    let finalUrl = '';
    
    if (job.sourceUrl) {
      // 如果有源URL，使用它
      console.log(`Using source URL: ${job.sourceUrl}`);
      finalUrl = job.sourceUrl;
    } else if (job.source) {
      // 如果没有源URL但有来源信息，尝试构建URL
      switch (job.source) {
        case 'LinkedIn':
          finalUrl = `https://www.linkedin.com/jobs/view/${job.sourceId || job.id}`;
          break;
        case 'WeWorkRemotely':
          // 尝试使用更可能正确的WeWorkRemotely URL格式
          if (job.company && job.title) {
            // 将公司名和职位名转换为URL友好的格式
            const companySlug = job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const titleSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            finalUrl = `https://weworkremotely.com/remote-jobs/${companySlug}-${titleSlug}`;
          } else {
            finalUrl = `https://weworkremotely.com/remote-jobs/${job.sourceId || job.id}`;
          }
          break;
        case 'RemoteOK':
          finalUrl = `https://remoteok.io/l/${job.sourceId || job.id}`;
          break;
        default:
          // 如果无法确定来源，尝试使用通用搜索
          finalUrl = `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} job`)}`;
      }
      console.log(`Constructed URL: ${finalUrl}`);
    } else {
      // 如果没有任何链接信息，显示提示并使用Google搜索
      console.error('No source URL or source information found for job:', job);
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} job`)}`;
      alert('无法找到精确的工作链接，将使用Google搜索');
    }
    
    // 尝试打开链接
    if (finalUrl) {
      openLink(finalUrl);
    } else {
      alert('无法生成有效的工作链接');
    }
  };

  return (
    <div className={`job-feed ${isDrawerOpen ? 'drawer-open' : ''}`}>
      <Header 
        onSearch={(term) => handleSearch(term)} 
        onFilter={handleFilter}
        onRefresh={handleRefresh}
        dynamicCategories={dynamicCategories}
        isRefreshing={isRefreshing}
      />
      
      <div className="job-list-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : searching ? (
          <div className="searching-container">
            <div className="loading-spinner small"></div>
            <p>Searching...</p>
          </div>
        ) : (
          <>
            {filteredJobs.length > 0 ? (
              <>
                <div className="results-header">
                  <div className="results-main-info">
                    <span className="results-count">
                      找到 <span className="count-highlight">{filteredJobs.length}</span> 个工作机会
                    </span>
                    <span className="last-update-inline">
                      最后更新: {formatLastUpdate(lastUpdate)}
                    </span>
                    {realTimeStats && realTimeStats.newJobs > 0 && (
                      <span className="new-jobs-inline">
                        🆕 {realTimeStats.newJobs} 个新工作
                      </span>
                    )}
                    {realTimeStats && (
                      <span className="total-updates-inline">
                        已更新 {realTimeStats.successfulUpdates} 次
                      </span>
                    )}
                    <button 
                      className={`refresh-btn-inline ${isRefreshing ? 'refreshing' : ''}`}
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      title="刷新工作数据"
                    >
                      {isRefreshing ? '🔄' : '↻'}
                    </button>
                  </div>
                  <div className="data-sources">
                    数据来源: {dataSources.join(', ')}
                  </div>
                </div>
                <div className="job-list">
                  {filteredJobs.map((job, index) => {
                    if (filteredJobs.length === index + 1) {
                      return (
                        <div ref={lastJobElementRef} key={job.id}>
                          <JobCard 
                            job={job} 
                            onSelect={() => handleJobSelect(job)}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <JobCard 
                          key={job.id} 
                          job={job} 
                          onSelect={() => handleJobSelect(job)}
                        />
                      );
                    }
                  })}
                  {loadingMore && (
                    <div className="loading-more">
                      <div className="loading-spinner small"></div>
                      <p>加载更多工作...</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-jobs-found">
                <h3>No jobs found</h3>
                <p>Try adjusting your search filters</p>
              </div>
            )}
          </>
        )}
      </div>
      
      <JobDetailsDrawer 
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onApply={handleApplyJob}
      />
    </div>
  );
};

export default JobFeed;