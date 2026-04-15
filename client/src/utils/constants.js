export const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { value: 'interested', label: 'Interested', color: '#f59e0b' },
  { value: 'qualified', label: 'Qualified', color: '#06b6d4' },
  { value: 'converted', label: 'Converted', color: '#10b981' },
  { value: 'lost', label: 'Lost', color: '#ef4444' },
];

export const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' },
];

export const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#10b981' },
];

export const CALL_STATUS_OPTIONS = [
  { value: 'answered', label: 'Answered', color: '#10b981' },
  { value: 'no_answer', label: 'No Answer', color: '#f59e0b' },
  { value: 'busy', label: 'Busy', color: '#ef4444' },
  { value: 'voicemail', label: 'Voicemail', color: '#8b5cf6' },
  { value: 'failed', label: 'Failed', color: '#6b7280' },
];

export const FOLLOWUP_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'missed', label: 'Missed', color: '#ef4444' },
];

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function getStatusColor(status) {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  return opt?.color || '#6b7280';
}

export function getPriorityColor(priority) {
  const opt = PRIORITY_OPTIONS.find(p => p.value === priority);
  return opt?.color || '#6b7280';
}

export function getCallStatusColor(status) {
  const opt = CALL_STATUS_OPTIONS.find(s => s.value === status);
  return opt?.color || '#6b7280';
}
