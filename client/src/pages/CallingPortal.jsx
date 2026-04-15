import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDuration, formatDateTime, formatRelativeTime } from '../utils/constants';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import Toast from '../components/ui/Toast';
import {
  Phone, PhoneCall, PhoneOff, PhoneMissed, PhoneOutgoing,
  Clock, User, Building2, SkipForward, Pause, Play,
  ChevronRight, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';

const cardStyle = {
  background: 'rgba(30,41,59,0.7)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 16,
  padding: 20
};

const CALL_STATES = {
  IDLE: 'idle',
  DIALING: 'dialing',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended'
};

export default function CallingPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  // Call state
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [activeLead, setActiveLead] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callOutcome, setCallOutcome] = useState('');
  const timerRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  // Data state
  const [queue, setQueue] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      const [queueRes, historyRes, statsRes] = await Promise.all([
        api.get('/calls/queue'),
        api.get('/calls?limit=30'),
        api.get('/calls/stats')
      ]);
      setQueue(queueRes.data);
      setCallHistory(historyRes.data.calls);
      setStats(statsRes.data);
    } catch (err) { console.error('Failed to load calling data:', err); }
    finally { setLoading(false); }
  };

  // ─── Call Simulation ───────────────────────────────────────
  const startCall = (lead) => {
    if (callState !== CALL_STATES.IDLE && callState !== CALL_STATES.ENDED) return;

    setActiveLead(lead);
    setCallState(CALL_STATES.DIALING);
    setCallTimer(0);
    setCallOutcome('');

    // Simulate dialing → ringing → outcome
    setTimeout(() => {
      setCallState(CALL_STATES.RINGING);
      ringTimeoutRef.current = setTimeout(() => {
        const outcomes = ['answered', 'answered', 'answered', 'no_answer', 'busy'];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

        if (outcome === 'answered') {
          setCallState(CALL_STATES.CONNECTED);
          setCallOutcome('answered');
          timerRef.current = setInterval(() => setCallTimer(prev => prev + 1), 1000);
        } else {
          setCallOutcome(outcome);
          setCallState(CALL_STATES.ENDED);
          logCall(lead, outcome, 0);
        }
      }, 2000 + Math.random() * 2000);
    }, 1500);
  };

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);

    const finalOutcome = callState === CALL_STATES.DIALING || callState === CALL_STATES.RINGING
      ? 'no_answer' : (callOutcome || 'answered');
    const finalDuration = callTimer;

    setCallState(CALL_STATES.ENDED);
    setCallOutcome(finalOutcome);
    logCall(activeLead, finalOutcome, finalDuration);
  };

  const logCall = async (lead, status, duration) => {
    try {
      await api.post('/calls', {
        lead_id: lead.id,
        call_type: 'outbound',
        call_status: status,
        duration,
        notes: `${status.replace(/_/g, ' ')} — Duration: ${formatDuration(duration)}`
      });
      showToast(`Call logged: ${status.replace(/_/g, ' ')}`, status === 'answered' ? 'success' : 'info');
      // Refresh data
      const [historyRes, statsRes] = await Promise.all([
        api.get('/calls?limit=30'),
        api.get('/calls/stats')
      ]);
      setCallHistory(historyRes.data.calls);
      setStats(statsRes.data);
    } catch (err) { showToast('Failed to log call', 'error'); }
  };

  const callNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState(CALL_STATES.IDLE);
    setCallTimer(0);
    setCallOutcome('');
    setActiveLead(null);

    // Find next lead in queue that isn't the current one
    const nextLead = queue.find(l => l.id !== activeLead?.id);
    if (nextLead) {
      setTimeout(() => startCall(nextLead), 300);
    } else {
      showToast('No more leads in queue', 'info');
    }
  };

  const resetCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    setCallState(CALL_STATES.IDLE);
    setCallTimer(0);
    setCallOutcome('');
    setActiveLead(null);
  };

  const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const isCallActive = callState !== CALL_STATES.IDLE && callState !== CALL_STATES.ENDED;

  // ─── Status config ─────────────────────────────────────────
  const callStateConfig = {
    [CALL_STATES.IDLE]: { label: 'Ready', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    [CALL_STATES.DIALING]: { label: 'Dialing...', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    [CALL_STATES.RINGING]: { label: 'Ringing...', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    [CALL_STATES.CONNECTED]: { label: 'Connected', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    [CALL_STATES.ENDED]: { label: 'Call Ended', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Calling Portal</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Make calls, track outcomes, and manage your calling queue</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            color: callStateConfig[callState].color,
            background: callStateConfig[callState].bg
          }}>
            ● {callStateConfig[callState].label}
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Calls', value: stats.total || 0, icon: Phone, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Answered', value: stats.answered || 0, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'No Answer', value: stats.no_answer || 0, icon: PhoneMissed, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Busy', value: stats.busy || 0, icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Talk Time', value: formatDuration(Math.round(stats.total_duration || 0)), icon: Clock, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map(stat => (
          <div key={stat.label} style={{ ...cardStyle, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.bg, flexShrink: 0 }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>

        {/* ═══ LEFT: Call Interface ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Active Call Card */}
          <div style={{
            ...cardStyle,
            background: isCallActive
              ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(30,41,59,0.9))'
              : callState === CALL_STATES.ENDED
                ? 'linear-gradient(135deg, rgba(148,163,184,0.08), rgba(30,41,59,0.9))'
                : cardStyle.background,
            border: isCallActive
              ? '1px solid rgba(16,185,129,0.2)'
              : callState === CALL_STATES.ENDED
                ? '1px solid rgba(148,163,184,0.15)'
                : cardStyle.border,
            textAlign: 'center',
            padding: 28
          }}>
            {/* No active call */}
            {callState === CALL_STATES.IDLE && !activeLead && (
              <div>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.2)'
                }}>
                  <PhoneOutgoing size={32} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Ready to Call</h3>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px' }}>
                  Select a lead from the queue or click the call button to start dialing
                </p>
                {queue.length > 0 && (
                  <button onClick={() => startCall(queue[0])} style={{
                    width: '100%', padding: 14, borderRadius: 14, border: 'none', fontSize: 15,
                    fontWeight: 600, color: 'white', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}>
                    <Phone size={18} /> Start Calling Queue
                  </button>
                )}
              </div>
            )}

            {/* Active/Ended call */}
            {(isCallActive || callState === CALL_STATES.ENDED) && activeLead && (
              <div>
                {/* Pulsing avatar */}
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
                  <div className={isCallActive ? 'animate-pulse-glow' : ''} style={{
                    width: 80, height: 80, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: callState === CALL_STATES.CONNECTED ? 'rgba(16,185,129,0.15)' :
                      callState === CALL_STATES.ENDED ? 'rgba(148,163,184,0.1)' : 'rgba(245,158,11,0.15)',
                    fontSize: 28, fontWeight: 700, color: 'white'
                  }}>
                    {callState === CALL_STATES.CONNECTED ? (
                      <PhoneCall size={32} color="#34d399" />
                    ) : callState === CALL_STATES.ENDED ? (
                      callOutcome === 'answered' ? <CheckCircle2 size={32} color="#34d399" /> :
                        callOutcome === 'busy' ? <XCircle size={32} color="#f87171" /> :
                          <PhoneMissed size={32} color="#fbbf24" />
                    ) : (
                      <PhoneOutgoing size={32} color="#fbbf24" />
                    )}
                  </div>
                </div>

                {/* Lead name & phone */}
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{activeLead.name}</h3>
                <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 0 4px', fontFamily: 'monospace' }}>{activeLead.phone}</p>
                {activeLead.company && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>{activeLead.company}</p>}

                {/* Call status label */}
                <div style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: 999, marginBottom: 16,
                  fontSize: 13, fontWeight: 600,
                  color: callStateConfig[callState].color,
                  background: callStateConfig[callState].bg
                }}>
                  {callState === CALL_STATES.DIALING && '📡 Dialing...'}
                  {callState === CALL_STATES.RINGING && '📞 Ringing...'}
                  {callState === CALL_STATES.CONNECTED && '🟢 Connected'}
                  {callState === CALL_STATES.ENDED && (
                    callOutcome === 'answered' ? '✅ Call Completed' :
                      callOutcome === 'busy' ? '🔴 Line Busy' : '📵 No Answer'
                  )}
                </div>

                {/* Timer */}
                {(callState === CALL_STATES.CONNECTED || (callState === CALL_STATES.ENDED && callOutcome === 'answered')) && (
                  <div style={{
                    fontSize: 48, fontFamily: 'monospace', fontWeight: 700, margin: '8px 0 20px',
                    color: callState === CALL_STATES.CONNECTED ? '#34d399' : '#94a3b8'
                  }}>
                    {formatDuration(callTimer)}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: callState === CALL_STATES.ENDED ? 16 : 0 }}>
                  {isCallActive && (
                    <button onClick={endCall} style={{
                      flex: 1, maxWidth: 200, padding: 14, borderRadius: 14, border: 'none',
                      fontSize: 14, fontWeight: 600, color: 'white', background: '#ef4444',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                      <PhoneOff size={18} /> End Call
                    </button>
                  )}
                  {callState === CALL_STATES.ENDED && (
                    <>
                      <button onClick={callNext} style={{
                        flex: 1, padding: 14, borderRadius: 14, border: 'none',
                        fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}>
                        <SkipForward size={16} /> Call Next
                      </button>
                      <button onClick={() => navigate(`/leads/${activeLead.id}`)} style={{
                        padding: 14, borderRadius: 14, fontSize: 14, fontWeight: 600,
                        color: '#cbd5e1', cursor: 'pointer',
                        border: '1px solid rgba(148,163,184,0.15)', background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}>
                        <User size={16} /> View Lead
                      </button>
                      <button onClick={resetCall} style={{
                        padding: '14px 16px', borderRadius: 14, fontSize: 14, fontWeight: 500,
                        color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'transparent'
                      }}>
                        Done
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Lead Info (when active) */}
          {activeLead && (
            <div style={cardStyle}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lead Info</h4>
              {[
                { icon: User, label: activeLead.name },
                { icon: Phone, label: activeLead.phone },
                { icon: Building2, label: activeLead.company || 'No company' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <item.icon size={14} color="#64748b" />
                  <span style={{ fontSize: 14, color: '#cbd5e1' }}>{item.label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <StatusBadge status={activeLead.status} />
                <PriorityBadge priority={activeLead.priority} />
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0' }}>
                Total calls: {activeLead.total_calls || 0}
                {activeLead.last_called && ` • Last called ${formatRelativeTime(activeLead.last_called)}`}
              </p>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Queue + History ═══ */}
        <div>
          {/* Tab switch */}
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(30,41,59,0.5)', marginBottom: 16 }}>
            {[
              { id: 'queue', label: `Call Queue (${queue.length})` },
              { id: 'history', label: `Call History (${callHistory.length})` }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 14,
                  fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  color: activeTab === tab.id ? 'white' : '#94a3b8',
                  background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent'
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* QUEUE TAB */}
          {activeTab === 'queue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queue.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 20px' }}>
                  <Phone size={40} color="#475569" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 14, color: '#64748b' }}>No leads in queue</p>
                </div>
              ) : (
                queue.map((lead, i) => {
                  const isActive = activeLead?.id === lead.id && isCallActive;
                  const hasOverdueFollowup = lead.next_followup && new Date(lead.next_followup) < new Date();
                  return (
                    <div key={lead.id} style={{
                      ...cardStyle, padding: 14,
                      display: 'flex', alignItems: 'center', gap: 14,
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: isActive ? '1px solid rgba(16,185,129,0.3)' : cardStyle.border,
                      background: isActive ? 'rgba(16,185,129,0.05)' : cardStyle.background
                    }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(30,41,59,0.9)'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = cardStyle.background; }}>
                      {/* Priority indicator */}
                      <div style={{
                        width: 4, height: 40, borderRadius: 4, flexShrink: 0,
                        background: lead.priority === 'high' ? '#ef4444' : lead.priority === 'medium' ? '#f59e0b' : '#10b981'
                      }} />
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{lead.name}</span>
                          <StatusBadge status={lead.status} />
                          {hasOverdueFollowup && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#ef4444' }}>
                              <AlertCircle size={12} /> Overdue
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                          <span>{lead.phone}</span>
                          {lead.company && <span>{lead.company}</span>}
                          <span>{lead.total_calls} calls</span>
                        </div>
                      </div>
                      {/* Call button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); startCall(lead); }}
                        disabled={isCallActive}
                        style={{
                          width: 40, height: 40, borderRadius: 12, border: 'none', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: isCallActive ? 'not-allowed' : 'pointer',
                          color: 'white', transition: 'all 0.2s',
                          background: isCallActive ? 'rgba(100,116,139,0.2)' : 'linear-gradient(135deg, #10b981, #059669)',
                          opacity: isCallActive ? 0.4 : 1
                        }}>
                        <Phone size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {callHistory.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 20px' }}>
                  <Clock size={40} color="#475569" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 14, color: '#64748b' }}>No call history yet</p>
                </div>
              ) : (
                callHistory.map(call => (
                  <div key={call.id} style={{
                    ...cardStyle, padding: 14,
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                    onClick={() => navigate(`/leads/${call.lead_id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30,41,59,0.9)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = cardStyle.background}>
                    {/* Status icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                      background: call.call_status === 'answered' ? 'rgba(16,185,129,0.1)' :
                        call.call_status === 'busy' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
                    }}>
                      {call.call_status === 'answered' ? <PhoneCall size={18} color="#34d399" /> :
                        call.call_status === 'busy' ? <PhoneOff size={18} color="#f87171" /> :
                          <PhoneMissed size={18} color="#fbbf24" />}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{call.lead_name}</span>
                        <span style={{
                          padding: '2px 6px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          color: call.call_status === 'answered' ? '#34d399' : call.call_status === 'busy' ? '#f87171' : '#fbbf24',
                          background: call.call_status === 'answered' ? 'rgba(16,185,129,0.1)' : call.call_status === 'busy' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
                        }}>
                          {call.call_status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        <span>{call.lead_phone}</span>
                        {call.lead_company && <span>{call.lead_company}</span>}
                        <span>{call.user_name}</span>
                      </div>
                    </div>
                    {/* Duration + Time */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0, fontFamily: 'monospace' }}>
                        {call.call_status === 'answered' ? formatDuration(call.duration) : '—'}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{formatRelativeTime(call.created_at)}</p>
                    </div>
                    <ChevronRight size={16} color="#475569" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
