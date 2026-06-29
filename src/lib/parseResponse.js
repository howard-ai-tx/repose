// Flag severity ordering
const SEVERITY_ORDER = { 'hard-caution': 0, caution: 1, notice: 2 }

export function parseGeminiResponse(responseText) {
  const flagsMatch = responseText.match(/\[FLAGS\]([\s\S]*?)(?=\[DRAFT\]|$)/)
  const draftMatch = responseText.match(/\[DRAFT\]([\s\S]*)$/)

  const flagsRaw = flagsMatch ? flagsMatch[1].trim() : ''
  const draftRaw = draftMatch ? draftMatch[1].trim() : ''

  const flags = parseFlags(flagsRaw)
  const hasHardCaution = flags.some(f => f.severity === 'hard-caution')

  return { flags, draftRaw, hasHardCaution }
}

function parseFlags(text) {
  if (!text || text.toLowerCase() === 'no flags.' || text.toLowerCase() === 'no flags') {
    return []
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const flags = []

  for (const line of lines) {
    const upper = line.toUpperCase()
    let severity = null
    let name = line

    if (upper.startsWith('HARD CAUTION')) {
      severity = 'hard-caution'
      // Extract just the flag name after the dash
      const m = line.match(/HARD CAUTION\s*[—–-]\s*(.+)/i)
      name = m ? m[1].trim() : line
    } else if (upper.startsWith('CAUTION')) {
      severity = 'caution'
      const m = line.match(/CAUTION\s*[—–-]\s*(.+)/i)
      name = m ? m[1].trim() : line
    } else if (upper.startsWith('NOTICE')) {
      severity = 'notice'
      const m = line.match(/NOTICE\s*[—–-]\s*(.+)/i)
      name = m ? m[1].trim() : line
    } else {
      continue // skip unrecognized lines
    }

    flags.push({ severity, name, raw: line })
  }

  // Sort: hard-caution → caution → notice
  flags.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  return flags
}

// Map flag name to full warning copy and action metadata
const FLAG_DETAILS = {
  // Notices
  'organizational member': {
    copy: 'This message appears to be from a representative of an organization or company. Consider the professional context when personalizing your response.',
    action: 'Proceed',
  },
  'formal tone': {
    copy: 'This message is written in a formal tone. Match that register in your response.',
    action: 'Proceed',
  },
  'casual tone': {
    copy: 'This message is written in a casual tone. Feel free to match that warmth in your response.',
    action: 'Proceed',
  },
  'excited tone': {
    copy: "This message is enthusiastic. Match their energy genuinely without overselling.",
    action: 'Proceed',
  },
  'hesitant tone': {
    copy: 'This message carries hesitation or uncertainty. Acknowledge it honestly before addressing their question.',
    action: 'Proceed',
  },
  'outside knowledge library': {
    copy: 'This message contains questions Repose could not find sufficient information to address. Do not speculate. If you are unsure how to respond, please contact Information Services at is@howardai.us.',
    action: 'Proceed',
  },
  'technical support issue': {
    copy: 'This message contains a technical support request outside the scope of customer service. Please forward this to the appropriate support contact internally and follow up with the customer directly.',
    action: 'Proceed',
  },
  // Cautions
  'ip sensitivity': {
    copy: 'This message contains signals that may indicate IP sensitivity. Avoid sharing technical architecture details, internal documentation, or unconfirmed company information in your response. If you feel hesitant about responding, please contact Information Services at is@howardai.us.',
    action: 'I Understand',
  },
  'organizational purchasing intent': {
    copy: 'This message contains signals indicating the sender may be evaluating Howard on behalf of an organization. This conversation may require involvement from our sales team. If you feel this is beyond the scope of a standard customer inquiry, please forward it to our sales team at sales@howardai.us.',
    action: 'I Understand',
  },
  'spam or scam': {
    copy: 'This message contains signals consistent with spam or a scam attempt. Respond with caution and avoid sharing any company or personal information. If you feel hesitant about responding, please contact Information Services at is@howardai.us.',
    action: 'I Understand',
  },
  'psychological manipulation': {
    copy: 'This message contains urgency language or pressure tactics such as "immediate," "final notice," or similar phrasing. Do not let that language influence your response. If you feel hesitant about responding, please contact Information Services at is@howardai.us.',
    action: 'I Understand',
  },
  // Hard Cautions
  'ip exposure': {
    copy: 'This message contains multiple signals indicating a heightened risk of IP exposure. Please forward it to is@howardai.us and do not reply.',
    action: 'Forward to Information Services',
    forwardTo: 'is@howardai.us',
    forwardLabel: 'Information Services',
  },
  'criminal activity': {
    copy: 'This message contains signals indicating potentially criminal intent or activity. Please forward it to is@howardai.us and do not reply.',
    action: 'Forward to Information Services',
    forwardTo: 'is@howardai.us',
    forwardLabel: 'Information Services',
  },
  phishing: {
    copy: 'This message contains signals consistent with a phishing attempt. Do not click any links, open any attachments, or share any information. Please forward it to is@howardai.us and do not reply.',
    action: 'Forward to Information Services',
    forwardTo: 'is@howardai.us',
    forwardLabel: 'Information Services',
  },
  'unsolicited attachment or malicious link': {
    copy: 'This message contains an unsolicited attachment or a suspicious link. Do not open either under any circumstances. Please forward it to is@howardai.us and do not reply.',
    action: 'Forward to Information Services',
    forwardTo: 'is@howardai.us',
    forwardLabel: 'Information Services',
  },
  'request for sensitive credentials or access': {
    copy: 'This message contains a request for credentials, account access, or sensitive authentication information that does not belong to the sender. Please forward it to is@howardai.us and do not reply.',
    action: 'Forward to Information Services',
    forwardTo: 'is@howardai.us',
    forwardLabel: 'Information Services',
  },
  'request for pii or bulk data': {
    copy: 'This message contains a request for personally identifiable information or bulk customer data. Please forward it to is@howardai.us and do not reply.',
    action: 'Forward to Information Services',
    forwardTo: 'is@howardai.us',
    forwardLabel: 'Information Services',
  },
  'unsolicited legal or regulatory threat': {
    copy: 'This message contains a legal or regulatory threat. Please forward it to legal@howardai.us and do not reply.',
    action: 'Forward to Legal',
    forwardTo: 'legal@howardai.us',
    forwardLabel: 'Legal',
  },
}

export function getFlagDetails(flag) {
  const key = flag.name.toLowerCase()
  // Try exact match first, then partial match
  if (FLAG_DETAILS[key]) return FLAG_DETAILS[key]
  for (const [k, v] of Object.entries(FLAG_DETAILS)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  // Fallback
  if (flag.severity === 'hard-caution') {
    return {
      copy: 'This message requires escalation. Please forward it to the appropriate team and do not reply.',
      action: 'Forward to Information Services',
      forwardTo: 'is@howardai.us',
      forwardLabel: 'Information Services',
    }
  }
  return {
    copy: 'Review this message carefully before responding.',
    action: flag.severity === 'caution' ? 'I Understand' : 'Proceed',
  }
}

// Parse draft text into segments for the editor
export function parseDraftSegments(draftText) {
  if (!draftText) return []
  const segments = []
  const pattern = /\[PERSONALIZE:\s*([\s\S]*?)\]/g
  let lastIndex = 0
  let match
  let zoneIndex = 0

  while ((match = pattern.exec(draftText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: draftText.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'zone', instruction: match[1].trim(), id: zoneIndex++ })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < draftText.length) {
    segments.push({ type: 'text', content: draftText.slice(lastIndex) })
  }

  return segments
}

export function assembleDraft(segments, zoneValues) {
  return segments
    .map(seg => {
      if (seg.type === 'text') return seg.content
      return zoneValues[seg.id] || `[PERSONALIZE: ${seg.instruction}]`
    })
    .join('')
}
