// 生产环境配置
export const productionConfig = {
  // 数据源配置
  dataSources: {
    // 启用真实数据源
    jobspresso: {
      enabled: true,
      priority: 1,
      url: 'https://jobspresso.co/remote-work/',
      scraping: true,
      fallbackData: true
    },
    remoteOK: {
      enabled: true,
      priority: 2,
      url: 'https://remoteok.io/api',
      scraping: false,
      fallbackData: true
    },
    weWorkRemotely: {
      enabled: true,
      priority: 3,
      url: 'https://weworkremotely.com',
      scraping: true,
      fallbackData: true
    },
    linkedIn: {
      enabled: false, // 需要API密钥
      priority: 4,
      url: 'https://api.linkedin.com/v2/jobs',
      scraping: false,
      fallbackData: false
    }
  },

  // 缓存配置
  cache: {
    enabled: true,
    memoryTTL: 5 * 60 * 1000, // 5分钟
    storageTTL: 60 * 60 * 1000, // 1小时
    maxSize: 1000 // 最大缓存条目数
  },

  // 实时更新配置
  realTimeUpdates: {
    enabled: true,
    interval: 10 * 60 * 1000, // 10分钟更新一次
    maxRetries: 3,
    retryDelay: 30 * 1000 // 30秒重试延迟
  },

  // 搜索配置
  search: {
    debounceDelay: 300, // 300ms防抖
    minSearchLength: 2,
    maxResults: 100,
    enableFuzzySearch: true
  },

  // 去重配置
  deduplication: {
    enabled: true,
    similarityThreshold: 0.85, // 85%相似度阈值
    fields: ['title', 'company', 'location'],
    algorithm: 'levenshtein'
  },

  // API配置
  api: {
    timeout: 10000, // 10秒超时
    retries: 2,
    corsProxy: 'https://api.allorigins.win/get?url=',
    userAgent: 'RemoteJobWebsite/1.0'
  },

  // 功能开关
  features: {
    mockData: false, // 生产环境禁用mock数据
    realTimeUpdates: true,
    jobDetailsDrawer: true,
    bookmarks: true,
    filters: true,
    sorting: true,
    pagination: true,
    analytics: true
  },

  // 错误处理
  errorHandling: {
    showErrorDetails: false, // 生产环境隐藏错误详情
    fallbackToCache: true,
    fallbackToMockData: false, // 生产环境不使用mock数据
    retryFailedRequests: true
  },

  // 性能配置
  performance: {
    lazyLoading: true,
    imageOptimization: true,
    bundleSplitting: true,
    compressionEnabled: true
  },

  // 监控配置
  monitoring: {
    enabled: true,
    trackUserInteractions: true,
    trackPerformance: true,
    trackErrors: true,
    anonymizeData: true
  }
};

// 开发环境配置
export const developmentConfig = {
  ...productionConfig,
  
  // 开发环境特定配置
  dataSources: {
    ...productionConfig.dataSources,
    // 开发环境可以启用mock数据作为备选
    mockData: {
      enabled: true,
      priority: 99, // 最低优先级
      fallbackOnly: true
    }
  },

  realTimeUpdates: {
    ...productionConfig.realTimeUpdates,
    interval: 30 * 1000 // 开发环境30秒更新一次
  },

  errorHandling: {
    ...productionConfig.errorHandling,
    showErrorDetails: true, // 开发环境显示错误详情
    fallbackToMockData: true // 开发环境可以使用mock数据
  },

  features: {
    ...productionConfig.features,
    mockData: true // 开发环境启用mock数据
  }
};

// 根据环境选择配置
const isProduction = process.env.NODE_ENV === 'production';
export const config = isProduction ? productionConfig : developmentConfig;

export default config;