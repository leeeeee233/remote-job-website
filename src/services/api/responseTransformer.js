// API响应转换器
// 将不同API的响应格式转换为统一的工作数据模型

/**
 * 统一的工作数据模型
 * @typedef {Object} JobInfo
 * @property {string} id - 工作ID
 * @property {string} title - 职位名称
 * @property {string} company - 公司名称
 * @property {string} companyLogo - 公司logo URL
 * @property {string} location - 工作地点
 * @property {string} type - 工作类型（全职、兼职等）
 * @property {number} salary - 估算薪资（千美元/年）
 * @property {string} team - 团队类型（前端、后端等）
 * @property {string} postedDate - 发布日期（相对时间）
 * @property {number} views - 浏览次数
 * @property {number} applicants - 申请人数
 * @property {string} description - 工作描述
 * @property {string[]} skills - 所需技能
 * @property {string} source - 数据来源
 * @property {string} sourceUrl - 原始工作链接
 * @property {string} sourceId - 来源系统中的ID
 */

/**
 * 统一的工作详情模型
 * @typedef {Object} JobDetail
 * @property {string[]} minimumQualifications - 最低资格要求
 * @property {string[]} preferredQualifications - 优先资格要求
 * @property {string} aboutJob - 关于工作的详细描述
 * @property {string} companyInfo - 公司信息
 * @property {string[]} benefits - 福利待遇
 * @property {string} applicationUrl - 申请链接
 */

/**
 * 格式化发布日期为相对时间
 * @param {string} dateString - 日期字符串
 * @returns {string} - 格式化后的相对时间
 */
export const formatRelativeDate = (dateString) => {
  if (!dateString) return 'Recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return `${Math.ceil(diffDays / 30)} months ago`;
};

/**
 * 从文本中提取技能
 * @param {string} text - 文本内容
 * @returns {string[]} - 提取的技能列表
 */
export const extractSkills = (text) => {
  const commonSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Angular', 'Vue.js', 'Java', 'C#', '.NET',
    'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
    'Git', 'Linux', 'Figma', 'Sketch', 'Adobe XD', 'UI/UX', 'CSS', 'HTML', 'REST API', 'GraphQL'
  ];

  if (!text || typeof text !== 'string') {
    return ['Remote Work'];
  }

  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills.length > 0 ? foundSkills.slice(0, 5) : ['Remote Work'];
};

/**
 * 从职位名称中提取团队类型
 * @param {string} title - 职位名称
 * @returns {string} - 团队类型
 */
export const extractTeam = (title) => {
  if (!title || typeof title !== 'string') {
    return 'Engineering';
  }

  const teams = {
    'Frontend': ['Frontend', 'Front-end', 'Front End', 'UI', 'React', 'Angular', 'Vue', 'JavaScript'],
    'UX/UI': ['UX', 'UI', 'User Experience', 'User Interface', 'Designer', 'Design'],
    'Backend': ['Backend', 'Back-end', 'Back End', 'API', 'Server', 'Java', 'Python', 'Ruby', 'PHP', 'Node'],
    'Full Stack': ['Full Stack', 'Fullstack', 'Full-stack'],
    'DevOps': ['DevOps', 'SRE', 'Infrastructure', 'Cloud', 'AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker'],
    'Mobile': ['Mobile', 'iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin'],
    'Data': ['Data', 'Analytics', 'Machine Learning', 'AI', 'ML', 'Data Science', 'Big Data'],
    'Product': ['Product', 'PM', 'Product Manager', 'Product Owner'],
    'QA': ['QA', 'Test', 'Testing', 'Quality'],
    'Security': ['Security', 'Cyber', 'InfoSec']
  };
  
  for (const [team, keywords] of Object.entries(teams)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return team;
    }
  }
  
  return 'Engineering';
};

/**
 * 估算职位薪资
 * @param {string} title - 职位名称
 * @returns {number} - 估算薪资（千美元/年）
 */
