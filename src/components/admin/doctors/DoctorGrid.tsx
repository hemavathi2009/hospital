import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Star, MapPin, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import Card from '../../../components/atoms/Card';
import Badge from '../../../components/atoms/Badge';
import Button from '../../../components/atoms/Button';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department?: string;
  experience?: string;
  rating?: number;
  location?: string;
  bio?: string;
  image?: string;
  verified?: boolean;
  availability?: Record<string, string[]>;
  createdAt?: any;
}

interface DoctorGridProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}

const DoctorGrid: React.FC<DoctorGridProps> = ({ doctors, onEdit, onDelete }) => {
  // Get current day for availability check
  const today = new Date().toISOString().split('T')[0];
  
  const getAvailabilityStatus = (doctor: Doctor) => {
    if (!doctor.availability) return { status: 'unavailable', label: 'Not Available' };
    
    // Check if doctor is available today
    const todayAvailability = doctor.availability[today];
    if (todayAvailability && todayAvailability.length > 0) {
      return { status: 'available', label: 'Available Today', count: todayAvailability.length };
    }
    
    // Check if doctor has any availability in the future
    const hasAvailability = Object.keys(doctor.availability).some(date => 
      date >= today && doctor.availability[date].length > 0
    );
    
    return hasAvailability 
      ? { status: 'upcoming', label: 'Coming Soon' }
      : { status: 'unavailable', label: 'Not Available' };
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {doctors.map((doctor, index) => {
            const availability = getAvailabilityStatus(doctor);
            
            return (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <Card premium className="h-full overflow-hidden group">
                  <div className="relative">
                    <div className="aspect-square overflow-hidden">
                      {doctor.image ? (
                        <img 
                          src={doctor.image} 
                          alt={doctor.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <div className="text-3xl font-bold text-primary">
                            {doctor.name.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <Badge 
                        variant={
                          availability.status === 'available' ? 'success' :
                          availability.status === 'upcoming' ? 'warning' : 'error'
                        }
                        className="flex items-center gap-1"
                      >
                        {availability.status === 'available' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Available Today
                            {availability.count && (
                              <span className="ml-1 bg-white/20 px-1 rounded text-xs">
                                {availability.count} slots
                              </span>
                            )}
                          </>
                        ) : availability.status === 'upcoming' ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Coming Soon
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Not Available
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    {/* Verified badge */}
                    {doctor.verified && (
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant="primary" 
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                      </div>
                    )}
                    
                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onEdit(doctor)}
                          className="bg-white/20 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onDelete(doctor)}
                          className="bg-white/20 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center">
                      Dr. {doctor.name}
                      {doctor.verified && (
                        <CheckCircle className="w-4 h-4 ml-1 text-primary" />
                      )}
                    </h3>
                    
                    <div className="mt-1 text-sm font-medium text-primary">
                      {doctor.specialty}
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {doctor.department && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <Calendar className="w-3 h-3 text-primary" />
                          </div>
                          {doctor.department}
                        </div>
                      )}
                      
                      {doctor.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <MapPin className="w-3 h-3 text-primary" />
                          </div>
                          {doctor.location}
                        </div>
                      )}
                      
                      {doctor.experience && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <Star className="w-3 h-3 text-primary" />
                          </div>
                          {doctor.experience} experience
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {doctors.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No doctors found</h3>
          <p className="max-w-md mx-auto">
            No doctors match your current filters or search criteria. 
            Try adjusting your search or add a new doctor.
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorGrid;
