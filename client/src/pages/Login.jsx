import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Headphones, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12,
    fontSize: 14, color: 'white', background: '#1e293b',
    border: '1px solid rgba(148,163,184,0.15)', outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0f172a' }}>
      {/* Left Panel - Branding */}
      <div style={{
        width: '50%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', position: 'relative',
        overflow: 'hidden', padding: 48
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)'
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.3,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%)'
        }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 420 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Headphones size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: 'white', margin: '0 0 16px' }}>TeleCRM Pro</h1>
          <p style={{ fontSize: 18, color: '#c7d2fe', margin: '0 0 40px', lineHeight: 1.6 }}>
            Supercharge your telecalling operations with intelligent lead management and real-time analytics.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { value: '10K+', label: 'Leads Managed' },
              { value: '95%', label: 'Uptime' },
              { value: '3x', label: 'Faster Conversion' }
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.05)',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: '#a5b4fc', margin: '4px 0 0' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: 48
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 32px' }}>Sign in to your account to continue</p>

          {error && (
            <div style={{
              marginBottom: 24, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 500,
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@crm.com" required
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(148,163,184,0.15)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(148,163,184,0.15)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                    display: 'flex', alignItems: 'center'
                  }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s'
              }}>
              {loading ? (
                <div style={{
                  width: 20, height: 20, border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: 32, padding: 16, borderRadius: 16,
            background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)'
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', margin: '0 0 8px' }}>Demo Credentials</p>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
              <p style={{ margin: 0 }}><span style={{ color: '#cbd5e1' }}>Admin:</span> admin@crm.com / admin123</p>
              <p style={{ margin: 0 }}><span style={{ color: '#cbd5e1' }}>Agent:</span> sarah@crm.com / agent123</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
