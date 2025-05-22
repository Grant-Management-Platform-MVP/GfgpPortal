// File: GranteeSelect.jsx
import React from 'react';

const GranteeSelect = ({ label, grantees, selected, onChange }) => {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <label className="form-label fw-semibold">{label}</label>
        <select
          className="form-select"
          value={selected?.id || ''}
          onChange={(e) => {
            const selectedId = parseInt(e.target.value);
            const selectedGrantee = grantees.find((g) => g.id === selectedId);
            if (selectedGrantee) onChange(selectedGrantee);
          }}
        >
          {grantees.map((g) => (
            <option key={g.id} value={g.id}>
              {g.granteeName || `Grantee #${g.userId}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default GranteeSelect;
