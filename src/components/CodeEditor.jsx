import { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { usePlayground } from '../contexts/PlaygroundContext';
import { formatCode } from '../utils/formatCode';
import styles from './CodeEditor.module.css';

const FILE_LANG_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  css: 'css',
  json: 'json',
  html: 'html',
  md: 'markdown',
};

function getLanguage(filename) {
  const ext = filename.split('.').pop();
  return FILE_LANG_MAP[ext] || 'javascript';
}

function getTabIconColor(filename) {
  if (filename.endsWith('.css')) return '#563d7c';
  if (filename.endsWith('.json')) return '#4ec9b0';
  if (filename.endsWith('.html')) return '#e34c26';
  return '#519aba';
}

export default function CodeEditor({ onRun }) {
  const {
    files, activeFile, openTabs,
    selectFile, closeTab, updateFile,
  } = usePlayground();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const activeFileRef = useRef(activeFile);
  const saveSeqRef = useRef(0);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  const handleFormatAndRun = useCallback(async (editor) => {
    const filename = activeFileRef.current;
    const currentCode = editor.getValue();
    const saveSeq = ++saveSeqRef.current;
    const formatted = await formatCode(filename, currentCode);
    if (saveSeq !== saveSeqRef.current) return;
    if (editor.getValue() !== currentCode) return;
    if (formatted !== currentCode) {
      updateFile(filename, formatted);
    }
    onRun?.();
  }, [onRun, updateFile]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSX support
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      allowJs: true,
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });

    // Add React type hints (basic)
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      `
      declare const React: any;
      declare const ReactDOM: any;
      declare function useState<T>(init: T): [T, (v: T | ((prev: T) => T)) => void];
      declare function useEffect(fn: () => void | (() => void), deps?: any[]): void;
      declare function useCallback<T>(fn: T, deps: any[]): T;
      declare function useMemo<T>(fn: () => T, deps: any[]): T;
      declare function useRef<T>(init?: T): { current: T };
      declare function useContext<T>(ctx: any): T;
      declare function useReducer(reducer: any, init: any): [any, any];
      declare function createContext<T>(defaultVal?: T): any;
      `,
      'file:///react-globals.d.ts'
    );

    // Ctrl/Cmd+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.();
    });

    // Ctrl/Cmd+S to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleFormatAndRun(editor);
    });

    editor.focus();
  }, [handleFormatAndRun, onRun]);

  const handleChange = useCallback((value) => {
    if (value !== undefined) {
      updateFile(activeFile, value);
    }
  }, [activeFile, updateFile]);

  return (
    <div className={styles.pane}>
      {/* Editor Tabs */}
      <div className={styles.tabs}>
        {openTabs.map((name) => {
          const isActive = name === activeFile;
          const color = getTabIconColor(name);
          return (
            <div
              key={name}
              className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
              onClick={() => selectFile(name)}
            >
              <span className={styles.tabDot} style={{ background: color }} />
              <span className={styles.tabName}>{name}</span>
              <span
                className={styles.tabClose}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(name);
                }}
              >
                ×
              </span>
            </div>
          );
        })}
      </div>

      {/* Monaco Editor */}
      <div className={styles.editorWrap}>
        <Editor
          key={activeFile}
          height="100%"
          language={getLanguage(activeFile)}
          value={files[activeFile] ?? ''}
          theme="vs-dark"
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 15,
            fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 8 },
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            tabSize: 2,
            wordWrap: 'off',
            automaticLayout: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
          loading={
            <div className={styles.loading}>
              <div className={styles.spinner} />
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
