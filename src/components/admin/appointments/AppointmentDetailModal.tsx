import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Phone, Mail, MessageSquare, Save } from 'lucide-react';
import Button from '../../atoms/Button';
import AppointmentStatusBadge from '../../atoms/AppointmentStatusBadge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  patientName: string;
  date: any; // Firestore timestamp
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'pending';
  doctorId: string;
  doctorName?: string;
  departmentName?: string;
  patientEmail?: string;
  patientPhone?: string;
  message?: string;
}

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onStatusChange
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize the selected status when appointment changes
  React.useEffect(() => {
    if (appointment) {
      setSelectedStatus(appointment.status);
    }
  }, [appointment]);
  
  if (!appointment) return null;

  // Format date to display in a nice format
  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    
    // Handle Firestore timestamp
    const date = dateValue.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Update appointment status
  const handleStatusUpdate = async () => {
    if (!appointment || selectedStatus === appointment.status) return;
    
    setIsSaving(true);
    try {
      // Update in Firestore
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        status: selectedStatus
      });
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(appointment.id, selectedStatus);
      }
      
      toast.success('Appointment status updated');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-xl shadow-lg w-full max-w-lg relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-muted/10 p-4 border-b border-border">
              <h3 className="text-xl font-medium">Appointment Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col space-y-6">
                {/* Status Badge */}
                <div className="flex justify-center mb-2">
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
                
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(appointment.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{appointment.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Patient Name</p>
                      <p className="font-medium">{appointment.patientName}</p>
                    </div>
                  </div>
                  
                  {appointment.doctorName && (
                    <div className="flex items-start">
                      <User className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Doctor</p>
                        <p className="font-medium">Dr. {appointment.doctorName}</p>
                      </div>
                    </div>
                  )}
                  
                  {appointment.departmentName && (
                    <div className="flex items-start">
                      <User className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{appointment.departmentName}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contact Information */}
                <div className="bg-muted/10 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">Contact Information</h4>
                  
                  {appointment.patientEmail && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="text-sm">{appointment.patientEmail}</span>
                    </div>
                  )}
                  
                  {appointment.patientPhone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="text-sm">{appointment.patientPhone}</span>
                    </div>
                  )}
                </div>
                
                {/* Message */}
                {appointment.message && (
                  <div className="bg-muted/10 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground mr-2" />
                      <h4 className="font-medium text-sm">Additional Information</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.message}</p>
                  </div>
                )}
                
                {/* Status Update */}
                <div className="bg-muted/10 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-3">Update Status</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {['scheduled', 'completed', 'cancelled', 'no-show'].map(status => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`py-2 px-3 rounded-lg border ${
                          selectedStatus === status
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background border-border hover:bg-muted/20'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                variant="primary" 
                onClick={handleStatusUpdate}
                disabled={isSaving || selectedStatus === appointment.status}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentDetailModal;
