import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Star, Stethoscope } from 'lucide-react';
import Card from '../../atoms/Card';
import Button from '../../atoms/Button';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department?: string;
  image?: string;
  rating?: number;
  experience?: string;
}

interface StepDoctorProps {
  doctors: Doctor[];
  selectedDoctor: string;
  onSelect: (doctorId: string) => void;
  onBack: () => void;
  loading: boolean;
  departmentName?: string; // Added to show selected department
}

const StepDoctor: React.FC<StepDoctorProps> = ({
  doctors,
  selectedDoctor,
  onSelect,
  onBack,
  loading,
  departmentName
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Select Doctor</h2>
          <p className="text-muted-foreground">
            {departmentName 
              ? `Choose a ${departmentName} specialist for your appointment` 
              : 'Choose a specialist for your appointment'}
          </p>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Doctors Available</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {departmentName 
              ? `There are no doctors available in the ${departmentName} department.` 
              : 'There are no doctors available for this department.'} 
            Please select another department or try again later.
          </p>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {doctors.map((doctor) => (
            <motion.div key={doctor.id} variants={itemVariants}>
              <div
                onClick={() => onSelect(doctor.id)}
                className="cursor-pointer"
              >
                <Card
                  hover
                  className={`p-6 transition-all duration-300 ${
                    selectedDoctor === doctor.id 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary p-0.5 mr-4 flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        {doctor.image ? (
                          <img 
                            src={doctor.image} 
                            alt={doctor.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <User className="w-7 h-7 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-foreground">Dr. {doctor.name}</h3>
                      <p className="text-primary text-sm mb-1">{doctor.specialty}</p>
                      
                      <div className="flex items-center">
                        {doctor.rating && (
                          <div className="flex items-center mr-4">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(doctor.rating) 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({doctor.rating})
                            </span>
                          </div>
                        )}
                        
                        {doctor.experience && (
                          <span className="text-xs text-muted-foreground">
                            {doctor.experience} experience
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {selectedDoctor === doctor.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-2">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default StepDoctor;
