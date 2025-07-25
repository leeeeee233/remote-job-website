// 工作去重服务
// 确保每个工作只出现一次，使用多种策略进行去重

class DeduplicationService {
  constructor() {
    // 存储已见过的工作的多种标识符
    this.seenJobIds = new Set();
    this.seenJobHashes = new Set();
    this.seenTitleCompanyPairs = new Set();
    this.seenUrls = new Set();
    
    // 相似度阈值
    this.similarityThreshold = 0.85;
    
    // 去重统计
    this.stats = {
      totalProcessed: 0,
      duplicatesRemoved: 0,
      duplicatesByType: {
        exactId: 0,
        titleCompany: 0,
        similarity: 0,
        url: 0
      }
    };
  }

  /**
   * 对工作列表进行去重
   * @param {Array} jobs - 工作列表
   * @returns {Array} - 去重后的工作列表
   */
  deduplicateJobs(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return [];
    }

    console.log(`开始去重处理，输入工作数量: ${jobs.length}`);
    
    const uniqueJobs = [];
    
    for (const job of jobs) {
      this.stats.totalProcessed++;
      
      if (this.isJobDuplicate(job)) {
        this.stats.duplicatesRemoved++;
        console.log(`发现重复工作: ${job.title} at ${job.company} (来源: ${job.source})`);
        continue;
      }
      
      // 记录这个工作的各种标识符
      this.recordJobIdentifiers(job);
      uniqueJobs.push(job);
    }
    
