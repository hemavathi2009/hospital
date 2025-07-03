import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, Filter, ChevronDown, X, Calendar } from 'lucide-react';
import { Service } from '../types/service';
import { getVisibleServices } from '../lib/serviceFirebase';

// Components
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import ServiceCard from '../components/molecules/ServiceCard';
import ServiceModal from '../components/organisms/ServiceModal';

// Types
interface Department {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  icon: string;
  image: string;
  category: string;
  specializations: string[];
  availability: {
    days: string[];
    hours: string;
  };
  features: string[];
  available24h?: boolean;
}

const Services: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const filterRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch services from Firebase using our service helper
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const servicesData = await getVisibleServices();
        setServices(servicesData);
        setFilteredServices(servicesData);
        console.log('Fetched services:', servicesData.length);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  // Fetch departments from Firebase
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsRef = collection(db, 'departments');
        const q = query(departmentsRef, orderBy('name'));
        const snapshot = await getDocs(q);
        
        const fetchedDepartments: Department[] = [];
        const uniqueCategories = new Set<string>();
        uniqueCategories.add('All');
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Department, 'id'>;
          const department: Department = {
            id: doc.id,
            ...data
          };
          
          fetchedDepartments.push(department);
          
          // Collect unique categories
          if (department.category) {
            uniqueCategories.add(department.category);
          }
        });
        
        setDepartments(fetchedDepartments);
        setFilteredDepartments(fetchedDepartments);
        setCategories(Array.from(uniqueCategories));
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    
    fetchDepartments();
  }, []);

  // Set up real-time listener for facilities
  useEffect(() => {
    const facilitiesRef = collection(db, 'facilities');
    const q = query(facilitiesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const facilitiesData: Department[] = [];
      snapshot.forEach((doc) => {
        facilitiesData.push({
          id: doc.id,
          ...doc.data()
        } as Department);
      });
      
      setDepartments(facilitiesData);
      setFilteredDepartments(facilitiesData);
      console.log('Real-time facilities update:', facilitiesData.length);
    }, (error) => {
      console.error("Error fetching facilities:", error);
    });

    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);
  
  // Set up real-time listener for services
  useEffect(() => {
    const servicesRef = collection(db, 'services');
    
    // Option 1: Split into two queries - first get all services, then filter in code
    const q = query(
      servicesRef,
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs
        .map(doc => {
          const data = doc.data() as Service;
          return {
            id: doc.id,
            ...data
          };
        })
        .filter(service => service.visible === true);
      
      setServices(servicesData);
      setFilteredServices(servicesData);
      console.log('Real-time services update:', servicesData.length);
    }, (error) => {
      console.error("Error fetching services:", error);
    });

    // Clean up listener on component unmount
    return () => unsubscribe();
  }, []);

  // Filter departments based on search query and active category
  useEffect(() => {
    let results = departments;
    
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(dept => 
        dept.name.toLowerCase().includes(lowerQuery) || 
        dept.description.toLowerCase().includes(lowerQuery) ||
        dept.shortDescription.toLowerCase().includes(lowerQuery) ||
        (dept.specializations && dept.specializations.some(spec => 
          spec.toLowerCase().includes(lowerQuery)
        ))
      );
    }
    
    // Filter by category
    if (activeCategory !== 'All') {
      results = results.filter(dept => dept.category === activeCategory);
    }
    
    setFilteredDepartments(results);
  }, [searchQuery, activeCategory, departments]);
  
  // Filter services based on search query and active category
  useEffect(() => {
    let results = services;
    
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(service => 
        service.name.toLowerCase().includes(lowerQuery) || 
        service.description.toLowerCase().includes(lowerQuery) ||
        service.shortDescription?.toLowerCase().includes(lowerQuery) ||
        (service.features && service.features.some(feature => 
          feature.toLowerCase().includes(lowerQuery)
        ))
      );
    }
    
    // Filter by category
    if (activeCategory !== 'All') {
      results = results.filter(service => service.category === activeCategory);
    }
    
    setFilteredServices(results);
  }, [searchQuery, activeCategory, services]);

  // Update categories when departments or services change
  useEffect(() => {
    const uniqueCategories = new Set<string>();
    uniqueCategories.add('All');
    
    // Add department categories
    departments.forEach(dept => {
      if (dept.category) {
        uniqueCategories.add(dept.category);
      }
    });
    
    // Add service categories
    services.forEach(service => {
      if (service.category) {
        uniqueCategories.add(service.category);
      }
    });
    
    setCategories(Array.from(uniqueCategories));
  }, [departments, services]);

  // Handle learn more click for departments
  const handleLearnMore = (department: Department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  // Handle service card click to open service details
  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  // Handle book appointment click
  const handleBookAppointment = (departmentId: string) => {
    navigate('/appointment-booking', { 
      state: { 
        departmentId, 
        departmentName: departments.find(d => d.id === departmentId)?.name 
      } 
    });
  };

  // Handle book service appointment
  const handleBookServiceAppointment = (serviceId: string) => {
    navigate('/appointment-booking', { 
      state: { 
        serviceId, 
        serviceName: services.find(s => s.id === serviceId)?.name 
      } 
    });
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animation variants
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Enlarged Hero Section with Enhanced Visual Elements */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Enhanced Overlay */}
        <div className="absolute inset-0 w-full h-full">
          {/* Improved gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-secondary/95 z-10"></div>
          <div className="absolute inset-0 bg-black/30 z-[9]"></div>
          <img
            src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=1920&h=1080&fit=crop"
            alt="Medical services"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Enhanced pattern overlay for better text visibility */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20 z-[11]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] z-[12] opacity-30"></div>
          
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent animate-pulse-slow z-[13] opacity-60"></div>
        
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 border-4 border-white/5 rounded-full animate-spin-slow hidden md:block"></div>
          <div className="absolute top-40 left-[10%] w-20 h-20 border-2 border-accent/20 rounded-full animate-bounce-slow hidden md:block"></div>
          
          {/* Medical icons */}
          <svg className="absolute bottom-[20%] left-[5%] w-16 h-16 text-white/10 animate-float-slow hidden md:block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          
          <svg className="absolute top-[30%] right-[10%] w-20 h-20 text-white/10 animate-float-slow hidden md:block" style={{ animationDelay: '1s' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 3.5C17.8284 4.32843 18.5 5.35857 19 6.5C19.5 7.64143 19.8284 8.82843 20 10.1716" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.5 17C4.32843 16.1716 5.35857 15.5 6.5 15C7.64143 14.5 8.82843 14.1716 10.1716 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {/* Enhanced Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 container-hospital py-28"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="inline-flex items-center px-5 py-3 rounded-full bg-white/15 backdrop-blur-lg text-base font-medium text-white shadow-glow"
              >
                <div className="relative mr-3">
                  <div className="w-3 h-3 rounded-full bg-accent animate-pulse-soft"></div>
                  <div className="absolute -inset-1 rounded-full bg-accent/30 animate-ripple"></div>
                </div>
                Comprehensive Healthcare
              </motion.div>
              
              <h1 className="text-5xl lg:text-8xl font-bold leading-tight text-white drop-shadow-lg">
                {/* Redesigned "Our Medical Services" for premium look and visibility */}
                <span className="block">
                  <span className="text-[2.7rem] lg:text-[5rem] font-extrabold tracking-tight relative z-20">
                    <span
                      className="
                        // bg-gradient-to-r from-[#1e293b] via-primary to-[#eab308]
                        // bg-clip-text text-transparent
                        // drop-shadow-[0_2px_16px_rgba(30,41,59,0.25)]
                        // shadow-black/30
                        relative
                      "
                      style={{
                        WebkitTextStroke: '1.5px rgba(255,255,255,0.18)',
                        filter: 'brightness(0.95) contrast(1.15)',
                      }}
                    >
                      Our Medical&nbsp;
                      <span className="relative">
                        <span
                          className="
                            bg-gradient-to-r from-accent via-primary to-white
                            bg-clip-text text-transparent
                            font-extrabold
                            animate-pulse-slow
                            shadow-glow
                            px-2
                            rounded
                            relative
                            z-20
                          "
                          style={{
                            WebkitTextStroke: '1.5px rgba(255,255,255,0.22)',
                            filter: 'brightness(0.93) contrast(1.18)',
                          }}
                        >
                          Services
                        </span>
                        {/* Subtle glow and outline for visibility */}
                        <span
                          className="absolute -inset-2 rounded blur-[6px] bg-accent/20 opacity-60 -z-10"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </span>
                  {/* Enhanced underline effect */}
                  <span className="block mt-2 w-full h-2 relative">
                    <span className="absolute left-0 right-0 h-2 bg-gradient-to-r from-accent/30 via-primary/40 to-white/10 rounded-full blur-[2px] opacity-80"></span>
                    <span className="absolute left-1/4 right-1/4 h-1 bg-accent/60 rounded-full blur-[1px] opacity-70"></span>
                  </span>
                </span>
              </h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-xl md:text-2xl text-white leading-relaxed max-w-2xl font-light text-shadow-glow backdrop-blur-sm bg-white/5 p-6 rounded-xl border border-white/10"
              >
                Discover our wide range of specialized healthcare services designed to provide 
                exceptional care for you and your family at every stage of life.
              </motion.p>
              
              {/* Enhanced CTAs */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 pt-6"
              >
                <Link to="/appointment-booking">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="accent" 
                      size="xl" 
                      className="shadow-lg hover:shadow-xl text-lg px-8 py-6 font-bold"
                    >
                      <span className="flex items-center">
                        <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 14H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 14H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 14H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 18H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Book an Appointment
                      </span>
                    </Button>
                  </motion.div>
                </Link>
                
                <Link to="#service-list">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline" 
                      size="xl" 
                      className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6 font-bold"
                    >
                      <span className="flex items-center">
                        <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Explore Services
                      </span>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
                
            </div>

            {/* Decorative Element */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-2xl h-64 transform translate-y-8">
                    <img 
                      src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&h=750&fit=crop" 
                      alt="Medical procedure"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-2xl h-44 bg-white p-6">
                    <div className="flex items-center h-full">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-4xl font-bold text-primary">24/7</span>
                        </div>
                        <p className="text-muted-foreground">Emergency Care Available</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-2xl h-44 bg-gradient-to-br from-accent to-secondary p-6">
                    <div className="h-full flex flex-col justify-center">
                      <h3 className="text-2xl font-bold text-white mb-2">50+</h3>
                      <p className="text-white/90">Specialized Services</p>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-2xl h-64 transform translate-y-(-8)">
                    <img 
                      src="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500&h=750&fit=crop" 
                      alt="Medical consultation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
          {/* Scroll indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer"
            onClick={() => document.getElementById('services-list')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="flex flex-col items-center text-white">
              <span className="text-sm font-medium mb-2">Scroll to explore</span>
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </div>
          </motion.div>
        </section>
      
      {/* Services Categories Section */}
      <section id="services-list" className="py-20">
        <div className="container-hospital px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.length > 0 && filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={{
                  id: service.id,
                  title: service.name,
                  description: service.shortDescription || service.description,
                  icon: service.iconUrl ? (
                    <img 
                      src={service.iconUrl} 
                      alt={service.name} 
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary/20 rounded-full" />
                  ),
                  features: service.features || [],
                  available24h: service.available24h
                }}
                onLearnMore={() => handleServiceClick(service)}
                onBookAppointment={() => handleBookServiceAppointment(service.id)}
              />
            ))}
            
            {filteredDepartments.length > 0 && filteredServices.length === 0 && filteredDepartments.map((department) => (
              <ServiceCard
                key={department.id}
                service={{
                  id: department.id,
                  title: department.name,
                  description: department.shortDescription,
                  icon: department.icon ? (
                    <img 
                      src={department.icon} 
                      alt={department.name} 
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary/20 rounded-full" />
                  ),
                  features: department.features || [],
                  available24h: department.available24h
                }}
                onLearnMore={() => handleLearnMore(department)}
                onBookAppointment={() => handleBookAppointment(department.id)}
              />
            ))}
            
            {filteredServices.length === 0 && filteredDepartments.length === 0 && (
              <div className="col-span-3 p-12 text-center bg-muted/30 rounded-xl border border-border">
                <h3 className="text-xl font-semibold mb-3">No services match your search</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <Button 
                  variant="primary"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Show All Services
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Appointment CTA Banner */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/90 via-primary to-secondary/90 text-white">
        <div className="container-hospital px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to prioritize your health?</h2>
              <p className="text-white/80 text-lg">
                Schedule an appointment with our specialists and take the first step toward better health and wellness.
              </p>
            </div>
            <Button
              variant="accent"
              size="xl"
              className="shadow-xl hover:shadow-accent/30 transition-all duration-300 whitespace-nowrap"
              onClick={() => navigate('/appointments')}
            >
              Book Your Appointment
            </Button>
          </div>
        </div>
      </section>

      {/* Department Modal */}
      {isModalOpen && selectedDepartment && (
        <ServiceModal
          department={selectedDepartment}
          onClose={() => setIsModalOpen(false)}
          onBookAppointment={() => handleBookAppointment(selectedDepartment.id)}
        />
      )}

      {/* Service Modal for services section */}
      {isServiceModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Service Image Header */}
              <div className="h-56 bg-gradient-to-r from-primary to-secondary overflow-hidden">
                {selectedService.imageUrl ? (
                  <img 
                    src={selectedService.imageUrl} 
                    alt={selectedService.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-white text-xl">No Image Available</div>
                  </div>
                )}
              </div>
              
              {/* Close button */}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={() => setIsServiceModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">{selectedService.name}</h2>
              <p className="text-muted-foreground mb-6">{selectedService.description}</p>
              
              {/* Duration */}
              {selectedService.duration && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Duration</h3>
                  <p className="text-muted-foreground">
                    Approximately {selectedService.duration} minutes
                  </p>
                </div>
              )}
              
              {/* Preparation instructions */}
              {selectedService.preparationInstructions && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Preparation Instructions</h3>
                  <p className="text-muted-foreground">
                    {selectedService.preparationInstructions}
                  </p>
                </div>
              )}
              
              {/* Features */}
              {selectedService.features && selectedService.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedService.features.map((feature, index) => (
                      <li key={index} className="text-muted-foreground">{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Availability */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-sm text-muted-foreground">Availability:</span>
                  <span className="ml-2 font-medium">
                    {selectedService.available24h ? '24/7 Available' : 'During Hospital Hours'}
                  </span>
                </div>
                
                {selectedService.category && (
                  <div>
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <span className="ml-2 font-medium">{selectedService.category}</span>
                  </div>
                )}
              </div>
              
              {/* Appointment button */}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsServiceModalOpen(false);
                    navigate('/appointment-booking', { 
                      state: { 
                        serviceId: selectedService.id,
                        serviceName: selectedService.name
                      }
                    });
                  }}
                >
                  Book Appointment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Services;
