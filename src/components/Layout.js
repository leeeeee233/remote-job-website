import React from 'react';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <div className="content-container">
        {children}
      </div>
    </div>
  );
};

export default Layout;