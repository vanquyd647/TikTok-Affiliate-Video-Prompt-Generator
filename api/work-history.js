import { getMongoClient } from './_lib/mongodb.js'

const DB_NAME = process.env.MONGODB_DB_NAME || 'aff_prompt_generator'
const COLLECTION_NAME = process.env.MONGODB_WORK_HISTORY_COLLECTION || 'work_history'

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload)
}

function toSafeString(value, maxLength = 1024) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function toSafeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const output = {}
  for (const [key, raw] of Object.entries(value)) {
    if (raw === null || raw === undefined) continue

    if (typeof raw === 'string') {
      output[key] = raw.slice(0, 500)
      continue
    }

    if (typeof raw === 'number' || typeof raw === 'boolean') {
      output[key] = raw
      continue
    }

    if (Array.isArray(raw)) {
      output[key] = raw.slice(0, 20)
      continue
    }

    if (typeof raw === 'object') {
      output[key] = JSON.parse(JSON.stringify(raw))
    }
  }

  return output
}

function toSafeDate(value) {
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
    return new Date(num)
  }

  return new Date()
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const client = await getMongoClient()
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME)

    if (req.method === 'GET') {
      const rawLimit = Number(req.query?.limit)
      const limit = Number.isFinite(rawLimit)
        ? Math.min(Math.max(Math.floor(rawLimit), 1), 100)
        : 30

      const items = await collection
        .find({}, { sort: { createdAt: -1 } })
        .limit(limit)
        .toArray()

      return sendJson(res, 200, {
        items: items.map((item) => ({
          ...item,
          _id: item._id.toString(),
        })),
        count: items.length,
      })
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const action = toSafeString(body.action, 80).toLowerCase()

    if (!action) {
      return sendJson(res, 400, { error: 'Missing action' })
    }

    const payload = {
      action,
      model: toSafeString(body.model, 120),
      contentType: toSafeString(body.contentType, 80),
      notes: toSafeString(body.notes, 2000),
      metadata: toSafeObject(body.metadata),
      createdAt: toSafeDate(body.generatedAt),
      createdAtMs: Number.isFinite(Number(body.generatedAt))
        ? Number(body.generatedAt)
        : Date.now(),
      source: 'aff-video-prompt-webapp',
    }

    const inserted = await collection.insertOne(payload)

    return sendJson(res, 201, {
      ok: true,
      id: inserted.insertedId.toString(),
    })
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unexpected server error',
    })
  }
}
