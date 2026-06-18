import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filterParams, setFilterParams] = useState<{ from?: string; to?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', filterParams],
    queryFn: () => dashboardApi.getSummary(filterParams).then((r) => r.data),
  });

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {today} — Welcome back, {user?.name}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : data ? (
        <>
          {/* ── Metric cards ── */}
          <div className="grid-4" style={{ marginBottom: '1.5rem', gap: 12 }}>
            {[
              { label: 'Total affidavits', value: data.affidavitCount },
              { label: 'Total marriages', value: data.marriageCount },
              { label: 'Total birth/death', value: data.birthDeathCount },
              { label: 'Total property cards', value: data.propertyCardCount },
              { label: 'Total shop act licenses', value: data.shopActLicenseCount },
              { label: 'Gross affidavit earnings', value: `₹${data.affidavitGrossEarnings.toLocaleString('en-IN')}` },
              { label: 'Net affidavit earnings', value: `₹${data.affidavitNetEarnings.toLocaleString('en-IN')}` },
              { label: 'Total earnings (Gross)', value: `₹${data.totalEarnings.toLocaleString('en-IN')}` },
              { label: 'Total earnings (Net)', value: `₹${data.totalNetEarnings.toLocaleString('en-IN')}` },
            ].map(({ label, value }) => (
              <div
                className="metric-card"
                key={label}
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.25rem 1rem' }}
              >
                <div className="m-label">{label}</div>
                <div className="m-value">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* ── Earnings filter ── */}
            <div className="card">
              <div style={{ fontWeight: 500, marginBottom: '1rem' }}>Earnings by date range</div>
              <div className="grid-2">
                <div className="form-group">
                  <label>From</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>To</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setFilterParams({ from: from || undefined, to: to || undefined })}
                >
                  Calculate
                </button>
                <button className="btn" onClick={() => { setFrom(''); setTo(''); setFilterParams({}); }}>
                  Clear
                </button>
              </div>

              {(filterParams.from || filterParams.to) && (
                <div style={{ marginTop: 14, fontSize: 13 }}>
                  {[
                    ['Affidavits (Gross)', data.affidavitGrossEarnings],
                    ['Affidavits (Net)', data.affidavitNetEarnings],
                    ['Marriages', data.marriageEarnings],
                    ['Birth/Death Cert.', data.birthDeathEarnings],
                    ['Property Cards', data.propertyCardEarnings],
                    ['Shop Act Licenses', data.shopActLicenseEarnings],
                  ].map(([label, val]) => (
                    <div
                      key={label as string}
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <b>₹{(val as number).toLocaleString('en-IN')}</b>
                    </div>
                  ))}
                  <hr className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, marginBottom: 4 }}>
                    <span>Total (Gross)</span>
                    <span style={{ fontSize: 16 }}>₹{data.totalEarnings.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                    <span>Total (Net)</span>
                    <span style={{ fontSize: 16 }}>₹{data.totalNetEarnings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Service breakdown ── */}
            <div className="card">
              <div style={{ fontWeight: 500, marginBottom: '1rem' }}>Service breakdown</div>

              <div className="section-label">Affidavits by authorizer</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span className="badge badge-blue">Magistrate: {data.breakdown.byAuthorizer['magistrate'] || 0}</span>
                <span className="badge badge-amber">Notary: {data.breakdown.byAuthorizer['Notary'] || 0}</span>
              </div>

              <div className="section-label">Affidavits by paper type</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span className="badge badge-green">₹500 Stamp: {data.breakdown.byPaper['stamp500'] || 0}</span>
                <span className="badge badge-blue">Plain: {data.breakdown.byPaper['Plain'] || 0}</span>
              </div>

              <div className="section-label">Birth/Death certificates</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span className="badge badge-green">Birth: {data.breakdown.byType['Birth'] || 0}</span>
                <span className="badge badge-amber">Death: {data.breakdown.byType['Death'] || 0}</span>
              </div>

              <div className="section-label">Property cards by type</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span className="badge badge-blue">Property Card: {data.breakdown.byCardType?.['Property Card'] || 0}</span>
                <span className="badge badge-blue">7/12 Card: {data.breakdown.byCardType?.['7/12 Card'] || 0}</span>
              </div>

              <div className="section-label">Marriages by act</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  ['Hindu Marriage Act', 'Hindu'],
                  ['Muslim Personal Law (Shariat)', 'Muslim'],
                  ['Indian Christian Marriage Act', 'Christian'],
                ].map(([key, label]) => (
                  <span key={key} className="badge badge-blue">
                    {label}: {data.breakdown.byAct[key] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
