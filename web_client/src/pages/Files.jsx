import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../services/api';
import { MainLayout } from '../components/layout/MainLayout';
import { FileToolbar } from '../components/files/FileToolbar';
import { FileList } from '../components/files/FileList';
import { FileGrid } from '../components/files/FileGrid';
import { FileDragDrop } from '../components/files/FileDragDrop';
import PreviewModal from '../components/PreviewModal'; // We'll rewrite this soon
import { formatBytes } from '../utils/formatters';
import Toast from '../components/Toast';
import PromptModal from "../components/PromptModal";

export default function Files() {
  const [path, setPath] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  const [activeZips, setActiveZips] = useState({});

  const fileInputRef = useRef(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listFiles(p);
      setItems((res.items || []).filter((i) => !i.name.startsWith("._")));
      setPath(res.path || "");
      setSelected(new Set());
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const goUp = useCallback(() => {
    if (!path) return;
    const parts = path.split("/");
    parts.pop();
    load(parts.join("/"));
  }, [path, load]);

  // Keyboard navigation
  useEffect(() => {
    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");
    function onKey(e) {
      const target = e.target;
      const inForm = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      
      if (e.key === "Escape") {
        if (preview) setPreview(null);
        else if (selected.size) setSelected(new Set());
        return;
      }
      
      if (inForm) return;
      
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelected(new Set(items.map((i) => i.name)));
        return;
      }
      
      if (e.key === "Backspace" && path && !preview) {
        e.preventDefault();
        goUp();
      }
    }
    
    }
    
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [path, preview, selected, items, goUp]);

  useEffect(() => {
    const activeIds = Object.keys(activeZips);
    if (activeIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const id of activeIds) {
        try {
          const status = await api.zipStatus(id);
          if (status && status.status) {
            setActiveZips(prev => {
              if (!prev[id]) return prev;
              const next = { ...prev };
              if (status.status === "done" || status.status === "not_found") {
                delete next[id];
              } else {
                next[id] = { ...next[id], ...status };
              }
              return next;
            });
            if (status.status === "done") {
              notify("ok", `Download complete!`);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [activeZips]);

  const notify = (kind, message) => setToast({ kind, message });

  const [modalConfig, setModalConfig] = useState(null);

  const confirmAction = (title, action) => {
    setModalConfig({ type: 'confirm', title, onConfirm: () => { action(); setModalConfig(null); }, onCancel: () => setModalConfig(null) });
  };

  const promptAction = (title, defaultValue, action) => {
    setModalConfig({ type: 'prompt', title, defaultValue, onConfirm: (val) => { action(val); setModalConfig(null); }, onCancel: () => setModalConfig(null) });
  };
  const openItem = (item) => {
    const fullPath = path ? `${path}/${item.name}` : (item.id || item.name);
    if (item.is_dir) {
      load(fullPath);
      return;
    }
    setPreview({ name: item.name, fullPath });
  };

  const toggleSelect = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    const all = items.map((i) => i.name);
    const isAll = selected.size > 0 && selected.size === all.length;
    setSelected(isAll ? new Set() : new Set(all));
  };

  const clearSelection = () => setSelected(new Set());

  const deleteItems = (names) => {
    if (!names.length) return;
    confirmAction(`Delete ${names.length} item(s)? This cannot be undone.`, async () => {
      setBusy(true);
      try {
        for (const name of names) {
          try {
            await api.deleteItem(name, path);
          } catch (err) {
            notify("error", `Failed to delete ${name}: ${err?.message || "error"}`);
          }
        }
        setSelected(new Set());
        await load(path);
        notify("ok", `Deleted ${names.length} item(s)`);
      } finally {
        setBusy(false);
      }
    });
  };

  const renameOne = (item) => {
    promptAction(`Rename "${item.name}" to:`, item.name, async (next) => {
      if (!next || next === item.name) return;
      try {
        await api.renameItem(item.name, next, path);
        await load(path);
        notify("ok", "Renamed");
      } catch (err) {
        notify("error", err?.response?.data?.detail || err?.message || "Rename failed");
      }
    });
  };

  const batchRename = () => {
    if (selected.size === 0) return;
    promptAction("Batch rename prefix. Files become: prefix_1.ext, prefix_2.ext, ...", "", async (prefix) => {
      if (!prefix) return;
      const names = items.filter((i) => selected.has(i.name)).map((i) => i.name);
      setBusy(true);
      let i = 1;
      try {
        for (const name of names) {
          const dot = name.lastIndexOf(".");
          const ext = dot >= 0 ? name.slice(dot) : "";
          const newName = `${prefix}_${i}${ext}`;
          try {
            await api.renameItem(name, newName, path);
          } catch (err) {
            notify("error", `Failed to rename ${name}: ${err?.message || "error"}`);
          }
          i++;
        }
        setSelected(new Set());
        await load(path);
        notify("ok", "Batch rename complete");
      } finally {
        setBusy(false);
      }
    });
  };

  const newFolder = () => {
    promptAction("New folder name:", "", async (name) => {
      if (!name) return;
      try {
        await api.mkdir(name, path);
        await load(path);
        notify("ok", `Created "${name}"`);
      } catch (err) {
        notify("error", err?.response?.data?.detail || err?.message || "Failed to create folder");
      }
    });
  };

  const downloadFile = (item) => {
    const fullPath = path ? `${path}/${item.name}` : (item.id || item.name);
    let dlId = "";
    if (item.is_dir) {
      dlId = Math.random().toString(36).slice(2);
      setActiveZips(prev => ({ ...prev, [dlId]: { name: item.name, bytes: 0, status: "zipping", total: item.size || 0 } }));
    } else {
      notify("ok", `Downloading ${item.name}...`);
    }

    const a = document.createElement("a");
    a.href = item.is_dir ? api.zipUrl(fullPath, dlId) : api.fileUrl(fullPath);
    a.download = item.name + (item.is_dir ? ".zip" : "");
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleUploadFilesClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const uploadEntries = async (entries) => {
    if (!entries.length) return;
    setBusy(true);
    setUploadProgress({ done: 0, total: entries.length, current: null });
    
    const dirs = new Set();
    for (const e of entries) {
      if (e.path) dirs.add(e.path);
    }
    
    for (const d of Array.from(dirs).sort()) {
      const segments = d.split("/");
      let acc = "";
      for (const seg of segments) {
        const target = acc ? `${acc}/${seg}` : seg;
        try {
          await api.mkdir(seg, acc ? `${path}/${acc}` : path);
        } catch (e) {
          console.error(e);
        }
        acc = target;
      }
    }

    let done = 0;
    for (const entry of entries) {
      const targetDir = entry.path ? `${path}/${entry.path}` : path;
      setUploadProgress({ done, total: entries.length, current: entry.file.name });
      try {
        await api.uploadFile(entry.file, targetDir);
      } catch (err) {
        notify("error", `Failed to upload ${entry.file.name}: ${err?.message || "error"}`);
      }
      done++;
    }
    
    setUploadProgress(null);
    setBusy(false);
    await load(path);
    notify("ok", `Uploaded ${entries.length} file(s)`);
  };

  // Sort: folders first, then alphabetical
  const visible = [...items].sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  return (
    <MainLayout 
      breadcrumbs={path} 
      path={path}
      onNavigate={load}
      viewMode={viewMode}
      setViewMode={setViewMode}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <FileToolbar 
          selectedCount={selected.size}
          totalCount={items.length}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onRefresh={() => load(path)}
          onNewFolder={newFolder}
          onUploadClick={handleUploadFilesClick}
          onDeleteSelected={() => deleteItems([...selected])}
          onBatchRename={batchRename}
          busy={busy}
          canGoUp={!!path}
          onGoUp={goUp}
        />
        
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={(e) => {
            if (e.target.files?.length) {
              uploadEntries(Array.from(e.target.files).map(f => ({ file: f, path: "" })));
            }
            e.target.value = null; // reset
          }}
        />

        {error && (
          <div style={{ 
            backgroundColor: 'var(--danger-light)', 
            color: 'var(--danger)', 
            padding: 'var(--space-4)', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: 'var(--space-4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button className="ds-btn ds-btn-danger" onClick={() => load(path)}>Retry</button>
          </div>
        )}

        {uploadProgress && (
          <div style={{ 
            backgroundColor: 'var(--primary-light)', 
            border: '1px solid var(--primary)', 
            padding: 'var(--space-3) var(--space-4)', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: 'var(--space-4)',
            color: 'var(--primary-active)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 500 }}>
                Uploading {uploadProgress.done + 1}/{uploadProgress.total} {uploadProgress.current ? ` — ${uploadProgress.current}` : ""}
              </span>
              <span>{Math.round(((uploadProgress.done) / uploadProgress.total) * 100)}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--primary-light)', overflow: 'hidden', borderRadius: 'var(--radius-full)' }}>
              <div style={{ 
                height: '100%', 
                backgroundColor: 'var(--primary)', 
                width: `${((uploadProgress.done) / uploadProgress.total) * 100}%`,
                transition: 'width var(--transition-fast)'
              }} />
            </div>
          </div>
        )}

        {Object.entries(activeZips).map(([id, info]) => (
          <div key={id} style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid var(--border-light)', 
            padding: 'var(--space-3) var(--space-4)', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                Preparing ZIP for <strong>{info.name}</strong>...
              </span>
              <span className="text-muted">
                {info.total > 0
                  ? `${formatBytes(info.bytes)} / ~${formatBytes(info.total)}`
                  : formatBytes(info.bytes)}
              </span>
            </div>
          </div>
        ))}

        <FileDragDrop onUploadFiles={uploadEntries} busy={busy}>
          {loading ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="ds-skeleton" style={{ width: '220px', height: '140px' }} />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <FileList 
              items={visible} 
              selected={selected} 
              onToggleSelect={toggleSelect}
              onOpen={openItem}
              onRename={renameOne}
              onDelete={(item) => deleteItems([item.name])}
              onDownload={downloadFile}
            />
          ) : (
            <FileGrid 
              items={visible} 
              selected={selected} 
              onToggleSelect={toggleSelect}
              onOpen={openItem}
              onRename={renameOne}
              onDelete={(item) => deleteItems([item.name])}
              onDownload={downloadFile}
            />
          )}
        </FileDragDrop>
      </div>

      {preview && (
        <PreviewModal file={preview} onClose={() => setPreview(null)} />
      )}

      {/* Legacy toast wrapper, later we can rebuild toast context */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <PromptModal config={modalConfig} />
    </MainLayout>
  );
}
