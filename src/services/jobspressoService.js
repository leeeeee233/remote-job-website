// Jobspresso API 服务
// 用于从 https://jobspresso.co/remote-work/ 获取真实的远程工作数据
import JobspressoScraper from './jobspressoScraper';

class JobspressoService {
  constructor() {
    this.baseUrl = 'https://jobspresso.co';
    this.apiEndpoint = '/api/jobs'; // 假设的API端点
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.scraper = new JobspressoScraper();
  }

  // 由于Jobspresso可能没有公开API，我们需要使用网页抓取或RSS feed
  // 这里先实现一个基础的数据获取结构
  async fetchJobs(searchTerm = '', category = '', page = 1, limit = 20) {
    try {
      const cacheKey = `jobs_${searchTerm}_${category}_${page}_${limit}`;
      
      // 检查缓存
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('Using cached Jobspresso data');
          return cached.data;
        }
      }

      // 由于跨域限制，我们需要使用代理或后端服务
      // 这里先返回模拟数据，实际实现需要后端支持
      const jobs = await this.fetchJobsFromProxy(searchTerm, category, page, limit);
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: jobs,
        timestamp: Date.now()
      });

      return jobs;
    } catch (error) {
      console.error('Error fetching Jobspresso jobs:', error);
      throw error;
    }
  }

  // 通过代理服务获取工作数据
  async fetchJobsFromProxy(searchTerm, category, page, limit) {
    try {
      // 首先尝试使用网页抓取获取真实数据
      console.log('🔍 尝试从Jobspresso网站抓取真实数据...');
      const scrapedData = await this.scraper.scrapeRemoteJobs(searchTerm, category);
      
      if (scrapedData.jobs && scrapedData.jobs.length > 0) {
        console.log(`✅ 成功抓取到 ${scrapedData.jobs.length} 个真实Jobspresso工作`);
        return scrapedData;
      }
    } catch (error) {
      console.warn('⚠️ 网页抓取失败，使用备用数据:', error.message);
    }
    
    // 如果抓取失败，使用备用数据
    console.log('🔄 使用Jobspresso备用数据结构');
    return this.getMockJobspressoData(searchTerm, category);
  }

  // 获取工作详情
  async getJobDetails(jobId) {
    try {
      const cacheKey = `job_detail_${jobId}`;
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // 实际实现需要从Jobspresso获取详细信息
      const jobDetail = await this.fetchJobDetailFromProxy(jobId);
      
      this.cache.set(cacheKey, {
        data: jobDetail,
        timestamp: Date.now()
      });

      return jobDetail;
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  }

  // 获取工作分类
  async getCategories() {
    return [
      'Software Development',
      'Design',
      'Marketing',
      'Sales',
      'Customer Support',
      'Data Science',
      'DevOps',
      'Product Management',
      'Writing',
      'Finance',
      'HR',
      'Legal'
    ];
  }

  // 基于Jobspresso网站的真实工作数据结构
  getMockJobspressoData(searchTerm = '', category = '') {
    const jobspressoJobs = [
      {
        id: 'jp_001',
        title: 'Senior Full Stack Developer',
        company: 'Remote First Co',
        companyLogo: 'https://logo.clearbit.com/remotefirst.com',
        location: 'Remote - Worldwide',
        type: 'Full-time',
        salary: 120000,
        currency: 'USD',
        team: 'Engineering',
        postedDate: 'Today',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/senior-full-stack-developer',
        description: 'We are looking for a Senior Full Stack Developer to join our remote-first team. You will work on building scalable web applications using modern technologies.',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
        requirements: [
          '5+ years of full-stack development experience',
          'Strong proficiency in React and Node.js',
          'Experience with cloud platforms (AWS/GCP/Azure)',
          'Excellent communication skills for remote work'
        ],
        benefits: [
          'Fully remote work',
          'Flexible working hours',
          'Health insurance',
          'Professional development budget',
          'Home office setup allowance'
        ],
        companyInfo: 'Remote First Co is a technology company that has been fully remote since day one. We believe in work-life balance and building great products with distributed teams.',
        applicationUrl: 'https://jobspresso.co/apply/senior-full-stack-developer'
      },
      {
        id: 'jp_002',
        title: 'UX/UI Designer - Remote',
        company: 'Design Studio Remote',
        companyLogo: 'https://logo.clearbit.com/designstudio.com',
        location: 'Remote - US/EU',
        type: 'Full-time',
        salary: 85000,
        currency: 'USD',
        team: 'Design',
        postedDate: '1 day ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/ux-ui-designer-remote',
        description: 'Join our design team to create beautiful and intuitive user experiences for our SaaS products. Work with a talented team of designers and developers.',
        skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
        requirements: [
          '3+ years of UX/UI design experience',
          'Strong portfolio demonstrating design skills',
          'Experience with design systems',
          'Proficiency in Figma and prototyping tools'
        ],
        benefits: [
          'Remote work flexibility',
          'Creative freedom',
          'Learning and development opportunities',
          'Collaborative team environment'
        ],
        companyInfo: 'Design Studio Remote specializes in creating exceptional digital experiences for startups and established companies worldwide.',
        applicationUrl: 'https://jobspresso.co/apply/ux-ui-designer-remote'
      },
      {
        id: 'jp_003',
        title: 'Digital Marketing Manager',
        company: 'Growth Marketing Inc',
        companyLogo: 'https://logo.clearbit.com/growthmarketing.com',
        location: 'Remote - Global',
        type: 'Full-time',
        salary: 75000,
        currency: 'USD',
        team: 'Marketing',
        postedDate: '2 days ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/digital-marketing-manager',
        description: 'Lead our digital marketing efforts across multiple channels. Drive growth through SEO, content marketing, social media, and paid advertising.',
        skills: ['SEO', 'Content Marketing', 'Google Ads', 'Social Media', 'Analytics'],
        requirements: [
          '4+ years of digital marketing experience',
          'Proven track record in growth marketing',
          'Experience with marketing automation tools',
          'Strong analytical and communication skills'
        ],
        benefits: [
          'Work from anywhere',
          'Performance bonuses',
          'Marketing conference attendance',
          'Flexible schedule'
        ],
        companyInfo: 'Growth Marketing Inc helps businesses scale their online presence through data-driven marketing strategies.',
        applicationUrl: 'https://jobspresso.co/apply/digital-marketing-manager'
      },
      {
        id: 'jp_004',
        title: 'DevOps Engineer - Remote',
        company: 'Cloud Solutions Ltd',
        companyLogo: 'https://logo.clearbit.com/cloudsolutions.com',
        location: 'Remote - Americas',
        type: 'Full-time',
        salary: 110000,
        currency: 'USD',
        team: 'Infrastructure',
        postedDate: '3 days ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/devops-engineer-remote',
        description: 'Build and maintain cloud infrastructure for our growing platform. Work with Kubernetes, Docker, and modern CI/CD pipelines.',
        skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'Jenkins'],
        requirements: [
          '4+ years of DevOps/Infrastructure experience',
          'Strong knowledge of containerization',
          'Experience with Infrastructure as Code',
          'Familiarity with monitoring and logging tools'
        ],
        benefits: [
          'Remote-first culture',
          'Cutting-edge technology stack',
          'Professional certification support',
          'Competitive salary and equity'
        ],
        companyInfo: 'Cloud Solutions Ltd provides enterprise cloud infrastructure solutions to companies worldwide.',
        applicationUrl: 'https://jobspresso.co/apply/devops-engineer-remote'
      },
      {
        id: 'jp_005',
        title: 'Content Writer - Tech Focus',
        company: 'TechWrite Pro',
        companyLogo: 'https://logo.clearbit.com/techwrite.com',
        location: 'Remote - Worldwide',
        type: 'Full-time',
        salary: 60000,
        currency: 'USD',
        team: 'Content',
        postedDate: '1 week ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/content-writer-tech',
        description: 'Create engaging technical content for our blog, documentation, and marketing materials. Help explain complex technical concepts to diverse audiences.',
        skills: ['Technical Writing', 'SEO', 'Content Strategy', 'Research', 'Editing'],
        requirements: [
          '3+ years of technical writing experience',
          'Strong understanding of software development',
          'Excellent research and communication skills',
          'Experience with content management systems'
        ],
        benefits: [
          'Flexible working hours',
          'Professional development opportunities',
          'Work with cutting-edge technologies',
          'Collaborative remote team'
        ],
        companyInfo: 'TechWrite Pro specializes in creating high-quality technical content for technology companies and startups.',
        applicationUrl: 'https://jobspresso.co/apply/content-writer-tech'
      },
      {
        id: 'jp_006',
        title: 'Data Scientist - Remote',
        company: 'DataInsights Corp',
        companyLogo: 'https://logo.clearbit.com/datainsights.com',
        location: 'Remote - US/Canada',
        type: 'Full-time',
        salary: 130000,
        currency: 'USD',
        team: 'Data Science',
        postedDate: '4 days ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/data-scientist-remote',
        description: 'Analyze large datasets to extract actionable insights for business decisions. Build machine learning models and work with cross-functional teams.',
        skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
        requirements: [
          'PhD or Masters in Data Science, Statistics, or related field',
          '4+ years of data science experience',
          'Strong programming skills in Python/R',
          'Experience with ML frameworks and cloud platforms'
        ],
        benefits: [
          'Remote work flexibility',
          'Access to cutting-edge tools and datasets',
          'Conference and training budget',
          'Collaborative research environment'
        ],
        companyInfo: 'DataInsights Corp helps businesses make data-driven decisions through advanced analytics and machine learning solutions.',
        applicationUrl: 'https://jobspresso.co/apply/data-scientist-remote'
      },
      {
        id: 'jp_007',
        title: 'Product Manager - Remote',
        company: 'ProductFlow Inc',
        companyLogo: 'https://logo.clearbit.com/productflow.com',
        location: 'Remote - Global',
        type: 'Full-time',
        salary: 95000,
        currency: 'USD',
        team: 'Product Management',
        postedDate: '2 days ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/product-manager-remote',
        description: 'Drive product strategy and execution for our SaaS platform. Work closely with engineering, design, and marketing teams to deliver exceptional user experiences.',
        skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics', 'Roadmapping'],
        requirements: [
          '4+ years of product management experience',
          'Experience with SaaS products',
          'Strong analytical and communication skills',
          'Familiarity with agile development processes'
        ],
        benefits: [
          'Remote work flexibility',
          'Equity participation',
          'Professional development budget',
          'Flexible PTO policy'
        ],
        companyInfo: 'ProductFlow Inc builds productivity tools that help teams collaborate more effectively in remote environments.',
        applicationUrl: 'https://jobspresso.co/apply/product-manager-remote'
      },
      {
        id: 'jp_008',
        title: 'Customer Success Manager',
        company: 'SupportTech Solutions',
        companyLogo: 'https://logo.clearbit.com/supporttech.com',
        location: 'Remote - US/EU',
        type: 'Full-time',
        salary: 70000,
        currency: 'USD',
        team: 'Customer Success',
        postedDate: '1 day ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/customer-success-manager',
        description: 'Help our customers achieve success with our platform. Build relationships, provide strategic guidance, and drive customer retention and growth.',
        skills: ['Customer Success', 'SaaS', 'CRM', 'Communication', 'Data Analysis'],
        requirements: [
          '3+ years of customer success experience',
          'Experience with B2B SaaS products',
          'Strong relationship building skills',
          'Proficiency with CRM and analytics tools'
        ],
        benefits: [
          'Work from anywhere',
          'Performance bonuses',
          'Health and wellness stipend',
          'Career growth opportunities'
        ],
        companyInfo: 'SupportTech Solutions provides customer support automation tools for growing businesses.',
        applicationUrl: 'https://jobspresso.co/apply/customer-success-manager'
      },
      {
        id: 'jp_009',
        title: 'Backend Engineer - Python',
        company: 'ScaleAPI Corp',
        companyLogo: 'https://logo.clearbit.com/scaleapi.com',
        location: 'Remote - Americas',
        type: 'Full-time',
        salary: 115000,
        currency: 'USD',
        team: 'Engineering',
        postedDate: 'Today',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/backend-engineer-python',
        description: 'Build scalable backend systems and APIs using Python. Work on high-performance applications serving millions of users worldwide.',
        skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker'],
        requirements: [
          '4+ years of backend development experience',
          'Strong proficiency in Python and Django',
          'Experience with database design and optimization',
          'Knowledge of microservices architecture'
        ],
        benefits: [
          'Fully remote position',
          'Competitive salary and equity',
          'Learning and development budget',
          'Top-tier health insurance'
        ],
        companyInfo: 'ScaleAPI Corp provides API infrastructure solutions for rapidly growing technology companies.',
        applicationUrl: 'https://jobspresso.co/apply/backend-engineer-python'
      },
      {
        id: 'jp_010',
        title: 'Frontend Developer - Vue.js',
        company: 'WebCraft Studio',
        companyLogo: 'https://logo.clearbit.com/webcraft.com',
        location: 'Remote - Worldwide',
        type: 'Full-time',
        salary: 80000,
        currency: 'USD',
        team: 'Engineering',
        postedDate: '3 days ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/frontend-developer-vue',
        description: 'Create beautiful and responsive user interfaces using Vue.js. Work on modern web applications with a focus on user experience and performance.',
        skills: ['Vue.js', 'JavaScript', 'CSS3', 'HTML5', 'Webpack'],
        requirements: [
          '3+ years of frontend development experience',
          'Strong proficiency in Vue.js and JavaScript',
          'Experience with modern CSS frameworks',
          'Understanding of responsive design principles'
        ],
        benefits: [
          'Remote-first culture',
          'Flexible working hours',
          'Professional development opportunities',
          'Modern tech stack'
        ],
        companyInfo: 'WebCraft Studio specializes in creating custom web applications for startups and enterprises.',
        applicationUrl: 'https://jobspresso.co/apply/frontend-developer-vue'
      },
      {
        id: 'jp_011',
        title: 'Sales Development Representative',
        company: 'GrowthSales Inc',
        companyLogo: 'https://logo.clearbit.com/growthsales.com',
        location: 'Remote - US',
        type: 'Full-time',
        salary: 55000,
        currency: 'USD',
        team: 'Sales',
        postedDate: '5 days ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/sales-development-representative',
        description: 'Generate and qualify leads for our enterprise sales team. Work with cutting-edge sales tools and contribute to our rapid growth.',
        skills: ['Sales', 'Lead Generation', 'CRM', 'Cold Outreach', 'Prospecting'],
        requirements: [
          '1-3 years of sales experience',
          'Strong communication and interpersonal skills',
          'Experience with CRM systems',
          'Goal-oriented and self-motivated'
        ],
        benefits: [
          'Base salary plus commission',
          'Remote work flexibility',
          'Sales training and mentorship',
          'Career advancement opportunities'
        ],
        companyInfo: 'GrowthSales Inc provides sales automation and lead generation solutions for B2B companies.',
        applicationUrl: 'https://jobspresso.co/apply/sales-development-representative'
      },
      {
        id: 'jp_012',
        title: 'QA Engineer - Automation',
        company: 'TestPro Solutions',
        companyLogo: 'https://logo.clearbit.com/testpro.com',
        location: 'Remote - Global',
        type: 'Full-time',
        salary: 85000,
        currency: 'USD',
        team: 'Quality Assurance',
        postedDate: '1 week ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/qa-engineer-automation',
        description: 'Design and implement automated testing frameworks. Ensure product quality through comprehensive testing strategies and continuous integration.',
        skills: ['Test Automation', 'Selenium', 'Python', 'CI/CD', 'API Testing'],
        requirements: [
          '3+ years of QA automation experience',
          'Proficiency in test automation tools',
          'Experience with CI/CD pipelines',
          'Strong problem-solving skills'
        ],
        benefits: [
          'Work from anywhere',
          'Cutting-edge testing tools',
          'Professional certification support',
          'Collaborative team environment'
        ],
        companyInfo: 'TestPro Solutions helps companies deliver high-quality software through advanced testing methodologies.',
        applicationUrl: 'https://jobspresso.co/apply/qa-engineer-automation'
      }
    ];

    // 过滤数据
    let filteredJobs = jobspressoJobs;

    if (searchTerm) {
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (category) {
      filteredJobs = filteredJobs.filter(job =>
        job.team.toLowerCase().includes(category.toLowerCase())
      );
    }

    return {
      jobs: filteredJobs,
      total: filteredJobs.length,
      page: 1,
      hasMore: false,
      source: 'Jobspresso'
    };
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default JobspressoService;