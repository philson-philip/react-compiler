export const DEFAULT_FILES = {
  'App.js': `// Type your code here`,

  'index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  'styles.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  background: #f5f5f5;
  color: #333;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 8px 12px;
  margin: 4px 0;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

input[type="text"] {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input[type="text"]:focus {
  border-color: #58a6ff;
}`,
};
