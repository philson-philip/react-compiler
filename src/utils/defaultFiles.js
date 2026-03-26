export const DEFAULT_FILES = {
  'App.js': `import React, { useState, useEffect } from 'react';

// Simulate an API call to fetch user data
const fetchUsers = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'David' },
        { id: 5, name: 'Eve' },
      ];
      resolve(users);
    }, 1000); // Simulate a 1-second delay
  });
};

const UserList = () => {
  // Step 1: Declare all the necessary states.

  // Step 2: Fetch users from the API

  // Step 3: Filter users based on search term (implement the logic)

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name"
      />

      {/* Step 4: Handle loading and error state */}

      <ul>
        {/* Step 5: Render the filtered list of users (to be completed) */}
      </ul>
    </div>
  );
};

export default UserList;`,

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
