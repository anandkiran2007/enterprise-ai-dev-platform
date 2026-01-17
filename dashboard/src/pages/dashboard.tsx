import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  ChartBarIcon,
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  DocumentIcon,
  CpuChipIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { bffService } from '../services/bff.service'
import { useToast } from '../contexts/ToastContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

type MetricTrend = 'up' | 'down' | 'neutral'
type MetricColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple'

interface MetricChange {
  value: string
  trend: MetricTrend
}

interface Metric {
  label: string
  value: string | number
  title: string
  color: MetricColor
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  change?: MetricChange
}

export default function DashboardPage() {
  const { state } = useAuth()
  const { showError } = useToast()
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [repositories, setRepositories] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await bffService.getDashboardData()
      
      // Transform metrics
      const transformedMetrics: Metric[] = [
        {
          label: 'Total Organizations',
          title: 'Organizations you have access to',
          value: data.stats.totalOrganizations,
          color: 'blue',
          icon: UserGroupIcon,
          change: { value: '+0', trend: 'neutral' }
        },
        {
          label: 'Total Projects',
          title: 'Active projects across organizations',
          value: data.stats.totalProjects,
          color: 'green',
          icon: FolderIcon,
          change: { value: '+0', trend: 'neutral' }
        },
        {
          label: 'Total Repositories',
          title: 'Repositories connected to the platform',
          value: data.stats.totalRepositories,
          color: 'purple',
          icon: DocumentIcon,
          change: { value: '+0', trend: 'neutral' }
        },
        {
          label: 'Active Agents',
          title: 'AI agents currently running',
          value: data.stats.activeAgents,
          color: 'yellow',
          icon: CpuChipIcon,
          change: { value: '+0', trend: 'neutral' }
        }
      ]

      setMetrics(transformedMetrics)
      setActivities(data.recentActivity)
      setRepositories(data.repositories)
      setOrganizations(data.organizations)
    } catch (err: any) {
      // Handle errors gracefully - API might not be running
      const isNetworkError = err.code === 'NETWORK_ERROR' || 
                            err.status === 0 || 
                            err.message?.includes('connect') ||
                            err.message?.includes('Network') ||
                            err.message?.includes('fetch')
      
      if (isNetworkError) {
        // API not running - show empty dashboard with zero values
        const emptyMetrics: Metric[] = [
          {
            label: 'Total Organizations',
            title: 'Organizations you have access to',
            value: 0,
            color: 'blue',
            icon: UserGroupIcon,
            change: { value: '+0', trend: 'neutral' }
          },
          {
            label: 'Total Projects',
            title: 'Active projects across organizations',
            value: 0,
            color: 'green',
            icon: FolderIcon,
            change: { value: '+0', trend: 'neutral' }
          },
          {
            label: 'Total Repositories',
            title: 'Repositories connected to the platform',
            value: 0,
            color: 'purple',
            icon: DocumentIcon,
            change: { value: '+0', trend: 'neutral' }
          },
          {
            label: 'Active Agents',
            title: 'AI agents currently running',
            value: 0,
            color: 'yellow',
            icon: CpuChipIcon,
            change: { value: '+0', trend: 'neutral' }
          }
        ]
        setMetrics(emptyMetrics)
        setActivities([])
        setRepositories([])
        setOrganizations([])
        // Don't show error toast for network errors - this is expected when API is not running
      } else {
        // Real error - show it
        const errorMessage = err.message || 'Failed to load dashboard data'
        setError(errorMessage)
        showError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getMetricColor = (color: MetricColor) => {
    const colors: Record<MetricColor, string> = {
      blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      green:
        'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      yellow:
        'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
      red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      purple:
        'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    }
    return colors[color]
  }

  const getTrendIcon = (trend?: MetricTrend) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'build':
        return <ChartBarIcon className="h-4 w-4 text-blue-500" />
      case 'deploy':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
      case 'commit':
        return <DocumentIcon className="h-4 w-4 text-purple-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case 'agent_task':
        return <CpuChipIcon className="h-4 w-4 text-yellow-500" />
      default:
        return <DocumentIcon className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton height={32} width={200} />
            <Skeleton height={20} width={400} className="mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-6">
                <Skeleton height={48} width={48} className="mb-4" />
                <Skeleton height={32} width={100} className="mb-2" />
                <Skeleton height={16} width={150} />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !metrics.length) {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Failed to load dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button onClick={loadDashboardData} className="btn btn-primary">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your projects
            today.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="card-hover p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getMetricColor(metric.color)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {metric.title}
                  </p>
                  {metric.change && (
                    <div className="flex items-center mt-2">
                      {getTrendIcon(metric.change.trend)}
                      <span
                        className={`text-sm ml-1 ${
                          metric.change.trend === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : metric.change.trend === 'down'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {metric.change.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <div className="card-body p-0">
              {activities.length === 0 ? (
                <EmptyState
                  icon={ClockIcon}
                  title="No recent activity"
                  description="Activity will appear here as you use the platform"
                />
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Links
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                <Link
                  href="/repositories"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <DocumentIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Repositories ({repositories.length})
                  </span>
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FolderIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Projects
                  </span>
                </Link>
                <Link
                  href="/organizations"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Organizations ({organizations.length})
                  </span>
                </Link>
                <Link
                  href="/agents"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <CpuChipIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    AI Agents
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
