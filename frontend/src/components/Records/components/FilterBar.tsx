import NeoDatePicker from '@/components/NeoDatePicker';
import NeoSelect from '@/components/NeoSelect';

interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  from: string;
  setFrom: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
  exportCurrent: () => Promise<void>;
  subTab?: string;
  authorizerType?: string;
  setAuthorizerType?: (val: string) => void;
}

export default function FilterBar({
  search,
  setSearch,
  from,
  setFrom,
  to,
  setTo,
  exportCurrent,
  subTab,
  authorizerType = '',
  setAuthorizerType,
}: FilterBarProps) {
  const hasFilters = !!(search || from || to || authorizerType);

  return (
    <div className="filter-card">
      <style>{`
        .grid-5-custom {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .grid-5-custom {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .grid-5-custom {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
      <div className={subTab === 'affidavits' ? 'grid-5-custom' : 'grid-4'}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, marginBottom: 4 }}>Search Records</label>
          <input
            placeholder="Search by name, phone, token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {subTab === 'affidavits' && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11, marginBottom: 4 }}>Authority Type</label>
            <NeoSelect
              value={authorizerType}
              onChange={(val) => setAuthorizerType?.(val)}
              options={[
                { value: '', label: 'All Authorities' },
                { value: 'magistrate', label: 'Executive Magistrate' },
                { value: 'Notary', label: 'Notary Public' },
              ]}
              placeholder="All Authorities"
            />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, marginBottom: 4 }}>From Date</label>
          <NeoDatePicker value={from} onChange={setFrom} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 11, marginBottom: 4 }}>To Date</label>
          <NeoDatePicker value={to} onChange={setTo} />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: '100%' }}>
          <button className="btn btn-secondary" onClick={exportCurrent} style={{ flexGrow: 1 }}>
            Export Excel
          </button>
          {hasFilters && (
            <button
              className="btn btn-danger-text"
              onClick={() => {
                setSearch('');
                setFrom('');
                setTo('');
                setAuthorizerType?.('');
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
