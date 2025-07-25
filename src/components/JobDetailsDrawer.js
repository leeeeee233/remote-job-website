import React, { useEffect, useRef, useState } from 'react';
import bookmarkService from '../services/bookmarkService';
import './JobDetailsDrawer.css';

const JobDetailsDrawer = ({ job, isOpen, onClose, onApply }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // 用于管理焦点的引用
  const closeButtonRef = useRef(null);
  const applyButtonRef = useRef(null);
  const lastFocusedElement = useRef(null);
  const drawerRef = useRef(null);
  
  // 格式化薪资显示
  const formatSalary = (salary) => {
    if (!salary) return 'Salary not specified';
    return `$${salary}k /year`;
  };

  // 清理HTML标签和格式化文本，使其适合用户阅读
  const cleanJobDescription = (text) => {
    if (!text) return '';
    
    // 移除HTML标签
    let cleanText = text.replace(/<[^>]*>/g, '');
    
    // 解码HTML实体
    const htmlEntities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&hellip;': '...',
      '&mdash;': '—',
      '&ndash;': '–',
      '&rsquo;': "'",
      '&lsquo;': "'",
      '&rdquo;': '"',
      '&ldquo;': '"'
    };
    
    Object.entries(htmlEntities).forEach(([entity, char]) => {
      cleanText = cleanText.replace(new RegExp(entity, 'g'), char);
    });
    
    // 清理多余的空白字符
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // 移除多余的换行符，但保留段落分隔
    cleanText = cleanText.replace(/\n\s*\n/g, '\n\n');
    
    // 移除开头和结尾的特殊字符
    cleanText = cleanText.replace(/^[^\w\s]+|[^\w\s.!?]+$/g, '');
    
    // 确保句子以适当的标点结尾
    if (cleanText && !cleanText.match(/[.!?]$/)) {
      cleanText += '.';
    }
    
    return cleanText;
  };
  
  // 非模态抽屉不需要点击外部关闭的逻辑
  // 用户可以通过点击关闭按钮来关闭抽屉
  
  // 处理ESC键关闭抽屉和键盘导航
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Tab') {
        // 捕获Tab键，限制焦点在抽屉内
        const focusableElements = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && document.activeElement === firstElement) {
          // 如果按下Shift+Tab且焦点在第一个元素上，则移至最后一个元素
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          // 如果按下Tab且焦点在最后一个元素上，则移至第一个元素
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      
      // 保存当前焦点并将焦点移至抽屉
      lastFocusedElement.current = document.activeElement;
      
      // 延迟聚焦以确保抽屉已完全打开
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 100);
    } else if (lastFocusedElement.current) {
      // 关闭抽屉时恢复焦点
      lastFocusedElement.current.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // 检查收藏状态
  useEffect(() => {
    if (job && job.id) {
      setIsBookmarked(bookmarkService.isBookmarked(job.id));
    }
  }, [job]);

  // 处理收藏切换
  const handleBookmarkToggle = () => {
    if (!job || !job.id) {
      console.error('Invalid job object for bookmarking');
      return;
    }
    
    const success = bookmarkService.toggleBookmark(job);
    if (success) {
      setIsBookmarked(!isBookmarked);
      console.log(`Job ${isBookmarked ? 'removed from' : 'added to'} bookmarks: ${job.title}`);
    }
  };

  // 模拟加载效果 - 在实际应用中，这会是真实的数据加载
  useEffect(() => {
    if (isOpen && job) {
      setIsLoading(true);
      setError(null);
      
      // 模拟数据加载延迟
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, job]);
  
  // 如果没有选中的工作，不渲染抽屉
  if (!job) return null;
  
  return (
    <div className={`job-details-drawer-overlay ${isOpen ? 'open' : ''}`}>
      <div 
        ref={drawerRef}
        className={`job-details-drawer ${isOpen ? 'open' : ''}`}
        role="complementary"
        aria-labelledby="job-details-title"
      >
        <div className="drawer-header">
          <button 
            ref={closeButtonRef}
            className="close-button" 
            onClick={onClose}
            aria-label="Close job details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="drawer-content">
          {isLoading ? (
            <div className="drawer-loading">
              <div className="loading-spinner"></div>
              <p>Loading job details...</p>
            </div>
          ) : error ? (
            <div className="drawer-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>Failed to load job details</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={() => setIsLoading(true)}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="job-company-header">
                <div className="company-logo-large">
                  <img 
                    src={job.companyLogo} 
                    alt={job.company} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/80?text=' + job.company.charAt(0);
                    }}
                  />
                </div>
                <div className="job-company-info">
                  <h2 id="job-details-title" className="job-title-large">{job.title}</h2>
                  <div className="company-location">
                    <div className="company-name">{job.company}</div>
                    <div className="job-location">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {job.location}
                    </div>
                  </div>
                </div>
              </div>
          
          <div className="job-details-section">
            <div className="job-meta-info">
              <div className="job-meta-item">
                <div className="meta-label">Team</div>
                <div className="meta-value">{job.team}</div>
              </div>
              <div className="job-meta-item">
                <div className="meta-label">Salary</div>
                <div className="meta-value salary">{formatSalary(job.salary)}</div>
              </div>
              <div className="job-meta-item">
                <div className="meta-label">Job Type</div>
                <div className="meta-value">{job.type}</div>
              </div>
            </div>
          </div>
          
          <div className="job-details-section">
            <h3>Minimum Qualifications</h3>
            {job.minimumQualifications ? (
              <ul className="qualifications-list">
                {job.minimumQualifications.map((qualification, index) => (
                  <li key={index} className="qualification-item">{qualification}</li>
                ))}
              </ul>
            ) : (
              <p className="no-data">No minimum qualifications specified</p>
            )}
          </div>
          
          <div className="job-details-section">
            <h3>Preferred Qualifications</h3>
            {job.preferredQualifications ? (
              <ul className="qualifications-list">
                {job.preferredQualifications.map((qualification, index) => (
                  <li key={index} className="qualification-item">{qualification}</li>
                ))}
              </ul>
            ) : (
              <p className="no-data">No preferred qualifications specified</p>
            )}
          </div>
          
          <div className="job-details-section">
            <h3>About the Job</h3>
            <div className="job-about">
              {job.aboutJob ? (
                <>
                  <p className={`job-description ${!isDescriptionExpanded ? 'truncated' : ''}`}>
                    {cleanJobDescription(job.aboutJob)}
                  </p>
                  {cleanJobDescription(job.aboutJob).length > 300 && (
                    <button 
                      className="read-more-button" 
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </>
              ) : (
                <p className="job-description">{cleanJobDescription(job.description)}</p>
              )}
            </div>
          </div>
          
          <div className="job-details-section">
            <h3>About {job.company}</h3>
            {job.companyInfo ? (
              <p className="company-info">{job.companyInfo}</p>
            ) : (
              <p className="no-data">No company information available</p>
            )}
          </div>
          
          <div className="job-details-section">
            <h3>Skills</h3>
            <div className="skills-list">
              {job.skills && job.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
          
          <div className="job-details-section">
            <h3>Job Stats</h3>
            <div className="job-stats-info">
              <div className="job-stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>{job.views} views</span>
              </div>
              <div className="job-stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{job.applicants} applied</span>
              </div>
              <div className="job-stat-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Posted {job.postedDate}</span>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
        
        <div className="drawer-footer">
          <button 
            className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmarkToggle}
            aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button 
            ref={applyButtonRef}
            className="apply-button"
            onClick={() => onApply && onApply(job.id)}
            aria-label="Apply for this job"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsDrawer;