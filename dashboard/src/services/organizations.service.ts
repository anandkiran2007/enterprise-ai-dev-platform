import { apiClient, ApiError } from '../lib/api-client'
import { 
  Organization, 
  OrganizationMember, 
  CreateOrganizationRequest, 
  InviteMemberRequest,
  PaginatedResponse,
  SearchFilters,
  PaginationParams
} from '../types'

export class OrganizationsService {
  private static instance: OrganizationsService

  static getInstance(): OrganizationsService {
    if (!OrganizationsService.instance) {
      OrganizationsService.instance = new OrganizationsService()
    }
    return OrganizationsService.instance
  }

  // Get all organizations for the current user
  async getOrganizations(filters?: SearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Organization>> {
    try {
      const params = { ...filters, ...pagination }
      const response = await apiClient.get<PaginatedResponse<Organization>>('/api/organizations', params)
      return response.data
    } catch (error) {
      // Re-throw network errors to be handled by caller
      if (error instanceof ApiError && (error.code === 'NETWORK_ERROR' || error.status === 0 || error.status === 404)) {
        throw error
      }
      throw this.handleError(error, 'Failed to fetch organizations')
    }
  }

  // Get single organization by ID
  async getOrganization(id: string): Promise<Organization> {
    try {
      const response = await apiClient.get<Organization>(`/api/organizations/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch organization')
    }
  }

  // Create new organization
  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    try {
      const response = await apiClient.post<Organization>('/api/organizations', data)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to create organization')
    }
  }

  // Update organization
  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    try {
      const response = await apiClient.put<Organization>(`/api/organizations/${id}`, data)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to update organization')
    }
  }

  // Delete organization
  async deleteOrganization(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/organizations/${id}`)
    } catch (error) {
      throw this.handleError(error, 'Failed to delete organization')
    }
  }

  // Get organization members
  async getMembers(organizationId: string, pagination?: PaginationParams): Promise<PaginatedResponse<OrganizationMember>> {
    try {
      const params = pagination || {}
      const response = await apiClient.get<PaginatedResponse<OrganizationMember>>(
        `/api/organizations/${organizationId}/members`, 
        params
      )
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch organization members')
    }
  }

  // Invite member to organization
  async inviteMember(organizationId: string, data: InviteMemberRequest): Promise<OrganizationMember> {
    try {
      const response = await apiClient.post<OrganizationMember>(
        `/api/organizations/${organizationId}/members`, 
        data
      )
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to invite member')
    }
  }

  // Remove member from organization
  async removeMember(organizationId: string, memberId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/organizations/${organizationId}/members/${memberId}`)
    } catch (error) {
      throw this.handleError(error, 'Failed to remove member')
    }
  }

  // Update member role
  async updateMemberRole(
    organizationId: string, 
    memberId: string, 
    role: 'admin' | 'maintainer' | 'member'
  ): Promise<OrganizationMember> {
    try {
      const response = await apiClient.patch<OrganizationMember>(
        `/api/organizations/${organizationId}/members/${memberId}`, 
        { role }
      )
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to update member role')
    }
  }

  // Check if user is member of organization
  async isMember(organizationId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ is_member: boolean }>(
        `/api/organizations/${organizationId}/membership`
      )
      return response.data.is_member
    } catch (error) {
      throw this.handleError(error, 'Failed to check membership')
    }
  }

  // Check if user has admin or maintainer permissions
  async hasAdminPermissions(organizationId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ has_permissions: boolean }>(
        `/api/organizations/${organizationId}/permissions`
      )
      return response.data.has_permissions
    } catch (error) {
      throw this.handleError(error, 'Failed to check permissions')
    }
  }

  // Get organization statistics
  async getOrganizationStats(organizationId: string): Promise<{
    member_count: number
    repository_count: number
    project_count: number
    active_agents: number
  }> {
    try {
      const response = await apiClient.get(`/api/organizations/${organizationId}/stats`)
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch organization statistics')
    }
  }

  // Search organizations
  async searchOrganizations(query: string): Promise<Organization[]> {
    try {
      const response = await apiClient.get<Organization[]>('/api/organizations/search', { query })
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to search organizations')
    }
  }

  // Transfer ownership
  async transferOwnership(organizationId: string, newOwnerId: string): Promise<Organization> {
    try {
      const response = await apiClient.post<Organization>(
        `/api/organizations/${organizationId}/transfer-ownership`,
        { new_owner_id: newOwnerId }
      )
      return response.data
    } catch (error) {
      throw this.handleError(error, 'Failed to transfer ownership')
    }
  }

  // Leave organization
  async leaveOrganization(organizationId: string): Promise<void> {
    try {
      await apiClient.post(`/api/organizations/${organizationId}/leave`)
    } catch (error) {
      throw this.handleError(error, 'Failed to leave organization')
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
      return new ApiError('The requested resource was not found.', 404, 'NOT_FOUND')
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
export const organizationsService = OrganizationsService.getInstance()
