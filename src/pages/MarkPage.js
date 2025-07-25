import React, { useState, useEffect } from 'react';
import JobCard from '../components/JobCard';
import JobDetailsDrawer from '../components/JobDetailsDrawer';
import bookmarkService from '../services/bookmarkService';
import './MarkPage.css';

const MarkPage = () => {
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // 加载收藏的工作
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    setLoading(true);
    try {
      const bookmarks = bookmarkService.getBookmarks();
      const bookmarkStats = bookmarkService.getBookmarkStats();
      
      setBookmarkedJobs(bookmarks);
      setFilteredJobs(bookmarks);
      setStats(bookmarkStats);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索收藏的工作
  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredJobs(bookmarkedJobs);
    } else {
      const results = bookmarkService.searchBookmarks(term);
      setFilteredJobs(results);
    }
  };

  // 处理工作卡片点击
  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setIsDrawerOpen(true);
  };

  // 处理关闭抽屉
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // 处理申请工作
  const handleApplyJob = (jobId) => {
    const job = selectedJob;
    
    if (!job) {
      console.error('No selected job found');
      return;
    }
    
    // 打开工作链接
    const openLink = (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    if (job.sourceUrl) {
      openLink(job.sourceUrl);
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} job`)}`;
      openLink(searchUrl);
    }
  };

  // 移除收藏
  const handleRemoveBookmark = (jobId) => {
    if (bookmarkService.removeBookmark(jobId)) {
      loadBookmarks(); // 重新加载收藏列表
    }
  };

  // 清空所有收藏
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all bookmarked jobs?')) {
      bookmarkService.clearAllBookmarks();
      loadBookmarks();
    }
  };

  // 格式化收藏时间
  const formatBookmarkDate = (dateString) => {
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

  return (
    <div className="mark-page">
      <div className="mark-header">
        <div className="mark-title-section">
          <h1 className="mark-title">
            <span className="mark-icon">♡</span>
            Bookmarked Jobs
          </h1>
          <p className="mark-subtitle">
            {bookmarkedJobs.length} job{bookmarkedJobs.length !== 1 ? 's' : ''} saved for later
          </p>
        </div>

        {bookmarkedJobs.length > 0 && (
          <div className="mark-actions">
            <button 
              className="clear-all-button"
              onClick={handleClearAll}
              title="Clear all bookmarks"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 搜索栏 */}
      {bookmarkedJobs.length > 0 && (
        <div className="mark-search">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search bookmarked jobs..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {stats && bookmarkedJobs.length > 0 && (
        <div className="mark-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Saved</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.recentCount}</span>
            <span className="stat-label">This Week</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{Object.keys(stats.byCompany).length}</span>
            <span className="stat-label">Companies</span>
          </div>
        </div>
      )}

      {/* 工作列表 */}
      <div className="mark-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading bookmarked jobs...</p>
          </div>
        ) : bookmarkedJobs.length === 0 ? (
          <div className="empty-bookmarks">
            <div className="empty-icon">♡</div>
            <h3>No bookmarked jobs yet</h3>
            <p>Start browsing jobs and bookmark the ones you're interested in!</p>
            <button 
              className="browse-jobs-button"
              onClick={() => window.location.href = '/'}
            >
              Browse Jobs
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="no-search-results">
            <h3>No jobs found</h3>
            <p>Try adjusting your search terms</p>
            <button 
              className="clear-search-button"
              onClick={() => handleSearch('')}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="bookmarked-jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bookmarked-job-item">
                <JobCard 
                  job={job} 
                  onSelect={() => handleJobSelect(job)}
                  isBookmarked={true}
                />
                <div className="bookmark-meta">
                  <span className="bookmark-date">
                    Saved {formatBookmarkDate(job.bookmarkedAt)}
                  </span>
                  <button 
                    className="remove-bookmark-button"
                    onClick={() => handleRemoveBookmark(job.id)}
                    title="Remove from bookmarks"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 工作详情抽屉 */}
      <JobDetailsDrawer 
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onApply={handleApplyJob}
      />
    </div>
  );
};

export default MarkPage;