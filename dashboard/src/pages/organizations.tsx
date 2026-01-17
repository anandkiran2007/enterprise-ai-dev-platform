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

type Member = {
  id: string
  username: string
  email: string
  role: string
  joined_at: string
}

export default function OrganizationsPage() {
  const { state } = useAuth()

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])

  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [showCreateOrg, setShowCreateOrg] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [showInvite, setShowInvite] = useState(false)

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
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load organizations (${res.status})`)
      }
      const data = (await res.json()) as Organization[]
      setOrganizations(data)
      if (!selectedOrgId && data.length > 0) {
        setSelectedOrgId(data[0].id)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load organizations')
    } finally {
      setLoadingOrgs(false)
    }
  }

  const loadMembers = async (orgId: string) => {
    if (!orgId) {
      setMembers([])
      return
    }
    setLoadingMembers(true)
    setError(null)
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load members (${res.status})`)
      }
      const data = (await res.json()) as Member[]
      setMembers(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load members')
    } finally {
      setLoadingMembers(false)
    }
  }

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
        body: JSON.stringify({
          name: newOrgName.trim(),
          slug: newOrgSlug.trim(),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to create organization (${res.status})`)
      }
      const created = (await res.json()) as Organization
      setOrganizations((prev) => [created, ...prev])
      setSelectedOrgId(created.id)
      setNewOrgName('')
      setNewOrgSlug('')
      setShowCreateOrg(false)
    } catch (e: any) {
      setError(e?.message || 'Failed to create organization')
    } finally {
      setSubmitting(false)
    }
  }

  const inviteMember = async () => {
    if (!selectedOrgId || !inviteEmail.trim()) {
      setError('Organization and email are required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to invite member (${res.status})`)
      }
      const invited = (await res.json()) as Member
      setMembers((prev) => [invited, ...prev])
      setInviteEmail('')
      setInviteRole('member')
      setShowInvite(false)
    } catch (e: any) {
      setError(e?.message || 'Failed to invite member')
    } finally {
      setSubmitting(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (!selectedOrgId) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/members/${memberId}`, {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to remove member (${res.status})`)
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (e: any) {
      setError(e?.message || 'Failed to remove member')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    loadMembers(selectedOrgId)
  }, [selectedOrgId])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'status-error'
      case 'maintainer': return 'status-warning'
      case 'member': return 'status-info'
      default: return 'status-info'
    }
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Manage organizations, members, and permissions.
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
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Organizations</h2>
                <button
                  className="btn btn-primary text-xs"
                  onClick={() => setShowCreateOrg(true)}
                >
                  Create
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {loadingOrgs ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Loading organizations…</div>
                ) : organizations.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    No organizations yet. Create your first organization.
                  </div>
                ) : (
                  organizations.map((org) => (
                    <div
                      key={org.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedOrgId === org.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedOrgId(org.id)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">@{org.slug}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {org.member_count || 0} members
                      </div>
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
                  onClick={() => setShowCreateOrg(true)}
                >
                  Create Organization
                </button>
                
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => setShowInvite(true)}
                  disabled={!selectedOrgId}
                >
                  Invite Member
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Members</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadMembers(selectedOrgId)}
                  disabled={loadingMembers || !selectedOrgId}
                >
                  {loadingMembers ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              <div className="mt-4">
                {!selectedOrgId ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Select an organization to view members.
                  </div>
                ) : loadingMembers ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Loading members…</div>
                ) : members.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    No members in this organization yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{member.username}</h3>
                              <span className={`status-badge ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{member.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              className="btn btn-secondary text-xs"
                              onClick={() => removeMember(member.id)}
                              disabled={submitting || member.role === 'admin'}
                            >
                              Remove
                            </button>
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

        {/* Create Organization Modal */}
        {showCreateOrg && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Organization</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateOrg(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization Name</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="My Company"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      placeholder="my-company"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      className="btn btn-primary flex-1"
                      onClick={createOrganization}
                      disabled={submitting || !newOrgName.trim() || !newOrgSlug.trim()}
                    >
                      {submitting ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => setShowCreateOrg(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {showInvite && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite Member</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowInvite(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      type="email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <select
                      className="input mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="maintainer">Maintainer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      className="btn btn-primary flex-1"
                      onClick={inviteMember}
                      disabled={submitting || !inviteEmail.trim()}
                    >
                      {submitting ? 'Inviting...' : 'Invite'}
                    </button>
                    <button
                      className="btn btn-secondary flex-1"
                      onClick={() => setShowInvite(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
