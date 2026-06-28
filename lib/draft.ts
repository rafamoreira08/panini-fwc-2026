import { QuantityMap } from './types'

interface Draft {
  uid: string
  savedAt: number
  baseline: QuantityMap
  quantities: QuantityMap
}

function draftKey(uid: string): string {
  return `panini-draft-${uid}`
}

export function saveDraft(uid: string, baseline: QuantityMap, quantities: QuantityMap) {
  const draft: Draft = { uid, savedAt: Date.now(), baseline, quantities }
  try {
    localStorage.setItem(draftKey(uid), JSON.stringify(draft))
  } catch {
    // ignore (e.g. storage quota/disabled)
  }
}

export function clearDraft(uid: string) {
  try {
    localStorage.removeItem(draftKey(uid))
  } catch {
    // ignore
  }
}

/**
 * Merges a locally-saved draft into the server's current quantities.
 * Only applies a draft value for a sticker if the server's value still
 * matches the draft's recorded baseline for that sticker — otherwise the
 * server has moved on (e.g. edited from another device) and we keep it.
 */
export function mergeDraft(
  uid: string,
  serverQuantities: QuantityMap
): { merged: QuantityMap; restoredCount: number } {
  let draft: Draft | null = null
  try {
    const raw = localStorage.getItem(draftKey(uid))
    draft = raw ? JSON.parse(raw) : null
  } catch {
    draft = null
  }

  if (!draft || draft.uid !== uid) {
    return { merged: serverQuantities, restoredCount: 0 }
  }

  const merged = { ...serverQuantities }
  let restoredCount = 0

  for (const id of Object.keys(draft.quantities)) {
    const draftQty = draft.quantities[id] ?? 0
    const draftBaseline = draft.baseline[id] ?? 0
    const serverQty = serverQuantities[id] ?? 0

    if (draftQty === serverQty) continue
    if (draftBaseline !== serverQty) continue // server moved on, trust it

    merged[id] = draftQty
    restoredCount++
  }

  return { merged, restoredCount }
}
