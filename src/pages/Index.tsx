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
  Activity
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
    { day: 'Friday', hours: '8:00 AM - 6:00 PM', isOpen: true },
    { day: 'Saturday', hours: '9:00 AM - 5:00 PM', isOpen: true },
    { day: 'Sunday', hours: 'Closed (Emergency Only)', isOpen: false },
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

  // Facilities data
  const facilities = [
    { 
      name: 'Emergency Care', 
      icon: <Activity className="w-8 h-8" />, 
      description: '24/7 emergency services with rapid response teams' 
    },
    { 
      name: 'Lab Services', 
      icon: <FileText className="w-8 h-8" />, 
      description: 'State-of-the-art laboratory testing facilities' 
    },
    { 
      name: 'Pharmacy', 
      icon: <Award className="w-8 h-8" />, 
      description: 'Full-service pharmacy with prescription delivery' 
    },
    { 
      name: 'Imaging', 
      icon: <Eye className="w-8 h-8" />, 
      description: 'Advanced imaging including MRI, CT and ultrasound' 
    },
    { 
      name: 'Surgery', 
      icon: <Stethoscope className="w-8 h-8" />, 
      description: 'Modern operating rooms with advanced technology' 
    },
    { 
      name: 'Rehabilitation', 
      icon: <Users className="w-8 h-8" />, 
      description: 'Comprehensive physical and occupational therapy' 
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

      {/* Doctors Section */}
      <section ref={testimonialsRef} className="py-20 bg-muted/30">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Meet Our <span className="text-gradient">Expert Doctors</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our team of highly qualified physicians brings years of experience 
              and dedication to providing exceptional patient care.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.map((doctor, index) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card premium hover className="overflow-hidden group">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={doctor.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face'} 
                        alt={`Dr. ${doctor.name}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
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
                        <p className="text-sm text-muted-foreground mb-2">{doctor.experience} experience</p>
                        
                        <div className="flex items-center justify-center mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              fill={i < Math.floor(doctor.rating || 4.5) ? "currentColor" : "none"}
                              className={`w-4 h-4 ${i < Math.floor(doctor.rating || 4.5) ? 'text-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">({doctor.rating || '4.5'})</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Link to={`/appointments?doctor=${doctor.id}`}>
                          <Button 
                            variant="primary" 
                            size="md" 
                            className="w-full"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Appointment
                          </Button>
                        </Link>
                        <Link to={`/doctors/${doctor.id}`}>
                          <Button 
                            variant="outline" 
                            size="md" 
                            className="w-full"
                          >
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/doctors">
              <Button variant="primary" size="lg">
                View All Doctors
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Working Hours Section */}
      <section className="py-20">
        <div className="container-hospital">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Hospital <span className="text-gradient">Working Hours</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Our facility is open with full services during the hours listed below.
                Emergency services are available 24/7 regardless of regular operating hours.
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                {workingHours.map((day, index) => (
                  <AccordionItem key={index} value={`day-${index}`}>
                    <AccordionTrigger className={`text-lg ${currentDay === index ? 'text-primary font-bold' : ''}`}>
                      <div className="flex items-center">
                        {currentDay === index && (
                          <div className="w-3 h-3 bg-success rounded-full mr-3 animate-pulse"></div>
                        )}
                        {day.day}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">{day.hours}</span>
                        <span className={`text-sm px-3 py-1 rounded-full ${day.isOpen ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {day.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center text-primary">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="font-medium">Emergency Services Available 24/7</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=450&fit=crop" 
                  alt="Hospital reception"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl p-6 shadow-xl max-w-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mr-4">
                    <Phone className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Need Assistance?</h3>
                    <p className="text-primary font-medium">+1 (555) 123-4567</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Our friendly staff is available to answer your questions and provide guidance.
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  Contact Us
                </Button>
              </div>
            </motion.div>
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
      
      {/* Facilities Section */}
      <section className="py-20">
        <div className="container-hospital">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Our <span className="text-gradient">Medical Facilities</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              State-of-the-art medical facilities equipped with the latest technology 
              to provide comprehensive care for all your healthcare needs.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {facilities.map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card premium className="p-8 h-full flex flex-col items-center text-center transition-all duration-300">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                      <div className="text-primary group-hover:text-secondary transition-colors duration-300">
                        {facility.icon}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{facility.name}</h3>
                  <p className="text-muted-foreground mb-6">{facility.description}</p>
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="mt-auto group-hover:bg-primary group-hover:text-white transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </Card>
              </motion.div>
            ))}
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
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/appointments">
                  <Button variant="accent" size="xl" className="shadow-xl">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Your Appointment
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button 
                    variant="outline" 
                    size="xl" 
                    className="border-white text-white hover:bg-white hover:text-primary"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
