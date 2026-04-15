import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { STATUS_OPTIONS, formatDateTime, formatDuration, formatRelativeTime } from '../utils/constants';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import {
  ArrowLeft, Phone, PhoneOff, PhoneCall, PhoneMissed, Clock,
  CalendarClock, User, Mail, Building2, Globe,
  SkipForward
} from 'lucide-react';

const cardStyle = {
  background: 'rgba(30,41,59,0.7)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 16,
  padding: 20
};

const inputStyle = {
  background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: 12, padding: '10px 12px', fontSize: 14, color: 'white', outline: 'none', width: '100%'
};

export default function LeadDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  const [toast, setToast] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callStatus, setCallStatus] = useState('');
  const timerRef = useRef(null);
  const [noteText, setNoteText] = useState('');
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ followup_date: '', remarks: '' });

  useEffect(() => {
    loadLead();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  const loadLead = async () => {
    try { setLoading(true); const res = await api.get(`/leads/${id}`); setLead(res.data); }
    catch (err) { console.error('Failed to load lead:', err); }
    finally { setLoading(false); }
  };

  const startCall = () => {
    setCallActive(true); setCallTimer(0); setCallStatus('ringing');
    setTimeout(() => {
      const outcomes = ['answered', 'answered', 'answered', 'no_answer', 'busy'];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      setCallStatus(outcome);
      if (outcome === 'answered') {
        timerRef.current = setInterval(() => setCallTimer(prev => prev + 1), 1000);
      } else {
        setTimeout(() => endCall(outcome, 0), 2000);
      }
    }, 2000 + Math.random() * 2000);
  };

  const endCall = async (status, duration) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalStatus = status || callStatus;
    const finalDuration = duration !== undefined ? duration : callTimer;
    setCallActive(false); setCallTimer(0); setCallStatus('');
    try {
      await api.post('/calls', {
        lead_id: parseInt(id), call_type: 'outbound', call_status: finalStatus,
        duration: finalDuration, notes: `Call ${finalStatus} - Duration: ${formatDuration(finalDuration)}`
      });
      showToast(`Call logged: ${finalStatus.replace(/_/g, ' ')}`, 'success');
      loadLead();
    } catch (err) { showToast('Failed to log call', 'error'); }
  };

  const hangUp = () => endCall(callStatus === 'ringing' ? 'no_answer' : callStatus, callTimer);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await api.post(`/leads/${id}/notes`, { note_text: noteText });
      setNoteText(''); showToast('Note added', 'success'); loadLead();
    } catch (err) { showToast('Failed to add note', 'error'); }
  };

  const createFollowUp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/followups', { lead_id: parseInt(id), followup_date: followUpForm.followup_date, remarks: followUpForm.remarks });
      setShowFollowUpModal(false); setFollowUpForm({ followup_date: '', remarks: '' });
      showToast('Follow-up scheduled', 'success'); loadLead();
    } catch (err) { showToast('Failed to create follow-up', 'error'); }
  };

  const updateFollowUp = async (fuId, status) => {
    try { await api.put(`/followups/${fuId}`, { status }); showToast(`Follow-up marked as ${status}`, 'success'); loadLead(); }
    catch (err) { showToast('Failed to update follow-up', 'error'); }
  };

  const updateStatus = async (newStatus) => {
    try { await api.put(`/leads/${id}`, { status: newStatus }); showToast('Status updated', 'success'); loadLead(); }
    catch (err) { showToast('Failed to update status', 'error'); }
  };

  const goToNextLead = async () => {
    try {
      const res = await api.get(`/leads/${id}/next`);
      if (res.data.lead) navigate(`/leads/${res.data.lead.id}`);
      else showToast('No more leads to call', 'info');
    } catch (err) { showToast('Failed to get next lead', 'error'); }
  };

  const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!lead) return <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 80 }}>Lead not found</p>;

  const tabs = [
    { id: 'notes', label: 'Notes', count: lead.notes?.length },
    { id: 'calls', label: 'Call History', count: lead.callLogs?.length },
    { id: 'followups', label: 'Follow-ups', count: lead.followUps?.length },
  ];

  const infoItems = [
    { icon: User, label: 'Name', value: lead.name },
    { icon: Phone, label: 'Phone', value: lead.phone },
    { icon: Mail, label: 'Email', value: lead.email || '—' },
    { icon: Building2, label: 'Company', value: lead.company || '—' },
    { icon: Globe, label: 'Source', value: lead.source?.replace(/_/g, ' ') },
    { icon: User, label: 'Agent', value: lead.agent_name || 'Unassigned' },
  ];

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/leads')} style={{ padding: 8, borderRadius: 8, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>{lead.name}</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '2px 0 0' }}>{lead.company || 'No company'} • Added {formatRelativeTime(lead.created_at)}</p>
        </div>
        <button onClick={goToNextLead} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.15)', background: 'transparent',
          fontSize: 14, fontWeight: 500, color: '#cbd5e1', cursor: 'pointer'
        }}>
          <SkipForward size={16} /> Next Lead
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Lead Info */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>Lead Information</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {infoItems.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <item.icon size={15} color="#64748b" />
                  <span style={{ fontSize: 12, color: '#64748b', width: 64 }}>{item.label}</span>
                  <span style={{ fontSize: 14, color: 'white', textTransform: 'capitalize' }}>{item.value}</span>
                </div>
              ))}
            </div>
            {/* Quick Status */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', margin: '0 0 8px' }}>Quick Status Update</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => updateStatus(s.value)}
                    style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      color: s.color, border: lead.status === s.value ? `2px solid ${s.color}` : '1px solid transparent',
                      background: lead.status === s.value ? `${s.color}20` : 'transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { if (lead.status !== s.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { if (lead.status !== s.value) e.currentTarget.style.background = 'transparent'; }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Call Interface */}
          <div style={{
            ...cardStyle,
            background: callActive ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(30,41,59,0.9))' : cardStyle.background,
            border: callActive ? '1px solid rgba(16,185,129,0.2)' : cardStyle.border
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 16px' }}>Call Interface</h3>
            {callActive ? (
              <div style={{ textAlign: 'center' }}>
                <div className="animate-pulse-glow" style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: callStatus === 'ringing' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'
                }}>
                  <PhoneCall size={28} color={callStatus === 'ringing' ? '#fbbf24' : '#34d399'} />
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>{lead.phone}</p>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: '4px 0 0', textTransform: 'capitalize' }}>
                  {callStatus === 'ringing' ? '📞 Ringing...' : `🟢 ${callStatus.replace(/_/g, ' ')}`}
                </p>
                {callStatus === 'answered' && (
                  <p style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 700, color: '#34d399', margin: '16px 0' }}>
                    {formatDuration(callTimer)}
                  </p>
                )}
                <button onClick={hangUp} style={{
                  padding: '12px 32px', borderRadius: 999, border: 'none', fontSize: 14,
                  fontWeight: 600, color: 'white', background: '#ef4444', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16
                }}>
                  <PhoneOff size={16} /> End Call
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 16px' }}>{lead.phone}</p>
                <button onClick={startCall} style={{
                  width: '100%', padding: 12, borderRadius: 12, border: 'none', fontSize: 14,
                  fontWeight: 600, color: 'white', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <Phone size={16} /> Start Call
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Tabs */}
        <div>
          {/* Tab Headers */}
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(30,41,59,0.5)', marginBottom: 20 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 14,
                  fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  color: activeTab === tab.id ? 'white' : '#94a3b8',
                  background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent'
                }}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    marginLeft: 8, padding: '2px 6px', borderRadius: 999, fontSize: 12,
                    background: 'rgba(99,102,241,0.2)'
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={cardStyle}>
            {/* NOTES */}
            {activeTab === 'notes' && (
              <div>
                <form onSubmit={addNote} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note..." style={{ ...inputStyle, flex: 1 }} />
                  <button type="submit" style={{
                    padding: '10px 16px', borderRadius: 12, border: 'none', fontSize: 14,
                    fontWeight: 600, color: 'white', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  }}>Add</button>
                </form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                  {lead.notes?.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: '32px 0' }}>No notes yet</p>
                  ) : lead.notes?.map(note => (
                    <div key={note.id} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#818cf8' }}>{note.user_name}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{formatDateTime(note.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#cbd5e1', margin: 0 }}>{note.note_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CALLS */}
            {activeTab === 'calls' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                {lead.callLogs?.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: '32px 0' }}>No calls logged</p>
                ) : lead.callLogs?.map(call => (
                  <div key={call.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.05)'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: call.call_status === 'answered' ? 'rgba(16,185,129,0.1)' : call.call_status === 'busy' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
                    }}>
                      {call.call_status === 'answered' ? <PhoneCall size={16} color="#34d399" /> : call.call_status === 'busy' ? <PhoneOff size={16} color="#f87171" /> : <PhoneMissed size={16} color="#fbbf24" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge status={call.call_status} />
                        <span style={{ fontSize: 12, color: '#64748b' }}>{call.call_type}</span>
                      </div>
                      {call.notes && <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{call.notes}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'white', margin: 0 }}>{formatDuration(call.duration)}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{formatDateTime(call.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FOLLOW-UPS */}
            {activeTab === 'followups' && (
              <div>
                <button onClick={() => setShowFollowUpModal(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
                  border: '1px solid rgba(99,102,241,0.2)', background: 'transparent',
                  fontSize: 14, fontWeight: 500, color: '#818cf8', cursor: 'pointer', marginBottom: 16
                }}>
                  <CalendarClock size={16} /> Schedule Follow-up
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                  {lead.followUps?.length === 0 ? (
                    <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', padding: '32px 0' }}>No follow-ups scheduled</p>
                  ) : lead.followUps?.map(fu => (
                    <div key={fu.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.05)'
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: fu.status === 'completed' ? 'rgba(16,185,129,0.1)' : fu.status === 'missed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'
                      }}>
                        <CalendarClock size={16} color={fu.status === 'completed' ? '#34d399' : fu.status === 'missed' ? '#f87171' : '#fbbf24'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <StatusBadge status={fu.status} />
                          <span style={{ fontSize: 12, color: '#64748b' }}>{fu.user_name}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>{fu.remarks || 'No remarks'}</p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{formatDateTime(fu.followup_date)}</p>
                      </div>
                      {fu.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => updateFollowUp(fu.id, 'completed')} style={{
                            padding: '4px 10px', borderRadius: 8, border: 'none', fontSize: 12,
                            fontWeight: 500, color: '#34d399', background: 'rgba(16,185,129,0.1)', cursor: 'pointer'
                          }}>Complete</button>
                          <button onClick={() => updateFollowUp(fu.id, 'missed')} style={{
                            padding: '4px 10px', borderRadius: 8, border: 'none', fontSize: 12,
                            fontWeight: 500, color: '#f87171', background: 'rgba(239,68,68,0.1)', cursor: 'pointer'
                          }}>Missed</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      <Modal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} title="Schedule Follow-up">
        <form onSubmit={createFollowUp}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Date & Time *</label>
            <input type="datetime-local" required value={followUpForm.followup_date}
              onChange={e => setFollowUpForm({...followUpForm, followup_date: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Remarks</label>
            <textarea value={followUpForm.remarks} onChange={e => setFollowUpForm({...followUpForm, remarks: e.target.value})}
              rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Notes about this follow-up..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => setShowFollowUpModal(false)} style={{
              padding: '10px 16px', borderRadius: 12, border: 'none', fontSize: 14,
              fontWeight: 500, color: '#94a3b8', background: 'transparent', cursor: 'pointer'
            }}>Cancel</button>
            <button type="submit" style={{
              padding: '10px 20px', borderRadius: 12, border: 'none', fontSize: 14,
              fontWeight: 600, color: 'white', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
            }}>Schedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
