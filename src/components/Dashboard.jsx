import { useState, useEffect } from 'react'
import { getContacts, getActiveReminders, dismissReminder } from '../lib/storage.js'

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now - d) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function FlagChips({ flags = [] }) {
  if (!flags.length) return null
  const visible = flags.slice(0, 3)
  const extra = flags.length - visible.length
  return (
    <div className="flag-chips">
      {visible.map((f, i) => (
        <span key={i} className={`flag-chip ${f.severity}`}>
          {f.severity === 'hard-caution' ? 'HC' : f.severity === 'caution' ? 'C' : 'N'} — {f.name}
        </span>
      ))}
      {extra > 0 && <span className="flag-chip notice">+{extra}</span>}
    </div>
  )
}

export default function Dashboard({ repName, onNewContact, onViewContact }) {
  const [contacts, setContacts] = useState([])
  const [reminders, setReminders] = useState([])

  function refresh() {
    setContacts(getContacts().slice(0, 20))
    setReminders(getActiveReminders())
  }

  useEffect(() => { refresh() }, [])

  function handleDismiss(contactId, reminderId) {
    dismissReminder(contactId, reminderId)
    refresh()
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, {repName}.</p>
        </div>
        <button className="btn btn-primary" onClick={onNewContact}>
          <i className="ti ti-plus" aria-hidden="true" />
          New Contact
        </button>
      </div>

      {reminders.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-label">Active Reminders</div>
          {reminders.map(r => (
            <div key={r.id} className="reminder-item">
              <i className="ti ti-bell reminder-icon" aria-hidden="true" />
              <div className="reminder-item-body">
                <div className="reminder-copy">{r.copy}</div>
                <div className="reminder-meta">
                  Re: {r.customerName || 'Unknown contact'} ·{' '}
                  {r.type === 'time' && r.triggerDate
                    ? `Follow up ${formatDate(r.triggerDate)}`
                    : `Event: ${r.triggerEvent || 'when relevant'}`}
                </div>
              </div>
              <div className="reminder-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onViewContact(r.contactId)}
                >
                  View contact
                </button>
                <button
                  className="icon-btn"
                  onClick={() => handleDismiss(r.contactId, r.id)}
                  aria-label="Dismiss reminder"
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="section-label">Recent Contacts</div>
        {contacts.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-inbox empty-icon" aria-hidden="true" />
            <div className="empty-title">No contacts yet.</div>
            <div className="empty-body">
              Paste a customer message to get started. Gemini will assess it and draft a response.
            </div>
            <button className="btn btn-primary" onClick={onNewContact}>
              <i className="ti ti-plus" aria-hidden="true" />
              New Contact
            </button>
          </div>
        ) : (
          contacts.map(c => (
            <div key={c.id} className="contact-row" onClick={() => onViewContact(c.id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onViewContact(c.id)}>
              <div className="contact-row-info min-w-0 flex-1">
                <div className="contact-name">{c.customerName || 'Unknown'}</div>
                <div className="contact-preview">{c.customerMessage?.slice(0, 110) || '—'}</div>
                <FlagChips flags={c.flagsFired} />
              </div>
              <div className="contact-row-meta">
                <div className="contact-date">{formatDate(c.createdAt)}</div>
                <div className="status-badge">
                  <span className={`status-dot ${c.status}`} />
                  {c.status === 'sent' ? 'Sent' : c.status === 'forwarded' ? 'Forwarded' : 'Draft'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
