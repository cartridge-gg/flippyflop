import React from 'react'
import ReactDOM from 'react-dom/client'
import './global.css'
import Page from './page'
import { StarknetProvider } from './components/providers/StarknetProvider'

function Main() {
  return (
    <StarknetProvider>
      <div className='main'>
        <Page />
      </div>
    </StarknetProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
)
