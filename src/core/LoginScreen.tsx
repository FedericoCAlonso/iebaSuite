import { useState } from 'react'
import { useAuth } from './AuthContext'
import './LoginScreen.css'

export function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
      } else {
        await registerWithEmail(email, password)
      }
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (e: any) {
      setError(e.message ?? 'Error con Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">⚡</span>
          <h1 className="login-title">ieBA Suite</h1>
          <p className="login-subtitle">Herramientas para instalaciones eléctricas</p>
        </div>

        <div className="login-fields">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            className="btn btn-acc btn-full"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
          >
            {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Registrarse'}
          </button>

          <button
            className="btn btn-ghost btn-full login-google"
            onClick={handleGoogle}
            disabled={loading}
          >
            <span>🔑</span>
            Continuar con Google
          </button>
        </div>

        <p className="login-toggle">
          {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
          {' '}
          <button
            className="login-toggle-btn"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Registrarse' : 'Ingresar'}
          </button>
        </p>
      </div>
    </div>
  )
}
