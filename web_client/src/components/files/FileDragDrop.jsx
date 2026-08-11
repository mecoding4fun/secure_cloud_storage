import React, { useState, useRef } from 'react';

export const FileDragDrop = ({ children, onUploadFiles, busy }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (busy) return;

    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items).filter(item => item.kind === 'file');
      
      const filesToUpload = [];
      
      // Modern File System Access API approach to handle folders if possible
      // Since `webkitGetAsEntry` is non-standard but widely supported
      for (const item of items) {
        if ('webkitGetAsEntry' in item) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await scanEntry(entry, "", filesToUpload);
          }
        } else {
          const file = item.getAsFile();
          if (file) filesToUpload.push({ file, path: "" });
        }
      }
      
      if (filesToUpload.length > 0) {
        onUploadFiles(filesToUpload);
      }
    } else {
      // Fallback for older browsers
      const files = Array.from(e.dataTransfer.files).map(f => ({ file: f, path: "" }));
      if (files.length > 0) {
        onUploadFiles(files);
      }
    }
  };

  async function scanEntry(entry, currentPath, outFiles) {
    if (entry.isFile) {
      const file = await new Promise((res) => entry.file(res));
      outFiles.push({ file, path: currentPath });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise((res) => {
        reader.readEntries((results) => res(results));
      });
      const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      for (const child of entries) {
        await scanEntry(child, nextPath, outFiles);
      }
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px'
      }}
    >
      {isDragging && !busy && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--primary-light)',
          opacity: 0.9,
          border: '2px dashed var(--primary)',
          borderRadius: 'var(--radius-lg)',
          zIndex: 'var(--z-toast)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          color: 'var(--primary)'
        }}>
          <svg className="icon-lg" style={{ width: '48px', height: '48px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <h2 className="text-h2">Drop files or folders to upload</h2>
        </div>
      )}
      
      {children}
    </div>
  );
};
