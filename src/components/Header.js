import React, { useState } from 'react';
import './Header.css';

const Header = ({ onSearch, onFilter, dynamicCategories = [] }) => {
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
  

  

  
  return (
    <header className="header">
      <div className="header-content">
        <div className="brand-logo">
          <h1 className="brand-name">Huntjob</h1>
          <span className="brand-tagline">远程工作机会平台</span>
        </div>
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