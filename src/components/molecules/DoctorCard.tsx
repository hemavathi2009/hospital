import React from 'react';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import { User, Calendar, Clock, Star } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  image?: string;
  rating: number;
  availability: string;
  bio: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment: (doctorId: string) => void;
  onViewProfile: (doctorId: string) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onBookAppointment,
  onViewProfile
}) => {
  return (
    <Card premium hover className="p-6 group">
      <div className="flex flex-col h-full">
        {/* Doctor Image */}
        <div className="relative mb-4 mx-auto">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
              {doctor.image ? (
                <img 
                  src={doctor.image} 
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse-soft"></div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="text-center mb-4 flex-grow">
          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            Dr. {doctor.name}
          </h3>
          <Badge variant="primary" size="sm" className="mb-2">
            {doctor.specialty}
          </Badge>
          <p className="text-sm text-muted-foreground mb-2">{doctor.experience} experience</p>
          
          {/* Rating */}
          <div className="flex items-center justify-center mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(doctor.rating) ? 'text-accent fill-current' : 'text-gray-300'}`}
              />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">({doctor.rating})</span>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
            <Clock className="w-4 h-4 mr-1" />
            {doctor.availability}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            variant="primary" 
            size="md" 
            className="w-full"
            onClick={() => onBookAppointment(doctor.id)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
          <Button 
            variant="outline" 
            size="md" 
            className="w-full"
            onClick={() => onViewProfile(doctor.id)}
          >
            View Full Profile
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DoctorCard;
