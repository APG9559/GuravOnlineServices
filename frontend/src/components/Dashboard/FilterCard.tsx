import { useState } from 'react';
import NeoDatePicker from '@/components/NeoDatePicker';
import NeoMonthPicker from '@/components/NeoMonthPicker';

interface FilterCardProps {
  onApplyFilter: (params: { from?: string; to?: string }) => void;
  onResetFilter: () => void;
}

export default function FilterCard({
  onApplyFilter,
  onResetFilter,
}: FilterCardProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const handleMonthChange = (monthStr: string) => {
    setSelectedMonth(monthStr);
    if (!monthStr) {
      setFrom('');
      setTo('');
      return;
    }
    const [year, month] = monthStr.split('-');
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    const firstDay = `${year}-${month}-01`;
    const lastDayNum = new Date(yearNum, monthNum, 0).getDate();
    const lastDayStr = String(lastDayNum).padStart(2, '0');
    const lastDay = `${year}-${month}-${lastDayStr}`;

    setFrom(firstDay);
    setTo(lastDay);
  };

  const handleApply = () => {
    onApplyFilter({ from: from || undefined, to: to || undefined });
  };

  const handleReset = () => {
    setFrom('');
    setTo('');
    setSelectedMonth('');
    onResetFilter();
  };

  return (
    <div className="card" style={{ alignSelf: 'start' }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: 6 }}>Filter Statistics by Period</div>

      <div className="form-group" style={{ marginBottom: 14 }}>
        <label>Quick Month Select</label>
        <NeoMonthPicker
          value={selectedMonth}
          onChange={handleMonthChange}
          placeholder="Select a Month"
        />
      </div>

      <div style={{ margin: '8px 0', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>— OR CHOOSE CUSTOM RANGE —</div>

      <div className="grid-2" style={{ gap: 12 }}>
        <div className="form-group">
          <label>From</label>
          <NeoDatePicker value={from} onChange={(val) => { setFrom(val); setSelectedMonth(''); }} placeholder="From date" />
        </div>
        <div className="form-group">
          <label>To</label>
          <NeoDatePicker value={to} onChange={(val) => { setTo(val); setSelectedMonth(''); }} placeholder="To date" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          className="btn btn-primary"
          onClick={handleApply}
        >
          Apply Filter
        </button>
        <button className="btn" onClick={handleReset}>
          Reset Month
        </button>
      </div>
    </div>
  );
}
