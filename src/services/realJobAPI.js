// 使用真实的Job API服务
// 这里集成一些公开的工作API

import logoService from './logoService';

// RemoteOK API (免费，无需API密钥)
export const fetchRemoteOKJobs = async () => {
  try {
    console.log('🔄 尝试获取RemoteOK工作数据...');
    
    // 尝试多个CORS代理，提高成功率
    const corsProxies = [
      'https://api.allorigins.win/get?url=',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    const remoteOkUrl = 'https://remoteok.io/api';
    let data = null;
    let lastError = null;
    
    // 尝试不同的代理
    for (const corsProxy of corsProxies) {
      try {
        console.log(`🔗 尝试使用代理: ${corsProxy}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        let fetchUrl = `${corsProxy}${encodeURIComponent(remoteOkUrl)}`;
        
        const response = await fetch(fetchUrl, {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let responseData = await response.json();
        
        // 处理allorigins的响应格式
        if (corsProxy.includes('allorigins') && responseData.contents) {
          data = JSON.parse(responseData.contents);
        } else {
          data = responseData;
        }
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('✅ 成功获取RemoteOK数据，工作数量:', data.length);
          break; // 成功获取数据，跳出循环
        } else {
          throw new Error('返回的数据格式不正确或为空');
        }
      } catch (error) {
        console.warn(`❌ 代理 ${corsProxy} 失败:`, error.message);
        lastError = error;
        continue; // 尝试下一个代理
      }
    }
    
    // 如果所有代理都失败，返回一些基本的示例数据以确保网站可用
    if (!data) {
      console.warn('⚠️ 所有API都失败，返回示例数据');
      return await generateSampleJobs();
    }
    
    // RemoteOK返回的第一个元素是统计信息，需要跳过
    const jobs = data.slice(1);
    
    return Promise.all(jobs.map(async job => ({
      id: job.id,
      title: job.position,
      company: job.company,
      companyLogo: await logoService.getCompanyLogo(job.company, job.company_logo),
      location: job.location || 'Remote',
      type: job.job_type || 'Full-time',
      salary: estimateSalary(job.position),
      team: extractTeam(job.position),
      postedDate: formatDate(job.date),
      views: Math.floor(Math.random() * 500) + 50,
      applicants: Math.floor(Math.random() * 50) + 5,
      description: job.description || 'No description available',
      skills: extractSkills(job.tags || []),
      source: 'RemoteOK',
      sourceUrl: job.url || `https://remoteok.io/l/${job.id}`,
      sourceId: job.id
    })));
  } catch (error) {
    console.error('Error fetching RemoteOK jobs:', error);
    // 如果API调用失败，返回空数组
    return [];
  }
};

// GitHub Jobs API (通过公共API代理)
export const fetchGitHubJobs = async () => {
  try {
    const response = await fetch('https://jobs.github.com/positions.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub jobs: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.company_logo,
      location: job.location || 'Remote',
      type: job.type || 'Full-time',
      salary: estimateSalary(job.title),
      team: extractTeam(job.title),
      postedDate: formatDate(job.created_at),
      views: Math.floor(Math.random() * 500) + 50,
      applicants: Math.floor(Math.random() * 50) + 5,
      description: job.description || 'No description available',
      skills: extractSkills(job.description || ''),
      source: 'GitHub Jobs'
    }));
  } catch (error) {
    console.error('Error fetching GitHub jobs:', error);
    return [];
  }
};

