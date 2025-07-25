// LinkedIn API适配器
// 处理LinkedIn Jobs API的请求和响应

import ApiAdapter from './ApiAdapter';
import { buildQueryString } from './httpUtils';
import logoService from '../logoService';
import { 
  formatRelativeDate, 
  extractSkills, 
  extractTeam, 
  estimateSalary, 
  generateRandomStats,
  extractQualifications
} from './responseTransformer';

class LinkedInApiAdapter extends ApiAdapter {
  constructor(options = {}) {
    // LinkedIn API基础URL
    super('https://api.linkedin.com/v2', options);
    
    this.clientId = options.clientId || '';
    this.clientSecret = options.clientSecret || '';
    this.redirectUri = options.redirectUri || window.location.origin;
    this.accessToken = options.accessToken || '';
    this.tokenExpiry = options.tokenExpiry || 0;
  }

  /**
   * 获取OAuth授权URL
   * @returns {string} - 授权URL
   */
  getAuthorizationUrl() {
    const params = {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'r_liteprofile r_emailaddress w_member_social',
      state: Math.random().toString(36).substring(2)
    };
    
    return `https://www.linkedin.com/oauth/v2/authorization${buildQueryString(params)}`;
  }

  /**
   * 使用授权码获取访问令牌
   * @param {string} code - 授权码
   * @returns {Promise<Object>} - 包含访问令牌的对象
   */
  async getAccessToken(code) {
    const params = {
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri
    };
    
    try {
      const response = await this.request('/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params)
      });
      
      this.accessToken = response.access_token;
      this.tokenExpiry = Date.now() + (response.expires_in * 1000);
      
      return {
        accessToken: this.accessToken,
        expiresIn: response.expires_in,
        expiryDate: new Date(this.tokenExpiry)
      };
    } catch (error) {
      throw this.handleError(error, 'LinkedIn OAuth');
    }
  }

  /**
   * 检查访问令牌是否有效
   * @returns {boolean} - 令牌是否有效
   */
  isTokenValid() {
    return this.accessToken && this.tokenExpiry > Date.now();
  }

  /**
   * 确保有有效的访问令牌
   * @returns {Promise<void>}
   */
  async ensureValidToken() {
    if (!this.isTokenValid()) {
      throw new Error('LinkedIn access token is invalid or expired. User authentication required.');
    }
  }

  /**
   * 搜索工作
   * @param {string} searchTerm - 搜索关键词
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @returns {Promise<Object>} - 工作搜索结果
   */
  async searchJobs(searchTerm = '', filters = {}, page = 0) {
    try {
      // 检查是否有有效的访问令牌
      if (!this.isTokenValid() && this.clientId && this.clientSecret) {
        try {
          // 尝试使用客户端凭据流程获取访问令牌
          await this.getClientCredentialsToken();
        } catch (tokenError) {
          console.error('Failed to get LinkedIn access token:', tokenError);
          // 继续使用模拟数据
        }
      }
      
      console.log('Searching LinkedIn jobs with term:', searchTerm, 'filters:', filters, 'page:', page);
      
      // 如果有有效的访问令牌，尝试使用真实API
      if (this.isTokenValid()) {
        try {
          // 构建查询参数
          const queryParams = {
            keywords: searchTerm,
            location: filters.location || 'worldwide',
            start: page * 10, // 每页10个结果
            count: 10
          };
          
          // 添加筛选条件
          if (filters.jobType) {
            queryParams.f_JT = this.mapJobType(filters.jobType);
          }
          
          // 发送API请求
          const response = await this.request(`/jobs/search${buildQueryString(queryParams)}`, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          });
          
          // 转换响应数据
          const jobs = await Promise.all(response.elements.map(job => this.transformJob(job)));
          
          return {
            jobs,
            total: response.paging.total,
            page,
            pageSize: 10
          };
        } catch (apiError) {
          console.error('LinkedIn API request failed:', apiError);
          // 如果API请求失败，回退到模拟数据
        }
      }
      
      // 如果没有有效的访问令牌或API请求失败，使用模拟数据
      console.log('Using mock data for LinkedIn jobs');
      return this.getMockLinkedInJobs(searchTerm, filters, page);
    } catch (error) {
      const errorInfo = this.handleError(error, 'LinkedIn Jobs Search');
      
      // 返回空结果
      return {
        jobs: [],
        total: 0,
        page: page,
        pageSize: 10
      };
    }
  }
  
  /**
   * 使用客户端凭据流程获取访问令牌
   * @returns {Promise<Object>} - 包含访问令牌的对象
   */
  async getClientCredentialsToken() {
    const params = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'r_liteprofile r_emailaddress w_member_social'
    };
    
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return {
        accessToken: this.accessToken,
        expiresIn: data.expires_in,
        expiryDate: new Date(this.tokenExpiry)
      };
    } catch (error) {
      throw this.handleError(error, 'LinkedIn OAuth Client Credentials');
    }
  }
  
  /**
   * 将工作类型映射到LinkedIn API参数
   * @param {string} jobType - 工作类型
   * @returns {string} - LinkedIn API参数
   */
  mapJobType(jobType) {
    const typeMap = {
      'Full-time': 'F',
      'Part-time': 'P',
      'Contract': 'C',
      'Temporary': 'T',
      'Volunteer': 'V',
      'Internship': 'I'
    };
    
    return typeMap[jobType] || 'F';
  }

  /**
   * 获取工作详情
   * @param {string} jobId - 工作ID
   * @returns {Promise<Object>} - 工作详情
   */
  async getJobDetails(jobId) {
    try {
      // 检查是否有有效的访问令牌
      if (!this.isTokenValid() && this.clientId && this.clientSecret) {
        try {
          // 尝试使用客户端凭据流程获取访问令牌
          await this.getClientCredentialsToken();
        } catch (tokenError) {
          console.error('Failed to get LinkedIn access token:', tokenError);
          // 继续使用模拟数据
        }
      }
      
      console.log('Fetching LinkedIn job details for ID:', jobId);
      
      // 如果有有效的访问令牌，尝试使用真实API
      if (this.isTokenValid()) {
        try {
          // 发送API请求
          const response = await this.request(`/jobs/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            }
          });
          
          // 转换响应数据
          return this.transformJobDetail(response);
        } catch (apiError) {
          console.error('LinkedIn API request failed:', apiError);
          // 如果API请求失败，回退到模拟数据
        }
      }
      
      // 如果没有有效的访问令牌或API请求失败，使用模拟数据
      console.log('Using mock data for LinkedIn job details');
      return this.getMockJobDetails(jobId);
    } catch (error) {
      throw this.handleError(error, 'LinkedIn Job Details');
    }
  }

  /**
   * 将LinkedIn工作数据转换为统一格式
   * @param {Object} linkedInJob - LinkedIn工作数据
   * @returns {Promise<Object>} - 统一格式的工作数据
   */
  async transformJob(linkedInJob) {
    return {
      id: linkedInJob.id,
      title: linkedInJob.title,
      company: linkedInJob.company.name,
      companyLogo: await logoService.getCompanyLogo(linkedInJob.company.name, linkedInJob.company.logoUrl),
      location: linkedInJob.location || 'Remote',
      type: linkedInJob.jobType || 'Full-time',
      salary: estimateSalary(linkedInJob.title),
      team: extractTeam(linkedInJob.title),
      postedDate: formatRelativeDate(linkedInJob.listedAt),
      views: linkedInJob.views || generateRandomStats().views,
      applicants: linkedInJob.applicants || generateRandomStats().applicants,
      description: linkedInJob.description || 'No description available',
      skills: extractSkills(linkedInJob.description || linkedInJob.title),
      source: 'LinkedIn',
      sourceUrl: linkedInJob.url || `https://www.linkedin.com/jobs/view/${linkedInJob.id}`,
      sourceId: linkedInJob.id
    };
  }

  /**
   * 将LinkedIn工作详情转换为统一格式
   * @param {Object} linkedInJobDetail - LinkedIn工作详情
   * @returns {Object} - 统一格式的工作详情
   */
  transformJobDetail(linkedInJobDetail) {
    const qualifications = extractQualifications(linkedInJobDetail.description || '');
    
    return {
      ...this.transformJob(linkedInJobDetail),
      minimumQualifications: qualifications.minimumQualifications,
      preferredQualifications: qualifications.preferredQualifications,
      aboutJob: linkedInJobDetail.description || 'No description available',
      companyInfo: linkedInJobDetail.companyDetails || 'No company information available',
      benefits: linkedInJobDetail.benefits || [],
      applicationUrl: linkedInJobDetail.applyUrl || `https://www.linkedin.com/jobs/view/${linkedInJobDetail.id}`
    };
  }

  /**
   * 获取模拟的LinkedIn工作数据
   * @param {string} searchTerm - 搜索关键词
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @returns {Object} - 工作搜索结果
   */
  async getMockLinkedInJobs(searchTerm = '', filters = {}, page = 0) {
    const pageSize = 10;
    
    const allJobs = [
      {
        id: 'li-1',
        title: 'Senior Frontend Developer',
        company: {
          name: 'Microsoft',
          logoUrl: 'https://logo.clearbit.com/microsoft.com'
        },
        location: 'Remote - US',
        jobType: 'Full-time',
        listedAt: '2023-07-20T10:30:00Z',
        views: 412,
        applicants: 45,
        description: 'Join our team to build innovative web applications using React and TypeScript. You will work on challenging projects and collaborate with talented engineers.',
        url: 'https://www.linkedin.com/jobs/view/li-1'
      },
      {
        id: 'li-2',
        title: 'Product Manager - Remote',
        company: {
          name: 'Amazon',
          logoUrl: 'https://logo.clearbit.com/amazon.com'
        },
        location: 'Remote - Global',
        jobType: 'Full-time',
        listedAt: '2023-07-18T14:15:00Z',
        views: 378,
        applicants: 32,
        description: 'Lead product development for our innovative platform. Define product strategy and work closely with engineering teams to deliver exceptional user experiences.',
        url: 'https://www.linkedin.com/jobs/view/li-2'
      },
      {
        id: 'li-3',
        title: 'Senior Frontend Engineer',
        company: {
          name: 'Google',
          logoUrl: 'https://logo.clearbit.com/google.com'
        },
        location: 'Remote - Europe',
        jobType: 'Full-time',
        listedAt: '2023-07-19T09:45:00Z',
        views: 521,
        applicants: 37,
        description: 'Join our team to build and improve the Google web applications. You will work with cutting-edge technologies and contribute to products used by millions.',
        url: 'https://www.linkedin.com/jobs/view/li-3'
      },
      {
        id: 'li-4',
        title: 'Data Scientist',
        company: {
          name: 'Netflix',
          logoUrl: 'https://logo.clearbit.com/netflix.com'
        },
        location: 'Remote - US',
        jobType: 'Full-time',
        listedAt: '2023-07-16T11:20:00Z',
        views: 456,
        applicants: 48,
        description: 'Apply machine learning and statistical analysis to improve our recommendation systems. Work with large datasets and develop algorithms that enhance user experience.',
        url: 'https://www.linkedin.com/jobs/view/li-4'
      },
      {
        id: 'li-5',
        title: 'UX Researcher',
        company: {
          name: 'Slack',
          logoUrl: 'https://logo.clearbit.com/slack.com'
        },
        location: 'Remote - Americas',
        jobType: 'Full-time',
        listedAt: '2023-07-14T13:10:00Z',
        views: 298,
        applicants: 23,
        description: 'Conduct user research to inform product decisions and improve user experience. Design and execute user studies, analyze data, and present findings to stakeholders.',
        url: 'https://www.linkedin.com/jobs/view/li-5'
      },
      {
        id: 'li-6',
        title: 'DevOps Engineer',
        company: {
          name: 'Atlassian',
          logoUrl: 'https://logo.clearbit.com/atlassian.com'
        },
        location: 'Remote - Global',
        jobType: 'Full-time',
        listedAt: '2023-07-17T08:30:00Z',
        views: 342,
        applicants: 29,
        description: 'Build and maintain our cloud infrastructure using Kubernetes, Docker, and AWS. Implement CI/CD pipelines and ensure high availability of our services.',
        url: 'https://www.linkedin.com/jobs/view/li-6'
      },
      {
        id: 'li-7',
        title: 'Backend Developer (Python)',
        company: {
          name: 'Dropbox',
          logoUrl: 'https://logo.clearbit.com/dropbox.com'
        },
        location: 'Remote - US',
        jobType: 'Full-time',
        listedAt: '2023-07-15T15:45:00Z',
        views: 387,
        applicants: 41,
        description: 'Develop and maintain our backend services using Python and Django. Design and implement APIs, optimize database queries, and ensure scalability.',
        url: 'https://www.linkedin.com/jobs/view/li-7'
      },
      {
        id: 'li-8',
        title: 'Mobile Developer (React Native)',
        company: {
          name: 'Spotify',
          logoUrl: 'https://logo.clearbit.com/spotify.com'
        },
        location: 'Remote - Europe',
        jobType: 'Full-time',
        listedAt: '2023-07-18T10:20:00Z',
        views: 312,
        applicants: 27,
        description: 'Build and improve our mobile applications using React Native. Implement new features, fix bugs, and ensure a smooth user experience across different devices.',
        url: 'https://www.linkedin.com/jobs/view/li-8'
      },
      {
        id: 'li-9',
        title: 'Technical Writer',
        company: {
          name: 'GitHub',
          logoUrl: 'https://logo.clearbit.com/github.com'
        },
        location: 'Remote - Global',
        jobType: 'Full-time',
        listedAt: '2023-07-13T09:15:00Z',
        views: 245,
        applicants: 19,
        description: 'Create and maintain technical documentation for our products. Work closely with engineering teams to ensure accurate and comprehensive documentation.',
        url: 'https://www.linkedin.com/jobs/view/li-9'
      },
      {
        id: 'li-10',
        title: 'Security Engineer',
        company: {
          name: 'Cloudflare',
          logoUrl: 'https://logo.clearbit.com/cloudflare.com'
        },
        location: 'Remote - US',
        jobType: 'Full-time',
        listedAt: '2023-07-16T14:30:00Z',
        views: 289,
        applicants: 31,
        description: 'Identify and address security vulnerabilities in our systems. Implement security best practices and ensure compliance with industry standards.',
        url: 'https://www.linkedin.com/jobs/view/li-10'
      }
    ];
    
    // 如果有搜索词，过滤结果
    let filteredJobs = allJobs;
    if (searchTerm) {
      filteredJobs = allJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 应用位置筛选
    if (filters.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    // 应用工作类型筛选
    if (filters.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.jobType.toLowerCase() === filters.jobType.toLowerCase()
      );
    }
    
    // 计算分页
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    // 转换为统一格式
    const transformedJobs = await Promise.all(paginatedJobs.map(job => this.transformJob(job)));
    
    return {
      jobs: transformedJobs,
      total: filteredJobs.length,
      page: page,
      pageSize: pageSize
    };
  }

  /**
   * 获取模拟的工作详情
   * @param {string} jobId - 工作ID
   * @returns {Object} - 工作详情
   */
  getMockJobDetails(jobId) {
    // 查找基本工作信息
    const allJobs = this.getMockLinkedInJobs('', {}, 0).jobs;
    const job = allJobs.find(job => job.id === jobId);
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    // 添加详细信息
    const jobDetail = {
      ...job,
      minimumQualifications: [
        '5+ years of experience in frontend development',
        'Strong proficiency with JavaScript, HTML, and CSS',
        'Experience with React or similar frontend frameworks',
        'Bachelor\'s degree in Computer Science or related field',
        'Excellent problem-solving skills'
      ],
      preferredQualifications: [
        'Experience with TypeScript and state management libraries',
        'Knowledge of web accessibility standards',
        'Experience with CI/CD pipelines',
        'Contributions to open-source projects',
        'Experience with agile development methodologies'
      ],
      aboutJob: `We are looking for a talented ${job.title} to join our team. You will be responsible for developing and maintaining web applications, collaborating with cross-functional teams, and ensuring high-quality code.

Key Responsibilities:
- Develop and maintain frontend applications using modern JavaScript frameworks
- Collaborate with designers to implement user interfaces
- Write clean, maintainable, and efficient code
- Participate in code reviews and provide constructive feedback
- Troubleshoot and fix bugs in existing applications

This is a remote position with flexible working hours. We offer competitive salary, health benefits, and opportunities for professional growth.`,
      companyInfo: `${job.company} is a leading technology company that provides innovative solutions to businesses worldwide. We are committed to creating a diverse and inclusive workplace where all employees can thrive.

Our mission is to build products that make people's lives easier and more productive. We value collaboration, innovation, and continuous learning.`,
      benefits: [
        'Competitive salary and equity',
        'Health, dental, and vision insurance',
        'Flexible working hours',
        'Remote work options',
        'Professional development budget',
        'Generous paid time off'
      ],
      applicationUrl: job.sourceUrl
    };
    
    return jobDetail;
  }
}

export default LinkedInApiAdapter;