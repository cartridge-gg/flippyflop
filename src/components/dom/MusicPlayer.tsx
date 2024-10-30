import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import useSound from 'use-sound'

import BackgroundMusic from '@/../public/sfx/music.mp3'

export interface MusicPlayerHandle {
  play: () => void
  pause: () => void
}

interface MusicPlayerProps {
  className?: string
  outline: string
}

const MusicPlayer = React.forwardRef<MusicPlayerHandle, MusicPlayerProps>(({ className = '', outline }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)

  const [play, { pause, sound }] = useSound(BackgroundMusic, {
    loop: true,
    interrupt: true,
  })

  // Update volume effect
  useEffect(() => {
    sound?.volume(volume)
  }, [volume, sound])

  // Handle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      pause()
      setIsPlaying(false)
    } else {
      play()
      setIsPlaying(true)
    }
  }

  // Handle volume changes
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    sound?.volume(newVolume)
  }

  // Toggle mute
  const toggleMute = () => {
    setVolume(volume === 0 ? 0.5 : 0)
    sound?.volume(volume === 0 ? 0.5 : 0)
  }

  // Expose play/pause methods via ref
  React.useImperativeHandle(ref, () => ({
    play: () => {
      if (!isPlaying) {
        play()
        setIsPlaying(true)
      }
    },
    pause: () => {
      if (isPlaying) {
        pause()
        setIsPlaying(false)
      }
    },
  }))

  // Auto-play after first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isPlaying) {
        play()
        setIsPlaying(true)
      }
      // Remove listeners after first interaction
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }

    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)

    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [isPlaying, play])

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 rounded-lg bg-[#080E13] bg-opacity-70 backdrop-blur-sm px-3 py-2 animate-border-pulse ${className}`}
      style={{
        boxShadow: `0px 4px 4px 0px rgba(0, 0, 0, 0.50),
                    0 0 10px ${outline}40,
                    0 0 20px ${outline}20`,
        borderColor: outline,
        border: `1px solid ${outline}`,
        animation: 'border-pulse 2s ease-in-out infinite',
      }}
    >
      <button
        onClick={togglePlayback}
        className='flex h-6 w-6 items-center justify-center text-white hover:opacity-80 transition-opacity'
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        onClick={toggleMute}
        className='flex h-6 w-6 items-center justify-center text-white hover:opacity-80 transition-opacity'
      >
        {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <input
        type='range'
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleVolumeChange}
        className='h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10'
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: `linear-gradient(to right, ${outline} 0%, ${outline} ${
            volume * 100
          }%, rgba(255, 255, 255, 0.1) ${volume * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
        }}
      />
    </div>
  )
})

export default MusicPlayer
