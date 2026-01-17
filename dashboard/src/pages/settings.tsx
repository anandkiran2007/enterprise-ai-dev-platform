import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'

type UserSettings = {
  theme: 'light' | 'dark' | 'system'
  email_notifications: boolean
  push_notifications: boolean
  language: string
  timezone: string
}

type IntegrationSettings = {
  github_connected: boolean
  github_username?: string
  slack_connected: boolean
  slack_webhook_url?: string
  discord_connected: boolean
  discord_webhook_url?: string
}

type EnvironmentSettings = {
  environment: 'development' | 'staging' | 'production'
  api_url: string
  websocket_url: string
  redis_url: string
  database_url: string
}

export default function SettingsPage() {
  const { state } = useAuth()

  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'environment'>('profile')
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: 'system',
    email_notifications: true,
    push_notifications: false,
    language: 'en',
    timezone: 'UTC'
  })

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    github_connected: false,
    slack_connected: false,
    discord_connected: false
  })

  const [environmentSettings, setEnvironmentSettings] = useState<EnvironmentSettings>({
    environment: 'development',
    api_url: '',
    websocket_url: '',
    redis_url: '',
    database_url: ''
  })

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showGithubConnect, setShowGithubConnect] = useState(false)
  const [showSlackSetup, setShowSlackSetup] = useState(false)
  const [showDiscordSetup, setShowDiscordSetup] = useState(false)

  const authHeader = useMemo(() => {
    const token = state.token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }, [state.token])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load settings (${res.status})`)
      }
      const data = await res.json()
      setUserSettings(data.user || userSettings)
      setIntegrationSettings(data.integrations || integrationSettings)
      setEnvironmentSettings(data.environment || environmentSettings)
    } catch (e: any) {
      setError(e?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveUserSettings = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(userSettings),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to save user settings (${res.status})`)
      }
      setSuccess('User settings saved successfully')
    } catch (e: any) {
      setError(e?.message || 'Failed to save user settings')
    } finally {
      setSubmitting(false)
    }
  }

  const saveIntegrationSettings = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(integrationSettings),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to save integration settings (${res.status})`)
      }
      setSuccess('Integration settings saved successfully')
    } catch (e: any) {
      setError(e?.message || 'Failed to save integration settings')
    } finally {
      setSubmitting(false)
    }
  }

  const saveEnvironmentSettings = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/settings/environment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(environmentSettings),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to save environment settings (${res.status})`)
      }
      setSuccess('Environment settings saved successfully')
    } catch (e: any) {
      setError(e?.message || 'Failed to save environment settings')
    } finally {
      setSubmitting(false)
    }
  }

  const connectGithub = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/github/connect', {
        method: 'POST',
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to connect GitHub (${res.status})`)
      }
      const data = await res.json()
      setIntegrationSettings(prev => ({
        ...prev,
        github_connected: true,
        github_username: data.username
      }))
      setShowGithubConnect(false)
      setSuccess('GitHub connected successfully')
    } catch (e: any) {
      setError(e?.message || 'Failed to connect GitHub')
    } finally {
      setSubmitting(false)
    }
  }

  const disconnectGithub = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub?')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/github/disconnect', {
        method: 'POST',
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to disconnect GitHub (${res.status})`)
      }
      setIntegrationSettings(prev => ({
        ...prev,
        github_connected: false,
        github_username: undefined
      }))
      setSuccess('GitHub disconnected successfully')
    } catch (e: any) {
      setError(e?.message || 'Failed to disconnect GitHub')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Manage your account preferences, integrations, and environment configuration.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'integrations', label: 'Integrations' },
                { id: 'environment', label: 'Environment' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                      <select
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={userSettings.theme}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={userSettings.email_notifications}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Email notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={userSettings.push_notifications}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, push_notifications: e.target.checked }))}
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Push notifications
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Localization</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                      <select
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={userSettings.language}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value }))}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                      <select
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={userSettings.timezone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    className="btn btn-primary"
                    onClick={saveUserSettings}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Profile Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">GitHub</h3>
                  <div className="mt-4">
                    {integrationSettings.github_connected ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Connected as {integrationSettings.github_username}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              GitHub integration is active
                            </p>
                          </div>
                          <button
                            className="btn btn-secondary"
                            onClick={disconnectGithub}
                            disabled={submitting}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Connect GitHub
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Link your GitHub account to access repositories
                            </p>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={connectGithub}
                            disabled={submitting}
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Slack</h3>
                  <div className="mt-4">
                    {integrationSettings.slack_connected ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Slack integration is active
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Notifications will be sent to your Slack workspace
                            </p>
                          </div>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setIntegrationSettings(prev => ({ ...prev, slack_connected: false }))}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Connect Slack
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Get notifications in your Slack workspace
                            </p>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowSlackSetup(true)}
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Discord</h3>
                  <div className="mt-4">
                    {integrationSettings.discord_connected ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Discord integration is active
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Notifications will be sent to your Discord server
                            </p>
                          </div>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setIntegrationSettings(prev => ({ ...prev, discord_connected: false }))}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Connect Discord
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Get notifications in your Discord server
                            </p>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowDiscordSetup(true)}
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    className="btn btn-primary"
                    onClick={saveIntegrationSettings}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Integration Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'environment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Environment Configuration</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
                      <select
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={environmentSettings.environment}
                        onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, environment: e.target.value as any }))}
                      >
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API URL</label>
                      <input
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={environmentSettings.api_url}
                        onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, api_url: e.target.value }))}
                        placeholder="http://localhost:8000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WebSocket URL</label>
                      <input
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={environmentSettings.websocket_url}
                        onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, websocket_url: e.target.value }))}
                        placeholder="ws://localhost:8000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Redis URL</label>
                      <input
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={environmentSettings.redis_url}
                        onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, redis_url: e.target.value }))}
                        placeholder="redis://localhost:6379"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Database URL</label>
                      <input
                        className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                        value={environmentSettings.database_url}
                        onChange={(e) => setEnvironmentSettings(prev => ({ ...prev, database_url: e.target.value }))}
                        placeholder="postgresql://localhost:5432/db"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    className="btn btn-primary"
                    onClick={saveEnvironmentSettings}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Environment Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slack Setup Modal */}
        {showSlackSetup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect Slack</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowSlackSetup(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Webhook URL</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={integrationSettings.slack_webhook_url || ''}
                      onChange={(e) => setIntegrationSettings(prev => ({ ...prev, slack_webhook_url: e.target.value }))}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      className="btn btn-primary flex-1"
                      onClick={() => {
                        setIntegrationSettings(prev => ({ ...prev, slack_connected: true }))
                        setShowSlackSetup(false)
                        setSuccess('Slack connected successfully')
                      }}
                      disabled={!integrationSettings.slack_webhook_url?.trim()}
                    >
                      Connect
                    </button>
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => setShowSlackSetup(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discord Setup Modal */}
        {showDiscordSetup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect Discord</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDiscordSetup(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Webhook URL</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={integrationSettings.discord_webhook_url || ''}
                      onChange={(e) => setIntegrationSettings(prev => ({ ...prev, discord_webhook_url: e.target.value }))}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      className="btn btn-primary flex-1"
                      onClick={() => {
                        setIntegrationSettings(prev => ({ ...prev, discord_connected: true }))
                        setShowDiscordSetup(false)
                        setSuccess('Discord connected successfully')
                      }}
                      disabled={!integrationSettings.discord_webhook_url?.trim()}
                    >
                      Connect
                    </button>
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => setShowDiscordSetup(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
