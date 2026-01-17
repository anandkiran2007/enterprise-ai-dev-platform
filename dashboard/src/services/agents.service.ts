import { apiClient, ApiError } from '../lib/api-client'
import { Agent, AgentTask, CreateAgentRequest } from '../types'

export class AgentsService {
  private static instance: AgentsService

  static getInstance(): AgentsService {
    if (!AgentsService.instance) {
      AgentsService.instance = new AgentsService()
    }
    return AgentsService.instance
  }

  // Get all agents
  async getAgents(): Promise<Agent[]> {
    try {
      const response = await apiClient.get<Agent[]>('/api/agents')
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch agents')
    }
  }

  // Get single agent
  async getAgent(id: string): Promise<Agent> {
    try {
      const response = await apiClient.get<Agent>(`/api/agents/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch agent')
    }
  }

  // Create agent
  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    try {
      const response = await apiClient.post<Agent>('/api/agents', data)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to create agent')
    }
  }

  // Update agent
  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    try {
      const response = await apiClient.put<Agent>(`/api/agents/${id}`, data)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to update agent')
    }
  }

  // Delete agent
  async deleteAgent(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/agents/${id}`)
    } catch (error) {
      throw this.handleError(error, 'Failed to delete agent')
    }
  }

  // Start agent
  async startAgent(id: string): Promise<Agent> {
    try {
      const response = await apiClient.post<Agent>(`/api/agents/${id}/start`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to start agent')
    }
  }

  // Stop agent
  async stopAgent(id: string): Promise<Agent> {
    try {
      const response = await apiClient.post<Agent>(`/api/agents/${id}/stop`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to stop agent')
    }
  }

  // Get agent tasks
  async getAgentTasks(agentId: string): Promise<AgentTask[]> {
    try {
      const response = await apiClient.get<AgentTask[]>(`/api/agents/${agentId}/tasks`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch agent tasks')
    }
  }

  // Get agent metrics
  async getAgentMetrics(id: string): Promise<Agent['metrics']> {
    try {
      const response = await apiClient.get(`/api/agents/${id}/metrics`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch agent metrics')
    }
  }

  // Error handling helper
  private handleError(error: any, defaultMessage: string): ApiError {
    if (error instanceof ApiError) {
      return error
    }
    
    if (error.response?.status === 401) {
      return new ApiError('Authentication required. Please log in again.', 401, 'UNAUTHORIZED')
    }
    
    if (error.response?.status === 403) {
      return new ApiError('You do not have permission to perform this action.', 403, 'FORBIDDEN')
    }
    
    if (error.response?.status === 404) {
      return new ApiError('The requested agent was not found.', 404, 'NOT_FOUND')
    }
    
    return new ApiError(defaultMessage, error.response?.status, 'UNKNOWN_ERROR', error.response?.data)
  }
}

// Export singleton instance
export const agentsService = AgentsService.getInstance()
