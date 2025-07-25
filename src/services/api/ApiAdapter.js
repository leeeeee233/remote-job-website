// API适配器基类
// 提供通用的API请求方法和错误处理

class ApiAdapter {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      ...options
    };
  }

  /**
   * 发送HTTP请求，支持重试和超时
   * @param {string} endpoint - API端点
   * @param {Object} options - 请求选项
   * @param {number} retryCount - 当前重试次数
   * @returns {Promise<Object>} - 响应数据
   */
  async request(endpoint, options = {}, retryCount = 0) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const fetchOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.options.timeout)
    };

    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      // 处理超时和网络错误
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${url}`);
      } else {
        console.error(`Request error for ${url}:`, error);
      }
      
      // 实现重试逻辑
      if (retryCount < this.options.maxRetries) {
        const delay = this.options.retryDelay * Math.pow(2, retryCount);
        console.log(`Retrying request to ${url} in ${delay}ms (${retryCount + 1}/${this.options.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * 处理API错误
   * @param {Error} error - 错误对象
   * @param {string} source - 错误来源
   * @returns {Object} - 标准化的错误对象
   */
  handleError(error, source) {
    const errorInfo = {
      message: error.message || 'Unknown error occurred',
      source: source,
      timestamp: new Date().toISOString(),
      isRetryable: this.isRetryableError(error)
    };
    
    console.error(`API Error [${source}]:`, errorInfo);
    
    return errorInfo;
  }

  /**
   * 判断错误是否可重试
   * @param {Error} error - 错误对象
   * @returns {boolean} - 是否可重试
   */
  isRetryableError(error) {
    // 网络错误、超时和服务器错误通常是可重试的
    if (error.name === 'AbortError') return true;
    if (error.message && error.message.includes('network')) return true;
    
    // 检查HTTP状态码
    if (error.status) {
      // 5xx错误通常是服务器问题，可以重试
      return error.status >= 500 && error.status < 600;
    }
    
    return false;
  }

  /**
   * 将API特定的工作数据转换为统一格式
   * 子类需要实现此方法
   * @param {Object} apiJob - API返回的工作数据
   * @returns {Object} - 统一格式的工作数据
   */
  transformJob(apiJob) {
    throw new Error('transformJob method must be implemented by subclass');
  }

  /**
   * 将API特定的工作详情转换为统一格式
   * 子类需要实现此方法
   * @param {Object} apiJobDetail - API返回的工作详情
   * @returns {Object} - 统一格式的工作详情
   */
  transformJobDetail(apiJobDetail) {
    throw new Error('transformJobDetail method must be implemented by subclass');
  }
}

export default ApiAdapter;