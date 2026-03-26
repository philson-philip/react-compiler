import { useRef, useCallback, useEffect, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { css as cssLanguage } from '@codemirror/lang-css';
import { json as jsonLanguage } from '@codemirror/lang-json';
import { html as htmlLanguage, autoCloseTags } from '@codemirror/lang-html';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import MonacoEditor from '@monaco-editor/react';
import { usePlayground } from '../contexts/PlaygroundContext';
import { formatCode } from '../utils/formatCode';
import styles from './CodeEditor.module.css';

function getLanguageExtensions(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'css') return [cssLanguage()];
  if (ext === 'json') return [jsonLanguage()];
  if (ext === 'html') return [htmlLanguage(), autoCloseTags];
  if (ext === 'md') return [markdownLanguage()];
  if (ext === 'ts') return [javascript({ typescript: true })];
  if (ext === 'tsx') return [javascript({ typescript: true, jsx: true }), autoCloseTags];
  if (ext === 'jsx') return [javascript({ jsx: true }), autoCloseTags];
  return [javascript()];
}

function getMonacoLanguage(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'css') return 'css';
  if (ext === 'json') return 'json';
  if (ext === 'html') return 'html';
  if (ext === 'md') return 'markdown';
  // Route JS/JSX/TS/TSX through TS service for better JSX handling.
  return 'typescript';
}

function getTabIconColor(filename) {
  if (filename.endsWith('.css')) return '#563d7c';
  if (filename.endsWith('.json')) return '#4ec9b0';
  if (filename.endsWith('.html')) return '#e34c26';
  return '#519aba';
}

function CodeMirrorSurface({ activeFile, value, onChange, onRun, onFormatAndRun }) {
  const extensions = useMemo(() => {
    return [
      ...getLanguageExtensions(activeFile),
      Prec.high(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onRun?.();
              return true;
            },
          },
          {
            key: 'Mod-s',
            run: (view) => {
              const currentCode = view.state.doc.toString();
              void onFormatAndRun(currentCode);
              return true;
            },
          },
        ])
      ),
    ];
  }, [activeFile, onFormatAndRun, onRun]);

  return (
    <CodeMirror
      key={activeFile}
      value={value}
      height="100%"
      theme={vscodeDark}
      extensions={extensions}
      onChange={onChange}
      basicSetup={{
        foldGutter: false,
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        autocompletion: true,
        closeBrackets: true,
        defaultKeymap: true,
        searchKeymap: true,
      }}
      editable
      indentWithTab
      style={{
        height: '100%',
        fontSize: '15px',
        fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
      }}
    />
  );
}

function MonacoSurface({ activeFile, value, onChange, onRun, onFormatAndRun }) {
  const handleEditorDidMount = useCallback((editor, monaco) => {
    const tsCompilerOptions = {
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      allowJs: true,
      checkJs: true,
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    };

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(tsCompilerOptions);
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(tsCompilerOptions);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      void onFormatAndRun(editor.getValue());
    });

    // Auto-close tags fallback for Monaco.
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

      const tagName = tagMatch[1];
      if (!tagName) return;

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
  }, [onFormatAndRun, onRun]);

  return (
    <MonacoEditor
      key={activeFile}
      height="100%"
      language={getMonacoLanguage(activeFile)}
      value={value}
      theme="vs-dark"
      onChange={(next) => onChange(next ?? '')}
      onMount={handleEditorDidMount}
      options={{
        fontSize: 15,
        fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 8 },
        renderLineHighlight: 'line',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoClosingTags: 'always',
        formatOnPaste: true,
        tabSize: 2,
        wordWrap: 'off',
        automaticLayout: true,
      }}
    />
  );
}

export default function CodeEditor({ onRun, editorEngine }) {
  const {
    files, activeFile, openTabs,
    selectFile, closeTab, updateFile,
  } = usePlayground();

  const activeFileRef = useRef(activeFile);
  const filesRef = useRef(files);
  const saveSeqRef = useRef(0);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const handleFormatAndRun = useCallback(async (currentCode) => {
    const filename = activeFileRef.current;
    const saveSeq = ++saveSeqRef.current;
    const formatted = await formatCode(filename, currentCode);
    if (saveSeq !== saveSeqRef.current) return;
    if (filesRef.current[filename] !== currentCode) return;
    if (formatted !== currentCode) {
      updateFile(filename, formatted);
    }
    onRun?.();
  }, [onRun, updateFile]);

  const handleChange = useCallback((value) => {
    updateFile(activeFile, value);
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

      <div className={styles.editorWrap}>
        {editorEngine === 'monaco' ? (
          <MonacoSurface
            activeFile={activeFile}
            value={files[activeFile] ?? ''}
            onChange={handleChange}
            onRun={onRun}
            onFormatAndRun={handleFormatAndRun}
          />
        ) : (
          <CodeMirrorSurface
            activeFile={activeFile}
            value={files[activeFile] ?? ''}
            onChange={handleChange}
            onRun={onRun}
            onFormatAndRun={handleFormatAndRun}
          />
        )}
      </div>
    </div>
  );
}
