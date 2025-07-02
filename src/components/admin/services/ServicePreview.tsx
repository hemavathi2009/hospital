import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { Service } from '../../../types/service';
import Card from '../../atoms/Card';
import Button from '../../atoms/Button';
import { useNavigate } from 'react-router-dom';

interface ServicePreviewProps {
  service: Service;
}

const ServicePreview: React.FC<ServicePreviewProps> = ({ service }) => {
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate('/appointment-booking', {
      state: { 
        serviceId: service.id,
        serviceName: service.name
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          This is a preview of how the service will appear to users on the website.
          The actual appearance may vary slightly based on the website's layout.
        </p>
      </div>
      
      {/* Card Preview */}
      <div>
        <h3 className="text-sm font-medium uppercase text-muted-foreground mb-3">
          Service Card Preview
        </h3>
        
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="max-w-sm mx-auto"
        >
          <Card premium hover className="p-6 h-full flex flex-col transition-all duration-300">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 mb-4 mx-auto"
            >
              <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                {service.iconUrl ? (
                  <img 
                    src={service.iconUrl} 
                    alt="" 
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary/20 rounded-md"></div>
                )}
              </div>
            </motion.div>

            {/* Content */}
            <div className="text-center flex-grow">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {service.name || 'Service Name'}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {service.shortDescription || 'Short description of the service will appear here...'}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6 text-left">
                {(service.features || []).slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
                {(service.features || []).length === 0 && (
                  <li className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 flex-shrink-0"></div>
                    Sample feature will appear here
                  </li>
                )}
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
                onClick={handleBookAppointment}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button 
                variant="outline" 
                size="md" 
                className="w-full"
              >
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Modal Preview */}
      <div className="mt-12">
        <h3 className="text-sm font-medium uppercase text-muted-foreground mb-3">
          Service Detail Preview
        </h3>
        
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Modal Header */}
          <div className="relative h-48 bg-gradient-to-br from-primary to-secondary overflow-hidden">
            {service.imageUrl ? (
              <img 
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-opacity-20 text-2xl font-bold">
                  Preview Image
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/70 flex items-end">
              <div className="p-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {service.name || 'Service Name'}
                </h2>
                <p className="text-white/80">
                  {service.shortDescription || 'Short description of the service...'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <p>
                {service.description || 'Full description of the service will appear here...'}
              </p>
              
              {service.features && service.features.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Features & Services
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePreview;
