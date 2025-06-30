import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, Building, FileText, CheckCircle } from 'lucide-react';
import Button from '../../atoms/Button';
import { AppointmentData } from '../../../pages/AppointmentBooking';

interface StepSummaryProps {
  appointmentData: AppointmentData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const StepSummary: React.FC<StepSummaryProps> = ({
  appointmentData,
  onSubmit,
  onBack,
  isSubmitting
}) => {
  // Format date to display in a nice format
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <h2 className="text-2xl font-bold text-foreground mb-1">Review & Confirm</h2>
          <p className="text-muted-foreground">
            Please review your appointment details before confirming
          </p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Appointment Details */}
        <motion.div variants={itemVariants} className="p-6 border border-border rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Appointment Details
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium text-foreground flex items-center">
                  <Building className="w-4 h-4 mr-2 text-primary" />
                  {appointmentData.departmentName}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium text-foreground flex items-center">
                  <User className="w-4 h-4 mr-2 text-primary" />
                  Dr. {appointmentData.doctorName}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium text-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  {formatDate(appointmentData.date)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium text-foreground flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-primary" />
                  {appointmentData.time}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Personal Information */}
        <motion.div variants={itemVariants} className="p-6 border border-border rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            Patient Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium text-foreground">
                  {appointmentData.firstName} {appointmentData.lastName}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">
                  {appointmentData.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">
                  {appointmentData.phone}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Patient Status</p>
                <p className="font-medium text-foreground">
                  {appointmentData.isNewPatient ? 'New Patient' : 'Returning Patient'}
                </p>
              </div>
            </div>
          </div>
          
          {(appointmentData.insuranceProvider || appointmentData.insuranceNumber) && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="font-medium text-foreground mb-2">Insurance Information</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {appointmentData.insuranceProvider && (
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="text-foreground">{appointmentData.insuranceProvider}</p>
                  </div>
                )}
                
                {appointmentData.insuranceNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Insurance Number</p>
                    <p className="text-foreground">{appointmentData.insuranceNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Additional Information */}
        {appointmentData.message && (
          <motion.div variants={itemVariants} className="p-6 border border-border rounded-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Additional Information
            </h3>
            <p className="text-muted-foreground">
              {appointmentData.message}
            </p>
          </motion.div>
        )}
        
        {/* Terms and Policy */}
        <motion.div variants={itemVariants} className="p-6 rounded-xl bg-muted/10">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-5 h-5 text-primary mr-2" />
            <p className="font-medium text-foreground">Appointment Terms</p>
          </div>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            <li>Please arrive 15 minutes before your scheduled appointment time.</li>
            <li>Bring your insurance card and a valid ID.</li>
            <li>You may cancel or reschedule your appointment up to 24 hours before the scheduled time.</li>
            <li>Late arrivals may result in rescheduling if the delay affects other patients.</li>
          </ul>
        </motion.div>
        
        {/* Submit Button */}
        <motion.div variants={itemVariants} className="flex justify-center pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full md:w-auto px-12"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Confirm Appointment</span>
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StepSummary;
