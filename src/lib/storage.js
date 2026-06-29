const KEYS = {
  credentials: 'repose_credentials',
  apiKey: 'repose_gemini_key',
  contacts: 'repose_contacts',
  session: 'repose_session',
}

// ── Credentials ──────────────────────────────────────────────────────────────

export function getCredentials() {
  const raw = localStorage.getItem(KEYS.credentials)
  if (!raw) return { username: 'howard.cs', password: 'repose2024', repName: 'CS Rep' }
  return JSON.parse(raw)
}

export function setCredentials(creds) {
  localStorage.setItem(KEYS.credentials, JSON.stringify(creds))
}

export function checkLogin(username, password) {
  const creds = getCredentials()
  return username === creds.username && password === creds.password
}

export function getRepName() {
  return getCredentials().repName || 'CS Rep'
}

// ── API Key ───────────────────────────────────────────────────────────────────

export function getApiKey() {
  return localStorage.getItem(KEYS.apiKey) || ''
}

export function setApiKey(key) {
  localStorage.setItem(KEYS.apiKey, key.trim())
}

// ── Session ───────────────────────────────────────────────────────────────────

export function isLoggedIn() {
  return sessionStorage.getItem(KEYS.session) === 'true'
}

export function setLoggedIn(val) {
  if (val) sessionStorage.setItem(KEYS.session, 'true')
  else sessionStorage.removeItem(KEYS.session)
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export function getContacts() {
  const raw = localStorage.getItem(KEYS.contacts)
  return raw ? JSON.parse(raw) : []
}

function saveContacts(contacts) {
  localStorage.setItem(KEYS.contacts, JSON.stringify(contacts))
}

export function getContact(id) {
  return getContacts().find(c => c.id === id) || null
}

export function saveContact(contact) {
  const contacts = getContacts()
  const idx = contacts.findIndex(c => c.id === contact.id)
  if (idx >= 0) contacts[idx] = contact
  else contacts.unshift(contact)
  saveContacts(contacts)
}

export function updateContact(id, updates) {
  const contacts = getContacts()
  const idx = contacts.findIndex(c => c.id === id)
  if (idx < 0) return
  contacts[idx] = { ...contacts[idx], ...updates }
  saveContacts(contacts)
  return contacts[idx]
}

export function deleteContact(id) {
  saveContacts(getContacts().filter(c => c.id !== id))
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export function getActiveReminders() {
  const now = new Date()
  const contacts = getContacts()
  const active = []
  for (const contact of contacts) {
    for (const reminder of (contact.reminders || [])) {
      if (reminder.dismissed) continue
      if (reminder.type === 'time' && reminder.triggerDate) {
        if (new Date(reminder.triggerDate) <= now) {
          active.push({ ...reminder, contactId: contact.id, customerName: contact.customerName })
        }
      } else if (reminder.type === 'event') {
        // event-based reminders are always surfaced until dismissed
        active.push({ ...reminder, contactId: contact.id, customerName: contact.customerName })
      }
    }
  }
  return active
}

export function dismissReminder(contactId, reminderId) {
  const contact = getContact(contactId)
  if (!contact) return
  contact.reminders = (contact.reminders || []).map(r =>
    r.id === reminderId ? { ...r, dismissed: true } : r
  )
  saveContact(contact)
}

export function addReminder(contactId, reminder) {
  const contact = getContact(contactId)
  if (!contact) return
  const newReminder = {
    id: crypto.randomUUID(),
    dismissed: false,
    createdAt: new Date().toISOString(),
    ...reminder,
  }
  contact.reminders = [...(contact.reminders || []), newReminder]
  saveContact(contact)
  return newReminder
}

// ── ID generation ─────────────────────────────────────────────────────────────

export function newId() {
  return crypto.randomUUID()
}
