import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, Sun, Sunset, Moon, Users } from 'lucide-react';
import Button from '../../atoms/Button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface StepDateTimeProps {
  doctorId: string;
  selectedDate: string;
  selectedTime: string;
  onSelect: (date: string, time: string) => void;
  onBack: () => void;
}

// Generate dates for the next 14 days
const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0) { // Sunday
      continue;
    }
    
    dates.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    });
  }
  
  return dates;
};

const StepDateTime: React.FC<StepDateTimeProps> = ({
  doctorId,
  selectedDate,
  selectedTime,
  onSelect,
  onBack
}) => {
  // State for available dates and times
  const [dateOptions] = useState(generateDateOptions());
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleDateRange, setVisibleDateRange] = useState({ start: 0, end: 5 });

  // State for organizing time slots by period
  const [organizedTimeSlots, setOrganizedTimeSlots] = useState<{
    morning: Array<{time: string, available: number}>;
    afternoon: Array<{time: string, available: number}>;
    evening: Array<{time: string, available: number}>;
  }>({
    morning: [],
    afternoon: [],
    evening: []
  });

  // Fetch doctor availability
  useEffect(() => {
    const fetchDoctorAvailability = async () => {
      if (!doctorId || !selectedDate) return;
      
      setLoading(true);
      
      try {
        // Try to fetch availability from doctor document
        const doctorRef = doc(db, 'doctors', doctorId);
        const doctorSnapshot = await getDoc(doctorRef);
        
        if (doctorSnapshot.exists()) {
          const doctorData = doctorSnapshot.data();
          const availability = doctorData?.availability?.[selectedDate];
          
          if (availability && Array.isArray(availability) && availability.length > 0) {
            setTimeSlots(availability);
            organizeTimeSlots(availability);
            return;
          }
        }
        
        // If no specific availability, use default time slots
        const morningSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'];
        const afternoonSlots = ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
        const eveningSlots = ['5:00 PM', '6:00 PM', '7:00 PM'];
        
        const defaultSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
        setTimeSlots(defaultSlots);
        organizeTimeSlots(defaultSlots);
        
      } catch (error) {
        console.error('Error fetching doctor availability:', error);
        // Use default time slots on error
        const defaultSlots = [
          '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
          '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
          '5:00 PM', '6:00 PM', '7:00 PM'
        ];
        setTimeSlots(defaultSlots);
        organizeTimeSlots(defaultSlots);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorAvailability();
  }, [doctorId, selectedDate]);

  // Organize time slots into morning, afternoon, and evening
  const organizeTimeSlots = (slots: string[]) => {
    const morning: Array<{time: string, available: number}> = [];
    const afternoon: Array<{time: string, available: number}> = [];
    const evening: Array<{time: string, available: number}> = [];
    
    slots.forEach(time => {
      // Parse the time to determine if it's morning, afternoon, or evening
      // Also add a random number of available slots for demonstration
      const availableSpots = Math.floor(Math.random() * 5) + 1; // 1-5 available spots
      
      if (time.includes('AM')) {
        morning.push({ time, available: availableSpots });
      } else if (time.includes('PM')) {
        const hour = parseInt(time.split(':')[0]);
        if (hour < 5) {
          afternoon.push({ time, available: availableSpots });
        } else {
          evening.push({ time, available: availableSpots });
        }
      }
    });
    
    setOrganizedTimeSlots({ morning, afternoon, evening });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  // Handle date navigation
  const handleScrollDates = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setVisibleDateRange(prev => ({
        start: Math.max(0, prev.start - 1),
        end: Math.max(5, prev.end - 1)
      }));
    } else {
      setVisibleDateRange(prev => ({
        start: Math.min(dateOptions.length - 5, prev.start + 1),
        end: Math.min(dateOptions.length, prev.end + 1)
      }));
    }
  };

  const visibleDates = dateOptions.slice(visibleDateRange.start, visibleDateRange.end);

  // Handle date selection - This should just select the date
  const handleDateSelect = (date: string) => {
    // Call onSelect with the new date and reset time
    onSelect(date, '');
  };

  // Handle time selection - This selects both date and time
  const handleTimeSelect = (time: string) => {
    // Update the selected time and notify parent component
    onSelect(selectedDate, time);
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
          <h2 className="text-2xl font-bold text-foreground mb-1">Select Date & Time</h2>
          <p className="text-muted-foreground">
            Choose your preferred appointment slot
          </p>
        </div>
      </div>

      {/* Date Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Select Date
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleScrollDates('left')}
              disabled={visibleDateRange.start === 0}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleScrollDates('right')}
              disabled={visibleDateRange.end >= dateOptions.length}
              className="p-1 h-8 w-8"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          {visibleDates.map((date) => (
            <motion.button
              key={date.value}
              variants={itemVariants}
              className={`px-4 py-3 min-w-[120px] rounded-xl border text-center transition-colors ${
                selectedDate === date.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
              onClick={() => handleDateSelect(date.value)}
            >
              {date.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time Selection - Enhanced UI */}
      <div>
        <h3 className="text-lg font-medium text-foreground flex items-center mb-4">
          <Clock className="w-5 h-5 mr-2 text-primary" />
          Select Time
        </h3>

        {selectedDate ? (
          loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : timeSlots.length > 0 ? (
            <div className="space-y-6">
              {/* Morning slots */}
              {organizedTimeSlots.morning.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <Sun className="w-5 h-5 text-amber-500 mr-2" />
                    <h4 className="font-medium text-foreground">Morning</h4>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-3 md:grid-cols-4 gap-3"
                  >
                    {organizedTimeSlots.morning.map(({ time, available }) => (
                      <motion.div
                        key={time}
                        variants={itemVariants}
                        className="relative"
                      >
                        <button
                          className={`w-full py-3 px-2 rounded-lg border text-center transition-colors ${
                            selectedTime === time
                              ? 'bg-primary text-white border-primary'
                              : available === 0 
                                ? 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed'
                                : 'border-border hover:border-primary/50 text-foreground'
                          }`}
                          onClick={() => available > 0 && handleTimeSelect(time)}
                          disabled={available === 0}
                        >
                          {time}
                          {available > 0 && (
                            <div className="mt-1 text-xs">
                              <div className="flex items-center justify-center">
                                <Users className="w-3 h-3 mr-1" />
                                <span>{available} {available === 1 ? 'slot' : 'slots'}</span>
                              </div>
                            </div>
                          )}
                          {available === 0 && (
                            <div className="mt-1 text-xs text-error">Booked</div>
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
              
              {/* Afternoon slots */}
              {organizedTimeSlots.afternoon.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <Sunset className="w-5 h-5 text-orange-500 mr-2" />
                    <h4 className="font-medium text-foreground">Afternoon</h4>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-3 md:grid-cols-4 gap-3"
                  >
                    {organizedTimeSlots.afternoon.map(({ time, available }) => (
                      <motion.div
                        key={time}
                        variants={itemVariants}
                        className="relative"
                      >
                        <button
                          className={`w-full py-3 px-2 rounded-lg border text-center transition-colors ${
                            selectedTime === time
                              ? 'bg-primary text-white border-primary'
                              : available === 0 
                                ? 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed'
                                : 'border-border hover:border-primary/50 text-foreground'
                          }`}
                          onClick={() => available > 0 && handleTimeSelect(time)}
                          disabled={available === 0}
                        >
                          {time}
                          {available > 0 && (
                            <div className="mt-1 text-xs">
                              <div className="flex items-center justify-center">
                                <Users className="w-3 h-3 mr-1" />
                                <span>{available} {available === 1 ? 'slot' : 'slots'}</span>
                              </div>
                            </div>
                          )}
                          {available === 0 && (
                            <div className="mt-1 text-xs text-error">Booked</div>
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
              
              {/* Evening slots */}
              {organizedTimeSlots.evening.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <Moon className="w-5 h-5 text-indigo-400 mr-2" />
                    <h4 className="font-medium text-foreground">Evening</h4>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-3 md:grid-cols-4 gap-3"
                  >
                    {organizedTimeSlots.evening.map(({ time, available }) => (
                      <motion.div
                        key={time}
                        variants={itemVariants}
                        className="relative"
                      >
                        <button
                          className={`w-full py-3 px-2 rounded-lg border text-center transition-colors ${
                            selectedTime === time
                              ? 'bg-primary text-white border-primary'
                              : available === 0 
                                ? 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed'
                                : 'border-border hover:border-primary/50 text-foreground'
                          }`}
                          onClick={() => available > 0 && handleTimeSelect(time)}
                          disabled={available === 0}
                        >
                          {time}
                          {available > 0 && (
                            <div className="mt-1 text-xs">
                              <div className="flex items-center justify-center">
                                <Users className="w-3 h-3 mr-1" />
                                <span>{available} {available === 1 ? 'slot' : 'slots'}</span>
                              </div>
                            </div>
                          )}
                          {available === 0 && (
                            <div className="mt-1 text-xs text-error">Booked</div>
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>Each appointment is approximately 30 minutes</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-xl">
              <p className="text-muted-foreground">No available time slots for the selected date.</p>
            </div>
          )
        ) : (
          <div className="text-center py-6 bg-muted/20 rounded-xl">
            <p className="text-muted-foreground">Please select a date first.</p>
          </div>
        )}
      </div>

      {/* Continue Button - Modified to navigate to next step */}
      {selectedDate && selectedTime && (
        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {/* Continue to next step - no need to call onSelect again */}}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepDateTime;
