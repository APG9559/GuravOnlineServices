import { useState, useMemo } from 'react';
import { DailyEarningPoint } from '@/types';

interface NetEarningsChartProps {
  data?: DailyEarningPoint[];
}

type ChartFilter = 'total' | 'modules' | 'individual';

const SERVICE_LABELS: Record<string, string> = {
  affidavits: 'Affidavits',
  marriages: 'Marriages',
  birthDeath: 'Birth/Death Certificates',
  propertyCards: 'Property Cards',
  shopAct: 'Shop Act Licenses',
  tradeLicenses: 'Trade Licenses',
  panCards: 'PAN Cards',
  passports: 'Passports',
  gazettes: 'Gazette Name Changes',
};

const SERVICE_COLORS: Record<string, string> = {
  affidavits: '#3b82f6', // blue
  marriages: '#10b981', // green
  birthDeath: '#14b8a6', // teal
  propertyCards: '#f59e0b', // amber
  shopAct: '#8b5cf6', // purple
  tradeLicenses: '#06b6d4', // cyan
  panCards: '#f43f5e', // rose
  passports: '#ec4899', // pink
  gazettes: '#6366f1', // indigo
};

export default function NetEarningsChart({ data = [] }: NetEarningsChartProps) {
  const [filter, setFilter] = useState<ChartFilter>('total');
  const [selectedService, setSelectedService] = useState<string>('affidavits');
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    item: DailyEarningPoint;
  } | null>(null);

  // SVG Dimension parameters
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // 1. Get current keys to display
  const activeKeys = useMemo(() => {
    if (filter === 'total') return ['total'];
    if (filter === 'modules') return ['kmc', 'csc', 'aapleSarkar'];
    return [selectedService];
  }, [filter, selectedService]);

  // 2. Find min & max values to calibrate Y axis
  const { minVal, maxVal } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 1000 };
    let min = 0;
    let max = 0;
    for (const d of data) {
      for (const k of activeKeys) {
        const val = Number((d as any)[k]) || 0;
        if (val > max) max = val;
        if (val < min) min = val;
      }
    }
    return { minVal: min, maxVal: max };
  }, [data, activeKeys]);

  // Round up max tick to a clean readable number
  const maxTick = useMemo(() => {
    if (maxVal <= 0) return 0;
    const order = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const base = maxVal / order;
    const roundedBase = Math.ceil(base * 2) / 2; // round to nearest 0.5
    const computed = roundedBase * order;
    return computed < 100 ? 100 : computed;
  }, [maxVal]);

  // Round down min tick to a clean readable negative number
  const minTick = useMemo(() => {
    if (minVal >= 0) return 0;
    const absMin = Math.abs(minVal);
    const order = Math.pow(10, Math.floor(Math.log10(absMin)));
    const base = absMin / order;
    const roundedBase = Math.ceil(base * 2) / 2; // round to nearest 0.5
    const computed = -roundedBase * order;
    return computed > -100 ? -100 : computed;
  }, [minVal]);

  // Calculate coordinates helper
  const getCoordinates = (index: number, val: number) => {
    const x = margin.left + (index / (data.length - 1 || 1)) * chartWidth;
    const span = maxTick - minTick || 1;
    const y = margin.top + chartHeight - ((val - minTick) / span) * chartHeight;
    return { x, y };
  };

  // Generate paths
  const chartPaths = activeKeys.map((key) => {
    const points = data.map((d, i) => {
      const val = Number((d as any)[key]) || 0;
      return getCoordinates(i, val);
    });

    const lineD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const areaD = points.length > 0
      ? `${lineD} L ${points[points.length - 1].x.toFixed(1)} ${(margin.top + chartHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(margin.top + chartHeight).toFixed(1)} Z`
      : '';

    let strokeColor = 'var(--text)';
    if (filter === 'total') strokeColor = '#4f46e5';
    else if (filter === 'modules') {
      if (key === 'kmc') strokeColor = '#10b981'; // emerald
      else if (key === 'csc') strokeColor = '#f43f5e'; // rose
      else strokeColor = '#3b82f6'; // blue
    } else {
      strokeColor = SERVICE_COLORS[key] || 'var(--text)';
    }

    return { key, lineD, areaD, strokeColor };
  });

  // Calculate Y axis labels
  const yTicks = useMemo(() => {
    const span = maxTick - minTick;
    return [0, 0.25, 0.5, 0.75, 1].map((r) => minTick + r * span);
  }, [minTick, maxTick]);

  // Calculate the Y coordinate for zero baseline
  const yZero = useMemo(() => {
    const span = maxTick - minTick || 1;
    return margin.top + chartHeight - ((0 - minTick) / span) * chartHeight;
  }, [minTick, maxTick, chartHeight]);

  const formatTickLabel = (tick: number) => {
    if (tick === 0) return '₹0';
    const isNegative = tick < 0;
    const absVal = Math.abs(tick);
    const formattedVal = absVal >= 1000
      ? `${(absVal / 1000).toFixed(1).replace('.0', '')}k`
      : absVal;
    return `${isNegative ? '-' : ''}₹${formattedVal}`;
  };

  // X ticks: Show about 5 to 7 dates
  const xTickIndices = useMemo(() => {
    const step = Math.max(1, Math.floor(data.length / 6));
    const indices = [];
    for (let i = 0; i < data.length; i += step) {
      indices.push(i);
    }
    // Make sure the last date is included
    if (indices[indices.length - 1] !== data.length - 1) {
      indices.push(data.length - 1);
    }
    return indices;
  }, [data]);

  const getEarningName = (key: string) => {
    if (key === 'total') return 'Overall Net Earnings';
    if (key === 'kmc') return 'KMC Services (Net)';
    if (key === 'csc') return 'CSC Services (Net)';
    if (key === 'aapleSarkar') return 'Aaple Sarkar Services (Net)';
    return SERVICE_LABELS[key] || key;
  };

  const getEarningValue = (item: DailyEarningPoint, key: string) => {
    return Number((item as any)[key] || 0);
  };

  // Helper to format date label
  const formatDateLabel = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = parseInt(parts[2]);
        const monthIdx = parseInt(parts[1]) - 1;
        return `${day} ${monthNames[monthIdx]}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 16 }}>Net Earnings Over Time</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Visualize profit margins day-by-day</div>
        </div>

        {/* Dynamic Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="tab-bar" style={{ padding: 3, margin: 0, gap: 4 }}>
            <button
              className={`tab ${filter === 'total' ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: 13 }}
              onClick={() => { setFilter('total'); setHoveredPoint(null); }}
            >
              Overall
            </button>
            <button
              className={`tab ${filter === 'modules' ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: 13 }}
              onClick={() => { setFilter('modules'); setHoveredPoint(null); }}
            >
              By Modules
            </button>
            <button
              className={`tab ${filter === 'individual' ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: 13 }}
              onClick={() => { setFilter('individual'); setHoveredPoint(null); }}
            >
              By Service
            </button>
          </div>

          {filter === 'individual' && (
            <select
              value={selectedService}
              onChange={(e) => { setSelectedService(e.target.value); setHoveredPoint(null); }}
              className="neo-select"
              style={{ padding: '6px 12px', fontSize: 13, border: '2px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}
            >
              {Object.keys(SERVICE_LABELS).map((key) => (
                <option key={key} value={key}>
                  {SERVICE_LABELS[key]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div style={{ position: 'relative', width: '100%', border: '2px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', padding: '10px 0', overflow: 'visible' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: 'block' }}>
          <defs>
            {/* Gradients for Areas */}
            <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-kmc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-csc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-aapleSarkar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="grad-individual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERVICE_COLORS[selectedService] || '#6366f1'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={SERVICE_COLORS[selectedService] || '#6366f1'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const span = maxTick - minTick || 1;
            const y = margin.top + chartHeight - ((tick - minTick) / span) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={margin.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontWeight="500"
                >
                  {formatTickLabel(tick)}
                </text>
              </g>
            );
          })}

          {/* Vertical Guides */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={margin.top}
              x2={hoveredPoint.x}
              y2={margin.top + chartHeight}
              stroke="var(--border)"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          )}

          {/* Area paths */}
          {chartPaths.map(({ key, areaD }) => {
            let gradId = 'grad-total';
            if (filter === 'modules') gradId = `grad-${key}`;
            else if (filter === 'individual') gradId = 'grad-individual';

            return (
              <path
                key={`area-${key}`}
                d={areaD}
                fill={`url(#${gradId})`}
              />
            );
          })}

          {/* Line paths */}
          {chartPaths.map(({ key, lineD, strokeColor }) => (
            <path
              key={`line-${key}`}
              d={lineD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Hover Tracker Circles */}
          {chartPaths.map(({ key, strokeColor }) => {
            return data.map((d, i) => {
              const val = Number((d as any)[key]) || 0;
              const { x, y } = getCoordinates(i, val);
              const isHovered = hoveredPoint?.index === i;
              return (
                <circle
                  key={`dot-${key}-${i}`}
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#fff"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 3.5 : 2}
                  style={{ transition: 'r 0.1s ease, stroke-width 0.1s ease' }}
                />
              );
            });
          })}

          {/* X Axis ticks */}
          {xTickIndices.map((idx) => {
            if (idx >= data.length) return null;
            const x = margin.left + (idx / (data.length - 1 || 1)) * chartWidth;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={margin.top + chartHeight}
                  x2={x}
                  y2={margin.top + chartHeight + 4}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={margin.top + chartHeight + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontWeight="500"
                >
                  {formatDateLabel(data[idx].date)}
                </text>
              </g>
            );
          })}

          {/* Transparent Overlay for hovering */}
          {data.map((d, i) => {
            const x = margin.left + (i / (data.length - 1 || 1)) * chartWidth;
            // Draw vertical interaction bands
            const bandWidth = chartWidth / (data.length - 1 || 1);
            return (
              <rect
                key={`band-${i}`}
                x={x - bandWidth / 2}
                y={margin.top}
                width={bandWidth}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => {
                  // Find primary y coordinate to lock the tooltip anchor
                  const primaryKey = activeKeys[0];
                  const primaryVal = Number((d as any)[primaryKey]) || 0;
                  const coords = getCoordinates(i, primaryVal);
                  setHoveredPoint({ index: i, x: coords.x, y: coords.y, item: d });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Base Axis Line */}
          <line
            x1={margin.left}
            y1={yZero}
            x2={width - margin.right}
            y2={yZero}
            stroke="var(--border)"
            strokeWidth="2"
          />
        </svg>

        {/* HTML Interactive Tooltip Card */}
        {hoveredPoint && (() => {
          const isNearTop = hoveredPoint.y < 80;
          const isNearLeft = hoveredPoint.x < 120;
          const isNearRight = hoveredPoint.x > width - 120;

          const pctX = (hoveredPoint.x / width) * 100;
          const pctY = (hoveredPoint.y / height) * 100;

          const tooltipStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${pctX}%`,
            top: `${pctY}%`,
            backgroundColor: 'var(--surface)',
            border: '2.5px solid var(--border)',
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: '4px 4px 0px 0px var(--border)',
            zIndex: 10,
            pointerEvents: 'none',
            minWidth: 160,
            fontSize: 12,
            color: 'var(--text)',
          };

          if (isNearTop) {
            tooltipStyle.marginTop = '15px';
            if (isNearLeft) {
              tooltipStyle.transform = 'translate(10px, 0)';
            } else if (isNearRight) {
              tooltipStyle.transform = 'translate(-100%, 0) translate(-10px, 0)';
            } else {
              tooltipStyle.transform = 'translate(-50%, 0)';
            }
          } else {
            tooltipStyle.marginTop = '-15px';
            if (isNearLeft) {
              tooltipStyle.transform = 'translate(10px, -100%)';
            } else if (isNearRight) {
              tooltipStyle.transform = 'translate(-100%, -100%) translate(-10px, 0)';
            } else {
              tooltipStyle.transform = 'translate(-50%, -100%)';
            }
          }

          return (
            <div style={tooltipStyle}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', paddingBottom: 4, marginBottom: 6 }}>
                {formatDateLabel(hoveredPoint.item.date)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {activeKeys.map((key) => {
                  let badgeColor = '#4f46e5';
                  if (key === 'kmc') badgeColor = '#10b981';
                  else if (key === 'csc') badgeColor = '#f43f5e';
                  else if (key === 'aapleSarkar') badgeColor = '#3b82f6';
                  else if (filter === 'individual') badgeColor = SERVICE_COLORS[key] || '#6366f1';

                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: badgeColor }} />
                        {getEarningName(key)}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>
                        ₹{getEarningValue(hoveredPoint.item, key).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend display for comparison */}
      {filter === 'modules' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, fontWeight: 500, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '2px', border: '1.5px solid var(--border)', backgroundColor: '#10b981' }} />
            <span>KMC Services</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '2px', border: '1.5px solid var(--border)', backgroundColor: '#f43f5e' }} />
            <span>CSC Services</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '2px', border: '1.5px solid var(--border)', backgroundColor: '#3b82f6' }} />
            <span>Aaple Sarkar Services</span>
          </div>
        </div>
      )}
    </div>
  );
}