// WeWorkRemotely API (通过RSS2JSON)
export const fetchWeWorkRemotelyJobs = async (category = 'all') => {
  try {
    console.log('🔄 尝试获取WeWorkRemotely工作数据...');
    
    // 获取RSS feed URL
    const categoryPath = {
      'programming': 'remote-jobs/remote-programming-jobs',
      'design': 'remote-jobs/remote-design-jobs',
      'marketing': 'remote-jobs/remote-marketing-jobs',
      'management': 'remote-jobs/remote-management-executive-jobs',
      'sales': 'remote-jobs/remote-sales-jobs',
      'customer-support': 'remote-jobs/remote-customer-support-jobs',
      'all': 'categories/remote-jobs'
    }[category] || 'categories/remote-jobs';
    
    const rssUrl = `https://weworkremotely.com/${categoryPath}.rss`;
    
    // 尝试多个RSS2JSON服务
    const rss2jsonServices = [
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`
    ];
    
    let data = null;
    let lastError = null;
    
    for (const serviceUrl of rss2jsonServices) {
      try {
        console.log(`🔗 尝试RSS服务: ${serviceUrl.includes('rss2json') ? 'RSS2JSON' : 'AllOrigins'}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(serviceUrl, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        // 处理不同服务的响应格式
        if (serviceUrl.includes('rss2json')) {
          if (responseData.status !== 'ok') {
            throw new Error('Invalid response from RSS2JSON');
          }
          data = responseData;
        } else {
          // AllOrigins返回的是原始RSS内容，需要解析
          // 这里简化处理，如果需要可以添加XML解析
          throw new Error('AllOrigins RSS parsing not implemented');
        }
        
        console.log('✅ 成功获取WeWorkRemotely数据，工作数量:', data.items?.length || 0);
        break;
      } catch (error) {
        console.warn(`❌ RSS服务失败:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    if (!data) {
      throw lastError || new Error('所有RSS服务都失败了');
    }
    
    return Promise.all(data.items.map(async (item, index) => {
      // 从标题中提取公司名称和职位
      const titleMatch = item.title.match(/(.*?):(.*)/);
      const company = titleMatch ? titleMatch[1].trim() : 'Unknown Company';
      const title = titleMatch ? titleMatch[2].trim() : item.title;
      
      return {
        id: `wwr-${index}-${Date.now()}`,
        title: title,
        company: company,
        companyLogo: await logoService.getCompanyLogo(company),
        location: 'Remote',
        type: 'Full-time',
        salary: estimateSalary(title),
        team: extractTeam(title),
        postedDate: formatDate(item.pubDate),
        views: Math.floor(Math.random() * 500) + 50,
        applicants: Math.floor(Math.random() * 50) + 5,
        description: item.description || item.content || 'No description available',
        skills: extractSkills(item.description || item.content || title),
        source: 'WeWorkRemotely',
        sourceUrl: item.link,
        sourceId: `wwr-${index}-${Date.now()}`
      };
    }));
  } catch (error) {
    console.error('Error fetching WeWorkRemotely jobs:', error);
    return [];
  }
};

// 辅助函数
const formatDate = (dateString) => {
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

const extractSkills = (description) => {
  const commonSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Angular', 'Vue.js', 'Java', 'C#', '.NET',
    'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps',
    'Git', 'Linux', 'Figma', 'Sketch', 'Adobe XD', 'UI/UX', 'CSS', 'HTML', 'REST API', 'GraphQL'
  ];

  const foundSkills = commonSkills.filter(skill => 
    typeof description === 'string' && description.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills.length > 0 ? foundSkills.slice(0, 5) : ['Remote Work'];
};

const extractTeam = (title) => {
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

const estimateSalary = (title) => {
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

// 综合获取真实工作数据
export const fetchRealRemoteJobs = async (searchTerm = '', filters = {}) => {
  try {
    // 并行调用多个API
    const [remoteOKJobs, githubJobs, wwrJobs] = await Promise.allSettled([
      fetchRemoteOKJobs(),
      fetchGitHubJobs(),
      fetchWeWorkRemotelyJobs(filters.category)
    ]);
    
    let allJobs = [
      ...(remoteOKJobs.status === 'fulfilled' ? remoteOKJobs.value : []),
      ...(githubJobs.status === 'fulfilled' ? githubJobs.value : []),
      ...(wwrJobs.status === 'fulfilled' ? wwrJobs.value : [])
    ];
    
    // 如果所有API都失败，返回空数组
    if (allJobs.length === 0) {
      throw new Error('Failed to fetch jobs from any source');
    }
    
    // 按搜索词过滤
    if (searchTerm) {
      allJobs = allJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 去重和排序
    const uniqueJobs = removeDuplicateJobs(allJobs);
    const sortedJobs = uniqueJobs.sort((a, b) => {
      // 优先显示今天发布的工作
      if (a.postedDate === 'Today' && b.postedDate !== 'Today') return -1;
      if (a.postedDate !== 'Today' && b.postedDate === 'Today') return 1;
      return 0;
    });
    
    return {
      jobs: sortedJobs,
      total: sortedJobs.length,
      sources: ['RemoteOK', 'WeWorkRemotely', 'GitHub Jobs'].filter(source => 
        allJobs.some(job => job.source === source)
      )
    };
  } catch (error) {
    console.error('Error fetching real remote jobs:', error);
    throw error;
  }
};

// 生成示例工作数据（当所有API都失败时使用）
const generateSampleJobs = async () => {
  console.log('🔄 生成示例工作数据...');
  
  const sampleJobs = [
    {
      id: 'sample-1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      companyLogo: 'https://logo.clearbit.com/techcorp.com',
      location: 'Remote - Global',
      type: 'Full-time',
      salary: 120,
      team: 'Frontend',
      postedDate: 'Today',
      views: 156,
      applicants: 12,
      description: 'We are looking for a Senior Frontend Developer to join our remote team. You will work on building modern web applications using React and TypeScript.',
      skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML'],
      source: 'Sample Data',
      sourceUrl: 'https://example.com/jobs/1',
      sourceId: 'sample-1'
    },
    {
      id: 'sample-2',
      title: 'Backend Engineer',
      company: 'DataFlow Inc',
      companyLogo: 'https://logo.clearbit.com/dataflow.com',
      location: 'Remote - US',
      type: 'Full-time',
      salary: 115,
      team: 'Backend',
      postedDate: 'Yesterday',
      views: 89,
      applicants: 8,
      description: 'Join our backend team to build scalable APIs and microservices. Experience with Node.js and cloud platforms required.',
      skills: ['Node.js', 'Python', 'AWS', 'MongoDB', 'Docker'],
      source: 'Sample Data',
      sourceUrl: 'https://example.com/jobs/2',
      sourceId: 'sample-2'
    },
    {
      id: 'sample-3',
      title: 'UX Designer',
      company: 'DesignStudio',
      companyLogo: 'https://logo.clearbit.com/designstudio.com',
      location: 'Remote - Europe',
      type: 'Full-time',
      salary: 95,
      team: 'UX/UI',
      postedDate: '2 days ago',
      views: 234,
      applicants: 15,
      description: 'We need a talented UX Designer to create intuitive user experiences for our digital products. Remote-first company with flexible hours.',
      skills: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'UI/UX'],
      source: 'Sample Data',
      sourceUrl: 'https://example.com/jobs/3',
      sourceId: 'sample-3'
    }
  ];
  
  return sampleJobs;
};

// 去重函数
const removeDuplicateJobs = (jobs) => {
  const seen = new Set();
  return jobs.filter(job => {
    const key = `${job.title}-${job.company}`.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export default {
  fetchRealRemoteJobs,
  fetchRemoteOKJobs,
  fetchGitHubJobs,
  fetchWeWorkRemotelyJobs
};