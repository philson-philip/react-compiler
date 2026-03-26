import { useState, useCallback, useEffect, useRef } from 'react';
import { PlaygroundProvider, usePlayground } from './contexts/PlaygroundContext';
import TitleBar from './components/TitleBar';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import Console from './components/Console';
import StatusBar from './components/StatusBar';
import './App.css';

const EXPLORER_COLLAPSED_STORAGE_KEY = 'react-playground:explorer-collapsed';
const EDITOR_ENGINE_STORAGE_KEY = 'react-playground:editor-engine';

function readExplorerCollapsedState() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(EXPLORER_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readEditorEngineState() {
  if (typeof window === 'undefined') return 'codemirror';
  try {
    const value = window.localStorage.getItem(EDITOR_ENGINE_STORAGE_KEY);
    return value === 'monaco' ? 'monaco' : 'codemirror';
  } catch {
    return 'codemirror';
  }
}

function AppLayout() {
  const { clearConsole } = usePlayground();
  const [runTrigger, setRunTrigger] = useState(0);
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [editorWidth, setEditorWidth] = useState(0);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(readExplorerCollapsedState);
  const [editorEngine, setEditorEngine] = useState(readEditorEngineState);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        EXPLORER_COLLAPSED_STORAGE_KEY,
        String(isExplorerCollapsed)
      );
    } catch {
      // Ignore storage errors (e.g. private mode restrictions).
    }
  }, [isExplorerCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(EDITOR_ENGINE_STORAGE_KEY, editorEngine);
    } catch {
      // Ignore storage errors (e.g. private mode restrictions).
    }
  }, [editorEngine]);

  const handleConsoleResizeStart = useCallback((e) => {
    e.preventDefault();
    const column = previewColumnRef.current;
    if (!column) return;

    const startY = e.clientY;
    const startHeight = consoleHeight;
    const columnHeight = column.getBoundingClientRect().height;
    const minHeight = 35;
    const maxHeight = Math.max(minHeight, columnHeight - 120);
    let rafId = 0;
    let pendingHeight = startHeight;

    const flushHeight = () => {
      rafId = 0;
      setConsoleHeight(pendingHeight);
    };

    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const rawHeight = startHeight - deltaY;
      pendingHeight = Math.min(maxHeight, Math.max(minHeight, rawHeight));

      if (!rafId) {
        rafId = window.requestAnimationFrame(flushHeight);
      }
    };

    const onMouseUp = () => {
      document.body.classList.remove('is-resizing-y');
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.classList.add('is-resizing-y');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [consoleHeight]);

  const handleEditorPreviewResizeStart = useCallback((e) => {
    e.preventDefault();
    const grid = appGridRef.current;
    if (!grid) return;

    const rect = grid.getBoundingClientRect();
    const sidebarWidth = isExplorerCollapsed ? 0 : 210;
    const splitterWidth = 6;
    const minPaneWidth = 280;
    const maxEditorWidth = Math.max(
      minPaneWidth,
      rect.width - sidebarWidth - splitterWidth - minPaneWidth
    );
    const startX = e.clientX;
    const startWidth = Math.min(
      maxEditorWidth,
      Math.max(minPaneWidth, e.clientX - rect.left - sidebarWidth)
    );
    let rafId = 0;
    let pendingWidth = startWidth;

    const flushWidth = () => {
      rafId = 0;
      setEditorWidth(pendingWidth);
    };

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const rawWidth = startWidth + deltaX;
      pendingWidth = Math.min(maxEditorWidth, Math.max(minPaneWidth, rawWidth));

      if (!rafId) {
        rafId = window.requestAnimationFrame(flushWidth);
      }
    };

    const onMouseUp = () => {
      document.body.classList.remove('is-resizing-x');
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.classList.add('is-resizing-x');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [isExplorerCollapsed]);

  return (
    <div
      className={`app-grid ${isExplorerCollapsed ? 'explorer-collapsed' : ''}`}
      ref={appGridRef}
      style={editorWidth > 0 ? { '--editor-width': `${editorWidth}px` } : undefined}
    >
      <TitleBar
        onRun={handleRun}
        isExplorerCollapsed={isExplorerCollapsed}
        onToggleExplorer={() => setIsExplorerCollapsed((c) => !c)}
        editorEngine={editorEngine}
        onEditorEngineChange={setEditorEngine}
      />
      <FileExplorer />
      <CodeEditor onRun={handleRun} editorEngine={editorEngine} />
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
