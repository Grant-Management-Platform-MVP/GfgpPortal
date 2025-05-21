import React from 'react';
import { Link } from 'react-router-dom';

const GranteeListView = () => {
  return (
    <div>
      <h3>Grantee Organizations</h3>
      <p>List of organizations with filtering/sorting controls (location, sector, risk level, etc.)</p>
      <ul>
        <li><Link to="/grantor/grantee/1/view">Grantee Org A</Link></li>
        <li><Link to="/grantor/grantee/2/view">Grantee Org B</Link></li>
      </ul>
    </div>
  );
};

export default GranteeListView;