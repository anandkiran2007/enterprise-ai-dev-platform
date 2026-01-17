import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { agentsService } from '../services/agents.service'
import { useApi, useMutation, useRealTimeApi } from '../hooks/useApi'
import { useToast } from '../contexts/ToastContext'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { FormField } from '../components/ui/FormField'
import {
  CpuChipIcon,
  PlusIcon,
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Agent, AgentTask, CreateAgentRequest } from '../types'
import { formatDistanceToNow } from 'date-fns'

export default function AgentsPage() {
  const { state } = useAuth()
  const { showSuccess, showError } = useToast()
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null)

  // Form state
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentType, setNewAgentType] = useState('code_analyzer')

  // Fetch agents with real-time updates
  const {
    data: agents,
    loading: loadingAgents,
    refetch: refetchAgents
  } = useRealTimeApi(() => agentsService.getAgents(), 10000) // Refresh every 10 seconds

  // Fetch tasks for selected agent
  const {
    data: tasks,
    loading: loadingTasks,
    refetch: refetchTasks
  } = useRealTimeApi(
    () => selectedAgentId
      ? agentsService.getAgentTasks(selectedAgentId)
      : Promise.resolve([]),
    5000, // Refresh every 5 seconds
    { immediate: !!selectedAgentId }
  )

  // Create agent mutation
  const { mutate: createAgent, loading: creating } = useMutation(
    (data: CreateAgentRequest) => agentsService.createAgent(data),
    {
      onSuccess: (agent) => {
        showSuccess('Agent created successfully')
        setShowCreateModal(false)
        setNewAgentName('')
        setNewAgentType('code_analyzer')
        setSelectedAgentId(agent.id)
        refetchAgents()
      },
      onError: (error) => {
        showError(error.message || 'Failed to create agent')
      }
    }
  )

  // Start/Stop agent mutation
  const { mutate: toggleAgent, loading: toggling } = useMutation(
    (data: { id: string; action: 'start' | 'stop' }) => {
      return data.action === 'start'
        ? agentsService.startAgent(data.id)
        : agentsService.stopAgent(data.id)
    },
    {
      onSuccess: (_, variables) => {
        showSuccess(`Agent ${variables.action === 'start' ? 'started' : 'stopped'} successfully`)
        refetchAgents()
      },
      onError: (error) => {
        showError(error.message || 'Failed to toggle agent')
      }
    }
  )

  // Delete agent mutation
  const { mutate: deleteAgent, loading: deleting } = useMutation(
    (id: string) => agentsService.deleteAgent(id),
    {
      onSuccess: () => {
        showSuccess('Agent deleted successfully')
        if (selectedAgentId) {
          const remaining = agents?.filter(a => a.id !== selectedAgentId) || []
          setSelectedAgentId(remaining.length > 0 ? remaining[0].id : '')
        }
        refetchAgents()
      },
      onError: (error) => {
        showError(error.message || 'Failed to delete agent')
      }
    }
  )

  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id)
    }
  }, [agents, selectedAgentId])

  const handleCreateAgent = () => {
    if (!newAgentName.trim()) {
      showError('Agent name is required')
      return
    }
    createAgent({
      name: newAgentName.trim(),
      type: newAgentType,
      config: {
        max_concurrent_tasks: 5,
        timeout_seconds: 300
      }
    })
  }

  const handleToggleAgent = (agent: Agent) => {
    const action = agent.status === 'active' ? 'stop' : 'start'
    toggleAgent({ id: agent.id, action })
  }

  const handleDeleteAgent = (id: string) => {
    if (confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      deleteAgent(id)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'badge-success',
      inactive: 'badge-gray',
      starting: 'badge-warning',
      stopping: 'badge-warning',
      error: 'badge-error'
    }
    return <span className={`badge ${styles[status] || 'badge-gray'}`}>{status}</span>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'starting':
      case 'stopping':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getTaskStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'badge-success',
      running: 'badge-warning',
      failed: 'badge-error',
      pending: 'badge-gray'
    }
    return <span className={`badge ${styles[status] || 'badge-gray'}`}>{status}</span>
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const selectedAgent = agents?.find(a => a.id === selectedAgentId)

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Monitor and manage AI agents for code analysis, testing, and deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Agents List */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Agents</h2>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={refetchAgents}
                    disabled={loadingAgents}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${loadingAgents ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                {loadingAgents && !agents ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height={100} />
                    ))}
                  </div>
                ) : !agents || agents.length === 0 ? (
                  <EmptyState
                    icon={CpuChipIcon}
                    title="No agents running"
                    description="Create your first AI agent to get started"
                    action={
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Agent
                      </button>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedAgentId === agent.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedAgentId(agent.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                          {getStatusIcon(agent.status)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {agent.type} • {getStatusBadge(agent.status)}
                        </div>
                        {agent.metrics && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {agent.metrics.tasks_completed} completed • {agent.metrics.tasks_failed} failed
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="card-body space-y-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Agent
                </button>
                <button
                  onClick={refetchAgents}
                  className="btn btn-secondary w-full"
                  disabled={loadingAgents}
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${loadingAgents ? 'animate-spin' : ''}`} />
                  Refresh Status
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Details */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Agent Details</h2>
                  {selectedAgent && (
                    <div className="flex space-x-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleAgent(selectedAgent)}
                        disabled={toggling}
                      >
                        {selectedAgent.status === 'active' ? (
                          <>
                            <StopIcon className="h-4 w-4 mr-1" />
                            Stop
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Start
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteAgent(selectedAgent.id)}
                        disabled={deleting}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                {!selectedAgent ? (
                  <EmptyState
                    icon={CpuChipIcon}
                    title="Select an agent"
                    description="Choose an agent to view its details and tasks"
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Type</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedAgent.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedAgent.status)}</div>
                      </div>
                      {selectedAgent.metrics && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Tasks Completed</p>
                            <p className="font-medium text-gray-900 dark:text-white mt-1">
                              {selectedAgent.metrics.tasks_completed}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Tasks Failed</p>
                            <p className="font-medium text-gray-900 dark:text-white mt-1">
                              {selectedAgent.metrics.tasks_failed}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {selectedAgent.last_activity && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Last Activity</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {formatDistanceToNow(new Date(selectedAgent.last_activity), { addSuffix: true })}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Configuration</p>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(selectedAgent.config, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Tasks</h2>
                  {selectedAgentId && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={refetchTasks}
                      disabled={loadingTasks}
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${loadingTasks ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {!selectedAgentId ? (
                  <EmptyState
                    icon={ChartBarIcon}
                    title="Select an agent"
                    description="Choose an agent to view its tasks"
                  />
                ) : loadingTasks ? (
                  <div className="p-6">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height={80} className="mb-4" />
                    ))}
                  </div>
                ) : !tasks || tasks.length === 0 ? (
                  <EmptyState
                    icon={ChartBarIcon}
                    title="No tasks yet"
                    description="Tasks will appear here when the agent starts working"
                  />
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.slice(0, 10).map((task) => (
                      <div
                        key={task.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedTask(task)
                          setShowTaskModal(true)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{task.type}</p>
                              {getTaskStatusBadge(task.status)}
                            </div>
                            {task.started_at && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Started {formatDistanceToNow(new Date(task.started_at), { addSuffix: true })}
                              </p>
                            )}
                            {task.error_message && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{task.error_message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Agent Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Agent"
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                className="btn btn-primary"
                disabled={creating || !newAgentName.trim()}
              >
                {creating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Agent'
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField label="Agent Name" required>
              <input
                type="text"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Code Analyzer Agent"
                className="input"
                required
              />
            </FormField>
            <FormField label="Agent Type" required>
              <select
                value={newAgentType}
                onChange={(e) => setNewAgentType(e.target.value)}
                className="select"
              >
                <option value="code_analyzer">Code Analyzer</option>
                <option value="test_runner">Test Runner</option>
                <option value="deployment_agent">Deployment Agent</option>
                <option value="security_scanner">Security Scanner</option>
              </select>
            </FormField>
          </div>
        </Modal>

        {/* Task Details Modal */}
        {selectedTask && (
          <Modal
            isOpen={showTaskModal}
            onClose={() => {
              setShowTaskModal(false)
              setSelectedTask(null)
            }}
            title="Task Details"
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Task Type</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{selectedTask.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                  <div className="mt-1">{getTaskStatusBadge(selectedTask.status)}</div>
                </div>
                {selectedTask.started_at && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Started</p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {new Date(selectedTask.started_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedTask.completed_at && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Completed</p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {new Date(selectedTask.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedTask.error_message && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Error</p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-400">{selectedTask.error_message}</p>
                  </div>
                </div>
              )}
              {selectedTask.input_data && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Input Data</p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(selectedTask.input_data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}
