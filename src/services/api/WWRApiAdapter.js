// WeWorkRemotely API适配器
// 处理WeWorkRemotely RSS feed的获取和解析

import ApiAdapter from './ApiAdapter';
import { parseRssFeed } from './httpUtils';
import logoService from '../logoService';
import { 
  formatRelativeDate, 
  extractSkills, 
  extractTeam, 
  estimateSalary, 
  generateRandomStats,
  extractTextFromHtml,
  extractQualifications
} from './responseTransformer';

class WWRApiAdapter extends ApiAdapter {
  constructor(options = {}) {
    // WeWorkRemotely没有真正的API，我们使用RSS feed
    super('https://weworkremotely.com', options);
    
    this.apiKey = options.apiKey || ''; // RSS2JSON API密钥
    this.categories = {
      'programming': 'remote-jobs/remote-programming-jobs',
      'design': 'remote-jobs/remote-design-jobs',
      'marketing': 'remote-jobs/remote-marketing-jobs',
      'management': 'remote-jobs/remote-management-executive-jobs',
      'sales': 'remote-jobs/remote-sales-jobs',
      'customer-support': 'remote-jobs/remote-customer-support-jobs',
      'all': 'categories/remote-jobs'
    };
  }

  /**
   * 获取RSS feed URL
   * @param {string} category - 工作类别
   * @returns {string} - RSS feed URL
   */
  getRssFeedUrl(category = 'all') {
    const categoryPath = this.categories[category] || this.categories.all;
    return `${this.baseUrl}/${categoryPath}.rss`;
  }

  /**
   * 搜索工作
   * @param {string} searchTerm - 搜索关键词
   * @param {string} category - 工作类别
   * @returns {Promise<Object>} - 工作搜索结果
   */
  async searchJobs(searchTerm = '', category = 'all') {
    try {
      // 获取RSS feed URL
      const rssUrl = this.getRssFeedUrl(category);
      
      console.log('Fetching WeWorkRemotely jobs from:', rssUrl);
      
      // 使用RSS2JSON服务解析RSS feed
      const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      
      const options = {};
      if (this.apiKey) {
        options.headers = {
          'Authorization': `ApiKey ${this.apiKey}`
        };
      }
      
      const response = await fetch(rss2jsonUrl, options);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch WeWorkRemotely jobs: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error('Invalid response from RSS2JSON');
      }
      
      // 处理RSS feed项目
      let jobs = data.items.map((item, index) => {
        // 从标题中提取公司名称和职位
        const titleMatch = item.title.match(/(.*?):(.*)/);
        const company = titleMatch ? titleMatch[1].trim() : 'Unknown Company';
        const title = titleMatch ? titleMatch[2].trim() : item.title;
        
        return {
          id: `wwr-${index}-${Date.now()}`,
          title: item.title,
          company: company,
          logo: `https://logo.clearbit.com/${company.toLowerCase().replace(/\\s+/g, '')}.com`,
          location: 'Remote',
          job_type: 'Full-time',
          pubDate: item.pubDate,
          description: item.description || item.content,
          url: item.link,
          tags: this.extractTagsFromDescription(item.description || item.content)
        };
      });
      
      // 如果有搜索词，过滤结果
      if (searchTerm) {
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // 转换为统一格式
      const transformedJobs = await Promise.all(jobs.map(job => this.transformJob(job)));
      
      return {
        jobs: transformedJobs,
        total: transformedJobs.length,
        source: 'WeWorkRemotely'
      };
    } catch (error) {
      console.error('Error fetching WeWorkRemotely jobs:', error);
      
      // 如果API调用失败，回退到模拟数据
      console.log('Falling back to mock data for WeWorkRemotely');
      const mockData = this.getMockWWRJobs(searchTerm, category);
      const jobs = await Promise.all(mockData.map(job => this.transformJob(job)));
      
      return {
        jobs,
        total: jobs.length,
        source: 'WeWorkRemotely (Mock)'
      };
    }
  }
  
