import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import React, { useState } from 'react'
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

// Convert to forwardRef and add ref type
const MusicPlayer = React.forwardRef<MusicPlayerHandle, MusicPlayerProps>(({ className = '', outline }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const targetVolume = React.useRef(volume)
  const [isManuallyPaused, setIsManuallyPaused] = useState(false)

  const [play, { pause, sound }] = useSound(BackgroundMusic, {
    volume: 0,
    loop: true,
    interrupt: true,
  })

  const fadeIn = React.useCallback(async () => {
    if (!sound) return
    let vol = 0
    const interval = setInterval(() => {
      vol = Math.min(vol + 0.01, targetVolume.current)
      sound.volume(vol)
      if (vol >= targetVolume.current) {
        clearInterval(interval)
      }
    }, 50)
  }, [sound])

  const fadeOut = React.useCallback(async () => {
    if (!sound) return
    let vol = sound.volume()
    return await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        vol = Math.max(vol - 0.01, 0)
        sound.volume(vol)
        if (vol <= 0) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
  }, [sound])

  const handlePlayPause = async () => {
    if (isPlaying) {
      setIsPausing(true)
      setIsManuallyPaused(true)
      await fadeOut()
      pause()
      setIsPlaying(false)
      setIsPausing(false)
    } else {
      setIsManuallyPaused(false)
      if (!sound || !sound.playing()) {
        play()
      }
      setIsPlaying(true)
      fadeIn()
    }
  }

  React.useImperativeHandle(ref, () => ({
    play: async () => {
      if (!isPlaying) {
        if (!sound || !sound.playing()) {
          play()
        }
        setIsPlaying(true)
        fadeIn()
      }
    },
    pause: async () => {
      if (isPlaying) {
        setIsPausing(true)
        await fadeOut()
        pause()
        setIsPlaying(false)
        setIsPausing(false)
      }
    },
  }))

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    targetVolume.current = newVolume
    setVolume(newVolume)
    if (sound) {
      sound.volume(newVolume)
    }
  }

  React.useEffect(() => {
    const initializeAudio = async () => {
      const hasInteracted = document.documentElement.classList.contains('user-interacted')

      if (hasInteracted && !isManuallyPaused) {
        if (!sound || !sound.playing()) {
          play()
        }
        setIsPlaying(true)
        fadeIn()
      }
    }

    initializeAudio()
  }, [sound, play, fadeIn, isManuallyPaused])

  React.useEffect(() => {
    const handleInteraction = () => {
      document.documentElement.classList.add('user-interacted')
      if (!isPlaying && !isManuallyPaused) {
        if (!sound || !sound.playing()) {
          play()
        }
        setIsPlaying(true)
        fadeIn()
      }

      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }

    window.addEventListener('click', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [sound, play, fadeIn, isPlaying, isManuallyPaused])

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
        onClick={handlePlayPause}
        className='flex h-6 w-6 items-center justify-center text-white hover:opacity-80 transition-opacity'
        disabled={isPausing}
      >
        {isPausing ? <span className='animate-pulse'>⋯</span> : isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
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
