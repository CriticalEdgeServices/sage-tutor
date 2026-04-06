import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const isParent = window.location.pathname.includes('parent') || 
                 window.location.hash.includes('parent') ||
                 window.location.search.includes('parent');

async function init() {
  const root = createRoot(document.getElementById('root'));
  if (isParent) {
    const { default: ParentDashboard } = await import('./ParentDashboard.jsx');
    root.render(<StrictMode><ParentDashboard /></StrictMode>);
  } else {
    const { default: App } = await import('./App.jsx');
    root.render(<StrictMode><App /></StrictMode>);
  }
}

init();
