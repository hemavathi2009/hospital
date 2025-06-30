import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Components
import Navigation from '../components/organisms/Navigation';
import Footer from '../components/organisms/Footer'; 
import StepDepartment from '../components/molecules/appointment/StepDepartment';
import StepDoctor from '../components/molecules/appointment/StepDoctor';
import StepDateTime from '../components/molecules/appointment/StepDateTime';
import StepPersonalInfo from '../components/molecules/appointment/StepPersonalInfo';
import StepPayment from '../components/molecules/appointment/StepPayment';
import StepSummary from '../components/molecules/appointment/StepSummary';
import AppointmentProgress from '../components/molecules/appointment/AppointmentProgress';
import AppointmentSuccess from '../components/molecules/appointment/AppointmentSuccess';
// Please ensure the file exists at the specified path. If not, update the path below:
// import AppointmentSuccess from '../components/molecules/appointment/AppointmentSuccess'; // Update this path if the file is located elsewhere

// Firebase
import { db } from '../lib/firebase';

// Types
export interface AppointmentData {
  department: string;
  departmentName: string;
  doctor: string;
  doctorName: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isNewPatient?: boolean;
  insuranceProvider?: string;
  insuranceNumber?: string;
  message?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'completed';
  createdAt?: any;
}

const AppointmentBooking: React.FC = () => {
  // State for current step
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  // State for appointment data
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    department: '',
    departmentName: '',
    doctor: '',
    doctorName: '',
    date: '',
    time: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Loading states
  const [loading, setLoading] = useState({
    departments: false,
    doctors: false,
    submission: false
  });
  
  // State for appointment confirmation
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [appointmentConfirmation, setAppointmentConfirmation] = useState<{id: string, data: AppointmentData} | null>(null);
  
  const navigate = useNavigate();
  
  // Mock departments data (replace with real data fetching)
  const [departments, setDepartments] = useState([
    { id: 'cardio', name: 'Cardiology', description: 'Heart and cardiovascular system specialists.' },
    { id: 'neuro', name: 'Neurology', description: 'Specialists in nervous system disorders.' },
    { id: 'ortho', name: 'Orthopedics', description: 'Bone, joint, and muscle specialists.' },
    { id: 'derma', name: 'Dermatology', description: 'Skin, hair, and nail specialists.' },
    { id: 'pedia', name: 'Pediatrics', description: 'Medical care for infants, children, and teenagers.' },
    { id: 'general', name: 'General Medicine', description: 'Primary care for adults across a wide range of health issues.' },
  ]);
  
  // Mock doctors data (replace with real data fetching)
  const [doctors, setDoctors] = useState([
    { 
      id: 'doc1', 
      name: 'John Smith', 
      specialty: 'Cardiology',
      department: 'cardio',
      experience: '15 years',
      rating: 4.8 
    },
    { 
      id: 'doc2', 
      name: 'Emily Johnson', 
      specialty: 'Neurology',
      department: 'neuro',
      experience: '10 years',
      rating: 4.9 
    },
    { 
      id: 'doc3', 
      name: 'Michael Brown', 
      specialty: 'Orthopedics',
      department: 'ortho',
      experience: '12 years',
      rating: 4.7 
    }
  ]);
  
  // Filtered doctors based on selected department
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);
  
  // Update filtered doctors when department changes
  useEffect(() => {
    if (appointmentData.department) {
      setFilteredDoctors(doctors.filter(doctor => doctor.department === appointmentData.department));
    }
  }, [appointmentData.department]);

  // Handle department selection
  const handleDepartmentSelect = (departmentId: string) => {
    const selectedDepartment = departments.find(dept => dept.id === departmentId);
    if (selectedDepartment) {
      setAppointmentData(prev => ({
        ...prev, 
        department: departmentId,
        departmentName: selectedDepartment.name,
        // Reset doctor when department changes
        doctor: '',
        doctorName: ''
      }));
      setCurrentStep(2);
    }
  };
  
  // Handle doctor selection
  const handleDoctorSelect = (doctorId: string) => {
    const selectedDoctor = doctors.find(doc => doc.id === doctorId);
    if (selectedDoctor) {
      setAppointmentData(prev => ({
        ...prev, 
        doctor: doctorId,
        doctorName: selectedDoctor.name
      }));
      setCurrentStep(3);
    }
  };
  
  // Handle date and time selection
  const handleDateTimeSelect = (date: string, time: string) => {
    setAppointmentData(prev => ({ ...prev, date, time }));
    setCurrentStep(4);
  };
  
  // Handle form submission for personal info
  const handlePersonalInfoSubmit = (data: Partial<AppointmentData>) => {
    setAppointmentData(prev => ({ ...prev, ...data }));
    setCurrentStep(5);
  };
  
  // Handle payment completion
  const handlePaymentComplete = () => {
    setAppointmentData(prev => ({ 
      ...prev, 
      paymentStatus: 'completed' 
    }));
    setCurrentStep(6);
  };
  
  // Handle final submission
  const handleFinalSubmit = async () => {
    try {
      setLoading(prev => ({ ...prev, submission: true }));
      
      // Prepare data for submission
      const appointmentToSubmit = {
        ...appointmentData,
        status: 'pending',
        createdAt: new Date()
      };
      
      // Save to Firestore
      const appointmentRef = await addDoc(collection(db, 'appointments'), appointmentToSubmit);
      
      // Show success notification
      toast.success('Appointment booked successfully!');
      
      // Set confirmation data
      setAppointmentConfirmation({
        id: appointmentRef.id,
        data: appointmentData
      });
      setIsConfirmed(true);
      
      // Reset loading state
      setLoading(prev => ({ ...prev, submission: false }));
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };
  
  // Handle booking another appointment
  const handleBookAnother = () => {
    // Reset form data
    setAppointmentData({
      department: '',
      departmentName: '',
      doctor: '',
      doctorName: '',
      date: '',
      time: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });
    
    // Reset state
    setIsConfirmed(false);
    setCurrentStep(1);
    setAppointmentConfirmation(null);
  };
  
  // Handle navigation back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Render steps based on current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepDepartment
            departments={departments}
            selectedDepartment={appointmentData.department}
            onSelect={handleDepartmentSelect}
            loading={loading.departments}
          />
        );
      case 2:
        return (
          <StepDoctor
            doctors={filteredDoctors}
            selectedDoctor={appointmentData.doctor}
            onSelect={handleDoctorSelect}
            onBack={handleBack}
            loading={loading.doctors}
          />
        );
      case 3:
        return (
          <StepDateTime
            doctorId={appointmentData.doctor}
            selectedDate={appointmentData.date}
            selectedTime={appointmentData.time}
            onSelect={handleDateTimeSelect}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <StepPersonalInfo
            formData={appointmentData}
            onSubmit={handlePersonalInfoSubmit}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <StepPayment
            appointmentData={appointmentData}
            onComplete={handlePaymentComplete}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <StepSummary
            appointmentData={appointmentData}
            onSubmit={handleFinalSubmit}
            onBack={handleBack}
            isSubmitting={loading.submission}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Background Image */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id="radialGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#radialGradient)" />
          </svg>
        </div>
        
        <div className="container-hospital relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Book Your <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Appointment</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto">
              Schedule a visit with our expert medical professionals for personalized care and treatment.
            </p>
          </motion.div>
        </div>
      </section>
      
      <section className="py-12 px-4 md:py-16 lg:py-20">
        <div className="container-hospital max-w-5xl mx-auto">
          {!isConfirmed ? (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">Complete Your Booking</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Follow the steps below to schedule your appointment.
                </p>
              </div>
              
              <div className="mb-10">
                <AppointmentProgress currentStep={currentStep} totalSteps={totalSteps} />
              </div>
              
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card"
              >
                {renderStep()}
              </motion.div>
            </>
          ) : (
            // Show appointment confirmation screen
            <AppointmentSuccess 
              appointmentData={appointmentData}
              appointmentId={appointmentConfirmation?.id || ''}
              onBookAnother={handleBookAnother}
              onViewAppointments={() => navigate('/patient-portal')}
            />
          )}
        </div>
      </section>
      
      <Footer variant="simple" />
    </div>
  );
};

export default AppointmentBooking;
