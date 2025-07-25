import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import JobFeed from './pages/JobFeed';
import MarkPage from './pages/MarkPage';
import './styles/App.css';
import './styles/placeholder.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  


  // 检测屏幕尺寸变化
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 初始检查
    checkIfMobile();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkIfMobile);
    
    // 清理监听器
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // 根据当前页面返回对应的组件
  const getPageComponent = () => {
    switch (currentPage) {
      case 'home':
        return <JobFeed />;
      case 'mark':
        return <MarkPage />;
      case 'find-work':
        return <JobFeed />;
      case 'my-jobs':
        return <JobFeed filter="my-jobs" />;
      case 'my-activity':
        return <JobFeed filter="my-activity" />;
      case 'messages':
        return (
          <div className="placeholder-page">
            <div className="placeholder-icon">✉️</div>
            <h2>Messages</h2>
            <p>This feature is coming soon. You will be able to communicate with employers and manage your conversations here.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="placeholder-page">
            <div className="placeholder-icon">📊</div>
            <h2>Reports</h2>
            <p>This feature is coming soon. You will be able to view analytics and reports about your job search activities here.</p>
          </div>
        );
      default:
        return <JobFeed />;
    }
  };

  return (
    <Router>
      <div className="app">
        {isMobile && (
          <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
            ☰
          </button>
        )}
        
        <Sidebar 
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isOpen={isMobile ? sidebarOpen : true}
        />
        
        <main className="main-content">
          {getPageComponent()}
        </main>
      </div>
    </Router>
  );
}

export default App;