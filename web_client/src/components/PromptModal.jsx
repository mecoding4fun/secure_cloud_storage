import React, { useState, useEffect, useRef } from "react";

export default function PromptModal({ config }) {
  if (!config) return null;

  const { type, title, defaultValue = "", onConfirm, onCancel } = config;
  const [val, setVal] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (type === "prompt" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [type, config]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(val);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-main)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        width: '400px', maxWidth: '90%',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-light)'
      }}>
        <h3 style={{ margin: '0 0 var(--space-4) 0', color: 'var(--text-primary)' }}>
          {title}
        </h3>
        
        {type === "prompt" && (
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="ds-input"
              style={{ width: '100%', marginBottom: 'var(--space-4)' }}
            />
          </form>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: type === 'confirm' ? 'var(--space-4)' : 0 }}>
          <button className="ds-btn ds-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="ds-btn ds-btn-primary" onClick={() => onConfirm(val)}>
            {type === 'confirm' ? 'Confirm' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
