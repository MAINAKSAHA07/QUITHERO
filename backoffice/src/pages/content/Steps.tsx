import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, FileText, HelpCircle, CheckCircle, Play, Video, Music } from 'lucide-react'

type StepType = 'text' | 'question_mcq' | 'question_open' | 'exercise' | 'video' | 'audio'

const stepTypeLabels: Record<StepType, string> = {
  text: 'Text Content',
  question_mcq: 'Multiple Choice',
  question_open: 'Open Question',
  exercise: 'Exercise',
  video: 'Video',
  audio: 'Audio',
}

const stepTypeIcons: Record<StepType, typeof FileText> = {
  text: FileText,
  question_mcq: HelpCircle,
  question_open: HelpCircle,
  exercise: Play,
  video: Video,
  audio: Music,
}

export const Steps = () => {
  const { programId, dayId } = useParams<{ programId: string; dayId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStep, setEditingStep] = useState<any>(null)

  const { data: dayData } = useQuery({
    queryKey: ['program_day', dayId],
    queryFn: () => adminCollectionHelpers.getOne('program_days', dayId!),
    enabled: !!dayId,
  })

  const { data: stepsData, isLoading } = useQuery({
    queryKey: ['steps', dayId],
    queryFn: () => adminCollectionHelpers.getFullList('steps', {
      filter: `program_day = "${dayId}"`,
      sort: 'order',
    }),
    enabled: !!dayId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (stepId: string) => {
      return adminCollectionHelpers.delete('steps', stepId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] })
    },
  })

  const day = dayData?.data
  const steps = stepsData?.data || []

  const handleDelete = async (step: any) => {
    if (confirm(`Are you sure you want to delete this step?`)) {
      try {
        await deleteMutation.mutateAsync(step.id)
      } catch (error) {
        console.error('Failed to delete step:', error)
        alert('Failed to delete step')
      }
    }
  }

  const handleDuplicate = async (step: any) => {
    try {
      const { id, created, updated, ...stepData } = step
      const maxOrder = Math.max(...steps.map((s: any) => s.order || 0), 0)
      await adminCollectionHelpers.create('steps', {
        ...stepData,
        order: maxOrder + 1,
      })
      queryClient.invalidateQueries({ queryKey: ['steps'] })
    } catch (error) {
      console.error('Failed to duplicate step:', error)
      alert('Failed to duplicate step')
    }
  }

  if (!day) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Day not found</p>
        <button onClick={() => navigate(`/content/programs/${programId}/days`)} className="btn-primary mt-4">
          Back to Days
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/content/programs/${programId}/days`)}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="text-sm text-neutral-500 mb-1">
            Content &gt; Programs &gt; Day {day.day_number} &gt; Steps
          </div>
          <h1 className="text-3xl font-bold text-neutral-dark">
            Day {day.day_number}: {day.title} - Steps
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {/* Day Info Card */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-neutral-500">Day Number</label>
            <p className="font-medium">{day.day_number}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-500">Title</label>
            <p className="font-medium">{day.title}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-500">Duration</label>
            <p className="font-medium">{day.estimated_duration_min || 15} min</p>
          </div>
          <div>
            <label className="text-sm text-neutral-500">Total Steps</label>
            <p className="font-medium">{steps.length}</p>
          </div>
        </div>
      </div>

      {/* Steps List */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : steps.length === 0 ? (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <p className="text-neutral-500 mb-4">No steps added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            Add First Step
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step: any, index: number) => {
            const stepType = step.type as StepType
            const Icon = stepTypeIcons[stepType] || FileText
            const content = step.content_json || {}
            let preview = ''

            if (stepType === 'text') {
              preview = content.text?.substring(0, 50) || ''
            } else if (stepType === 'question_mcq') {
              preview = content.question || ''
            } else if (stepType === 'question_open') {
              preview = content.question || ''
            } else if (stepType === 'exercise') {
              preview = content.exercise_name || content.instructions?.substring(0, 50) || ''
            } else if (stepType === 'video') {
              preview = content.video_title || content.video_url || ''
            } else if (stepType === 'audio') {
              preview = content.audio_title || content.audio_url || ''
            }

            return (
              <div
                key={step.id}
                className="bg-white rounded-lg shadow-card p-6 hover:shadow-card-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 pt-1">
                    <GripVertical className="w-5 h-5 text-neutral-400 cursor-move" />
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-bold">
                      {step.order}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          stepType === 'text' ? 'bg-primary/10' :
                          stepType === 'question_mcq' || stepType === 'question_open' ? 'bg-secondary/10' :
                          stepType === 'exercise' ? 'bg-success/10' :
                          stepType === 'video' ? 'bg-danger/10' :
                          'bg-warning/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            stepType === 'text' ? 'text-primary' :
                            stepType === 'question_mcq' || stepType === 'question_open' ? 'text-secondary' :
                            stepType === 'exercise' ? 'text-success' :
                            stepType === 'video' ? 'text-danger' :
                            'text-warning'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs bg-neutral-100 rounded">
                              {stepTypeLabels[stepType]}
                            </span>
                          </div>
                          {preview && (
                            <p className="text-sm text-neutral-600 mt-1 line-clamp-1">{preview}...</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-neutral-200">
                      <button
                        onClick={() => setEditingStep(step)}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(step)}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleDelete(step)}
                        className="btn-danger text-sm flex items-center gap-2"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Step Modal */}
      {(showAddModal || editingStep) && (
        <AddEditStepModal
          dayId={dayId!}
          step={editingStep}
          onClose={() => {
            setShowAddModal(false)
            setEditingStep(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingStep(null)
            queryClient.invalidateQueries({ queryKey: ['steps'] })
          }}
        />
      )}
    </div>
  )
}

interface AddEditStepModalProps {
  dayId: string
  step?: any
  onClose: () => void
  onSuccess: () => void
}

const AddEditStepModal: React.FC<AddEditStepModalProps> = ({ dayId, step, onClose, onSuccess }) => {
  const queryClient = useQueryClient()
  const [stepType, setStepType] = useState<StepType>(step?.type || 'text')
  const [formData, setFormData] = useState<any>(() => {
    if (step) {
      return {
        order: step.order || 1,
        type: step.type,
        content_json: step.content_json || {},
      }
    }
    return {
      order: 1,
      type: 'text',
      content_json: {},
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: existingSteps } = useQuery({
    queryKey: ['steps', dayId],
    queryFn: () => adminCollectionHelpers.getFullList('steps', {
      filter: `program_day = "${dayId}"`,
    }),
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminCollectionHelpers.create('steps', {
        ...data,
        program_day: dayId,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!step?.id) {
        throw new Error('Step ID is required for update')
      }
      return adminCollectionHelpers.update('steps', step.id, data)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const dataToSave = {
        ...formData,
        type: stepType,
      }

      if (step) {
        await updateMutation.mutateAsync(dataToSave)
      } else {
        const maxOrder = existingSteps?.data
          ? Math.max(...existingSteps.data.map((s: any) => s.order || 0), 0)
          : 0
        await createMutation.mutateAsync({
          ...dataToSave,
          order: maxOrder + 1,
        })
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save step:', error)
      alert(error?.error || 'Failed to save step')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepForm = () => {
    switch (stepType) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Content <span className="text-danger">*</span>
              </label>
              <textarea
                value={formData.content_json?.text || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, text: e.target.value }
                })}
                rows={8}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="Enter text content..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Image URL (optional)</label>
              <input
                type="url"
                value={formData.content_json?.image_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, image_url: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-neutral-500 mt-1">Supports: JPG, PNG, GIF, WebP</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Video URL (optional)</label>
              <input
                type="url"
                value={formData.content_json?.video_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, video_url: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://www.youtube.com/embed/VIDEO_ID or https://example.com/video.mp4"
              />
              <p className="text-xs text-neutral-500 mt-1">Supports: YouTube embed URLs, MP4, WebM, OGG</p>
            </div>
          </div>
        )

      case 'question_mcq':
        const options = formData.content_json?.options || ['', '']
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Question <span className="text-danger">*</span>
              </label>
              <textarea
                value={formData.content_json?.question || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, question: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="Enter your question..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Options <span className="text-danger">*</span>
              </label>
              {options.map((opt: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[idx] = e.target.value
                      setFormData({
                        ...formData,
                        content_json: { ...formData.content_json, options: newOptions }
                      })
                    }}
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Option ${idx + 1}`}
                    required={idx < 2}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = options.filter((_: any, i: number) => i !== idx)
                        setFormData({
                          ...formData,
                          content_json: { ...formData.content_json, options: newOptions }
                        })
                      }}
                      className="text-danger hover:text-danger/80"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      content_json: { ...formData.content_json, options: [...options, ''] }
                    })
                  }}
                  className="btn-secondary text-sm"
                >
                  + Add Option
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Correct Answer <span className="text-danger">*</span>
              </label>
              <select
                value={formData.content_json?.correct_answer ?? 0}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, correct_answer: Number(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {options.map((opt: string, idx: number) => (
                  <option key={idx} value={idx}>
                    Option {idx + 1}: {opt || '(empty)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Explanation (optional)</label>
              <textarea
                value={formData.content_json?.explanation || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, explanation: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Explanation shown after user answers..."
              />
            </div>
          </div>
        )

      case 'question_open':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Question <span className="text-danger">*</span>
              </label>
              <textarea
                value={formData.content_json?.question || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, question: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="Enter your question..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Placeholder Text</label>
              <input
                type="text"
                value={formData.content_json?.placeholder || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, placeholder: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your thoughts here..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Minimum Words</label>
                <input
                  type="number"
                  value={formData.content_json?.min_words || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    content_json: { ...formData.content_json, min_words: Number(e.target.value) }
                  })}
                  min={0}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Maximum Words</label>
                <input
                  type="number"
                  value={formData.content_json?.max_words || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    content_json: { ...formData.content_json, max_words: Number(e.target.value) }
                  })}
                  min={0}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )

      case 'exercise':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Exercise Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.content_json?.exercise_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, exercise_name: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="e.g., 5-5-5 Breathing Exercise"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Exercise Type</label>
              <select
                value={formData.content_json?.exercise_type || 'breathing'}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, exercise_type: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="breathing">Breathing Exercise</option>
                <option value="meditation">Meditation</option>
                <option value="physical">Physical Activity</option>
                <option value="reflection">Reflection</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Instructions</label>
              <textarea
                value={formData.content_json?.instructions || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, instructions: e.target.value }
                })}
                rows={6}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter exercise instructions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.content_json?.duration || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, duration: Number(e.target.value) }
                })}
                min={1}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Completion Criteria</label>
              <input
                type="text"
                value={formData.content_json?.completion_criteria || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, completion_criteria: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Complete 5 rounds"
              />
            </div>
          </div>
        )

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Video URL <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                value={formData.content_json?.video_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, video_url: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="https://www.youtube.com/embed/VIDEO_ID or https://example.com/video.mp4"
              />
              <p className="text-xs text-neutral-500 mt-1">For YouTube: Use embed URL format (https://www.youtube.com/embed/VIDEO_ID)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Title (optional)</label>
              <input
                type="text"
                value={formData.content_json?.title || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, title: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Video title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <textarea
                value={formData.content_json?.description || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, description: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Video description..."
              />
            </div>
          </div>
        )

      case 'audio':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Audio Title <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.content_json?.audio_title || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, audio_title: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="Audio title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Audio URL <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                value={formData.content_json?.audio_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, audio_url: e.target.value }
                })}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="https://example.com/audio.mp3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <textarea
                value={formData.content_json?.description || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_json: { ...formData.content_json, description: e.target.value }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Audio description..."
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">{step ? 'Edit Step' : 'Add New Step'}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Step Type <span className="text-danger">*</span>
            </label>
            <select
              value={stepType}
              onChange={(e) => {
                setStepType(e.target.value as StepType)
                setFormData({
                  ...formData,
                  type: e.target.value,
                  content_json: {},
                })
              }}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="text">Text Content</option>
              <option value="question_mcq">Multiple Choice Question</option>
              <option value="question_open">Open-Ended Question</option>
              <option value="exercise">Exercise/Activity</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {renderStepForm()}

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
              {isSubmitting ? 'Saving...' : step ? 'Update Step' : 'Create Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
