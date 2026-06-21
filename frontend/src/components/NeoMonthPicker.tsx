import { useState, useRef, useEffect } from 'react';

interface NeoMonthPickerProps {
  value: string; // "YYYY-MM" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function NeoMonthPicker({
  value,
  onChange,
  placeholder = 'Select Month',
  style,
}: NeoMonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected year and month based on the value prop (default to current date)
  const currentDate = new Date();
  const initialYear = value ? parseInt(value.split('-')[0], 10) : currentDate.getFullYear();
  const [selectedYear, setSelectedYear] = useState(initialYear);

  useEffect(() => {
    if (value) {
      setSelectedYear(parseInt(value.split('-')[0], 10));
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

  const months = [
    { label: 'Jan', val: '01' },
    { label: 'Feb', val: '02' },
    { label: 'Mar', val: '03' },
    { label: 'Apr', val: '04' },
    { label: 'May', val: '05' },
    { label: 'Jun', val: '06' },
    { label: 'Jul', val: '07' },
    { label: 'Aug', val: '08' },
    { label: 'Sep', val: '09' },
    { label: 'Oct', val: '10' },
    { label: 'Nov', val: '11' },
    { label: 'Dec', val: '12' },
  ];

  // Format label to display: e.g. "June 2026"
  const getDisplayLabel = () => {
    if (!value) return placeholder;
    const [y, m] = value.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const handleMonthSelect = (monthVal: string) => {
    const newVal = `${selectedYear}-${monthVal}`;
    onChange(newVal);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: '#fff',
          border: '2px solid #000',
          borderRadius: '4px',
          boxShadow: '2px 2px 0px #000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: 600,
          color: value ? '#000' : 'var(--text-muted, #666)',
        }}
      >
        <span>{getDisplayLabel()}</span>
        <span style={{ fontSize: '12px', color: '#000' }}>📅</span>
      </button>

      {/* Picker Menu Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            background: '#fff',
            border: '2px solid #000',
            borderRadius: '4px',
            boxShadow: '4px 4px 0px #000',
            width: '280px',
            padding: '12px',
          }}
        >
          {/* Header (Year Navigation) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              borderBottom: '2px solid #000',
              paddingBottom: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              style={{
                background: '#fff',
                border: '2px solid #000',
                borderRadius: '4px',
                padding: '4px 8px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '1px 1px 0px #000',
                fontSize: '12px',
              }}
            >
              ◀
            </button>
            <span style={{ fontWeight: 800, fontSize: '15px' }}>{selectedYear}</span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              style={{
                background: '#fff',
                border: '2px solid #000',
                borderRadius: '4px',
                padding: '4px 8px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '1px 1px 0px #000',
                fontSize: '12px',
              }}
            >
              ▶
            </button>
          </div>

          {/* Grid of Months */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {months.map((m) => {
              const isSelected = value === `${selectedYear}-${m.val}`;
              return (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => handleMonthSelect(m.val)}
                  style={{
                    padding: '8px 4px',
                    background: isSelected ? 'var(--accent, #ffdc58)' : '#fff',
                    border: '2px solid #000',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'none' : '1px 1px 0px #000',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#fff';
                    }
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
