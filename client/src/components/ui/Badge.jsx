export function Badge({ children, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
      color: color, background: `${color}15`, border: `1px solid ${color}30`,
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const colors = {
    new: '#3b82f6', contacted: '#8b5cf6', interested: '#f59e0b',
    qualified: '#06b6d4', converted: '#10b981', lost: '#ef4444',
    pending: '#f59e0b', completed: '#10b981', missed: '#ef4444',
    answered: '#10b981', no_answer: '#f59e0b', busy: '#ef4444',
    voicemail: '#8b5cf6', failed: '#6b7280',
  };
  const label = status?.replace(/_/g, ' ') || 'unknown';
  return <Badge color={colors[status] || '#6b7280'}>{label}</Badge>;
}

export function PriorityBadge({ priority }) {
  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  return <Badge color={colors[priority] || '#6b7280'}>{priority}</Badge>;
}
