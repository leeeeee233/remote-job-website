import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  
  const filterOptions = [
    { id: 'ux-designer', label: 'UX Designer' },
    { id: 'ui-designer', label: 'UI Designer' },
    { id: 'product-designer', label: 'Product Designer' },
    { id: 'visual-identity', label: 'Visual Identity' }
  ];
  
  const handleFilterClick = (filterId) => {
    if (activeFilters.includes(filterId)) {
      setActiveFilters(activeFilters.filter(id => id !== filterId));
    } else {
      setActiveFilters([...activeFilters, filterId]);
    }
  };
  
  const handleClearFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
    onSearch('', []);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm, activeFilters);
  };
  
  return (
    <div className="search-bar-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search by Category, Company or ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍
          </button>
        </div>
      </form>
      
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
  );
};

export default SearchBar;