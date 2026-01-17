import { useState, useCallback } from 'react'

interface RateLimitState {
  remainingRequests: number
  resetTime: number | null
  isRateLimited: boolean
  lastRequestTime: number | null
}

export function useRateLimit(maxRequests: number = 5, windowMs: number = 60000) {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    remainingRequests: maxRequests,
    resetTime: null,
    isRateLimited: false,
    lastRequestTime: null
  })

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now()
    const { lastRequestTime, remainingRequests } = rateLimitState

    // Reset window if expired
    if (lastRequestTime && now - lastRequestTime > windowMs) {
      setRateLimitState({
        remainingRequests: maxRequests,
        resetTime: null,
        isRateLimited: false,
        lastRequestTime: now
      })
      return true
    }

    // Check if rate limited
    if (remainingRequests <= 0) {
      const resetTime = (lastRequestTime || 0) + windowMs
      setRateLimitState(prev => ({
        ...prev,
        isRateLimited: true,
        resetTime
      }))
      return false
    }

    // Update state for successful request
    setRateLimitState({
      remainingRequests: remainingRequests - 1,
      resetTime: null,
      isRateLimited: false,
      lastRequestTime: now
    })

    return true
  }, [rateLimitState, maxRequests, windowMs])

  const getTimeUntilReset = useCallback((): string => {
    if (!rateLimitState.resetTime) return ''
    
    const now = Date.now()
    const timeUntilReset = rateLimitState.resetTime - now
    
    if (timeUntilReset <= 0) return ''
    
    const seconds = Math.floor(timeUntilReset / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    
    return `${seconds}s`
  }, [rateLimitState.resetTime])

  const resetRateLimit = useCallback(() => {
    setRateLimitState({
      remainingRequests: maxRequests,
      resetTime: null,
      isRateLimited: false,
      lastRequestTime: null
    })
  }, [maxRequests])

  return {
    ...rateLimitState,
    checkRateLimit,
    getTimeUntilReset,
    resetRateLimit
  }
}
