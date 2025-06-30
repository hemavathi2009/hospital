import React from 'react';
import { motion } from 'framer-motion';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import { Calendar, ArrowRight, Clock, Activity } from 'lucide-react';
import { Facility } from '../../types/facility';

interface FacilityCardProps {
  facility: Facility;
  onViewDetails: (facility: Facility) => void;
  onBookAppointment: (facilityId: string) => void;
}

const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onViewDetails, onBookAppointment }) => {
  return (
    <Card premium hover className="p-6 h-full flex flex-col transition-all duration-300">
      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 mb-4 mx-auto"
      >
        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
          {facility.icon ? (
            <img src={facility.icon} alt={facility.name} className="w-8 h-8" />
          ) : (
            <Activity className="w-8 h-8 text-primary" />
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="text-center flex-grow">
        <h3 className="text-xl font-semibold text-foreground mb-3">
          {facility.name}
        </h3>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {facility.shortDescription}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6 text-left">
          {facility.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0"></div>
              {feature}
            </li>
          ))}
        </ul>

        {/* 24/7 Badge */}
        {facility.available24h && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
            <Clock className="w-3 h-3 mr-1" />
            Available 24/7
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 mt-auto space-y-3">
        <Button 
          variant="primary" 
          size="md" 
          className="w-full"
          onClick={() => onBookAppointment(facility.id)}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
        <Button 
          variant="outline" 
          size="md" 
          className="w-full"
          onClick={() => onViewDetails(facility)}
        >
          Learn More
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
};

export default FacilityCard;
