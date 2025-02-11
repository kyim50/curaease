'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker'; // Import only the required components
import 'react-day-picker/dist/style.css';

interface CalendarProps {
  availableDays: Date[];
  bookedAppointments: Date[];
  onDaySelect: (date: Date) => void; // Adjusted to accept a single Date
}

export function Calendar({
  availableDays,
  bookedAppointments,
  onDaySelect,
}: CalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(undefined); // Use Date for single selection

  // Highlight available and booked days
  const modifiers = {
    available: availableDays, // For highlighting available days
    booked: bookedAppointments, // For highlighting booked appointments
  };

  // This will handle a single date selection
  const handleDaySelect = (date: Date | undefined) => {
    setSelected(date);
    if (date) {
      onDaySelect(date); // Pass the selected date to the parent
    }
  };

  return (
    <div>
      <DayPicker
        mode="single" // Ensure single date selection mode
        selected={selected}
        onSelect={handleDaySelect} // Updated to accept a single date
        modifiers={modifiers}
        className="rounded-md border"
      />
      {selected && (
        <div className="mt-4">
          <h3 className="font-bold">Selected Date:</h3>
          <p>{format(selected, 'EEEE, MMMM dd, yyyy')}</p> {/* Show the selected date */}
        </div>
      )}
    </div>
  );
}
