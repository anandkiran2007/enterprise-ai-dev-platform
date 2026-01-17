import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'

type Agent = {
  id: string
  name: string
  type: string
  status: string
  last_heartbeat?: string
  cpu_usage?: number
  memory_usage?: number
  tasks_completed: number
  tasks_failed: number
  uptime_seconds: number
  config: Record<string, any>
}

type AgentTask = {
  id: string
  agent_id: string
  task_type: string
  status: string
  started_at: string
  completed_at?: string
  error?: string
  progress?: number
}

export default function AgentsPage() {
  const { state } = useAuth()

  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')

  const [loadingAgents, setLoadingAgents] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentType, setNewAgentType] = useState('code_analyzer')

  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null)

  const authHeader = useMemo(() => {
    const token = state.token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }, [state.token])

  const loadAgents = async () => {
    setLoadingAgents(true)
    setError(null)
    try {
      const res = await fetch('/api/agents', {
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load agents (${res.status})`)
      }
      const data = (await res.json()) as Agent[]
      setAgents(data)
      if (!selectedAgentId && data.length > 0) {
        setSelectedAgentId(data[0].id)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load agents')
    } finally {
      setLoadingAgents(false)
    }
  }

  const loadTasks = async (agentId?: string) => {
    const targetAgentId = agentId || selectedAgentId
    if (!targetAgentId) {
      setTasks([])
      return
    }
    setLoadingTasks(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${targetAgentId}/tasks`, {
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load tasks (${res.status})`)
      }
      const data = (await res.json()) as AgentTask[]
      setTasks(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load tasks')
    } finally {
      setLoadingTasks(false)
    }
  }

  const createAgent = async () => {
    if (!newAgentName.trim() || !newAgentType) {
      setError('Agent name and type are required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          name: newAgentName.trim(),
          type: newAgentType,
          config: {
            max_concurrent_tasks: 5,
            timeout_seconds: 300,
          }
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to create agent (${res.status})`)
      }
      const created = (await res.json()) as Agent
      setAgents((prev) => [created, ...prev])
      setSelectedAgentId(created.id)
      setNewAgentName('')
      setNewAgentType('code_analyzer')
      setShowCreateAgent(false)
    } catch (e: any) {
      setError(e?.message || 'Failed to create agent')
    } finally {
      setSubmitting(false)
    }
  }

  const startAgent = async (agentId: string) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agentId}/start`, {
        method: 'POST',
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to start agent (${res.status})`)
      }
      await loadAgents()
    } catch (e: any) {
      setError(e?.message || 'Failed to start agent')
    } finally {
      setSubmitting(false)
    }
  }

  const stopAgent = async (agentId: string) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agentId}/stop`, {
        method: 'POST',
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to stop agent (${res.status})`)
      }
      await loadAgents()
    } catch (e: any) {
      setError(e?.message || 'Failed to stop agent')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to delete agent (${res.status})`)
      }
      setAgents((prev) => prev.filter((a) => a.id !== agentId))
      if (selectedAgentId === agentId && agents.length > 1) {
        setSelectedAgentId(agents.find((a) => a.id !== agentId)?.id || '')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to delete agent')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadAgents()
    const interval = setInterval(loadAgents, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadTasks()
    const interval = setInterval(() => loadTasks(), 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [selectedAgentId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'status-success'
      case 'idle': return 'status-info'
      case 'stopped': return 'status-warning'
      case 'error': return 'status-error'
      default: return 'status-info'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-success'
      case 'running': return 'status-warning'
      case 'failed': return 'status-error'
      case 'pending': return 'status-info'
      default: return 'status-info'
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Monitor and manage AI agents for code analysis, testing, and deployment.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Agents</h2>
                <button
                  className="btn btn-primary text-xs"
                  onClick={() => setShowCreateAgent(true)}
                >
                  Create
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {loadingAgents ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Loading agents…</div>
                ) : agents.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    No agents running. Create your first agent.
                  </div>
                ) : (
                  agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAgentId === agent.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedAgentId(agent.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                        <span className={`status-badge ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {agent.type} • {formatUptime(agent.uptime_seconds)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {agent.tasks_completed} completed • {agent.tasks_failed} failed
                      </div>
                      {agent.cpu_usage && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                            <span>CPU</span>
                            <span>{agent.cpu_usage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${agent.cpu_usage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
              
              <div className="mt-4 space-y-3">
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => setShowCreateAgent(true)}
                >
                  Create Agent
                </button>
                
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => loadAgents()}
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Agent Details</h2>
                {selectedAgentId && (
                  <div className="flex space-x-2">
                    <button
                      className="btn btn-secondary text-xs"
                      onClick={() => {
                        const agent = agents.find((a) => a.id === selectedAgentId)
                        if (agent?.status === 'running') {
                          stopAgent(selectedAgentId)
                        } else {
                          startAgent(selectedAgentId)
                        }
                      }}
                      disabled={submitting}
                    >
                      {agents.find((a) => a.id === selectedAgentId)?.status === 'running' ? 'Stop' : 'Start'}
                    </button>
                    <button
                      className="btn btn-secondary text-xs"
                      onClick={() => deleteAgent(selectedAgentId)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {!selectedAgentId ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Select an agent to view details.
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const agent = agents.find((a) => a.id === selectedAgentId)
                      if (!agent) return null
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Type</p>
                              <p className="font-medium text-gray-900 dark:text-white">{agent.type}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                              <span className={`status-badge ${getStatusColor(agent.status)}`}>
                                {agent.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Uptime</p>
                              <p className="font-medium text-gray-900 dark:text-white">{formatUptime(agent.uptime_seconds)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Last Heartbeat</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleString() : 'Never'}
                              </p>
                            </div>
                          </div>

                          {agent.cpu_usage && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">CPU Usage</p>
                                <p className="font-medium text-gray-900 dark:text-white">{agent.cpu_usage}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Memory Usage</p>
                                <p className="font-medium text-gray-900 dark:text-white">{agent.memory_usage || 0}%</p>
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Configuration</p>
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono">
                              {JSON.stringify(agent.config, null, 2)}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Tasks</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadTasks()}
                  disabled={loadingTasks || !selectedAgentId}
                >
                  {loadingTasks ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              <div className="mt-4">
                {!selectedAgentId ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Select an agent to view tasks.
                  </div>
                ) : loadingTasks ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Loading tasks…</div>
                ) : tasks.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    No tasks for this agent yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 10).map((task) => (
                      <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{task.task_type}</h3>
                              <span className={`status-badge ${getTaskStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Started {new Date(task.started_at).toLocaleString()}
                            </p>
                            {task.progress !== undefined && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                                  <span>Progress</span>
                                  <span>{task.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full" 
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {task.error && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{task.error}</p>
                            )}
                          </div>
                          
                          <button
                            className="btn btn-secondary text-xs ml-4"
                            onClick={() => {
                              setSelectedTask(task)
                              setShowTaskDetails(true)
                            }}
                          >
                            Details
                          </button>
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
        {showCreateAgent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Agent</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateAgent(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent Name</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="Code Analyzer Agent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent Type</label>
                    <select
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={newAgentType}
                      onChange={(e) => setNewAgentType(e.target.value)}
                    >
                      <option value="code_analyzer">Code Analyzer</option>
                      <option value="test_runner">Test Runner</option>
                      <option value="deployment_agent">Deployment Agent</option>
                      <option value="security_scanner">Security Scanner</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      className="btn btn-primary flex-1"
                      onClick={createAgent}
                      disabled={submitting || !newAgentName.trim()}
                    >
                      {submitting ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => setShowCreateAgent(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Details</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowTaskDetails(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Task Type</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedTask.task_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                      <span className={`status-badge ${getTaskStatusColor(selectedTask.status)}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Started</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedTask.started_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedTask.completed_at && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Completed</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedTask.completed_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTask.progress !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Progress</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${selectedTask.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedTask.progress}%</p>
                    </div>
                  )}

                  {selectedTask.error && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Error</p>
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                        <p className="text-sm text-red-800 dark:text-red-400">{selectedTask.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
