import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Phone, CalendarClock, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, Headphones
} from 'lucide-react';
import { useState, createContext, useContext } from 'react';

// Shared context for sidebar state
export const SidebarContext = createContext({ collapsed: false });

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const sidebarWidth = collapsed ? 72 : 250;

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/calling', icon: Phone, label: 'Calling' },
    { to: '/follow-ups', icon: CalendarClock, label: 'Follow-ups' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', icon: Settings, label: 'Admin Panel' });
  }

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: sidebarWidth,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f172a 0%, #1a1f3a 100%)',
        borderRight: '1px solid rgba(148, 163, 184, 0.08)',
        transition: 'width 0.3s ease-in-out',
        overflow: 'hidden'
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', height: 64, padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
          }}>
            <Headphones size={20} color="white" />
          </div>
          {!collapsed && (
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', margin: 0 }}>TeleCRM</h1>
              <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Pro Suite</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500,
                textDecoration: 'none', position: 'relative',
                color: isActive ? 'white' : '#94a3b8',
                background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, borderRadius: '0 4px 4px 0', background: '#6366f1'
                }} />
              )}
              <item.icon size={20} style={{ flexShrink: 0, color: isActive ? '#818cf8' : 'inherit' }} />
              {!collapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12,
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontSize: 14, fontWeight: 600, color: 'white',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              style={{
                padding: 6, borderRadius: 8, background: 'transparent', border: 'none',
                color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute', right: -12, top: 80,
          width: 24, height: 24, borderRadius: '50%',
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', cursor: 'pointer', zIndex: 50,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = '#334155'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = '#1e293b'; }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