  /**
   * 从描述中提取标签
   * @param {string} description - 工作描述
   * @returns {string[]} - 提取的标签
   */
  extractTagsFromDescription(description) {
    if (!description) return [];
    
    const commonTags = [
      'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Angular', 'Vue.js', 
      'Java', 'C#', '.NET', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 
      'Docker', 'Kubernetes', 'CI/CD', 'DevOps', 'Git', 'Linux', 'Figma', 
      'Sketch', 'Adobe XD', 'UI/UX', 'CSS', 'HTML', 'REST API', 'GraphQL',
      'Remote', 'Full-time', 'Part-time', 'Contract', 'Freelance'
    ];
    
    const foundTags = commonTags.filter(tag => 
      description.toLowerCase().includes(tag.toLowerCase())
    );
    
    return foundTags.length > 0 ? foundTags.slice(0, 5) : ['Remote Work'];
  }

  /**
   * 获取工作详情
   * @param {string} jobId - 工作ID
   * @returns {Promise<Object>} - 工作详情
   */
  async getJobDetails(jobId) {
    try {
      // WeWorkRemotely没有单独的工作详情API，我们需要从列表中找到对应的工作
      console.log('Fetching WeWorkRemotely job details for ID:', jobId);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 返回模拟数据
      return this.getMockJobDetails(jobId);
    } catch (error) {
      throw this.handleError(error, 'WeWorkRemotely Job Details');
    }
  }

  /**
   * 将WeWorkRemotely工作数据转换为统一格式
   * @param {Object} wwrJob - WeWorkRemotely工作数据
   * @returns {Promise<Object>} - 统一格式的工作数据
   */
  async transformJob(wwrJob) {
    // 从标题中提取公司名称和职位
    const titleMatch = wwrJob.title ? wwrJob.title.match(/(.*?):(.*)/i) : null;
    const company = titleMatch ? titleMatch[1].trim() : wwrJob.company || 'Unknown Company';
    const title = titleMatch ? titleMatch[2].trim() : wwrJob.title || 'Unknown Position';
    
    // 提取纯文本描述
    const plainDescription = extractTextFromHtml(wwrJob.description || '');
    
    return {
      id: wwrJob.id || `wwr-${Math.random().toString(36).substring(2, 10)}`,
      title: title,
      company: company,
      companyLogo: await logoService.getCompanyLogo(company, wwrJob.logo),
      location: wwrJob.location || 'Remote',
      type: wwrJob.job_type || 'Full-time',
      salary: estimateSalary(title),
      team: extractTeam(title),
      postedDate: formatRelativeDate(wwrJob.pubDate || wwrJob.date),
      views: wwrJob.views || generateRandomStats().views,
      applicants: wwrJob.applicants || generateRandomStats().applicants,
      description: plainDescription || 'No description available',
      skills: extractSkills(plainDescription || title),
      source: 'WeWorkRemotely',
      sourceUrl: wwrJob.url || wwrJob.link || `https://weworkremotely.com/jobs/${wwrJob.id}`,
      sourceId: wwrJob.id
    };
  }

  /**
   * 将WeWorkRemotely工作详情转换为统一格式
   * @param {Object} wwrJobDetail - WeWorkRemotely工作详情
   * @returns {Object} - 统一格式的工作详情
   */
  transformJobDetail(wwrJobDetail) {
    const job = this.transformJob(wwrJobDetail);
    const qualifications = extractQualifications(wwrJobDetail.description || '');
    
    return {
      ...job,
      minimumQualifications: qualifications.minimumQualifications,
      preferredQualifications: qualifications.preferredQualifications,
      aboutJob: wwrJobDetail.description || 'No description available',
      companyInfo: wwrJobDetail.company_description || 'No company information available',
      benefits: wwrJobDetail.benefits || [],
      applicationUrl: wwrJobDetail.url || job.sourceUrl
    };
  }

