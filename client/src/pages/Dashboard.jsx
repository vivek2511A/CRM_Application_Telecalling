import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDateTime, formatRelativeTime } from '../utils/constants';
import { StatusBadge } from '../components/ui/Badge';
import {
  Users, Phone, Star, TrendingUp, CalendarClock, UserPlus,
  PhoneCall, FileText, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{
          width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return null;
  const { kpis, recentActivities, upcomingFollowUps, statusDistribution, callTrend } = data;

  const kpiCards = [
    { label: 'Total Leads', value: kpis.totalLeads, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Calls Today', value: kpis.callsToday, icon: Phone, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Interested', value: kpis.interestedLeads, icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Conversions', value: kpis.conversions, icon: TrendingUp, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Follow-ups', value: kpis.pendingFollowUps, icon: CalendarClock, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'New This Week', value: kpis.newLeadsThisWeek, icon: UserPlus, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
  ];

  const activityIcons = { call: PhoneCall, note: FileText, followup: Clock };
  const activityColors = {
    call: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    note: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    followup: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: 0 }}>
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>Here's what's happening with your leads today.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map((kpi, i) => (
          <div key={kpi.label} style={{
            ...cardStyle, cursor: 'pointer', transition: 'transform 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: kpi.bg
              }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>{kpi.value}</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Call Trend */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Call Performance (7 Days)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={callTrend}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#f8fafc' }} />
                <Area type="monotone" dataKey="calls" stroke="#6366f1" fill="url(#colorCalls)" strokeWidth={2} name="Total Calls" />
                <Area type="monotone" dataKey="answered" stroke="#10b981" fill="url(#colorAnswered)" strokeWidth={2} name="Answered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Lead Distribution</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(value, name) => [value, name?.replace(/_/g, ' ')]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {statusDistribution.map(s => (
              <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: STATUS_COLORS[s.status], flexShrink: 0 }} />
                <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{s.status}</span>
                <span style={{ color: 'white', fontWeight: 500, marginLeft: 'auto' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upcoming Follow-ups */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>Upcoming Follow-ups</h3>
            <button onClick={() => navigate('/follow-ups')}
              style={{ fontSize: 12, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingFollowUps.length === 0 ? (
              <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: '32px 0' }}>No pending follow-ups</p>
            ) : (
              upcomingFollowUps.map(fu => (
                <div key={fu.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onClick={() => navigate(`/leads/${fu.lead_id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(139,92,246,0.1)', flexShrink: 0
                  }}>
                    <CalendarClock size={16} color="#a78bfa" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fu.lead_name}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fu.remarks}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{formatDateTime(fu.followup_date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivities.length === 0 ? (
              <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: '32px 0' }}>No recent activity</p>
            ) : (
              recentActivities.map((activity, i) => {
                const Icon = activityIcons[activity.type] || FileText;
                const c = activityColors[activity.type] || activityColors.note;

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12,
                    transition: 'background 0.2s'
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: c.bg, flexShrink: 0
                    }}>
                      <Icon size={14} color={c.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: 'white', margin: 0 }}>
                        <span style={{ fontWeight: 500 }}>{activity.user_name}</span>
                        <span style={{ color: '#94a3b8' }}> — {activity.type} with </span>
                        <span style={{ fontWeight: 500 }}>{activity.lead_name}</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{activity.detail}</p>
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{formatRelativeTime(activity.created_at)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
