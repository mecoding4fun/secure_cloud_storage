import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export default function Login() {
  const { login } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter your API Key');
      return;
    }
    login(key.trim());
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-secondary)',
      padding: 'var(--space-4)'
    }}>
      <Card style={{
        width: '100%',
        maxWidth: '400px',
        padding: 'var(--space-8)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)'
          }}>
            <svg className="icon-lg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>Welcome Back</h1>
          <p className="text-muted text-sm">Enter your API key to access Secure Cloud Storage.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label htmlFor="apiKey" className="text-sm" style={{ fontWeight: 500 }}>API Key</label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API Key"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <span className="text-xs" style={{ color: 'var(--danger)' }}>{error}</span>}
          </div>
          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}
