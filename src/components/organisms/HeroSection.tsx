import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import { Calendar, Phone, MapPin, Clock } from 'lucide-react';

const HeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleBookAppointment = () => {
    navigate('/appointment-booking');
  };

  const handleEmergencyCall = () => {
    console.log('Emergency call...');
    // Handle emergency call
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(16, 185, 129, 0.8)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1920&h=1080&fit=crop')`
        }}
      ></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm animate-float"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5 backdrop-blur-sm animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-20 w-16 h-16 rounded-full bg-accent/20 backdrop-blur-sm animate-float" style={{ animationDelay: '4s' }}></div>

      <div className="relative z-10 container-hospital section-padding">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className={`space-y-8 ${isVisible ? 'fade-in-up' : 'opacity-0'}`}>
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse-soft"></div>
                Award-Winning Healthcare Excellence
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                Your Health,
                <span className="block text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                  Our Priority
                </span>
              </h1>
              
              <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                Experience world-class healthcare with our team of expert physicians, 
                state-of-the-art facilities, and personalized care that puts you first.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="accent" 
                size="xl" 
                onClick={handleBookAppointment}
                className="shadow-2xl hover:shadow-3xl"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={handleEmergencyCall}
                className="border-white text-white hover:bg-white hover:text-primary shadow-2xl"
              >
                <Phone className="w-5 h-5 mr-2" />
                Emergency: 911
              </Button>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center text-white/80">
                <Clock className="w-5 h-5 mr-3 text-accent" />
                <div>
                  <div className="font-medium">24/7 Emergency</div>
                  <div className="text-sm">Always Available</div>
                </div>
              </div>
              <div className="flex items-center text-white/80">
                <MapPin className="w-5 h-5 mr-3 text-accent" />
                <div>
                  <div className="font-medium">Downtown Location</div>
                  <div className="text-sm">Easy Access</div>
                </div>
              </div>
              <div className="flex items-center text-white/80">
                <Phone className="w-5 h-5 mr-3 text-accent" />
                <div>
                  <div className="font-medium">+1 (555) 123-4567</div>
                  <div className="text-sm">Call Anytime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className={`relative ${isVisible ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              {/* Main image */}
              <div className="w-full h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=500&fit=crop" 
                  alt="Professional medical team"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl p-4 shadow-2xl animate-float">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-success"></div>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dr. Sarah Johnson</div>
                    <div className="text-xs text-muted-foreground">Available Now</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-2xl animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">4.9</div>
                  <div className="text-xs text-muted-foreground">Patient Rating</div>
                  <div className="flex justify-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-accent fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
