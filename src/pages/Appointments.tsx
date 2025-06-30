
import React, { useState } from 'react';
import Navigation from '../components/organisms/Navigation';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Calendar, Clock, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const Appointments = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    doctor: '',
    date: '',
    time: '',
    reason: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    'Cardiology',
    'Neurology',
    'Ophthalmology',
    'General Medicine',
    'Emergency Medicine',
    'Pediatrics'
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save appointment to Firebase
      await addDoc(collection(db, 'appointments'), {
        ...formData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Appointment booked successfully:', formData);
      toast.success('Appointment booked successfully!');
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <section className="section-padding">
          <div className="container-hospital">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-success" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Appointment Confirmed!
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your appointment has been successfully booked. You will receive a confirmation email shortly.
              </p>
              <div className="space-y-4">
                <Button variant="primary" size="lg" onClick={() => setIsSubmitted(false)}>
                  Book Another Appointment
                </Button>
                <Button variant="outline" size="lg">
                  View My Appointments
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Background Image */}
      <section className="relative section-padding">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.9), rgba(16, 185, 129, 0.9)), url('https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1920&h=600&fit=crop')`
          }}
        ></div>
        <div className="relative z-10 container-hospital">
          <div className="text-center fade-in-up text-white">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Book an <span className="text-gradient bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">Appointment</span>
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Schedule your consultation with our expert medical professionals. 
              We're here to provide you with the best healthcare experience.
            </p>
          </div>
        </div>
      </section>

      {/* Appointment Form */}
      <section className="section-padding">
        <div className="container-hospital">
          <div className="max-w-4xl mx-auto">
            <Card premium className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                    <User className="w-6 h-6 mr-3 text-primary" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      icon={<Mail className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      icon={<Phone className="w-4 h-4" />}
                      required
                    />
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-primary" />
                    Appointment Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Department</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Preferred Doctor (Optional)"
                      name="doctor"
                      value={formData.doctor}
                      onChange={handleInputChange}
                      placeholder="Dr. Sarah Johnson"
                    />
                    <Input
                      label="Preferred Date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Preferred Time</label>
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        required
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Reason for Visit</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                    placeholder="Please describe your symptoms or reason for the appointment..."
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="text-center">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    className="px-12"
                    disabled={isSubmitting}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Booking...' : 'Book Appointment'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Emergency Contact with Image */}
      <section className="section-padding bg-muted/30">
        <div className="container-hospital">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=400&fit=crop" 
                alt="Emergency medical care"
                className="w-full h-80 object-cover rounded-3xl shadow-xl"
              />
            </div>
            <Card premium className="p-8">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Need Immediate Medical Attention?
              </h3>
              <p className="text-muted-foreground mb-6">
                For medical emergencies, please call our emergency hotline or visit our emergency department.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="primary" size="lg">
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency: 911
                </Button>
                <Button variant="outline" size="lg">
                  <Clock className="w-5 h-5 mr-2" />
                  24/7 Support
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Appointments;
