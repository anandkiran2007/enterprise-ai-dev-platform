import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { organizationsService } from '../services/organizations.service'
import { projectsService } from '../services/projects.service'
import { useApi, useMutation } from '../hooks/useApi'
import { useToast } from '../contexts/ToastContext'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { FormField } from '../components/ui/FormField'
import {
  FolderIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function ProjectsPage() {
  const { state } = useAuth()
  const { showSuccess, showError } = useToast()
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)

  // Form state
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  // Fetch organizations
  const {
    data: orgsData,
    loading: loadingOrgs,
    refetch: refetchOrgs
  } = useApi(() => organizationsService.getOrganizations(), { immediate: true })

  // Fetch projects
  const {
    data: projectsData,
    loading: loadingProjects,
    refetch: refetchProjects
  } = useApi(
    () => selectedOrgId
      ? projectsService.getProjects(selectedOrgId)
      : Promise.resolve({ data: [], total: 0, page: 1, limit: 20, hasMore: false }),
    { immediate: !!selectedOrgId }
  )

  // Create organization mutation
  const { mutate: createOrganization, loading: creatingOrg } = useMutation(
    (data: { name: string; slug?: string }) => organizationsService.createOrganization(data),
    {
      onSuccess: (org) => {
        showSuccess('Organization created successfully')
        setShowCreateOrgModal(false)
        setNewOrgName('')
        setNewOrgSlug('')
        setSelectedOrgId(org.id)
        refetchOrgs()
      },
      onError: (error) => {
        showError(error.message || 'Failed to create organization')
      }
    }
  )

  // Create project mutation
  const { mutate: createProject, loading: creatingProject } = useMutation(
    (data: { name: string; description?: string }) => {
      if (!selectedOrgId) throw new Error('Please select an organization first')
      return projectsService.createProject(selectedOrgId, data)
    },
    {
      onSuccess: () => {
        showSuccess('Project created successfully')
        setShowCreateProjectModal(false)
        setNewProjectName('')
        setNewProjectDescription('')
        refetchProjects()
      },
      onError: (error) => {
        showError(error.message || 'Failed to create project')
      }
    }
  )

  const organizations = orgsData?.data || []
  const projects = projectsData?.data || []

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id)
    }
  }, [organizations, selectedOrgId])

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) {
      showError('Organization name is required')
      return
    }
    createOrganization({
      name: newOrgName.trim(),
      slug: newOrgSlug.trim() || undefined
    })
  }

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      showError('Project name is required')
      return
    }
    if (!selectedOrgId) {
      showError('Please select an organization first')
      return
    }
    createProject({
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'badge-success',
      archived: 'badge-gray',
      deleted: 'badge-error'
    }
    return (
      <span className={`badge ${styles[status] || 'badge-gray'}`}>
        {status}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Create and manage projects across repositories.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Organization Selector */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Organization</h2>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={refetchOrgs}
                    disabled={loadingOrgs}
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${loadingOrgs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                {loadingOrgs ? (
                  <Skeleton height={40} />
                ) : organizations.length === 0 ? (
                  <EmptyState
                    icon={FolderIcon}
                    title="No organizations"
                    description="Create your first organization to get started"
                    action={
                      <button
                        onClick={() => setShowCreateOrgModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Organization
                      </button>
                    }
                  />
                ) : (
                  <>
                    <select
                      className="select w-full"
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowCreateOrgModal(true)}
                      className="btn btn-secondary w-full mt-4"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Organization
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Create Project Card */}
            {selectedOrgId && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">New Project</h2>
                </div>
                <div className="card-body">
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="btn btn-primary w-full"
                    disabled={!selectedOrgId}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Project
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Projects {selectedOrgId && `(${projects.length})`}
                  </h2>
                  {selectedOrgId && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={refetchProjects}
                      disabled={loadingProjects}
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${loadingProjects ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {!selectedOrgId ? (
                  <EmptyState
                    icon={FolderIcon}
                    title="Select an organization"
                    description="Choose an organization to view its projects"
                  />
                ) : loadingProjects ? (
                  <div className="p-6">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height={80} className="mb-4" />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <EmptyState
                    icon={FolderIcon}
                    title="No projects yet"
                    description="Create your first project for this organization"
                    action={
                      <button
                        onClick={() => setShowCreateProjectModal(true)}
                        className="btn btn-primary"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Project
                      </button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="table-header text-left">Name</th>
                          <th className="table-header text-left">Status</th>
                          <th className="table-header text-left">Repositories</th>
                          <th className="table-header text-left">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project) => (
                          <tr key={project.id} className="table-row">
                            <td className="table-cell">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {project.name}
                                </div>
                                {project.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="table-cell">
                              {getStatusBadge(project.status)}
                            </td>
                            <td className="table-cell">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {project.repository_count ?? 0}
                              </span>
                            </td>
                            <td className="table-cell">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {project.last_activity
                                  ? formatDistanceToNow(new Date(project.last_activity), { addSuffix: true })
                                  : 'Never'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Organization Modal */}
        <Modal
          isOpen={showCreateOrgModal}
          onClose={() => setShowCreateOrgModal(false)}
          title="Create Organization"
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateOrgModal(false)}
                className="btn btn-secondary"
                disabled={creatingOrg}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrg}
                className="btn btn-primary"
                disabled={creatingOrg || !newOrgName.trim()}
              >
                {creatingOrg ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField label="Organization Name" required>
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Acme Inc"
                className="input"
                required
              />
            </FormField>
            <FormField
              label="Slug"
              hint="URL-friendly identifier (auto-generated if left empty)"
            >
              <input
                type="text"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                placeholder="acme-inc"
                className="input"
              />
            </FormField>
          </div>
        </Modal>

        {/* Create Project Modal */}
        <Modal
          isOpen={showCreateProjectModal}
          onClose={() => setShowCreateProjectModal(false)}
          title="Create Project"
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateProjectModal(false)}
                className="btn btn-secondary"
                disabled={creatingProject}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="btn btn-primary"
                disabled={creatingProject || !newProjectName.trim() || !selectedOrgId}
              >
                {creatingProject ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField label="Project Name" required>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Platform API"
                className="input"
                required
              />
            </FormField>
            <FormField label="Description" hint="Optional description of the project">
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Describe what this project is for..."
                className="textarea"
                rows={4}
              />
            </FormField>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
