/**
 * Backend for Frontend (BFF) Service
 * 
 * This service aggregates data from multiple API endpoints
 * and provides optimized data structures for the frontend.
 * It handles caching, batching, and data transformation.
 */

import { apiClient, ApiError } from '../lib/api-client'
import { 
  Organization, 
  Project, 
  Repository,
  DashboardMetric,
  DashboardActivity,
  PaginatedResponse
} from '../types'
import { organizationsService } from './organizations.service'
import { repositoriesService } from './repositories.service'

export interface DashboardData {
  metrics: DashboardMetric[]
  recentActivity: DashboardActivity[]
  organizations: Organization[]
  projects: Project[]
  repositories: Repository[]
  stats: {
    totalOrganizations: number
    totalProjects: number
    totalRepositories: number
    activeAgents: number
  }
}

export interface ProjectDashboardData {
  project: Project
  repositories: Repository[]
  metrics: {
    totalRepositories: number
    syncedRepositories: number
    activeAgents: number
    recentActivity: number
  }
  recentActivity: DashboardActivity[]
}

export interface OrganizationDashboardData {
  organization: Organization
  projects: Project[]
  repositories: Repository[]
  members: {
    total: number
    admins: number
  }
  metrics: {
    totalProjects: number
    totalRepositories: number
    activeAgents: number
  }
}

export class BFFService {
  private static instance: BFFService
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 30000 // 30 seconds

  static getInstance(): BFFService {
    if (!BFFService.instance) {
      BFFService.instance = new BFFService()
    }
    return BFFService.instance
  }

  /**
   * Get comprehensive dashboard data
   * Aggregates data from multiple endpoints in parallel
   */
  async getDashboardData(): Promise<DashboardData> {
    const cacheKey = 'dashboard_data'
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // Fetch all data in parallel with error handling
      const [orgsResponse, reposResponse] = await Promise.allSettled([
        organizationsService.getOrganizations({}, { limit: 10 }).catch(() => ({ data: [], total: 0, page: 1, limit: 10, hasMore: false })),
        repositoriesService.getRepositories({}, { limit: 10 }).catch(() => ({ data: [], total: 0, page: 1, limit: 10, hasMore: false }))
      ])

      const organizations = orgsResponse.status === 'fulfilled' 
        ? (orgsResponse.value?.data || [])
        : []
      
      const repositories = reposResponse.status === 'fulfilled'
        ? (reposResponse.value?.data || [])
        : []

      // Calculate metrics
      const metrics: DashboardMetric[] = [
        {
          title: 'Total Organizations',
          value: organizations.length,
          change: { value: '+0', trend: 'neutral' },
          color: 'blue'
        },
        {
          title: 'Total Projects',
          value: 0, // Will be calculated from projects
          change: { value: '+0', trend: 'neutral' },
          color: 'green'
        },
        {
          title: 'Total Repositories',
          value: repositories.length,
          change: { value: '+0', trend: 'neutral' },
          color: 'purple'
        },
        {
          title: 'Synced Repositories',
          value: repositories.filter(r => r.sync_status === 'synced').length,
          change: { value: '+0', trend: 'neutral' },
          color: 'green'
        }
      ]

      // Get recent activity (mock for now, should come from API)
      const recentActivity: DashboardActivity[] = repositories
        .slice(0, 5)
        .map((repo, index) => ({
          id: `activity-${repo.id}`,
          type: 'agent_task' as const,
          message: `Repository ${repo.name} synced successfully`,
          timestamp: repo.last_synced_at || repo.created_at,
          metadata: { repository_id: repo.id }
        }))

      const data: DashboardData = {
        metrics,
        recentActivity,
        organizations,
        projects: [], // Will be populated from projects service
        repositories,
        stats: {
          totalOrganizations: organizations.length,
          totalProjects: 0,
          totalRepositories: repositories.length,
          activeAgents: 0
        }
      }

      this.setCached(cacheKey, data)
      return data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch dashboard data')
    }
  }

  /**
   * Get project dashboard with aggregated data
   */
  async getProjectDashboard(projectId: string): Promise<ProjectDashboardData> {
    const cacheKey = `project_dashboard_${projectId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      // Fetch project and repositories in parallel
      const [projectResponse, reposResponse] = await Promise.allSettled([
        apiClient.get<Project>(`/api/projects/${projectId}`),
        repositoriesService.getRepositories({ project_id: projectId })
      ])

      if (projectResponse.status === 'rejected') {
        throw new ApiError('Project not found', 404, 'NOT_FOUND')
      }

      const project = projectResponse.value.data
      const repositories = reposResponse.status === 'fulfilled'
        ? reposResponse.value.data
        : []

      const syncedCount = repositories.filter(r => r.sync_status === 'synced').length

      const data: ProjectDashboardData = {
        project,
        repositories,
        metrics: {
          totalRepositories: repositories.length,
          syncedRepositories: syncedCount,
          activeAgents: 0,
          recentActivity: 0
        },
        recentActivity: []
      }

      this.setCached(cacheKey, data)
      return data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch project dashboard')
    }
  }

  /**
   * Get organization dashboard with aggregated data
   */
  async getOrganizationDashboard(orgId: string): Promise<OrganizationDashboardData> {
    const cacheKey = `org_dashboard_${orgId}`
    const cached = this.getCached(cacheKey)
    if (cached) return cached

    try {
      const [orgResponse, projectsResponse, reposResponse, membersResponse] = await Promise.allSettled([
        organizationsService.getOrganization(orgId),
        apiClient.get<Project[]>(`/api/organizations/${orgId}/projects`),
        repositoriesService.getRepositories({ organization_id: orgId }),
        organizationsService.getMembers(orgId)
      ])

      if (orgResponse.status === 'rejected') {
        throw new ApiError('Organization not found', 404, 'NOT_FOUND')
      }

      const organization = orgResponse.value
      const projects = projectsResponse.status === 'fulfilled'
        ? projectsResponse.value.data
        : []
      const repositories = reposResponse.status === 'fulfilled'
        ? reposResponse.value.data
        : []
      const members = membersResponse.status === 'fulfilled'
        ? membersResponse.value.data
        : []

      const data: OrganizationDashboardData = {
        organization,
        projects,
        repositories,
        members: {
          total: members.length,
          admins: members.filter(m => m.role === 'admin').length
        },
        metrics: {
          totalProjects: projects.length,
          totalRepositories: repositories.length,
          activeAgents: 0
        }
      }

      this.setCached(cacheKey, data)
      return data
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch organization dashboard')
    }
  }

  /**
   * Batch fetch multiple repositories with their status
   */
  async batchGetRepositoryStatus(repositoryIds: string[]): Promise<Map<string, {
    sync_status: string
    discovery_status?: string
    last_synced_at?: string
  }>> {
    try {
      const statuses = await Promise.allSettled(
        repositoryIds.map(id => repositoriesService.getSyncStatus(id))
      )

      const result = new Map()
      repositoryIds.forEach((id, index) => {
        if (statuses[index].status === 'fulfilled') {
          result.set(id, statuses[index].value)
        }
      })

      return result
    } catch (error) {
      throw this.handleError(error, 'Failed to batch fetch repository status')
    }
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cached data if not expired
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  /**
   * Set cached data
   */
  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Error handling helper
   */
  private handleError(error: any, defaultMessage: string): ApiError {
    if (error instanceof ApiError) {
      return error
    }
    
    return new ApiError(
      defaultMessage,
      error.response?.status,
      'UNKNOWN_ERROR',
      error.response?.data
    )
  }
}

// Export singleton instance
export const bffService = BFFService.getInstance()
