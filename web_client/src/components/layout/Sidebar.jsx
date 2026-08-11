import React from 'react';
import { FolderIcon, HomeIcon, MenuIcon, CloseIcon } from '../../icons/Icons';

export const Sidebar = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="ds-sidebar-overlay"
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 'var(--z-sidebar)',
            display: 'block'
          }}
        />
      )}
      
      <aside style={{
        width: isOpen ? '260px' : '0px',
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-light)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-normal)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 'calc(var(--z-sidebar) + 1)'
      }}>
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
          minWidth: '260px',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.025em' }}>Secure Cloud</span>
          </div>
          <button className="ds-btn ds-btn-ghost ds-btn-icon lg-hidden" onClick={onToggle}>
            <CloseIcon />
          </button>
        </div>

        <nav style={{
          flex: 1,
          padding: 'var(--space-4) var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          minWidth: '260px',
          overflowY: 'auto'
        }}>
          {/* Menu Items */}
          <NavItem icon={HomeIcon} label="Dashboard" active />
          
          <div style={{ margin: 'var(--space-4) 0 var(--space-2)', paddingLeft: 'var(--space-3)' }}>
            <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Storage</span>
          </div>
          
          <NavItem icon={FolderIcon} label="My Files" />
          
          {/* Note: we won't implement shared/favorites since backend doesn't support them.
              We can add visual items but gray them out or omit them completely to avoid confusion. */}
        </nav>
      </aside>
      
      {/* Hide overlay and close button on large screens using CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .ds-sidebar-overlay { display: none !important; }
          .lg-hidden { display: none !important; }
        }
        @media (max-width: 1023px) {
          aside {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

// eslint-disable-next-line no-unused-vars
const NavItem = ({ icon: IconComp, label, active, disabled }) => {
  return (
    <a href="#" onClick={e => e.preventDefault()} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-2) var(--space-3)',
      borderRadius: 'var(--radius-md)',
      color: active ? 'var(--primary)' : 'var(--text-secondary)',
      backgroundColor: active ? 'var(--primary-light)' : 'transparent',
      textDecoration: 'none',
      fontWeight: 500,
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition: 'background-color var(--transition-fast), color var(--transition-fast)'
    }} onMouseEnter={e => {
      if (!active && !disabled) {
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }
    }} onMouseLeave={e => {
      if (!active && !disabled) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }
    }}>
      <IconComp className="icon" />
      {label}
    </a>
  );
};
