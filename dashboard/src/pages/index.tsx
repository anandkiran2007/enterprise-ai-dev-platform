import { useState, useEffect } from 'react'
import { useRateLimit } from '../hooks/useRateLimit'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const rateLimit = useRateLimit(5, 60000) // 5 requests per minute

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token')
    if (token) {
      setIsAuthenticated(true)
      // Redirect to dashboard if already logged in
      window.location.href = '/dashboard'
    }
  }, [])

  const handleLogin = async () => {
    // Check rate limit first
    if (!rateLimit.checkRateLimit()) {
      setError(`Rate limit exceeded. Please wait ${rateLimit.getTimeUntilReset()} before trying again.`)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Redirect to GitHub OAuth authorize endpoint
      window.location.href = '/api/auth/github/authorize'
    } catch (err) {
      setError('Failed to initiate authentication. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Enterprise AI Platform
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to access your AI development dashboard
              </p>
            </div>

            <div className="mt-8">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {rateLimit.isRateLimited && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        Rate limit exceeded. Please wait {rateLimit.getTimeUntilReset()} before trying again.
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Remaining requests: {rateLimit.remainingRequests}/{5}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated ? (
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Welcome back!
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    You are now signed in to Enterprise AI Platform.
                  </p>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-primary-600">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-4">
                  Enterprise AI Development Platform
                </h1>
                <p className="text-xl mb-8">
                  Build, deploy, and manage AI-powered applications with ease
                </p>
                <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">10+</div>
                    <div className="text-sm">AI Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">100%</div>
                    <div className="text-sm">Automation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">24/7</div>
                    <div className="text-sm">Monitoring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">Enterprise</div>
                    <div className="text-sm">Security</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
