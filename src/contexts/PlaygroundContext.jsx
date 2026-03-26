import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_FILES } from '../utils/defaultFiles';

const PlaygroundContext = createContext(null);

const STORAGE_KEY = 'react-playground:v1';

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readPersistedState() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParseJSON(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
}

export function PlaygroundProvider({ children }) {
  const [persistedState] = useState(() => {
    const persisted = readPersistedState();
    const mergedFiles = {
      ...DEFAULT_FILES,
      ...(persisted?.files ?? {}),
    };

    const activeFileCandidate = persisted?.activeFile;
    const activeFile =
      activeFileCandidate && mergedFiles[activeFileCandidate] !== undefined
        ? activeFileCandidate
        : (mergedFiles['App.jsx'] !== undefined ? 'App.jsx' : (Object.keys(mergedFiles)[0] ?? 'App.jsx'));

    const openTabsCandidate = Array.isArray(persisted?.openTabs) ? persisted.openTabs : null;
    const openTabs = openTabsCandidate
      ? openTabsCandidate.filter((t) => mergedFiles[t] !== undefined && t !== '')
      : ['App.jsx'];

    // Ensure the active file is always present.
    if (!openTabs.includes(activeFile)) openTabs.unshift(activeFile);

    return { files: mergedFiles, activeFile, openTabs };
  });

  const [files, setFiles] = useState(() => persistedState.files);
  const [activeFile, setActiveFile] = useState(() => persistedState.activeFile);
  const [openTabs, setOpenTabs] = useState(() => persistedState.openTabs);
  const [consoleMsgs, setConsoleMsgs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const msgIdRef = useRef(0);
  const persistTimerRef = useRef(null);

  // Persist editor state so a refresh doesn't reset code.
  // Debounced because `updateFile` runs on every keystroke.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);

    persistTimerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            files,
            activeFile,
            openTabs,
          })
        );
      } catch {
        // Ignore storage quota / private mode errors.
      }
    }, 250);

    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [files, activeFile, openTabs]);


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
