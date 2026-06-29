import { useState } from 'react'
import { callGemini } from '../lib/gemini.js'
import { parseGeminiResponse } from '../lib/parseResponse.js'
import { getApiKey, newId } from '../lib/storage.js'

export default function NewContact({ onBack, onFlagScreen, onDraftScreen }) {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [subject, setSubject] = useState('Re: Your Howard inquiry')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Reading the message...')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!message.trim()) { setError('Paste the customer message before submitting.'); return }

    const apiKey = getApiKey()
    if (!apiKey) { setError('No API key found. Sign out and sign back in to set one.'); return }

    setLoading(true)
    setLoadingMsg('Reading the message...')

    try {
      const timer = setTimeout(() => setLoadingMsg('Assessing for flags...'), 2000)
      const raw = await callGemini(apiKey, message.trim())
      clearTimeout(timer)

      const { flags, draftRaw, hasHardCaution } = parseGeminiResponse(raw)

      const contactData = {
        id: newId(),
        customerName: customerName.trim() || 'Unknown',
        customerEmail: customerEmail.trim(),
        subject: subject.trim() || 'Re: Your Howard inquiry',
        customerMessage: message.trim(),
        flagsFired: flags,
        geminiDraft: draftRaw,
        geminiRaw: raw,
        finalResponse: '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        reminders: [],
        notes: '',
      }

      if (flags.length > 0) onFlagScreen(contactData)
      else onDraftScreen(contactData)
    } catch (err) {
      setError(err.message || 'Something went wrong. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 640 }}>
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Dashboard
        </button>
        <div className="spinner-wrap">
          <div className="spinner" role="status" aria-label={loadingMsg} />
          <div className="spinner-label">{loadingMsg}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <button className="back-btn" onClick={onBack}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
        Dashboard
      </button>

      <div className="page-header">
        <h1 className="page-title">New Contact</h1>
        <p className="page-sub">Paste the customer's message. Gemini will assess it and draft a response.</p>
      </div>

      {error && (
        <div className="login-alert error" role="alert" style={{ marginBottom: 24 }}>
          <i className="ti ti-alert-circle" aria-hidden="true" />
          <div className="login-alert-body">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row-2" style={{ marginBottom: 24 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="nc-name">Customer name</label>
            <input
              id="nc-name"
              className="form-input"
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="off"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="nc-email">Customer email</label>
            <input
              id="nc-email"
              className="form-input"
              type="email"
              value={customerEmail}
              onChange={e => setCustomerEmail(e.target.value)}
              placeholder="jane@example.com"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="nc-subject">Email subject</label>
          <input
            id="nc-subject"
            className="form-input"
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="nc-message">Customer message</label>
          <textarea
            id="nc-message"
            className="form-textarea"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={12}
            placeholder="Paste the customer's message here..."
            autoFocus
            style={{ minHeight: 240 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" type="submit">
            Submit to Gemini
            <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
          <button className="btn btn-secondary" type="button" onClick={onBack}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
