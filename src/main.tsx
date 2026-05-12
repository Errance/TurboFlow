import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const githubPagesRedirect = window.sessionStorage.getItem('turboFlowRedirect')
if (githubPagesRedirect) {
  window.sessionStorage.removeItem('turboFlowRedirect')
  window.history.replaceState(null, '', githubPagesRedirect)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
