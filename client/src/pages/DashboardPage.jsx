import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import Spinner from '../components/ui/Spinner.jsx';

function SummaryCard({ label, value, type, onClick }) {
  return (
    <div className={`summary-card ${type}`} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="summary-card__label">{label}</div>
      <div className="summary-card__value">{value ?? '—'}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((r) => setSummary(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="summary-grid">
        <SummaryCard
          label="Total Active People"
          value={summary?.total_people}
          type="total"
          onClick={() => navigate('/people')}
        />
        <SummaryCard
          label="Expired Documents"
          value={summary?.expired}
          type="expired"
          onClick={() => navigate('/people?filter=expired')}
        />
        <SummaryCard
          label={`Expiring Within ${summary?.expiring_soon_days ?? 30} Days`}
          value={summary?.expiring_soon}
          type="expiring"
          onClick={() => navigate('/people?filter=expiring_soon')}
        />
        <SummaryCard
          label="Missing Documents"
          value={summary?.missing}
          type="missing"
          onClick={() => navigate('/people?filter=missing')}
        />
      </div>

      <div className="card">
        <div className="card-body">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: '0.75rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/clients')}>View Clients</button>
            <button className="btn btn-secondary" onClick={() => navigate('/employees')}>View Employees</button>
            <button className="btn btn-secondary" onClick={() => navigate('/contractors')}>View Contractors</button>
          </div>
        </div>
      </div>
    </div>
  );
}
