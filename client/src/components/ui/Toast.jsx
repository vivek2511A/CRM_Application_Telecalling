export default function Toast({ message, type = 'success', onClose }) {
  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#3b82f6' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#f59e0b' },
  };

  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div onClick={onClose} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 14, minWidth: 280,
        cursor: 'pointer',
        background: c.bg, border: `1px solid ${c.border}30`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: c.border, flexShrink: 0
        }} />
        <p style={{ fontSize: 14, fontWeight: 500, color: c.text, margin: 0 }}>{message}</p>
      </div>
    </div>
  );
}
