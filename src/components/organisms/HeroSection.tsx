import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import { Calendar, Phone, MapPin, Clock, Shield, Award, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleBookAppointment = () => {
    navigate('/appointment-booking');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Layered Gradient Effect */}
      <div className="absolute inset-0 w-full h-full">
        {/* Base image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1920&h=1080&fit=crop')`
          }}
        ></div>
        
        {/* Gradient overlay with enhanced colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/90"></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30"></div>
        
        {/* Animated accent circles */}
        <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-accent/10 mix-blend-overlay animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full bg-secondary/10 mix-blend-overlay animate-blob"></div>
        <div className="absolute top-[60%] right-[20%] w-40 h-40 rounded-full bg-primary-light/10 mix-blend-overlay animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 container-hospital section-padding">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium"
              >
                <div className="relative mr-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  <div className="absolute -inset-1 rounded-full bg-accent/30 animate-ripple"></div>
                </div>
                Advanced Healthcare Excellence
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-5xl lg:text-7xl font-bold text-white leading-tight"
              >
                Leading the Way in
                <span className="block text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                  Modern Medicine
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-xl text-white/90 leading-relaxed max-w-2xl"
              >
                Experience next-generation healthcare with our team of renowned specialists, 
                cutting-edge technologies, and personalized treatment plans designed for optimal outcomes.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                variant="accent" 
                size="xl" 
                onClick={handleBookAppointment}
                className="shadow-2xl hover:shadow-3xl"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Appointment
              </Button>

              <Button 
                variant="outline" 
                size="xl"
                className="border-white text-white hover:bg-white hover:text-primary shadow-xl"
              >
                <Phone className="w-5 h-5 mr-2" />
                Emergency: 911
              </Button>
            </motion.div>

            {/* Quick Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4"
            >
              <div className="flex items-center text-white/90">
                <Shield className="w-5 h-5 mr-3 text-accent" />
                <div>
                  <div className="font-medium">Trusted Care</div>
                  <div className="text-sm text-white/80">97% Patient Satisfaction</div>
                </div>
              </div>
              <div className="flex items-center text-white/90">
                <Award className="w-5 h-5 mr-3 text-accent" />
                <div>
                  <div className="font-medium">Award-Winning</div>
                  <div className="text-sm text-white/80">Excellence in Healthcare</div>
                </div>
              </div>
              <div className="flex items-center text-white/90">
                <Users className="w-5 h-5 mr-3 text-accent" />
                <div>
                  <div className="font-medium">Expert Specialists</div>
                  <div className="text-sm text-white/80">Board-Certified Physicians</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative hidden lg:block"
          >
            {/* Main card */}
            <div className="relative bg-white/10 backdrop-blur-lg p-2 rounded-3xl shadow-2xl overflow-hidden">
              {/* Main image */}
              <div className="w-full h-[500px] rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1631815588090-d4bfec5b7dce?w=700&h=500&fit=crop" 
                  alt="Advanced medical care"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Decorative border light */}
              <div className="absolute inset-0 border border-white/20 rounded-3xl pointer-events-none"></div>
              
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-accent/20 rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>
            </div>

            {/* Floating cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute -top-4 -left-4 bg-white rounded-2xl p-4 shadow-2xl"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-success"></div>
                </div>
                <div>
                  <div className="font-semibold text-sm">Advanced Imaging</div>
                  <div className="text-xs text-muted-foreground">AI-Powered Diagnostics</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-muted-foreground">Emergency Care</div>
                <div className="flex justify-center mt-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse"></span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
