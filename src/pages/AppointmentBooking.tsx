import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addDoc, collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
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
  const location = useLocation();
  
  const locationState = location.state as {
    departmentId?: string;
    departmentName?: string;
    doctorId?: string;
    doctorName?: string;
    serviceId?: string;
    serviceName?: string;
  } | null;
  
  // State for departments fetched from doctors collection
  const [departments, setDepartments] = useState<Array<{ id: string, name: string, description: string }>>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  // Fetch departments from doctors in Firebase
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const doctorsRef = collection(db, 'doctors');
        const doctorsSnapshot = await getDocs(query(doctorsRef));
        
        // Extract unique departments from doctors
        const uniqueDepartments = new Map();
        
        doctorsSnapshot.forEach(doc => {
          const doctorData = doc.data();
          if (doctorData.department) {
            // Use department as both id and name if not already added
            const deptId = doctorData.department.toLowerCase().replace(/\s+/g, '-');
            
            if (!uniqueDepartments.has(deptId)) {
              uniqueDepartments.set(deptId, {
                id: deptId,
                name: doctorData.department,
                description: `${doctorData.department} specialists and services`
              });
            }
          }
          
          // Also consider specialty as a department option
          if (doctorData.specialty && doctorData.specialty !== doctorData.department) {
            const specialtyId = doctorData.specialty.toLowerCase().replace(/\s+/g, '-');
            
            if (!uniqueDepartments.has(specialtyId)) {
              uniqueDepartments.set(specialtyId, {
                id: specialtyId,
                name: doctorData.specialty,
                description: `${doctorData.specialty} specialists and services`
              });
            }
          }
        });
        
        // Convert Map to array
        const departmentsArray = Array.from(uniqueDepartments.values());
        setDepartments(departmentsArray);
        
        console.log('Fetched departments:', departmentsArray);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };
    
    fetchDepartments();
  }, []);
  
  // Replace mock doctors with state for real doctors
  const [doctors, setDoctors] = useState<Array<{
    id: string;
    name: string;
    specialty: string;
    department?: string;
    experience?: string;
    rating?: number;
    image?: string;
  }>>([]);
  
  // Add useEffect to fetch doctors from Firebase
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsRef = collection(db, 'doctors');
        const doctorsSnapshot = await getDocs(query(doctorsRef, where('verified', '!=', false)));
        
        const doctorsData = doctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: doc.data().name || 'Unknown Doctor',
          specialty: doc.data().specialty || 'General Medicine'
        }));
        
        setDoctors(doctorsData);
        console.log('Fetched doctors:', doctorsData.length);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Failed to load doctors');
      }
    };
    
    fetchDoctors();
  }, []);

  // Filtered doctors based on selected department
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);
  
  // Update filtered doctors when department changes
  useEffect(() => {
    if (appointmentData.department) {
      const selectedDepartment = departments.find(dept => dept.id === appointmentData.department);
      const departmentName = selectedDepartment?.name.toLowerCase() || '';
      
      // Filter doctors by matching either department or specialty
      const filteredDocs = doctors.filter(doctor => {
        const doctorDept = doctor.department?.toLowerCase() || '';
        const doctorSpecialty = doctor.specialty?.toLowerCase() || '';
        
        return (
          doctorDept.includes(departmentName) || 
          departmentName.includes(doctorDept) ||
          doctorSpecialty.includes(departmentName) || 
          departmentName.includes(doctorSpecialty)
        );
      });
      
      // Fall back to all doctors if none match the filter
      setFilteredDoctors(filteredDocs.length > 0 ? filteredDocs : doctors);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [appointmentData.department, departments, doctors]);
  
  
  // Handle doctor selection
  // (Removed duplicate handleDoctorSelect to fix redeclaration error)
  
  // Handle date and time selection
  // (Removed duplicate handleDateTimeSelect to fix redeclaration error)
  
  // Handle form submission for personal info
  // (Removed duplicate handlePersonalInfoSubmit to fix redeclaration error)
  
  // Handle payment completion
  // (Removed duplicate handlePaymentComplete to fix redeclaration error)
  
  // Handle final submission
  // (Removed duplicate handleFinalSubmit to fix redeclaration error)
  
  // Handle booking another appointment
  // (Removed duplicate handleBookAnother to fix redeclaration error)
  
  // Handle navigation back
  // (Removed duplicate handleBack to fix redeclaration error)
  
  // Use pre-selected options if available from navigation
  useEffect(() => {
    if (locationState) {
      // Handle pre-selected department
      if (locationState.departmentId && locationState.departmentName) {
        setAppointmentData(prev => ({
          ...prev,
          department: locationState.departmentId,
          departmentName: locationState.departmentName
        }));
        
        // If we have a department, move to doctor selection step
        if (currentStep === 1) setCurrentStep(2);
      }
      
      // Handle pre-selected doctor
      if (locationState.doctorId && locationState.doctorName) {
        setAppointmentData(prev => ({
          ...prev,
          doctor: locationState.doctorId,
          doctorName: locationState.doctorName
        }));
        
        // If we have a doctor and we're at step 1 or 2, move to date/time step
        if (currentStep <= 2) setCurrentStep(3);
        
        // Fetch doctor info to get department if missing
        const fetchDoctorInfo = async () => {
          try {
            const doctorDoc = await getDoc(doc(db, 'doctors', locationState.doctorId!));
            if (doctorDoc.exists() && !locationState.departmentName) {
              const doctorData = doctorDoc.data();
              const department = doctorData.department || doctorData.specialty;
              
              if (department) {
                setAppointmentData(prev => ({
                  ...prev,
                  department: department.toLowerCase().replace(/\s+/g, '-'),
                  departmentName: department
                }));
              }
            }
          } catch (error) {
            console.error("Error fetching doctor info:", error);
          }
        };
        
        if (!locationState.departmentName) fetchDoctorInfo();
      }
      
      // Handle pre-selected service
      if (locationState.serviceId && locationState.serviceName) {
        // Find department that offers this service
        // This would require fetching service details to find associated department
        const fetchServiceInfo = async () => {
          try {
            const serviceDoc = await getDoc(doc(db, 'services', locationState.serviceId!));
            if (serviceDoc.exists()) {
              const serviceData = serviceDoc.data();
              if (serviceData.department || serviceData.category) {
                const serviceDept = serviceData.department || serviceData.category;
                setAppointmentData(prev => ({
                  ...prev,
                  department: serviceDept.toLowerCase().replace(/\s+/g, '-'),
                  departmentName: serviceDept,
                  service: locationState.serviceId,
                  serviceName: locationState.serviceName
                }));
                
                // Move to step 2 if we're at step 1
                if (currentStep === 1) setCurrentStep(2);
              }
            }
          } catch (error) {
            console.error("Error fetching service info:", error);
          }
        };
        
        fetchServiceInfo();
      }
    }
  }, [location, departments.length]);
  
  // Update filtered doctors when department changes and when doctors are loaded
  useEffect(() => {
    if (appointmentData.department && doctors.length > 0) {
      const selectedDepartment = departments.find(dept => dept.id === appointmentData.department);
      const departmentName = selectedDepartment?.name.toLowerCase() || '';
      
      // Filter doctors by matching either department or specialty
      const filteredDocs = doctors.filter(doctor => {
        const doctorDept = doctor.department?.toLowerCase() || '';
        const doctorSpecialty = doctor.specialty?.toLowerCase() || '';
        
        return (
          doctorDept.includes(departmentName) || 
          departmentName.includes(doctorDept) ||
          doctorSpecialty.includes(departmentName) || 
          departmentName.includes(doctorSpecialty)
        );
      });
      
      // If we have a pre-selected doctor, make sure they're in the filtered list
      if (appointmentData.doctor) {
        const selectedDoctorExists = filteredDocs.some(doc => doc.id === appointmentData.doctor);
        if (!selectedDoctorExists) {
          const selectedDoctor = doctors.find(doc => doc.id === appointmentData.doctor);
          if (selectedDoctor) {
            filteredDocs.push(selectedDoctor);
          }
        }
      }
      
      setFilteredDoctors(filteredDocs.length > 0 ? filteredDocs : doctors);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [appointmentData.department, doctors, appointmentData.doctor]);

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
      
      // Filter doctors for this department
      const filteredDocs = doctors.filter(doctor => 
        doctor.department?.toLowerCase() === selectedDepartment.name.toLowerCase() ||
        doctor.specialty?.toLowerCase() === selectedDepartment.name.toLowerCase()
      );
      setFilteredDoctors(filteredDocs);
      
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
            loading={loadingDepartments}
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
            departmentName={appointmentData.departmentName} // Pass departmentName
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
      
      {/* Modern Hero Section with Consistent Design */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Layered background elements */}
        <div className="absolute inset-0 w-full h-full">
          {/* Base image with modern medical theme */}
          <img
            src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1920&h=1080&fit=crop&q=80"
            alt="Medical appointment"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Gradient overlays for depth and text contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/90 z-10"></div>
          <div className="absolute inset-0 bg-black/30 z-[9]"></div>
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.svg')] opacity-10 z-[11]"></div>
          
          {/* Animated blob elements */}
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-accent/10 mix-blend-overlay animate-blob animation-delay-2000 z-[12]"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-secondary/10 mix-blend-overlay animate-blob z-[12]"></div>
          <div className="absolute top-[60%] right-[20%] w-[400px] h-[400px] rounded-full bg-primary-light/10 mix-blend-overlay animate-blob animation-delay-4000 z-[12]"></div>
          
          {/* Floating geometric shapes */}
          <motion.div 
            className="absolute top-[20%] right-[20%] w-24 h-24 border-2 border-white/10 rounded-lg z-[13] hidden md:block"
            animate={{ 
              rotate: 360,
              y: [0, 15, 0],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
          ></motion.div>
          
          {/* Particle effects */}
          <div className="absolute inset-0 z-[14]">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full hidden md:block"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="container-hospital relative z-20 px-6 py-16 md:py-24 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="inline-flex items-center px-5 py-3 rounded-full bg-white/15 backdrop-blur-lg text-base font-medium text-white shadow-glow mb-6">
                <div className="relative mr-3">
                  <div className="w-3 h-3 rounded-full bg-accent animate-pulse-soft"></div>
                  <div className="absolute -inset-1 rounded-full bg-accent/30 animate-ripple"></div>
                </div>
                Schedule Your Visit
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Book Your <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Appointment</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed backdrop-blur-sm bg-white/5 p-5 rounded-xl border border-white/10">
                Schedule a visit with our expert medical professionals for personalized care and treatment tailored to your health needs.
              </p>
            </motion.div>
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
                {currentStep === 1 && (
                  <StepDepartment
                    departments={departments}
                    selectedDepartment={appointmentData.department}
                    onSelect={handleDepartmentSelect}
                    loading={loadingDepartments}
                  />
                )}
                {currentStep === 2 && (
                  <StepDoctor
                    doctors={filteredDoctors}
                    selectedDoctor={appointmentData.doctor}
                    onSelect={handleDoctorSelect}
                    onBack={handleBack}
                    loading={loading.doctors}
                    departmentName={appointmentData.departmentName} // Pass departmentName
                  />
                )}
                {currentStep === 3 && (
                  <StepDateTime
                    doctorId={appointmentData.doctor}
                    selectedDate={appointmentData.date}
                    selectedTime={appointmentData.time}
                    onSelect={handleDateTimeSelect}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 4 && (
                  <StepPersonalInfo
                    formData={appointmentData}
                    onSubmit={handlePersonalInfoSubmit}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 5 && (
                  <StepPayment
                    appointmentData={appointmentData}
                    onComplete={handlePaymentComplete}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 6 && (
                  <StepSummary
                    appointmentData={appointmentData}
                    onSubmit={handleFinalSubmit}
                    onBack={handleBack}
                    isSubmitting={loading.submission}
                  />
                )}
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
