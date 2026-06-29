import { useState, useEffect } from 'react'
import { getContact, updateContact, addReminder, dismissReminder } from '../lib/storage.js'

const SEVERITY_LABEL = { notice: 'Notice', caution: 'Caution', 'hard-caution': 'Hard Caution' }

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ContactDetail({ contactId, onBack }) {
  const [contact, setContact] = useState(null)
  const [notes, setNotes] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderType, setReminderType] = useState('time')
  const [reminderCopy, setReminderCopy] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderEvent, setReminderEvent] = useState('')

  function refresh() {
    const c = getContact(contactId)
    setContact(c)
    if (c) setNotes(c.notes || '')
  }

  useEffect(() => { refresh() }, [contactId])

  if (!contact) {
    return (
      <div className="detail-wrap">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Back
        </button>
        <div className="empty-state">
          <i className="ti ti-alert-circle empty-icon" aria-hidden="true" />
          <div className="empty-title">Contact not found.</div>
          <div className="empty-body">This record may have been removed.</div>
        </div>
      </div>
    )
  }

  function saveNotes() {
    updateContact(contact.id, { notes })
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  function handleAddReminder(e) {
    e.preventDefault()
    if (!reminderCopy.trim()) return
    addReminder(contact.id, {
      type: reminderType,
      copy: reminderCopy.trim(),
      triggerDate: reminderType === 'time' ? reminderDate : undefined,
      triggerEvent: reminderType === 'event' ? reminderEvent.trim() : undefined,
    })
    setReminderCopy('')
    setReminderDate('')
    setReminderEvent('')
    setShowReminderForm(false)
    refresh()
  }

  function handleDismissReminder(reminderId) {
    dismissReminder(contact.id, reminderId)
    refresh()
  }

  const activeReminders = (contact.reminders || []).filter(r => !r.dismissed)
  const dismissedCount = (contact.reminders || []).filter(r => r.dismissed).length

  return (
    <div className="detail-wrap">
      <button className="back-btn" onClick={onBack}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
        Back
      </button>

      <div className="page-header-row">
        <div>
          <h1 className="page-title">{contact.customerName || 'Unknown'}</h1>
          <p className="page-sub">
            {contact.customerEmail && <>{contact.customerEmail} · </>}
            {formatDateTime(contact.loggedAt || contact.createdAt)}
          </p>
        </div>
        <div className="status-badge" style={{ fontSize: 14 }}>
          <span className={`status-dot ${contact.status}`} />
          {contact.status === 'sent' ? 'Sent' : contact.status === 'forwarded' ? 'Forwarded' : 'Draft'}
        </div>
      </div>

      {/* Flags */}
      {(contact.flagsFired || []).length > 0 && (
        <div className="detail-section">
          <div className="detail-section-title">Flags fired</div>
          <div className="flag-chips">
            {contact.flagsFired.map((f, i) => (
              <span key={i} className={`flag-chip ${f.severity}`}>
                {SEVERITY_LABEL[f.severity]} — {f.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Customer message */}
      <div className="detail-section">
        <div className="detail-section-title">Customer message</div>
        <div className="detail-message">{contact.customerMessage}</div>
      </div>

      {/* Response / action */}
      {contact.finalResponse && (
        <div className="detail-section">
          <div className="detail-section-title">
            {contact.status === 'forwarded' ? 'Action taken' : 'Response sent'}
          </div>
          <div className="detail-response">{contact.finalResponse}</div>
        </div>
      )}

      {/* Gemini draft — collapsible */}
      {contact.geminiDraft && contact.status !== 'forwarded' && (
        <div className="detail-section">
          <details>
            <summary>
              <span className="detail-section-title" style={{ margin: 0 }}>Gemini draft</span>
              <span className="flag-chip notice" style={{ marginLeft: 8, cursor: 'pointer' }}>Expand</span>
            </summary>
            <div className="detail-message" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {contact.geminiDraft}
            </div>
          </details>
        </div>
      )}

      {/* Internal notes */}
      <div className="detail-section">
        <div className="detail-section-header">
          <div className="detail-section-title">Internal notes</div>
          <button className="btn btn-secondary btn-sm" onClick={saveNotes}>
            {notesSaved ? (
              <><i className="ti ti-check" aria-hidden="true" /> Saved</>
            ) : (
              'Save notes'
            )}
          </button>
        </div>
        <textarea
          className="notes-area"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add internal notes about this contact..."
          aria-label="Internal notes"
        />
      </div>

      {/* Reminders */}
      <div className="detail-section">
        <div className="detail-section-header">
          <div className="detail-section-title">
            Reminders {activeReminders.length > 0 && `(${activeReminders.length})`}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowReminderForm(v => !v)}>
            <i className="ti ti-plus" aria-hidden="true" />
            Add reminder
          </button>
        </div>

        {activeReminders.length === 0 && !showReminderForm && (
          <div className="text-caption text-secondary">No active reminders on this contact.</div>
        )}

        {activeReminders.map(r => (
          <div key={r.id} className="reminder-item">
            <i className="ti ti-bell reminder-icon" aria-hidden="true" />
            <div className="reminder-item-body">
              <div className="reminder-copy">{r.copy}</div>
              <div className="reminder-meta">
                {r.type === 'time' && r.triggerDate
                  ? `Follow up ${formatDateShort(r.triggerDate)}`
                  : `Event: ${r.triggerEvent || 'when relevant'}`}
              </div>
            </div>
            <button
              className="icon-btn"
              onClick={() => handleDismissReminder(r.id)}
              aria-label="Dismiss reminder"
            >
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>
        ))}

        {dismissedCount > 0 && (
          <div className="text-caption text-secondary mt-2">
            {dismissedCount} dismissed reminder{dismissedCount !== 1 ? 's' : ''} not shown.
          </div>
        )}

        {showReminderForm && (
          <form className="reminder-form" onSubmit={handleAddReminder}>
            <div className="reminder-type-toggle">
              <button
                type="button"
                className={`toggle-btn${reminderType === 'time' ? ' active' : ''}`}
                onClick={() => setReminderType('time')}
              >
                Time-based
              </button>
              <button
                type="button"
                className={`toggle-btn${reminderType === 'event' ? ' active' : ''}`}
                onClick={() => setReminderType('event')}
              >
                Event-based
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rem-copy">Reminder copy</label>
              <textarea
                id="rem-copy"
                className="form-textarea"
                rows={2}
                style={{ minHeight: 80 }}
                value={reminderCopy}
                onChange={e => setReminderCopy(e.target.value)}
                placeholder="e.g. Follow up with Jane — she was interested in Howard Pro when it launches."
                required
              />
            </div>

            {reminderType === 'time' ? (
              <div className="form-group">
                <label className="form-label" htmlFor="rem-date">Follow-up date</label>
                <input
                  id="rem-date"
                  className="form-input"
                  type="date"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="rem-event">Trigger event</label>
                <input
                  id="rem-event"
                  className="form-input"
                  type="text"
                  value={reminderEvent}
                  onChange={e => setReminderEvent(e.target.value)}
                  placeholder="e.g. Howard Pro launch"
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary btn-sm" type="submit">
                <i className="ti ti-check" aria-hidden="true" />
                Save reminder
              </button>
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => setShowReminderForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
