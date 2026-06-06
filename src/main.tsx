import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
const initialPageMode = normalizedPath === '/ootd-template'
  ? 'ootd_template'
  : normalizedPath === '/storyboard-template'
    ? 'storyboard_template'
  : normalizedPath === '/music-video-template'
    ? 'music_video_template'
  : normalizedPath === '/tiktok-shop-affiliate-template'
    ? 'tiktok_shop_affiliate_template'
  : normalizedPath === '/prompt-library'
    ? 'prompt_library'
    : 'core'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialPageMode={initialPageMode} />
  </StrictMode>,
)
