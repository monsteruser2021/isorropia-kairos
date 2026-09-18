import admin from 'firebase-admin';

let serviceAccount: any = undefined;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (e) {
    // If it's not JSON, maybe it's a path or already an object
    // Leave undefined and let admin init fallback handle it
    serviceAccount = undefined;
  }
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }
}

export const firestore = admin.firestore();
export default admin;
