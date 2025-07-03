import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Lock, Mail, Eye, EyeOff, User, Stethoscope, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const SignIn: React.FC = () => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we were redirected from a portal page with a pre-selected user type
  useEffect(() => {
    const state = location.state as { userType?: 'patient' | 'doctor' };
    if (state?.userType) {
      setUserType(state.userType);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSigningUp) {
      // Sign up flow
      if (!email || !password || !firstName || !lastName) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Special warning for doctor sign-ups
      if (userType === 'doctor') {
        toast.warning('Note: Doctor accounts require admin verification before portal access will be granted.');
      }
      
      try {
        setLoading(true);
        
        // Register with Firebase
        await register(email, password, {
          firstName,
          lastName,
          phone,
          role: userType,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        toast.success('Account created successfully!');
        
        // Redirect based on user type
        if (userType === 'doctor') {
          // For doctors, create an entry in the pending_doctors collection for admin to review
          try {
            const pendingDoctorsRef = collection(db, 'pending_doctors');
            await addDoc(pendingDoctorsRef, {
              email,
              firstName,
              lastName,
              phone,
              status: 'pending',
              createdAt: new Date()
            });
            
            toast.info('Your doctor account request has been submitted for admin verification. You will be redirected to the patient portal for now.');
            
            // Redirect to patient portal while doctor verification is pending
            setTimeout(() => {
              navigate('/patient-portal');
            }, 3000);
          } catch (error) {
            console.error('Error creating pending doctor record:', error);
            navigate('/patient-portal');
          }
        } else {
          navigate('/patient-portal');
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        toast.error(error.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Login flow
      if (!email || !password) {
        toast.error('Please fill in all fields');
        return;
      }

      try {
        setLoading(true);
        
        // Login with Firebase
        const userCredential = await login(email, password);
        
        if (!userCredential.user) {
          throw new Error('Login failed');
        }

        // Check if user document exists in Firestore
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
          await setDoc(userDocRef, {
            email: email,
            role: userType,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`${userType} user document created`);
        } else {
          // Verify user role matches the selected login type
          const userData = userDoc.data();
          if (userData.role !== userType) {
            // Update user's role if different
            await setDoc(userDocRef, {
              ...userData,
              role: userType,
              updatedAt: new Date()
            }, { merge: true });
            console.log(`User role updated to ${userType}`);
          }
        }

        // Special handling for doctor login - verify they're in doctors collection
        if (userType === 'doctor') {
          const doctorsRef = collection(db, 'doctors');
          const q = query(doctorsRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty && userDoc.data()?.role !== 'admin') {
            toast.warning('Your doctor account is pending verification by administrators. You will be redirected to the patient portal for now.');
            setTimeout(() => {
              navigate('/patient-portal');
            }, 3000);
            return;
          }
        }
        
        toast.success('Login successful!');
        
        // Redirect based on user type
        if (userType === 'doctor') {
          navigate('/doctor-portal');
        } else {
          navigate('/patient-portal');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error(error.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-primary via-primary/90 to-secondary text-white">
        <div className="container-hospital">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Sign In to Your <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Portal</span>
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Access your personalized healthcare dashboard and manage your information securely.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-hospital">
          <div className="max-w-md mx-auto">
            <Card premium className="p-8">
              {/* User Type Tabs */}
              <div className="flex mb-6 bg-muted/20 p-1 rounded-lg">
                <button
                  onClick={() => setUserType('patient')}
                  className={`flex-1 py-2 px-4 rounded-md flex justify-center items-center ${
                    userType === 'patient' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'hover:bg-muted/30'
                  }`}
                  disabled={isSigningUp && userType !== 'patient'}
                >
                  <User className="w-4 h-4 mr-2" />
                  Patient
                </button>
                <button
                  onClick={() => setUserType('doctor')}
                  className={`flex-1 py-2 px-4 rounded-md flex justify-center items-center ${
                    userType === 'doctor' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'hover:bg-muted/30'
                  }`}
                  disabled={isSigningUp && userType !== 'doctor'}
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Doctor
                </button>
              </div>

              <h2 className="text-2xl font-bold text-center mb-6">
                {isSigningUp 
                  ? (userType === 'patient' ? 'Create Patient Account' : 'Doctor Registration') 
                  : (userType === 'patient' ? 'Patient Sign In' : 'Doctor Sign In')}
              </h2>
              
              {/* Portal Information Box */}
              <div className={`mb-6 p-4 rounded-md ${userType === 'patient' ? 'bg-blue-50 border border-blue-200' : 'bg-amber-50 border border-amber-200'}`}>
                <h3 className={`text-sm font-medium mb-2 ${userType === 'patient' ? 'text-blue-800' : 'text-amber-800'}`}>
                  <div className="flex items-center">
                    {userType === 'patient' ? (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Patient Portal
                      </>
                    ) : (
                      <>
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Doctor Portal
                      </>
                    )}
                  </div>
                </h3>
                <p className={`text-xs ${userType === 'patient' ? 'text-blue-600' : 'text-amber-700'}`}>
                  {userType === 'patient' 
                    ? 'Access your medical records, upcoming appointments, prescriptions, and lab results. Open to all patients.'
                    : 'Doctor access is restricted to healthcare professionals added by administrators. If you\'re a doctor but can\'t log in, please contact hospital administration to verify your account.'}
                </p>
                {userType === 'doctor' && (
                  <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300 flex items-start">
                    <AlertCircle className="w-4 h-4 text-amber-800 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Note: Only doctors that have been pre-registered by the admin can access the Doctor Portal. 
                      New sign-ups will require admin approval before gaining access.
                    </p>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSigningUp && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          First Name*
                        </label>
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Last Name*
                        </label>
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (123) 456-7890"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address*
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={userType === 'patient' ? "patient@example.com" : "doctor@hospital.com"}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isSigningUp ? 'Creating Account...' : 'Signing in...'}
                    </div>
                  ) : (
                    isSigningUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>

                <div className="text-center">
                  {isSigningUp ? (
                    <p className="text-sm text-muted-foreground">
                      Already have an account? <button type="button" onClick={() => setIsSigningUp(false)} className="text-primary hover:underline">Sign In</button>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Don't have an account? <button type="button" onClick={() => setIsSigningUp(true)} className="text-primary hover:underline">Create Account</button>
                    </p>
                  )}
                  
                  {!isSigningUp && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <a href="#" className="hover:underline">Forgot your password?</a>
                    </p>
                  )}
                </div>
              </form>
            </Card>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                By signing in, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SignIn;
