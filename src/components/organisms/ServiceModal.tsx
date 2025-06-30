import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import Button from '../atoms/Button';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

interface ServiceModalProps {
  department: Department;
  onClose: () => void;
  onBookAppointment: (departmentId: string) => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ department, onClose, onBookAppointment }) => {
  const [relatedDoctors, setRelatedDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch related doctors from Firebase
  useEffect(() => {
    const fetchRelatedDoctors = async () => {
      try {
        const doctorsRef = collection(db, 'doctors');
        const q = query(
          doctorsRef, 
          where('specialty', '==', department.name),
          limit(3)
        );
        
        const snapshot = await getDocs(q);
        const fetchedDoctors: Doctor[] = [];
        
        snapshot.forEach((doc) => {
          fetchedDoctors.push({
            id: doc.id,
            ...doc.data() as Omit<Doctor, 'id'>
          });
        });
        
        setRelatedDoctors(fetchedDoctors);
      } catch (error) {
        console.error("Error fetching related doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedDoctors();
  }, [department.name]);

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
            {/* Department Image Header */}
            <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary to-secondary overflow-hidden">
              {department.image ? (
                <img 
                  src={department.image} 
                  alt={department.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                    {department.icon ? (
                      <img 
                        src={department.icon} 
                        alt={department.name} 
                        className="w-12 h-12"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {department.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/70 flex items-end">
                <div className="p-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{department.name}</h2>
                  <p className="text-white/80">{department.shortDescription}</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">About {department.name}</h3>
                    <p className="text-muted-foreground">{department.description}</p>
                  </div>
                  
                  {/* Features */}
                  {department.features && department.features.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Services & Features</h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {department.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Specializations */}
                  {department.specializations && department.specializations.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Specializations</h3>
                      <div className="flex flex-wrap gap-2">
                        {department.specializations.map((spec, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="bg-muted/30 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Department Information</h3>
                    
                    <div className="space-y-4">
                      {/* Availability */}
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-primary mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Hours</h4>
                          <p className="text-sm text-muted-foreground">
                            {department.availability?.hours || "Regular hospital hours"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {department.availability?.days?.join(', ') || "Monday - Friday"}
                          </p>
                          {department.available24h && (
                            <p className="text-sm text-success mt-1">Emergency: 24/7</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-primary mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Location</h4>
                          <p className="text-sm text-muted-foreground">
                            Main Hospital, Floor 2
                          </p>
                          <p className="text-sm text-muted-foreground">
                            123 Medical Center Drive
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Related Doctors */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Specialist Doctors</h3>
                    
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : relatedDoctors.length > 0 ? (
                      <div className="space-y-3">
                        {relatedDoctors.map(doctor => (
                          <div key={doctor.id} className="flex items-center p-2 rounded-lg hover:bg-muted/50">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted mr-3">
                              {doctor.image ? (
                                <img 
                                  src={doctor.image} 
                                  alt={doctor.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                  <Users className="w-5 h-5 text-primary" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Dr. {doctor.name}</p>
                              <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specialist doctors found for this department.
                      </p>
                    )}
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
                onClick={() => onBookAppointment(department.id)}
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

export default ServiceModal;
