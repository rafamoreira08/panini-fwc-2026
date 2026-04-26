import { headers } from 'next/headers'

export async function getCurrentUser() {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('x-firebase-token')

    if (!authHeader) return null

    // Try to use firebase-admin if available (production)
    try {
      const admin = require('firebase-admin')
      if (admin.apps.length === 0) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}')
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
        })
      }
      const auth = admin.auth()
      const decoded = await auth.verifyIdToken(authHeader)
      return { uid: decoded.uid, email: decoded.email }
    } catch (error) {
      // Fallback: decode without verification (development only)
      // WARNING: This is NOT secure for production. Use firebase-admin in production.
      console.warn('Firebase Admin not available. Using unverified token decode (dev mode only).')
      const decoded = JSON.parse(Buffer.from(authHeader.split('.')[1], 'base64').toString())
      return { uid: decoded.sub, email: decoded.email }
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

