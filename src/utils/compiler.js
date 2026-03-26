/**
 * Build an HTML string that can be loaded into an iframe to run
 * React code transpiled with Babel standalone.
 */
export function buildPreviewHTML(files) {
  const appCode = files['App.js'] || '';
  const cssCode = files['styles.css'] || '';

  const processedCode = processAppCode(appCode);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>${cssCode}</style>
  <style>
    #root { padding: 20px; }
    .error-overlay {
      background: #1e1e1e; color: #f44747; padding: 20px;
      font-family: 'Fira Code', monospace; font-size: 13px;
      white-space: pre-wrap; position: fixed; inset: 0; overflow: auto;
    }
    .error-overlay h2 { color: #f44747; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js"><\/script>

  <script>
    // ── Console interception ────────────────────────
    const _log = console.log, _warn = console.warn,
          _err = console.error, _info = console.info;

    function _send(level, args) {
      try {
        const msg = args.map(a =>
          typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        ).join(' ');
        window.parent.postMessage({ source: 'preview-console', level, message: msg }, '*');
      } catch (e) {}
    }

    console.log   = (...a) => { _log.apply(console, a);  _send('log', a); };
    console.warn  = (...a) => { _warn.apply(console, a); _send('warn', a); };
    console.error = (...a) => { _err.apply(console, a);  _send('error', a); };
    console.info  = (...a) => { _info.apply(console, a); _send('info', a); };

    window.onerror = (msg, src, line) => {
      _send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
    };
    window.onunhandledrejection = (e) => {
      _send('error', ['Unhandled Promise: ' + (e.reason?.message || e.reason || 'unknown')]);
    };
  <\/script>

  <script type="text/babel" data-presets="react">
    ${processedCode}
  <\/script>
</body>
</html>`;
}

function processAppCode(appCode) {
  // Strip ES module imports (React/ReactDOM are globals via UMD)
  let code = appCode
    .replace(/^import\s+.*?from\s+['"].*?['"]\s*;?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, 'const __DefaultExport__ = ')
    .replace(/^export\s+/gm, '');

  // Find the default-exported component name
  const match = appCode.match(/export\s+default\s+(\w+)/);
  const componentName = match ? match[1] : 'App';

  return `
    // Destructure React hooks from global
    const {
      useState, useEffect, useCallback, useMemo, useRef,
      useContext, useReducer, createContext, createElement, Fragment
    } = React;

    // ── User code ──────────────────────────────────
    ${code}

    // ── Mount ──────────────────────────────────────
    const __AppComponent = typeof __DefaultExport__ !== 'undefined'
      ? __DefaultExport__
      : (typeof ${componentName} !== 'undefined'
          ? ${componentName}
          : () => React.createElement('div', {
              style: { color: '#888', textAlign: 'center', marginTop: 60 }
            }, 'No default export found'));

    ReactDOM.createRoot(document.getElementById('root'))
      .render(React.createElement(__AppComponent));
  `;
}
