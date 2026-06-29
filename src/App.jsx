import { useState } from 'react'
import { isLoggedIn, setLoggedIn, getRepName } from './lib/storage.js'
import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'
import NewContact from './components/NewContact.jsx'
import FlagScreen from './components/FlagScreen.jsx'
import DraftScreen from './components/DraftScreen.jsx'
import Records from './components/Records.jsx'
import ContactDetail from './components/ContactDetail.jsx'

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn())
  const [nav, setNav] = useState('dashboard')
  const [flow, setFlow] = useState(null)
  const [pendingContact, setPendingContact] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function refresh() { setRefreshKey(k => k + 1) }

  function handleLogin() { setAuthed(true) }

  function handleSignOut() {
    setLoggedIn(false)
    setAuthed(false)
    setFlow(null)
  }

  function goToDashboard() {
    setFlow(null)
    setNav('dashboard')
    refresh()
  }

  function handleFlagScreen(contactData) {
    setPendingContact(contactData)
    setFlow('flags')
  }

  function handleDraftScreen(contactData) {
    setPendingContact(contactData)
    setFlow('draft')
  }

  function handleViewContact(id) {
    setDetailId(id)
    setFlow('contact-detail')
    refresh()
  }

  if (!authed) return <Login onLogin={handleLogin} />

  const repName = getRepName()
  const activeNav = flow ? null : nav

  let mainContent
  if (flow === 'new-contact') {
    mainContent = (
      <NewContact
        onBack={goToDashboard}
        onFlagScreen={handleFlagScreen}
        onDraftScreen={handleDraftScreen}
      />
    )
  } else if (flow === 'flags' && pendingContact) {
    mainContent = (
      <FlagScreen
        contactData={pendingContact}
        onProceedToDraft={data => { setPendingContact(data); setFlow('draft') }}
        onDone={goToDashboard}
      />
    )
  } else if (flow === 'draft' && pendingContact) {
    mainContent = (
      <DraftScreen
        contactData={pendingContact}
        onDone={goToDashboard}
        onViewContact={handleViewContact}
      />
    )
  } else if (flow === 'contact-detail' && detailId) {
    mainContent = (
      <ContactDetail
        key={detailId}
        contactId={detailId}
        onBack={() => { setFlow(null); refresh() }}
      />
    )
  } else if (nav === 'records') {
    mainContent = <Records key={refreshKey} onViewContact={handleViewContact} />
  } else {
    mainContent = (
      <Dashboard
        key={refreshKey}
        repName={repName}
        onNewContact={() => setFlow('new-contact')}
        onViewContact={handleViewContact}
      />
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">R</div>
          <div>
            <div className="sidebar-logo-name">Repose</div>
            <div className="sidebar-logo-sub">Howard AI · CS</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item${activeNav === 'dashboard' ? ' active' : ''}`}
            onClick={goToDashboard}
          >
            <i className="ti ti-layout-dashboard" aria-hidden="true" />
            Dashboard
          </button>
          <button
            className={`nav-item${activeNav === 'records' ? ' active' : ''}`}
            onClick={() => { setFlow(null); setNav('records'); refresh() }}
          >
            <i className="ti ti-archive" aria-hidden="true" />
            Records
          </button>

          <div className="sidebar-divider" />

          <button
            className="nav-item"
            onClick={() => setFlow('new-contact')}
          >
            <i className="ti ti-plus" aria-hidden="true" />
            New Contact
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="rep-name">{repName}</div>
          <div className="rep-role">Customer Service</div>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        {mainContent}
      </main>
    </div>
  )
}
