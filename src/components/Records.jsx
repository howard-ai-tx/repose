import { useState, useMemo } from 'react'
import { getContacts } from '../lib/storage.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Records({ onViewContact }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterFlag, setFilterFlag] = useState('all')

  const allContacts = getContacts()

  const filtered = useMemo(() => {
    return allContacts.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        (c.customerName || '').toLowerCase().includes(q) ||
        (c.customerMessage || '').toLowerCase().includes(q) ||
        (c.customerEmail || '').toLowerCase().includes(q)
      const matchStatus = filterStatus === 'all' || c.status === filterStatus
      const matchFlag = filterFlag === 'all' ||
        (c.flagsFired || []).some(f => f.severity === filterFlag)
      return matchSearch && matchStatus && matchFlag
    })
  }, [allContacts, search, filterStatus, filterFlag])

  return (
    <div className="records-wrap">
      <div className="page-header">
        <h1 className="page-title">Records</h1>
        <p className="page-sub">
          {allContacts.length} contact{allContacts.length !== 1 ? 's' : ''} logged
        </p>
      </div>

      <div className="records-controls">
        <div className="search-input-wrap">
          <i className="ti ti-search" aria-hidden="true" />
          <input
            className="search-input"
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search contacts"
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 140 }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="forwarded">Forwarded</option>
          <option value="draft">Draft</option>
        </select>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 140 }}
          value={filterFlag}
          onChange={e => setFilterFlag(e.target.value)}
          aria-label="Filter by flag"
        >
          <option value="all">All flags</option>
          <option value="hard-caution">Hard Caution</option>
          <option value="caution">Caution</option>
          <option value="notice">Notice</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-search empty-icon" aria-hidden="true" />
          <div className="empty-title">
            {search || filterStatus !== 'all' || filterFlag !== 'all'
              ? 'No results found.'
              : 'No contacts yet.'}
          </div>
          <div className="empty-body">
            {search || filterStatus !== 'all' || filterFlag !== 'all'
              ? 'Try a different search term or clear your filters.'
              : 'Contacts appear here once they\'ve been logged.'}
          </div>
        </div>
      ) : (
        filtered.map(c => (
          <div
            key={c.id}
            className="contact-row"
            onClick={() => onViewContact(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onViewContact(c.id)}
          >
            <div className="contact-row-info flex-1 min-w-0">
              <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                <div className="contact-name">{c.customerName || 'Unknown'}</div>
                {c.customerEmail && (
                  <span className="text-caption text-secondary">· {c.customerEmail}</span>
                )}
              </div>
              <div className="contact-preview">{c.customerMessage?.slice(0, 110) || '—'}</div>
              {(c.flagsFired || []).length > 0 && (
                <div className="flag-chips">
                  {c.flagsFired.slice(0, 4).map((f, i) => (
                    <span key={i} className={`flag-chip ${f.severity}`}>
                      {f.severity === 'hard-caution' ? 'HC' : f.severity === 'caution' ? 'C' : 'N'} — {f.name}
                    </span>
                  ))}
                  {c.flagsFired.length > 4 && (
                    <span className="flag-chip notice">+{c.flagsFired.length - 4}</span>
                  )}
                </div>
              )}
            </div>
            <div className="contact-row-meta">
              <div className="contact-date">{formatDate(c.createdAt)}</div>
              <div className="status-badge">
                <span className={`status-dot ${c.status}`} />
                {c.status === 'sent' ? 'Sent' : c.status === 'forwarded' ? 'Forwarded' : 'Draft'}
              </div>
              {(c.reminders || []).filter(r => !r.dismissed).length > 0 && (
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--blue)' }}>
                  <i className="ti ti-bell" aria-hidden="true" style={{ fontSize: 13, marginRight: 3 }} />
                  {(c.reminders || []).filter(r => !r.dismissed).length} reminder
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
