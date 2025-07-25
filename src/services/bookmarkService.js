// 收藏工作服务
// 管理用户收藏的工作列表

class BookmarkService {
  constructor() {
    this.storageKey = 'huntjobs_bookmarks';
    this.bookmarks = this.loadBookmarks();
  }

  // 从本地存储加载收藏列表
  loadBookmarks() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  }

  // 保存收藏列表到本地存储
  saveBookmarks() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }

  // 添加工作到收藏列表
  addBookmark(job) {
    if (!job || !job.id) {
      console.error('Invalid job object');
      return false;
    }

    // 检查是否已经收藏
    if (this.isBookmarked(job.id)) {
      console.log('Job already bookmarked');
      return false;
    }

    // 添加收藏时间戳
    const bookmarkedJob = {
      ...job,
      bookmarkedAt: new Date().toISOString()
    };

    this.bookmarks.unshift(bookmarkedJob); // 添加到开头
    this.saveBookmarks();
    
    console.log(`Job "${job.title}" added to bookmarks`);
    return true;
  }

  // 从收藏列表移除工作
  removeBookmark(jobId) {
    const initialLength = this.bookmarks.length;
    this.bookmarks = this.bookmarks.filter(job => job.id !== jobId);
    
    if (this.bookmarks.length < initialLength) {
      this.saveBookmarks();
      console.log(`Job with ID "${jobId}" removed from bookmarks`);
      return true;
    }
    
    return false;
  }

  // 检查工作是否已收藏
  isBookmarked(jobId) {
    return this.bookmarks.some(job => job.id === jobId);
  }

  // 获取所有收藏的工作
  getBookmarks() {
    return [...this.bookmarks];
  }

  // 获取收藏数量
  getBookmarkCount() {
    return this.bookmarks.length;
  }

  // 切换收藏状态
  toggleBookmark(job) {
    if (this.isBookmarked(job.id)) {
      return this.removeBookmark(job.id);
    } else {
      return this.addBookmark(job);
    }
  }

  // 清空所有收藏
  clearAllBookmarks() {
    this.bookmarks = [];
    this.saveBookmarks();
    console.log('All bookmarks cleared');
  }

  // 搜索收藏的工作
  searchBookmarks(searchTerm) {
    if (!searchTerm) return this.getBookmarks();
    
    const term = searchTerm.toLowerCase();
    return this.bookmarks.filter(job => 
      job.title.toLowerCase().includes(term) ||
      job.company.toLowerCase().includes(term) ||
      job.location.toLowerCase().includes(term) ||
      (job.description && job.description.toLowerCase().includes(term))
    );
  }

  // 按分类筛选收藏的工作
  filterBookmarksByCategory(categoryId) {
    if (!categoryId) return this.getBookmarks();
    
    // 这里可以复用JobFeed中的分类匹配逻辑
    return this.bookmarks.filter(job => {
      // 简化的分类匹配逻辑
      const title = job.title.toLowerCase();
      const description = job.description ? job.description.toLowerCase() : '';
      
      switch (categoryId) {
        case 'ux-designer':
          return title.includes('ux') || title.includes('user experience');
        case 'ui-designer':
          return title.includes('ui') || title.includes('user interface');
        case 'frontend-developer':
          return title.includes('frontend') || title.includes('front-end') || title.includes('react');
        case 'backend-developer':
          return title.includes('backend') || title.includes('back-end') || title.includes('api');
        default:
          return true;
      }
    });
  }

  // 获取收藏统计信息
  getBookmarkStats() {
    const stats = {
      total: this.bookmarks.length,
      byCompany: {},
      byCategory: {},
      recentCount: 0
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    this.bookmarks.forEach(job => {
      // 按公司统计
      stats.byCompany[job.company] = (stats.byCompany[job.company] || 0) + 1;
      
      // 统计最近一周的收藏
      if (new Date(job.bookmarkedAt) > oneWeekAgo) {
        stats.recentCount++;
      }
    });

    return stats;
  }
}

// 创建单例实例
const bookmarkService = new BookmarkService();

export default bookmarkService;