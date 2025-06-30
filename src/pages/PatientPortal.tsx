
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
  Download, 
  Eye,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const PatientPortal = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchUserAppointments();
  }, [currentUser, navigate]);

  const fetchUserAppointments = async () => {
    try {
      setLoading(true);
      
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef, 
        where('email', '==', currentUser.email),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const userAppointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAppointments(userAppointments);
      console.log('User appointments loaded:', userAppointments.length);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    apt.date && new Date(apt.date) >= new Date() && apt.status !== 'completed'
  );

  const pastAppointments = appointments.filter(apt => 
    apt.date && (new Date(apt.date) < new Date() || apt.status === 'completed')
  );

  const renderAppointments = () => (
    <div className="space-y-8">
      {/* Upcoming Appointments */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-6">Upcoming Appointments</h3>
        <div className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} premium className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="text-lg font-semibold text-foreground mr-3">
                        {appointment.doctor}
                      </h4>
                      <Badge variant={getStatusColor(appointment.status)} size="sm">
                        {appointment.status || 'pending'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{appointment.department}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
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
                </div>
              </Card>
            ))
          ) : (
            <Card premium className="p-8 text-center">
              <p className="text-muted-foreground">No upcoming appointments</p>
            </Card>
          )}
        </div>
      </div>

      {/* Past Appointments */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-6">Past Appointments</h3>
        <div className="space-y-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <Card key={appointment.id} premium className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      {appointment.doctor}
                    </h4>
                    <p className="text-muted-foreground mb-2">{appointment.department}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(appointment.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {appointment.time}
                      </div>
                    </div>
                    {appointment.reason && (
                      <div className="bg-muted/50 p-3 rounded-xl">
                        <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      </div>
                    )}
                  </div>
                  <Badge variant={getStatusColor(appointment.status)} size="sm">
                    {appointment.status || 'completed'}
                  </Badge>
                </div>
              </Card>
            ))
          ) : (
            <Card premium className="p-8 text-center">
              <p className="text-muted-foreground">No past appointments</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-foreground">Medical Records</h3>
        <Button variant="primary" size="md">
          <FileText className="w-4 h-4 mr-2" />
          Upload Record
        </Button>
      </div>

      <Card premium className="p-8 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No medical records available yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Medical records will appear here after your appointments
        </p>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8">
      <Card premium className="p-8">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              {currentUser?.displayName || 'Patient Name'}
            </h3>
            <p className="text-muted-foreground mb-4">Patient ID: #{currentUser?.uid?.slice(0, 8)}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">{currentUser?.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Update phone in profile</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Update address in profile</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-3">Account Stats</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Total Appointments: {appointments.length}</p>
                  <p>Upcoming: {upcomingAppointments.length}</p>
                  <p>Completed: {pastAppointments.length}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button variant="primary" size="md">
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: FileText },
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary/90 to-secondary text-white">
        <div className="container-hospital">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Welcome back, <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
                {currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Patient'}
              </span>
            </h1>
            <p className="text-xl opacity-90">
              Manage your appointments, view medical records, and stay connected with your healthcare.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container-hospital">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64">
              <Card premium className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <tab.icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {activeTab === 'appointments' && renderAppointments()}
              {activeTab === 'records' && renderRecords()}
              {activeTab === 'profile' && renderProfile()}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatientPortal;
