import { Analytics } from '@vercel/analytics/react'
import React from 'react'
import ReactDOM from 'react-dom/client'

// eslint-disable-next-line import/order
import './global.css'

import { Layout } from './components/dom/Layout'
import { StarknetProvider } from './components/providers/StarknetProvider'
import { UsernamesProvider } from './contexts/UsernamesContext'
import Page from './page'

function Main() {
  return (
    <StarknetProvider>
      <UsernamesProvider>
        <Layout>
          <Page />
          <Analytics />
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
