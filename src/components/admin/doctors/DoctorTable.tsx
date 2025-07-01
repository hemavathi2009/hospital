import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Badge from '../../../components/atoms/Badge';

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

interface DoctorTableProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}

const DoctorTable: React.FC<DoctorTableProps> = ({ doctors, onEdit, onDelete }) => {
  // Get current day for availability check
  const today = new Date().toISOString().split('T')[0];
  
  const getAvailabilityStatus = (doctor: Doctor) => {
    if (!doctor.availability) return { status: 'unavailable', label: 'Not Available' };
    
    // Check if doctor is available today
    const todayAvailability = doctor.availability[today];
    if (todayAvailability && todayAvailability.length > 0) {
      return { status: 'available', label: 'Available Today' };
    }
    
    // Check if doctor has any availability in the future
    const hasAvailability = Object.keys(doctor.availability).some(date => 
      date >= today && doctor.availability[date].length > 0
    );
    
    return hasAvailability 
      ? { status: 'upcoming', label: 'Coming Soon' }
      : { status: 'unavailable', label: 'Not Available' };
  };
  
  // Format timestamp to readable date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    if (timestamp.toDate) {
      // Firestore timestamp
      return timestamp.toDate().toLocaleDateString();
    }
    // Regular date
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-muted/30">
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Doctor</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Specialty</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Department</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Experience</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Created</th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {doctors.map((doctor) => {
              const availability = getAvailabilityStatus(doctor);
              
              return (
                <motion.tr 
                  key={doctor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {doctor.image ? (
                          <img 
                            src={doctor.image} 
                            alt={doctor.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {doctor.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center">
                          Dr. {doctor.name}
                          {doctor.verified && (
                            <CheckCircle className="w-4 h-4 ml-1 text-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{doctor.location || 'Main Hospital'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-foreground">{doctor.specialty}</td>
                  <td className="p-4 text-foreground">{doctor.department || 'General'}</td>
                  <td className="p-4 text-foreground">{doctor.experience || 'Not specified'}</td>
                  <td className="p-4">
                    <Badge 
                      variant={
                        availability.status === 'available' ? 'success' :
                        availability.status === 'upcoming' ? 'warning' : 'error'
                      }
                      className="flex items-center gap-1"
                    >
                      {availability.status === 'available' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : availability.status === 'upcoming' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {availability.label}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {formatDate(doctor.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEdit(doctor)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDelete(doctor)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
          {doctors.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted-foreground">
                No doctors found. Add a new doctor to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DoctorTable;
