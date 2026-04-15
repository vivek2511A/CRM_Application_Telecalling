import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatDateTime, FOLLOWUP_STATUS_OPTIONS } from '../utils/constants';
import { StatusBadge } from '../components/ui/Badge';
import Toast from '../components/ui/Toast';
import { CalendarClock, Phone, Check, X, Clock, AlertTriangle } from 'lucide-react';

const cardStyle = {
  background: 'rgba(30,41,59,0.7)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 16
};

const selectStyle = {
  background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: 12, padding: '10px 12px', fontSize: 14, color: 'white',
  outline: 'none', cursor: 'pointer', appearance: 'auto'
};

export default function FollowUps() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => { loadFollowUps(); }, [statusFilter]);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/followups${params}`);
      setFollowUps(res.data);
    } catch (err) { console.error('Failed to load follow-ups:', err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/followups/${id}`, { status }); showToast(`Follow-up marked as ${status}`, 'success'); loadFollowUps(); }
    catch (err) { showToast('Failed to update', 'error'); }
  };

  const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const stats = {
    pending: followUps.filter(f => f.status === 'pending').length,
    completed: followUps.filter(f => f.status === 'completed').length,
    missed: followUps.filter(f => f.status === 'missed').length,
  };

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Follow-ups</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Manage your scheduled follow-ups and reminders</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Completed', value: stats.completed, icon: Check, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Missed', value: stats.missed, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map(stat => (
          <div key={stat.label} style={{ ...cardStyle, padding: 16, cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => setStatusFilter(statusFilter === stat.label.toLowerCase() ? '' : stat.label.toLowerCase())}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.bg }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Status</option>
          {FOLLOWUP_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {statusFilter && (
          <button onClick={() => setStatusFilter('')} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px', borderRadius: 12,
            border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13
          }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Follow-up List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : followUps.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '64px 0' }}>
            <CalendarClock size={40} color="#475569" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#64748b' }}>No follow-ups found</p>
          </div>
        ) : (
          followUps.map(fu => {
            const isOverdue = fu.status === 'pending' && new Date(fu.followup_date) < new Date();
            return (
              <div key={fu.id} style={{
                ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', gap: 16,
                transition: 'background 0.2s',
                boxShadow: isOverdue ? 'inset 0 0 0 1px rgba(239,68,68,0.2)' : 'none'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30,41,59,0.9)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(30,41,59,0.7)'}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: fu.status === 'completed' ? 'rgba(16,185,129,0.1)' : fu.status === 'missed' ? 'rgba(239,68,68,0.1)' : isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
                }}>
                  <CalendarClock size={18} color={fu.status === 'completed' ? '#34d399' : fu.status === 'missed' ? '#f87171' : isOverdue ? '#f87171' : '#fbbf24'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <button onClick={() => navigate(`/leads/${fu.lead_id}`)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'white', padding: 0
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#818cf8'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'white'}>
                      {fu.lead_name}
                    </button>
                    <StatusBadge status={fu.status} />
                    {isOverdue && <span style={{ fontSize: 12, color: '#f87171', fontWeight: 500 }}>Overdue</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{fu.remarks || 'No remarks'}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#64748b' }}>
                    <span>📅 {formatDateTime(fu.followup_date)}</span>
                    <span>👤 {fu.user_name}</span>
                    <span>📱 {fu.lead_phone}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {fu.status === 'pending' && (
                    <>
                      <button onClick={() => navigate(`/leads/${fu.lead_id}`)} style={{
                        padding: 8, borderRadius: 8, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex'
                      }} title="Call lead">
                        <Phone size={16} />
                      </button>
                      <button onClick={() => updateStatus(fu.id, 'completed')} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: '1px solid rgba(16,185,129,0.2)', background: 'transparent', color: '#34d399', cursor: 'pointer'
                      }}>Complete</button>
                      <button onClick={() => updateStatus(fu.id, 'missed')} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#f87171', cursor: 'pointer'
                      }}>Missed</button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
