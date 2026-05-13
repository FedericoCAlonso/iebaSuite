import React from 'react'
import ReactDOM from 'react-dom/client'
import { HubRouter } from './hub/HubRouter'
import '../style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HubRouter />
  </React.StrictMode>
)
