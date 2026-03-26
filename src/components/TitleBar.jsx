import { usePlayground } from '../contexts/PlaygroundContext';
import { buildPreviewHTML } from '../utils/compiler';
import styles from './TitleBar.module.css';

export default function TitleBar({ onRun }) {
  const { activeFile } = usePlayground();

  return (
    <div className={styles.titlebar}>
      <div className={styles.appName}>React Playground</div>
      <div className={styles.title}>{activeFile} — React Playground</div>
      <button className={styles.runBtn} onClick={onRun} title="Run (Ctrl+Enter)">
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
          <path d="M8 5v14l11-7z" />
        </svg>
        Run
      </button>
    </div>
  );
}
