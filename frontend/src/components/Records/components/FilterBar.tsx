import NeoDatePicker from '@/components/NeoDatePicker';

interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  from: string;
  setFrom: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
  exportCurrent: () => Promise<void>;
}

export default function FilterBar({
  search,
  setSearch,
  from,
  setFrom,
  to,
  setTo,
  exportCurrent,
}: FilterBarProps) {
  const hasFilters = !!(search || from || to);

  return (
    <div className="filter-card">
      <div className="grid-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, marginBottom: 4 }}>Search Records</label>
          <input
            placeholder="Search by name, phone, token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, marginBottom: 4 }}>From Date</label>
          <NeoDatePicker value={from} onChange={setFrom} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, marginBottom: 4 }}>To Date</label>
          <NeoDatePicker value={to} onChange={setTo} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: '100%' }}>
          <button
            className="btn btn-secondary"
            onClick={exportCurrent}
            style={{ flexGrow: 1 }}
          >
            Export Excel
          </button>
          {hasFilters && (
            <button
              className="btn btn-danger-text"
              onClick={() => {
                setSearch('');
                setFrom('');
                setTo('');
              }}
              style={{ padding: '8px 12px', fontSize: 13 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
