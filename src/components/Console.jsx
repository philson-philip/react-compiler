import { useState, useEffect, useRef } from 'react';
import { usePlayground } from '../contexts/PlaygroundContext';
import styles from './Console.module.css';

const ICONS = { log: '›', warn: '⚠', error: '✕', info: 'ℹ' };

export default function Console() {
  const { consoleMsgs, clearConsole } = usePlayground();
  const [collapsed, setCollapsed] = useState(false);
  const bodyRef = useRef(null);

  const errorCount = consoleMsgs.filter((m) => m.level === 'error').length;

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [consoleMsgs]);

  // Auto-expand on new error
  useEffect(() => {
    if (errorCount > 0) setCollapsed(false);
  }, [errorCount]);

  return (
    <div
      className={`${styles.wrap} ${collapsed ? styles.collapsed : ''}`}
      style={{ height: collapsed ? 'var(--tab-h)' : '180px' }}
    >
      {/* Header bar */}
      <div className={styles.bar} onClick={() => setCollapsed((c) => !c)}>
        <div className={styles.label}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          Console
        </div>

        {errorCount > 0 && (
          <span className={styles.badge}>{errorCount}</span>
        )}

        <div className={styles.spacer} />

        <button
          className={styles.iconBtn}
          onClick={(e) => {
            e.stopPropagation();
            clearConsole();
          }}
          title="Clear console"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </button>

        <button className={styles.iconBtn} title="Toggle">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="14"
            height="14"
            style={{
              transition: 'transform 0.2s',
              transform: collapsed ? 'rotate(180deg)' : 'none',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Console body */}
      {!collapsed && (
        <div className={styles.body} ref={bodyRef}>
          {consoleMsgs.length === 0 && (
            <div className={styles.empty}>No console output</div>
          )}
          {consoleMsgs.map((msg) => (
            <div key={msg.id} className={`${styles.line} ${styles[msg.level]}`}>
              <span className={styles.prefix}>{ICONS[msg.level] || '›'}</span>
              <span className={styles.message}>{msg.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
