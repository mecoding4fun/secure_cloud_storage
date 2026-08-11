import React from 'react';
import { MenuIcon, SearchIcon, GridIcon, ListIcon } from '../../icons/Icons';
import { IconButton } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

export const Topbar = ({ onToggleSidebar, onNavigate, path, viewMode, setViewMode }) => {
  const { logout } = useAuth();
  
  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--space-4)',
      gap: 'var(--space-4)',
      flexShrink: 0,
      zIndex: 'var(--z-header)'
    }}>
      <IconButton onClick={onToggleSidebar} className="text-muted">
        <MenuIcon />
      </IconButton>
      
      {/* Breadcrumbs */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <Breadcrumbs path={path} onNavigate={onNavigate} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-1)',
          marginRight: 'var(--space-4)'
        }}>
          <IconButton 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            onClick={() => setViewMode('list')}
            style={{ 
              backgroundColor: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent',
              boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <ListIcon />
          </IconButton>
          <IconButton 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            onClick={() => setViewMode('grid')}
            style={{ 
              backgroundColor: viewMode === 'grid' ? 'var(--bg-primary)' : 'transparent',
              boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <GridIcon />
          </IconButton>
        </div>

        {/* Profile / Logout */}
        <button onClick={logout} className="ds-btn ds-btn-ghost ds-btn-icon" title="Logout">
          <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </header>
  );
};

const Breadcrumbs = ({ path, onNavigate }) => {
  const parts = path ? path.split('/').filter(Boolean) : [];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
      <button 
        className="ds-btn ds-btn-ghost" 
        style={{ padding: '4px 8px', fontWeight: parts.length === 0 ? 600 : 400, color: parts.length === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        onClick={() => onNavigate('')}
      >
        My Files
      </button>
      
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');
        
        return (
          <React.Fragment key={currentPath}>
            <svg className="icon-sm text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <button 
              className="ds-btn ds-btn-ghost"
              style={{ 
                padding: '4px 8px', 
                fontWeight: isLast ? 600 : 400,
                color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onClick={() => onNavigate(currentPath)}
              title={part}
            >
              {part}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
