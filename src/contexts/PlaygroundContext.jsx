import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { DEFAULT_FILES } from '../utils/defaultFiles';

const PlaygroundContext = createContext(null);

export function PlaygroundProvider({ children }) {
  const [files, setFiles] = useState(() => ({ ...DEFAULT_FILES }));
  const [activeFile, setActiveFile] = useState('App.jsx');
  const [openTabs, setOpenTabs] = useState(['App.jsx']);
  const [consoleMsgs, setConsoleMsgs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const msgIdRef = useRef(0);

  const selectFile = useCallback((name) => {
    if (!files[name] && files[name] !== '') return;
    setActiveFile(name);
    setOpenTabs((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, [files]);

  const closeTab = useCallback((name) => {
    setOpenTabs((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t !== name);
      setActiveFile((cur) => (cur === name ? next[next.length - 1] : cur));
      return next;
    });
  }, []);

  const updateFile = useCallback((name, content) => {
    setFiles((prev) => ({ ...prev, [name]: content }));
  }, []);

  const createFile = useCallback((name) => {
    if (files[name] !== undefined) return false;
    setFiles((prev) => ({ ...prev, [name]: '' }));
    setActiveFile(name);
    setOpenTabs((prev) => [...prev, name]);
    return true;
  }, [files]);

  const deleteFile = useCallback((name) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setOpenTabs((prev) => prev.filter((t) => t !== name));
    setActiveFile((cur) => {
      if (cur === name) {
        const remaining = Object.keys(files).filter((f) => f !== name);
        return remaining[0] || '';
      }
      return cur;
    });
  }, [files]);

  const addConsoleMsg = useCallback((level, message) => {
    setConsoleMsgs((prev) => [
      ...prev,
      { id: ++msgIdRef.current, level, message, timestamp: Date.now() },
    ]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleMsgs([]);
  }, []);

  const value = {
    files,
    activeFile,
    openTabs,
    consoleMsgs,
    isRunning,
    setIsRunning,
    selectFile,
    closeTab,
    updateFile,
    createFile,
    deleteFile,
    addConsoleMsg,
    clearConsole,
  };

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error('usePlayground must be used within PlaygroundProvider');
  return ctx;
}
