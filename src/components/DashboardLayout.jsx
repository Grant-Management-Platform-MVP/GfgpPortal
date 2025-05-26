import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';

const SidebarLink = ({ to, label, icon, isActive, disabled, collapsed }) => (
  <li className="nav-item">
    {disabled ? (
      <span className="nav-link disabled text-muted">
        <i className={`bi ${icon} me-2`}></i> {!collapsed && label}
      </span>
    ) : (
      <Link
        to={to}
        className={`nav-link d-flex align-items-center sidebar-link ${isActive ? 'active' : ''}`}
      >
        <i className={`bi ${icon} me-2`}></i> {!collapsed && label}
      </Link>
    )}
  </li>
);

const DashboardLayout = ({ title, children, userRole }) => {
  const location = useLocation();
  const hasSelectedStructure = localStorage.getItem('gfgpStructure');
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const sidebarLinks = getSidebarLinks(userRole, hasSelectedStructure);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('gfgpStructure');
      window.location.href = '/';
    }
  };

  return (
    <div className={`d-flex ${darkMode ? 'bg-dark text-white' : 'bg-white text-dark'}`} style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className={`d-flex flex-column p-3 sidebar border-end ${collapsed ? 'collapsed-sidebar' : ''}`} style={{ width: collapsed ? '70px' : '250px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          {!collapsed && <img src={logo} alt="Logo" style={{ height: '50px' }} />}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setCollapsed(!collapsed)}
          >
            <i className={`bi ${collapsed ? 'bi-arrow-bar-right' : 'bi-arrow-bar-left'}`}></i>
          </button>
        </div>

        <ul className="nav nav-pills flex-column mb-auto">
          {sidebarLinks.map(({ path, label, icon, disabled }) => (
            <SidebarLink
              key={path}
              to={path}
              label={label}
              icon={icon}
              disabled={disabled}
              isActive={location.pathname.startsWith(path)}
              collapsed={collapsed}
            />
          ))}
        </ul>

        {!collapsed && (
          <div className="mt-auto text-center">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setDarkMode(!darkMode)}
            >
              <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon'}`}></i> {darkMode ? ' Light Mode' : ' Dark Mode'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        <header className={`navbar navbar-expand-lg ${darkMode ? 'bg-dark text-white' : 'bg-primary text-white'} px-4`} style={{ height: '60px' }}>
          <div className="ms-auto d-flex align-items-center">
            <Link to={`/${userRole}/profile`} className="text-white me-3"><i className="bi bi-person-circle me-1"></i> Profile</Link>
            <button onClick={handleLogout} className="btn btn-link text-white text-decoration-none">
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </header>

        <main className="p-4">
          <h4>{title}</h4>
          <hr />
          {children}
        </main>
      </div>
    </div>
  );
};

const getSidebarLinks = (role, hasSelectedStructure) => {
  switch (role) {
    case 'grantee':
      return [
        { path: '/grantee/select-structure', label: 'Select GFGP Structure', icon: 'bi-diagram-3' },
        { path: '/grantee/questionnaire', label: 'Start Questionnaire', icon: 'bi-ui-checks', disabled: !hasSelectedStructure },
        { path: '/grantee/compliance-reports', label: 'Compliance Reports', icon: 'bi-bar-chart-line' },
        { path: '/grantee/documents', label: 'Document Repository', icon: 'bi-folder2-open' },
      ];
    case 'grantor':
      return [
        { path: '/grantor/grantor-overview', label: 'Metrics Overview', icon: 'bi-speedometer2' },
        { path: '/grantor/invites', label: 'Assessment Invitations', icon: 'bi-envelope-paper' },
        { path: '/grantor/view-assessments', label: 'Grantee Assessments', icon: 'bi-people' },
        { path: '/grantor/shared-reports', label: 'Grantee Reports', icon: 'bi-file-earmark-bar-graph' },
        { path: '/grantor/audit-logs', label: 'Audit Logs', icon: 'bi-journal-text' },
        { path: '/grantor/risk-analysis', label: 'Risk Analysis', icon: 'bi-shield-exclamation' },
        { path: '/grantor/high-risk', label: 'High-Risk Areas', icon: 'bi-exclamation-diamond' },
      ];
    case 'auditor':
      return [
        { path: '/auditor/data', label: 'Assessment Data', icon: 'bi-table' },
        { path: '/auditor/upload', label: 'Upload Report', icon: 'bi-upload' },
        { path: '/auditor/review', label: 'Review Findings', icon: 'bi-pencil-square' },
      ];
    case 'admin':
      return [
        { path: '/admin/users', label: 'User Management', icon: 'bi-people' },
        { path: '/admin/settings', label: 'System Settings', icon: 'bi-gear' },
        { path: '/admin/questionnaire-creation', label: 'Create Questionnaire', icon: 'bi-plus-square' },
        { path: '/admin/questionnaire-management', label: 'Manage Questionnaires', icon: 'bi-layout-text-window' },
        { path: '/admin/reports', label: 'Reports & Exports', icon: 'bi-bar-chart' },
         { path: '/admin/recommendations', label: 'Recommendations Management', icon: 'bi-book' },
        { path: '/admin/translations', label: 'Translations', icon: 'bi-translate' },
      ];
    default:
      return [];
  }
};

export default DashboardLayout;
