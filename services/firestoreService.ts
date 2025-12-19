import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Coordinates } from '../types';

// ============ VAN LOCATION SERVICE ============

export interface VanLocation {
  id: string;
  lat: number;
  lng: number;
  updatedAt: Timestamp | Date;
}

/**
 * Update van location in Firestore
 * Called by driver every 2-5 seconds
 */
export const updateVanLocation = async (vanId: string, lat: number, lng: number): Promise<void> => {
  try {
    const vanRef = doc(db, 'vans', vanId);
    await setDoc(vanRef, {
      id: vanId,
      lat,
      lng,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating van location:', error);
    throw error;
  }
};

/**
 * Get current van location from Firestore
 */
export const getVanLocation = async (vanId: string): Promise<VanLocation | null> => {
  try {
    const vanRef = doc(db, 'vans', vanId);
    const vanSnap = await getDoc(vanRef);
    
    if (vanSnap.exists()) {
      const data = vanSnap.data();
      return {
        id: data.id,
        lat: data.lat,
        lng: data.lng,
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting van location:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time van location updates
 * Returns unsubscribe function
 */
export const subscribeToVanLocation = (
  vanId: string,
  callback: (location: VanLocation | null) => void
): (() => void) => {
  const vanRef = doc(db, 'vans', vanId);
  
  return onSnapshot(
    vanRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          id: data.id,
          lat: data.lat,
          lng: data.lng,
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to van location:', error);
      callback(null);
    }
  );
};

/**
 * Subscribe to all vans locations
 */
export const subscribeToAllVans = (
  callback: (vans: VanLocation[]) => void
): (() => void) => {
  const vansRef = collection(db, 'vans');
  
  return onSnapshot(
    vansRef,
    (snapshot) => {
      const vans: VanLocation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        vans.push({
          id: data.id,
          lat: data.lat,
          lng: data.lng,
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      callback(vans);
    },
    (error) => {
      console.error('Error subscribing to all vans:', error);
      callback([]);
    }
  );
};

// ============ STUDENT LOCATION SERVICE ============

export interface StudentLocation {
  id: string;
  lat: number;
  lng: number;
  pickedUp: boolean;
}

/**
 * Update student location in Firestore
 */
export const updateStudentLocation = async (
  studentId: string, 
  lat: number, 
  lng: number
): Promise<void> => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await setDoc(studentRef, {
      id: studentId,
      lat,
      lng,
      pickedUp: false // Default, can be updated separately
    }, { merge: true });
  } catch (error) {
    console.error('Error updating student location:', error);
    throw error;
  }
};

/**
 * Mark student as picked up
 */
export const markStudentPickedUp = async (studentId: string, pickedUp: boolean): Promise<void> => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      pickedUp,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking student as picked up:', error);
    throw error;
  }
};

/**
 * Get current student location from Firestore
 */
export const getStudentLocation = async (studentId: string): Promise<StudentLocation | null> => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      const data = studentSnap.data();
      return {
        id: data.id,
        lat: data.lat,
        lng: data.lng,
        pickedUp: data.pickedUp || false
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting student location:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time student location updates
 */
export const subscribeToStudentLocation = (
  studentId: string,
  callback: (location: StudentLocation | null) => void
): (() => void) => {
  const studentRef = doc(db, 'students', studentId);
  
  return onSnapshot(
    studentRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          id: data.id,
          lat: data.lat,
          lng: data.lng,
          pickedUp: data.pickedUp || false
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to student location:', error);
      callback(null);
    }
  );
};

/**
 * Subscribe to all students locations (not picked up)
 */
export const subscribeToAllStudents = (
  callback: (students: StudentLocation[]) => void
): (() => void) => {
  const studentsRef = collection(db, 'students');
  const q = query(studentsRef, where('pickedUp', '==', false));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const students: StudentLocation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        students.push({
          id: data.id,
          lat: data.lat,
          lng: data.lng,
          pickedUp: data.pickedUp || false
        });
      });
      callback(students);
    },
    (error) => {
      console.error('Error subscribing to all students:', error);
      callback([]);
    }
  );
};

/**
 * Subscribe to students by van (if you have a vanId field)
 */
export const subscribeToStudentsByVan = (
  vanId: string,
  callback: (students: StudentLocation[]) => void
): (() => void) => {
  const studentsRef = collection(db, 'students');
  const q = query(studentsRef, where('vanId', '==', vanId), where('pickedUp', '==', false));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const students: StudentLocation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        students.push({
          id: data.id,
          lat: data.lat,
          lng: data.lng,
          pickedUp: data.pickedUp || false
        });
      });
      callback(students);
    },
    (error) => {
      console.error('Error subscribing to students by van:', error);
      callback([]);
    }
  );
};

