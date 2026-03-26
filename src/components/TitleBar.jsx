import { usePlayground } from '../contexts/PlaygroundContext';
import styles from './TitleBar.module.css';

export default function TitleBar({
  onRun,
  isExplorerCollapsed,
  onToggleExplorer,
  editorEngine,
  onEditorEngineChange,
}) {
  const { activeFile } = usePlayground();

  return (
    <div className={styles.titlebar}>
      <div className={styles.leftGroup}>
        <button
          className={styles.iconBtn}
          onClick={onToggleExplorer}
          title={isExplorerCollapsed ? 'Show file explorer' : 'Hide file explorer'}
          aria-label={isExplorerCollapsed ? 'Show file explorer' : 'Hide file explorer'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </button>
        <div className={styles.appName}>
          React Playground by{' '}
          <a
            className={styles.authorLink}
            href="https://philson.me"
            target="_blank"
            rel="noreferrer"
          >
            Philson
          </a>
        </div>
      </div>
      <div className={styles.title}>{activeFile} — React Playground</div>
      <div className={styles.rightGroup}>
        <span className={styles.editorSwitcherLabel}>Editor</span>
        <div className={styles.editorToggle} role="group" aria-label="Select code editor">
          <button
            className={`${styles.editorOption} ${
              editorEngine === 'codemirror' ? styles.editorOptionActive : ''
            }`}
            onClick={() => onEditorEngineChange('codemirror')}
            aria-pressed={editorEngine === 'codemirror'}
            title="Use CodeMirror editor"
          >
            CodeMirror
          </button>
          <button
            className={`${styles.editorOption} ${
              editorEngine === 'monaco' ? styles.editorOptionActive : ''
            }`}
            onClick={() => onEditorEngineChange('monaco')}
            aria-pressed={editorEngine === 'monaco'}
            title="Use Monaco editor"
          >
            Monaco
          </button>
        </div>
        <button className={styles.runBtn} onClick={onRun} title="Run (Ctrl+Enter)">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M8 5v14l11-7z" />
          </svg>
          Run
        </button>
      </div>
    </div>
  );
}
