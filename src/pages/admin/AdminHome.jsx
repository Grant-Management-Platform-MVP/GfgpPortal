import React, { useEffect, useState } from 'react';
import { User, FileText, Inbox, Globe, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const AdminHome = () => {
  const [stats, setStats] = useState({
    users: 0,
    questionnaires: 0,
    submissions: 0,
    languages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#20c997'];
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}gfgp/admin/dashboard-stats`);
        if (!res.ok) throw new Error('Failed to load dashboard stats.');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [BASE_URL]);

  const safeCount = (value) => (typeof value === 'number' ? value : 0);

  const widgets = [
    { title: 'Total Users', count: safeCount(stats.users), icon: <User size={28} className="text-primary" /> },
    { title: 'Questionnaires', count: safeCount(stats.questionnaires), icon: <FileText size={28} className="text-success" /> },
    { title: 'Assessment Submissions', count: safeCount(stats.submissions), icon: <Inbox size={28} className="text-warning" /> },
    { title: 'Languages Supported', count: safeCount(stats.languages), icon: <Globe size={28} className="text-info" /> },
  ];

  const barData = [
    { name: 'Users', value: safeCount(stats.users) },
    { name: 'Questionnaires', value: safeCount(stats.questionnaires) },
    { name: 'Submissions', value: safeCount(stats.submissions) },
  ];

  const pieData = [
    { name: 'Submitted', value: safeCount(stats.submissions) },
    // Future enhancement: add 'Pending', 'In Progress', etc.
  ];

  if (loading) {
    return <div className="text-center my-5">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-5">Error: {error}</div>;
  }

  return (
    <div className="container mt-4">
      {/* Summary Cards */}
      <div className="row">
        {widgets.map((widget, index) => (
          <div className="col-sm-6 col-lg-3 mb-4" key={index}>
            <div className="card shadow-sm border-0 h-100" style={{ minHeight: '120px' }}>
              <div className="card-body d-flex align-items-center gap-3">
                <div>{widget.icon}</div>
                <div>
                  <p className="mb-1 text-muted small">{widget.title}</p>
                  <h4 className="mb-0 fw-bold">{widget.count}</h4>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row">
        {/* Bar Chart */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-semibold d-flex align-items-center gap-2">
              <BarChart2 /> Activity Breakdown
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" label={{ value: 'Metric', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="value">
                    {barData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-semibold d-flex align-items-center gap-2">
              <BarChart2 /> Total Submissions Overview
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Extra Stats */}
      <div className="accordion mb-5" id="extraStatsAccordion">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingExtra">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseExtra"
              aria-expanded="false"
              aria-controls="collapseExtra"
            >
              More Admin Insights
            </button>
          </h2>
          <div
            id="collapseExtra"
            className="accordion-collapse collapse"
            aria-labelledby="headingExtra"
            data-bs-parent="#extraStatsAccordion"
          >
            <div className="accordion-body">
              <ul className="list-group">
                <li className="list-group-item">
                  New Signups This Month: <strong>{safeCount(stats.submissions)}</strong>
                </li>
                {/* Future: Add more breakdowns like active users, feedback, failed submissions, etc. */}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;