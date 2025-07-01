import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Star, MapPin, UserCheck } from 'lucide-react';
import Card from '../../atoms/Card';
import Button from '../../atoms/Button';

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
  email?: string;
  phone?: string;
  education?: string[];
  languages?: string[];
  awards?: string[];
  createdAt?: any;
  updatedAt?: any;
  verified?: boolean;
}

interface DoctorGridProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}

const DoctorGrid: React.FC<DoctorGridProps> = ({ doctors, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.length === 0 ? (
        <div className="col-span-full p-8 text-center bg-muted/30 rounded-xl border border-border">
          <h3 className="text-lg font-medium text-foreground mb-2">No doctors found</h3>
          <p className="text-muted-foreground mb-6">
            Add your first doctor to display in the doctors directory.
          </p>
        </div>
      ) : (
        doctors.map((doctor) => (
          <Card key={doctor.id} premium hover className="h-full overflow-hidden group">
            <div className="aspect-square overflow-hidden">
              {doctor.image ? (
                <img 
                  src={doctor.image} 
                  alt={`Dr. ${doctor.name}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/40">
                    {doctor.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Verified badge */}
              {doctor.verified && (
                <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-1">
                  <UserCheck className="w-4 h-4" />
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="text-xl font-semibold text-foreground mb-1">Dr. {doctor.name}</h3>
              <p className="text-primary text-sm mb-2">{doctor.specialty}</p>
              
              {doctor.department && (
                <p className="text-sm text-muted-foreground mb-2">
                  {doctor.department}
                </p>
              )}
              
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(doctor.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({doctor.rating || '0'})
                </span>
              </div>
              
              {doctor.location && (
                <div className="flex items-center text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3 mr-1" />
                  {doctor.location}
                </div>
              )}
              
              <div className="border-t border-border pt-3 mt-auto flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => onEdit(doctor)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={() => onDelete(doctor)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default DoctorGrid;
