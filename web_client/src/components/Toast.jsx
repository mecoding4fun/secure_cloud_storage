import React, { useEffect } from "react";
import { IconButton } from "./common/Button";
import { CloseIcon } from "../icons/Icons";

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onDismiss(), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.kind === "error";

  return (
    <div 
      className="animate-slide-up"
      role="status"
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-4)',
        backgroundColor: isError ? 'var(--danger)' : 'var(--bg-secondary)',
        color: isError ? 'white' : 'var(--text-primary)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 'calc(var(--z-toast) + 10)',
        border: isError ? 'none' : '1px solid var(--border-light)'
      }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{toast.message}</span>
      <IconButton 
        variant="ghost" 
        onClick={onDismiss} 
        style={{ width: '24px', height: '24px', padding: 0, color: 'inherit' }}
      >
        <CloseIcon className="icon-sm" />
      </IconButton>
    </div>
  );
}
