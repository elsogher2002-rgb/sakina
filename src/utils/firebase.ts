import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  AdPlacementOption,
  AdRequestItem,
  AdRequestStatus,
  PublishedAdItem,
} from '../types';

export const DEVELOPER_EMAIL = 'hamomostafa573@gmail.com';

const app = initializeApp(firebaseConfig);

function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot (runs only when online)
async function testConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function isVerifiedDeveloper(user: User | null): boolean {
  return Boolean(
    user &&
      user.email &&
      user.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase() &&
      user.emailVerified
  );
}

export function subscribeAuthState(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function signInDeveloperWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    login_hint: DEVELOPER_EMAIL,
    prompt: 'select_account',
  });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutDeveloper(): Promise<void> {
  await signOut(auth);
}

function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function timestampToMs(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  return Date.now();
}

export interface SubmitAdRequestInput {
  senderName: string;
  contactInfo: string;
  adTitle: string;
  adLink: string;
  message: string;
  placement: AdPlacementOption;
}

export async function submitAdRequest(input: SubmitAdRequestInput): Promise<void> {
  const senderName = input.senderName.trim().slice(0, 80);
  const contactInfo = input.contactInfo.trim().slice(0, 120);
  const adTitle = input.adTitle.trim().slice(0, 120);
  const rawLink = input.adLink.trim().slice(0, 300);
  const message = input.message.trim().slice(0, 1500);

  if (senderName.length < 2) throw new Error('من فضلك اكتب اسمك (حرفان على الأقل)');
  if (contactInfo.length < 4) throw new Error('من فضلك اكتب حساب تيليجرام أو بريد إلكتروني صحيح');
  if (adTitle.length < 3) throw new Error('من فضلك اكتب عنوان الإعلان أو الموضوع');
  if (message.length < 5) throw new Error('من فضلك اكتب تفاصيل الرسالة أو الإعلان');

  let normalizedLink = '';
  if (rawLink.length > 0) {
    normalizedLink = /^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`;
    if (normalizedLink.length > 300) {
      normalizedLink = normalizedLink.slice(0, 300);
    }
  }

  const id = generateSafeId('req');
  const path = `ad_requests/${id}`;
  try {
    await setDoc(doc(db, 'ad_requests', id), {
      senderName,
      contactInfo,
      adTitle,
      adLink: normalizedLink,
      message,
      placement: input.placement,
      status: 'new',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeAdRequestsForDeveloper(
  onData: (items: AdRequestItem[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'ad_requests';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: AdRequestItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          senderName: String(data.senderName || ''),
          contactInfo: String(data.contactInfo || ''),
          adTitle: String(data.adTitle || ''),
          adLink: typeof data.adLink === 'string' ? data.adLink : '',
          message: String(data.message || ''),
          placement: (data.placement as AdPlacementOption) || 'slot1',
          status: (data.status as AdRequestStatus) || 'new',
          createdAtMs: timestampToMs(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateAdRequestStatus(
  requestId: string,
  status: AdRequestStatus
): Promise<void> {
  const path = `ad_requests/${requestId}`;
  try {
    await updateDoc(doc(db, 'ad_requests', requestId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAdRequest(requestId: string): Promise<void> {
  const path = `ad_requests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'ad_requests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchActivePublishedAds(): Promise<PublishedAdItem[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return [];
  const path = 'published_ads';
  try {
    const q = query(collection(db, path), where('active', '==', true));
    const snap = await getDocs(q);
    const ads: PublishedAdItem[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || ''),
        description: String(data.description || ''),
        ctaText: String(data.ctaText || 'زيارة'),
        targetUrl: String(data.targetUrl || 'https://'),
        slotNumber: data.slotNumber === 2 ? 2 : 1,
        active: Boolean(data.active),
        updatedAtMs: timestampToMs(data.updatedAt),
      };
    });
    ads.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    return ads;
  } catch {
    return [];
  }
}

export function subscribeAllPublishedAdsForDeveloper(
  onData: (ads: PublishedAdItem[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'published_ads';
  const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const ads: PublishedAdItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || ''),
          description: String(data.description || ''),
          ctaText: String(data.ctaText || 'زيارة'),
          targetUrl: String(data.targetUrl || ''),
          slotNumber: data.slotNumber === 2 ? 2 : 1,
          active: Boolean(data.active),
          updatedAtMs: timestampToMs(data.updatedAt),
        };
      });
      onData(ads);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export interface UpsertPublishedAdInput {
  id?: string;
  title: string;
  description: string;
  ctaText: string;
  targetUrl: string;
  slotNumber: 1 | 2;
  active: boolean;
}

export async function upsertPublishedAd(input: UpsertPublishedAdInput): Promise<string> {
  const title = input.title.trim().slice(0, 100);
  const description = input.description.trim().slice(0, 240);
  const ctaText = (input.ctaText.trim() || 'اضغط هنا').slice(0, 40);
  let targetUrl = input.targetUrl.trim().slice(0, 300);

  if (title.length < 2) throw new Error('عنوان الإعلان قصير جداً');
  if (description.length < 3) throw new Error('وصف الإعلان قصير جداً');
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }
  if (targetUrl.length < 8) throw new Error('رابط الإعلان غير صحيح');

  const id = input.id || generateSafeId('ad');
  const path = `published_ads/${id}`;
  const payload = {
    title,
    description,
    ctaText,
    targetUrl: targetUrl.slice(0, 300),
    slotNumber: input.slotNumber,
    active: input.active,
    updatedAt: serverTimestamp(),
  };

  try {
    if (input.id) {
      await updateDoc(doc(db, 'published_ads', id), payload);
    } else {
      await setDoc(doc(db, 'published_ads', id), payload);
    }
    return id;
  } catch (error) {
    handleFirestoreError(error, input.id ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function togglePublishedAdActive(
  adId: string,
  active: boolean,
  existingAd: PublishedAdItem
): Promise<void> {
  const path = `published_ads/${adId}`;
  try {
    await updateDoc(doc(db, 'published_ads', adId), {
      title: existingAd.title,
      description: existingAd.description,
      ctaText: existingAd.ctaText,
      targetUrl: existingAd.targetUrl,
      slotNumber: existingAd.slotNumber,
      active,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePublishedAd(adId: string): Promise<void> {
  const path = `published_ads/${adId}`;
  try {
    await deleteDoc(doc(db, 'published_ads', adId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
