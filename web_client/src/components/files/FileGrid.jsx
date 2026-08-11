import React from 'react';
import { FolderIcon, FileIcon, EllipsisIcon, DownloadIcon, TrashIcon, EditIcon, EyeIcon } from '../../icons/Icons';
import { IconButton } from '../common/Button';
import { formatBytes, formatDate } from '../../utils/formatters';

export const FileGrid = ({ items, selected, onToggleSelect, onOpen, onRename, onDelete, onDownload }) => {
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

  // Separate folders and files for better organization in grid view
  const folders = items.filter(item => item.is_dir);
  const files = items.filter(item => !item.is_dir);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {folders.length > 0 && (
        <section>
          <h3 className="text-sm text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Folders</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: 'var(--space-4)' 
          }}>
            {folders.map(item => (
              <FileCard 
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
        </section>
      )}

      {files.length > 0 && (
        <section>
          <h3 className="text-sm text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)', fontWeight: 600 }}>Files</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: 'var(--space-4)' 
          }}>
            {files.map(item => (
              <FileCard 
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
        </section>
      )}
    </div>
  );
};

const FileCard = ({ item, selected, onToggleSelect, onOpen, onRename, onDelete, onDownload }) => {
  return (
    <div 
      className={`ds-card file-card ${selected ? 'selected' : ''}`}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onToggleSelect();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
      style={{
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        cursor: 'pointer',
        position: 'relative',
        backgroundColor: selected ? 'var(--primary-light)' : 'var(--bg-primary)',
        borderColor: selected ? 'var(--primary)' : 'var(--border-light)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: item.is_dir ? 'var(--primary)' : 'var(--text-secondary)' }}>
          {item.is_dir ? (
            <FolderIcon className="icon" style={{ width: '40px', height: '40px' }} />
          ) : (
            <FileIcon className="icon" style={{ width: '40px', height: '40px' }} />
          )}
        </div>
        
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={onToggleSelect} 
          onClick={e => e.stopPropagation()}
          className="file-card-checkbox"
          style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer', opacity: selected ? 1 : 0 }}
        />
      </div>
      
      <div>
        <div 
          style={{ 
            fontWeight: 500, 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 'var(--space-1)'
          }}
          title={item.name}
        >
          {item.name}
        </div>
        <div className="text-xs text-muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{item.is_dir ? '--' : formatBytes(item.size)}</span>
          <span>{formatDate(item.modified)}</span>
        </div>
      </div>
      
      <div className="file-card-actions" style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', display: 'flex', opacity: 0 }}>
        <div style={{ position: 'relative' }} className="dropdown-container">
          <IconButton variant="secondary" className="dropdown-trigger" style={{ padding: 'var(--space-1)', width: '28px', height: '28px' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <EllipsisIcon className="icon-sm" />
          </IconButton>
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(); }}>
              <EyeIcon className="icon-sm" /> {item.is_dir ? 'Open' : 'Preview'}
            </button>
            <button className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownload(); }}>
              <DownloadIcon className="icon-sm" /> Download
            </button>
            <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: 'var(--space-1) 0' }} />
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
        .file-card:hover .file-card-checkbox { opacity: 1 !important; }
        .file-card:hover .file-card-actions { opacity: 1 !important; }
        
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
