import React, { useEffect, useState } from "react";
import * as api from "../services/api";
import { Button, IconButton } from "./common/Button";
import { DownloadIcon, CloseIcon } from "../icons/Icons";

const VIDEO_EXTS = ["mp4", "webm", "mov", "mkv"];
const AUDIO_EXTS = ["mp3", "wav", "m4a", "aac", "flac", "ogg"];
const TEXT_EXTS = ["txt", "md", "log", "json", "yml", "yaml", "xml", "csv", "tsv", "jsx", "js", "css", "html", "py", "sh"];
const PDF_EXTS = ["pdf"];
const IMG_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "dng", "nef", "cr2", "arw", "orf", "rw2", "pef", "raf", "srw", "tif", "tiff", "heic", "heif", "avif", "raw", "bmp", "ico", "svg"];

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export default function PreviewModal({ file, onClose }) {
  const [textState, setTextState] = useState({
    key: null,
    status: "idle",
    content: null,
    error: null,
  });

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!file) return;
    const e = extOf(file.name);
    if (!TEXT_EXTS.includes(e)) return;
    let cancelled = false;
    api.readText(file.fullPath)
      .then((r) => {
        if (cancelled) return;
        setTextState({
          key: file.fullPath,
          status: "ready",
          content: r.data,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setTextState({
          key: file.fullPath,
          status: "error",
          content: null,
          error: err?.message || "Failed to load",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const textLoading = !!file && TEXT_EXTS.includes(extOf(file.name)) && textState.key !== file.fullPath;

  if (!file) return null;
  const e = extOf(file.name);

  return (
    <div 
      className="animate-fade-in"
      onClick={onClose} 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div className="text-h3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.fullPath}>
          {file.name}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button 
            variant="ghost" 
            icon={DownloadIcon}
            onClick={() => {
              const a = document.createElement("a");
              a.href = api.fileUrl(file.fullPath);
              a.download = file.name;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
            style={{ color: 'white' }}
          >
            Download
          </Button>
          <IconButton variant="ghost" onClick={onClose} style={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 'var(--space-4)'
        }}
      >
        {IMG_EXTS.includes(e) && (
          <img
            src={api.fileUrl(file.fullPath)}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
          />
        )}

        {VIDEO_EXTS.includes(e) && (
          <video
            controls
            autoPlay
            playsInline
            src={api.streamUrl(file.fullPath)}
            style={{ maxWidth: '100%', maxHeight: '100%', outline: 'none', borderRadius: 'var(--radius-md)' }}
          />
        )}

        {AUDIO_EXTS.includes(e) && (
          <audio
            controls
            autoPlay
            src={api.fileUrl(file.fullPath)}
            style={{ width: '400px', maxWidth: '100%' }}
          />
        )}

        {PDF_EXTS.includes(e) && (
          <iframe
            src={api.fileUrl(file.fullPath)}
            title={file.name}
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white', borderRadius: 'var(--radius-md)' }}
          />
        )}

        {TEXT_EXTS.includes(e) && (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'var(--bg-primary)', 
            borderRadius: 'var(--radius-md)', 
            overflow: 'auto',
            padding: 'var(--space-4)',
            position: 'relative'
          }}>
            {textLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading…</div>
            )}
            {textState.key === file.fullPath && textState.status === "error" && (
              <div style={{ color: 'var(--danger)' }}>Failed to load: {textState.error}</div>
            )}
            {textState.key === file.fullPath && textState.status === "ready" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => copyText(textState.content)}
                  style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)' }}
                >
                  Copy
                </Button>
                <pre style={{ margin: 0, fontFamily: 'ui-monospace, monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  {textState.content}
                </pre>
              </>
            )}
          </div>
        )}

        {![...IMG_EXTS, ...VIDEO_EXTS, ...AUDIO_EXTS, ...PDF_EXTS, ...TEXT_EXTS].includes(e) && (
          <iframe
            sandbox=""
            src={api.fileUrl(file.fullPath)}
            title={file.name}
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white', borderRadius: 'var(--radius-md)' }}
          />
        )}
      </div>
    </div>
  );
}

async function copyText(s) {
  try {
    await navigator.clipboard.writeText(s);
  } catch (e) {
    console.error(e);
  }
}
