import { useRef, useCallback, useEffect } from 'react';
import { usePlayground } from '../contexts/PlaygroundContext';
import { buildPreviewHTML } from '../utils/compiler';
import styles from './Preview.module.css';

export default function Preview({ runTrigger }) {
  const { files, addConsoleMsg } = usePlayground();
  const iframeRef = useRef(null);
  const hasRun = useRef(false);

  // Listen for console messages from the iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.source === 'preview-console') {
        addConsoleMsg(e.data.level, e.data.message);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [addConsoleMsg]);

  // Run whenever runTrigger changes
  useEffect(() => {
    if (runTrigger === 0) return;
    hasRun.current = true;
    const html = buildPreviewHTML(files);
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = html;
    }
  }, [runTrigger, files]);

  return (
    <div className={styles.pane}>
      {/* Tab bar */}
      <div className={styles.tabs}>
        <div className={`${styles.tab} ${styles.activeTab}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          Preview
        </div>
      </div>

      {/* Preview content */}
      <div className={styles.content}>
        {!hasRun.current && (
          <div className={styles.placeholder}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="48" height="48">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9l3 3-3 3M15 15h-3" />
            </svg>
            <p>
              Press <kbd>Ctrl+Enter</kbd> or click <strong>Run</strong>
            </p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          className={styles.frame}
          sandbox="allow-scripts allow-same-origin"
          title="Preview"
          style={{ display: hasRun.current ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}
