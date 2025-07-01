import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
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
    navigate('/appointment-booking', { state: { departmentId, departmentName: departments.find(d => d.id === departmentId)?.name } });
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
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(16, 185, 129, 0.8)), url('https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1920&h=1080&fit=crop')`
          }}
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/10 backdrop-blur-sm animate-float"
                style={{
                  width: `${Math.random() * 40 + 10}px`,
                  height: `${Math.random() * 40 + 10}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${Math.random() * 20 + 10}s`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 container-hospital text-center px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Expert Medical Services, <br />
              <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                Designed Around You
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Our world-class healthcare departments provide comprehensive care 
              with cutting-edge technology and compassionate experts.
            </p>
            <Button 
              variant="accent" 
              size="xl"
              onClick={() => {
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="shadow-xl hover:shadow-accent/30 transition-all duration-300"
            >
              <ChevronDown className="w-5 h-5 mr-2" />
              Explore Services
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Services Filter + Search Section */}
      <section 
        id="services-section" 
        className="py-12 md:py-20 bg-background relative z-10"
      >
        <div className="container-hospital px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Medical Services</h2>
              <p className="text-muted-foreground mt-2">Find specialized care from our expert departments</p>
            </div>
            
            {/* Search and filter */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="relative" ref={filterRef}>
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {activeCategory}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                
                {isFilterOpen && (
                  <Card premium className="absolute right-0 top-full mt-2 z-50 p-2 w-[200px]">
                    <div className="flex flex-col">
                      {categories.map((category) => (
                        <button
                          key={category}
                          className={`px-3 py-2 text-left rounded-lg ${
                            activeCategory === category 
                              ? 'bg-primary/10 text-primary font-medium' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            setActiveCategory(category);
                            setIsFilterOpen(false);
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
          
          {/* Services Grid */}
          {loading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading services...</p>
              </div>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {/* Show services first */}
              {filteredServices.length > 0 && filteredServices.map((service) => (
                <motion.div key={service.id} variants={itemVariants}>
                  <ServiceCard
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
                </motion.div>
              ))}
              
              {/* Then show departments */}
              {filteredDepartments.length > 0 && filteredServices.length === 0 && filteredDepartments.map((department) => (
                <motion.div key={department.id} variants={itemVariants}>
                  <ServiceCard
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
                </motion.div>
              ))}
              
              {/* Show "no results" if both are empty */}
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
            </motion.div>
          )}
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
