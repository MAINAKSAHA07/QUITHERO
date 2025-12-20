import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Lock, Unlock, Copy } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export const ProgramDays = () => {
  const { programId } = useParams<{ programId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDay, setEditingDay] = useState<any>(null)

  const { data: programData } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => adminCollectionHelpers.getOne('programs', programId!),
    enabled: !!programId,
  })

  const { data: daysData, isLoading } = useQuery({
    queryKey: ['program_days', programId],
    queryFn: () => adminCollectionHelpers.getFullList('program_days', {
      filter: `program = "${programId}"`,
      sort: 'day_number',
    }),
    enabled: !!programId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (dayId: string) => {
      return adminCollectionHelpers.delete('program_days', dayId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program_days'] })
    },
  })

  const toggleLockMutation = useMutation({
    mutationFn: async ({ dayId, isLocked }: { dayId: string; isLocked: boolean }) => {
      return adminCollectionHelpers.update('program_days', dayId, { is_locked: isLocked })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program_days'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (reorderedDays: any[]) => {
      // Update day numbers for all days in the new order
      const updates = reorderedDays.map((day, index) =>
        adminCollectionHelpers.update('program_days', day.id, {
          day_number: index + 1,
        })
      )
      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program_days', programId] })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const program = programData?.data
  const days = daysData?.data || []

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && days.length > 0) {
      const oldIndex = days.findIndex((d: any) => d.id === active.id)
      const newIndex = days.findIndex((d: any) => d.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedDays = arrayMove(days, oldIndex, newIndex)
        reorderMutation.mutate(reorderedDays)
      }
    }
  }

  const handleDelete = async (day: any) => {
    if (confirm(`Are you sure you want to delete Day ${day.day_number}?`)) {
      try {
        await deleteMutation.mutateAsync(day.id)
      } catch (error) {
        console.error('Failed to delete day:', error)
        alert('Failed to delete day')
      }
    }
  }

  const handleToggleLock = async (day: any) => {
    try {
      await toggleLockMutation.mutateAsync({
        dayId: day.id,
        isLocked: !day.is_locked,
      })
    } catch (error) {
      console.error('Failed to toggle lock:', error)
      alert('Failed to update day lock status')
    }
  }

  const handleDuplicate = async (day: any) => {
    try {
      const { id, created, updated, ...dayData } = day
      const maxDayNumber = Math.max(...days.map((d: any) => d.day_number || 0), 0)
      await adminCollectionHelpers.create('program_days', {
        ...dayData,
        day_number: maxDayNumber + 1,
        title: `${day.title} (Copy)`,
      })
      queryClient.invalidateQueries({ queryKey: ['program_days'] })
    } catch (error) {
      console.error('Failed to duplicate day:', error)
      alert('Failed to duplicate day')
    }
  }

  if (!program) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Program not found</p>
        <button onClick={() => navigate('/content/programs')} className="btn-primary mt-4">
          Back to Programs
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/content/programs')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="text-sm text-neutral-500 mb-1">
            Content &gt; Programs &gt; {program.title} &gt; Days
          </div>
          <h1 className="text-3xl font-bold text-neutral-dark">{program.title} - Days</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Day
        </button>
      </div>

      {/* Program Info Card */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-neutral-500">Language</label>
            <p className="font-medium">{program.language?.toUpperCase() || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-500">Duration</label>
            <p className="font-medium">{program.duration_days || 10} days</p>
          </div>
          <div>
            <label className="text-sm text-neutral-500">Status</label>
            <p className="font-medium">
              <span className={`px-2 py-1 text-xs rounded ${
                program.is_active ? 'bg-success/10 text-success' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {program.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-500">Total Days</label>
            <p className="font-medium">{days.length}</p>
          </div>
        </div>
      </div>

      {/* Days List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : days.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <p className="text-neutral-500 mb-4">No days added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Add First Day
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={days.map((d: any) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {days.map((day: any, _index: number) => (
                <SortableDayItem
                  key={day.id}
                  day={day}
                  programId={programId!}
                  onEdit={() => setEditingDay(day)}
                  onDelete={() => handleDelete(day)}
                  onToggleLock={() => handleToggleLock(day)}
                  onDuplicate={() => handleDuplicate(day)}
                  navigate={navigate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Day Modal */}
      {(showAddModal || editingDay) && (
        <AddEditDayModal
          programId={programId!}
          day={editingDay}
          onClose={() => {
            setShowAddModal(false)
            setEditingDay(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingDay(null)
            queryClient.invalidateQueries({ queryKey: ['program_days'] })
          }}
        />
      )}
    </div>
  )
}

interface SortableDayItemProps {
  day: any
  programId: string
  onEdit: () => void
  onDelete: () => void
  onToggleLock: () => void
  onDuplicate: () => void
  navigate: (path: string) => void
}

const SortableDayItem: React.FC<SortableDayItemProps> = ({
  day,
  programId,
  onEdit,
  onDelete,
  onToggleLock,
  onDuplicate,
  navigate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: day.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-2 pt-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
            {day.day_number}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark">{day.title}</h3>
              {day.subtitle && (
                <p className="text-sm text-neutral-500 mt-1">{day.subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleLock}
                className="p-2 hover:bg-neutral-100 rounded-lg"
                title={day.is_locked ? 'Unlock' : 'Lock'}
              >
                {day.is_locked ? (
                  <Lock className="w-4 h-4 text-warning" />
                ) : (
                  <Unlock className="w-4 h-4 text-success" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
            {day.estimated_duration_min && (
              <span>⏱ {day.estimated_duration_min} min</span>
            )}
            <span className={`px-2 py-1 rounded text-xs ${
              day.is_locked
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
            }`}>
              {day.is_locked ? 'Locked' : 'Unlocked'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
            <button
              onClick={() => navigate(`/content/programs/${programId}/days/${day.id}/steps`)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              Manage Steps
            </button>
            <button
              onClick={onEdit}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onDuplicate}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              onClick={onDelete}
              className="btn-danger text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AddEditDayModalProps {
  programId: string
  day?: any
  onClose: () => void
  onSuccess: () => void
}

const AddEditDayModal: React.FC<AddEditDayModalProps> = ({ programId, day, onClose, onSuccess }) => {
  // const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    day_number: day?.day_number || 1,
    title: day?.title || '',
    subtitle: day?.subtitle || '',
    estimated_duration_min: day?.estimated_duration_min || 15,
    is_locked: day?.is_locked || false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: existingDays } = useQuery({
    queryKey: ['program_days', programId],
    queryFn: () => adminCollectionHelpers.getFullList('program_days', {
      filter: `program = "${programId}"`,
    }),
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.create('program_days', {
        ...data,
        program: programId,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.update('program_days', day.id, data)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (day) {
        await updateMutation.mutateAsync(formData)
      } else {
        await createMutation.mutateAsync(formData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save day:', error)
      alert(error?.error || 'Failed to save day')
    } finally {
      setIsSubmitting(false)
    }
  }

  const maxDayNumber = existingDays?.data
    ? Math.max(...existingDays.data.map((d: any) => d.day_number || 0), 0)
    : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{day ? 'Edit Day' : 'Add New Day'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Day Number
            </label>
            <input
              type="number"
              value={formData.day_number}
              onChange={(e) => setFormData({ ...formData, day_number: Number(e.target.value) })}
              min={1}
              max={maxDayNumber + 1}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Auto-filled based on position. Max: {maxDayNumber + 1}
            </p>
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.estimated_duration_min}
              onChange={(e) => setFormData({ ...formData, estimated_duration_min: Number(e.target.value) })}
              min={1}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_locked"
              checked={formData.is_locked}
              onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
              className="rounded border-neutral-300"
            />
            <label htmlFor="is_locked" className="text-sm text-neutral-700">
              Lock this day (prevents users from accessing until previous day is completed)
            </label>
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
              {isSubmitting ? 'Saving...' : day ? 'Update Day' : 'Create Day'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
