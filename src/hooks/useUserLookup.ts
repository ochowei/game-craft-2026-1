import { db, collectionGroup, query, where, getDocs } from '../lib/firebase';

export interface UserLookupResult {
  uid: string;
  displayName: string;
  photoURL: string;
}

export async function lookupUserByEmail(email: string): Promise<UserLookupResult | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const q = query(collectionGroup(db, 'publicProfile'), where('email', '==', normalized));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc0 = snap.docs[0];
  const data = doc0.data() as { displayName?: string; photoURL?: string };
  const uid = doc0.ref.parent.parent?.id;
  if (!uid) return null;
  return {
    uid,
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? '',
  };
}
