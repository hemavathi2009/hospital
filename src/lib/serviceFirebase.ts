import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { Service, ServiceFormData } from '../types/service';

// Get all services (for admin)
export const getAllServices = async (): Promise<Service[]> => {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, orderBy('order', 'asc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
  } catch (error) {
    console.error('Error getting all services:', error);
    throw error;
  }
};

// Get visible services (for public-facing pages)
export const getVisibleServices = async (): Promise<Service[]> => {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(
      servicesRef, 
      where('visible', '==', true),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
  } catch (error) {
    console.error('Error getting visible services:', error);
    throw error;
  }
};

// Get a single service by ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const serviceRef = doc(db, 'services', id);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      return null;
    }
    
    return {
      id: serviceDoc.id,
      ...serviceDoc.data()
    } as Service;
  } catch (error) {
    console.error('Error getting service by ID:', error);
    throw error;
  }
};

// Create a new service
export const createService = async (serviceData: ServiceFormData): Promise<Service> => {
  try {
    // Get the latest service to determine the order
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, orderBy('order', 'desc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    // Set the order to be the highest existing order + 1, or 0 if no services exist
    const nextOrder = snapshot.empty ? 0 : snapshot.docs[0].data().order + 1;
    
    const docRef = await addDoc(servicesRef, {
      ...serviceData,
      order: nextOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Get the created service
    const newServiceDoc = await getDoc(docRef);
    
    return {
      id: docRef.id,
      ...newServiceDoc.data()
    } as Service;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

// Update an existing service
export const updateService = async (id: string, serviceData: ServiceFormData): Promise<Service> => {
  try {
    const serviceRef = doc(db, 'services', id);
    
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(serviceRef);
    
    return {
      id,
      ...updatedDoc.data()
    } as Service;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

// Delete a service
export const deleteService = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Reorder services (batch update)
export const reorderServices = async (services: Service[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    services.forEach((service, index) => {
      const serviceRef = doc(db, 'services', service.id);
      batch.update(serviceRef, { 
        order: index,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error reordering services:', error);
    throw error;
  }
};
