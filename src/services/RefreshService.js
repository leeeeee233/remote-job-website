// 实时刷新服务 - 确保每次刷新都获取最新数据
import { searchRemoteJobs, fetchJobspressoJobs, fetchWeWorkRemotelyJobs } from './jobService';
import { fetchRemoteOKJobs } from './realJobAPI';
import { config } from '../config/production';

class RefreshService {
  constructor() {
    this.isRefreshing = false;
    this.lastRefresh = null;
    this.refreshListeners = new Set();
    this.cacheBypass = true; // 强制绕过缓存
    this.refreshStats = {
      totalRefreshes: 0,
      successfulRefreshes: 0,
      failedRefreshes: 0,
      averageRefreshTime: 0
    };
  }

  // 强制刷新所有数据源
  async forceRefreshAllSources(searchTerm = '', filters = {}) {
    if (this.isRefreshing) {
      console.log('🔄 刷新正在进行中，请稍候...');
      return { success: false, message: '刷新正在进行中' };
    }

    this.isRefreshing = true;
    const startTime = Date.now();
    this.refreshStats.totalRefreshes++;

    try {
      console.log('🚀 开始强制刷新所有数据源...');
      
      // 清除所有缓存，确保获取最新数据
      await this.clearAllCaches();
      
      // 并行调用所有数据源，每个都带上时间戳防止缓存
      const timestamp = Date.now();
      const refreshPromises = [
        this.refreshJobspresso(searchTerm, filters, timestamp),
        this.refreshRemoteOK(timestamp),
        this.refreshWeWorkRemotely(searchTerm, filters, timestamp)
      ];

      console.log('📡 并行请求所有数据源...');
      const results = await Promise.allSettled(refreshPromises);
      
      // 处理结果
      let allJobs = [];
      let successfulSources = [];
      let failedSources = [];
      
      results.forEach((result, index) => {
        const sourceNames = ['Jobspresso', 'RemoteOK', 'WeWorkRemotely'];
        const sourceName = sourceNames[index];
        
        if (result.status === 'fulfilled' && result.value.success) {
          allJobs = [...allJobs, ...result.value.jobs];
          successfulSources.push(sourceName);
          console.log(`✅ ${sourceName}: ${result.value.jobs.length} 个最新工作`);
        } else {
          failedSources.push(sourceName);
          console.warn(`❌ ${sourceName} 刷新失败:`, result.reason?.message || result.value?.error);
        }
      });

      // 去重和排序
      const uniqueJobs = this.deduplicateJobs(allJobs);
      const sortedJobs = this.sortJobsByFreshness(uniqueJobs);
      
      // 添加刷新时间戳
      const jobsWithRefreshInfo = sortedJobs.map(job => ({
        ...job,
        refreshedAt: new Date().toISOString(),
        isFresh: true,
        refreshId: timestamp
      }));

      const refreshTime = Date.now() - startTime;
      this.refreshStats.successfulRefreshes++;
      this.refreshStats.averageRefreshTime = 
        (this.refreshStats.averageRefreshTime + refreshTime) / 2;
      
      this.lastRefresh = new Date();

      console.log(`🎉 刷新完成! 获取到 ${jobsWithRefreshInfo.length} 个最新工作`);
      console.log(`📊 成功源: ${successfulSources.join(', ')}`);
      console.log(`⏱️ 刷新耗时: ${refreshTime}ms`);

      // 通知所有监听器
      this.notifyRefreshListeners({
        jobs: jobsWithRefreshInfo,
        sources: successfulSources,
        failedSources,
        refreshTime,
        timestamp: this.lastRefresh
      });

      return {
        success: true,
        jobs: jobsWithRefreshInfo,
        sources: successfulSources,
        failedSources,
        refreshTime,
        total: jobsWithRefreshInfo.length
      };

    } catch (error) {
      console.error('❌ 强制刷新失败:', error);
      this.refreshStats.failedRefreshes++;
      
      return {
        success: false,
        error: error.message,
        jobs: [],
        sources: []
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  // 刷新Jobspresso数据
  async refreshJobspresso(searchTerm, filters, timestamp) {
    try {
      console.log('🔍 刷新Jobspresso数据...');
      
      // 添加时间戳参数防止缓存
      const jobs = await fetchJobspressoJobs(searchTerm, filters.category);
      
      return {
        success: true,
        jobs: jobs.map(job => ({
          ...job,
          source: 'Jobspresso',
          fetchedAt: new Date().toISOString(),
          refreshTimestamp: timestamp
        })),
        source: 'Jobspresso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        jobs: [],
        source: 'Jobspresso'
      };
    }
  }

  // 刷新RemoteOK数据
  async refreshRemoteOK(timestamp) {
    try {
      console.log('🔍 刷新RemoteOK数据...');
      
      const jobs = await fetchRemoteOKJobs();
      
      return {
        success: true,
        jobs: jobs.map(job => ({
          ...job,
          source: 'RemoteOK',
          fetchedAt: new Date().toISOString(),
          refreshTimestamp: timestamp
        })),
        source: 'RemoteOK'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        jobs: [],
        source: 'RemoteOK'
      };
    }
  }

  // 刷新WeWorkRemotely数据
  async refreshWeWorkRemotely(searchTerm, filters, timestamp) {
    try {
      console.log('🔍 刷新WeWorkRemotely数据...');
      
      const jobs = await fetchWeWorkRemotelyJobs(searchTerm, filters.category);
      
      return {
        success: true,
        jobs: jobs.map(job => ({
          ...job,
          source: 'WeWorkRemotely',
          fetchedAt: new Date().toISOString(),
          refreshTimestamp: timestamp
        })),
        source: 'WeWorkRemotely'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        jobs: [],
        source: 'WeWorkRemotely'
      };
    }
  }

  // 清除所有缓存
  async clearAllCaches() {
    try {
      console.log('🗑️ 清除所有缓存...');
      
      // 清除浏览器缓存
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 清除localStorage中的缓存
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('job') || key.includes('cache'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 清除sessionStorage中的缓存
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('job') || key.includes('cache'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('✅ 缓存清除完成');
    } catch (error) {
      console.warn('⚠️ 缓存清除失败:', error);
    }
  }

  // 去重处理
  deduplicateJobs(jobs) {
    const seen = new Map();
    const uniqueJobs = [];

    for (const job of jobs) {
      const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        uniqueJobs.push(job);
      }
    }

    return uniqueJobs;
  }

  // 按新鲜度排序
  sortJobsByFreshness(jobs) {
    return jobs.sort((a, b) => {
      // 优先显示今天发布的工作
      if (a.postedDate === 'Today' && b.postedDate !== 'Today') return -1;
      if (a.postedDate !== 'Today' && b.postedDate === 'Today') return 1;
      
      // 按数据源优先级排序 (Jobspresso > RemoteOK > WeWorkRemotely)
      const sourcePriority = { 'Jobspresso': 1, 'RemoteOK': 2, 'WeWorkRemotely': 3 };
      const priorityA = sourcePriority[a.source] || 999;
      const priorityB = sourcePriority[b.source] || 999;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // 按获取时间排序（最新的在前）
      const timeA = new Date(a.fetchedAt || 0).getTime();
      const timeB = new Date(b.fetchedAt || 0).getTime();
      
      return timeB - timeA;
    });
  }

  // 添加刷新监听器
  addRefreshListener(callback) {
    this.refreshListeners.add(callback);
    return () => this.refreshListeners.delete(callback);
  }

  // 通知刷新监听器
  notifyRefreshListeners(data) {
    this.refreshListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('刷新监听器错误:', error);
      }
    });
  }

  // 获取刷新状态
  getRefreshStatus() {
    return {
      isRefreshing: this.isRefreshing,
      lastRefresh: this.lastRefresh,
      stats: this.refreshStats
    };
  }

  // 检查是否需要刷新
  shouldRefresh() {
    if (!this.lastRefresh) return true;
    
    const timeSinceLastRefresh = Date.now() - this.lastRefresh.getTime();
    const refreshThreshold = 30 * 1000; // 30秒
    
    return timeSinceLastRefresh > refreshThreshold;
  }

  // 页面加载时的自动刷新
  async autoRefreshOnPageLoad(searchTerm = '', filters = {}) {
    console.log('🔄 页面加载，自动刷新数据...');
    return await this.forceRefreshAllSources(searchTerm, filters);
  }
}

// 创建全局实例
const refreshService = new RefreshService();

export default refreshService;