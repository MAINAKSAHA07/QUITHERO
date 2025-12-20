import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Edit, Trash2, Copy, Award, TrendingUp } from 'lucide-react'

interface Achievement {
  id: string
  key: string
  title: string
  description?: string
  icon?: string
  tier?: string
  requirement_type?: string
  requirement_value?: number
  is_active?: boolean
  [key: string]: any
}

export const AllAchievements = () => {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const { data: achievementsData, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => adminCollectionHelpers.getFullList('achievements', {
      sort: 'order',
    }),
  })

  const { data: userAchievementsData } = useQuery({
    queryKey: ['user_achievements', 'counts'],
    queryFn: () => adminCollectionHelpers.getFullList('user_achievements'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminCollectionHelpers.delete('achievements', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return adminCollectionHelpers.update('achievements', id, { is_active: isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
    },
  })

  const achievements = (achievementsData?.data || []) as any as Achievement[]
  const userAchievements = userAchievementsData?.data || []

  const getUnlockCount = (achievementId: string) => {
    return userAchievements.filter((ua: any) => ua.achievement === achievementId).length
  }

  const getUnlockRate = (achievementId: string, totalUsers: number) => {
    const unlocks = getUnlockCount(achievementId)
    return totalUsers > 0 ? Math.round((unlocks / totalUsers) * 100 * 10) / 10 : 0
  }

  const { data: totalUsers } = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => adminCollectionHelpers.getFullList('users'),
  })

  const totalUsersCount = totalUsers?.data?.length || 1

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-600'
      case 'silver':
        return 'bg-gray-400'
      case 'gold':
        return 'bg-yellow-500'
      case 'platinum':
        return 'bg-purple-500'
      default:
        return 'bg-neutral-300'
    }
  }

  const handleDelete = async (achievement: Achievement) => {
    const unlockCount = getUnlockCount(achievement.id)
    if (unlockCount > 0) {
      alert(`Cannot delete achievement. ${unlockCount} user(s) have unlocked it.`)
      return
    }
    if (confirm(`Are you sure you want to delete "${achievement.title}"?`)) {
      try {
        await deleteMutation.mutateAsync(achievement.id)
      } catch (error) {
        console.error('Failed to delete achievement:', error)
        alert('Failed to delete achievement')
      }
    }
  }

  const handleDuplicate = async (achievement: Achievement) => {
    try {
      const { id, created, updated, ...achievementData } = achievement
      await adminCollectionHelpers.create('achievements', {
        ...achievementData,
        key: `${achievement.key}_copy`,
        title: `${achievement.title} (Copy)`,
        is_active: false,
      })
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
    } catch (error) {
      console.error('Failed to duplicate achievement:', error)
      alert('Failed to duplicate achievement')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-dark">All Achievements</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-neutral-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-neutral-600'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-primary text-white' : 'text-neutral-600'}`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Achievement
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : achievements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <Award className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No achievements found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create First Achievement
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => {
            const unlockCount = getUnlockCount(achievement.id)
            const unlockRate = getUnlockRate(achievement.id, totalUsersCount)
            return (
              <div key={achievement.id} className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 ${getTierColor(achievement.tier || 'bronze')} rounded-full flex items-center justify-center text-white text-2xl`}>
                      {achievement.icon || '🏆'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-dark">{achievement.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded mt-1 inline-block capitalize ${
                        achievement.tier === 'bronze' ? 'bg-amber-100 text-amber-800' :
                        achievement.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                        achievement.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        achievement.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                        'bg-neutral-100 text-neutral-800'
                      }`}>
                        {achievement.tier || 'bronze'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActiveMutation.mutate({
                      id: achievement.id,
                      isActive: !achievement.is_active,
                    })}
                    className={`px-2 py-1 text-xs rounded ${
                      achievement.is_active ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {achievement.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <p className="text-sm text-neutral-600 mb-4">{achievement.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Requirement</span>
                    <span className="font-medium">
                      {achievement.requirement_value} {achievement.requirement_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Total Unlocks</span>
                    <span className="font-medium">{unlockCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Unlock Rate</span>
                    <span className="font-medium flex items-center gap-1">
                      {unlockRate}%
                      {unlockRate > 50 && <TrendingUp className="w-4 h-4 text-success" />}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
                  <button
                    onClick={() => setEditingAchievement(achievement)}
                    className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(achievement)}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(achievement)}
                    className="btn-danger text-sm flex items-center gap-2"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Requirement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total Unlocks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Unlock Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {achievements.map((achievement) => {
                const unlockCount = getUnlockCount(achievement.id)
                const unlockRate = getUnlockRate(achievement.id, totalUsersCount)
                return (
                  <tr key={achievement.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${getTierColor(achievement.tier || 'bronze')} rounded-full flex items-center justify-center text-white`}>
                          {achievement.icon || '🏆'}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-dark">{achievement.title}</p>
                          {achievement.description && (
                            <p className="text-sm text-neutral-500 line-clamp-1">{achievement.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded capitalize ${
                        achievement.tier === 'bronze' ? 'bg-amber-100 text-amber-800' :
                        achievement.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                        achievement.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        achievement.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                        'bg-neutral-100 text-neutral-800'
                      }`}>
                        {achievement.tier || 'bronze'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {achievement.requirement_value} {achievement.requirement_type?.replace('_', ' ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium">{unlockCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{unlockRate}%</span>
                        {unlockRate > 50 && <TrendingUp className="w-4 h-4 text-success" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        achievement.is_active ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {achievement.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingAchievement(achievement)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(achievement)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDelete(achievement)}
                          className="p-2 hover:bg-neutral-100 rounded-lg"
                          title="Delete"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Achievement Modal */}
      {(showCreateModal || editingAchievement) && (
        <AchievementModal
          achievement={editingAchievement}
          onClose={() => {
            setShowCreateModal(false)
            setEditingAchievement(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingAchievement(null)
            queryClient.invalidateQueries({ queryKey: ['achievements'] })
          }}
        />
      )}
    </div>
  )
}

interface AchievementModalProps {
  achievement?: Achievement | null
  onClose: () => void
  onSuccess: () => void
}

const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose, onSuccess }) => {
  // const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    key: achievement?.key || '',
    title: achievement?.title || '',
    description: achievement?.description || '',
    icon: achievement?.icon || '🏆',
    tier: achievement?.tier || 'bronze',
    requirement_type: achievement?.requirement_type || 'days_streak',
    requirement_value: achievement?.requirement_value || 1,
    is_active: achievement?.is_active !== undefined ? achievement.is_active : true,
    order: achievement?.order || 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.create('achievements', data)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.update('achievements', achievement!.id, data)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.key.trim() || !formData.title.trim()) {
      alert('Key and Title are required')
      return
    }

    setIsSubmitting(true)
    try {
      if (achievement) {
        await updateMutation.mutateAsync(formData)
      } else {
        await createMutation.mutateAsync(formData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save achievement:', error)
      alert(error?.error || 'Failed to save achievement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{achievement ? 'Edit Achievement' : 'Create New Achievement'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Key (unique identifier) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              required
              placeholder="e.g., first_day, week_warrior"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
              placeholder="e.g., First Day, Week Warrior"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Achievement description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Icon (emoji or text)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="🏆"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Requirement Type</label>
              <select
                value={formData.requirement_type}
                onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="days_streak">Days Streak</option>
                <option value="cravings_resisted">Cravings Resisted</option>
                <option value="sessions_completed">Sessions Completed</option>
                <option value="slips_under_threshold">Slips Under Threshold</option>
                <option value="journal_entries">Journal Entries</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Requirement Value</label>
              <input
                type="number"
                value={formData.requirement_value}
                onChange={(e) => setFormData({ ...formData, requirement_value: Number(e.target.value) })}
                min={1}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">Active</span>
            </label>
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : achievement ? 'Update Achievement' : 'Create Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
