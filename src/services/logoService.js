// 公司Logo服务
// 提供多种方式获取公司logo，确保显示正确的公司标识

class LogoService {
  constructor() {
    // 多个logo服务提供商，按优先级排序
    this.logoProviders = [
      'clearbit',
      'brandfetch',
      'logo-dev',
      'favicon'
    ];
    
    // 缓存已获取的logo URL，避免重复请求
    this.logoCache = new Map();
    
    // 知名公司的logo映射，确保准确性
    this.knownCompanyLogos = {
      'google': 'https://logo.clearbit.com/google.com',
      'microsoft': 'https://logo.clearbit.com/microsoft.com',
      'apple': 'https://logo.clearbit.com/apple.com',
      'amazon': 'https://logo.clearbit.com/amazon.com',
      'facebook': 'https://logo.clearbit.com/facebook.com',
      'meta': 'https://logo.clearbit.com/meta.com',
      'netflix': 'https://logo.clearbit.com/netflix.com',
      'spotify': 'https://logo.clearbit.com/spotify.com',
      'airbnb': 'https://logo.clearbit.com/airbnb.com',
      'uber': 'https://logo.clearbit.com/uber.com',
      'linkedin': 'https://logo.clearbit.com/linkedin.com',
      'twitter': 'https://logo.clearbit.com/twitter.com',
      'slack': 'https://logo.clearbit.com/slack.com',
      'dropbox': 'https://logo.clearbit.com/dropbox.com',
      'github': 'https://logo.clearbit.com/github.com',
      'gitlab': 'https://logo.clearbit.com/gitlab.com',
      'atlassian': 'https://logo.clearbit.com/atlassian.com',
      'shopify': 'https://logo.clearbit.com/shopify.com',
      'stripe': 'https://logo.clearbit.com/stripe.com',
      'figma': 'https://logo.clearbit.com/figma.com',
      'adobe': 'https://logo.clearbit.com/adobe.com',
      'salesforce': 'https://logo.clearbit.com/salesforce.com',
      'oracle': 'https://logo.clearbit.com/oracle.com',
      'ibm': 'https://logo.clearbit.com/ibm.com',
      'intel': 'https://logo.clearbit.com/intel.com',
      'nvidia': 'https://logo.clearbit.com/nvidia.com',
      'tesla': 'https://logo.clearbit.com/tesla.com',
      'zoom': 'https://logo.clearbit.com/zoom.us',
      'discord': 'https://logo.clearbit.com/discord.com',
      'notion': 'https://logo.clearbit.com/notion.so',
      'airtable': 'https://logo.clearbit.com/airtable.com',
      'asana': 'https://logo.clearbit.com/asana.com',
      'trello': 'https://logo.clearbit.com/trello.com',
      'monday': 'https://logo.clearbit.com/monday.com',
      'canva': 'https://logo.clearbit.com/canva.com',
      'miro': 'https://logo.clearbit.com/miro.com',
      'invision': 'https://logo.clearbit.com/invisionapp.com',
      'sketch': 'https://logo.clearbit.com/sketch.com',
      'framer': 'https://logo.clearbit.com/framer.com'
    };
  }

  /**
   * 获取公司logo URL
   * @param {string} companyName - 公司名称
   * @param {string} existingLogoUrl - 已有的logo URL（如果有）
   * @returns {Promise<string>} - logo URL
   */
  async getCompanyLogo(companyName, existingLogoUrl = null) {
    if (!companyName) {
      return this.getDefaultLogo();
    }

    // 如果已有logo URL且有效，直接使用
    if (existingLogoUrl && await this.isValidImageUrl(existingLogoUrl)) {
      return existingLogoUrl;
    }

    // 检查缓存
    const cacheKey = companyName.toLowerCase().trim();
    if (this.logoCache.has(cacheKey)) {
      return this.logoCache.get(cacheKey);
    }

    // 检查知名公司映射
    const knownLogo = this.getKnownCompanyLogo(companyName);
    if (knownLogo) {
      this.logoCache.set(cacheKey, knownLogo);
      return knownLogo;
    }

    // 尝试从多个提供商获取logo
    const logoUrl = await this.fetchLogoFromProviders(companyName);
    
    // 缓存结果
    this.logoCache.set(cacheKey, logoUrl);
    
    return logoUrl;
  }

