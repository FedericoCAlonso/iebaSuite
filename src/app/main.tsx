import React from 'react'
import ReactDOM from 'react-dom/client'
import { HubRouter } from './HubRouter'
import '../styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HubRouter />
  </React.StrictMode>
)
