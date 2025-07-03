import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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
  User,
  Award,
  Shield,
  ChevronDown,
  ArrowRight,
  FileText,
  Activity,
  Building,
  CheckCircle, 
  X,
  BookOpen,
  Languages,
  AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
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
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  
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

  // Handle view doctor profile
  const handleViewDoctorProfile = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
    setActiveTab('about');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  // Handle close doctor modal
  const handleCloseModal = () => {
    setShowDoctorModal(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
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
            <source src="https://player.vimeo.com/external/466464198.sd.mp4?s=32f92bfa7dc5c7e0c2c6da0f74fa6c0de03d38f0&profile_id=164&oauth2_token_id=57447761" type="video/mp4" />
            {/* Fallback for browsers that don't support video */}
            <img 
              src="https://images.unsplash.com/photo-1551076805-e1869033e561?w=1920&h=1080&fit=crop" 
              alt="Medical facility"
              className="absolute inset-0 w-full h-full object-cover"
            />
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Meet Our <span className="text-gradient">Expert Doctors</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our team of highly qualified medical professionals brings years of experience
              and dedication to providing exceptional patient care.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.slice(0, 6).map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card premium hover className="h-full overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    {doctor.image ? (
                      <img 
                        src={doctor.image} 
                        alt={`Dr. ${doctor.name}`}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <User className="w-16 h-16 text-primary/50" />
                      </div>
                    )}
                    
                    {/* Verified badge */}
                    {doctor.verified && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-1">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-1">Dr. {doctor.name}</h3>
                    <p className="text-primary">{doctor.specialty}</p>
                    
                    <div className="flex items-center mt-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(doctor.rating || 4.5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-muted-foreground">
                        ({doctor.rating || '4.5'})
                      </span>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex justify-between">
                      <Link to={`/appointment-booking`} state={{ doctorId: doctor.id, doctorName: doctor.name }}>
                        <Button variant="primary" size="sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          Book Now
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDoctorProfile(doctor)}
                      >
                        View Full Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/doctors">
              <Button variant="secondary" size="lg">
                View All Doctors
              </Button>
            </Link>
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
      
      {/* Portal Access Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Access Your <span className="text-gradient">Health Portal</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Seamlessly manage your healthcare journey with our dedicated portals for patients and healthcare professionals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Patient Portal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card premium hover className="h-full flex flex-col">
                <div className="p-8 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Patient Portal</h3>
                  <p className="text-muted-foreground mb-6">
                    Access your medical records, upcoming appointments, prescriptions, and lab results. Manage your healthcare journey from anywhere, anytime.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>View and manage your appointments</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Access your medical records and prescriptions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Track your health metrics and progress</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 pt-0 mt-auto">
                  <Link to="/patient-portal">
                    <Button variant="primary" size="lg" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Access Patient Portal
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Doctor Portal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card premium hover className="h-full flex flex-col">
                <div className="p-8 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                    <Stethoscope className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Doctor Portal</h3>
                  <p className="text-muted-foreground mb-6">
                    Designed for healthcare professionals to manage patient appointments, access medical records, and update treatment plans efficiently.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Manage your patient appointments</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Update patient records and prescriptions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Collaborate with other healthcare professionals</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 pt-0 mt-auto">
                  <Link to="/doctor-portal">
                    <Button variant="secondary" size="lg" className="w-full">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Access Doctor Portal
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
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
      
      {/* Portal Access Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Access Your <span className="text-gradient">Health Portal</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Seamlessly manage your healthcare journey with our dedicated portals for patients and healthcare professionals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Patient Portal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card premium hover className="h-full flex flex-col">
                <div className="p-8 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Patient Portal</h3>
                  <p className="text-muted-foreground mb-6">
                    Access your medical records, upcoming appointments, prescriptions, and lab results. Manage your healthcare journey from anywhere, anytime.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>View and manage your appointments</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Access your medical records and prescriptions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Track your health metrics and progress</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 pt-0 mt-auto">
                  <Link to="/patient-portal">
                    <Button variant="primary" size="lg" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Access Patient Portal
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Doctor Portal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card premium hover className="h-full flex flex-col">
                <div className="p-8 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                    <Stethoscope className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Doctor Portal</h3>
                  <p className="text-muted-foreground mb-6">
                    Designed for healthcare professionals to manage patient appointments, access medical records, and update treatment plans efficiently.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Manage your patient appointments</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Update patient records and prescriptions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                      <span>Collaborate with other healthcare professionals</span>
                    </li>
                  </ul>
                </div>
                <div className="p-8 pt-0 mt-auto">
                  <Link to="/doctor-portal">
                    <Button variant="secondary" size="lg" className="w-full">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Access Doctor Portal
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
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
                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'experience' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('experience')}
                  >
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Experience
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
                      className="space-y-6"
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
                          {selectedDoctor.education && selectedDoctor.education.length > 0 ? (
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
                                  <p className="text-foreground">MD in {selectedDoctor.specialty}, Medical University</p>
                                </div>
                              </li>
                              <li className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-foreground">Residency, Central Hospital</p>
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
                          {selectedDoctor.languages && selectedDoctor.languages.length > 0 ? (
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
                    </motion.div>
                  )}
                  
                  {activeTab === 'experience' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Experience */}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">Professional Experience</h3>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="mr-3 mt-1">
                              <Stethoscope className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{selectedDoctor.experience || '10+ years'} of clinical experience</p>
                              <p className="text-muted-foreground">Specialized in {selectedDoctor.specialty}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Awards */}
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">Awards & Recognitions</h3>
                        <ul className="space-y-3">
                          {selectedDoctor.awards && selectedDoctor.awards.length > 0 ? (
                            selectedDoctor.awards.map((award, index) => (
                              <li key={index} className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <Award className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-foreground">{award}</p>
                                </div>
                              </li>
                            ))
                          ) : (
                            <li className="text-muted-foreground">Information not available</li>
                          )}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link to="/appointment-booking" state={{ doctorId: selectedDoctor.id, doctorName: selectedDoctor.name }}>
                    <Button variant="primary" size="lg">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Appointment
                    </Button>
                  </Link>
                  <Link to="/doctors">
                    <Button variant="outline" size="lg">
                      View All Doctors
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Index;
