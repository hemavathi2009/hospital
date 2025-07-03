import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import { 
  Calendar, 
  FileText, 
  Clock, 
  User, 
  Users,
  Settings,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Pill,
  FileBarChart,
  Clipboard,
  PlusCircle,
  RefreshCw,
  Filter,
  Search,
  UserCog,
  Plus,
  Heart,
  Check,
  PenTool
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import Footer from '../components/organisms/Footer';

type DoctorProfile = {
  id: string;
  name?: string;
  email?: string;
  bio?: string;
  phone?: string;
  location?: string;
  specialty?: string;
  experience?: string;
  availability?: { [key: string]: string[] };
  [key: string]: any; // For any additional fields
};

const DoctorPortal: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  type Appointment = {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    date?: any;
    time?: string;
    reason?: string;
    status?: string;
    [key: string]: any;
  };
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [availability, setAvailability] = useState<{[key: string]: string[]}>({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    phone: '',
    location: '',
    specialization: '',
    experience: ''
  });
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
  ];

  useEffect(() => {
    if (!currentUser) {
      // Redirect to sign-in page with doctor portal type pre-selected
      navigate('/signin', { state: { userType: 'doctor' } });
      return;
    }
    
    // First check if user has doctor role (only doctors or admins can access)
    if (userRole !== 'doctor' && userRole !== 'admin') {
      toast.error('Access denied. This portal is for verified doctors only.');
      navigate('/');
      return;
    }

    // Then verify that the doctor exists in the doctors collection (added by admin)
    // Admin can always access without this check
    const verifyDoctorAccess = async () => {
      try {
        if (userRole === 'admin') {
          // Admin can always access
          fetchDoctorData();
          fetchAppointments();
          return;
        }
        
        const doctorsRef = collection(db, 'doctors');
        const q = query(doctorsRef, where('email', '==', currentUser?.email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          toast.error('Your doctor account has not been verified by admin yet. Please contact administration for access.');
          navigate('/');
          return;
        }
        
        // Doctor is verified, proceed to fetch data
        fetchDoctorData();
        fetchAppointments();
      } catch (error) {
        console.error('Error verifying doctor access:', error);
        toast.error('An error occurred while verifying your access.');
        navigate('/');
      }
    };
    
    verifyDoctorAccess();
  }, [currentUser, navigate, userRole]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      
      // Find doctor by email
      const doctorsRef = collection(db, 'doctors');
      const q = query(doctorsRef, where('email', '==', currentUser?.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create a basic doctor profile if not found
        const doctorsCollectionRef = collection(db, 'doctors');
        const newDoctorRef = doc(doctorsCollectionRef);
        const newDoctorData = {
          email: currentUser?.email,
          name: currentUser?.displayName || 'Doctor',
          specialty: 'General Medicine',
          bio: 'Doctor at the hospital',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(newDoctorRef, newDoctorData);
        toast.info('New doctor profile created. Please update your information.');
        
        // Set the doctor profile with the newly created data
        const doctorData = {
          id: newDoctorRef.id,
          ...newDoctorData
        } as DoctorProfile;
        
        setDoctorProfile(doctorData);
        setProfileForm({
          bio: doctorData.bio || '',
          phone: '',
          location: '',
          specialization: doctorData.specialty || '',
          experience: ''
        });
        
        // Set default availability
        const defaultAvailability = {};
        daysOfWeek.forEach(day => {
          defaultAvailability[day] = ['9:00 AM', '10:00 AM', '11:00 AM'];
        });
        setAvailability(defaultAvailability);
        return;
      }
      
      const doctorData = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } as DoctorProfile;
      
      setDoctorProfile(doctorData);
      setProfileForm({
        bio: doctorData.bio || '',
        phone: doctorData.phone || '',
        location: doctorData.location || '',
        specialization: doctorData.specialty || '',
        experience: doctorData.experience || ''
      });
      
      // Set availability
      if (doctorData.availability) {
        setAvailability(doctorData.availability);
      } else {
        // Initialize default availability
        const defaultAvailability: {[key: string]: string[]} = {};
        daysOfWeek.forEach(day => {
          defaultAvailability[day] = [];
        });
        setAvailability(defaultAvailability);
      }
      
      console.log('Doctor profile loaded:', doctorData);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      toast.error('Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      if (!currentUser?.email) return;
      
      const appointmentsRef = collection(db, 'appointments');
      // Create OR query condition to find appointments by either doctor email or name
      const q = query(
        appointmentsRef,
        where('doctorEmail', '==', currentUser.email),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const appointmentsData = querySnapshot.docs.map(doc => {
        const data = doc.data() as { [key: string]: any };
        return {
          id: doc.id,
          email: data.email ?? '',
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          phone: data.phone ?? '',
          date: data.date,
          time: data.time ?? '',
          reason: data.reason ?? '',
          status: data.status ?? '',
          ...data
        };
      });
      
      setAppointments(appointmentsData);
      
      // Extract unique patients from appointments
      const uniquePatients = Array.from(
        new Map(
          appointmentsData
            .filter(apt => apt.email) // Ensure email exists
            .map(apt => [
              apt.email, 
              { 
                email: apt.email, 
                name: `${apt.firstName ?? ''} ${apt.lastName ?? ''}`.trim(),
                phone: apt.phone,
                lastVisit: apt.date,
                appointmentCount: 1
              }
            ])
        ).values()
      );
      
      // Count appointments per patient
      const patientAppointmentCount: {[email: string]: number} = {};
      appointmentsData.forEach(apt => {
        if (apt.email) {
          patientAppointmentCount[apt.email] = (patientAppointmentCount[apt.email] || 0) + 1;
        }
      });
      
      // Update appointment count for each patient
      uniquePatients.forEach(patient => {
        patient.appointmentCount = patientAppointmentCount[patient.email] || 1;
      });
      
      setPatients(uniquePatients);
      console.log('Appointments loaded:', appointmentsData.length);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  const handleAvailabilityChange = (day: string, time: string) => {
    setAvailability(prev => {
      const dayAvailability = [...(prev[day] || [])];
      
      if (dayAvailability.includes(time)) {
        return {
          ...prev,
          [day]: dayAvailability.filter(t => t !== time)
        };
      } else {
        return {
          ...prev,
          [day]: [...dayAvailability, time].sort((a, b) => {
            return timeSlots.indexOf(a) - timeSlots.indexOf(b);
          })
        };
      }
    });
  };
  
  const saveAvailability = async () => {
    try {
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found');
        return;
      }
      
      const doctorRef = doc(db, 'doctors', doctorProfile.id);
      await updateDoc(doctorRef, {
        availability,
        updatedAt: new Date()
      });
      
      toast.success('Availability updated successfully');
      setEditingAvailability(false);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  const saveProfileChanges = async () => {
    try {
      if (!doctorProfile?.id) {
        toast.error('Doctor profile not found');
        return;
      }
      
      const doctorRef = doc(db, 'doctors', doctorProfile.id);
      await updateDoc(doctorRef, {
        bio: profileForm.bio,
        phone: profileForm.phone,
        location: profileForm.location,
        specialty: profileForm.specialization,
        experience: profileForm.experience,
        updatedAt: new Date()
      });
      
      // Update local state
      setDoctorProfile({
        ...doctorProfile,
        bio: profileForm.bio,
        phone: profileForm.phone,
        location: profileForm.location,
        specialty: profileForm.specialization,
        experience: profileForm.experience
      });
      
      toast.success('Profile updated successfully');
      setEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };
  
  const formatDate = (dateString: any) => {
    if (!dateString) return 'N/A';
    try {
      if (dateString.seconds) {
        return new Date(dateString.seconds * 1000).toLocaleDateString();
      }
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update the appointments state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      
      toast.success(`Appointment marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment status');
    }
  };
  
  // Add medical note/record
  const [addingNote, setAddingNote] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [noteForm, setNoteForm] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    prescription: ''
  });
  
  const handleNoteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNoteForm(prev => ({ ...prev, [name]: value }));
  };
  
  const saveNote = async () => {
    try {
      if (!selectedAppointment) {
        toast.error('No appointment selected');
        return;
      }
      
      // Save medical record
      const medicalRecordsRef = collection(db, 'medicalRecords');
      await addDoc(medicalRecordsRef, {
        patientEmail: selectedAppointment.email,
        patientName: `${selectedAppointment.firstName} ${selectedAppointment.lastName}`,
        doctor: doctorProfile?.name || currentUser?.displayName,
        doctorEmail: currentUser?.email,
        diagnosis: noteForm.diagnosis,
        treatment: noteForm.treatment,
        notes: noteForm.notes,
        appointmentId: selectedAppointment.id,
        date: new Date(),
        createdAt: new Date()
      });
      
      // If prescription is provided, save it
      if (noteForm.prescription.trim()) {
        const prescriptionsRef = collection(db, 'prescriptions');
        await addDoc(prescriptionsRef, {
          patientEmail: selectedAppointment.email,
          patientName: `${selectedAppointment.firstName} ${selectedAppointment.lastName}`,
          doctor: doctorProfile?.name || currentUser?.displayName,
          doctorEmail: currentUser?.email,
          medications: [
            {
              name: 'Medication',
              dosage: 'As prescribed',
              frequency: 'As needed',
              duration: 'As directed'
            }
          ],
          notes: noteForm.prescription,
          appointmentId: selectedAppointment.id,
          date: new Date(),
          createdAt: new Date()
        });
      }
      
      // Update the appointment with notes
      const appointmentRef = doc(db, 'appointments', selectedAppointment.id);
      await updateDoc(appointmentRef, {
        notes: noteForm.notes,
        status: 'completed',
        updatedAt: new Date()
      });
      
      // Update the appointments state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, notes: noteForm.notes, status: 'completed' } 
            : apt
        )
      );
      
      toast.success('Medical record saved successfully');
      setAddingNote(false);
      setSelectedAppointment(null);
      setNoteForm({
        diagnosis: '',
        treatment: '',
        notes: '',
        prescription: ''
      });
    } catch (error) {
      console.error('Error saving medical record:', error);
      toast.error('Failed to save medical record');
    }
  };
  
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };
  
  const renderAppointments = () => {
    // Filter appointments by today, upcoming, and past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAppointments = appointments.filter(apt => {
      const aptDate = apt.date?.seconds 
        ? new Date(apt.date.seconds * 1000) 
        : new Date(apt.date);
      const aptDay = new Date(aptDate);
      aptDay.setHours(0, 0, 0, 0);
      return aptDay.getTime() === today.getTime();
    });
    
    const upcomingAppointments = appointments.filter(apt => {
      const aptDate = apt.date?.seconds 
        ? new Date(apt.date.seconds * 1000) 
        : new Date(apt.date);
      return aptDate > today && apt.status !== 'completed' && apt.status !== 'cancelled';
    });
    
    const pastAppointments = appointments.filter(apt => {
      const aptDate = apt.date?.seconds 
        ? new Date(apt.date.seconds * 1000) 
        : new Date(apt.date);
      return aptDate < today || apt.status === 'completed' || apt.status === 'cancelled';
    });
    
    return (
      <div className="space-y-8">
        {/* Today's Appointments */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Today's Appointments
          </h3>
          <div className="space-y-4">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => (
                <Card key={appointment.id} premium className="p-6 bg-primary/5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-foreground mr-3">
                          {appointment.firstName} {appointment.lastName}
                        </h4>
                        <Badge variant={getStatusColor(appointment.status)} size="sm">
                          {appointment.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.time}
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {appointment.email}
                        </div>
                        {appointment.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {appointment.phone}
                          </div>
                        )}
                      </div>
                      {appointment.reason && (
                        <div className="mt-3 bg-muted/50 p-3 rounded-xl">
                          <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                          <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {appointment.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1 text-success" />
                          Confirm
                        </Button>
                      )}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1 text-info" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card premium className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-foreground mb-1">No appointments today</p>
                  <p className="text-muted-foreground mb-4">You have no scheduled appointments for today</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Upcoming Appointments
          </h3>
          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} premium className="p-6 bg-muted/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-foreground mr-3">
                          {appointment.firstName} {appointment.lastName}
                        </h4>
                        <Badge variant={getStatusColor(appointment.status)} size="sm">
                          {appointment.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-primary" />
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.time}
                        </div>
                      </div>
                      {appointment.reason && (
                        <div className="mt-3 bg-muted/50 p-3 rounded-xl">
                          <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                          <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {appointment.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1 text-success" />
                          Confirm
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card premium className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-foreground mb-1">No upcoming appointments</p>
                  <p className="text-muted-foreground mb-4">You don't have any scheduled appointments</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Past Appointments */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-500" />
            Past Appointments
          </h3>
          <div className="space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.slice(0, 5).map((appointment) => (
                <Card key={appointment.id} premium className="p-6 bg-muted/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-foreground mr-3">
                          {appointment.firstName} {appointment.lastName}
                        </h4>
                        <Badge variant={getStatusColor(appointment.status)} size="sm">
                          {appointment.status || 'completed'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-amber-500" />
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card premium className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <Clock className="w-16 h-16 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium text-foreground mb-1">No appointment history</p>
                  <p className="text-muted-foreground">Your past appointments will appear here</p>
                </div>
              </Card>
            )}
            {pastAppointments.length > 5 && (
              <div className="text-center">
                <Button variant="outline">
                  View All Past Appointments
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAvailability = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-foreground">
            Your Availability
          </h3>
          {editingAvailability ? (
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Reset to original availability
                  setAvailability(doctorProfile.availability || {});
                  setEditingAvailability(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={saveAvailability}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setEditingAvailability(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Availability
            </Button>
          )}
        </div>

        <Card premium className="p-6">
          {editingAvailability ? (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground mb-4">
                Click on time slots to toggle availability
              </p>
              
              {daysOfWeek.map(day => (
                <div key={day} className="border-b border-border pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                  <h4 className="font-medium mb-3">{day}</h4>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => handleAvailabilityChange(day, time)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          (availability[day] || []).includes(time)
                            ? 'bg-primary text-white'
                            : 'bg-muted/20 hover:bg-muted/40'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                    {timeSlots.length === 0 && (
                      <p className="text-sm text-muted-foreground">No time slots available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {daysOfWeek.map(day => (
                <div key={day} className="border-b border-border pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                  <h4 className="font-medium mb-3">{day}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(availability[day] || []).length > 0 ? (
                      (availability[day] || []).map(time => (
                        <span
                          key={time}
                          className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md"
                        >
                          {time}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Not available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderPatients = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Your Patients
        </h3>
        
        {patients.length > 0 ? (
          <Card premium className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Phone</th>
                    <th className="text-left p-4 font-medium">Last Visit</th>
                    <th className="text-left p-4 font-medium">Total Visits</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(patient => (
                    <tr key={patient.email} className="border-t border-border hover:bg-muted/10">
                      <td className="p-4 font-medium">{patient.name}</td>
                      <td className="p-4">{patient.email}</td>
                      <td className="p-4">{patient.phone || 'N/A'}</td>
                      <td className="p-4">{formatDate(patient.lastVisit)}</td>
                      <td className="p-4">{patient.appointmentCount}</td>
                      <td className="p-4">
                        <Button variant="outline" size="sm">
                          View History
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card premium className="p-8 text-center">
            <div className="flex flex-col items-center">
              <Users className="w-16 h-16 text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-foreground mb-1">No patients yet</p>
              <p className="text-muted-foreground">Your patient list will appear here</p>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="space-y-8">
        {userRole === 'admin' && (
          <Card className="p-6 bg-amber-50 border-amber-200">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-amber-800 mb-1">
                  Administrator Access
                </h3>
                <p className="text-amber-700 mb-4">
                  You're viewing the Doctor Portal as an administrator. You can manage pending doctor verification 
                  requests in the Admin Dashboard.
                </p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => navigate('/admin/doctors')}
                >
                  Manage Doctor Approvals
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        <Card premium className="p-8">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">
                    Dr. {doctorProfile?.name || currentUser?.displayName || 'Doctor Name'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {doctorProfile?.specialty || 'Specialist'} • {doctorProfile?.experience || 'N/A'} Experience
                  </p>
                </div>
                {editingProfile ? (
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setProfileForm({
                          bio: doctorProfile?.bio || '',
                          phone: doctorProfile?.phone || '',
                          location: doctorProfile?.location || '',
                          specialization: doctorProfile?.specialty || '',
                          experience: doctorProfile?.experience || ''
                        });
                        setEditingProfile(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={saveProfileChanges}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Profile Information</h4>
                  {editingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Specialization</label>
                        <input
                          type="text"
                          name="specialization"
                          value={profileForm.specialization}
                          onChange={handleProfileFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Experience</label>
                        <input
                          type="text"
                          name="experience"
                          value={profileForm.experience}
                          onChange={handleProfileFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Bio</label>
                        <textarea
                          name="bio"
                          value={profileForm.bio}
                          onChange={handleProfileFormChange}
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-muted-foreground w-24">Specialty:</span>
                        <span className="font-medium">{doctorProfile?.specialty || 'Not specified'}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-24">Experience:</span>
                        <span className="font-medium">{doctorProfile?.experience || 'Not specified'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground mb-1">Bio:</span>
                        <p className="text-sm">{doctorProfile?.bio || 'No bio available.'}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-3">Contact Information</h4>
                  {editingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={profileForm.location}
                          onChange={handleProfileFormChange}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">{doctorProfile?.email || currentUser?.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">{doctorProfile?.phone || 'No phone number'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">{doctorProfile?.location || 'No location specified'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Account Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/20 p-4 rounded-lg text-center">
                    <h5 className="text-2xl font-bold text-primary">{appointments.length}</h5>
                    <p className="text-sm text-muted-foreground">Total Appointments</p>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-lg text-center">
                    <h5 className="text-2xl font-bold text-primary">{patients.length}</h5>
                    <p className="text-sm text-muted-foreground">Patients</p>
                  </div>
                  <div className="bg-muted/20 p-4 rounded-lg text-center">
                    <h5 className="text-2xl font-bold text-primary">
                      {appointments.filter(apt => apt.status === 'completed').length}
                    </h5>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Add Medical Note Form
  const renderAddNoteForm = () => {
    if (!addingNote || !selectedAppointment) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                Add Medical Note - {selectedAppointment.firstName} {selectedAppointment.lastName}
              </h3>
              <button onClick={() => setAddingNote(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={noteForm.diagnosis}
                  onChange={handleNoteFormChange}
                  className="w-full p-2 border border-muted rounded-md"
                  placeholder="Enter diagnosis"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Treatment</label>
                <input
                  type="text"
                  name="treatment"
                  value={noteForm.treatment}
                  onChange={handleNoteFormChange}
                  className="w-full p-2 border border-muted rounded-md"
                  placeholder="Enter treatment plan"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={noteForm.notes}
                  onChange={handleNoteFormChange}
                  rows={3}
                  className="w-full p-2 border border-muted rounded-md"
                  placeholder="Enter additional notes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Prescription</label>
                <textarea
                  name="prescription"
                  value={noteForm.prescription}
                  onChange={handleNoteFormChange}
                  rows={3}
                  className="w-full p-2 border border-muted rounded-md"
                  placeholder="Enter prescription details"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setAddingNote(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={saveNote}>
                Save Medical Record
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'availability', label: 'Availability', icon: Clock },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="section-padding flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="container-hospital mx-auto px-4 py-20 min-h-screen">
        <div className="mt-8 mb-6">
          <h1 className="text-3xl font-bold">Doctor Portal</h1>
          <p className="text-muted-foreground mt-1">
            Manage your appointments, patients, and availability
          </p>
        </div>

        {/* Portal Navigation */}
        <div className="flex overflow-x-auto pb-3 mb-8 border-b">
          <button
            className={`flex items-center px-4 py-2 mr-4 font-medium text-base whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar className={`w-4 h-4 mr-2 ${activeTab === 'appointments' ? 'text-primary' : ''}`} />
            Appointments
          </button>
          <button
            className={`flex items-center px-4 py-2 mr-4 font-medium text-base whitespace-nowrap ${
              activeTab === 'patients'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('patients')}
          >
            <Users className={`w-4 h-4 mr-2 ${activeTab === 'patients' ? 'text-primary' : ''}`} />
            Patients
          </button>
          <button
            className={`flex items-center px-4 py-2 mr-4 font-medium text-base whitespace-nowrap ${
              activeTab === 'availability'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('availability')}
          >
            <Clock className={`w-4 h-4 mr-2 ${activeTab === 'availability' ? 'text-primary' : ''}`} />
            Availability
          </button>
          <button
            className={`flex items-center px-4 py-2 mr-4 font-medium text-base whitespace-nowrap ${
              activeTab === 'profile'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <User className={`w-4 h-4 mr-2 ${activeTab === 'profile' ? 'text-primary' : ''}`} />
            Profile
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Tab Content */}
            {activeTab === 'appointments' && renderAppointments()}
            {activeTab === 'patients' && renderPatients()}
            {activeTab === 'availability' && renderAvailability()}
            {activeTab === 'profile' && renderProfile()}
          </>
        )}
        
        {/* Add Medical Note Modal */}
        {renderAddNoteForm()}
      </main>
      <Footer />
    </>
  );
};

export default DoctorPortal;
