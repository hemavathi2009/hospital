import React from 'react';
import { Check, Calendar, ClipboardList, User } from 'lucide-react';
import Card from '../../atoms/Card';
import Button from '../../atoms/Button';
import { AppointmentData } from '../../../pages/AppointmentBooking';

interface AppointmentSuccessProps {
  appointmentData: AppointmentData;
  appointmentId: string;
  onBookAnother: () => void;
  onViewAppointments: () => void;
}

const AppointmentSuccess: React.FC<AppointmentSuccessProps> = ({
  appointmentData,
  appointmentId,
  onBookAnother,
  onViewAppointments
}) => {
  return (
    <Card premium className="p-8 text-center max-w-3xl mx-auto">
      <div className="w-20 h-20 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-3">Appointment Confirmed!</h2>
      <p className="text-muted-foreground mb-6">
        Your appointment has been scheduled successfully. We've sent a confirmation to your email.
      </p>
      
      <div className="bg-muted/30 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-sm text-muted-foreground">Doctor</p>
            <p className="font-medium text-foreground">Dr. {appointmentData.doctorName}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-medium text-foreground">{appointmentData.departmentName}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Date & Time</p>
            <p className="font-medium text-foreground">{appointmentData.date} at {appointmentData.time}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Patient</p>
            <p className="font-medium text-foreground">{appointmentData.firstName} {appointmentData.lastName}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <Button variant="outline" onClick={onBookAnother}>
          <Calendar className="w-4 h-4 mr-2" />
          Book Another Appointment
        </Button>
        <Button variant="primary" onClick={onViewAppointments}>
          <ClipboardList className="w-4 h-4 mr-2" />
          View My Appointments
        </Button>
      </div>
    </Card>
  );
};

export default AppointmentSuccess;
