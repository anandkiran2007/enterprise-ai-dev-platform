import React, { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { FormField } from '../components/ui/FormField'
import {
  CogIcon,
  UserIcon,
  LinkIcon,
  ServerIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

type Tab = 'profile' | 'integrations' | 'environment'

export default function SettingsPage() {
  const { state } = useAuth()
  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [saving, setSaving] = useState(false)
  const [showSlackModal, setShowSlackModal] = useState(false)
  const [showDiscordModal, setShowDiscordModal] = useState(false)

  // User settings
  const [userSettings, setUserSettings] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    email_notifications: true,
    push_notifications: false,
    language: 'en',
    timezone: 'UTC'
  })

  // Integration settings
  const [integrations, setIntegrations] = useState({
    github_connected: false,
    github_username: undefined as string | undefined,
    slack_connected: false,
    slack_webhook_url: '',
    discord_connected: false,
    discord_webhook_url: ''
  })

  // Environment settings
  const [envSettings, setEnvSettings] = useState({
    environment: 'development' as 'development' | 'staging' | 'production',
    api_url: process.env.NEXT_PUBLIC_API_URL || '',
    websocket_url: '',
    redis_url: '',
    database_url: ''
  })

  const handleSaveUserSettings = async () => {
    setSaving(true)
    try {
      // TODO: Call API to save settings
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      showSuccess('User settings saved successfully')
    } catch (error: any) {
      showError(error.message || 'Failed to save user settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIntegrations = async () => {
    setSaving(true)
    try {
      // TODO: Call API to save integrations
      await new Promise(resolve => setTimeout(resolve, 500))
      showSuccess('Integration settings saved successfully')
    } catch (error: any) {
      showError(error.message || 'Failed to save integration settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEnvironment = async () => {
    setSaving(true)
    try {
      // TODO: Call API to save environment settings
      await new Promise(resolve => setTimeout(resolve, 500))
      showSuccess('Environment settings saved successfully')
    } catch (error: any) {
      showError(error.message || 'Failed to save environment settings')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectGithub = async () => {
    setSaving(true)
    try {
      // TODO: Implement GitHub OAuth flow
      await new Promise(resolve => setTimeout(resolve, 500))
      setIntegrations(prev => ({ ...prev, github_connected: true, github_username: 'github-user' }))
      showSuccess('GitHub connected successfully')
    } catch (error: any) {
      showError(error.message || 'Failed to connect GitHub')
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectGithub = () => {
    if (confirm('Are you sure you want to disconnect GitHub?')) {
      setIntegrations(prev => ({ ...prev, github_connected: false, github_username: undefined }))
      showSuccess('GitHub disconnected successfully')
    }
  }

  const handleConnectSlack = () => {
    if (!integrations.slack_webhook_url.trim()) {
      showError('Please enter a webhook URL')
      return
    }
    setIntegrations(prev => ({ ...prev, slack_connected: true }))
    setShowSlackModal(false)
    showSuccess('Slack connected successfully')
  }

  const handleConnectDiscord = () => {
    if (!integrations.discord_webhook_url.trim()) {
      showError('Please enter a webhook URL')
      return
    }
    setIntegrations(prev => ({ ...prev, discord_connected: true }))
    setShowDiscordModal(false)
    showSuccess('Discord connected successfully')
  }

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: UserIcon },
    { id: 'integrations' as Tab, label: 'Integrations', icon: LinkIcon },
    { id: 'environment' as Tab, label: 'Environment', icon: ServerIcon }
  ]

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Manage your account preferences, integrations, and environment configuration.
          </p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
                  <FormField label="Theme">
                    <select
                      value={userSettings.theme}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                      className="select"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </FormField>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={userSettings.email_notifications}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={userSettings.push_notifications}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, push_notifications: e.target.checked }))}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Push notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Localization</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Language">
                      <select
                        value={userSettings.language}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="select"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </FormField>
                    <FormField label="Timezone">
                      <select
                        value={userSettings.timezone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                        className="select"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </FormField>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveUserSettings}
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Profile Settings'
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {/* GitHub */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">GitHub</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Connect your GitHub account to access repositories
                      </p>
                    </div>
                    {integrations.github_connected ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          <span>Connected as {integrations.github_username}</span>
                        </div>
                        <button
                          onClick={handleDisconnectGithub}
                          className="btn btn-secondary btn-sm"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectGithub}
                        className="btn btn-primary btn-sm"
                        disabled={saving}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Slack */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Slack</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Get notifications in your Slack workspace
                      </p>
                    </div>
                    {integrations.slack_connected ? (
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <button
                          onClick={() => setIntegrations(prev => ({ ...prev, slack_connected: false }))}
                          className="btn btn-secondary btn-sm"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowSlackModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Discord */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Discord</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Get notifications in your Discord server
                      </p>
                    </div>
                    {integrations.discord_connected ? (
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <button
                          onClick={() => setIntegrations(prev => ({ ...prev, discord_connected: false }))}
                          className="btn btn-secondary btn-sm"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDiscordModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveIntegrations}
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Integration Settings'
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'environment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Environment Configuration</h3>
                  <div className="space-y-4">
                    <FormField label="Environment">
                      <select
                        value={envSettings.environment}
                        onChange={(e) => setEnvSettings(prev => ({ ...prev, environment: e.target.value as any }))}
                        className="select"
                      >
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                      </select>
                    </FormField>
                    <FormField label="API URL">
                      <input
                        type="text"
                        value={envSettings.api_url}
                        onChange={(e) => setEnvSettings(prev => ({ ...prev, api_url: e.target.value }))}
                        placeholder="http://localhost:8000"
                        className="input"
                      />
                    </FormField>
                    <FormField label="WebSocket URL">
                      <input
                        type="text"
                        value={envSettings.websocket_url}
                        onChange={(e) => setEnvSettings(prev => ({ ...prev, websocket_url: e.target.value }))}
                        placeholder="ws://localhost:8000"
                        className="input"
                      />
                    </FormField>
                    <FormField label="Redis URL">
                      <input
                        type="text"
                        value={envSettings.redis_url}
                        onChange={(e) => setEnvSettings(prev => ({ ...prev, redis_url: e.target.value }))}
                        placeholder="redis://localhost:6379"
                        className="input"
                      />
                    </FormField>
                    <FormField label="Database URL">
                      <input
                        type="text"
                        value={envSettings.database_url}
                        onChange={(e) => setEnvSettings(prev => ({ ...prev, database_url: e.target.value }))}
                        placeholder="postgresql://localhost:5432/db"
                        className="input"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveEnvironment}
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Environment Settings'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slack Modal */}
        <Modal
          isOpen={showSlackModal}
          onClose={() => setShowSlackModal(false)}
          title="Connect Slack"
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSlackModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectSlack}
                className="btn btn-primary"
                disabled={!integrations.slack_webhook_url.trim()}
              >
                Connect
              </button>
            </div>
          }
        >
          <FormField
            label="Webhook URL"
            required
            hint="Get this from your Slack workspace settings"
          >
            <input
              type="text"
              value={integrations.slack_webhook_url}
              onChange={(e) => setIntegrations(prev => ({ ...prev, slack_webhook_url: e.target.value }))}
              placeholder="https://hooks.slack.com/services/..."
              className="input"
            />
          </FormField>
        </Modal>

        {/* Discord Modal */}
        <Modal
          isOpen={showDiscordModal}
          onClose={() => setShowDiscordModal(false)}
          title="Connect Discord"
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDiscordModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectDiscord}
                className="btn btn-primary"
                disabled={!integrations.discord_webhook_url.trim()}
              >
                Connect
              </button>
            </div>
          }
        >
          <FormField
            label="Webhook URL"
            required
            hint="Get this from your Discord server settings"
          >
            <input
              type="text"
              value={integrations.discord_webhook_url}
              onChange={(e) => setIntegrations(prev => ({ ...prev, discord_webhook_url: e.target.value }))}
              placeholder="https://discord.com/api/webhooks/..."
              className="input"
            />
          </FormField>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
