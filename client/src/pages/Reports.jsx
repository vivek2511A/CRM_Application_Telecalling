import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDuration } from '../utils/constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Phone, Users, Target } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];
const STATUS_COLORS = {
  new: '#3b82f6', contacted: '#8b5cf6', interested: '#f59e0b',
  qualified: '#06b6d4', converted: '#10b981', lost: '#ef4444'
};

const cardStyle = {
  background: 'rgba(30,41,59,0.7)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 16,
  padding: 20
};

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: 12,
  fontSize: 12
};

export default function Reports() {
  const [agentPerformance, setAgentPerformance] = useState([]);
  const [callAnalytics, setCallAnalytics] = useState({ analytics: [], overall: {} });
  const [conversionRates, setConversionRates] = useState({ bySource: [], byAgent: [], funnel: [] });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [perf, calls, conv] = await Promise.all([
        api.get('/reports/agent-performance'),
        api.get('/reports/call-analytics'),
        api.get('/reports/conversion-rates')
      ]);
      setAgentPerformance(perf.data);
      setCallAnalytics(calls.data);
      setConversionRates(conv.data);
    } catch (err) { console.error('Failed to load reports:', err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const sections = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'agents', label: 'Agent Performance', icon: Users },
    { id: 'calls', label: 'Call Analytics', icon: Phone },
    { id: 'conversions', label: 'Conversions', icon: Target },
  ];

  const thStyle = {
    padding: '12px 16px', textAlign: 'left', fontSize: 11,
    fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'
  };

  const tdStyle = { padding: '12px 16px', fontSize: 14, color: '#cbd5e1' };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Reports & Analytics</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Track performance and conversion metrics</p>
      </div>

      {/* Section Navigation */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(30,41,59,0.5)', marginBottom: 24 }}>
        {sections.map(section => (
          <button key={section.id} onClick={() => setActiveSection(section.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 14,
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              color: activeSection === section.id ? 'white' : '#94a3b8',
              background: activeSection === section.id ? 'rgba(99,102,241,0.15)' : 'transparent'
            }}>
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Calls', value: callAnalytics.overall?.total_calls || 0, color: '#6366f1' },
              { label: 'Answered', value: callAnalytics.overall?.answered || 0, color: '#10b981' },
              { label: 'Answer Rate', value: `${callAnalytics.overall?.answer_rate || 0}%`, color: '#f59e0b' },
              { label: 'Avg Duration', value: formatDuration(Math.round(callAnalytics.overall?.avg_duration || 0)), color: '#8b5cf6' },
            ].map(stat => (
              <div key={stat.label} style={cardStyle}>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Funnel */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Lead Funnel</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionRates.funnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80}
                      tickFormatter={v => v?.charAt(0).toUpperCase() + v?.slice(1)} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {conversionRates.funnel.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Source Pie */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Leads by Source</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={conversionRates.bySource} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      paddingAngle={3} dataKey="total" nameKey="source">
                      {conversionRates.bySource.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [value, name?.replace(/_/g, ' ')]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {conversionRates.bySource.map((s, i) => (
                  <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{s.source?.replace(/_/g, ' ')}</span>
                    <span style={{ color: 'white', fontWeight: 500, marginLeft: 'auto' }}>{s.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGENTS */}
      {activeSection === 'agents' && (
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Agent', 'Leads', 'Calls', 'Today', 'Answered', 'Avg Duration', 'Interested', 'Converted', 'Rate', 'Follow-ups'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map(agent => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, color: 'white', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        }}>{agent.name?.charAt(0)}</div>
                        <span style={{ fontWeight: 500, color: 'white' }}>{agent.name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{agent.total_leads}</td>
                    <td style={tdStyle}>{agent.total_calls}</td>
                    <td style={tdStyle}>{agent.calls_today}</td>
                    <td style={tdStyle}>{agent.answered_calls}</td>
                    <td style={tdStyle}>{formatDuration(agent.avg_call_duration)}</td>
                    <td style={{ ...tdStyle, color: '#fbbf24', fontWeight: 500 }}>{agent.interested}</td>
                    <td style={{ ...tdStyle, color: '#34d399', fontWeight: 500 }}>{agent.conversions}</td>
                    <td style={tdStyle}>{agent.total_leads > 0 ? Math.round((agent.conversions / agent.total_leads) * 100) : 0}%</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: '#fbbf24' }}>{agent.pending_followups} pending</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CALLS */}
      {activeSection === 'calls' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Daily Call Volume</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callAnalytics.analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
                <Legend />
                <Bar dataKey="answered" name="Answered" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="no_answer" name="No Answer" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="busy" name="Busy" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="voicemail" name="Voicemail" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CONVERSIONS */}
      {activeSection === 'conversions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Conversion Rate by Source</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {conversionRates.bySource.map(s => (
                <div key={s.source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{s.source?.replace(/_/g, ' ')}</span>
                    <span style={{ color: 'white', fontWeight: 500 }}>{s.rate}% ({s.converted}/{s.total})</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.1)' }}>
                    <div style={{ height: 8, borderRadius: 4, width: `${Math.max(s.rate, 2)}%`, background: '#6366f1', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Conversion Rate by Agent</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {conversionRates.byAgent.map(a => (
                <div key={a.agent_name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: '#cbd5e1' }}>{a.agent_name}</span>
                    <span style={{ color: 'white', fontWeight: 500 }}>{a.rate}% ({a.converted}/{a.total_leads})</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.1)' }}>
                    <div style={{ height: 8, borderRadius: 4, width: `${Math.max(a.rate, 2)}%`, background: '#10b981', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
