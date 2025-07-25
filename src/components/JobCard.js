import React, { useState, useEffect } from 'react';
import bookmarkService from '../services/bookmarkService';
import './JobCard.css';

const JobCard = ({ job, onSelect }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  const formatSalary = (salary) => {
    if (!salary) return 'Salary not specified';
    return `$${salary}k /year`;
  };
  
  // 检查工作是否已收藏
  useEffect(() => {
    if (job && job.id) {
      setIsSaved(bookmarkService.isBookmarked(job.id));
    }
  }, [job]);

  const handleSaveToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!job || !job.id) {
      console.error('Invalid job object for bookmarking');
      return;
    }
    
    const success = bookmarkService.toggleBookmark(job);
    if (success) {
      setIsSaved(!isSaved);
      console.log(`Job ${isSaved ? 'removed from' : 'added to'} bookmarks: ${job.title}`);
    }
  };
  
  const handleInfoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // 这里可以添加显示更多信息的逻辑
  };
  
  const handleCardClick = () => {
    // 调用传入的onSelect函数，打开工作详情抽屉
    if (onSelect) {
      onSelect(job);
      console.log(`Viewing job details: ${job.title} at ${job.company}`);
    }
  };

  return (
    <div className="job-card" onClick={handleCardClick}>
      <div className="job-card-left">
        <div className="company-logo">
          <img 
            src={job.companyLogo} 
            alt={job.company} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/48?text=' + job.company.charAt(0);
            }}
          />
        </div>
      </div>
      
      <div className="job-card-content">
        <div className="job-header">
          <h3 className="job-title">{job.title}</h3>
          <div className="job-company">{job.company}</div>
          
          <div className="job-meta">
            <div className="job-location">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="location-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {job.location}
            </div>
            
            <div className="job-stats">
              {job.views && (
                <div className="job-views">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="views-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {job.views} views
                </div>
              )}
              
              {job.applicants && (
                <div className="job-applicants">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="applicants-icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  {job.applicants} applied
                </div>
              )}
            </div>
          </div>
          
          <div className="job-details">
            <div className="job-posted">
              {job.postedDate === 'Today' ? (
                <span className="today-tag">Today</span>
              ) : (
                <span>{job.postedDate}</span>
              )}
            </div>
            
            <div className="job-type">
              <span className="job-type-tag">{job.type}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="job-card-right">
        <div className="job-actions">
          <button 
            className={`job-action-btn save-btn ${isSaved ? 'saved' : ''}`}
            onClick={handleSaveToggle}
            aria-label={isSaved ? "Unsave job" : "Save job"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button 
            className="job-action-btn info-btn"
            onClick={handleInfoClick}
            aria-label="More information"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>
        
        <div className="job-team">
          <div className="team-label">Team</div>
          <div className="team-name">{job.team}</div>
        </div>
        
        <div className="job-salary">
          {formatSalary(job.salary)}
        </div>
      </div>
    </div>
  );
};

export default JobCard;