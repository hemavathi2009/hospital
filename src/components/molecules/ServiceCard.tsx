import React from 'react';
import { motion } from 'framer-motion';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import { Calendar, ArrowRight, Clock } from 'lucide-react';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    available24h?: boolean;
  };
  onLearnMore: () => void;
  onBookAppointment: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onLearnMore, onBookAppointment }) => {
  return (
    <Card premium hover className="p-6 h-full flex flex-col transition-all duration-300">
      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 mb-4 mx-auto"
      >
        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
          {service.icon}
        </div>
      </motion.div>

      {/* Content */}
      <div className="text-center flex-grow">
        <h3 className="text-xl font-semibold text-foreground mb-3">
          {service.title}
        </h3>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {service.description}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6 text-left">
          {service.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0"></div>
              {feature}
            </li>
          ))}
        </ul>

        {/* 24/7 Badge */}
        {service.available24h && (
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
          onClick={() => onBookAppointment(service.id)}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
        <Button 
          variant="outline" 
          size="md" 
          className="w-full"
          onClick={onLearnMore}
        >
          Learn More
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
};

export default ServiceCard;
