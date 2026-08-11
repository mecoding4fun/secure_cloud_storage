import React from 'react';
import { FolderIcon, FileIcon, EllipsisIcon, DownloadIcon, TrashIcon, EditIcon, EyeIcon } from '../../icons/Icons';
import { IconButton } from '../common/Button';

import { formatBytes, formatDate } from '../../utils/formatters';

export const FileList = ({ items, selected, onToggleSelect, onOpen, onRename, onDelete, onDownload }) => {
  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) 0',
        color: 'var(--text-tertiary)',
        textAlign: 'center'
      }}>
        <svg className="icon-lg" style={{ width: '64px', height: '64px', marginBottom: 'var(--space-4)', opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
        </svg>
        <h3 className="text-h3" style={{ marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>This folder is empty</h3>
        <p className="text-body">Drop files here or use the Upload button.</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px 40px minmax(200px, 1fr) 120px 120px 150px',
        borderBottom: '1px solid var(--border-light)',
        padding: 'var(--space-3) 0',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <div /> {/* Checkbox */}
        <div /> {/* Icon */}
        <div style={{ paddingLeft: 'var(--space-2)' }}>Name</div>
        <div>Size</div>
        <div>Modified</div>
        <div style={{ textAlign: 'right', paddingRight: 'var(--space-4)' }}>Actions</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map(item => (
          <FileRow 
            key={item.name}
            item={item}
            selected={selected.has(item.name)}
            onToggleSelect={() => onToggleSelect(item.name)}
            onOpen={() => onOpen(item)}
            onRename={() => onRename(item)}
            onDelete={() => onDelete(item)}
            onDownload={() => onDownload(item)}
          />
        ))}
      </div>
    </div>
  );
};

const FileRow = ({ item, selected, onToggleSelect, onOpen, onRename, onDelete, onDownload }) => {
  return (
    <div
      className="ds-file-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 40px minmax(200px, 1fr) 120px 120px 150px',
        alignItems: 'center',
        padding: 'var(--space-3) 0',
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: selected ? 'var(--primary-light)' : 'transparent',
        transition: 'background-color var(--transition-fast)',
      }}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onToggleSelect();
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={onToggleSelect} 
          onClick={e => e.stopPropagation()}
          style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', color: item.is_dir ? 'var(--primary)' : 'var(--text-secondary)' }}>
        {item.is_dir ? <FolderIcon className="icon-lg" /> : <FileIcon className="icon-lg" />}
      </div>
      
      <div 
        style={{ 
          paddingLeft: 'var(--space-2)', 
          fontWeight: 500, 
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
      >
        <a href="#" className="file-link" style={{ color: selected ? 'var(--primary-active)' : 'var(--text-primary)' }}>
          {item.name}
        </a>
      </div>
      
      <div className="text-sm text-muted">{formatBytes(item.size)}</div>
      
      <div className="text-sm text-muted">{formatDate(item.modified)}</div>
      
      <div className="file-actions" style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 'var(--space-4)', gap: 'var(--space-1)' }}>
        <IconButton variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(); }} title={item.is_dir ? 'Open' : 'Preview'}>
          <EyeIcon className="icon-sm" />
        </IconButton>
        <IconButton variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownload(); }} title="Download">
          <DownloadIcon className="icon-sm" />
        </IconButton>
        <div style={{ position: 'relative' }} className="dropdown-container">
          {/* Simple dropdown simulation with CSS hover */}
          <IconButton variant="ghost" className="dropdown-trigger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <EllipsisIcon className="icon-sm" />
          </IconButton>
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(); }}>
              <EditIcon className="icon-sm" /> Rename
            </button>
            <button className="dropdown-item text-danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}>
              <TrashIcon className="icon-sm" /> Delete
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .ds-file-row:last-child { border-bottom: none; }
        .ds-file-row:hover { background-color: var(--bg-hover); }
        .ds-file-row.selected:hover { background-color: var(--primary-light); }
        .file-link:hover { text-decoration: underline; }
        
        .file-actions { opacity: 0; transition: opacity var(--transition-fast); }
        .ds-file-row:hover .file-actions { opacity: 1; }
        @media (max-width: 768px) { .file-actions { opacity: 1; } }
        
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-dropdown);
          min-width: 150px;
          padding: var(--space-1);
          z-index: var(--z-dropdown);
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          transition: all var(--transition-fast);
        }
        .dropdown-container:hover .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: none;
          background: none;
          text-align: left;
          font-size: 0.875rem;
          cursor: pointer;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
        }
        .dropdown-item:hover { background-color: var(--bg-hover); }
        .dropdown-item.text-danger { color: var(--danger); }
        .dropdown-item.text-danger:hover { background-color: var(--danger-light); }
      `}</style>
    </div>
  );
};
