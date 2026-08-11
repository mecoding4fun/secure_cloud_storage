import React from 'react';
import { Button } from '../common/Button';
import { UploadIcon, PlusIcon, TrashIcon, EditIcon } from '../../icons/Icons';

export const FileToolbar = ({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onClearSelection, 
  onRefresh, 
  onNewFolder, 
  onUploadClick,
  onDeleteSelected, 
  onBatchRename,
  busy,
  canGoUp,
  onGoUp
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 'var(--space-4)',
      marginBottom: 'var(--space-4)',
      borderBottom: '1px solid var(--border-light)',
      flexWrap: 'wrap',
      gap: 'var(--space-4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {selectedCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span className="text-sm" style={{ fontWeight: 500, color: 'var(--primary)' }}>
              {selectedCount} selected
            </span>
            <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-strong)' }} />
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={onSelectAll} disabled={busy || selectedCount === totalCount}>
                Select All
              </Button>
              <Button variant="ghost" onClick={onClearSelection} disabled={busy}>
                Clear
              </Button>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="danger" icon={TrashIcon} onClick={onDeleteSelected} disabled={busy}>
                Delete
              </Button>
              <Button variant="secondary" icon={EditIcon} onClick={onBatchRename} disabled={busy}>
                Batch Rename
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {canGoUp && (
              <Button variant="ghost" onClick={onGoUp} disabled={busy} title="Go Up (Backspace)">
                <svg className="icon-sm" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                Up
              </Button>
            )}
            <Button variant="ghost" onClick={onRefresh} disabled={busy}>
              <svg className="icon-sm" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </Button>
            <span className="text-sm text-muted ml-2">{totalCount} item{totalCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="secondary" icon={PlusIcon} onClick={onNewFolder} disabled={busy}>
          New Folder
        </Button>
        <Button variant="primary" icon={UploadIcon} onClick={onUploadClick} disabled={busy}>
          Upload
        </Button>
      </div>
    </div>
  );
};
