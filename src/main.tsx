import React from 'react'
import ReactDOM from 'react-dom/client'
import './global.css'
import Page from './page'
import { StarknetProvider } from './components/providers/StarknetProvider'
import { Layout } from './components/dom/Layout'

function Main() {
  return (
    <StarknetProvider>
      <Layout>
        <Page />
      </Layout>
    </StarknetProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
)
