'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'

const ChatInput = ({ onSubmit, onClose }) => {
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSubmit(message.trim())
      setMessage('')
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Html as='div' center>
      <div className='bg-black bg-opacity-50 p-4 rounded-lg'>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type='text'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className='w-64 px-2 py-1 text-black rounded'
            placeholder='Type your message...'
          />
          <button type='submit' className='ml-2 px-4 py-1 bg-blue-500 text-white rounded'>
            Send
          </button>
        </form>
      </div>
    </Html>
  )
}

export default ChatInput
