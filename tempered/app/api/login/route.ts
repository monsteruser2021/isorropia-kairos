import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const TOKEN_NAME = 'tempered_token';

function initFirebaseClient() {
  if (!getApps().length) {
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // 1) Try environment variables first
    const envUser = process.env.SEED_ADMIN_USERNAME;
    const envPass = process.env.SEED_ADMIN_PASSWORD;
    let valid = false;

    if (envUser && envPass) {
      valid = username === envUser && password === envPass;
    }

    // 2) If not valid, try Firestore `users` collection using client SDK
    if (!valid && process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const db = initFirebaseClient();
      const snap = await getDoc(doc(db, 'users', username));
      if (snap.exists()) {
        const data = snap.data();
        const stored = data.password;
        if (typeof stored === 'string') {
          if (stored.startsWith('$2')) {
            valid = await bcrypt.compare(password, stored);
          } else {
            valid = password === stored;
          }
        }
      }
    }

    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const token = jwt.sign({ sub: username }, secret, { expiresIn: '4h' });

    const serialized = cookie.serialize(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4,
      path: '/',
    });

    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', serialized);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
