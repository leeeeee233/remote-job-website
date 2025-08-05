import React, { useState } from 'react';
import './Header.css';

const Header = ({ onSearch, onFilter, onRefresh, dynamicCategories = [], isRefreshing = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // 使用动态生成的分类，如果没有则使用默认分类
  const filterOptions = dynamicCategories.length > 0 ? dynamicCategories : [
    { id: 'ux-designer', label: 'UX Designer' },
    { id: 'ui-designer', label: 'UI Designer' },
    { id: 'product-designer', label: 'Product Designer' },
    { id: 'visual-identity', label: 'Visual Identity' }
  ];
  
  const handleFilterClick = (filterId) => {
    let newFilters;
    if (activeFilters.includes(filterId)) {
      newFilters = activeFilters.filter(id => id !== filterId);
    } else {
      newFilters = [...activeFilters, filterId];
    }
    setActiveFilters(newFilters);
    
    if (onFilter) {
      onFilter(newFilters);
    }
  };
  
  const handleClearFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
    
    if (onSearch) {
      onSearch('');
    }
    
    if (onFilter) {
      onFilter([]);
    }
  };
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // 实时搜索，使用防抖处理
    if (onSearch) {
      // 使用setTimeout模拟防抖，实际项目中可以使用lodash的debounce函数
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        onSearch(value);
      }, 300); // 300ms的延迟，避免频繁触发搜索
    }
  };

  // 处理刷新按钮点击
  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
    }
  };
  
  return (
    <header className="header">
      <div className="header-content">
        <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by Category, Company or ..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="search-input"
            />
            <button className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            {/* 小刷新icon */}
            <button 
              className="refresh-icon-button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="刷新获取最新工作信息"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={isRefreshing ? 'spinning' : ''}
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
          </div>
          
          <div className="filter-tags">
            {filterOptions.map(filter => (
              <button
                key={filter.id}
                className={`filter-tag ${activeFilters.includes(filter.id) ? 'active' : ''}`}
                onClick={() => handleFilterClick(filter.id)}
              >
                {filter.label}
              </button>
            ))}
            
            {(activeFilters.length > 0 || searchTerm) && (
              <button className="clear-filters" onClick={handleClearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;