import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import {
  CpuChipIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const router = useRouter()
  const { state } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token')
    if (token && state.token) {
      // Redirect to dashboard if already logged in
      router.push('/dashboard')
    }
  }, [state.token, router])

  const handleLogin = async () => {
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

  const features = [
    {
      icon: CpuChipIcon,
      title: 'AI Agents',
      description: 'Intelligent agents for code analysis, testing, and deployment'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control'
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Monitor your projects with comprehensive dashboards'
    },
    {
      icon: ClockIcon,
      title: '24/7 Monitoring',
      description: 'Continuous monitoring and automated responses'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex min-h-screen">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                  <span className="text-xl font-bold">AI</span>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Enterprise AI
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Development Platform</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Sign in to access your AI development dashboard
              </p>
            </div>

            <div className="mt-8">
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <div>
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign in with GitHub'
                  )}
                </button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      Secure authentication via GitHub OAuth
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Marketing Content */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/90 to-primary-700/90" />
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-center text-white max-w-2xl">
                <h1 className="text-5xl font-bold mb-6">
                  Enterprise AI Development Platform
                </h1>
                <p className="text-xl mb-12 text-primary-100">
                  Build, deploy, and manage AI-powered applications with ease
                </p>
                
                <div className="grid grid-cols-2 gap-8 mb-12">
                  {features.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <div key={index} className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="text-2xl font-bold mb-2">{feature.title}</div>
                        <div className="text-sm text-primary-100">{feature.description}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-4 gap-6 max-w-xl mx-auto">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">10+</div>
                    <div className="text-sm text-primary-100">AI Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">100%</div>
                    <div className="text-sm text-primary-100">Automation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">24/7</div>
                    <div className="text-sm text-primary-100">Monitoring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">Enterprise</div>
                    <div className="text-sm text-primary-100">Security</div>
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