    console.log(`去重完成，输出工作数量: ${uniqueJobs.length}，移除重复: ${this.stats.duplicatesRemoved}`);
    return uniqueJobs;
  }

  /**
   * 检查工作是否为重复
   * @param {Object} job - 工作对象
   * @returns {boolean} - 是否为重复
   */
  isJobDuplicate(job) {
    // 1. 检查精确ID匹配
    if (job.id && this.seenJobIds.has(job.id)) {
      this.stats.duplicatesByType.exactId++;
      return true;
    }

    // 2. 检查源URL匹配
    if (job.sourceUrl && this.seenUrls.has(job.sourceUrl)) {
      this.stats.duplicatesByType.url++;
      return true;
    }

    // 3. 检查标题-公司组合
    const titleCompanyKey = this.generateTitleCompanyKey(job);
    if (this.seenTitleCompanyPairs.has(titleCompanyKey)) {
      this.stats.duplicatesByType.titleCompany++;
      return true;
    }

    // 4. 检查工作哈希
    const jobHash = this.generateJobHash(job);
    if (this.seenJobHashes.has(jobHash)) {
      this.stats.duplicatesByType.similarity++;
      return true;
    }

    // 5. 检查相似度
    if (this.isSimilarToExistingJob(job)) {
      this.stats.duplicatesByType.similarity++;
      return true;
    }

    return false;
  }

  /**
   * 记录工作的各种标识符
   * @param {Object} job - 工作对象
   */
  recordJobIdentifiers(job) {
    // 记录ID
    if (job.id) {
      this.seenJobIds.add(job.id);
    }

    // 记录URL
    if (job.sourceUrl) {
      this.seenUrls.add(job.sourceUrl);
    }

    // 记录标题-公司组合
    const titleCompanyKey = this.generateTitleCompanyKey(job);
    this.seenTitleCompanyPairs.add(titleCompanyKey);

    // 记录工作哈希
    const jobHash = this.generateJobHash(job);
    this.seenJobHashes.add(jobHash);
  }

  /**
   * 生成标题-公司键
   * @param {Object} job - 工作对象
   * @returns {string} - 标准化的键
   */
  generateTitleCompanyKey(job) {
    const title = this.normalizeString(job.title || '');
    const company = this.normalizeString(job.company || '');
    return `${title}|${company}`;
  }

  /**
   * 生成工作哈希
   * @param {Object} job - 工作对象
   * @returns {string} - 工作哈希
   */
  generateJobHash(job) {
    const components = [
      this.normalizeString(job.title || ''),
      this.normalizeString(job.company || ''),
      this.normalizeString(job.location || ''),
      this.normalizeString(job.type || ''),
      job.source || ''
    ];
    
    return components.join('|');
  }

  /**
   * 标准化字符串
   * @param {string} str - 输入字符串
   * @returns {string} - 标准化后的字符串
   */
  normalizeString(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/\b(inc|ltd|llc|corp|corporation|company|co)\b/g, '')
      .trim();
  }

  /**
   * 检查是否与现有工作相似
   * @param {Object} job - 工作对象
   * @returns {boolean} - 是否相似
   */
  isSimilarToExistingJob(job) {
    const currentJobString = this.generateJobHash(job);
    
    for (const existingHash of this.seenJobHashes) {
      const similarity = this.calculateSimilarity(currentJobString, existingHash);
      if (similarity > this.similarityThreshold) {
        console.log(`发现相似工作 (${Math.round(similarity * 100)}% 相似度): ${job.title} at ${job.company}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * 计算字符串相似度
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} - 相似度 (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * 计算编辑距离
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} - 编辑距离
   */
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // 插入
          matrix[j - 1][i] + 1,     // 删除
          matrix[j - 1][i - 1] + indicator  // 替换
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 批量去重多个来源的工作
   * @param {Object} jobsBySource - 按来源分组的工作
   * @returns {Array} - 去重后的工作列表
   */
  deduplicateMultipleSources(jobsBySource) {
    console.log('开始多源去重处理');
    
    // 按优先级排序来源
    const sourcePriority = ['LinkedIn', 'RemoteOK', 'WeWorkRemotely', 'GitHub Jobs'];
    const sortedSources = Object.keys(jobsBySource).sort((a, b) => {
      const aIndex = sourcePriority.indexOf(a);
      const bIndex = sourcePriority.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
    
    const allJobs = [];
    
    // 按优先级处理每个来源
    for (const source of sortedSources) {
      const jobs = jobsBySource[source] || [];
      console.log(`处理来源 ${source}: ${jobs.length} 个工作`);
      
      const uniqueJobsFromSource = this.deduplicateJobs(jobs);
      allJobs.push(...uniqueJobsFromSource);
      
      console.log(`来源 ${source} 去重后: ${uniqueJobsFromSource.length} 个工作`);
    }
    
    console.log(`多源去重完成，总计: ${allJobs.length} 个唯一工作`);
    return allJobs;
  }

  /**
   * 重置去重状态
   */
  reset() {
    this.seenJobIds.clear();
    this.seenJobHashes.clear();
    this.seenTitleCompanyPairs.clear();
    this.seenUrls.clear();
    
    this.stats = {
      totalProcessed: 0,
      duplicatesRemoved: 0,
      duplicatesByType: {
        exactId: 0,
        titleCompany: 0,
        similarity: 0,
        url: 0
      }
    };
    
    console.log('去重服务状态已重置');
  }

  /**
   * 获取去重统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      duplicateRate: this.stats.totalProcessed > 0 
        ? (this.stats.duplicatesRemoved / this.stats.totalProcessed * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * 设置相似度阈值
   * @param {number} threshold - 阈值 (0-1)
   */
  setSimilarityThreshold(threshold) {
    if (threshold >= 0 && threshold <= 1) {
      this.similarityThreshold = threshold;
      console.log(`相似度阈值已设置为: ${threshold}`);
    }
  }

  /**
   * 检查特定工作是否已存在
   * @param {Object} job - 工作对象
   * @returns {boolean} - 是否已存在
   */
  hasJob(job) {
    return this.isJobDuplicate(job);
  }

  /**
   * 添加工作到已知列表（不返回，只记录）
   * @param {Object} job - 工作对象
   */
  addJob(job) {
    if (!this.isJobDuplicate(job)) {
      this.recordJobIdentifiers(job);
    }
  }
}

export default DeduplicationService;