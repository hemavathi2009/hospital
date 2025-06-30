import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface Testimonial {
  id?: string;
  name: string;
  title: string;
  text: string;
  rating: number;
  image?: string;
  date: Date;
  approved?: boolean;
}

export const addTestimonial = async (testimonial: Omit<Testimonial, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'testimonials'), {
      ...testimonial,
      approved: false, // Testimonials require admin approval by default
      date: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding testimonial:', error);
    throw error;
  }
};

export const getApprovedTestimonials = async (limitCount = 6) => {
  try {
    const q = query(
      collection(db, 'testimonials'),
      where('approved', '==', true),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Testimonial[];
  } catch (error) {
    console.error('Error getting testimonials:', error);
    throw error;
  }
};
