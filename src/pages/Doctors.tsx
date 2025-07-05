import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import DoctorDetailModal from '../components/molecules/DoctorDetailModal';
import { Doctor } from '../types/doctor';
import {
  Search,
  Filter,
  User,
  ChevronDown,
  X,
  Calendar,
  Clock
} from 'lucide-react';
import Footer from '../components/organisms/Footer';
import { useIsMobile } from '../hooks/use-mobile';

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
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
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
    
    setFilteredDoctors(filtered);
  }, [searchQuery, selectedSpecialty, selectedDepartment, doctors]);

  // Show doctor profile in modal
  const handleViewProfile = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  // Navigate to appointment page with doctor pre-selected
  const handleBookAppointment = (doctor: Doctor) => {
    navigate('/appointment-booking', {
      state: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        departmentName: doctor.department || doctor.specialty
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Hero Section - Enhanced with animated elements and info cards */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.svg')] opacity-10"></div>
          <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-accent/10 mix-blend-overlay animate-blob"></div>
          <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-secondary/20 mix-blend-overlay animate-blob animation-delay-2000"></div>
          <div className="absolute top-[50%] right-[15%] w-40 h-40 rounded-full bg-white/10 mix-blend-overlay animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container-hospital px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium mb-6">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse mr-2"></div>
              <span>Expert Healthcare Professionals</span>
            </div>
            
            <motion.h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Meet Our Expert <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Doctors</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl opacity-90 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Our team of highly qualified healthcare professionals brings years of experience and specialized expertise to provide you with exceptional care and personalized treatment.
            </motion.p>
            
            {/* Search Bar */}
            <motion.div 
              className="relative max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name, specialty, or department..."
                className="pl-10 pr-4 py-3 text-foreground rounded-lg border-none shadow-lg w-full focus:ring-2 focus:ring-accent/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </motion.div>
            
            {/* Specialty Quick Links */}
            <motion.div
              className="mt-8 flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {specialtyOptions.slice(1, 6).map((specialty, index) => (
                <button
                  key={specialty}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${selectedSpecialty === specialty 
                      ? 'bg-accent text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  onClick={() => setSelectedSpecialty(specialty)}
                >
                  {specialty}
                </button>
              ))}
              <button
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-all"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('All Specialties');
                  setSelectedDepartment('All Departments');
                }}
              >
                View All
              </button>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Filter Section - Enhanced with modern design */}
      <section className="py-6 bg-muted/10 border-y border-muted/20">
        <div className="container-hospital px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              
              {isMobile && (
                <button 
                  className="ml-2 p-2 rounded-md hover:bg-muted/40"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto ${isMobile && !showFilters ? 'hidden' : 'block'}`}>
              {/* Specialty Filter */}
              <div className="relative">
                <label className="text-xs text-muted-foreground absolute -top-2.5 left-2 px-1 bg-background">Specialty</label>
                <select
                  className="w-full rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm appearance-none pr-8 h-11 transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                  {specialtyOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
              </div>
              
              {/* Department Filter */}
              <div className="relative">
                <label className="text-xs text-muted-foreground absolute -top-2.5 left-2 px-1 bg-background">Department</label>
                <select
                  className="w-full rounded-md border border-muted-foreground/20 bg-background px-3 py-2 text-sm appearance-none pr-8 h-11 transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  {departmentOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 text-sm text-muted-foreground flex items-center">
            <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
            Showing {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
            {searchQuery && ` for "${searchQuery}"`}
            {selectedSpecialty !== 'All Specialties' && ` in ${selectedSpecialty}`}
            {selectedDepartment !== 'All Departments' && ` from ${selectedDepartment}`}
          </div>
        </div>
      </section>
      
      {/* Doctors Grid Section */}
      <section className="py-12 flex-grow">
        <div className="container-hospital px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium text-foreground">Loading doctors...</p>
              <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch the best healthcare professionals for you</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-12 bg-muted/5 rounded-xl border border-muted/20 p-8">
              <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No doctors found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any doctors matching your search criteria. Try adjusting your filters or search term.
              </p>
              <Button 
                variant="outline" 
                className="border-primary/50 hover:bg-primary/5"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('All Specialties');
                  setSelectedDepartment('All Departments');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map(doctor => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -5 }}
                >
                  <Card premium hover className="p-6 h-full flex flex-col overflow-hidden relative group">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-bl from-primary/5 to-transparent -z-0 group-hover:scale-110 transition-transform duration-500"></div>
                    
                    {/* Doctor Image */}
                    <div className="relative mb-4 mx-auto">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary p-0.5 shadow-xl">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                          {doctor.image ? (
                            <img 
                              src={doctor.image} 
                              alt={doctor.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <User className="w-10 h-10 text-primary" />
                          )}
                        </div>
                      </div>
                      {doctor.verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Doctor Info */}
                    <div className="text-center mb-4 flex-grow relative z-10">
                      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        Dr. {doctor.name}
                      </h3>
                      <div className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full mb-2">
                        {doctor.specialty}
                      </div>
                      {doctor.department && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {doctor.department}
                        </p>
                      )}
                      {doctor.experience && (
                        <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          {doctor.experience} experience
                        </p>
                      )}
                      {doctor.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {doctor.bio}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2 mt-auto relative z-10">
                      <Button 
                        variant="primary" 
                        className="w-full group-hover:shadow-lg transition-all"
                        onClick={() => handleBookAppointment(doctor)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full hover:bg-primary/5 transition-colors"
                        onClick={() => handleViewProfile(doctor)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section - Enhanced with better visuals */}
      <section className="py-16 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.svg')] opacity-5"></div>
        
        <div className="container-hospital px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 md:p-12 text-white text-center shadow-xl relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">Need an appointment with one of our specialists?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto relative z-10">
              Our team of specialists is ready to provide you with personalized care. Schedule your appointment today and take the first step towards better health.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="accent" 
                size="lg"
                onClick={() => navigate('/appointment-booking')}
                className="shadow-lg relative z-10"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book an Appointment
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
      
      {/* Doctor Detail Modal */}
      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookAppointment={handleBookAppointment}
      />
    </div>
  );
};

export default Doctors;
