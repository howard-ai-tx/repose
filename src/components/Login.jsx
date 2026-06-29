import { useState } from 'react'
import { checkLogin, setLoggedIn, getApiKey, setApiKey, getCredentials } from '../lib/storage.js'

export default function Login({ onLogin }) {
  const isFirstRun = !localStorage.getItem('repose_credentials')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKeyLocal] = useState(getApiKey())
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!apiKey.trim()) {
      setError('Enter your Gemini API key to continue.')
      return
    }
    if (!checkLogin(username, password)) {
      setError('Incorrect username or password.')
      return
    }

    setApiKey(apiKey.trim())
    setLoggedIn(true)
    onLogin()
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-badge">R</div>
          <div className="login-logo-text">
            <h1>Repose</h1>
            <p>Howard AI · Customer Service</p>
          </div>
        </div>

        {isFirstRun && (
          <div className="login-alert" role="alert">
            <i className="ti ti-info-circle" aria-hidden="true" />
            <div className="login-alert-body">
              <strong>First time?</strong> Default credentials are{' '}
              <code style={{ fontFamily: 'monospace', background: '#F6F6F6', padding: '1px 4px', borderRadius: 4 }}>howard.cs</code>
              {' '}/ {' '}
              <code style={{ fontFamily: 'monospace', background: '#F6F6F6', padding: '1px 4px', borderRadius: 4 }}>repose2024</code>.
              {' '}You'll also need a free Gemini API key from aistudio.google.com.
            </div>
          </div>
        )}

        {error && (
          <div className="login-alert error" role="alert">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            <div className="login-alert-body">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="howard.cs"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-apikey">Gemini API Key</label>
            <input
              id="login-apikey"
              className="form-input"
              type="password"
              value={apiKey}
              onChange={e => setApiKeyLocal(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
            />
            <div className="form-helper">Stored locally on this device. Never sent to Howard AI servers.</div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
