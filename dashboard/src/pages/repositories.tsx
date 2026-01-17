import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EllipsisHorizontalIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { repositoriesService } from '../services/repositories.service'
import { organizationsService } from '../services/organizations.service'
import { projectsService } from '../services/projects.service'
import { Repository, DiscoveryReport } from '../types'
import { useApi, useMutation } from '../hooks/useApi'
import { useToast } from '../contexts/ToastContext'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { FormField } from '../components/ui/FormField'
import { formatDistanceToNow } from 'date-fns'

export default function RepositoriesPage() {
  const { state } = useAuth()
  const { showSuccess, showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<string | null>(null)
  
  // Form state
  const [newRepoName, setNewRepoName] = useState('')
  const [newRepoFullName, setNewRepoFullName] = useState('')
  const [newRepoBranch, setNewRepoBranch] = useState('main')
  const [newRepoCloneUrl, setNewRepoCloneUrl] = useState('')

  // Fetch organizations and projects for filters
  const { data: orgsData } = useApi(() => organizationsService.getOrganizations(), { immediate: true })
  const { data: projectsData } = useApi(
    () => selectedOrg !== 'all' 
      ? projectsService.getProjects(selectedOrg)
      : Promise.resolve({ data: [], total: 0, page: 1, limit: 20, hasMore: false }),
    { immediate: selectedOrg !== 'all' }
  )

  // Fetch repositories using BFF service
  const {
    data: repositoriesData,
    loading,
    error,
    refetch
  } = useApi(() => repositoriesService.getRepositories({
    query: searchQuery || undefined,
    organization_id: selectedOrg !== 'all' ? selectedOrg : undefined,
    project_id: selectedProject !== 'all' ? selectedProject : undefined
  }), {
    immediate: true
  })

  // Sync repository mutation
  const { mutate: syncRepository, loading: syncing } = useMutation(
    (repoId: string) => repositoriesService.syncRepository(repoId),
    {
      onSuccess: () => {
        showSuccess('Repository sync started successfully')
        refetch()
      },
      onError: (error) => {
        showError(error.message || 'Failed to sync repository')
      }
    }
  )

  // Discovery mutation
  const { mutate: startDiscovery, loading: discovering } = useMutation(
    (repoId: string) => repositoriesService.startDiscovery(repoId),
    {
      onSuccess: (report) => {
        showSuccess('Discovery analysis started')
        setShowDiscoveryModal(report.repository_id)
      },
      onError: (error) => {
        showError(error.message || 'Failed to start discovery')
      }
    }
  )

  // Create repository mutation
  const { mutate: createRepository, loading: creating } = useMutation(
    (data: { name: string; full_name: string; clone_url: string; branch: string; project_id?: string; organization_id?: string }) =>
      repositoriesService.createRepository(data),
    {
      onSuccess: () => {
        showSuccess('Repository added successfully')
        setShowAddModal(false)
        setNewRepoName('')
        setNewRepoFullName('')
        setNewRepoBranch('main')
        setNewRepoCloneUrl('')
        refetch()
      },
      onError: (error) => {
        showError(error.message || 'Failed to create repository')
      }
    }
  )

  // Get discovery report
  const {
    data: discoveryReport,
    loading: discoveryLoading
  } = useApi(
    () => showDiscoveryModal ? repositoriesService.getDiscoveryReport(showDiscoveryModal) : Promise.reject(new Error('No repo selected')),
    {
      immediate: !!showDiscoveryModal
    }
  )

  const repositories = repositoriesData?.data || []
  const organizations = orgsData?.data || []
  const projects = projectsData?.data || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'syncing':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      synced: 'badge-success',
      syncing: 'badge-warning',
      error: 'badge-error',
      pending: 'badge-gray'
    }
    return <span className={`badge ${styles[status as keyof typeof styles] || 'badge-gray'}`}>{status}</span>
  }

  const handleSync = async (repoId: string) => {
    syncRepository(repoId)
  }

  const handleDiscovery = async (repoId: string) => {
    startDiscovery(repoId)
  }

  const handleCreateRepository = () => {
    if (!newRepoName || !newRepoFullName || !newRepoBranch) {
      showError('Please fill in all required fields')
      return
    }

    createRepository({
      name: newRepoName,
      full_name: newRepoFullName,
      clone_url: newRepoCloneUrl || `https://github.com/${newRepoFullName}.git`,
      branch: newRepoBranch,
      organization_id: selectedOrg !== 'all' ? selectedOrg : undefined,
      project_id: selectedProject !== 'all' ? selectedProject : undefined
    })
  }

  if (loading && !repositoriesData) {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Skeleton height={32} width={200} />
            <Skeleton height={20} width={400} className="mt-2" />
          </div>
          <div className="card">
            <div className="card-body">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={64} className="mb-3" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !repositoriesData) {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Failed to load repositories
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error.message}
              </p>
              <button onClick={refetch} className="btn btn-primary">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repositories</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and monitor your code repositories
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Repository
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Organization Filter */}
              <div className="w-full lg:w-48">
                <select 
                  value={selectedOrg}
                  onChange={(e) => {
                    setSelectedOrg(e.target.value)
                    setSelectedProject('all')
                  }}
                  className="select"
                >
                  <option value="all">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Filter */}
              <div className="w-full lg:w-48">
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="select"
                  disabled={selectedOrg === 'all'}
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Repositories Table */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Repositories ({repositories.length})
              </h2>
            </div>
          </div>
          <div className="card-body p-0">
            {repositories.length === 0 ? (
              <EmptyState
                icon={FolderIcon}
                title="No repositories found"
                description="Get started by adding your first repository"
                action={
                  <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Repository
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Repository</th>
                      <th className="table-header text-left">Branch</th>
                      <th className="table-header text-left">Sync Status</th>
                      <th className="table-header text-left">Last Synced</th>
                      <th className="table-header text-left">Discovery</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repositories.map((repo) => (
                      <tr key={repo.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <FolderIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {repo.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {repo.full_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-gray">{repo.branch}</span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(repo.sync_status)}
                            {getStatusBadge(repo.sync_status)}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {repo.last_synced_at 
                              ? formatDistanceToNow(new Date(repo.last_synced_at), { addSuffix: true })
                              : 'Never'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {repo.discovery_status === 'completed' && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            )}
                            {repo.discovery_status === 'in_progress' && (
                              <ClockIcon className="h-4 w-4 text-yellow-500 animate-spin" />
                            )}
                            {repo.discovery_status === 'failed' && (
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {repo.discovery_status || 'not started'}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleSync(repo.id)}
                              className="btn btn-ghost btn-sm"
                              disabled={repo.sync_status === 'syncing' || syncing}
                              title="Sync repository"
                            >
                              <ArrowPathIcon className={`h-4 w-4 ${repo.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDiscovery(repo.id)}
                              className="btn btn-ghost btn-sm"
                              disabled={discovering}
                              title="Run discovery"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Repository Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Repository"
          description="Connect a new repository to the platform"
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRepository}
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Repository'
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField label="Repository Name" required>
              <input
                type="text"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
                placeholder="my-repo"
                className="input"
                required
              />
            </FormField>
            <FormField label="Full Name (owner/repo)" required>
              <input
                type="text"
                value={newRepoFullName}
                onChange={(e) => setNewRepoFullName(e.target.value)}
                placeholder="owner/repository"
                className="input"
                required
              />
            </FormField>
            <FormField 
              label="Clone URL"
              hint="Leave empty to auto-generate from full name"
            >
              <input
                type="text"
                value={newRepoCloneUrl}
                onChange={(e) => setNewRepoCloneUrl(e.target.value)}
                placeholder="https://github.com/owner/repo.git"
                className="input"
              />
            </FormField>
            <FormField label="Branch" required>
              <input
                type="text"
                value={newRepoBranch}
                onChange={(e) => setNewRepoBranch(e.target.value)}
                placeholder="main"
                className="input"
                required
              />
            </FormField>
          </div>
        </Modal>

        {/* Discovery Modal */}
        {showDiscoveryModal && (
          <Modal
            isOpen={!!showDiscoveryModal}
            onClose={() => setShowDiscoveryModal(null)}
            title="Discovery Report"
            size="lg"
          >
            {discoveryLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" text="Loading discovery report..." />
              </div>
            ) : discoveryReport ? (
              <div className="space-y-6">
                {/* Detected Stack */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Detected Stack</h4>
                  <div className="space-y-2">
                    {Object.entries(discoveryReport.detected_stack || {}).map(([tech, files]) => (
                      <div key={tech} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{tech}</span>
                        <span className="text-xs text-gray-500">
                          {Array.isArray(files) ? files.length : 1} files
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Index Summary */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">File Index Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {discoveryReport.file_index_summary?.total_files || 0}
                      </div>
                      <div className="text-xs text-gray-500">Total Files</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {discoveryReport.file_index_summary?.indexed_files || 0}
                      </div>
                      <div className="text-xs text-gray-500">Indexed Files</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ExclamationTriangleIcon}
                title="No discovery report available"
                description="The discovery analysis may still be in progress"
              />
            )}
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}
