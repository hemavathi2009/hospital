import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../atoms/Button';
import { Menu, Phone, Calendar, User, Home, Stethoscope, UserCheck, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      <div className="container-hospital px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
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
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {currentUser ? (
              <>
                {userRole === 'patient' && (
                  <Link to="/patient-portal">
                    <Button
                      variant={isScrolled ? 'outline' : 'ghost'}
                      size="md"
                      className={!isScrolled ? 'text-white border-white hover:bg-white hover:text-primary' : ''}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Portal
                    </Button>
                  </Link>
                )}
                <Button
                  variant={isScrolled ? 'primary' : 'accent'}
                  size="md"
                  onClick={logout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={isScrolled ? 'outline' : 'ghost'}
                  size="md"
                  className={!isScrolled ? 'text-white border-white hover:bg-white hover:text-primary' : ''}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
                <Link to="/appointment-booking">
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
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="pt-4 space-y-3 border-t border-gray-200">
                {currentUser ? (
                  <>
                    {userRole === 'patient' && (
                      <Link to="/patient-portal" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" size="md" className="w-full justify-center">
                          <User className="w-4 h-4 mr-2" />
                          Patient Portal
                        </Button>
                      </Link>
                    )}
                    <Button variant="primary" size="md" className="w-full justify-center" onClick={logout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="md" className="w-full justify-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </Button>
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
