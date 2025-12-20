import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import GlassCard from './GlassCard'
import GlassButton from './GlassButton'
import { analyticsService } from '../services/analytics.service'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // Track error to analytics
    analyticsService.trackEvent('error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }).catch(console.error)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/home'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-text-primary/70 mb-6">
              We're sorry, but something unexpected happened. Please try again.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-text-primary/50 cursor-pointer mb-2">
                  Error details
                </summary>
                <pre className="text-xs text-text-primary/70 bg-black/20 p-3 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <GlassButton onClick={this.handleReset} fullWidth className="py-4">
              Go to Home
            </GlassButton>
          </GlassCard>
        </div>
      )
    }

    return this.props.children
  }
}

