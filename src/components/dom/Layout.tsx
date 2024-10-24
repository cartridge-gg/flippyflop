import { useRef } from 'react'
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
          className: 'text-md',
          style: {
            color: 'white',
            display: 'flex',
            padding: '8px 12px',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignSelf: 'stretch',
            borderRadius: '8px',
            background: 'rgba(8, 14, 19, 0.64)',
            boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            width: '100%',
          },
          unstyled: true,
        }}
      />
      {children}
    </div>
  )
}

export { Layout }
