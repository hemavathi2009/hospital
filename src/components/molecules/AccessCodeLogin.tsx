import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAccessCode } from '../../utils/accessCodes';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { toast } from 'sonner';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Card from '../atoms/Card';
import { KeyRound, ArrowRight } from 'lucide-react';

interface AccessCodeLoginProps {
  onSuccess?: () => void;
}

interface PatientData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

const AccessCodeLogin: React.FC<AccessCodeLoginProps> = ({ onSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast.error('Please enter an access code');
      return;
    }
    
    try {
      setLoading(true);
      
      // Validate the access code
      const result = await validateAccessCode(accessCode);
      
      if (!result) {
        toast.error('Invalid access code');
        setLoading(false);
        return;
      }
      
      const { patient, accessCodeId } = result;
      
      // Type assertion to ensure patient has the expected properties
      const patientData = patient as PatientData;
      
      // Check if the patient already has an account
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', patientData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // User already exists, sign in
        try {
          const tempPassword = `Temp${accessCode}!`;
          await signInWithEmailAndPassword(auth, patientData.email, tempPassword);
          
          // No need to mark the code as used since codes are now permanent
          
          toast.success('Successfully signed in!');
          
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error signing in with access code:', error);
          toast.error('Failed to sign in. Please try again.');
        }
      } else {
        // Create a new user account with a temporary password
        try {
          const tempPassword = `Temp${accessCode}!`;
          const userCredential = await createUserWithEmailAndPassword(auth, patientData.email, tempPassword);
          
          // Create user document in Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: patientData.email,
            firstName: patientData.firstName,
            lastName: patientData.lastName,
            role: 'patient',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // No need to mark the code as used since codes are now permanent
          
          toast.success('Account created successfully!');
          toast.info('Please update your password in your profile settings.');
          
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error creating account with access code:', error);
          toast.error('Failed to create account. Please try again.');
        }
      }
    } catch (error) {
      console.error('Access code login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card premium className="p-6">
      <h3 className="text-xl font-semibold mb-4">Access with Code</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Enter the permanent access code provided by your healthcare provider to access your patient account.
      </p>
      
      <form onSubmit={handleAccessCodeSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Access Code
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter your 6-digit code"
              className="pl-10"
              maxLength={6}
              required
            />
          </div>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Verifying Code...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Access Account <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default AccessCodeLogin;
