import React from 'react';

const STATUS_CONFIG = {
  current:       { label: 'Current',       cls: 'badge-current',  dot: '●' },
  expiring_soon: { label: 'Expiring Soon', cls: 'badge-expiring', dot: '●' },
  expired:       { label: 'Expired',       cls: 'badge-expired',  dot: '●' },
  missing:       { label: 'Missing',       cls: 'badge-missing',  dot: '○' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.missing;
  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.dot} {cfg.label}
    </span>
  );
}
