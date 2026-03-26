import { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { usePlayground } from '../contexts/PlaygroundContext';
import { formatCode } from '../utils/formatCode';
import styles from './CodeEditor.module.css';

const FILE_LANG_MAP = {
  // Route JS through TS service for richer semantic token colors.
  js: 'typescript',
  // Use TypeScript mode for `.jsx` so JSX tags/attributes are tokenized consistently.
  jsx: 'typescript',
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

    // Configure JSX support for both language services.
    const tsCompilerOptions = {
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      allowJs: true,
      // Type-check JS so Monaco can produce richer semantic tokens (even with semantic disabled,
      // it improves parsing/tokenization consistency).
      checkJs: true,
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    };

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(tsCompilerOptions);
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(tsCompilerOptions);

    // Add React type hints (basic) to both language services.
    const extraLib = `
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
    `;

    monaco.languages.typescript.javascriptDefaults.addExtraLib(extraLib, 'file:///react-globals.d.ts');
    monaco.languages.typescript.typescriptDefaults.addExtraLib(extraLib, 'file:///react-globals.d.ts');

    // Ctrl/Cmd+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.();
    });

    // Ctrl/Cmd+S to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleFormatAndRun(editor);
    });

    // Fallback auto-close for JSX/HTML tags in Monaco.
    editor.onDidType((text) => {
      if (text !== '>') return;

      const model = editor.getModel();
      const position = editor.getPosition();
      if (!model || !position) return;

      const line = model.getLineContent(position.lineNumber);
      const beforeCursor = line.slice(0, position.column - 1);
      const afterCursor = line.slice(position.column - 1);

      if (beforeCursor.endsWith('/>')) return;

      const tagMatch = beforeCursor.match(/<([A-Za-z][\w:-]*)\b[^<>]*>$/);
      if (!tagMatch) return;

      const openingTag = tagMatch[0];
      if (openingTag.startsWith('</')) return;

      const tagName = tagMatch[1];
      if (!tagName) return;

      // Avoid common non-JSX generic/comparison cases like `foo<Bar>`.
      const ltIndex = beforeCursor.lastIndexOf('<');
      const charBeforeLt = ltIndex > 0 ? beforeCursor[ltIndex - 1] : '';
      if (/[A-Za-z0-9_$.)\]]/.test(charBeforeLt)) return;

      if (afterCursor.trimStart().startsWith(`</${tagName}`)) return;

      editor.executeEdits('auto-close-tag', [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: `</${tagName}>`,
          forceMoveMarkers: true,
        },
      ]);

      editor.setPosition(position);
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
            autoClosingTags: 'always',
            formatOnPaste: true,
            tabSize: 2,
            wordWrap: 'off',
            // Enable semantic token colors (method names, params, properties, etc).
            'semanticHighlighting.enabled': true,
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
