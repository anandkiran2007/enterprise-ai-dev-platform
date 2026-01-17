import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'

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

export default function ProjectsPage() {
  const { state } = useAuth()

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [projects, setProjects] = useState<Project[]>([])

  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')

  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const authHeader = useMemo(() => {
    const token = state.token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }, [state.token])

  const loadOrganizations = async () => {
    setLoadingOrgs(true)
    setError(null)
    try {
      const res = await fetch('/api/organizations', {
        headers: {
          ...authHeader,
        },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load organizations (${res.status})`)
      }
      const data = (await res.json()) as Organization[]
      setOrgs(data)
      if (!selectedOrgId && data.length > 0) {
        setSelectedOrgId(data[0].id)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load organizations')
    } finally {
      setLoadingOrgs(false)
    }
  }

  const loadProjects = async (orgId: string) => {
    if (!orgId) {
      setProjects([])
      return
    }
    setLoadingProjects(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects?org_id=${encodeURIComponent(orgId)}`, {
        headers: {
          ...authHeader,
        },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load projects (${res.status})`)
      }
      const data = (await res.json()) as Project[]
      setProjects(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadProjects(selectedOrgId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgId])

  const createOrganization = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      setError('Organization name and slug are required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ name: newOrgName.trim(), slug: newOrgSlug.trim() }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to create organization (${res.status})`)
      }
      const created = (await res.json()) as Organization
      setOrgs((prev) => [created, ...prev])
      setSelectedOrgId(created.id)
      setNewOrgName('')
      setNewOrgSlug('')
    } catch (e: any) {
      setError(e?.message || 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  const createProject = async () => {
    if (!selectedOrgId) {
      setError('Select an organization first')
      return
    }
    if (!newProjectName.trim()) {
      setError('Project name is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects?org_id=${encodeURIComponent(selectedOrgId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ name: newProjectName.trim(), description: newProjectDescription.trim() || null }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to create project (${res.status})`)
      }
      const created = (await res.json()) as Project
      setProjects((prev) => [created, ...prev])
      setNewProjectName('')
      setNewProjectDescription('')
    } catch (e: any) {
      setError(e?.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Organization</h2>
                <button
                  className="btn btn-secondary"
                  onClick={loadOrganizations}
                  disabled={loadingOrgs}
                >
                  {loadingOrgs ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select</label>
                <select
                  className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  disabled={loadingOrgs || orgs.length === 0}
                >
                  {orgs.length === 0 ? (
                    <option value="">No organizations yet</option>
                  ) : (
                    orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.slug})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Create organization</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="Acme Inc"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      placeholder="acme"
                    />
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={createOrganization}
                    disabled={submitting}
                  >
                    {submitting ? 'Creating…' : 'Create org'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">New project</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Platform API"
                    disabled={!selectedOrgId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Describe what this project is for…"
                    disabled={!selectedOrgId}
                  />
                </div>
                <button
                  className="btn btn-primary w-full"
                  onClick={createProject}
                  disabled={submitting || !selectedOrgId}
                >
                  {submitting ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadProjects(selectedOrgId)}
                  disabled={loadingProjects || !selectedOrgId}
                >
                  {loadingProjects ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              <div className="mt-4">
                {!selectedOrgId ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Create or select an organization to view projects.
                  </div>
                ) : loadingProjects ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Loading projects…</div>
                ) : projects.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    No projects yet for this organization.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Repos</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {projects.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                              {p.description ? (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{p.description}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <span className="status-badge status-info">{p.status}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {p.repository_count ?? 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {new Date(p.created_at).toLocaleString()}
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
      </div>
    </DashboardLayout>
  )
}
