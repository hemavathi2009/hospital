import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  writeBatch,
  where
} from 'firebase/firestore';
import { Service, ServiceFormData } from '../types/service';

// Get all services
export const getAllServices = async (): Promise<Service[]> => {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Service));
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

// Get visible services for public site
export const getVisibleServices = async (): Promise<Service[]> => {
  try {
    const servicesQuery = query(
      collection(db, 'services'), 
      where("visible", "==", true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(servicesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Service));
  } catch (error) {
    console.error("Error fetching visible services:", error);
    throw error;
  }
};

// Get a single service
export const getService = async (id: string): Promise<Service | null> => {
  try {
    const serviceRef = doc(db, 'services', id);
    const serviceSnap = await getDoc(serviceRef);
    
    if (serviceSnap.exists()) {
      return {
        id: serviceSnap.id,
        ...serviceSnap.data()
      } as Service;
    }
    return null;
  } catch (error) {
    console.error("Error fetching service:", error);
    throw error;
  }
};

// Add a new service
export const addService = async (serviceData: ServiceFormData): Promise<string> => {
  try {
    // Get highest current order value
    const services = await getAllServices();
    const maxOrder = services.length > 0 
      ? Math.max(...services.map(s => s.order || 0)) 
      : 0;
    
    // Add new service with incremented order
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};

// Update a service
export const updateService = async (serviceId: string, data: Partial<Service>): Promise<void> => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

// Delete a service
export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};

// Reorder services
export const reorderServices = async (services: Service[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    services.forEach((service, index) => {
      const serviceRef = doc(db, 'services', service.id);
      batch.update(serviceRef, { 
        order: index + 1,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error reordering services:', error);
    throw error;
  }
};
