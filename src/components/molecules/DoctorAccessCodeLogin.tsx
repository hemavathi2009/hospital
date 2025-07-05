import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateDoctorAccessCode } from '../../utils/accessCodes';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { toast } from 'sonner';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Card from '../atoms/Card';
import { KeyRound, ArrowRight } from 'lucide-react';

interface DoctorAccessCodeLoginProps {
  onSuccess?: () => void;
}

interface DoctorData {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

const DoctorAccessCodeLogin: React.FC<DoctorAccessCodeLoginProps> = ({ onSuccess }) => {
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
      const result = await validateDoctorAccessCode(accessCode);
      
      if (!result) {
        toast.error('Invalid doctor access code');
        setLoading(false);
        return;
      }
      
      const { doctor, accessCodeId } = result;
      
      // Type assertion to ensure doctor has the expected properties
      const doctorData = doctor as DoctorData;
      
      // Check if the doctor already has an account
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', doctorData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // User already exists, sign in
        try {
          const tempPassword = `DocTemp${accessCode}!`;
          await signInWithEmailAndPassword(auth, doctorData.email, tempPassword);
          
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
          const tempPassword = `DocTemp${accessCode}!`;
          const userCredential = await createUserWithEmailAndPassword(auth, doctorData.email, tempPassword);
          
          // Create user document in Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: doctorData.email,
            name: doctorData.name,
            role: 'doctor',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          toast.success('Account created successfully!');
          toast.info('Please update your password in your profile settings.');
          
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error creating user with access code:', error);
          toast.error('Failed to create account. Please try again.');
        }
      }
    } catch (error) {
      console.error('Access code validation error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 shadow-lg rounded-xl">
      <div className="mb-6 text-center">
        <KeyRound className="w-12 h-12 mx-auto mb-2 text-primary" />
        <h2 className="text-2xl font-bold text-gray-800">Doctor Access</h2>
        <p className="text-gray-600 mt-1">Enter your access code to continue</p>
      </div>
      
      <form onSubmit={handleAccessCodeSubmit}>
        <div className="mb-5">
          <Input
            label="Access Code"
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code"
            className="text-center text-lg tracking-wider uppercase"
            required
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3"
          loading={loading}
        >
          Continue <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-600">
        Please contact the hospital if you don't have an access code.
      </p>
    </Card>
  );
};

export default DoctorAccessCodeLogin;
