import { useAuth } from '../../context/AuthContext';
import { Bell, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { formatRelativeTime } from '../../utils/constants';

const pageTitles = {
  '/': 'Dashboard',
  '/leads': 'Lead Management',
  '/calling': 'Calling Portal',
  '/follow-ups': 'Follow-ups',
  '/reports': 'Reports & Analytics',
  '/admin': 'Admin Panel',
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(true);

  const pageTitle = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/leads/') ? 'Lead Detail' : 'TeleCRM');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/followups?status=pending');
      const pending = res.data.slice(0, 5).map(fu => ({
        id: fu.id,
        type: 'followup',
        message: `Follow-up with ${fu.lead_name}`,
        time: fu.followup_date,
        remarks: fu.remarks
      }));
      setNotifications(pending);
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('light');
  };

  const btnStyle = {
    padding: 8, borderRadius: 8, background: 'transparent', border: 'none',
    color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s'
  };

  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', flexShrink: 0,
      position: 'relative', zIndex: 30
    }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: 0 }}>{pageTitle}</h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Dark mode toggle */}
        <button onClick={toggleDarkMode} style={btnStyle}
          onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifications(!showNotifications)} style={{ ...btnStyle, position: 'relative' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                width: 16, height: 16, borderRadius: '50%', background: '#ef4444',
                color: 'white', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowNotifications(false)} />
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 8,
                width: 320, borderRadius: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.5)', zIndex: 50,
                background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>Notifications</h3>
                </div>
                <div style={{ maxHeight: 256, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: 16, fontSize: 14, color: '#64748b', textAlign: 'center' }}>No pending follow-ups</p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} style={{
                        padding: 12, borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <p style={{ fontSize: 14, color: 'white', margin: 0 }}>{notif.message}</p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{notif.remarks}</p>
                        <p style={{ fontSize: 12, color: '#818cf8', margin: '4px 0 0' }}>{formatRelativeTime(notif.time)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: 'white',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'white', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 10, color: '#64748b', margin: 0, textTransform: 'uppercase' }}>{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
