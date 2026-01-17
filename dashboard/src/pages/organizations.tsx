import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { organizationsService } from '../services/organizations.service'
import { bffService } from '../services/bff.service'
import { useApi, useMutation } from '../hooks/useApi'
import { useToast } from '../contexts/ToastContext'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { FormField } from '../components/ui/FormField'
import {
  UserGroupIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { Organization, OrganizationMember, InviteMemberRequest } from '../types'
import { formatDistanceToNow } from 'date-fns'

export default function OrganizationsPage() {
  const { state } = useAuth()
  const { showSuccess, showError } = useToast()
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Form state
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'maintainer' | 'member'>('member')

  // Fetch organizations
  const {
    data: orgsData,
    loading: loadingOrgs,
    refetch: refetchOrgs
  } = useApi(() => organizationsService.getOrganizations(), { immediate: true })

  // Fetch members
  const {
    data: membersData,
    loading: loadingMembers,
    refetch: refetchMembers
  } = useApi(
    () => selectedOrgId
      ? organizationsService.getMembers(selectedOrgId)
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

  // Invite member mutation
  const { mutate: inviteMember, loading: inviting } = useMutation(
    (data: InviteMemberRequest) => {
      if (!selectedOrgId) throw new Error('Please select an organization first')
      return organizationsService.inviteMember(selectedOrgId, data)
    },
    {
      onSuccess: () => {
        showSuccess('Member invited successfully')
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteRole('member')
        refetchMembers()
      },
      onError: (error) => {
        showError(error.message || 'Failed to invite member')
      }
    }
  )

  // Remove member mutation
  const { mutate: removeMember, loading: removing } = useMutation(
    (memberId: string) => {
      if (!selectedOrgId) throw new Error('Please select an organization first')
      return organizationsService.removeMember(selectedOrgId, memberId)
    },
    {
      onSuccess: () => {
        showSuccess('Member removed successfully')
        refetchMembers()
      },
      onError: (error) => {
        showError(error.message || 'Failed to remove member')
      }
    }
  )

  const organizations = orgsData?.data || []
  const members = membersData?.data || []

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

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      showError('Email is required')
      return
    }
    inviteMember({
      email: inviteEmail.trim(),
      role: inviteRole
    })
  }

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMember(memberId)
    }
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'badge-error',
      maintainer: 'badge-warning',
      member: 'badge-primary'
    }
    return <span className={`badge ${styles[role] || 'badge-gray'}`}>{role}</span>
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheckIcon className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Organizations List */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Organizations</h2>
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
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height={80} />
                    ))}
                  </div>
                ) : organizations.length === 0 ? (
                  <EmptyState
                    icon={UserGroupIcon}
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
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedOrgId === org.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedOrgId(org.id)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">@{org.slug}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {org.member_count || 0} members
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="card-body space-y-3">
                <button
                  onClick={() => setShowCreateOrgModal(true)}
                  className="btn btn-primary w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Organization
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="btn btn-secondary w-full"
                  disabled={!selectedOrgId}
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Invite Member
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Members {selectedOrgId && `(${members.length})`}
                  </h2>
                  {selectedOrgId && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={refetchMembers}
                      disabled={loadingMembers}
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${loadingMembers ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {!selectedOrgId ? (
                  <EmptyState
                    icon={UserGroupIcon}
                    title="Select an organization"
                    description="Choose an organization to view its members"
                  />
                ) : loadingMembers ? (
                  <div className="p-6">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height={100} className="mb-4" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <EmptyState
                    icon={UserIcon}
                    title="No members yet"
                    description="Invite members to join this organization"
                    action={
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="btn btn-primary"
                      >
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        Invite Member
                      </button>
                    }
                  />
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {members.map((member) => (
                      <div key={member.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {member.username || member.email}
                                </p>
                                {getRoleBadge(member.role)}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {member.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={removing || member.role === 'admin'}
                            title={member.role === 'admin' ? 'Cannot remove admin' : 'Remove member'}
                          >
                            <TrashIcon className="h-4 w-4" />
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

        {/* Invite Member Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Member"
          size="md"
          footer={
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn btn-secondary"
                disabled={inviting}
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="btn btn-primary"
                disabled={inviting || !inviteEmail.trim() || !selectedOrgId}
              >
                {inviting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Inviting...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField label="Email Address" required>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="input"
                required
              />
            </FormField>
            <FormField label="Role" required>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="select"
              >
                <option value="member">Member</option>
                <option value="maintainer">Maintainer</option>
                <option value="admin">Admin</option>
              </select>
            </FormField>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
