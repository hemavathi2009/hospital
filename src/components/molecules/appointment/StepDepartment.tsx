import React from 'react';
import { motion } from 'framer-motion';
import { Building, Heart, Brain, Bone, Baby, PenTool, Stethoscope, Loader } from 'lucide-react';
import Card from '../../atoms/Card';
import Button from '../../atoms/Button';

interface Department {
  id: string;
  name: string;
  description: string;
}

interface StepDepartmentProps {
  departments: Department[];
  selectedDepartment: string;
  onSelect: (departmentId: string) => void;
  loading: boolean;
}

const StepDepartment: React.FC<StepDepartmentProps> = ({
  departments,
  selectedDepartment,
  onSelect,
  loading
}) => {
  // Get department icon based on name or ID
  const getDepartmentIcon = (department: Department) => {
    const name = department.name.toLowerCase();
    if (name.includes('cardio')) return <Heart className="w-8 h-8 text-primary" />;
    if (name.includes('neuro')) return <Brain className="w-8 h-8 text-primary" />;
    if (name.includes('ortho')) return <Bone className="w-8 h-8 text-primary" />;
    if (name.includes('pedia')) return <Baby className="w-8 h-8 text-primary" />;
    if (name.includes('derma')) return <PenTool className="w-8 h-8 text-primary" />;
    return <Stethoscope className="w-8 h-8 text-primary" />;
  };

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
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-3">No Departments Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            There are currently no medical departments available for booking. 
            Please contact us directly for assistance with your appointment.
          </p>
          <Button 
            variant="primary"
            onClick={() => window.location.href = '/contact'}
          >
            Contact Us
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Select Department</h2>
        <p className="text-muted-foreground">
          Please choose the medical department that best fits your needs.
        </p>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {departments.map((department) => (
          <motion.div key={department.id} variants={itemVariants}>
            <div 
              onClick={() => onSelect(department.id)}
              className="cursor-pointer"
            >
              <Card
                hover
                className={`p-6 transition-all duration-300 h-full ${
                  selectedDepartment === department.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    {getDepartmentIcon(department)}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{department.name}</h3>
                  <p className="text-muted-foreground text-sm flex-grow">{department.description}</p>
                  
                  {selectedDepartment === department.id && (
                    <div className="mt-4 flex items-center text-primary">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default StepDepartment;
