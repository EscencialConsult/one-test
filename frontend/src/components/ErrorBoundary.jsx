import { Component } from 'react'

// Evita que un error de render deje la pantalla en blanco: muestra un fallback.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary capturó:', error, info)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback
        ? this.props.fallback(this.state.error)
        : <div className="card pad">⚠️ Ocurrió un error: {String(this.state.error?.message || this.state.error)}</div>
    }
    return this.props.children
  }
}
