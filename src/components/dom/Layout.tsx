import { useEffect, useMemo, useRef, useState } from 'react'
import toast, { Toaster, useToasterStore } from 'react-hot-toast'

function useMaxToasts(max: number) {
  const { toasts } = useToasterStore()

  useEffect(() => {
    toasts
      .filter((t) => t.visible) // Only consider visible toasts
      .filter((_, i) => i >= max) // Is toast index over limit?
      .forEach((t) => toast.dismiss(t.id)) // Dismiss – Use toast.remove(t.id) for no exit animation
  }, [toasts, max])
}

function ToasterWithMax({
  max = 4,
  ...props
}: React.ComponentProps<typeof Toaster> & {
  max?: number
}) {
  useMaxToasts(max)

  return <Toaster {...props} />
}

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
      <ToasterWithMax
        containerClassName='hidden md:flex text-sm'
        position='bottom-left'
        toastOptions={{
          className: '',
          style: {
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
