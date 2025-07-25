// 缓存服务
// 提供内存缓存和本地存储缓存功能

class CacheService {
  constructor(options = {}) {
    this.options = {
      memoryTTL: 5 * 60 * 1000, // 内存缓存默认5分钟
      storageTTL: 60 * 60 * 1000, // 本地存储缓存默认1小时
      prefix: 'job_api_cache_',
      ...options
    };
    
    // 内存缓存
    this.memoryCache = new Map();
    
    // 缓存统计
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      storageHits: 0
    };
  }

  /**
   * 生成缓存键
   * @param {string} key - 原始键
   * @returns {string} - 带前缀的缓存键
   */
  getCacheKey(key) {
    return `${this.options.prefix}${key}`;
  }

  /**
   * 从缓存中获取数据
   * @param {string} key - 缓存键
   * @returns {Promise<any>} - 缓存数据，如果不存在则返回null
   */
  async get(key) {
    const cacheKey = this.getCacheKey(key);
    
    // 首先检查内存缓存
    if (this.memoryCache.has(cacheKey)) {
      const cacheItem = this.memoryCache.get(cacheKey);
      
      // 检查是否过期
      if (cacheItem.expiry > Date.now()) {
        this.stats.hits++;
        this.stats.memoryHits++;
        return cacheItem.value;
      } else {
        // 过期则删除
        this.memoryCache.delete(cacheKey);
      }
    }
    
    // 然后检查本地存储
    try {
      const storageItem = localStorage.getItem(cacheKey);
      
      if (storageItem) {
        const cacheItem = JSON.parse(storageItem);
        
        // 检查是否过期
        if (cacheItem.expiry > Date.now()) {
          // 同时更新内存缓存
          this.memoryCache.set(cacheKey, cacheItem);
          
          this.stats.hits++;
          this.stats.storageHits++;
          return cacheItem.value;
        } else {
          // 过期则删除
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    // 缓存未命中
    this.stats.misses++;
    return null;
  }

  /**
   * 将数据存入缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存数据
   * @param {number} ttl - 过期时间（毫秒），如果不指定则使用默认值
   * @returns {Promise<void>}
   */
  async set(key, value, ttl) {
    const cacheKey = this.getCacheKey(key);
    const memoryTTL = ttl || this.options.memoryTTL;
    const storageTTL = ttl || this.options.storageTTL;
    
    const now = Date.now();
    
    // 设置内存缓存
    const memoryCacheItem = {
      value,
      expiry: now + memoryTTL,
      created: now
    };
    
    this.memoryCache.set(cacheKey, memoryCacheItem);
    
    // 设置本地存储缓存
    try {
      const storageCacheItem = {
        value,
        expiry: now + storageTTL,
        created: now
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(storageCacheItem));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  /**
   * 使缓存项失效
   * @param {string} key - 缓存键
   * @returns {Promise<void>}
   */
  async invalidate(key) {
    const cacheKey = this.getCacheKey(key);
    
    // 删除内存缓存
    this.memoryCache.delete(cacheKey);
    
    // 删除本地存储缓存
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }

  /**
   * 清除所有缓存
   * @returns {Promise<void>}
   */
  async clear() {
    // 清除内存缓存
    this.memoryCache.clear();
    
    // 清除本地存储缓存
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.options.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // 重置统计
    this.resetStats();
  }

  /**
   * 重置缓存统计
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      storageHits: 0
    };
  }

  /**
   * 获取缓存统计
   * @returns {Object} - 缓存统计
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: hitRate.toFixed(2) + '%',
      memoryItems: this.memoryCache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * 估算内存缓存使用量
   * @returns {string} - 格式化的内存使用量
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    this.memoryCache.forEach((value, key) => {
      // 估算键的大小
      totalSize += key.length * 2; // 每个字符约2字节
      
      // 估算值的大小
      try {
        const jsonSize = JSON.stringify(value).length * 2;
        totalSize += jsonSize;
      } catch (e) {
        // 如果无法序列化，使用粗略估计
        totalSize += 1024; // 假设1KB
      }
    });
    
    // 格式化大小
    if (totalSize < 1024) {
      return `${totalSize} B`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(2)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  /**
   * 生成基于搜索参数的缓存键
   * @param {string} baseKey - 基础键
   * @param {Object} params - 搜索参数
   * @returns {string} - 缓存键
   */
  static generateKey(baseKey, params = {}) {
    if (!params || Object.keys(params).length === 0) {
      return baseKey;
    }
    
    // 对参数进行排序，确保相同参数生成相同的键
    const sortedParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return sortedParams ? `${baseKey}?${sortedParams}` : baseKey;
  }
}

export default CacheService;