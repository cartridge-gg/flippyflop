import { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster } from 'sonner'

const Layout = ({ children }) => {
  const ref = useRef()

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: ' 100%',
        height: '100%',
        overflow: 'auto',
        touchAction: 'auto',
      }}
    >
      <Toaster
        className='hidden md:flex'
        position='bottom-left'
        toastOptions={{
          className: 'text-sm',
          style: {
            color: 'white',
            display: 'flex',
            padding: '8px 12px',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'stretch',
            borderRadius: '8px',
            background: 'rgba(8, 14, 19, 0.64)',
            boxShadow: '0px 4px 4px 0px #000',
            backdropFilter: 'blur(8px)',
            width: '100%',
          },
        }}
      />
      {children}
    </div>
  )
}

export { Layout }
