const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

async function main() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is required in environment');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const db = admin.firestore();

  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeSecure!123';

  const hashed = await bcrypt.hash(password, 10);

  await db.collection('admins').doc(username).set(
    {
      username,
      password: hashed,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`Seeded admin user: ${username}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
