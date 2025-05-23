import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fortawesome/fontawesome-free/css/all.min.css';
import "leaflet/dist/leaflet.css";
import "animate.css";

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
