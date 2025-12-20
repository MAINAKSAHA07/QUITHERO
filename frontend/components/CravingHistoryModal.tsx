import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar } from 'lucide-react'
import { Craving } from '../types/models'
import { CravingType, CravingTrigger } from '../types/enums'

interface CravingHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  cravings: Craving[]
}

export default function CravingHistoryModal({ isOpen, onClose, cravings }: CravingHistoryModalProps) {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      [CravingTrigger.STRESS]: 'Stress',
      [CravingTrigger.BOREDOM]: 'Boredom',
      [CravingTrigger.SOCIAL]: 'Social',
      [CravingTrigger.HABIT]: 'Habit',
      [CravingTrigger.OTHER]: 'Other',
    }
    return labels[trigger] || trigger
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[80vh] overflow-hidden"
        >
          <div className="p-6 bg-white rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Craving History</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] space-y-3">
              {cravings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No cravings logged yet</p>
                </div>
              ) : (
                cravings.map((craving) => (
                  <motion.div
                    key={craving.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 border border-gray-200 p-4 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            craving.type === CravingType.SLIP
                              ? 'bg-error'
                              : 'bg-success'
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {craving.type === CravingType.SLIP ? 'Slip' : 'Craving Resisted'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(craving.created || '')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      Trigger: {getTriggerLabel(craving.trigger)}
                      {craving.trigger_custom && ` - ${craving.trigger_custom}`}
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      Intensity: {craving.intensity}/5
                    </div>
                    {craving.notes && (
                      <p className="text-sm text-gray-800 mt-2">{craving.notes}</p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

