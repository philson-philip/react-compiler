import { usePlayground } from '../contexts/PlaygroundContext';
import styles from './StatusBar.module.css';

const LANG_MAP = {
  js: 'JavaScript React',
  jsx: 'JavaScript React',
  css: 'CSS',
  json: 'JSON',
  html: 'HTML',
  md: 'Markdown',
};

export default function StatusBar() {
  const { activeFile } = usePlayground();
  const ext = activeFile.split('.').pop();
  const lang = LANG_MAP[ext] || 'Plain Text';

  return (
    <div className={styles.bar}>
      <span>⚡ React 18</span>
      <span className={styles.sep} />
      <span>Babel JSX</span>
      <div className={styles.right}>
        <span>UTF-8</span>
        <span className={styles.sep} />
        <span>{lang}</span>
      </div>
    </div>
  );
}
