// app/components/ui/calendar.tsx
'use client';
import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export function Calendar({
  className,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const [selected, setSelected] = useState<Date>();

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={setSelected}
      className="rounded-md border"
      {...props}
    />
  );
}