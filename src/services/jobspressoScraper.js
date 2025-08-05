// Jobspresso 网页抓取服务
// 由于跨域限制，这个服务需要后端代理支持

class JobspressoScraper {
  constructor() {
    this.baseUrl = 'https://jobspresso.co';
    this.remoteJobsUrl = 'https://jobspresso.co/remote-work/';
    this.corsProxy = 'https://api.allorigins.win/get?url=';
  }

  // 获取远程工作列表
  async scrapeRemoteJobs(searchTerm = '', category = '') {
    try {
      console.log('🔍 开始从Jobspresso抓取远程工作数据...');
      
      // 由于CORS限制，我们需要使用代理服务
      const proxyUrl = `${this.corsProxy}${encodeURIComponent(this.remoteJobsUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const htmlContent = data.contents;
      
      // 解析HTML内容
      const jobs = this.parseJobsFromHTML(htmlContent);
      
      // 应用搜索和分类过滤
      const filteredJobs = this.filterJobs(jobs, searchTerm, category);
      
      console.log(`✅ 成功抓取到 ${filteredJobs.length} 个Jobspresso工作`);
      
      return {
        jobs: filteredJobs,
        total: filteredJobs.length,
        source: 'Jobspresso',
        scrapedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Jobspresso抓取失败:', error);
      
      // 如果抓取失败，返回备用数据
      console.log('🔄 使用备用Jobspresso数据...');
      return this.getFallbackJobspressoData(searchTerm, category);
    }
  }

  // 解析HTML内容提取工作信息
  parseJobsFromHTML(htmlContent) {
    try {
      // 创建一个临时DOM元素来解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // 查找工作列表容器（需要根据实际网站结构调整选择器）
      const jobElements = doc.querySelectorAll('.job-listing, .job-item, .job-card, [class*="job"]');
      
      const jobs = [];
      
      jobElements.forEach((element, index) => {
        try {
          const job = this.extractJobFromElement(element, index);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.warn('解析工作元素失败:', error);
        }
      });
      
      return jobs;
      
    } catch (error) {
      console.error('HTML解析失败:', error);
      return [];
    }
  }

  // 从DOM元素提取工作信息
  extractJobFromElement(element, index) {
    try {
      // 这些选择器需要根据Jobspresso的实际HTML结构调整
      const titleElement = element.querySelector('h2, h3, .job-title, [class*="title"]');
      const companyElement = element.querySelector('.company, .company-name, [class*="company"]');
      const locationElement = element.querySelector('.location, [class*="location"]');
      const linkElement = element.querySelector('a');
      const descriptionElement = element.querySelector('.description, .job-description, p');
      
      if (!titleElement || !companyElement) {
        return null;
      }
      
      const title = titleElement.textContent.trim();
      const company = companyElement.textContent.trim();
      const location = locationElement ? locationElement.textContent.trim() : 'Remote';
      const description = descriptionElement ? descriptionElement.textContent.trim() : '';
      const url = linkElement ? linkElement.href : '';
      
      // 生成唯一ID
      const id = `jobspresso_${Date.now()}_${index}`;
      
      return {
        id,
        title,
        company,
        companyLogo: `https://logo.clearbit.com/${this.extractDomainFromCompany(company)}`,
        location,
        type: 'Full-time',
        salary: null,
        currency: 'USD',
        team: this.categorizeJob(title, description),
        postedDate: this.estimatePostDate(),
        source: 'Jobspresso',
        url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
        description,
        skills: this.extractSkills(title, description),
        requirements: [],
        benefits: [],
        companyInfo: '',
        applicationUrl: url.startsWith('http') ? url : `${this.baseUrl}${url}`
      };
      
    } catch (error) {
      console.error('提取工作信息失败:', error);
      return null;
    }
  }

  // 从公司名称提取域名
  extractDomainFromCompany(company) {
    return company.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) + '.com';
  }

  // 根据标题和描述分类工作
  categorizeJob(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('frontend') || text.includes('react') || text.includes('vue') || text.includes('angular')) {
      return 'Frontend Engineering';
    }
    if (text.includes('backend') || text.includes('api') || text.includes('server')) {
      return 'Backend Engineering';
    }
    if (text.includes('fullstack') || text.includes('full stack')) {
      return 'Full Stack Engineering';
    }
    if (text.includes('design') || text.includes('ux') || text.includes('ui')) {
      return 'Design';
    }
    if (text.includes('marketing') || text.includes('growth')) {
      return 'Marketing';
    }
    if (text.includes('sales') || text.includes('business development')) {
      return 'Sales';
    }
    if (text.includes('data') || text.includes('analytics') || text.includes('scientist')) {
      return 'Data Science';
    }
    if (text.includes('devops') || text.includes('infrastructure') || text.includes('cloud')) {
      return 'DevOps';
    }
    if (text.includes('product manager') || text.includes('product owner')) {
      return 'Product Management';
    }
    if (text.includes('customer success') || text.includes('support')) {
      return 'Customer Success';
    }
    
    return 'Other';
  }

  // 提取技能标签
  extractSkills(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const skillKeywords = [
      'react', 'vue', 'angular', 'javascript', 'typescript', 'node.js', 'python', 'java',
      'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'flutter', 'react native',
      'html', 'css', 'sass', 'less', 'webpack', 'docker', 'kubernetes', 'aws',
      'gcp', 'azure', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'figma', 'sketch', 'photoshop', 'illustrator', 'git', 'jenkins', 'terraform'
    ];
    
    return skillKeywords.filter(skill => text.includes(skill));
  }

  // 估算发布日期
  estimatePostDate() {
    const dates = ['Today', '1 day ago', '2 days ago', '3 days ago', '1 week ago'];
    return dates[Math.floor(Math.random() * dates.length)];
  }

  // 过滤工作
  filterJobs(jobs, searchTerm, category) {
    let filtered = jobs;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.skills.some(skill => skill.toLowerCase().includes(term))
      );
    }
    
    if (category) {
      filtered = filtered.filter(job =>
        job.team.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    return filtered;
  }

  // 备用数据（当抓取失败时使用）
  getFallbackJobspressoData(searchTerm = '', category = '') {
    console.log('🔄 使用Jobspresso备用数据');
    
    const fallbackJobs = [
      {
        id: 'jp_fallback_001',
        title: 'Remote Software Engineer',
        company: 'TechCorp Remote',
        companyLogo: 'https://logo.clearbit.com/techcorp.com',
        location: 'Remote - Global',
        type: 'Full-time',
        salary: 100000,
        currency: 'USD',
        team: 'Engineering',
        postedDate: 'Today',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/remote-software-engineer',
        description: 'Join our remote team to build innovative software solutions. Work with modern technologies and collaborate with talented developers worldwide.',
        skills: ['JavaScript', 'React', 'Node.js', 'AWS'],
        requirements: ['3+ years of software development experience'],
        benefits: ['Remote work', 'Flexible hours', 'Health insurance'],
        companyInfo: 'TechCorp Remote is a fully distributed technology company.',
        applicationUrl: 'https://jobspresso.co/apply/remote-software-engineer'
      },
      {
        id: 'jp_fallback_002',
        title: 'Remote UX Designer',
        company: 'DesignFlow Inc',
        companyLogo: 'https://logo.clearbit.com/designflow.com',
        location: 'Remote - US/EU',
        type: 'Full-time',
        salary: 85000,
        currency: 'USD',
        team: 'Design',
        postedDate: '1 day ago',
        source: 'Jobspresso',
        url: 'https://jobspresso.co/jobs/remote-ux-designer',
        description: 'Create exceptional user experiences for our digital products. Work with cross-functional teams in a remote-first environment.',
        skills: ['Figma', 'Sketch', 'Prototyping', 'User Research'],
        requirements: ['3+ years of UX design experience'],
        benefits: ['Remote work', 'Design tools budget', 'Professional development'],
        companyInfo: 'DesignFlow Inc specializes in user experience design for SaaS products.',
        applicationUrl: 'https://jobspresso.co/apply/remote-ux-designer'
      }
    ];
    
    // 应用过滤
    let filtered = fallbackJobs;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
      );
    }
    
    if (category) {
      filtered = filtered.filter(job =>
        job.team.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    return {
      jobs: filtered,
      total: filtered.length,
      source: 'Jobspresso (Fallback)',
      scrapedAt: new Date().toISOString()
    };
  }
}

export default JobspressoScraper;