import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore/lite';

// Same config as src/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBv8B6FN4aByCoNni6kgeD5KeAb5t3Ahnk",
  authDomain: "michaelstars-6b4a4.firebaseapp.com",
  databaseURL: "https://michaelstars-6b4a4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "michaelstars-6b4a4",
  storageBucket: "michaelstars-6b4a4.firebasestorage.app",
  messagingSenderId: "692375492891",
  appId: "1:692375492891:web:e7540999cf6ba10d311bbe",
  measurementId: "G-8QNTDLLS6V",
};

const TEST_EMAIL = 'test@michaelstars.dev';
const TEST_PASSWORD = 'test1234';
const PARENT_PIN = '1234';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function getYesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hebrewDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('he-IL', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getOrCreateUser(): Promise<string> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log('✅ Created new test user');
    return cred.user.uid;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log('✅ Signed into existing test user');
      return cred.user.uid;
    }
    throw err;
  }
}

async function seedChildren(uid: string) {
  const michaelRef = doc(db, 'users', uid, 'children', 'test_child_michael');
  const noaRef = doc(db, 'users', uid, 'children', 'test_child_noa');

  // Child 1: מיכאל — 4 stars, rich history, custom costs
  await setDoc(michaelRef, {
    childName: 'מיכאל',
    password: PARENT_PIN,
    selectedRewards: ['candy', 'stickers', 'pizza', 'screen', 'movie', 'toy'],
    customCosts: { movie: 5 },
    stars: 4,
    history: [
      { name: 'ממתקים', emoji: '🍬', date: hebrewDate(3) },
      { name: 'מדבקות', emoji: '🌟', date: hebrewDate(7) },
    ],
    starHistory: [
      { action: 'add', date: hebrewDate(1), approver: 'אמא' },
      { action: 'add', date: hebrewDate(2), approver: 'אבא' },
      { action: 'remove', date: hebrewDate(3), approver: 'אמא' },
      { action: 'add', date: hebrewDate(4), approver: 'אבא' },
      { action: 'add', date: hebrewDate(5), approver: 'אמא' },
      { action: 'add', date: hebrewDate(6), approver: 'הורה (לוח)' },
    ],
    lastStarDate: getYesterdayDateStr(),
  });
  console.log('  ⭐ מיכאל — 4 stars, 2 reward history, 6 star history entries');

  // Child 2: נועה — empty state, minimal config
  await setDoc(noaRef, {
    childName: 'נועה',
    password: PARENT_PIN,
    selectedRewards: ['candy', 'stickers'],
    customCosts: null,
    stars: 0,
    history: [],
    starHistory: [],
    lastStarDate: null,
  });
  console.log('  ⭐ נועה — 0 stars, empty history');
}

async function main() {
  console.log('🌱 Seeding test user...\n');

  const uid = await getOrCreateUser();
  console.log(`   UID: ${uid}\n`);

  console.log('📝 Writing child documents...');
  await seedChildren(uid);

  console.log('\n✅ Done! Test credentials:');
  console.log(`   Email:      ${TEST_EMAIL}`);
  console.log(`   Password:   ${TEST_PASSWORD}`);
  console.log(`   Parent PIN: ${PARENT_PIN}`);
  console.log('\n   Children: מיכאל (test_child_michael), נועה (test_child_noa)');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
