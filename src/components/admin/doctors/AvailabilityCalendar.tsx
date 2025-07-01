import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash } from 'lucide-react';
import Button from '../../../components/atoms/Button';

interface AvailabilityCalendarProps {
  initialAvailability: Record<string, string[]>;
  onChange: (availability: Record<string, string[]>) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
  initialAvailability = {},
  onChange 
}) => {
  const [availability, setAvailability] = useState<Record<string, string[]>>(initialAvailability);
  
  const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];
  
  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', 
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', 
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'
  ];
  
  // Initialize with initial availability data
  useEffect(() => {
    setAvailability(initialAvailability || {});
  }, [initialAvailability]);

  // Propagate changes to parent
  useEffect(() => {
    onChange(availability);
  }, [availability, onChange]);

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability(prev => {
      const daySlots = [...(prev[day] || [])];
      const index = daySlots.indexOf(time);
      
      if (index === -1) {
        // Add time slot
        daySlots.push(time);
        daySlots.sort((a, b) => {
          return timeSlots.indexOf(a) - timeSlots.indexOf(b);
        });
      } else {
        // Remove time slot
        daySlots.splice(index, 1);
      }
      
      return {
        ...prev,
        [day]: daySlots
      };
    });
  };
  
  const addCustomTimeSlot = (day: string, time: string) => {
    if (!time || time.trim() === '') return;
    
    setAvailability(prev => {
      const daySlots = [...(prev[day] || [])];
      
      // Add if not already exists
      if (!daySlots.includes(time)) {
        daySlots.push(time);
      }
      
      return {
        ...prev,
        [day]: daySlots
      };
    });
  };
  
  const clearDaySlots = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: []
    }));
  };
  
  const copyToAllDays = (sourceDay: string) => {
    if (!availability[sourceDay] || availability[sourceDay].length === 0) return;
    
    setAvailability(prev => {
      const newAvailability = { ...prev };
      
      daysOfWeek.forEach(day => {
        if (day.id !== sourceDay) {
          newAvailability[day.id] = [...prev[sourceDay]];
        }
      });
      
      return newAvailability;
    });
  };
  
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/30 p-3 border-b border-border">
        <h4 className="font-medium flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Weekly Schedule
        </h4>
      </div>
      
      <div className="divide-y divide-border">
        {daysOfWeek.map(day => (
          <div key={day.id} className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="font-medium">{day.label}</div>
              <div className="flex space-x-2">
                {availability[day.id]?.length > 0 && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToAllDays(day.id)}
                    >
                      Copy to All Days
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => clearDaySlots(day.id)}
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {timeSlots.map(time => (
                  <button
                    key={`${day.id}-${time}`}
                    type="button"
                    onClick={() => toggleTimeSlot(day.id, time)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                      availability[day.id]?.includes(time) 
                        ? 'bg-primary text-white'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-sm font-medium mb-2">Selected Slots:</div>
              <div className="flex flex-wrap gap-2">
                {availability[day.id]?.length > 0 ? (
                  availability[day.id].map(time => (
                    <div 
                      key={`selected-${day.id}-${time}`}
                      className="bg-primary/10 text-primary px-3 py-1.5 text-xs rounded-full flex items-center"
                    >
                      {time}
                      <button
                        type="button"
                        onClick={() => toggleTimeSlot(day.id, time)}
                        className="ml-1.5 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No time slots selected</div>
                )}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Add custom time (e.g. 7:45 PM)"
                    className="w-full py-2 px-3 rounded-lg border border-input bg-background text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addCustomTimeSlot(day.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    const input = document.querySelector(`input[placeholder="Add custom time (e.g. 7:45 PM)"]`) as HTMLInputElement;
                    if (input) {
                      addCustomTimeSlot(day.id, input.value);
                      input.value = '';
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
