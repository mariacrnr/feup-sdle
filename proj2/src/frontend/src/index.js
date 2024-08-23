import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

let backend = process.env.REACT_APP_BACKEND;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App port={backend}/>
  </React.StrictMode>
);

