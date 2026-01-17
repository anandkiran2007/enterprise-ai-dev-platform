import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

type Organization = {
  id: string
  name: string
  slug: string
  created_at: string
  member_count?: number
}

type Project = {
  id: string
  name: string
  description?: string | null
  status: string
  repository_count?: number | null
  last_activity?: string | null
  created_at: string
}

type Repository = {
  id: string
  name: string
  full_name: string
  clone_url: string
  branch: string
  sync_status: 'synced' | 'syncing' | 'error' | 'pending'
  last_synced_at?: string | null
  discovery_status?: 'completed' | 'in_progress' | 'failed' | 'not_started'
  detected_stack?: Record<string, any> | null
}

type DiscoveryReport = {
  id: string
  detected_stack: Record<string, string[]>
  service_boundaries: Array<{ name: string; files: string[] }>
  dependency_graph: { nodes: string[]; edges: string[][] }
  risk_hotspots: Array<{ file: string; risk: string; reason: string }>
  file_index_summary: {
    total_files: number
    indexed_files: number
    languages: Record<string, number>
  }
}

export default function RepositoriesPage() {
  const { state } = useAuth()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<string | null>(null)
  const [discoveryReports, setDiscoveryReports] = useState<Record<string, DiscoveryReport>>({})

  // Initial mock data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setRepositories([
        {
          id: '1',
          name: 'frontend-app',
          full_name: 'company/frontend-app',
          clone_url: 'https://github.com/company/frontend-app.git',
          branch: 'main',
          sync_status: 'synced',
          last_synced_at: '2024-01-16T10:30:00Z',
          discovery_status: 'completed',
          detected_stack: { framework: 'React', language: 'TypeScript' },
        },
        {
          id: '2',
          name: 'backend-api',
          full_name: 'company/backend-api',
          clone_url: 'https://github.com/company/backend-api.git',
          branch: 'main',
          sync_status: 'syncing',
          last_synced_at: '2024-01-16T09:15:00Z',
          discovery_status: 'in_progress',
        },
        {
          id: '3',
          name: 'mobile-app',
          full_name: 'company/mobile-app',
          clone_url: 'https://github.com/company/mobile-app.git',
          branch: 'develop',
          sync_status: 'error',
          last_synced_at: '2024-01-15T14:20:00Z',
          discovery_status: 'failed',
        },
      ])

      setOrganizations([
        {
          id: '1',
          name: 'Company Inc',
          slug: 'company',
          created_at: '2024-01-01T00:00:00Z',
          member_count: 24,
        },
        {
          id: '2',
          name: 'Startup LLC',
          slug: 'startup',
          created_at: '2024-01-05T00:00:00Z',
          member_count: 8,
        },
      ])

      setProjects([
        {
          id: '1',
          name: 'E-commerce Platform',
          status: 'active',
          repository_count: 5,
          last_activity: '2 hours ago',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Mobile App',
          status: 'active',
          repository_count: 3,
          last_activity: '1 day ago',
          created_at: '2024-01-05T00:00:00Z',
        },
      ])

      setLoading(false)
    }

    loadData()
  }, [])

  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        repo.name.toLowerCase().includes(q) ||
        repo.full_name.toLowerCase().includes(q)

      // TODO: wire real org/project mapping; placeholders for now
      const matchesOrg = selectedOrg === 'all' || true
      const matchesProject = selectedProject === 'all' || true

      return matchesSearch && matchesOrg && matchesProject
    })
  }, [repositories, searchQuery, selectedOrg, selectedProject])

  const getStatusIcon = (status: Repository['sync_status']) => {
    switch (status) {
      case 'synced':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'syncing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Repository['sync_status']) => {
    const styles: Record<Repository['sync_status'], string> = {
      synced: 'badge-success',
      syncing: 'badge-warning',
      error: 'badge-error',
      pending: 'badge-gray',
    }
    return <span className={clsx('badge', styles[status])}>{status}</span>
  }

  const handleSync = async (repoId: string) => {
    setRepositories((prev) =>
      prev.map((repo) =>
        repo.id === repoId ? { ...repo, sync_status: 'syncing' } : repo,
      ),
    )

    setTimeout(() => {
      setRepositories((prev) =>
        prev.map((repo) =>
          repo.id === repoId
            ? {
                ...repo,
                sync_status: 'synced',
                last_synced_at: new Date().toISOString(),
              }
            : repo,
        ),
      )
    }, 2000)
  }

  const handleDiscovery = async (repoId: string) => {
    setShowDiscoveryModal(repoId)

    // Simulate discovery report loading
    setTimeout(() => {
      const report: DiscoveryReport = {
        id: repoId,
        detected_stack: { React: ['App.tsx', 'components/'], 'Node.js': ['server/'] },
        service_boundaries: [
          { name: 'frontend', files: ['src/components/', 'src/pages/'] },
        ],
        dependency_graph: {
          nodes: ['App', 'Component'],
          edges: [['App', 'Component']],
        },
        risk_hotspots: [
          {
            file: 'config.js',
            risk: 'high',
            reason: 'Hardcoded secrets',
          },
        ],
        file_index_summary: {
          total_files: 150,
          indexed_files: 145,
          languages: { TypeScript: 80, JavaScript: 70 },
        },
      }
      setDiscoveryReports((prev) => ({ ...prev, [repoId]: report }))
    }, 1500)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="skeleton h-8 w-32" />
            <div className="skeleton h-10 w-32" />
          </div>
          <div className="card">
            <div className="card-header">
              <div className="skeleton h-6 w-24" />
            </div>
            <div className="card-body">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-16 w-full mb-3" />
              ))}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Repositories
            </h1>
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
                  onChange={(e) => setSelectedOrg(e.target.value)}
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
                All Repositories ({filteredRepositories.length})
              </h2>
              <button className="btn btn-ghost btn-sm">
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </button>
            </div>
          </div>
          <div className="card-body p-0">
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
                  {filteredRepositories.map((repo) => (
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
                            ? new Date(repo.last_synced_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          {repo.discovery_status === 'completed' && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          )}
                          {repo.discovery_status === 'in_progress' && (
                            <ClockIcon className="h-4 w-4 text-yellow-500" />
                          )}
                          {repo.discovery_status === 'failed' && (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {repo.discovery_status || 'not_started'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleSync(repo.id)}
                            className="btn btn-ghost btn-sm"
                            disabled={repo.sync_status === 'syncing'}
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDiscovery(repo.id)}
                            className="btn btn-ghost btn-sm"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="btn btn-ghost btn-sm">
                            <EllipsisHorizontalIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRepositories.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="table-cell text-center text-sm text-gray-500 py-6"
                      >
                        No repositories match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Discovery Modal */}
        {showDiscoveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Discovery Report
                  </h3>
                  <button
                    onClick={() => setShowDiscoveryModal(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="card-body">
                {discoveryReports[showDiscoveryModal] ? (
                  <div className="space-y-6">
                    {/* Detected Stack */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Detected Stack
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(
                          discoveryReports[showDiscoveryModal].detected_stack,
                        ).map(([tech, files]) => (
                          <div
                            key={tech}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                          >
                            <span className="text-sm font-medium">{tech}</span>
                            <span className="text-xs text-gray-500">
                              {Array.isArray(files) ? files.length : 1} files
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* File Index Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        File Index Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {
                              discoveryReports[showDiscoveryModal]
                                .file_index_summary.total_files
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            Total Files
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {
                              discoveryReports[showDiscoveryModal]
                                .file_index_summary.indexed_files
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            Indexed Files
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="spinner h-8 w-8 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Running discovery analysis...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
