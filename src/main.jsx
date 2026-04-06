import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ParentDashboard from './ParentDashboard.jsx'

function Root() {
  const isParent = window.location.hash === '#parent' || window.location.pathname.startsWith('/parent');
  return isParent ? <ParentDashboard /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
