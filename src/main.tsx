import React from 'react'
import ReactDOM from 'react-dom/client'
import './global.css'
import Page from './page'
import { StarknetProvider } from './components/providers/StarknetProvider'
import { Layout } from './components/dom/Layout'
import { UsernamesProvider } from './contexts/UsernamesContext'

function Main() {
  return (
    <StarknetProvider>
      <UsernamesProvider>
        <Layout>
          <Page />
        </Layout>
      </UsernamesProvider>
    </StarknetProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
)
