import { DashboardSummary } from '@/types';

interface PerformanceCardProps {
  data: DashboardSummary;
}

export default function PerformanceCard({ data }: PerformanceCardProps) {
  const modules = data?.modules || {};
  const totalEarnings = data?.totalEarnings || 0;
  const totalNetEarnings = data?.totalNetEarnings || 0;
  const totalExpenses = data?.totalExpenses || 0;

  const hasEarnings = totalEarnings > 0;
  const kmcGrossPct = hasEarnings ? Math.max(0, Math.round(((modules.kmc?.grossEarnings || 0) / totalEarnings) * 100)) : 0;
  const cscGrossPct = hasEarnings ? Math.max(0, Math.round(((modules.csc?.grossEarnings || 0) / totalEarnings) * 100)) : 0;
  const aapleSarkarGrossPct = hasEarnings ? Math.max(0, 100 - kmcGrossPct - cscGrossPct) : 0;

  const hasNetEarnings = totalNetEarnings > 0;
  const kmcNetPct = hasNetEarnings ? Math.max(0, Math.round(((modules.kmc?.netEarnings || 0) / totalNetEarnings) * 100)) : 0;
  const cscNetPct = hasNetEarnings ? Math.max(0, Math.round(((modules.csc?.netEarnings || 0) / totalNetEarnings) * 100)) : 0;
  const aapleSarkarNetPct = hasNetEarnings ? Math.max(0, 100 - kmcNetPct - cscNetPct) : 0;
  const totalAvailed = Object.values(modules).reduce((sum, mod: any) => sum + (mod.count || 0), 0);

  return (
    <div className="performance-card">
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Total Performance</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Overall earnings and availed records summary
        </p>
      </div>

      <div className="performance-stats">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Availed</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', marginTop: 4 }}>
            {totalAvailed}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Gross Earnings</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>
            ₹{totalEarnings.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Net Earnings</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)', marginTop: 4 }}>
            ₹{totalNetEarnings.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expenses</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'rgb(220, 38, 38)', marginTop: 4 }}>
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px dashed var(--border)', width: '100%' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Share by Module</div>

        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {/* Gross Share Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Gross Share</span>
              <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(79, 70, 229)', borderRadius: 2 }} />KMC: {kmcGrossPct}%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(5, 150, 105)', borderRadius: 2 }} />Aaple Sarkar: {aapleSarkarGrossPct}%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgb(217, 119, 6)', borderRadius: 2 }} />CSC: {cscGrossPct}%</span>
              </span>
            </div>
            <div style={{ height: 16, display: 'flex', border: '2px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg)', boxShadow: '2px 2px 0px var(--border)' }}>
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
            <div style={{ height: 16, display: 'flex', border: '2px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg)', boxShadow: '2px 2px 0px var(--border)' }}>
              {kmcNetPct > 0 && <div style={{ width: `${kmcNetPct}%`, background: 'rgb(79, 70, 229)', transition: 'width 0.3s ease' }} title={`KMC: ${kmcNetPct}%`} />}
              {aapleSarkarNetPct > 0 && <div style={{ width: `${aapleSarkarNetPct}%`, background: 'rgb(5, 150, 105)', transition: 'width 0.3s ease' }} title={`Aaple Sarkar: ${aapleSarkarNetPct}%`} />}
              {cscNetPct > 0 && <div style={{ width: `${cscNetPct}%`, background: 'rgb(217, 119, 6)', transition: 'width 0.3s ease' }} title={`CSC: ${cscNetPct}%`} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
