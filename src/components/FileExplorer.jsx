import { useState } from 'react';
import { usePlayground } from '../contexts/PlaygroundContext';
import styles from './FileExplorer.module.css';

export default function FileExplorer() {
  const { files, activeFile, selectFile, createFile, deleteFile } = usePlayground();
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (name && createFile(name)) {
      setNewName('');
      setShowInput(false);
    }
  };

  const fileIcon = (name) => {
    if (name.endsWith('.css')) return { color: '#563d7c', label: 'CSS' };
    if (name.endsWith('.json')) return { color: '#4ec9b0', label: 'JSON' };
    return { color: '#519aba', label: 'JS' };
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span>Explorer</span>
        <button
          className={styles.addBtn}
          onClick={() => setShowInput(true)}
          title="New File"
        >
          ＋
        </button>
      </div>

      <div className={styles.tree}>
        {/* Folder header */}
        <div className={styles.folder}>
          <span className={styles.chevron}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </span>
          <svg viewBox="0 0 24 24" fill="#dcb67a" width="16" height="16">
            <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span>src</span>
        </div>

        {/* File list */}
        {Object.keys(files).map((name) => {
          const icon = fileIcon(name);
          const isActive = name === activeFile;
          return (
            <div
              key={name}
              className={`${styles.file} ${isActive ? styles.active : ''}`}
              onClick={() => selectFile(name)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (Object.keys(files).length > 1 && confirm(`Delete ${name}?`)) {
                  deleteFile(name);
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill={icon.color} width="16" height="16">
                <circle cx="12" cy="12" r="7" />
              </svg>
              <span>{name}</span>
            </div>
          );
        })}

        {/* Inline new-file input */}
        {showInput && (
          <div className={styles.newFileRow}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowInput(false);
              }}
              onBlur={() => {
                if (newName.trim()) handleCreate();
                else setShowInput(false);
              }}
              placeholder="filename.js"
            />
          </div>
        )}
      </div>
    </div>
  );
}
