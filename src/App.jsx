import { useState, useCallback, useEffect } from 'react';
import { PlaygroundProvider, usePlayground } from './contexts/PlaygroundContext';
import TitleBar from './components/TitleBar';
import ActivityBar from './components/ActivityBar';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import Console from './components/Console';
import StatusBar from './components/StatusBar';
import './App.css';

function AppLayout() {
  const { clearConsole } = usePlayground();
  const [runTrigger, setRunTrigger] = useState(0);

  const handleRun = useCallback(() => {
    clearConsole();
    setRunTrigger((c) => c + 1);
  }, [clearConsole]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun]);

  return (
    <div className="app-grid">
      <TitleBar onRun={handleRun} />
      <ActivityBar />
      <FileExplorer />
      <CodeEditor onRun={handleRun} />
      <div className="preview-column">
        <Preview runTrigger={runTrigger} />
        <Console />
      </div>
      <StatusBar />
    </div>
  );
}

export default function App() {
  return (
    <PlaygroundProvider>
      <AppLayout />
    </PlaygroundProvider>
  );
}