  /**
   * 从知名公司映射中获取logo
   * @param {string} companyName - 公司名称
   * @returns {string|null} - logo URL或null
   */
  getKnownCompanyLogo(companyName) {
    const normalizedName = companyName.toLowerCase().trim();
    
    // 直接匹配
    if (this.knownCompanyLogos[normalizedName]) {
      return this.knownCompanyLogos[normalizedName];
    }
    
    // 模糊匹配
    for (const [key, logoUrl] of Object.entries(this.knownCompanyLogos)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return logoUrl;
      }
    }
    
    return null;
  }

  /**
   * 从多个提供商获取logo
   * @param {string} companyName - 公司名称
   * @returns {Promise<string>} - logo URL
   */
  async fetchLogoFromProviders(companyName) {
    const cleanCompanyName = this.cleanCompanyName(companyName);
    
    // 尝试不同的logo提供商
    const logoUrls = [
      // Clearbit Logo API
      `https://logo.clearbit.com/${cleanCompanyName}.com`,
      
      // 尝试常见的域名后缀
      `https://logo.clearbit.com/${cleanCompanyName}.io`,
      `https://logo.clearbit.com/${cleanCompanyName}.co`,
      `https://logo.clearbit.com/${cleanCompanyName}.net`,
      
      // Logo.dev API
      `https://img.logo.dev/${cleanCompanyName}.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`,
      
      // Brandfetch API (需要API key，这里使用公共endpoint)
      `https://api.brandfetch.io/v2/brands/${cleanCompanyName}.com`,
      
      // Favicon服务
      `https://www.google.com/s2/favicons?domain=${cleanCompanyName}.com&sz=64`,
      `https://favicon.yandex.net/favicon/${cleanCompanyName}.com`,
      
      // 备用方案：使用公司名称首字母生成placeholder
      this.generatePlaceholderLogo(companyName)
    ];

    // 依次尝试每个URL
    for (const logoUrl of logoUrls) {
      if (await this.isValidImageUrl(logoUrl)) {
        return logoUrl;
      }
    }

    // 如果所有方案都失败，返回默认logo
    return this.getDefaultLogo(companyName);
  }

  /**
   * 清理公司名称，使其适合用作域名
   * @param {string} companyName - 原始公司名称
   * @returns {string} - 清理后的公司名称
   */
  cleanCompanyName(companyName) {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // 移除非字母数字字符
      .replace(/inc|corp|ltd|llc|company|co|group|technologies|tech|solutions|systems/g, '') // 移除常见公司后缀
      .trim();
  }

  /**
   * 检查图片URL是否有效
   * @param {string} url - 图片URL
   * @returns {Promise<boolean>} - 是否有效
   */
  async isValidImageUrl(url) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 3000 // 3秒超时
      });
      
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成placeholder logo
   * @param {string} companyName - 公司名称
   * @returns {string} - placeholder logo URL
   */
  generatePlaceholderLogo(companyName) {
    const firstLetter = companyName.charAt(0).toUpperCase();
    const colors = [
      '4F46E5', '7C3AED', 'DB2777', 'DC2626', 'EA580C',
      '059669', '0891B2', '1D4ED8', '7C2D12', 'BE185D'
    ];
    const colorIndex = companyName.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=${backgroundColor}&color=fff&size=64&bold=true`;
  }

  /**
   * 获取默认logo
   * @param {string} companyName - 公司名称（可选）
   * @returns {string} - 默认logo URL
   */
  getDefaultLogo(companyName = 'Company') {
    return this.generatePlaceholderLogo(companyName);
  }

  /**
   * 预加载常用公司的logo
   * @returns {Promise<void>}
   */
  async preloadCommonLogos() {
    const commonCompanies = Object.keys(this.knownCompanyLogos);
    
    // 并行预加载前10个最常见的公司logo
    const preloadPromises = commonCompanies.slice(0, 10).map(async (company) => {
      const logoUrl = this.knownCompanyLogos[company];
      try {
        await fetch(logoUrl, { method: 'HEAD' });
        console.log(`Preloaded logo for ${company}`);
      } catch (error) {
        console.warn(`Failed to preload logo for ${company}:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  /**
   * 清除logo缓存
   */
  clearCache() {
    this.logoCache.clear();
  }

  /**
   * 获取缓存统计
   * @returns {Object} - 缓存统计信息
   */
  getCacheStats() {
    return {
      cacheSize: this.logoCache.size,
      knownCompanies: Object.keys(this.knownCompanyLogos).length
    };
  }
}

// 创建单例实例
const logoService = new LogoService();

export default logoService;