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
  const [showLogoutModal, setShowLogoutModal] = useState(false);


  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const sidebarLinks = getSidebarLinks(userRole, hasSelectedStructure);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('gfgpStructure');
    window.location.href = '/';
  };


  return (
    <div className={`d-flex min-vh-100 ${darkMode ? 'dark-mode-bg' : 'light-mode-bg'}`}>
      {/* Sidebar */}
      <nav className={`sidebar d-flex flex-column p-3 shadow-sm ${collapsed ? 'collapsed-sidebar' : ''} ${darkMode ? 'dark-sidebar' : 'light-sidebar'}`}>
        <div className="sidebar-header d-flex align-items-center mb-4">
          <img src={logo} alt="Logo" className={`img-fluid ${collapsed ? 'd-none' : ''}`} style={{ maxHeight: '40px' }} />
          {!collapsed && <span className="ms-2 app-name">GFGP</span>}
        </div>

        <ul className="nav nav-pills flex-column sidebar-nav-links">
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
          <div className="mt-auto">
            <button
              className="btn btn-dark btn-slg w-100 mt-3"
              onClick={() => setDarkMode(!darkMode)}
            >
              <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon'}`}></i> {darkMode ? ' Light Mode' : ' Dark Mode'}
            </button>
          </div>
        )}
      </nav>
      {/* Content */}
      <div className="flex-grow-1 d-flex flex-column">
        <header className={`navbar navbar-expand-lg shadow-sm ${darkMode ? 'dark-navbar' : 'light-navbar'} border-bottom px-4 dashboard-header`}>
          <div className="container-fluid d-flex justify-content-between align-items-center w-100">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-link me-3 p-0"
                onClick={() => setCollapsed(!collapsed)}
              >
                <i className={`bi ${collapsed ? 'bi-list' : 'bi-justify'} header-collapse-icon`}></i>
              </button>
              {/* This title is static based on the screenshot, but you can pass 'title' prop here if dynamic */}
              <h5 className="mb-0 header-title">{title}</h5>
            </div>

            <div className="d-flex align-items-center header-right-section">
              {/* Search bar, notifications, and profile as seen in screenshot */}
              <div className="header-icons me-3">
                <i className="bi bi-bell-fill me-3"></i> {/* Notification icon */}
              </div>

              <div className="header-profile-dropdown d-flex align-items-center">
                <div className="container-fluid d-flex justify-content-end">
                  <Link to={`/${userRole}/profile`} className="btn btn-success btn-lg me-2">
                    <i className="bi bi-person-circle"></i> {!collapsed && 'Profile'}
                  </Link>
                  <button className="btn btn-danger btn-lg" onClick={() => setShowLogoutModal(true)}>
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 flex-grow-1 dashboard-content">
          {children}
        </main>
      </div>
      {showLogoutModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogoutModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to log out?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleLogout}>
                  Yes, Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getSidebarLinks = (role, hasSelectedStructure) => {
  switch (role) {
    case 'grantee':
      return [
        { path: '/grantee/', label: 'Home', icon: 'bi-house' },
        { path: '/grantee/select-structure', label: 'Select GFGP Structure', icon: 'bi-diagram-3' },
        { path: '/grantee/assessments', label: 'GFGP Assessments', icon: 'bi-ui-checks', disabled: !hasSelectedStructure },
        { path: '/grantee/compliance-reports', label: 'Compliance Reports', icon: 'bi-bar-chart-line' },
        { path: '/grantee/documents', label: 'Document Repository', icon: 'bi-folder2-open' },
      ];
    case 'grantor':
      return [
        { path: '/grantor/', label: 'Home', icon: 'bi-house' },
        { path: '/grantor/grantor-overview', label: 'Metrics Overview', icon: 'bi-speedometer2' },
        { path: '/grantor/invites', label: 'Assessment Invitations', icon: 'bi-envelope-paper' },
        { path: '/grantor/view-assessments', label: 'Assessments Comparison', icon: 'bi-people' },
        { path: '/grantor/shared-reports', label: 'Grantee Reports', icon: 'bi-file-earmark-bar-graph' },
        { path: '/grantor/audit-logs', label: 'Audit Logs', icon: 'bi-journal-text' },
         { path: '/grantor/grantee-reports', label: 'Reports', icon: 'bi-bar-chart' }
      ];
    case 'auditor':
      return [
        { path: '/auditor/data', label: 'Assessment Data', icon: 'bi-table' },
        { path: '/auditor/upload', label: 'Upload Report', icon: 'bi-upload' },
        { path: '/auditor/review', label: 'Review Findings', icon: 'bi-pencil-square' },
      ];
    case 'admin':
      return [
        { path: '/admin/', label: 'Home', icon: 'bi-house' },
        { path: '/admin/users', label: 'User Management', icon: 'bi-people' },
        { path: '/admin/questionnaire-creation', label: 'Create Questionnaire', icon: 'bi-plus-square' },
        { path: '/admin/questionnaire-management', label: 'Manage Questionnaires', icon: 'bi-layout-text-window' },
        { path: '/admin/reports', label: 'Reports & Exports', icon: 'bi-bar-chart' },
      ];
    default:
      return [];
  }
};

export default DashboardLayout;