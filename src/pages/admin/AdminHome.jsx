import React, { useEffect, useState } from 'react';
import { User, FileText, Inbox, Globe, BarChart2 } from 'lucide-react';
import {
  LineChart, Line,
  PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const AdminHome = () => {
  const [stats, setStats] = useState({
    users: 0,
    questionnaires: 0,
    submissions: 0,
    languages: 0,
  });

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
  const fetchStats = async () => {
    try {
      const res = await fetch(BASE_URL+'gfgp/admin/dashboard-stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  fetchStats();
}, []);


  const widgets = [
    { title: 'Total Users', count: stats.users, icon: <User size={28} className="text-primary" /> },
    { title: 'Questionnaires', count: stats.questionnaires, icon: <FileText size={28} className="text-success" /> },
    { title: 'Assessment Submissions', count: stats.submissions, icon: <Inbox size={28} className="text-warning" /> },
    { title: 'Languages Supported', count: stats.languages, icon: <Globe size={28} className="text-info" /> },
  ];

  const barData = [
    { name: 'Users', value: stats.users },
    { name: 'Questionnaires', value: stats.questionnaires },
    { name: 'Submissions', value: stats.submissions },
  ];

  const pieData = [
    { name: 'Submitted', value: stats.submissions },
  ];

  const pieColors = ['#4e73df', '#1cc88a', '#e74a3b'];

  return (
    <div className="container mt-4">
      {/* Summary Cards */}
      <div className="row">
        {widgets.map((widget, index) => (
          <div className="col-sm-6 col-lg-3 mb-4" key={index}>
            <div className="card shadow-sm border-0 h-100">
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
        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-semibold d-flex align-items-center gap-2">
              <BarChart2 /> Activity Breakdown
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header fw-semibold d-flex align-items-center gap-2">
              <BarChart2 /> Submission Status
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
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
                <li className="list-group-item">New Signups This Month: <strong>{stats.submissions}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;