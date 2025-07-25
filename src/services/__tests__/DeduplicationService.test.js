// 去重服务测试
import DeduplicationService from '../DeduplicationService';

describe('DeduplicationService', () => {
  let deduplicationService;

  beforeEach(() => {
    deduplicationService = new DeduplicationService();
  });

  describe('基本去重功能', () => {
    test('应该移除完全相同的工作', () => {
      const jobs = [
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'Remote',
          source: 'LinkedIn'
        },
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'Remote',
          source: 'RemoteOK'
        }
      ];

      const uniqueJobs = deduplicationService.deduplicateJobs(jobs);
      expect(uniqueJobs).toHaveLength(1);
      expect(uniqueJobs[0].id).toBe('job1');
    });

    test('应该移除标题和公司相同的工作', () => {
      const jobs = [
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'Remote',
          source: 'LinkedIn'
        },
        {
          id: 'job2',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'New York',
          source: 'RemoteOK'
        }
      ];

      const uniqueJobs = deduplicationService.deduplicateJobs(jobs);
      expect(uniqueJobs).toHaveLength(1);
    });

    test('应该移除URL相同的工作', () => {
      const jobs = [
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          sourceUrl: 'https://example.com/job1',
          source: 'LinkedIn'
        },
        {
          id: 'job2',
          title: 'Senior Frontend Developer',
          company: 'Tech Corporation',
          sourceUrl: 'https://example.com/job1',
          source: 'RemoteOK'
        }
      ];

      const uniqueJobs = deduplicationService.deduplicateJobs(jobs);
      expect(uniqueJobs).toHaveLength(1);
    });
  });

  describe('相似度检测', () => {
    test('应该检测到高相似度的工作', () => {
      const jobs = [
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'Remote',
          source: 'LinkedIn'
        },
        {
          id: 'job2',
          title: 'Front-end Developer',
          company: 'TechCorp',
          location: 'Remote',
          source: 'RemoteOK'
        }
      ];

      const uniqueJobs = deduplicationService.deduplicateJobs(jobs);
      expect(uniqueJobs).toHaveLength(1);
    });

    test('应该保留不同的工作', () => {
      const jobs = [
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'Remote',
          source: 'LinkedIn'
        },
        {
          id: 'job2',
          title: 'Backend Developer',
          company: 'Another Corp',
          location: 'Remote',
          source: 'RemoteOK'
        }
      ];

      const uniqueJobs = deduplicationService.deduplicateJobs(jobs);
      expect(uniqueJobs).toHaveLength(2);
    });
  });

  describe('字符串标准化', () => {
    test('应该正确标准化字符串', () => {
      const normalized1 = deduplicationService.normalizeString('Tech Corp Inc.');
      const normalized2 = deduplicationService.normalizeString('TechCorp');
      
      expect(normalized1).toBe('tech corp');
      expect(normalized2).toBe('techcorp');
    });

    test('应该移除公司后缀', () => {
      const normalized = deduplicationService.normalizeString('Microsoft Corporation');
      expect(normalized).toBe('microsoft');
    });
  });

  describe('多源去重', () => {
    test('应该按优先级保留工作', () => {
      const jobsBySource = {
        'LinkedIn': [
          {
            id: 'job1',
            title: 'Frontend Developer',
            company: 'Tech Corp',
            source: 'LinkedIn'
          }
        ],
        'RemoteOK': [
          {
            id: 'job2',
            title: 'Frontend Developer',
            company: 'Tech Corp',
            source: 'RemoteOK'
          }
        ]
      };

      const uniqueJobs = deduplicationService.deduplicateMultipleSources(jobsBySource);
      expect(uniqueJobs).toHaveLength(1);
      expect(uniqueJobs[0].source).toBe('LinkedIn'); // LinkedIn优先级更高
    });
  });

  describe('统计信息', () => {
    test('应该正确记录统计信息', () => {
      const jobs = [
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          source: 'LinkedIn'
        },
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          source: 'RemoteOK'
        }
      ];

      deduplicationService.deduplicateJobs(jobs);
      const stats = deduplicationService.getStats();
      
      expect(stats.totalProcessed).toBe(2);
      expect(stats.duplicatesRemoved).toBe(1);
      expect(stats.duplicatesByType.exactId).toBe(1);
    });
  });

  describe('重置功能', () => {
    test('应该正确重置状态', () => {
      const jobs = [
        {
          id: 'job1',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          source: 'LinkedIn'
        }
      ];

      deduplicationService.deduplicateJobs(jobs);
      expect(deduplicationService.seenJobIds.size).toBe(1);
      
      deduplicationService.reset();
      expect(deduplicationService.seenJobIds.size).toBe(0);
      
      const stats = deduplicationService.getStats();
      expect(stats.totalProcessed).toBe(0);
    });
  });
});