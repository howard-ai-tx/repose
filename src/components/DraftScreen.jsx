import { useState, useMemo } from 'react'
import { parseDraftSegments, assembleDraft } from '../lib/parseResponse.js'
import { saveContact, getRepName } from '../lib/storage.js'

export default function DraftScreen({ contactData, onDone, onViewContact }) {
  const repName = getRepName()
  const segments = useMemo(() => parseDraftSegments(contactData.geminiDraft), [contactData.geminiDraft])
  const zones = segments.filter(s => s.type === 'zone')
  const zoneCount = zones.length

  const [zoneValues, setZoneValues] = useState({})
  const [mailtoFired, setMailtoFired] = useState(false)

  const assembledDraft = useMemo(() => assembleDraft(segments, zoneValues), [segments, zoneValues])
  const filledCount = zones.filter(z => (zoneValues[z.id] || '').trim().length > 0).length

  function setZone(id, val) {
    setZoneValues(prev => ({ ...prev, [id]: val }))
  }

  function handleOpenMail() {
    const to = contactData.customerEmail || ''
    const subject = encodeURIComponent(contactData.subject || 'Re: Your Howard inquiry')
    const body = encodeURIComponent(assembledDraft)
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
    setMailtoFired(true)
  }

  function handleMarkSent() {
    const logged = {
      ...contactData,
      finalResponse: assembledDraft,
      status: 'sent',
      repName,
      loggedAt: new Date().toISOString(),
    }
    saveContact(logged)
    onViewContact(logged.id)
  }

  // Render editor panel segments
  function renderEditor() {
    return segments.map((seg, i) => {
      if (seg.type === 'text') {
        return <span key={i} className="draft-text">{seg.content}</span>
      }
      return (
        <div key={i} className="personalize-zone">
          <div className="personalize-label">
            <i className="ti ti-pencil" aria-hidden="true" style={{ fontSize: 13, marginRight: 4 }} />
            Personalize
          </div>
          <div className="personalize-instruction">{seg.instruction}</div>
          <textarea
            className="personalize-textarea"
            value={zoneValues[seg.id] || ''}
            onChange={e => setZone(seg.id, e.target.value)}
            placeholder="Write your personalized content here..."
            rows={3}
            aria-label={`Personalization zone: ${seg.instruction}`}
          />
        </div>
      )
    })
  }

  // Render live preview
  function renderPreview() {
    return segments.map((seg, i) => {
      if (seg.type === 'text') {
        return <span key={i} className="draft-text">{seg.content}</span>
      }
      const val = (zoneValues[seg.id] || '').trim()
      if (val) return <span key={i} className="draft-text">{val}</span>
      return <span key={i} className="preview-zone-placeholder">[{seg.instruction}]</span>
    })
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Draft Response</h1>
          <p className="page-sub">
            Re: {contactData.customerName || 'Unknown'}
            {zoneCount > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--text-placeholder)' }}>
                {filledCount}/{zoneCount} zone{zoneCount !== 1 ? 's' : ''} filled
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onDone}>
          Cancel
        </button>
      </div>

      <div className="draft-layout">
        {/* Editor */}
        <div className="draft-panel">
          <div className="draft-panel-header">
            <span className="draft-panel-title">Gemini Draft — Fill In Zones</span>
            {zoneCount > 0 && (
              <span className="draft-zone-count">{zoneCount} zone{zoneCount !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="draft-panel-body">
            {renderEditor()}
          </div>
          <div className="draft-panel-footer">
            <button className="btn btn-primary" onClick={handleOpenMail}>
              <i className="ti ti-mail" aria-hidden="true" />
              Open in Mail
            </button>
            <button className="btn btn-secondary" onClick={onDone}>
              Cancel
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="draft-panel">
          <div className="draft-panel-header">
            <span className="draft-panel-title">Live Preview</span>
          </div>
          <div className="draft-panel-body">
            {renderPreview()}
          </div>
          {mailtoFired && (
            <div className="draft-panel-footer">
              <button className="btn btn-primary" onClick={handleMarkSent}>
                <i className="ti ti-check" aria-hidden="true" />
                Mark as Sent — Log Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {mailtoFired && (
        <div className="sent-confirm-alert" role="alert">
          <i className="ti ti-mail-forward" aria-hidden="true" />
          <div className="sent-confirm-text">
            <strong>Email opened in your mail client.</strong> Once you've sent it, click{' '}
            <em>Mark as Sent</em> above to log this contact.
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleMarkSent}>
            <i className="ti ti-check" aria-hidden="true" />
            Mark as Sent
          </button>
        </div>
      )}
    </div>
  )
}
