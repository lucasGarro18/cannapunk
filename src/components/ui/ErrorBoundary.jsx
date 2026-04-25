import { Component } from 'react'
import { RiAlertLine } from 'react-icons/ri'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <RiAlertLine size={28} className="text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-lg">Algo salió mal</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Ocurrió un error inesperado. Recargá la página para continuar.
          </p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary text-sm py-2.5 px-6">
          Recargar
        </button>
        {import.meta.env.DEV && this.state.error && (
          <pre className="text-left text-xs text-red-400 bg-black/40 rounded-xl p-4 max-w-lg overflow-x-auto mt-2">
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    )
  }
}