export const estimateSalary = (title) => {
  if (!title || typeof title !== 'string') {
    return 100;
  }

  // 基于职位名称估算薪资范围
  const seniorKeywords = ['Senior', 'Sr', 'Lead', 'Principal', 'Staff', 'Architect'];
  const midKeywords = ['II', '2', 'Mid', 'Intermediate'];
  const juniorKeywords = ['Junior', 'Jr', 'Entry', 'Associate', 'Intern'];
  
  const isSenior = seniorKeywords.some(key => title.includes(key));
  const isMid = midKeywords.some(key => title.includes(key));
  const isJunior = juniorKeywords.some(key => title.includes(key));
  
  // 基础薪资范围
  let baseSalary;
  if (title.includes('Manager') || title.includes('Director')) {
    baseSalary = 130;
  } else if (title.includes('Architect') || title.includes('Principal')) {
    baseSalary = 140;
  } else if (title.includes('DevOps') || title.includes('SRE')) {
    baseSalary = 125;
  } else if (title.includes('Data') || title.includes('Machine Learning')) {
    baseSalary = 110;
  } else if (title.includes('UI') || title.includes('UX') || title.includes('Design')) {
    baseSalary = 115;
  } else if (title.includes('Mobile') || title.includes('iOS') || title.includes('Android')) {
    baseSalary = 120;
  } else {
    baseSalary = 100;
  }
  
  // 根据级别调整薪资
  if (isSenior) {
    return baseSalary + 20;
  } else if (isMid) {
    return baseSalary;
  } else if (isJunior) {
    return baseSalary - 30;
  } else {
    return baseSalary;
  }
};

/**
 * 生成随机的浏览量和申请人数
 * @returns {Object} - 包含views和applicants的对象
 */
export const generateRandomStats = () => {
  return {
    views: Math.floor(Math.random() * 500) + 50,
    applicants: Math.floor(Math.random() * 50) + 5
  };
};

/**
 * 从HTML描述中提取纯文本
 * @param {string} html - HTML描述
 * @returns {string} - 提取的纯文本
 */
export const extractTextFromHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // 创建临时DOM元素
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 获取纯文本
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * 从描述中提取资格要求
 * @param {string} description - 工作描述
 * @returns {Object} - 包含最低和优先资格要求的对象
 */
export const extractQualifications = (description) => {
  if (!description || typeof description !== 'string') {
    return {
      minimumQualifications: [],
      preferredQualifications: []
    };
  }
  
  const minimumSections = [
    'requirements', 'qualifications', 'what you need', 'what we require',
    'minimum qualifications', 'basic qualifications', 'required skills'
  ];
  
  const preferredSections = [
    'preferred', 'bonus', 'nice to have', 'desired', 'plus',
    'preferred qualifications', 'additional skills'
  ];
  
  const lines = description.split('\n');
  const minimumQualifications = [];
  const preferredQualifications = [];
  
  let currentSection = null;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // 检查是否是最低要求部分
    if (minimumSections.some(section => lowerLine.includes(section))) {
      currentSection = 'minimum';
      continue;
    }
    
    // 检查是否是优先要求部分
    if (preferredSections.some(section => lowerLine.includes(section))) {
      currentSection = 'preferred';
      continue;
    }
    
    // 如果是列表项，添加到相应部分
    if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
      const item = line.trim().replace(/^[•\-\d.]+\s*/, '');
      
      if (item && currentSection === 'minimum') {
        minimumQualifications.push(item);
      } else if (item && currentSection === 'preferred') {
        preferredQualifications.push(item);
      }
    }
  }
  
  return {
    minimumQualifications: minimumQualifications.length > 0 ? minimumQualifications : [],
    preferredQualifications: preferredQualifications.length > 0 ? preferredQualifications : []
  };
};

export default {
  formatRelativeDate,
  extractSkills,
  extractTeam,
  estimateSalary,
  generateRandomStats,
  extractTextFromHtml,
  extractQualifications
};