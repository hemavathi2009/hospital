import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Generates a random access code
 * @returns A 6-character alphanumeric code
 */
export const generateAccessCode = (): string => {
  // Generate a 6-character alphanumeric code (excludes 0, O, 1, I for readability)
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Validates an access code and returns the associated patient data
 * @param code The access code to validate
 * @returns The patient data if valid, null otherwise
 */
export const validateAccessCode = async (code: string) => {
  try {
    // Normalize code by converting to uppercase and removing spaces
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');
    
    // Query for the access code - We only care that the code exists
    const accessCodesRef = collection(db, 'accessCodes');
    const q = query(accessCodesRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get all matching access codes for this code
    const accessCodes = querySnapshot.docs;
    let patientId = null;
    let accessCodeDoc = null;
    
    // If we have multiple matching codes (which shouldn't happen, but just in case)
    // Always use the oldest one
    if (accessCodes.length > 1) {
      // Sort by creation date (oldest first)
      accessCodes.sort((a, b) => {
        const timeA = a.data().createdAt?.toMillis() || 0;
        const timeB = b.data().createdAt?.toMillis() || 0;
        return timeA - timeB;
      });
    }
    
    // Use the first (oldest) access code
    accessCodeDoc = accessCodes[0];
    const accessCodeData = accessCodeDoc.data();
    patientId = accessCodeData.patientId;
    
    // Get the associated patient directly with the patient ID from the access code
    const patientDoc = doc(db, 'patients', patientId);
    const patientSnapshot = await getDoc(patientDoc);
    
    if (!patientSnapshot.exists()) {
      return null;
    }
    
    const patientData = patientSnapshot.data();
    
    // Return the patient data and the access code document ID
    return {
      patient: {
        id: patientSnapshot.id,
        ...patientData
      },
      accessCodeId: accessCodeDoc.id
    };
  } catch (error) {
    console.error('Error validating access code:', error);
    return null;
  }
};

/**
 * Validates a doctor access code and returns the associated doctor data
 * @param code The access code to validate
 * @returns The doctor data if valid, null otherwise
 */
export const validateDoctorAccessCode = async (code: string) => {
  try {
    // Normalize code by converting to uppercase and removing spaces
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');
    
    // Query for the access code
    const accessCodesRef = collection(db, 'doctorAccessCodes');
    const q = query(accessCodesRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get all matching access codes for this code
    const accessCodes = querySnapshot.docs;
    let doctorId = null;
    let accessCodeDoc = null;
    
    // If we have multiple matching codes (which shouldn't happen, but just in case)
    // Always use the oldest one
    if (accessCodes.length > 1) {
      // Sort by creation date (oldest first)
      accessCodes.sort((a, b) => {
        const timeA = a.data().createdAt?.toMillis() || 0;
        const timeB = b.data().createdAt?.toMillis() || 0;
        return timeA - timeB;
      });
    }
    
    // Use the first (oldest) access code
    accessCodeDoc = accessCodes[0];
    const accessCodeData = accessCodeDoc.data();
    doctorId = accessCodeData.doctorId;
    
    // Get the associated doctor directly with the doctor ID from the access code
    const doctorDoc = doc(db, 'doctors', doctorId);
    const doctorSnapshot = await getDoc(doctorDoc);
    
    if (!doctorSnapshot.exists()) {
      return null;
    }
    
    const doctorData = doctorSnapshot.data();
    
    // Return the doctor data and the access code document ID
    return {
      doctor: {
        id: doctorSnapshot.id,
        ...doctorData
      },
      accessCodeId: accessCodeDoc.id
    };
  } catch (error) {
    console.error('Error validating doctor access code:', error);
    return null;
  }
};

/**
 * Marks an access code as used (no-op for permanent codes)
 * @param accessCodeId The ID of the access code document
 */
export const markAccessCodeAsUsed = async (accessCodeId: string) => {
  // This function is now a no-op since we're using permanent codes
  // Keeping it for backward compatibility with existing code
  return true;
};

/**
 * Creates an access code for a patient
 * @param patientId The ID of the patient
 * @returns The generated access code
 */
export const createAccessCode = async (patientId: string) => {
  try {
    // Generate a unique access code
    let code = generateAccessCode();
    let isUnique = false;
    
    // Keep generating until we find a unique one
    while (!isUnique) {
      const accessCodesRef = collection(db, 'accessCodes');
      const q = query(accessCodesRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        code = generateAccessCode();
      }
    }
    
    // Create the access code document - no expiration, no isUsed flag
    const accessCodesRef = collection(db, 'accessCodes');
    const accessCodeData = {
      code,
      patientId,
      createdAt: serverTimestamp(),
      isPermanent: true // Mark explicitly as permanent
    };
    
    const docRef = await addDoc(accessCodesRef, accessCodeData);
    
    return {
      id: docRef.id,
      code,
      isPermanent: true
    };
  } catch (error) {
    console.error('Error creating access code:', error);
    throw error;
  }
};

/**
 * Creates an access code for a doctor
 * @param doctorId The ID of the doctor
 * @returns The generated access code
 */
export const createDoctorAccessCode = async (doctorId: string) => {
  try {
    // Generate a unique access code
    let code = generateAccessCode();
    let isUnique = false;
    
    // Keep generating until we find a unique one
    while (!isUnique) {
      const accessCodesRef = collection(db, 'doctorAccessCodes');
      const q = query(accessCodesRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        code = generateAccessCode();
      }
    }
    
    // Create the access code document - no expiration, no isUsed flag
    const accessCodesRef = collection(db, 'doctorAccessCodes');
    const accessCodeData = {
      code,
      doctorId,
      createdAt: serverTimestamp(),
      isPermanent: true // Mark explicitly as permanent
    };
    
    const docRef = await addDoc(accessCodesRef, accessCodeData);
    
    return {
      id: docRef.id,
      code,
      isPermanent: true
    };
  } catch (error) {
    console.error('Error creating doctor access code:', error);
    throw error;
  }
};
