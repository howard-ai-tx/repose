import { useState } from 'react'
import { getFlagDetails } from '../lib/parseResponse.js'
import { saveContact, getRepName } from '../lib/storage.js'

const SEVERITY_LABEL = {
  notice: 'Notice',
  caution: 'Caution',
  'hard-caution': 'Hard Caution',
}

// IDL: icons inherit context color — use semantic colors
const SEVERITY_ICON = {
  notice: 'ti-info-circle',
  caution: 'ti-alert-triangle',
  'hard-caution': 'ti-alert-circle',
}

export default function FlagScreen({ contactData, onProceedToDraft, onDone }) {
  const { flagsFired = [] } = contactData
  const hasHardCaution = flagsFired.some(f => f.severity === 'hard-caution')
  const hardCautions = flagsFired.filter(f => f.severity === 'hard-caution')
  const softFlags = flagsFired.filter(f => f.severity !== 'hard-caution')

  const [acknowledged, setAcknowledged] = useState({})
  const allSoftAcked = softFlags.length === 0 || softFlags.every((_, i) => acknowledged[i])

  function acknowledge(i) {
    setAcknowledged(prev => ({ ...prev, [i]: true }))
  }

  function handleForward(flag) {
    const details = getFlagDetails(flag)
    const forwardTo = details.forwardTo || 'is@howardai.us'
    const forwardLabel = details.forwardLabel || 'Information Services'

    const logged = {
      ...contactData,
      status: 'forwarded',
      finalResponse: `Flagged — forwarded to ${forwardLabel}`,
      repName: getRepName(),
      loggedAt: new Date().toISOString(),
    }
    saveContact(logged)

    const subj = encodeURIComponent(`[Repose Escalation] ${contactData.subject || 'Customer message'}`)
    const body = encodeURIComponent(
      `This message has been escalated via Repose.\n\nFlag: ${flag.name.toUpperCase()}\n\n---\n\nOriginal customer message:\n\n${contactData.customerMessage}`
    )
    window.location.href = `mailto:${forwardTo}?subject=${subj}&body=${body}`
    onDone()
  }

  return (
    <div className="flags-wrap">
      <button className="back-btn" onClick={onDone}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
        Dashboard
      </button>

      <div className="page-header">
        <h1 className="page-title">
          {hasHardCaution ? 'Escalation Required' : 'Flags Detected'}
        </h1>
        <p className="page-sub">
          {hasHardCaution
            ? 'One or more Hard Cautions fired. Do not reply to this message — forward it immediately.'
            : 'Acknowledge each flag below before proceeding to the draft.'}
        </p>
      </div>

      {/* Hard Cautions */}
      {hardCautions.map((flag, i) => {
        const details = getFlagDetails(flag)
        return (
          <div key={i} className="flag-alert hard-caution" role="alert">
            <i className={`ti ${SEVERITY_ICON['hard-caution']} flag-alert-icon`} aria-hidden="true" />
            <div className="flag-alert-content">
              <div className="flag-alert-type">{SEVERITY_LABEL['hard-caution']}</div>
              <div className="flag-alert-title">{flag.name}</div>
              <div className="flag-alert-body">{details.copy}</div>
              <button className="btn btn-destructive btn-sm" onClick={() => handleForward(flag)}>
                <i className="ti ti-send" aria-hidden="true" />
                {details.action}
              </button>
            </div>
          </div>
        )
      })}

      {/* Soft flags — de-emphasised when hard caution is present */}
      {softFlags.length > 0 && (
        <div style={{ opacity: hasHardCaution ? 0.45 : 1, pointerEvents: hasHardCaution ? 'none' : 'auto' }}>
          {softFlags.map((flag, i) => {
            const details = getFlagDetails(flag)
            const acked = !!acknowledged[i]
            return (
              <div key={i} className={`flag-alert ${flag.severity}${acked ? ' acknowledged' : ''}`} role="alert">
                <i className={`ti ${SEVERITY_ICON[flag.severity]} flag-alert-icon`} aria-hidden="true" />
                <div className="flag-alert-content">
                  <div className="flag-alert-type">{SEVERITY_LABEL[flag.severity]}</div>
                  <div className="flag-alert-title">{flag.name}</div>
                  <div className="flag-alert-body">{details.copy}</div>
                  {acked ? (
                    <div className="flag-acked-badge">
                      <i className="ti ti-check" aria-hidden="true" />
                      Acknowledged
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => acknowledge(i)}>
                      {details.action}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer actions */}
      {!hasHardCaution && (
        <div className="flags-footer">
          <button
            className="btn btn-primary"
            onClick={() => onProceedToDraft(contactData)}
            disabled={!allSoftAcked}
          >
            Continue to Draft
            <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
          {!allSoftAcked && (
            <span className="flags-footer-hint">
              Acknowledge all {softFlags.length} flag{softFlags.length !== 1 ? 's' : ''} to continue.
            </span>
          )}
        </div>
      )}

      {hasHardCaution && (
        <div className="flags-footer">
          <button className="btn btn-secondary" onClick={onDone}>
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  )
}
