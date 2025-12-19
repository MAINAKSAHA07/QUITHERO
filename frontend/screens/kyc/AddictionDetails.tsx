import { useState } from 'react'
import { Cigarette, Wind, Package, Check } from 'lucide-react'
import TopNavigation from '../../components/TopNavigation'
import GlassCard from '../../components/GlassCard'
import GlassButton from '../../components/GlassButton'
import GlassInput from '../../components/GlassInput'

interface AddictionDetailsProps {
  step: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

const products = [
  { id: 'cigarettes', label: 'Cigarettes', icon: Cigarette },
  { id: 'vaping', label: 'Vaping', icon: Wind },
  { id: 'chewing', label: 'Chewing Tobacco', icon: Package },
  { id: 'other', label: 'Other', icon: Package },
]

export default function AddictionDetails({ step, totalSteps, onNext, onBack }: AddictionDetailsProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [duration, setDuration] = useState('')
  const [amount, setAmount] = useState('')

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <>
      <TopNavigation left="back" center={`Step ${step}/${totalSteps}`} right="" />
      
      <div className="max-w-md mx-auto px-4 pt-8">
        <div className="mb-8">
          <div className="flex gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i + 1 <= step ? 'bg-brand-primary' : 'bg-text-primary/20'
                }`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Help us understand your journey
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              What are you trying to quit?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => {
                const Icon = product.icon
                const isSelected = selectedProducts.includes(product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`glass p-4 rounded-xl relative transition-all ${
                      isSelected ? 'ring-2 ring-brand-primary shadow-glow' : ''
                    }`}
                  >
                    <Icon className="w-8 h-8 text-brand-primary mb-2" />
                    <div className="text-sm font-medium text-text-primary">{product.label}</div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <GlassCard className="p-6 space-y-4">
            <GlassInput
              type="text"
              label="How long have you been using?"
              placeholder="e.g., 5 years"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <GlassInput
              type="text"
              label="How much per day?"
              placeholder="e.g., 10 cigarettes"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </GlassCard>
        </div>

        {error && (
          <p className="mt-4 text-sm text-error text-center">{error}</p>
        )}

        <div className="flex gap-3 mt-8 w-full">
          <GlassButton variant="secondary" onClick={onBack} className="flex-1 py-4 min-w-0" disabled={loading}>
            Back
          </GlassButton>
          <GlassButton
            onClick={handleContinue}
            disabled={selectedProducts.length === 0 || loading}
            className="flex-1 py-4 min-w-0"
          >
            {loading ? 'Saving...' : 'Continue'}
          </GlassButton>
        </div>
      </div>
    </>
  )
}

