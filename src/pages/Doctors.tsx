import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import Badge from '../components/atoms/Badge';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Star,
  User,
  Clock,
  ChevronDown,
  BookOpen,
  Award,
  Heart,
  MessageCircle,
  UserCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Verified,
  Copy
} from 'lucide-react';
import Footer from '../components/organisms/Footer';

// Define interfaces
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department?: string;
  experience?: string;
  rating?: number;
  location?: string;
  bio?: string;
  image?: string;
  education?: string[];
  languages?: string[];
  availability?: {
    [key: string]: string[];
  };
  reviews?: Review[];
  verified?: boolean;
  createdAt?: any;
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: any;
}

interface AppointmentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  doctor: string;
  doctorId: string;
  department: string;
  message: string;
}

// Specialty options for filter
const specialtyOptions = [
  "All Specialties",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "Oncology",
  "Gynecology",
  "Urology",
  "Ophthalmology",
  "Psychiatry"
];

// Department options for filter
const departmentOptions = [
  "All Departments",
  "Emergency",
  "Outpatient",
  "Inpatient",
  "Surgery",
  "Intensive Care",
  "Radiology",
  "Laboratory",
  "Physical Therapy"
];

const Doctors = () => {
  // State variables
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [availabilityFilter, setAvailabilityFilter] = useState('Any Time');
  const [loading, setLoading] = useState(true);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState('about');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookingForm, setBookingForm] = useState<AppointmentFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    doctor: '',
    doctorId: '',
    department: '',
    message: ''
  });

  // Refs for animations
  const headerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const doctorsGridRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Helper function to generate available dates
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };
  
  const availableDates = generateAvailableDates();

  // Format date to display in a nice format
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  // Handle scroll animation
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      if (headerRef.current) {
        const opacity = Math.max(0, Math.min(1, 1 - scrollPosition / 300));
        headerRef.current.style.opacity = opacity.toString();
      }
      
      if (filtersRef.current) {
        if (scrollPosition > 300) {
          filtersRef.current.classList.add('sticky-filters');
        } else {
          filtersRef.current.classList.remove('sticky-filters');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch doctors data from Firebase
  useEffect(() => {
    const doctorsRef = collection(db, 'doctors');
    const doctorsQuery = query(doctorsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(doctorsQuery, (snapshot) => {
      try {
        const doctorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().name || 'Unknown Doctor',
          specialty: doc.data().specialty || 'General Medicine'
        })) as Doctor[];
        
        setDoctors(doctorsData);
        setFilteredDoctors(doctorsData);
        setLoading(false);
      } catch (error) {
        console.error('Error processing doctors data:', error);
        toast.error('Failed to load doctors');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Filter doctors based on search and filter selections
  useEffect(() => {
    let filtered = [...doctors];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(query) || 
        doctor.specialty.toLowerCase().includes(query) ||
        (doctor.department && doctor.department.toLowerCase().includes(query))
      );
    }
    
    // Apply specialty filter
    if (selectedSpecialty !== 'All Specialties') {
      filtered = filtered.filter(doctor => doctor.specialty === selectedSpecialty);
    }
    
    // Apply department filter
    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(doctor => doctor.department === selectedDepartment);
    }
    
    // Apply availability filter
    if (availabilityFilter !== 'Any Time') {
      // This would be implemented based on your availability data structure
      // For now, just a placeholder filter
      if (availabilityFilter === 'Today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(doctor => 
          doctor.availability && doctor.availability[today] && doctor.availability[today].length > 0
        );
      }
    }
    
    setFilteredDoctors(filtered);
  }, [searchQuery, selectedSpecialty, selectedDepartment, availabilityFilter, doctors]);

  // Open doctor profile modal
  const handleViewProfile = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
    setActiveTab('about');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  // Close doctor profile modal
  const handleCloseModal = () => {
    setShowDoctorModal(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  // Open booking modal
  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
    
    // Set initial booking form data
    setBookingForm({
      ...bookingForm,
      doctor: doctor.name,
      doctorId: doctor.id,
      department: doctor.department || doctor.specialty
    });
    
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  // Close booking modal
  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  // Handle date selection in booking modal
  const handleDateSelection = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    
    // Generate some available times for the selected date
    // In a real app, this would come from the doctor's availability in Firebase
    if (selectedDoctor && selectedDoctor.availability && selectedDoctor.availability[date]) {
      setAvailableTimes(selectedDoctor.availability[date]);
    } else {
      // Fallback to default times if no specific availability
      const defaultTimes = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
      setAvailableTimes(defaultTimes);
    }
    
    setBookingForm({
      ...bookingForm,
      date: date,
      time: ''
    });
  };

  // Handle time selection in booking modal
  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
    setBookingForm({
      ...bookingForm,
      time: time
    });
  };

  // Handle booking form input changes
  const handleBookingFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingForm({
      ...bookingForm,
      [name]: value
    });
  };

  // Submit booking form
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!bookingForm.firstName || !bookingForm.lastName || !bookingForm.email || 
        !bookingForm.phone || !bookingForm.date || !bookingForm.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // In a real app, you would save this appointment to Firebase
      // For now, just simulate the booking process
      toast.success('Appointment booked successfully!');
      handleCloseBookingModal();
      
      // Clear form
      setBookingForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        doctor: '',
        doctorId: '',
        department: '',
        message: ''
      });
      
      setSelectedDate('');
      setSelectedTime('');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    }
  };

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const // Use a valid string easing literal
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <motion.section 
        ref={headerRef}
        className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary/90 via-primary/80 to-secondary overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        {/* Abstract background animation */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-accent/20 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/30 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-primary-light/30 animate-blob animation-delay-4000"></div>
          </div>
        </div>
        
        <div className="container-hospital text-center relative z-10 px-4">
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Meet Our <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Expert Doctors</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            Our team of highly qualified physicians brings years of experience and dedication to providing exceptional patient care.
          </motion.p>
          
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut", repeat: 3, repeatType: "reverse" }}
          >
            <div className="w-8 h-12 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1 h-3 bg-white rounded-full animate-scroll-down"></div>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      {/* Filters Section */}
      <section ref={filtersRef} className="py-8 bg-background border-b border-border z-20">
        <div className="container-hospital px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search */}
              <div>
                <Input
                  label="Search Doctors"
                  placeholder="Search by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  className="w-full"
                />
              </div>
              
              {/* Specialty Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Specialty</label>
                <div className="relative">
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
                  >
                    {specialtyOptions.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                </div>
              </div>
              
              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Department</label>
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
                  >
                    {departmentOptions.map(department => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                </div>
              </div>
              
              {/* Availability Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Availability</label>
                <div className="relative">
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="w-full p-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none"
                  >
                    <option value="Any Time">Any Time</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="Custom Date">Custom Date</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Doctors Grid */}
      <section className="py-16 bg-background" ref={doctorsGridRef}>
        <div className="container-hospital px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading our expert doctors...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-foreground">
                  {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available
                </h2>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Filter className="w-4 h-4 mr-2" />
                  <span>
                    Showing results for: {selectedSpecialty} {selectedSpecialty !== 'All Specialties' && selectedDepartment !== 'All Departments' ? ' in ' : ''} 
                    {selectedDepartment !== 'All Departments' ? selectedDepartment : ''}
                  </span>
                </div>
              </div>
              
              {filteredDoctors.length > 0 ? (
                <motion.div 
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredDoctors.map((doctor) => (
                    <motion.div key={doctor.id} variants={itemVariants} className="h-full">
                      <Card premium hover className="overflow-hidden h-full group">
                        <div className="relative">
                          <div className="aspect-square overflow-hidden">
                            <img 
                              src={doctor.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face'} 
                              alt={`Dr. ${doctor.name}`}
                              className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
                            />
                          </div>
                          
                          {/* Verified badge */}
                          {doctor.verified && (
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-1">
                              <Verified className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          
                          {/* Online indicator */}
                          <div className="absolute top-4 right-4 w-6 h-6 bg-success rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse-soft"></div>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="text-center mb-4">
                            <h3 className="text-xl font-semibold text-foreground mb-1">
                              Dr. {doctor.name}
                            </h3>
                            <p className="text-primary font-medium mb-2">{doctor.specialty}</p>
                            {doctor.department && (
                              <div className="flex items-center justify-center mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {doctor.department}
                                </Badge>
                              </div>
                            )}
                            {doctor.experience && (
                              <p className="text-sm text-muted-foreground mb-2">{doctor.experience} experience</p>
                            )}
                            
                            {/* Rating */}
                            <div className="flex items-center justify-center mb-3">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(doctor.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className="ml-2 text-sm text-muted-foreground">({doctor.rating || '4.5'})</span>
                            </div>

                            {doctor.location && (
                              <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
                                <MapPin className="w-4 h-4 mr-1" />
                                {doctor.location}
                              </div>
                            )}

                            {doctor.bio && (
                              <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{doctor.bio}</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Button 
                              variant="primary" 
                              size="md" 
                              className="w-full"
                              onClick={() => handleBookAppointment(doctor)}
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Book Appointment
                            </Button>
                            <Button 
                              variant="outline" 
                              size="md" 
                              className="w-full"
                              onClick={() => handleViewProfile(doctor)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-border">
                  <User className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">No doctors found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any doctors matching your current filters.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('All Specialties');
                      setSelectedDepartment('All Departments');
                      setAvailabilityFilter('Any Time');
                    }}
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Doctor Profile Modal */}
      <AnimatePresence>
        {showDoctorModal && selectedDoctor && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            >
              {/* Close button */}
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              
              {/* Doctor header */}
              <div className="relative bg-gradient-to-r from-primary to-secondary text-white p-8 pb-20">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white mb-4 md:mb-0 md:mr-6">
                    <img 
                      src={selectedDoctor.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face'} 
                      alt={`Dr. ${selectedDoctor.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold mb-1">Dr. {selectedDoctor.name}</h2>
                    <p className="text-white/80 text-xl mb-3">{selectedDoctor.specialty}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      {selectedDoctor.department && (
                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
                          {selectedDoctor.department}
                        </Badge>
                      )}
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(selectedDoctor.rating || 4.5) ? 'text-yellow-300 fill-current' : 'text-white/30'}`}
                          />
                        ))}
                        <span className="ml-2">({selectedDoctor.rating || '4.5'})</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{selectedDoctor.location || 'Main Hospital'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Doctor content */}
              <div className="bg-white rounded-t-3xl -mt-12 relative z-10 p-8">
                {/* Tabs */}
                <div className="flex border-b border-border mb-6">
                  <button
                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'about' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('about')}
                  >
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      About
                    </div>
                  </button>
                  <button
                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'availability' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('availability')}
                  >
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Availability
                    </div>
                  </button>
                  <button
                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'reviews' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reviews
                    </div>
                  </button>
                </div>
                
                {/* Tab Content */}
                <div className="mb-8">
                  {activeTab === 'about' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      {/* Bio */}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">Biography</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {selectedDoctor.bio || `Dr. ${selectedDoctor.name} is a dedicated healthcare professional specializing in ${selectedDoctor.specialty}. With ${selectedDoctor.experience || 'years of'} experience, they are committed to providing excellent patient care and staying at the forefront of medical advancements in their field.`}
                        </p>
                      </div>
                      
                      {/* Education */}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">Education & Training</h3>
                        <ul className="space-y-3">
                          {selectedDoctor.education ? (
                            selectedDoctor.education.map((edu, index) => (
                              <li key={index} className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-foreground">{edu}</p>
                                </div>
                              </li>
                            ))
                          ) : (
                            <>
                              <li className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-foreground">M.D., University Medical School</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-foreground">Residency, General Hospital</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-foreground">Fellowship in {selectedDoctor.specialty}</p>
                                </div>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                      
                      {/* Languages */}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedDoctor.languages ? (
                            selectedDoctor.languages.map((language, index) => (
                              <Badge key={index} variant="secondary" className="px-3 py-1">
                                {language}
                              </Badge>
                            ))
                          ) : (
                            <>
                              <Badge variant="secondary" className="px-3 py-1">English</Badge>
                              <Badge variant="secondary" className="px-3 py-1">Spanish</Badge>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Specializations */}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">Specializations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center p-3 border border-border rounded-lg">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <Award className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{selectedDoctor.specialty}</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 border border-border rounded-lg">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <Heart className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Patient Care</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'availability' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-4">Upcoming Availability</h3>
                        <p className="text-muted-foreground mb-6">
                          Select a date to check Dr. {selectedDoctor.name}'s availability and book your appointment.
                        </p>
                        
                        {/* Date selector */}
                        <div className="mb-8">
                          <h4 className="text-md font-medium text-foreground mb-3">Select Date</h4>
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {availableDates.map((date) => (
                              <button
                                key={date}
                                onClick={() => handleDateSelection(date)}
                                className={`px-4 py-3 rounded-xl border min-w-[100px] transition-colors ${
                                  selectedDate === date 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'border-border hover:border-primary/50 text-foreground'
                                }`}
                              >
                                {formatDate(date)}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Time slots */}
                        {selectedDate && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                          >
                            <h4 className="text-md font-medium text-foreground mb-3">Available Time Slots</h4>
                            {availableTimes.length > 0 ? (
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {availableTimes.map((time) => (
                                  <button
                                    key={time}
                                    onClick={() => handleTimeSelection(time)}
                                    className={`py-2 px-3 rounded-lg border text-center transition-colors ${
                                      selectedTime === time
                                      ? 'bg-primary text-white border-primary' 
                                      : 'border-border hover:border-primary/50 text-foreground'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No available slots for this date.</p>
                            )}
                          </motion.div>
                        )}
                        
                        {selectedDate && selectedTime && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center"
                          >
                            <Button 
                              variant="primary" 
                              size="lg"
                              onClick={() => {
                                setShowDoctorModal(false);
                                setShowBookingModal(true);
                                setBookingForm({
                                  ...bookingForm,
                                  doctor: selectedDoctor.name,
                                  doctorId: selectedDoctor.id,
                                  department: selectedDoctor.department || selectedDoctor.specialty,
                                  date: selectedDate,
                                  time: selectedTime
                                });
                              }}
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Book This Slot
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'reviews' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold text-foreground mb-3">Patient Reviews</h3>
                        
                        {/* Rating summary */}
                        <div className="flex items-center mb-6">
                          <div className="text-4xl font-bold text-foreground mr-4">{selectedDoctor.rating || '4.5'}</div>
                          <div>
                            <div className="flex mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${i < Math.floor(selectedDoctor.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">Based on {selectedDoctor.reviews?.length || 24} reviews</p>
                          </div>
                        </div>
                        
                        {/* Reviews list */}
                        <div className="space-y-6">
                          {selectedDoctor.reviews ? (
                            selectedDoctor.reviews.map((review) => (
                              <div key={review.id} className="border-b border-border pb-6">
                                <div className="flex items-center mb-2">
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                                    <UserCheck className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{review.patientName}</p>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                      <span className="text-xs text-muted-foreground ml-2">
                                        {formatDate(review.date?.toDate?.() || new Date())}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-muted-foreground mt-2">{review.comment}</p>
                              </div>
                            ))
                          ) : (
                            // Sample reviews if none exist
                            <>
                              <div className="border-b border-border pb-6">
                                <div className="flex items-center mb-2">
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                                    <UserCheck className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">Sarah Johnson</p>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                      <span className="text-xs text-muted-foreground ml-2">2 weeks ago</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-muted-foreground mt-2">
                                  Dr. {selectedDoctor.name} was excellent! Very thorough and took the time to explain 
                                  everything in detail. I felt comfortable and well-cared for during my visit.
                                </p>
                              </div>
                              
                              <div className="border-b border-border pb-6">
                                <div className="flex items-center mb-2">
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                                    <UserCheck className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">Michael Smith</p>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                      <span className="text-xs text-muted-foreground ml-2">1 month ago</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-muted-foreground mt-2">
                                  Great experience with Dr. {selectedDoctor.name}. They were knowledgeable and professional.
                                  The office staff was also very helpful with scheduling and insurance questions.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* CTA */}
                <div className="flex justify-center">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="px-8"
                    onClick={() => {
                      handleCloseModal();
                      handleBookAppointment(selectedDoctor);
                    }}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedDoctor && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            >
              {/* Close button */}
              <button 
                onClick={handleCloseBookingModal}
                className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              
              {/* Booking header */}
              <div className="bg-primary text-white p-6">
                <h2 className="text-2xl font-bold mb-1">Book an Appointment</h2>
                <p className="text-white/80">
                  with Dr. {selectedDoctor.name} • {selectedDoctor.specialty}
                </p>
              </div>
              
              {/* Booking form */}
              <div className="p-6">
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Selected Date & Time */}
                  {(bookingForm.date && bookingForm.time) && (
                    <div className="bg-muted/30 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                          <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Selected Slot</p>
                          <p className="text-lg font-medium text-foreground">
                            {formatDate(bookingForm.date)} at {bookingForm.time}
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDate('');
                          setSelectedTime('');
                          setBookingForm({
                            ...bookingForm,
                            date: '',
                            time: ''
                          });
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                  
                  {/* Date and Time selection if not already selected */}
                  {(!bookingForm.date || !bookingForm.time) && (
                    <div className="space-y-6">
                      {/* Date selector */}
                      <div>
                        <h4 className="text-md font-medium text-foreground mb-3">Select Date</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                          {availableDates.map((date) => (
                            <button
                              type="button"
                              key={date}
                              onClick={() => handleDateSelection(date)}
                              className={`px-4 py-3 rounded-xl border min-w-[100px] transition-colors ${
                                selectedDate === date 
                                ? 'bg-primary text-white border-primary' 
                                : 'border-border hover:border-primary/50 text-foreground'
                              }`}
                            >
                              {formatDate(date)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Time slots */}
                      {selectedDate && (
                        <div>
                          <h4 className="text-md font-medium text-foreground mb-3">Available Time Slots</h4>
                          {availableTimes.length > 0 ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                              {availableTimes.map((time) => (
                                <button
                                  type="button"
                                  key={time}
                                  onClick={() => handleTimeSelection(time)}
                                  className={`py-2 px-3 rounded-lg border text-center transition-colors ${
                                    selectedTime === time
                                    ? 'bg-primary text-white border-primary' 
                                    : 'border-border hover:border-primary/50 text-foreground'
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No available slots for this date.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          name="firstName"
                          value={bookingForm.firstName}
                          onChange={handleBookingFormChange}
                          placeholder="Enter your first name"
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          name="lastName"
                          value={bookingForm.lastName}
                          onChange={handleBookingFormChange}
                          placeholder="Enter your last name"
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={bookingForm.email}
                          onChange={handleBookingFormChange}
                          placeholder="Enter your email address"
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <Input
                          name="phone"
                          value={bookingForm.phone}
                          onChange={handleBookingFormChange}
                          placeholder="Enter your phone number"
                          required
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Reason for Visit
                    </label>
                    <textarea
                      name="message"
                      value={bookingForm.message}
                      onChange={handleBookingFormChange}
                      placeholder="Please describe briefly the reason for your visit"
                      className="w-full p-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                      rows={3}
                    />
                  </div>
                  
                  {/* Submit button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg" 
                      className="w-full"
                      disabled={!bookingForm.date || !bookingForm.time || !bookingForm.firstName || !bookingForm.lastName || !bookingForm.email || !bookingForm.phone}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Confirm Appointment
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      By confirming this appointment, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer variant="simple" />
      
      {/* Add some CSS for animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes scroll-down {
          0% {
            transform: translateY(-4px);
            opacity: 0;
          }
          50% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(4px);
            opacity: 0;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite alternate;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-scroll-down {
          animation: scroll-down 1.5s infinite;
        }
        
        .animate-pulse-soft {
          animation: pulse 2s infinite;
        }
        
        .sticky-filters {
          position: sticky;
          top: 0;
          z-index: 30;
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1rem 0;
          transition: all 0.3s ease;
        }
        
        /* Custom scrollbar for date selector */
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default Doctors;
