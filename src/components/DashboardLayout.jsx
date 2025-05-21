import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const SidebarLink = ({ to, label, isActive, disabled }) => (
  <li className={`nav-item ${disabled ? 'text-muted' : ''}`}>
    {disabled ? (
      <span className="nav-link disabled" style={{ color: '#ccc' }}>{label}</span>
    ) : (
      <Link
        to={to}
        className={`nav-link ${isActive ? 'active fw-bold bg-secondary text-white' : 'text-white'}`}
      >
        {label}
      </Link>
    )}
  </li>
);

const DashboardLayout = ({ title, children, userRole }) => {
  const location = useLocation();
  const hasSelectedStructure = localStorage.getItem('gfgpStructure');

  const sidebarLinks = getSidebarLinks(userRole, hasSelectedStructure);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav className="bg-dark border-end sidebar p-3" style={{ width: '250px' }}>
        <div className="text-center mb-4">
          <img src={logo} alt="Logo" style={{ height: '70px' }} />
        </div>
        <ul className="nav flex-column">
          {sidebarLinks.map(({ path, label, disabled }) => (
            <SidebarLink
              key={path}
              to={path}
              label={label}
              disabled={disabled}
              isActive={location.pathname.startsWith(path)}
            />
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1" style={{ backgroundColor: '#fff', color: '#000' }}>
        <header className="navbar navbar-expand-lg navbar-dark bg-primary px-4" style={{ height: '60px' }}>
          <div className="ms-auto d-flex align-items-center">
            <Link to={`/${userRole}/profile`} className="text-white me-3">Profile</Link>
            <Link to="/logout" className="text-white">Logout</Link>
          </div>
        </header>

        <main className="p-4">
          <h2>{title}</h2>
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
        { path: '/grantee/select-structure', label: 'Select GFGP Structure' },
        { path: '/grantee/questionnaire', label: 'Start Questionnaire', disabled: !hasSelectedStructure },
        { path: '/grantee/compliance-reports', label: 'Compliance Reports' },
        { path: '/grantee/recommendations', label: 'Recommendations' },
        { path: '/grantee/documents', label: 'Document Uploads' },
      ];
    case 'grantor':
      return [
        { path: '/grantor/grantor-overview', label: 'Metrics Overview' },
        { path: '/grantor/invites', label: 'Assessment Invitations' },
        { path: '/grantor/view-assessments', label: 'Grantee Assessments' },
        { path: '/grantor/audit-logs', label: 'Audit Logs' },
        { path: '/grantor/risk-analysis', label: 'Risk Analysis' },
        { path: '/grantor/high-risk', label: 'High-Risk Areas' },
      ];
    case 'auditor':
      return [
        { path: '/auditor/data', label: 'Assessment Data' },
        { path: '/auditor/upload', label: 'Upload Verification Report' },
        { path: '/auditor/review', label: 'Submit Review Findings' },
      ];
    case 'admin':
      return [
        { path: '/admin/users', label: 'User Management' },
        { path: '/admin/settings', label: 'System Settings' },
        { path: '/admin/questionnaire-creation', label: 'Questionnaire Creation' },
        { path: '/admin/questionnaire-management', label: 'Manage Existing Questionnaires' },
        { path: '/admin/documents', label: 'Version Control' },
        { path: '/admin/reports', label: 'Reports & Exports' },
        { path: '/admin/translations', label: 'Manage Translations' },
      ];
    default:
      return [];
  }
};

export default DashboardLayout;