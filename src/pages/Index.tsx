import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navigation from '../components/organisms/Navigation';
import Button from '../components/atoms/Button';
import Card from '../components/atoms/Card';
import { 
  Heart, 
  Brain, 
  Eye, 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone,
  Mail,
  Star,
  Users,
  Award,
  Shield,
  ChevronDown,
  ArrowRight,
  FileText,
  Activity,
  Building,
  CheckCircle
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { TypeAnimation } from 'react-type-animation';
import Footer from '../components/organisms/Footer';

const Index = () => {
  // Refs for scroll animations
  const heroRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  
  // State for dynamic data
  const [doctors, setDoctors] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
  
  // Parallax scrolling effect
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -150]);
  const ctaBackground = useTransform(scrollYProgress, [0.7, 1], [0, -100]);
  
  // Working hours data
  const workingHours = [
    { day: 'Monday', hours: '8:00 AM - 8:00 PM', isOpen: true },
    { day: 'Tuesday', hours: '8:00 AM - 8:00 PM', isOpen: true },
    { day: 'Wednesday', hours: '8:00 AM - 8:00 PM', isOpen: true },
    { day: 'Thursday', hours: '8:00 AM - 8:00 PM', isOpen: true },
    { day: 'Friday', hours: '8:00 AM - 8:00 PM', isOpen: true },
    { day: 'Saturday', hours: '8:00 AM - 6:00 PM', isOpen: true },
    { day: 'Sunday', hours: '10:00 AM - 4:00 PM', isOpen: true, isLimited: true },
  ];

  // Department data
  const departments = [
    {
      id: '1',
      title: 'Cardiology',
      description: 'Expert care for heart conditions with state-of-the-art diagnostics.',
      icon: <Heart className="w-8 h-8 text-primary" />,
      image: 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=500&h=350&fit=crop',
      doctors: 12,
      services: 8
    },
    {
      id: '2',
      title: 'Neurology',
      description: 'Specialized care for brain and nervous system disorders.',
      icon: <Brain className="w-8 h-8 text-primary" />,
      image: 'https://images.unsplash.com/photo-1581595219315-a187dd40c322?w=500&h=350&fit=crop',
      doctors: 8,
      services: 6
    },
    {
      id: '3',
      title: 'Ophthalmology',
      description: 'Comprehensive eye care from routine exams to complex surgeries.',
      icon: <Eye className="w-8 h-8 text-primary" />,
      image: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=500&h=350&fit=crop',
      doctors: 6,
      services: 10
    },
    {
      id: '4',
      title: 'General Medicine',
      description: 'Primary healthcare services with preventive approach.',
      icon: <Stethoscope className="w-8 h-8 text-primary" />,
      image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500&h=350&fit=crop',
      doctors: 15,
      services: 12
    },
    {
      id: '5',
      title: 'Pediatrics',
      description: 'Specialized healthcare for infants, children and adolescents.',
      icon: <Users className="w-8 h-8 text-primary" />,
      image: 'https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=500&h=350&fit=crop',
      doctors: 9,
      services: 7
    },
    {
      id: '6',
      title: 'Radiology',
      description: 'Advanced imaging services with expert analysis and diagnosis.',
      icon: <FileText className="w-8 h-8 text-primary" />,
      image: 'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=500&h=350&fit=crop',
      doctors: 6,
      services: 9
    },
  ];

  // Facilities data - enhanced with more details
  const facilities = [
    { 
      name: 'Emergency Care',
      icon: <Activity className="w-8 h-8" />,
      description: '24/7 emergency services with rapid response teams',
      highlights: ['Critical care specialists', 'Advanced life support', 'Trauma center'],
      available24h: true,
      imageSrc: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&h=350&fit=crop'
    },
    { 
      name: 'Advanced Lab Services', 
      icon: <FileText className="w-8 h-8" />, 
      description: 'State-of-the-art laboratory testing facilities for accurate diagnostics',
      highlights: ['Rapid test results', 'Specialized testing', 'Research capabilities'],
      available24h: false,
      imageSrc: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&h=350&fit=crop'
    },
    { 
      name: 'Hospital Pharmacy', 
      icon: <Award className="w-8 h-8" />, 
      description: 'Full-service pharmacy with prescription delivery and medication management',
      highlights: ['Electronic prescriptions', 'Home delivery', 'Medication counseling'],
      available24h: true,
      imageSrc: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&h=350&fit=crop'
    },
    { 
      name: 'Diagnostic Imaging', 
      icon: <Eye className="w-8 h-8" />, 
      description: 'Advanced imaging including MRI, CT, PET scans and ultrasound technology',
      highlights: ['3T MRI scanner', 'Low-radiation CT', 'Immediate results'],
      available24h: false,
      imageSrc: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&h=350&fit=crop'
    },
    { 
      name: 'Surgical Center', 
      icon: <Stethoscope className="w-8 h-8" />, 
      description: 'Modern operating rooms with advanced robotics and minimally invasive technology',
      highlights: ['Robotic surgery', 'Same-day procedures', 'Expert surgical teams'],
      available24h: true,
      imageSrc: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=500&h=350&fit=crop'
    },
    { 
      name: 'Rehabilitation Services', 
      icon: <Users className="w-8 h-8" />, 
      description: 'Comprehensive physical, occupational, and speech therapy for all ages',
      highlights: ['Individualized care plans', 'Modern equipment', 'Experienced therapists'],
      available24h: false,
      imageSrc: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=350&fit=crop'
    }
  ];

  // Load doctors and testimonials from Firebase
  useEffect(() => {
    // Load featured doctors
    const doctorsRef = collection(db, 'doctors');
    const doctorsQuery = query(doctorsRef, orderBy('rating', 'desc'), limit(6));
    
    const unsubscribeDoctors = onSnapshot(doctorsQuery, (snapshot) => {
      const doctorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsData);
    }, (error) => {
      console.error('Error loading doctors:', error);
    });
    
    // Load testimonials
    const testimonialsRef = collection(db, 'testimonials');
    const testimonialsQuery = query(testimonialsRef, orderBy('date', 'desc'), limit(6));
    
    const unsubscribeTestimonials = onSnapshot(testimonialsQuery, (snapshot) => {
      const testimonialsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTestimonials(testimonialsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading testimonials:', error);
      setLoading(false);
    });
    
    return () => {
      unsubscribeDoctors();
      unsubscribeTestimonials();
    };
  }, []);
  
  // Newsletter subscription
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    try {
      await addDoc(collection(db, 'newsletter'), {
        email,
        subscribedAt: new Date()
      });
      toast.success('Thanks for subscribing to our newsletter!');
      setEmail('');
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Failed to subscribe. Please try again.');
    }
  };
  
  const handleScrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navigation />
      
      {/* Hero Section with Video Background */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/70 to-secondary/80 z-10"></div>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://res.cloudinary.com/dobktsnix/video/upload/v1624309712/hospital/medical_background.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Hero Content */}
        <motion.div 
          style={{ y: heroY }} 
          className="relative z-20 container-hospital section-padding text-white"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse-soft"></div>
                Excellence in Healthcare
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Your Health,{" "}
                <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                  <TypeAnimation 
                    sequence={[
                      'Our Priority',
                      2000,
                      'Our Passion',
                      2000,
                      'Our Promise',
                      2000
                    ]}
                    wrapper="span"
                    speed={50}
                    repeat={Infinity}
                  />
                </span>
              </h1>
              
              <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                Experience world-class healthcare with our team of expert physicians, 
                state-of-the-art facilities, and personalized care that puts you first.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/appointment-booking">
                  <Button 
                    variant="accent" 
                    size="xl" 
                    className="shadow-lg hover:shadow-xl"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Appointment
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={() => handleScrollTo(testimonialsRef)}
                  className="border-white text-white hover:bg-white hover:text-primary shadow-lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Meet Our Doctors
                </Button>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop" 
                  alt="Professional medical team"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating cards */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -top-8 -left-8 bg-white rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Certified Excellence</div>
                    <div className="text-xs text-muted-foreground">Joint Commission Accredited</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="absolute -bottom-8 right-12 bg-white rounded-2xl p-4 shadow-2xl"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4.9</div>
                  <div className="text-xs text-muted-foreground">Patient Satisfaction</div>
                  <div className="flex justify-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <div className="flex flex-col items-center text-white">
            <span className="text-sm font-medium mb-2">Scroll to explore</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section with Counter Animation */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="container-hospital">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '50K+', label: 'Patients Served' },
              { icon: Award, value: '25+', label: 'Years of Excellence' },
              { icon: Star, value: '4.9', label: 'Patient Rating' },
              { icon: Shield, value: '24/7', label: 'Emergency Care' }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 mx-auto mb-4">
                  <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments Section with Horizontal Scroll */}
      <section className="py-20">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Our <span className="text-gradient">Medical Departments</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Specialized care across multiple medical disciplines with cutting-edge 
              technology and expert specialists focused on your health needs.
            </p>
          </motion.div>

          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {departments.map((department, index) => (
                <CarouselItem key={department.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card premium hover className="overflow-hidden group h-full">
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={department.image} 
                          alt={department.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                          <div className="text-white">
                            <div className="flex items-center mb-2">
                              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3">
                                {department.icon}
                              </div>
                              <h3 className="text-xl font-bold">{department.title}</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-muted-foreground mb-4">{department.description}</p>
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                          <span>{department.doctors} Specialists</span>
                          <span>{department.services} Services</span>
                        </div>
                        <Link to={`/services#${department.id}`}>
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="w-full"
                          >
                            View Services
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center mt-8 gap-4">
              <CarouselPrevious className="static" />
              <CarouselNext className="static" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Doctors Section - Enhanced & Improved */}
      <section ref={testimonialsRef} className="py-20 bg-gradient-to-br from-background to-muted/20">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Users className="w-4 h-4 mr-2" />
              Our Medical Professionals
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Meet Our <span className="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Expert Doctors</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our team of highly skilled physicians combines advanced medical expertise with 
              personalized, compassionate care to help you achieve optimal health and wellbeing.
            </p>
          </motion.div>
          
          {/* Doctor stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              {
                label: 'Board Certified Doctors',
                value: '40+'
              },
              {
                label: 'Specialties & Subspecialties',
                value: '20+'
              },
              {
                label: 'Years of Combined Experience',
                value: '500+'
              },
              {
                label: 'Patient Satisfaction',
                value: '98%'
              }
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border p-4 rounded-xl text-center hover:border-primary/30 transition-colors">
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Interactive specialty filter */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Find doctors by specialty</h3>
              <Link to="/doctors" className="text-primary text-sm hover:underline flex items-center">
                View all specialties
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {["All Specialties", "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology"].map((specialty, i) => (
                <motion.button
                  key={specialty}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    i === 0
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-card border border-border hover:border-primary/50'
                  }`}
                >
                  {specialty}
                </motion.button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-medium text-foreground">Finding the best doctors for you...</p>
              <p className="text-muted-foreground">Loading physician profiles</p>
            </div>
          ) : (
            <>
              {/* Featured doctor - highlight */}
              {doctors.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-12"
                >
                  <Card premium className="overflow-hidden bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                      <div className="relative overflow-hidden rounded-xl h-72 md:h-auto">
                        <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-md text-sm font-medium shadow-lg">
                          Featured Physician
                        </div>
                        <img 
                          src={doctors[0].image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&h=500&fit=crop'}
                          alt={`Dr. ${doctors[0].name}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                      
                      <div className="flex flex-col justify-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium mb-2 w-fit">
                          {doctors[0].specialty || "Specialist"}
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Dr. {doctors[0].name}</h3>
                        <p className="text-muted-foreground mb-4">
                          {doctors[0].bio || `Dr. ${doctors[0].name} is a highly respected ${doctors[0].specialty} specialist with ${doctors[0].experience || '10+ years'} of experience in treating complex conditions with innovative approaches.`}
                        </p>
                        
                        <div className="flex items-center mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              fill={i < Math.floor(doctors[0].rating || 4.8) ? "currentColor" : "none"}
                              className={`w-4 h-4 ${i < Math.floor(doctors[0].rating || 4.8) ? 'text-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="ml-2 text-muted-foreground">({doctors[0].rating || '4.8'}/5)</span>
                          <span className="ml-2 text-xs text-muted-foreground">from patient reviews</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center">
                            <Award className="w-4 h-4 text-primary mr-2" />
                            <span className="text-sm">{doctors[0].experience || "10+ Years"}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-primary mr-2" />
                            <span className="text-sm">{doctors[0].location || "Main Hospital"}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-2 bg-success/5 border border-success/10 rounded-md mb-6">
                          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-success" />
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">Next Available Appointment</p>
                            <p className="text-success">Today at 2:30 PM</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Link to={`/appointment-booking`} state={{ doctorId: doctors[0].id, doctorName: doctors[0].name }}>
                            <Button variant="primary" className="shadow-md hover:shadow-primary/25">
                              <Calendar className="w-4 h-4 mr-2" />
                              Book Appointment
                            </Button>
                          </Link>
                          <Link to={`/doctors/${doctors[0].id}`}>
                            <Button variant="outline">
                              View Full Profile
                              <ArrowRight className="w-3 h-3 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Doctor Cards - Improved Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctors.slice(1, 7).map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card premium hover className="overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:shadow-xl">
                      <div className="relative">
                        {/* Doctor image with overlay */}
                        <div className="h-56 overflow-hidden">
                          <img 
                            src={doctor.image || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face`}
                            alt={`Dr. ${doctor.name}`}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                        </div>
                        
                        {/* Availability indicator */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-md">
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium">Available Today</span>
                          </div>
                        </div>
                        
                        {/* Bottom overlay content */}
                        <div className="absolute bottom-0 left-0 w-full p-4">
                          <span className="inline-block px-2 py-1 bg-primary/90 text-white text-xs font-medium rounded-md backdrop-blur-sm mb-1 shadow-md">
                            {doctor.specialty || "Specialist"}
                          </span>
                          <h3 className="text-lg font-bold text-white">Dr. {doctor.name}</h3>
                        </div>
                      </div>
                      
                      <div className="p-5 flex-grow flex flex-col">
                        {/* Information section */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                fill={i < Math.floor(doctor.rating || 4.5) ? "currentColor" : "none"}
                                className={`w-3 h-3 ${i < Math.floor(doctor.rating || 4.5) ? 'text-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="ml-1 text-xs text-muted-foreground">{doctor.rating || '4.5'}</span>
                          </div>
                          <span className="text-xs text-primary font-medium">{doctor.experience || '10+ years'}</span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center text-sm">
                            <MapPin className="w-4 h-4 text-primary mr-2" />
                            <span className="text-muted-foreground">{doctor.location || 'Main Hospital'}</span>
                          </div>
                          
                          {doctor.department && (
                            <div className="flex items-center text-sm">
                              <Building className="w-4 h-4 text-primary mr-2" />
                              <span className="text-muted-foreground">{doctor.department}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Languages and specializations */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {(doctor.languages || ['English']).slice(0, 2).map((lang, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-muted rounded-full">
                              {lang}
                            </span>
                          ))}
                          
                          {doctor.department && doctor.department !== doctor.specialty && (
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              {doctor.department}
                            </span>
                          )}
                        </div>
                        
                        {/* Next available slot with visual indicator */}
                        <div className="mb-5 flex items-center p-2 bg-muted/30 rounded-md">
                          <Calendar className="w-4 h-4 text-primary mr-2" />
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs">Next available:</span>
                            <span className="text-xs font-medium">Today, 3:30 PM</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="mt-auto grid grid-cols-2 gap-2">
                          <Link to={`/appointment-booking`} state={{ doctorId: doctor.id, doctorName: doctor.name }}>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="w-full"
                            >
                              Book Now
                            </Button>
                          </Link>
                          <Link to={`/doctors/${doctor.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                            >
                              Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
          
          <div className="text-center mt-14">
            <p className="text-muted-foreground mb-5">
              Discover more healthcare professionals across various specialties
            </p>
            <Link to="/doctors">
              <Button 
                variant="primary" 
                size="lg" 
                className="shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all"
              >
                <Users className="w-5 h-5 mr-2" />
                Meet All Our Specialists
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Working Hours Section */}
      <section className="py-16 bg-background">
        <div className="container-hospital px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Hospital Hours</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're here when you need us, with extended hours and emergency services available.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-border">
                <h3 className="text-xl font-bold text-foreground flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary" />
                  Operating Hours
                </h3>
              </div>

              <div className="divide-y divide-border">
                {workingHours.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        item.isOpen 
                          ? 'bg-green-50 text-green-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {item.isOpen ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.day}</p>
                        {item.isLimited && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">Limited Services</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        item.isOpen ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {item.hours}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-red-50 border-t border-red-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Emergency Services</p>
                    <p className="text-sm text-muted-foreground">Available 24/7, including holidays</p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="primary" size="sm" onClick={() => window.location.href = '/contact'}>
                      Contact Us
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Carousel */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              What Our <span className="text-gradient">Patients Say</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover why our patients trust us with their healthcare needs and how 
              we've made a difference in their lives.
            </p>
          </motion.div>
          
          <Carousel 
            opts={{ loop: true, align: "center" }}
            className="w-full"
          >
            <CarouselContent>
              {(testimonials.length > 0 ? testimonials : [
                {
                  id: '1',
                  name: 'Jennifer Anderson',
                  text: 'The care I received at MediCare+ was exceptional. The doctors were knowledgeable and took the time to explain everything clearly. I felt valued as a patient.',
                  rating: 5,
                  image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
                  title: 'Cardiac Patient'
                },
                {
                  id: '2',
                  name: 'Robert Johnson',
                  text: 'I was extremely nervous about my surgery, but the staff made me feel comfortable and secure. The follow-up care was just as impressive. I recommend MediCare+ to everyone.',
                  rating: 5,
                  image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                  title: 'Surgery Patient'
                },
                {
                  id: '3',
                  name: 'Maria Garcia',
                  text: 'The pediatric department is amazing! My son was scared of doctors, but the staff here made him feel so at ease. They truly know how to handle children with care and compassion.',
                  rating: 5,
                  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
                  title: 'Parent'
                }
              ]).map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3 p-4">
                  <Card premium className="p-6 h-full flex flex-col">
                    <div className="flex-grow">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            fill={i < testimonial.rating ? "currentColor" : "none"}
                            className={i < testimonial.rating ? "w-5 h-5 text-yellow-500" : "w-5 h-5 text-gray-300"} 
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 italic">
                        "{testimonial.text}"
                      </p>
                    </div>
                    <div className="flex items-center">
                      {testimonial.image && (
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center mt-8 gap-4">
              <CarouselPrevious className="static" />
              <CarouselNext className="static" />
            </div>
          </Carousel>
        </div>
      </section>
      
      {/* Facilities Section - Enhanced Design */}
      <section className="py-20 bg-gradient-to-b from-background via-muted/5 to-background">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Building className="w-4 h-4 mr-2" />
              World-Class Healthcare
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Our <span className="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Medical Facilities</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Equipped with cutting-edge technology and staffed by experienced professionals,
              our facilities provide comprehensive care for all your healthcare needs.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card premium hover className="overflow-hidden h-full flex flex-col">
                  {/* Image Header */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={facility.imageSrc}
                      alt={facility.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    
                    {/* 24/7 Badge */}
                    {facility.available24h && (
                      <div className="absolute top-4 right-4 bg-success/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                        24/7 Available
                      </div>
                    )}
                    
                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3">
                          {facility.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{facility.name}</h3>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col">
                    <p className="text-muted-foreground mb-4">{facility.description}</p>
                    
                    {/* Highlights */}
                    <ul className="space-y-2 mb-6">
                      {facility.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <Link to={`/services?facility=${encodeURIComponent(facility.name)}`}>
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="group-hover:bg-primary group-hover:text-white transition-all duration-300"
                        >
                          Learn More
                          <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      
                      <Link to="/appointment-booking">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="flex justify-center mt-12">
            <Link to="/services">
              <Button variant="primary" size="lg" className="shadow-lg hover:shadow-primary/20">
                <Building className="w-5 h-5 mr-2" />
                Explore All Facilities
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section with Parallax */}
      <section ref={ctaRef} className="py-20 relative overflow-hidden">
        <motion.div 
          style={{ y: ctaBackground }}
          className="absolute inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90"></div>
          <img 
            src="https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=1920&h=600&fit=crop" 
            alt="Hospital building"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        <div className="container-hospital relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Your Health Is Our Top Priority
              </h2>
              <p className="text-xl opacity-90 mb-8 leading-relaxed">
                Don't wait until it's too late. Schedule your appointment today 
                and take the first step towards better health and wellbeing.
              </p>
              {/* Buttons removed as requested */}
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
