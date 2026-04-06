import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ParentDashboard from './ParentDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode><ParentDashboard /></StrictMode>
)
