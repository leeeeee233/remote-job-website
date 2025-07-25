// HTTP请求工具函数
// 提供增强的HTTP请求功能，支持重试、超时和错误处理

/**
 * 发送HTTP请求，支持重试和超时
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {Object} retryOptions - 重试选项
 * @returns {Promise<Object>} - 响应数据
 */
export const fetchWithRetry = async (url, options = {}, retryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000,
    retryCondition = null
  } = retryOptions;

  // 添加超时信号
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const fetchOptions = {
    ...options,
    signal: controller.signal
  };

  let retryCount = 0;
  
  while (true) {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // 检查是否需要重试
      if (!response.ok && retryCount < maxRetries) {
        const shouldRetry = retryCondition 
          ? retryCondition(response)
          : response.status >= 500; // 默认重试服务器错误
          
        if (shouldRetry) {
          retryCount++;
          const delay = retryDelay * Math.pow(2, retryCount - 1);
          console.log(`Retrying request to ${url} in ${delay}ms (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      // 尝试解析JSON响应
      try {
        return await response.json();
      } catch (e) {
        // 如果不是JSON，返回文本
        return await response.text();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      // 处理超时错误
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      // 处理其他错误
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = retryDelay * Math.pow(2, retryCount - 1);
        console.log(`Retrying request to ${url} in ${delay}ms (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

/**
 * 使用CORS代理发送请求
 * @param {string} url - 原始URL
 * @param {Object} options - 请求选项
 * @param {Object} retryOptions - 重试选项
 * @returns {Promise<Object>} - 响应数据
 */
export const fetchWithCorsProxy = async (url, options = {}, retryOptions = {}) => {
  const corsProxy = 'https://cors-anywhere.herokuapp.com/';
  const proxyUrl = `${corsProxy}${url}`;
  
  const proxyOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Origin': window.location.origin
    }
  };
  
  return fetchWithRetry(proxyUrl, proxyOptions, retryOptions);
};

/**
 * 解析RSS feed为JSON
 * @param {string} rssUrl - RSS feed URL
 * @param {string} apiKey - RSS2JSON API密钥
 * @returns {Promise<Object>} - 解析后的JSON数据
 */
export const parseRssFeed = async (rssUrl, apiKey = '') => {
  const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  
  const options = {};
  if (apiKey) {
    options.headers = {
      'Authorization': `ApiKey ${apiKey}`
    };
  }
  
  const response = await fetchWithRetry(rss2jsonUrl, options);
  
  if (response.status !== 'ok') {
    throw new Error(`Failed to parse RSS feed: ${response.message || 'Unknown error'}`);
  }
  
  return response;
};

/**
 * 创建查询字符串
 * @param {Object} params - 查询参数
 * @returns {string} - 查询字符串
 */
export const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    
  return queryParams ? `?${queryParams}` : '';
};

export default {
  fetchWithRetry,
  fetchWithCorsProxy,
  parseRssFeed,
  buildQueryString
};