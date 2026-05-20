import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
const initialPageMode = normalizedPath === '/ootd-template'
  ? 'ootd_template'
  : normalizedPath === '/prompt-library'
    ? 'prompt_library'
    : 'core'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialPageMode={initialPageMode} />
  </StrictMode>,
)
