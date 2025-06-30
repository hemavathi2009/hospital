import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Users, CheckCircle, Award, Activity, Stethoscope } from 'lucide-react';
import Button from '../atoms/Button';
import { Facility } from '../../types/facility';

interface FacilityModalProps {
  facility: Facility;
  onClose: () => void;
  onBookAppointment: (facilityId: string) => void;
}

const FacilityModal: React.FC<FacilityModalProps> = ({ facility, onClose, onBookAppointment }) => {
  // Handle overlay click (close if clicking outside modal)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
        >
          <div className="absolute right-4 top-4 z-10">
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="rounded-full hover:bg-background/80"
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <div className="flex flex-col h-full">
            {/* Facility Image Header */}
            <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary to-secondary overflow-hidden">
              {facility.image ? (
                <img 
                  src={facility.image} 
                  alt={facility.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                    {facility.icon ? (
                      <img 
                        src={facility.icon} 
                        alt={facility.name} 
                        className="w-12 h-12"
                      />
                    ) : (
                      <Activity className="w-12 h-12 text-white" />
                    )}
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/70 flex items-end">
                <div className="p-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{facility.name}</h2>
                  <p className="text-white/80">{facility.shortDescription}</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">About {facility.name}</h3>
                    <p className="text-muted-foreground">{facility.description}</p>
                  </div>
                  
                  {/* Features */}
                  {facility.features && facility.features.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Features & Services</h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {facility.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Equipment */}
                  {facility.equipment && facility.equipment.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Equipment</h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {facility.equipment.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <Stethoscope className="w-5 h-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="bg-muted/30 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Facility Information</h3>
                    
                    <div className="space-y-4">
                      {/* Availability */}
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-primary mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Availability</h4>
                          <p className="text-sm text-muted-foreground">
                            Regular hospital hours
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Monday - Friday
                          </p>
                          {facility.available24h && (
                            <p className="text-sm text-success mt-1">Available 24/7</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-primary mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Location</h4>
                          <p className="text-sm text-muted-foreground">
                            Main Hospital, {facility.name} Wing
                          </p>
                          <p className="text-sm text-muted-foreground">
                            123 Medical Center Drive
                          </p>
                        </div>
                      </div>

                      {/* Staff */}
                      {facility.staffCount && (
                        <div className="flex items-start">
                          <Users className="w-5 h-5 text-primary mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-foreground">Staff</h4>
                            <p className="text-sm text-muted-foreground">
                              {facility.staffCount} trained professionals
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="flex items-start">
                        <Award className="w-5 h-5 text-primary mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Category</h4>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1">
                            {facility.category}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer with CTA */}
            <div className="border-t border-border p-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} MediCare+. All rights reserved.
              </p>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={() => onBookAppointment(facility.id)}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book an Appointment
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FacilityModal;
