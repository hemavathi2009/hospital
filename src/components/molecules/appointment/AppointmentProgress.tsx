import React from 'react';
import { motion } from 'framer-motion';
import { Check, Building, User, Calendar, Clock, FileText, CreditCard } from 'lucide-react';

interface AppointmentProgressProps {
  currentStep: number;
  totalSteps: number;
}

const AppointmentProgress: React.FC<AppointmentProgressProps> = ({ currentStep, totalSteps }) => {
  // Step information - Added payment step
  const steps = [
    { name: 'Department', icon: Building },
    { name: 'Doctor', icon: User },
    { name: 'Date & Time', icon: Calendar },
    { name: 'Your Details', icon: FileText },
    { name: 'Payment', icon: CreditCard },
    { name: 'Confirm', icon: Check }
  ];

  return (
    <div className="w-full">
      {/* Desktop Progress Bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div key={step.name} className="flex-1 flex flex-col items-center">
                <div className="relative w-full">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-5 w-full h-0.5 bg-border">
                      {/* Progress Overlay */}
                      {isCompleted && (
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute top-0 left-0 h-full bg-primary"
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Step Circle */}
                  <div className="flex items-center justify-center relative z-10">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        boxShadow: isActive ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none'
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-primary text-white'
                          : isActive
                          ? 'bg-primary/10 text-primary border border-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </motion.div>
                  </div>
                </div>
                
                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Mobile Progress Bar */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">
            Step {currentStep}: {steps[currentStep - 1].name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentStep} of {totalSteps}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default AppointmentProgress;
