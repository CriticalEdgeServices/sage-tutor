import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ParentDashboard from './ParentDashboard.jsx'

const hash = window.location.hash;
const path = window.location.pathname;
const isParent = path.startsWith('/parent') || hash === '#parent' || hash.startsWith('#/parent');

function Root() {
  return isParent ? <ParentDashboard /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
