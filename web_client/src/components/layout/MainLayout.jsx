import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
// useAuth removed

export const MainLayout = ({ children, onNavigate, path, viewMode, setViewMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-secondary)',
      overflow: 'hidden'
    }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
        transition: 'margin var(--transition-normal)'
      }}>
        <Topbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onNavigate={onNavigate}
          path={path}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};
