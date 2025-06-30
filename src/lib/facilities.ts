import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Facility } from '../types/facility';

// Get all facilities
export const getAllFacilities = async () => {
  try {
    const q = query(collection(db, 'facilities'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Facility[];
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw error;
  }
};

// Get facility by ID
export const getFacilityById = async (id: string) => {
  try {
    const docRef = doc(db, 'facilities', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Facility;
    } else {
      throw new Error('Facility not found');
    }
  } catch (error) {
    console.error('Error fetching facility:', error);
    throw error;
  }
};

// Add a new facility
export const addFacility = async (facilityData: Omit<Facility, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'facilities'), {
      ...facilityData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding facility:', error);
    throw error;
  }
};

// Update a facility
export const updateFacility = async (id: string, facilityData: Partial<Facility>) => {
  try {
    const facilityRef = doc(db, 'facilities', id);
    await updateDoc(facilityRef, {
      ...facilityData,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating facility:', error);
    throw error;
  }
};

// Delete a facility
export const deleteFacility = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'facilities', id));
    return true;
  } catch (error) {
    console.error('Error deleting facility:', error);
    throw error;
  }
};

// Get facilities by category
export const getFacilitiesByCategory = async (category: string) => {
  try {
    const q = query(
      collection(db, 'facilities'),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Facility[];
  } catch (error) {
    console.error('Error fetching facilities by category:', error);
    throw error;
  }
};
