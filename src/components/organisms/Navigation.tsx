import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import { Menu, Phone, Calendar, User, Home, Stethoscope, UserCheck, MessageCircle, LogIn, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { scrollToTop } from '../../utils/scrollHelpers';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, userRole, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Services', href: '/services', icon: Stethoscope },
    { label: 'Doctors', href: '/doctors', icon: UserCheck },
    { label: 'Appointments', href: '/appointment-booking', icon: Calendar },
    { label: 'Contact', href: '/contact', icon: MessageCircle },
  ];

  // Enhanced navigation click handler that scrolls to top
  const handleNavLinkClick = () => {
    scrollToTop();
    // Close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      <div className="container-hospital px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" onClick={handleNavLinkClick}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <div className="w-6 h-6 rounded bg-white"></div>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isScrolled ? 'text-foreground' : 'text-white'}`}>
                MediCare+
              </h1>
              <p className={`text-xs ${isScrolled ? 'text-muted-foreground' : 'text-white/80'}`}>
                Excellence in Healthcare
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`font-medium transition-colors hover:scale-105 ${
                  location.pathname === item.href
                    ? 'text-primary font-semibold'
                    : isScrolled
                      ? 'text-foreground hover:text-primary' 
                      : 'text-white hover:text-accent'
                }`}
                onClick={handleNavLinkClick}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Portal Access - Always visible */}
            <div className="flex items-center space-x-4 border-l pl-4 ml-2 border-gray-200/30">
              <Link
                to="/patient-portal"
                className={`flex items-center transition-colors hover:scale-105 ${
                  location.pathname === "/patient-portal"
                    ? 'text-primary'
                    : isScrolled
                      ? 'text-foreground hover:text-primary' 
                      : 'text-white hover:text-accent'
                }`}
                onClick={handleNavLinkClick}
                title="Patient Portal"
              >
                <User className="w-5 h-5 mr-1.5" />
                <span className="text-sm font-medium">Patient</span>
              </Link>
              <Link
                to="/doctor-portal"
                className={`flex items-center transition-colors hover:scale-105 ${
                  location.pathname === "/doctor-portal"
                    ? 'text-primary'
                    : isScrolled
                      ? 'text-foreground hover:text-primary' 
                      : 'text-white hover:text-accent'
                }`}
                onClick={handleNavLinkClick}
                title="Doctor Portal (Restricted Access)"
              >
                <Stethoscope className="w-5 h-5 mr-1.5" />
                <span className="text-sm font-medium">Doctor</span>
                <Shield className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>

          {/* User Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {currentUser ? (
              <>
                <Button
                  variant={isScrolled ? 'primary' : 'accent'}
                  size="md"
                  onClick={() => {
                    scrollToTop();
                    logout();
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <div className="relative group">
                  <button className="flex items-center justify-center gap-1">
                    <Button
                      variant={isScrolled ? 'outline' : 'ghost'}
                      size="md"
                      className={!isScrolled ? 'text-white border-white hover:bg-white hover:text-primary' : ''}
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Sign In
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top-right invisible group-hover:visible">
                    <div className="py-1">
                      <Link 
                        to="/signin" 
                        state={{ userType: 'patient' }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleNavLinkClick}
                      >
                        <User className="w-4 h-4 mr-2 text-primary" />
                        Patient Portal
                      </Link>
                      <Link 
                        to="/signin" 
                        state={{ userType: 'doctor' }}
                        className="flex flex-col px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleNavLinkClick}
                      >
                        <div className="flex items-center">
                          <Stethoscope className="w-4 h-4 mr-2 text-primary" />
                          Doctor Portal
                        </div>
                        <div className="flex items-center mt-1 ml-6 text-xs text-muted-foreground">
                          <Shield className="w-3 h-3 mr-1" />
                          <span>Verified doctors only</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <Link to="/appointment-booking" onClick={handleNavLinkClick}>
                  <Button
                    variant={isScrolled ? 'primary' : 'accent'}
                    size="md"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? 'text-foreground hover:bg-gray-100' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
            <div className="container-hospital px-4 py-6 space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center space-x-3 font-medium py-2 ${
                    location.pathname === item.href
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  }`}
                  onClick={handleNavLinkClick}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Portal Icons - Always visible in mobile menu */}
              <div className="flex items-center space-x-6 py-2">
                <Link
                  to="/patient-portal"
                  className={`flex items-center space-x-3 font-medium ${
                    location.pathname === "/patient-portal"
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  }`}
                  onClick={handleNavLinkClick}
                >
                  <User className="w-5 h-5" />
                  <span>Patient Portal</span>
                </Link>
                <Link
                  to="/doctor-portal"
                  className={`flex items-center space-x-3 font-medium ${
                    location.pathname === "/doctor-portal"
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  }`}
                  onClick={handleNavLinkClick}
                >
                  <Stethoscope className="w-5 h-5" />
                  <div>
                    <span>Doctor Portal</span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Shield className="w-3 h-3 mr-1" />
                      <span>Admin verified only</span>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="pt-4 space-y-3 border-t border-gray-200">
                {currentUser ? (
                  <>
                    <Button variant="primary" size="md" className="w-full justify-center" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Sign in to your portal:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Link 
                          to="/signin" 
                          state={{ userType: 'patient' }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button variant="outline" size="md" className="w-full justify-center">
                            <User className="w-4 h-4 mr-2" />
                            Patient
                          </Button>
                        </Link>
                        <Link 
                          to="/signin" 
                          state={{ userType: 'doctor' }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button variant="outline" size="md" className="w-full justify-center">
                            <Stethoscope className="w-4 h-4 mr-2" />
                            Doctor
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <Link to="/appointment-booking" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="primary" size="md" className="w-full justify-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
