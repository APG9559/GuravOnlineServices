import { useState, useRef, useEffect } from 'react';

interface NeoDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  max?: string; // YYYY-MM-DD
  min?: string; // YYYY-MM-DD
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function NeoDatePicker({
  value = '',
  onChange,
  max,
  min,
  placeholder = 'Select date',
  style,
  className,
}: NeoDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date or default to today
  const todayStr = new Date().toISOString().split('T')[0];
  const initialDate = value ? new Date(value) : new Date();

  const [currentYear, setCurrentYear] = useState(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth() // 0-indexed
  );

  // When value changes from outside, update current view
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate days array
  const dayCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    dayCells.push({
      dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
      dayNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    dayCells.push({
      dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  // Next month leading days (to complete the grid)
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const remainingCells = 42 - dayCells.length; // standard 6 rows
  for (let i = 1; i <= remainingCells; i++) {
    dayCells.push({
      dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const isSelected = (dateStr: string) => value === dateStr;

  const isDateDisabled = (dateStr: string) => {
    if (max && dateStr > max) return true;
    if (min && dateStr < min) return true;
    return false;
  };

  // Human readable display format (e.g. DD/MM/YYYY)
  const formatDisplay = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate range of years for manual selector (e.g., currentYear - 85 to currentYear + 5)
  const years: number[] = [];
  const startY = new Date().getFullYear() + 5;
  for (let y = startY; y >= startY - 95; y--) {
    years.push(y);
  }

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger input button */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          readOnly
          value={formatDisplay(value)}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            cursor: 'pointer',
            paddingRight: '36px', // space for calendar icon
          }}
        />
        <span
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            fontSize: '16px',
            userSelect: 'none',
          }}
        >
          📅
        </span>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            width: '290px',
            background: '#ffffff',
            border: '2.5px solid #000000',
            borderRadius: '10px',
            boxShadow: '4px 4px 0px #000000',
            padding: '12px',
          }}
        >
          {/* Header Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: '#ffffff',
                border: '1.5px solid #000000',
                borderRadius: '4px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '1px 1px 0px #000000',
                padding: 0,
              }}
            >
              ◀
            </button>

            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
              {/* Month Select */}
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                style={{
                  flex: 1,
                  padding: '3px 6px',
                  border: '1.5px solid #000000',
                  borderRadius: '4px',
                  background: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  height: '28px',
                  width: 'auto',
                }}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                style={{
                  width: '75px',
                  padding: '3px 6px',
                  border: '1.5px solid #000000',
                  borderRadius: '4px',
                  background: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  height: '28px',
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: '#ffffff',
                border: '1.5px solid #000000',
                borderRadius: '4px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '1px 1px 0px #000000',
                padding: 0,
              }}
            >
              ▶
            </button>
          </div>

          {/* Weekdays Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '11px',
              marginBottom: '6px',
              color: 'var(--text-hint, #4d4d4d)',
            }}
          >
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} style={{ padding: '4px 0' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {dayCells.map((cell, idx) => {
              const selected = isSelected(cell.dateStr);
              const disabled = isDateDisabled(cell.dateStr);
              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(cell.dateStr)}
                  style={{
                    background: selected ? 'var(--accent, #ffdc58)' : '#ffffff',
                    color: disabled
                      ? '#ccc'
                      : cell.isCurrentMonth
                      ? '#000000'
                      : 'var(--text-hint, #888)',
                    border: selected ? '1.5px solid #000000' : '1px solid transparent',
                    borderRadius: '4px',
                    padding: '6px 0',
                    fontSize: '12px',
                    fontWeight: selected || cell.isCurrentMonth ? 600 : 400,
                    cursor: disabled ? 'default' : 'pointer',
                    outline: 'none',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.1s ease',
                    position: 'relative',
                    boxShadow: selected ? '1px 1px 0px #000000' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected && !disabled) {
                      e.currentTarget.style.background = '#f3f0ec';
                      e.currentTarget.style.border = '1px solid #000000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected && !disabled) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.border = '1px solid transparent';
                    }
                  }}
                >
                  {cell.dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
              borderTop: '1.5px solid #000000',
              paddingTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => selectDate(todayStr)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#ffffff',
                border: '1.5px solid #000000',
                borderRadius: '4px',
                boxShadow: '1px 1px 0px #000000',
                cursor: 'pointer',
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#ffffff',
                border: '1.5px solid #000000',
                borderRadius: '4px',
                boxShadow: '1px 1px 0px #000000',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
