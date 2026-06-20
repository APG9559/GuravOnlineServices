import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import NeoDatePicker from '@/components/NeoDatePicker';
import NetEarningsChart from '@/components/Dashboard/NetEarningsChart';

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

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalGross = data?.totalEarnings || 1;
  const totalNet = data?.totalNetEarnings || 1;

  const kmcGrossPct = data ? Math.max(0, Math.round(((data.modules.kmc?.grossEarnings || 0) / totalGross) * 100)) : 0;
  const cscGrossPct = data ? Math.max(0, Math.round(((data.modules.csc?.grossEarnings || 0) / totalGross) * 100)) : 0;
  const aapleSarkarGrossPct = data ? Math.max(0, 100 - kmcGrossPct - cscGrossPct) : 0;

  const kmcNetPct = data ? Math.max(0, Math.round(((data.modules.kmc?.netEarnings || 0) / totalNet) * 100)) : 0;
  const cscNetPct = data ? Math.max(0, Math.round(((data.modules.csc?.netEarnings || 0) / totalNet) * 100)) : 0;
  const aapleSarkarNetPct = data ? Math.max(0, 100 - kmcNetPct - cscNetPct) : 0;

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
          {/* ── Date range banner ── */}
          <div className="stats-banner">
            <div>
              Showing statistics for: <span style={{ fontWeight: 700 }}>{formatDateString(data.fromDate)}</span> to <span style={{ fontWeight: 700 }}>{formatDateString(data.toDate)}</span>
              {(!filterParams.from && !filterParams.to) && (
                <span className="badge badge-blue" style={{ marginLeft: 8 }}>Current Month</span>
              )}
            </div>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Real-time Sync
            </span>
          </div>

          {/* ── Grand Summary Card ── */}
          <div className="performance-card">
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#000000' }}>Total Performance</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Overall earnings and availed records summary
              </p>
            </div>
            
            <div className="performance-stats">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Availed</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#000000', marginTop: 4 }}>
                  {data.affidavitCount + data.marriageCount + data.birthDeathCount + data.propertyCardCount + data.shopActLicenseCount + data.tradeLicenseCount + data.panCardCount + data.passportCount + (data.voterCardCount || 0) + (data.waterSupplyCount || 0) + (data.propertyTaxCount || 0) + (data.gazetteCount || 0)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Gross Earnings</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
                  ₹{data.totalEarnings.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Net Earnings</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)', marginTop: 4 }}>
                  ₹{data.totalNetEarnings.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px dashed #000000' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#000000', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Share by Module</div>
              
              {/* Gross Share Bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Gross Share</span>
                  <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(79, 70, 229)', borderRadius: 2 }} />KMC: {kmcGrossPct}%</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(5, 150, 105)', borderRadius: 2 }} />Aaple Sarkar: {aapleSarkarGrossPct}%</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(217, 119, 6)', borderRadius: 2 }} />CSC: {cscGrossPct}%</span>
                  </span>
                </div>
                <div style={{ height: 16, display: 'flex', border: '2px solid #000000', borderRadius: 4, overflow: 'hidden', background: '#e0e0e0', boxShadow: '2px 2px 0px #000000' }}>
                  {kmcGrossPct > 0 && <div style={{ width: `${kmcGrossPct}%`, background: 'rgb(79, 70, 229)', transition: 'width 0.3s ease' }} title={`KMC: ${kmcGrossPct}%`} />}
                  {aapleSarkarGrossPct > 0 && <div style={{ width: `${aapleSarkarGrossPct}%`, background: 'rgb(5, 150, 105)', transition: 'width 0.3s ease' }} title={`Aaple Sarkar: ${aapleSarkarGrossPct}%`} />}
                  {cscGrossPct > 0 && <div style={{ width: `${cscGrossPct}%`, background: 'rgb(217, 119, 6)', transition: 'width 0.3s ease' }} title={`CSC: ${cscGrossPct}%`} />}
                </div>
              </div>

              {/* Net Share Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Net Share</span>
                  <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(79, 70, 229)', borderRadius: 2 }} />KMC: {kmcNetPct}%</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(5, 150, 105)', borderRadius: 2 }} />Aaple Sarkar: {aapleSarkarNetPct}%</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(217, 119, 6)', borderRadius: 2 }} />CSC: {cscNetPct}%</span>
                  </span>
                </div>
                <div style={{ height: 16, display: 'flex', border: '2px solid #000000', borderRadius: 4, overflow: 'hidden', background: '#e0e0e0', boxShadow: '2px 2px 0px #000000' }}>
                  {kmcNetPct > 0 && <div style={{ width: `${kmcNetPct}%`, background: 'rgb(79, 70, 229)', transition: 'width 0.3s ease' }} title={`KMC: ${kmcNetPct}%`} />}
                  {aapleSarkarNetPct > 0 && <div style={{ width: `${aapleSarkarNetPct}%`, background: 'rgb(5, 150, 105)', transition: 'width 0.3s ease' }} title={`Aaple Sarkar: ${aapleSarkarNetPct}%`} />}
                  {cscNetPct > 0 && <div style={{ width: `${cscNetPct}%`, background: 'rgb(217, 119, 6)', transition: 'width 0.3s ease' }} title={`CSC: ${cscNetPct}%`} />}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <NetEarningsChart data={data.dailyEarnings} />
          </div>

          {/* ── Service Modules Grid ── */}
          <div className="grid-3" style={{ marginBottom: '1.5rem', gap: 16 }}>
            {['kmc', 'csc', 'aapleSarkar'].map((moduleKey) => {
              const m = data.modules[moduleKey as 'kmc' | 'csc' | 'aapleSarkar'];
              if (!m) return null;
              
              const moduleColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
                kmc: { bg: 'rgba(99, 102, 241, 0.05)', text: 'rgb(79, 70, 229)', border: 'rgba(99, 102, 241, 0.2)', badge: 'badge-blue' },
                csc: { bg: 'rgba(245, 158, 11, 0.05)', text: 'rgb(217, 119, 6)', border: 'rgba(245, 158, 11, 0.2)', badge: 'badge-amber' },
                aapleSarkar: { bg: 'rgba(16, 185, 129, 0.05)', text: 'rgb(5, 150, 105)', border: 'rgba(16, 185, 129, 0.2)', badge: 'badge-green' }
              };
              
              const colors = moduleColors[moduleKey] || { bg: 'var(--surface)', text: 'var(--text)', border: 'var(--border)', badge: 'badge-blue' };

              return (
                <div 
                  className="card" 
                  key={moduleKey}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1.5px solid ${colors.border}`,
                    background: 'var(--surface)',
                    boxShadow: '4px 4px 0px #000000',
                    borderRadius: '8px',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #000000', paddingBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#000000' }}>{m.label}</span>
                    <span className={`badge ${colors.badge}`} style={{ fontSize: 11, fontWeight: 700 }}>
                      {m.count} records
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.25rem', background: colors.bg, padding: '10px 12px', borderRadius: 6, border: `1px solid ${colors.border}` }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', fontWeight: 600, textTransform: 'uppercase' }}>Gross</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#000000' }}>₹{m.grossEarnings.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', fontWeight: 600, textTransform: 'uppercase' }}>Net</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>₹{m.netEarnings.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Sub-services</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(m.subServices).map(([subKey, sub]: [string, any]) => (
                        <div 
                          key={subKey}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 8px',
                            background: '#fafafa',
                            borderRadius: 4,
                            border: '1px solid #eee',
                            fontSize: 13,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#000000' }}>{sub.label}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>({sub.count})</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#000000' }}>₹{sub.grossEarnings.toLocaleString('en-IN')} <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 'normal' }}>g</span></div>
                            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-muted)' }}>₹{sub.netEarnings.toLocaleString('en-IN')} <span style={{ fontSize: 9, fontWeight: 'normal' }}>n</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid-2">
            {/* ── Date range filter card ── */}
            <div className="card" style={{ alignSelf: 'start' }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem', borderBottom: '2px solid #000000', paddingBottom: 6 }}>Filter Statistics by Period</div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label>From</label>
                  <NeoDatePicker value={from} onChange={(val) => setFrom(val)} placeholder="From date" />
                </div>
                <div className="form-group">
                  <label>To</label>
                  <NeoDatePicker value={to} onChange={(val) => setTo(val)} placeholder="To date" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setFilterParams({ from: from || undefined, to: to || undefined })}
                >
                  Apply Filter
                </button>
                <button className="btn" onClick={() => { setFrom(''); setTo(''); setFilterParams({}); }}>
                  Reset Month
                </button>
              </div>
            </div>

            {/* ── Service breakdown counts ── */}
            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: '1rem', borderBottom: '2px solid #000000', paddingBottom: 6 }}>Service Breakdown Details</div>

              <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Affidavits by authorizer</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
                <span className="badge badge-blue">Magistrate: {data.breakdown.byAuthorizer['magistrate'] || 0}</span>
                <span className="badge badge-amber">Notary: {data.breakdown.byAuthorizer['Notary'] || 0}</span>
              </div>

              <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Affidavits by paper type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
                <span className="badge badge-green">₹500 Stamp: {data.breakdown.byPaper['stamp500'] || 0}</span>
                <span className="badge badge-blue">Plain: {data.breakdown.byPaper['Plain'] || 0}</span>
              </div>

              <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Birth/Death certificates</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
                <span className="badge badge-green">Birth: {data.breakdown.byType['Birth'] || 0}</span>
                <span className="badge badge-amber">Death: {data.breakdown.byType['Death'] || 0}</span>
              </div>

              <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Property cards by type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 }}>
                <span className="badge badge-blue">Property Card: {data.breakdown.byCardType?.['Property Card'] || 0}</span>
                <span className="badge badge-blue">7/12 Card: {data.breakdown.byCardType?.['7/12 Card'] || 0}</span>
                <span className="badge badge-blue">8A: {data.breakdown.byCardType?.['8A'] || 0}</span>
              </div>

              <div className="section-label" style={{ fontWeight: 700, color: '#000000' }}>Marriages by act</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
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
