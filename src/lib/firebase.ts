import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDocFromServer,
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase securely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google using Firebase Auth popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
      console.info('Autenticação Google cancelada pelo usuário (janela fechada).');
      return null;
    }
    console.error('Erro na autenticação com Google via Firebase Auth:', err);
    throw err;
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function logOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Erro ao deslogar do Firebase:', err);
  }
}

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Validate Connection on Boot as per Skill directive
async function testConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    console.log("Firebase connection initialized successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('offline')) {
      console.log("Firebase initialized in local offline-first cache mode.");
    } else {
      console.log("Firebase ready.");
    }
  }
}
testConnection();

/**
 * Generic persistent loaders & syncers for our multi-user architecture
 */

export async function fetchUserCollection<T>(collectionName: string, userId: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push({ ...doc.data() } as T);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionName);
    console.error(`Erro ao carregar coleção ${collectionName} do Firestore:`, err);
    throw err;
  }
}

export async function saveUserDocument<T extends { id?: string }>(
  collectionName: string,
  userId: string,
  docData: T
): Promise<void> {
  const docId = (docData && typeof docData.id === 'string' && docData.id.trim())
    ? docData.id.trim()
    : `${collectionName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...docData,
      id: docId,
      userId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    console.error(`Erro ao salvar documento em ${collectionName}:`, err);
    throw err;
  }
}

export async function deleteUserDocument(collectionName: string, docId: string): Promise<void> {
  if (!docId || typeof docId !== 'string') {
    return;
  }
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
    console.error(`Erro ao deletar documento em ${collectionName}:`, err);
    throw err;
  }
}
