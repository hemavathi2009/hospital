import { useState, useEffect, createContext, useContext } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'patient' | 'admin' | 'doctor' | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'patient' | 'admin' | 'doctor' | null>(null);
  const [loading, setLoading] = useState(true);

  const register = async (email: string, password: string, userData: any) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Create user document in Firestore with specific role
      const role = userData.role || 'patient';
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        email,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // If registering as a patient, also create entry in patients collection
      if (role === 'patient') {
        await setDoc(doc(db, 'patients', user.uid), {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email,
          phone: userData.phone || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log('User registered successfully');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Immediately fetch the user role after login
      if (userCredential.user) {
        const role = await getUserRole(userCredential.user.uid);
        setUserRole(role as 'patient' | 'admin' | 'doctor' | null);
      }
      
      console.log('User logged in successfully');
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const getUserRole = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data().role || 'patient';
      }
      return 'patient';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'patient';
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user role from Firestore
        const role = await getUserRole(user.uid);
        setUserRole(role as 'patient' | 'admin' | 'doctor' | null);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
