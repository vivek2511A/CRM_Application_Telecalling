import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDate } from '../utils/constants';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { UserPlus, Edit2, Trash2, Users, Shield, Search } from 'lucide-react';

const cardStyle = {
  background: 'rgba(30,41,59,0.7)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 16
};

const inputStyle = {
  background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: 12, padding: '10px 12px', fontSize: 14, color: 'white',
  outline: 'none', width: '100%'
};

const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'auto' };

const thStyle = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11,
  fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'
};

const tdStyle = { padding: '12px 16px', fontSize: 14, color: '#cbd5e1' };

const btnIcon = {
  padding: 6, borderRadius: 8, background: 'transparent', border: 'none',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
};

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [leads, setLeads] = useState([]);
  const [leadSearch, setLeadSearch] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent', phone: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, agentsRes] = await Promise.all([api.get('/users'), api.get('/users/agents')]);
      setUsers(usersRes.data);
      setAgents(agentsRes.data);
    } catch (err) { console.error('Failed to load data:', err); }
    finally { setLoading(false); }
  };

  const loadLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (leadSearch) params.set('search', leadSearch);
      params.set('limit', 50);
      const res = await api.get(`/leads?${params}`);
      setLeads(res.data.leads);
    } catch (err) { console.error('Failed to load leads:', err); }
  };

  useEffect(() => { if (activeTab === 'assign') loadLeads(); }, [activeTab, leadSearch]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await api.put(`/users/${editingUser.id}`, updateData);
        showToast('User updated successfully', 'success');
      } else {
        await api.post('/users', form);
        showToast('User created successfully', 'success');
      }
      setShowModal(false); resetForm(); loadData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to save user', 'error'); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try { await api.delete(`/users/${id}`); showToast('User deactivated', 'success'); loadData(); }
    catch (err) { showToast('Failed to deactivate user', 'error'); }
  };

  const assignLead = async (leadId, agentId) => {
    try { await api.put(`/leads/${leadId}`, { assigned_to: parseInt(agentId) }); showToast('Lead assigned', 'success'); loadLeads(); }
    catch (err) { showToast('Failed to assign lead', 'error'); }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const resetForm = () => { setEditingUser(null); setForm({ name: '', email: '', password: '', role: 'agent', phone: '' }); };
  const showToast = (message, type) => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Manage users, agents, and lead assignments</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
            border: 'none', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
          }}>
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(30,41,59,0.5)', marginBottom: 24 }}>
        {[
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'assign', label: 'Lead Assignment', icon: Shield },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, flex: 1,
              padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 14,
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              color: activeTab === tab.id ? 'white' : '#94a3b8',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent'
            }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['User', 'Email', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, color: 'white',
                          background: u.role === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        }}>{u.name?.charAt(0)}</div>
                        <span style={{ fontWeight: 500, color: 'white' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>{u.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        color: u.role === 'admin' ? '#fbbf24' : '#818cf8',
                        background: u.role === 'admin' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)'
                      }}>{u.role}</span>
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>{u.phone || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        color: u.is_active ? '#34d399' : '#f87171',
                        background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                      }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#64748b' }}>{formatDate(u.created_at)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(u)} style={{ ...btnIcon, color: '#94a3b8' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                          <Edit2 size={15} />
                        </button>
                        {u.is_active && (
                          <button onClick={() => handleDeactivate(u.id)} style={{ ...btnIcon, color: '#94a3b8' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAD ASSIGNMENT */}
      {activeTab === 'assign' && (
        <div>
          <div style={{ position: 'relative', maxWidth: 360, marginBottom: 16 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input type="text" value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
              placeholder="Search leads to assign..." style={{ ...inputStyle, paddingLeft: 40 }} />
          </div>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Lead', 'Phone', 'Company', 'Status', 'Current Agent', 'Assign To'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...tdStyle, fontWeight: 500, color: 'white' }}>{lead.name}</td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{lead.phone}</td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{lead.company || '—'}</td>
                      <td style={{ ...tdStyle, color: '#94a3b8', textTransform: 'capitalize' }}>{lead.status}</td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{lead.agent_name || 'Unassigned'}</td>
                      <td style={tdStyle}>
                        <select value={lead.assigned_to || ''} onChange={e => assignLead(lead.id, e.target.value)}
                          style={{ ...selectStyle, padding: '6px 8px', fontSize: 12, width: 'auto' }}>
                          <option value="">Unassigned</option>
                          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}
        title={editingUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Full Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              style={inputStyle} placeholder="John Doe" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Email *</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              style={inputStyle} placeholder="user@crm.com" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
              Password {editingUser ? '(leave blank to keep current)' : '*'}
            </label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              required={!editingUser} style={inputStyle} placeholder="••••••••" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={selectStyle}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                style={inputStyle} placeholder="+1-555-0000" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12 }}>
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
              style={{ padding: '10px 16px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 500, color: '#94a3b8', background: 'transparent', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" style={{
              padding: '10px 20px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 600,
              color: 'white', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
            }}>
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
