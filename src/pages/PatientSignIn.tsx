import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Footer from '../components/organisms/Footer';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Shield,
  UserPlus,
  UserCheck,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

const PatientSignIn = () => {
  const { login, register, currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Form validation states
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  
  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  // Check if user is already logged in
  useEffect(() => {
    if (currentUser && userRole === 'patient') {
      navigate('/patient-portal');
    }
  }, [currentUser, userRole, navigate]);
  
  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordCriteria({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      });
      return;
    }
    
    // Check password criteria
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    
    setPasswordCriteria(criteria);
    
    // Calculate strength
    const meetsCount = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength(meetsCount);
  }, [password]);
  
  // Form validation
  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: ''
    };
    
    let isValid = true;
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password is too weak';
      isValid = false;
    }
    
    // Additional validations for sign up
    if (isSigningUp) {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
      
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required';
        isValid = false;
      }
      
      if (!lastName.trim()) {
        newErrors.lastName = 'Last name is required';
        isValid = false;
      }
      
      if (phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone)) {
        newErrors.phone = 'Please enter a valid phone number';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isSigningUp) {
        // Register new patient
        await register(email, password, {
          firstName,
          lastName,
          phone,
          role: 'patient'
        });
        
        toast.success('Account created successfully!');
        setTimeout(() => {
          navigate('/patient-portal');
        }, 1500);
      } else {
        // Login existing patient
        await login(email, password);
        toast.success('Logged in successfully!');
        navigate('/patient-portal');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getPasswordStrengthText = () => {
    if (!password) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };
  
  const getPasswordStrengthColor = () => {
    if (!password) return 'bg-gray-200';
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.svg')] opacity-10"></div>
          <div className="absolute top-[25%] right-[15%] w-64 h-64 rounded-full bg-accent/10 mix-blend-overlay animate-blob"></div>
          <div className="absolute bottom-[10%] left-[10%] w-72 h-72 rounded-full bg-secondary/20 mix-blend-overlay animate-blob animation-delay-2000"></div>
          <div className="absolute top-[60%] right-[20%] w-40 h-40 rounded-full bg-white/10 mix-blend-overlay animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container-hospital px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium mb-6">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse mr-2"></div>
              <span>Secure Patient Access</span>
            </div>
            
            <motion.h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {isSigningUp ? 'Create Your ' : 'Access Your '}
              <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                Patient Portal
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl opacity-90 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {isSigningUp 
                ? 'Join our secure patient portal to access your health records, appointments, and communicate with your healthcare team.'
                : 'Securely access your medical records, upcoming appointments, prescriptions, and more.'}
            </motion.p>
          </div>
        </div>
      </section>
      
      {/* Auth Form Section */}
      <section className="py-12 flex-grow">
        <div className="container-hospital px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Card premium className="p-8 overflow-hidden relative">
              {/* Background elements for premium feel */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -z-0"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-full -z-0"></div>
              
              {/* Form tabs */}
              <div className="flex border-b border-border mb-6 relative z-10">
                <button
                  className={`flex-1 pb-3 font-medium text-center transition-colors ${
                    !isSigningUp ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsSigningUp(false)}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 pb-3 font-medium text-center transition-colors ${
                    isSigningUp ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setIsSigningUp(true)}
                >
                  Create Account
                </button>
              </div>
              
              {/* Auth form */}
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isSigningUp ? 'signup' : 'signin'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isSigningUp && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* First Name */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            First Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className={`pl-10 pr-4 py-2 w-full rounded-md border ${
                                errors.firstName ? 'border-red-400' : 'border-input'
                              } bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                              placeholder="John"
                            />
                          </div>
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.firstName}
                            </p>
                          )}
                        </div>
                        
                        {/* Last Name */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Last Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className={`pl-10 pr-4 py-2 w-full rounded-md border ${
                                errors.lastName ? 'border-red-400' : 'border-input'
                              } bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                              placeholder="Doe"
                            />
                          </div>
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`pl-10 pr-4 py-2 w-full rounded-md border ${
                            errors.email ? 'border-red-400' : 'border-input'
                          } bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                          placeholder="your@email.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                    
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`pl-10 pr-10 py-2 w-full rounded-md border ${
                            errors.password ? 'border-red-400' : 'border-input'
                          } bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.password}
                        </p>
                      )}
                      
                      {/* Password strength indicator (only for signup) */}
                      {isSigningUp && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">Password strength:</span>
                            <span className={`text-xs font-medium ${
                              passwordStrength <= 1 ? 'text-red-500' : 
                              passwordStrength <= 3 ? 'text-yellow-500' : 
                              'text-green-500'
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`} 
                              style={{ width: `${(passwordStrength / 5) * 100}%` }} 
                            />
                          </div>
                          
                          {/* Password criteria */}
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            <div className={`text-xs flex items-center ${
                              passwordCriteria.length ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {passwordCriteria.length ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                              At least 8 characters
                            </div>
                            <div className={`text-xs flex items-center ${
                              passwordCriteria.uppercase ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {passwordCriteria.uppercase ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                              Uppercase letter
                            </div>
                            <div className={`text-xs flex items-center ${
                              passwordCriteria.lowercase ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {passwordCriteria.lowercase ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                              Lowercase letter
                            </div>
                            <div className={`text-xs flex items-center ${
                              passwordCriteria.number ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {passwordCriteria.number ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                              Number
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Confirm Password (only for signup) */}
                    {isSigningUp && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={`pl-10 pr-10 py-2 w-full rounded-md border ${
                                errors.confirmPassword ? 'border-red-400' : 'border-input'
                              } bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.confirmPassword}
                            </p>
                          )}
                        </div>
                        
                        {/* Phone (optional for signup) */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Phone Number (Optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className={`pl-10 pr-4 py-2 w-full rounded-md border ${
                                errors.phone ? 'border-red-400' : 'border-input'
                              } bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          {errors.phone && (
                            <p className="mt-1 text-sm text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* "Forgot Password" link (only for signin) */}
                    {!isSigningUp && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                          onClick={() => navigate('/forgot-password')}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                    
                    {/* Submit button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-2.5 shadow-lg hover:shadow-primary/20 transition-all duration-300 flex justify-center items-center"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {isSigningUp ? 'Creating Account...' : 'Signing In...'}
                          </>
                        ) : (
                          <>
                            {isSigningUp ? (
                              <>
                                <UserPlus className="w-5 h-5 mr-2" />
                                Create Account
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-5 h-5 mr-2" />
                                Sign In
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </motion.div>
                    
                    {/* Secure login disclaimer */}
                    <div className="flex items-center justify-center pt-4 border-t border-border">
                      <Shield className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-xs text-muted-foreground">
                        Secure, encrypted connection. Your data is protected.
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default PatientSignIn;
