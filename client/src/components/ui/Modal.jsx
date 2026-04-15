import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeWidths = { sm: 448, md: 512, lg: 672, xl: 896 };
  const maxW = sizeWidths[size] || 512;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
      }} onClick={onClose} />
      <div className="animate-fade-in" style={{
        position: 'relative', width: '100%', maxWidth: maxW,
        borderRadius: 20, boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: '#1e293b', border: '1px solid rgba(148,163,184,0.1)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            padding: 6, borderRadius: 8, background: 'transparent', border: 'none',
            color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
