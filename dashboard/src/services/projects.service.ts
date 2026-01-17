import { apiClient, ApiError } from '../lib/api-client'
import { 
  Project, 
  PaginatedResponse,
  SearchFilters,
  PaginationParams
} from '../types'

export class ProjectsService {
  private static instance: ProjectsService

  static getInstance(): ProjectsService {
    if (!ProjectsService.instance) {
      ProjectsService.instance = new ProjectsService()
    }
    return ProjectsService.instance
  }

  // Get all projects for an organization
  async getProjects(
    orgId: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Project>> {
    try {
      const params = { org_id: orgId, ...filters, ...pagination }
      const response = await apiClient.get<Project[]>(`/api/projects`, params)
      // Transform to paginated response
      return {
        data: response.data,
        total: response.data.length,
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        hasMore: false
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch projects')
    }
  }

  // Get single project
  async getProject(id: string): Promise<Project> {
    try {
      const response = await apiClient.get<Project>(`/api/projects/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch project')
    }
  }

  // Create new project
  async createProject(orgId: string, data: {
    name: string
    description?: string
  }): Promise<Project> {
    try {
      const response = await apiClient.post<Project>(`/api/projects?org_id=${orgId}`, data)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to create project')
    }
  }

  // Update project
  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    try {
      const response = await apiClient.put<Project>(`/api/projects/${id}`, data)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to update project')
    }
  }

  // Delete project
  async deleteProject(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/projects/${id}`)
    } catch (error) {
      throw this.handleError(error, 'Failed to delete project')
    }
  }

  // Get project statistics
  async getProjectStats(id: string): Promise<{
    repository_count: number
    active_agents: number
    recent_activity: number
  }> {
    try {
      const response = await apiClient.get(`/api/projects/${id}/stats`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch project statistics')
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
      return new ApiError('The requested project was not found.', 404, 'NOT_FOUND')
    }
    
    if (error.response?.status === 422) {
      const validationErrors = error.response.data?.errors
      if (validationErrors) {
        const message = Object.values(validationErrors).flat().join(', ')
        return new ApiError(message, 422, 'VALIDATION_ERROR')
      }
    }
    
    return new ApiError(defaultMessage, error.response?.status, 'UNKNOWN_ERROR', error.response?.data)
  }
}

// Export singleton instance
export const projectsService = ProjectsService.getInstance()
