import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { STATUS_OPTIONS, SOURCE_OPTIONS, PRIORITY_OPTIONS, formatDate } from '../utils/constants';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import {
  Search, Plus, Phone, ChevronLeft, ChevronRight,
  Eye, Edit2, Trash2, X
} from 'lucide-react';

const cardStyle = {
  background: 'rgba(30,41,59,0.7)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 16
};

const inputStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  color: 'white',
  outline: 'none',
  width: '100%'
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto'
};

const btnIcon = {
  padding: 6,
  borderRadius: 8,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

export default function Leads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [agents, setAgents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'website', status: 'new',
    assigned_to: '', company: '', priority: 'medium'
  });

  useEffect(() => { loadLeads(); }, [search, statusFilter, sourceFilter, agentFilter, page]);
  useEffect(() => { if (user?.role === 'admin') loadAgents(); }, []);

  const loadAgents = async () => {
    try { const res = await api.get('/users/agents'); setAgents(res.data); } catch (err) { console.error(err); }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (agentFilter) params.set('assigned_to', agentFilter);
      params.set('page', page);
      params.set('limit', 15);
      const res = await api.get(`/leads?${params}`);
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } catch (err) { console.error('Failed to load leads:', err); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, form);
        showToast('Lead updated successfully', 'success');
      } else {
        await api.post('/leads', form);
        showToast('Lead created successfully', 'success');
      }
      setShowModal(false);
      resetForm();
      loadLeads();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save lead', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      showToast('Lead deleted', 'success');
      loadLeads();
    } catch (err) { showToast('Failed to delete lead', 'error'); }
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name, phone: lead.phone, email: lead.email || '',
      source: lead.source, status: lead.status, assigned_to: lead.assigned_to || '',
      company: lead.company || '', priority: lead.priority
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingLead(null);
    setForm({ name: '', phone: '', email: '', source: 'website', status: 'new', assigned_to: '', company: '', priority: 'medium' });
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Lead Management</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{pagination.total || 0} total leads</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
            border: 'none', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
          }}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search leads..." style={{ ...inputStyle, paddingLeft: 40 }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ ...selectStyle, width: 'auto' }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          style={{ ...selectStyle, width: 'auto' }}>
          <option value="">All Sources</option>
          {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {user?.role === 'admin' && (
          <select value={agentFilter} onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
            style={{ ...selectStyle, width: 'auto' }}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        {(statusFilter || sourceFilter || agentFilter) && (
          <button onClick={() => { setStatusFilter(''); setSourceFilter(''); setAgentFilter(''); setPage(1); }}
            style={{ ...btnIcon, color: '#94a3b8', fontSize: 13, gap: 4 }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Name', 'Phone', 'Company', 'Source', 'Status', 'Priority', 'Agent', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 11,
                    fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ padding: '64px 16px', textAlign: 'center' }}>
                  <div style={{
                    width: 24, height: 24, border: '2px solid rgba(99,102,241,0.2)',
                    borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }} />
                </td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '64px 16px', textAlign: 'center', fontSize: 14, color: '#64748b' }}>
                  No leads found
                </td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => navigate(`/leads/${lead.id}`)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 14, fontWeight: 500, color: 'white', textAlign: 'left', padding: 0
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#818cf8'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'white'}>
                        {lead.name}
                      </button>
                      {lead.email && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{lead.email}</p>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#cbd5e1' }}>{lead.phone}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#94a3b8' }}>{lead.company || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#94a3b8', textTransform: 'capitalize' }}>
                      {lead.source?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={lead.status} /></td>
                    <td style={{ padding: '12px 16px' }}><PriorityBadge priority={lead.priority} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#94a3b8' }}>{lead.agent_name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>{formatDate(lead.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => navigate(`/leads/${lead.id}`)} style={{ ...btnIcon, color: '#94a3b8' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#818cf8'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'} title="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => navigate(`/leads/${lead.id}`)} style={{ ...btnIcon, color: '#94a3b8' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'} title="Call">
                          <Phone size={15} />
                        </button>
                        <button onClick={() => openEdit(lead)} style={{ ...btnIcon, color: '#94a3b8' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#f59e0b'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'} title="Edit">
                          <Edit2 size={15} />
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDelete(lead.id)} style={{ ...btnIcon, color: '#94a3b8' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'} title="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                style={{ ...btnIcon, color: '#94a3b8', opacity: page <= 1 ? 0.3 : 1 }}>
                <ChevronLeft size={16} />
              </button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                style={{ ...btnIcon, color: '#94a3b8', opacity: page >= pagination.totalPages ? 0.3 : 1 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}
        title={editingLead ? 'Edit Lead' : 'Add New Lead'}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                style={inputStyle} placeholder="Full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Phone *</label>
              <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                style={inputStyle} placeholder="+1-555-0000" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                style={inputStyle} placeholder="email@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Company</label>
              <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                style={inputStyle} placeholder="Company name" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Source</label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} style={selectStyle}>
                {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={selectStyle}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={selectStyle}>
                {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          {user?.role === 'admin' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Assign to Agent</label>
              <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} style={selectStyle}>
                <option value="">Unassigned</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12 }}>
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
              style={{
                padding: '10px 16px', borderRadius: 12, border: 'none', fontSize: 14,
                fontWeight: 500, color: '#94a3b8', background: 'transparent', cursor: 'pointer'
              }}>
              Cancel
            </button>
            <button type="submit"
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none', fontSize: 14,
                fontWeight: 600, color: 'white', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
              }}>
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
