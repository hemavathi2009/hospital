import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle, ChevronDown, Calendar } from 'lucide-react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    subject: '',
    message: ''
  });

  const [departments, setDepartments] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDepartments, setShowDepartments] = useState(false);
  type FormFields = 'firstName' | 'lastName' | 'email' | 'phone' | 'department' | 'subject' | 'message';

  const [formErrors, setFormErrors] = useState<Partial<Record<FormFields, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormFields, boolean>>>({});

  // Fetch departments from Firebase
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsCollection = collection(db, 'departments');
        const departmentSnapshot = await getDocs(departmentsCollection);
        const departmentList = departmentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If no departments found, use default departments
        if (departmentList.length === 0) {
          setDepartments([
            { id: 'cardiology', name: 'Cardiology', description: 'Heart care' },
            { id: 'neurology', name: 'Neurology', description: 'Brain & nervous system' },
            { id: 'orthopedics', name: 'Orthopedics', description: 'Bone & joint care' },
            { id: 'pediatrics', name: 'Pediatrics', description: 'Child healthcare' },
            { id: 'dermatology', name: 'Dermatology', description: 'Skin care' },
            { id: 'general', name: 'General Inquiry', description: 'Other inquiries' }
          ]);
        } else {
          setDepartments(departmentList);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        // Fallback to default departments if fetch fails
        setDepartments([
          { id: 'cardiology', name: 'Cardiology' },
          { id: 'neurology', name: 'Neurology' },
          { id: 'orthopedics', name: 'Orthopedics' },
          { id: 'pediatrics', name: 'Pediatrics' },
          { id: 'dermatology', name: 'Dermatology' },
          { id: 'general', name: 'General Inquiry' }
        ]);
      }
    };

    fetchDepartments();
  }, []);

  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) error = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(value)) error = 'Please enter a valid email';
        break;
      case 'phone':
        if (value && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;
      case 'subject':
        if (!value.trim()) error = 'Subject is required';
        break;
      case 'message':
        if (!value.trim()) error = 'Message is required';
        else if (value.trim().length < 10) error = 'Message must be at least 10 characters';
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Live validation
    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Validate all fields
    Object.keys(formData).forEach(key => {
      // Skip phone as it's optional
      if (key === 'phone' && !formData[key]) return;
      
      // Skip department if it's empty in the form
      if (key === 'department') return;
      
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });
    
    setFormErrors(errors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      department: true,
      subject: true,
      message: true
    });
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Add department name to submission if selected
      const departmentName = formData.department 
        ? departments.find(d => d.id === formData.department)?.name || formData.department 
        : 'General Inquiry';
      
      // Save contact form data to Firebase
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        departmentName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Contact form submitted successfully:', formData);
      toast.success('Message sent successfully!');
      setIsSubmitted(true);
      
      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectDepartment = (id, name) => {
    setFormData(prev => ({
      ...prev,
      department: id
    }));
    setShowDepartments(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Modern Hero Section with Consistent Design */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Multi-layered background with enhanced depth */}
        <div className="absolute inset-0 w-full h-full">
          {/* Base image with modern hospital building */}
          <img
            src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1920&h=1080&fit=crop&q=80"
            alt="Modern hospital building"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/90 z-10"></div>
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.svg')] opacity-10 z-[11]"></div>
          
          {/* Animated accent elements */}
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-accent/10 mix-blend-overlay animate-blob animation-delay-2000 z-[12]"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-secondary/10 mix-blend-overlay animate-blob z-[12]"></div>
          <div className="absolute top-[60%] right-[20%] w-[400px] h-[400px] rounded-full bg-primary-light/10 mix-blend-overlay animate-blob animation-delay-4000 z-[12]"></div>
          
          {/* Floating geometric shapes */}
          <motion.div 
            className="absolute top-[20%] right-[20%] w-24 h-24 border-2 border-white/10 rounded-lg z-[13]"
            animate={{ 
              rotate: 360,
              y: [0, 15, 0],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
          ></motion.div>
          
          {/* Particle effects */}
          <div className="absolute inset-0 z-[14]">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="container-hospital relative z-20 px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="inline-flex items-center px-5 py-3 rounded-full bg-white/15 backdrop-blur-lg text-base font-medium text-white shadow-glow mb-6">
                <div className="relative mr-3">
                  <div className="w-3 h-3 rounded-full bg-accent animate-pulse-soft"></div>
                  <div className="absolute -inset-1 rounded-full bg-accent/30 animate-ripple"></div>
                </div>
                We're Here To Help
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Contact <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Us</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed backdrop-blur-sm bg-white/5 p-5 rounded-xl border border-white/10">
                Reach out to our dedicated team for appointments, inquiries, or feedback. We're here to help you navigate your healthcare journey.
              </p>
              
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container-hospital">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Card premium className="p-8 overflow-hidden relative">
                {/* Background elements for premium feel */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -z-0"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-tr-full -z-0"></div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Send us a Message</h2>
                  
                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div 
                        className="text-center py-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div 
                          className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                          transition={{ 
                            duration: 0.8, 
                            type: "spring", 
                            stiffness: 100 
                          }}
                        >
                          <CheckCircle className="w-12 h-12 text-success" />
                        </motion.div>
                        <motion.h3 
                          className="text-2xl font-semibold text-foreground mb-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          Message Sent Successfully!
                        </motion.h3>
                        <motion.p 
                          className="text-muted-foreground mb-8"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                        >
                          Thank you for contacting us. Our team will get back to you within 24 hours.
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7, duration: 0.5 }}
                        >
                          <Button 
                            variant="primary" 
                            onClick={() => setIsSubmitted(false)}
                            className="shadow-lg hover:shadow-primary/20 transition-all duration-300"
                          >
                            Send Another Message
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.form 
                        onSubmit={handleSubmit} 
                        className="space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                            <div className="relative">
                              <Input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={`w-full transition-all duration-300 ${
                                  touched.firstName && formErrors.firstName 
                                    ? 'border-red-400 focus:ring-red-200' 
                                    : touched.firstName && !formErrors.firstName 
                                      ? 'border-green-400 focus:ring-green-200' 
                                      : ''
                                }`}
                                placeholder="John"
                              />
                              {touched.firstName && formErrors.firstName && (
                                <div className="text-red-500 text-sm mt-1 flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {formErrors.firstName}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                            <div className="relative">
                              <Input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={`w-full transition-all duration-300 ${
                                  touched.lastName && formErrors.lastName 
                                    ? 'border-red-400 focus:ring-red-200' 
                                    : touched.lastName && !formErrors.lastName 
                                      ? 'border-green-400 focus:ring-green-200' 
                                      : ''
                                }`}
                                placeholder="Doe"
                              />
                              {touched.lastName && formErrors.lastName && (
                                <div className="text-red-500 text-sm mt-1 flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {formErrors.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                          <div className="relative">
                            <Input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              className={`w-full transition-all duration-300 ${
                                touched.email && formErrors.email 
                                  ? 'border-red-400 focus:ring-red-200' 
                                  : touched.email && !formErrors.email 
                                    ? 'border-green-400 focus:ring-green-200' 
                                    : ''
                              }`}
                              placeholder="john@example.com"
                            />
                            {touched.email && formErrors.email && (
                              <div className="text-red-500 text-sm mt-1 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {formErrors.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
                          <div className="relative">
                            <Input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              className={`w-full transition-all duration-300 ${
                                touched.phone && formErrors.phone 
                                  ? 'border-red-400 focus:ring-red-200' 
                                  : touched.phone && !formErrors.phone && formData.phone 
                                    ? 'border-green-400 focus:ring-green-200' 
                                    : ''
                              }`}
                              placeholder="+1 (555) 123-4567"
                            />
                            {touched.phone && formErrors.phone && (
                              <div className="text-red-500 text-sm mt-1 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {formErrors.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Department Dropdown - New Addition */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Department (Optional)</label>
                          <div className="relative">
                            <div
                              onClick={() => setShowDepartments(!showDepartments)}
                              className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground cursor-pointer flex items-center justify-between ${
                                showDepartments ? 'border-primary ring-2 ring-primary/20' : 'border-input'
                              } transition-all duration-200`}
                            >
                              <span className={formData.department ? 'text-foreground' : 'text-muted-foreground'}>
                                {formData.department 
                                  ? departments.find(d => d.id === formData.department)?.name 
                                  : 'Select Department'}
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDepartments ? 'rotate-180' : ''}`} />
                            </div>
                            
                            {showDepartments && (
                              <motion.div 
                                className="absolute z-20 w-full mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                <div className="max-h-60 overflow-y-auto py-2">
                                  {departments.map((dept) => (
                                    <div 
                                      key={dept.id}
                                      className={`px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                        formData.department === dept.id ? 'bg-primary/10 text-primary' : ''
                                      }`}
                                      onClick={() => selectDepartment(dept.id, dept.name)}
                                    >
                                      <div className="font-medium">{dept.name}</div>
                                      {dept.description && (
                                        <div className="text-sm text-muted-foreground">{dept.description}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                        
                        {/* Subject Field - New Addition */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                          <div className="relative">
                            <Input
                              type="text"
                              name="subject"
                              value={formData.subject}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              className={`w-full transition-all duration-300 ${
                                touched.subject && formErrors.subject 
                                  ? 'border-red-400 focus:ring-red-200' 
                                  : touched.subject && !formErrors.subject 
                                    ? 'border-green-400 focus:ring-green-200' 
                                    : ''
                              }`}
                              placeholder="How can we help you?"
                            />
                            {touched.subject && formErrors.subject && (
                              <div className="text-red-500 text-sm mt-1 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {formErrors.subject}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                          <div className="relative">
                            <textarea
                              name="message"
                              value={formData.message}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              rows={4}
                              className={`w-full px-4 py-3 rounded-xl border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background resize-none ${
                                touched.message && formErrors.message 
                                  ? 'border-red-400 focus:ring-red-200' 
                                  : touched.message && !formErrors.message 
                                    ? 'border-green-400 focus:ring-green-200' 
                                    : 'border-input'
                              }`}
                              placeholder="Tell us how we can help you..."
                            />
                            {touched.message && formErrors.message && (
                              <div className="text-red-500 text-sm mt-1 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {formErrors.message}
                              </div>
                            )}
                          </div>
                        </div>

                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            variant="primary" 
                            size="lg" 
                            className="w-full shadow-lg hover:shadow-primary/20 transition-all duration-300"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-5 h-5 mr-2" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>

            {/* Map and Additional Info */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Card premium className="overflow-hidden">
                <div className="h-72 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                  {/* Interactive Map */}
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.3060353296!2d-74.25987368715491!3d40.69714941774136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sin!4v1645969855692!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy"
                    className="transition-all duration-500 hover:brightness-105"
                  ></iframe>
                  
                  {/* Map Overlay for premium feel */}
                  <div className="absolute inset-0 pointer-events-none border border-primary/10 shadow-inner"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3">Our Location</h3>
                  <p className="text-muted-foreground">
                    Conveniently located in downtown area with easy access to public transportation 
                    and ample parking facilities.
                  </p>
                  
                  {/* Enhanced directions */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-2 text-sm">Get Directions</h4>
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => window.open("https://maps.google.com?q=123+Medical+Center+Drive,+NY+10001", "_blank")}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Google Maps</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => window.open("https://waze.com/ul?ll=40.7128,-74.006&navigate=yes", "_blank")}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>Waze</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card premium className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Why Choose Us?</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Expert Medical Team</h4>
                      <p className="text-sm text-muted-foreground">Board-certified physicians with years of experience</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">24/7 Emergency Care</h4>
                      <p className="text-sm text-muted-foreground">Round-the-clock emergency services available</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Modern Facilities</h4>
                      <p className="text-sm text-muted-foreground">State-of-the-art equipment and comfortable environment</p>
                    </div>
                  </div>
                  
                  {/* New Feature */}
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Personalized Care</h4>
                      <p className="text-sm text-muted-foreground">Tailored treatment plans for each patient's unique needs</p>
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="mt-6 pt-4 border-t border-border">
                  <Button 
                    variant="primary" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => window.location.href = '/appointment-booking'}
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule an Appointment
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
