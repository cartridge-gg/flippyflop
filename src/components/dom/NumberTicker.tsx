import React, { useState, useEffect } from 'react'

const NumberTicker = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const valueDelta = Math.abs(value - displayValue)
    const steps = Math.min(Math.max(Math.ceil(valueDelta / 2), 5), 30)
    const stepValue = (value - displayValue) / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setDisplayValue((prevValue) => {
        const newValue = prevValue + stepValue
        return currentStep === steps ? value : Math.round(newValue)
      })

      if (currentStep === steps) {
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return <span>{displayValue.toLocaleString()}</span>
}

export default NumberTicker
