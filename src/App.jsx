import { useState, useCallback, useEffect, useRef } from 'react';
import { PlaygroundProvider, usePlayground } from './contexts/PlaygroundContext';
import TitleBar from './components/TitleBar';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import Console from './components/Console';
import StatusBar from './components/StatusBar';
import './App.css';

function AppLayout() {
  const { clearConsole } = usePlayground();
  const [runTrigger, setRunTrigger] = useState(0);
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [editorWidth, setEditorWidth] = useState(0);
  const appGridRef = useRef(null);
  const previewColumnRef = useRef(null);

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

  const handleConsoleResizeStart = useCallback((e) => {
    e.preventDefault();
    const column = previewColumnRef.current;
    if (!column) return;

    const onMouseMove = (moveEvent) => {
      const rect = column.getBoundingClientRect();
      const rawHeight = rect.bottom - moveEvent.clientY;
      const minHeight = 35;
      const maxHeight = Math.max(minHeight, rect.height - 120);
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, rawHeight));
      setConsoleHeight(nextHeight);
    };

    const onMouseUp = () => {
      document.body.classList.remove('is-resizing-y');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.classList.add('is-resizing-y');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleEditorPreviewResizeStart = useCallback((e) => {
    e.preventDefault();
    const grid = appGridRef.current;
    if (!grid) return;

    const onMouseMove = (moveEvent) => {
      const rect = grid.getBoundingClientRect();
      const sidebarWidth = 210;
      const splitterWidth = 6;
      const minPaneWidth = 280;
      const maxEditorWidth = Math.max(
        minPaneWidth,
        rect.width - sidebarWidth - splitterWidth - minPaneWidth
      );
      const rawWidth = moveEvent.clientX - rect.left - sidebarWidth;
      const nextWidth = Math.min(maxEditorWidth, Math.max(minPaneWidth, rawWidth));
      setEditorWidth(nextWidth);
    };

    const onMouseUp = () => {
      document.body.classList.remove('is-resizing-x');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.classList.add('is-resizing-x');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  return (
    <div
      className="app-grid"
      ref={appGridRef}
      style={editorWidth > 0 ? { '--editor-width': `${editorWidth}px` } : undefined}
    >
      <TitleBar onRun={handleRun} />
      <FileExplorer />
      <CodeEditor onRun={handleRun} />
      <div
        className="editor-preview-resizer"
        onMouseDown={handleEditorPreviewResizeStart}
        role="separator"
        aria-label="Resize editor and preview"
        aria-orientation="vertical"
      />
      <div className="preview-column" ref={previewColumnRef}>
        <Preview runTrigger={runTrigger} />
        <div
          className="preview-console-resizer"
          onMouseDown={handleConsoleResizeStart}
          role="separator"
          aria-label="Resize preview and console"
          aria-orientation="horizontal"
        />
        <Console height={consoleHeight} />
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