  /**
   * 获取模拟的WeWorkRemotely工作数据
   * @param {string} searchTerm - 搜索关键词
   * @param {string} category - 工作类别
   * @returns {Array} - 工作数据数组
   */
  getMockWWRJobs(searchTerm = '', category = 'all') {
    const allJobs = [
      {
        id: 'wwr-1',
        title: 'Doist: Senior React Developer',
        company: 'Doist',
        logo: 'https://logo.clearbit.com/doist.com',
        location: 'Remote - Worldwide',
        job_type: 'Full-time',
        pubDate: '2023-07-21T10:30:00Z',
        views: 245,
        applicants: 18,
        description: '<p>Join our fully remote team building the next generation of productivity tools like Todoist and Twist.</p><p>Requirements:</p><ul><li>5+ years of experience with React</li><li>Strong TypeScript skills</li><li>Experience with state management libraries</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-1',
        tags: ['React', 'TypeScript', 'Remote']
      },
      {
        id: 'wwr-2',
        title: 'Automattic: UX/UI Designer',
        company: 'Automattic',
        logo: 'https://logo.clearbit.com/automattic.com',
        location: 'Remote - Global',
        job_type: 'Full-time',
        pubDate: '2023-07-19T14:15:00Z',
        views: 189,
        applicants: 24,
        description: '<p>Create beautiful and intuitive user experiences for WordPress.com, WooCommerce, and other Automattic products.</p><p>Requirements:</p><ul><li>Portfolio demonstrating UX/UI design skills</li><li>Experience with Figma or Sketch</li><li>Understanding of web accessibility standards</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-2',
        tags: ['Design', 'UX', 'UI', 'Figma']
      },
      {
        id: 'wwr-3',
        title: 'Shopify: Senior Backend Engineer (Ruby)',
        company: 'Shopify',
        logo: 'https://logo.clearbit.com/shopify.com',
        location: 'Remote - Americas',
        job_type: 'Full-time',
        pubDate: '2023-07-18T09:45:00Z',
        views: 312,
        applicants: 27,
        description: '<p>Build and scale the infrastructure that powers millions of online stores worldwide.</p><p>Requirements:</p><ul><li>5+ years of experience with Ruby/Rails</li><li>Experience with high-traffic applications</li><li>Knowledge of database optimization</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-3',
        tags: ['Ruby', 'Rails', 'Backend']
      },
      {
        id: 'wwr-4',
        title: 'GitLab: DevOps Engineer',
        company: 'GitLab',
        logo: 'https://logo.clearbit.com/gitlab.com',
        location: 'Remote - Worldwide',
        job_type: 'Full-time',
        pubDate: '2023-07-14T11:20:00Z',
        views: 278,
        applicants: 31,
        description: '<p>Join the world\'s largest all-remote company to help scale our infrastructure and improve our DevOps practices.</p><p>Requirements:</p><ul><li>Experience with Kubernetes and container orchestration</li><li>Knowledge of infrastructure as code (Terraform, Ansible)</li><li>Experience with CI/CD pipelines</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-4',
        tags: ['DevOps', 'Kubernetes', 'CI/CD']
      },
      {
        id: 'wwr-5',
        title: 'Buffer: Product Manager',
        company: 'Buffer',
        logo: 'https://logo.clearbit.com/buffer.com',
        location: 'Remote - Global',
        job_type: 'Full-time',
        pubDate: '2023-07-17T13:10:00Z',
        views: 203,
        applicants: 42,
        description: '<p>Lead product development for Buffer\'s social media management platform used by millions worldwide.</p><p>Requirements:</p><ul><li>3+ years of product management experience</li><li>Experience with agile methodologies</li><li>Strong analytical and problem-solving skills</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-5',
        tags: ['Product', 'Management', 'Agile']
      },
      {
        id: 'wwr-6',
        title: 'Zapier: Full Stack Engineer',
        company: 'Zapier',
        logo: 'https://logo.clearbit.com/zapier.com',
        location: 'Remote - Worldwide',
        job_type: 'Full-time',
        pubDate: '2023-07-16T08:30:00Z',
        views: 342,
        applicants: 29,
        description: '<p>Build features across the entire stack to help our users automate their work.</p><p>Requirements:</p><ul><li>Experience with JavaScript/TypeScript</li><li>Experience with Python or Node.js</li><li>Knowledge of React or similar frontend frameworks</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-6',
        tags: ['JavaScript', 'Python', 'React']
      },
      {
        id: 'wwr-7',
        title: 'Basecamp: Rails Programmer',
        company: 'Basecamp',
        logo: 'https://logo.clearbit.com/basecamp.com',
        location: 'Remote - Worldwide',
        job_type: 'Full-time',
        pubDate: '2023-07-15T15:45:00Z',
        views: 387,
        applicants: 41,
        description: '<p>Join our team to work on Basecamp and HEY using Ruby on Rails.</p><p>Requirements:</p><ul><li>Experience with Ruby on Rails</li><li>Strong understanding of web fundamentals</li><li>Excellent written communication skills</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-7',
        tags: ['Ruby', 'Rails', 'Backend']
      },
      {
        id: 'wwr-8',
        title: 'InVision: Senior Product Designer',
        company: 'InVision',
        logo: 'https://logo.clearbit.com/invisionapp.com',
        location: 'Remote - Americas',
        job_type: 'Full-time',
        pubDate: '2023-07-18T10:20:00Z',
        views: 312,
        applicants: 27,
        description: '<p>Design digital products that are used by millions of designers and developers.</p><p>Requirements:</p><ul><li>5+ years of product design experience</li><li>Experience with design systems</li><li>Strong portfolio showcasing UX/UI work</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-8',
        tags: ['Design', 'UX', 'UI']
      },
      {
        id: 'wwr-9',
        title: 'Toptal: Technical Editor',
        company: 'Toptal',
        logo: 'https://logo.clearbit.com/toptal.com',
        location: 'Remote - Global',
        job_type: 'Full-time',
        pubDate: '2023-07-13T09:15:00Z',
        views: 245,
        applicants: 19,
        description: '<p>Edit and review technical content for our engineering blog.</p><p>Requirements:</p><ul><li>Strong technical background</li><li>Excellent editing and writing skills</li><li>Experience with technical content creation</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-9',
        tags: ['Content', 'Editing', 'Technical Writing']
      },
      {
        id: 'wwr-10',
        title: 'Auth0: Security Engineer',
        company: 'Auth0',
        logo: 'https://logo.clearbit.com/auth0.com',
        location: 'Remote - Americas',
        job_type: 'Full-time',
        pubDate: '2023-07-16T14:30:00Z',
        views: 289,
        applicants: 31,
        description: '<p>Help us build and maintain secure authentication and authorization systems.</p><p>Requirements:</p><ul><li>Experience with application security</li><li>Knowledge of OAuth and OpenID Connect</li><li>Experience with security assessments</li></ul>',
        url: 'https://weworkremotely.com/jobs/wwr-10',
        tags: ['Security', 'OAuth', 'Authentication']
      }
    ];
    
    // 如果有搜索词，过滤结果
    if (searchTerm) {
      return allJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 如果有类别筛选
    if (category && category !== 'all') {
      const categoryKeywords = {
        'programming': ['developer', 'engineer', 'programmer', 'coding', 'software'],
        'design': ['designer', 'design', 'ui', 'ux', 'graphic'],
        'marketing': ['marketing', 'growth', 'seo', 'content'],
        'management': ['manager', 'director', 'executive', 'lead'],
        'sales': ['sales', 'account', 'business development'],
        'customer-support': ['support', 'customer', 'service']
      };
      
      const keywords = categoryKeywords[category] || [];
      
      return allJobs.filter(job => 
        keywords.some(keyword => 
          job.title.toLowerCase().includes(keyword) || 
          job.description.toLowerCase().includes(keyword) ||
          job.tags.some(tag => tag.toLowerCase().includes(keyword))
        )
      );
    }
    
    return allJobs;
  }

  /**
   * 获取模拟的工作详情
   * @param {string} jobId - 工作ID
   * @returns {Object} - 工作详情
   */
  getMockJobDetails(jobId) {
    // 查找基本工作信息
    const allJobs = this.getMockWWRJobs();
    const job = allJobs.find(job => job.id === jobId);
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    // 添加详细信息
    return {
      ...job,
      company_description: `${job.company} is a leading company in its field, known for innovation and a great remote work culture. We offer competitive benefits and a supportive team environment.`,
      benefits: [
        'Competitive salary',
        'Flexible working hours',
        'Home office stipend',
        'Health insurance',
        'Annual team retreats',
        'Professional development budget'
      ]
    };
  }
}

export default WWRApiAdapter;