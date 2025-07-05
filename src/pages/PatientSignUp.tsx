import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff,
  UserPlus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Footer from '../components/organisms/Footer';

const PatientSignUp: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  // Update password validation on each change
  useEffect(() => {
    setPasswordCriteria({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  // Check if all password criteria are met
  const allCriteriaMet = Object.values(passwordCriteria).every(criterion => criterion);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!allCriteriaMet) {
      toast.error('Password does not meet all security requirements');
      return;
    }
    
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if a patient with this email already exists
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error('A patient with this email already exists. Please sign in instead.');
        setLoading(false);
        return;
      }
      
      // Register with Firebase
      await register(email, password, {
        firstName,
        lastName,
        phone,
        role: 'patient',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      toast.success('Patient account created successfully!');
      toast.info('You can now access your patient portal.');
      
      // Redirect to patient portal
      setTimeout(() => {
        navigate('/patient-portal');
      }, 1500);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Header Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-primary via-primary/90 to-secondary text-white">
        <div className="container-hospital">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Create Your <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Patient Account</span>
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join our healthcare platform to access personalized care and manage your health information securely.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 flex-grow">
        <div className="container-hospital">
          <div className="max-w-xl mx-auto">
            <Card premium className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center mb-6">
                Patient Registration
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name *
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="w-full"
                      icon={<User className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Last Name *
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                      className="w-full"
                      icon={<User className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="johndoe@example.com"
                    required
                    className="w-full"
                    icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Phone Number *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(123) 456-7890"
                    required
                    className="w-full"
                    icon={<Phone className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      required
                      className="w-full pr-10"
                      icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className={`w-full pr-10 ${
                        confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                      }`}
                      icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                
                {/* Password Requirements */}
                <div className="bg-muted/30 p-3 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Password Requirements:</h3>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center">
                      {passwordCriteria.minLength ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mr-2" />
                      )}
                      At least 8 characters
                    </li>
                    <li className="flex items-center">
                      {passwordCriteria.hasUppercase ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mr-2" />
                      )}
                      At least one uppercase letter (A-Z)
                    </li>
                    <li className="flex items-center">
                      {passwordCriteria.hasLowercase ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mr-2" />
                      )}
                      At least one lowercase letter (a-z)
                    </li>
                    <li className="flex items-center">
                      {passwordCriteria.hasNumber ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mr-2" />
                      )}
                      At least one number (0-9)
                    </li>
                    <li className="flex items-center">
                      {passwordCriteria.hasSpecial ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mr-2" />
                      )}
                      At least one special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading}
                  disabled={loading || !allCriteriaMet || !passwordsMatch}
                >
                  Create Account
                </Button>
                
                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <Link to="/signin?userType=patient" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default PatientSignUp;
