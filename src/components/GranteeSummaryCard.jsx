import React from 'react';

const GranteeSummaryCard = ({ grantees }) => (
  <div className="row">
    {grantees.map((g, idx) => (
      <div className="col-md-6" key={g.id}>
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Grantee {String.fromCharCode(65 + idx)}</h5>
            <p><strong>Name:</strong> {g.granteeName || `Grantee #${g.userId}`}</p>
            <p><strong>Structure:</strong> {g.structure}</p>
            <p><strong>Status:</strong> {g.status}</p>
            <p><strong>Completeness:</strong> {g.completeness?.toFixed(1) ?? 'N/A'}%</p>
            <p><strong>Compliance:</strong> {g.compliance?.toFixed(1) ?? 'N/A'}%</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);


export default GranteeSummaryCard;