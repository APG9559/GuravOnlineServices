import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface NeoSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  searchable?: boolean;
}

export default function NeoSelect({
  value,
  onChange,
  options,
  placeholder = 'Select',
  style,
  disabled,
  searchable = false,
}: NeoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search term when the dropdown opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  // Filter options based on user search query
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: disabled ? 'var(--bg)' : 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: '4px',
          boxShadow: disabled ? 'none' : '2px 2px 0px var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'left',
          color: selectedOption ? 'var(--text)' : 'var(--text-hint)',
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: '10px', marginLeft: '8px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.1s' }}>▼</span>
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: '4px',
            boxShadow: '4px 4px 0px var(--border)',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sticky Search Box */}
          {searchable && (
            <div style={{ padding: '8px', borderBottom: '2px solid var(--border)', background: 'var(--surface)' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2px solid var(--border)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  outline: 'none',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted, #666)', textAlign: 'center' }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      background: isSelected ? 'var(--accent)' : 'var(--surface)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text)',
                      borderBottom: '1.5px solid var(--border)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--bg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--surface)';
                      }
                    }}
                  >
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
