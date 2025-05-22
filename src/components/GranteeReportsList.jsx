import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Badge, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const GranteeReportsList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments`)
      .then((res) => setData(res.data))
      .catch(() => alert("Failed to fetch assessments."))
      .finally(() => setLoading(false));
  }, []);

  const requestConsent = (id) => {
    axios.post(`${BASE_URL}gfgp/consent-requests/${id}`)
      .then(() => alert("Consent request sent."))
      .catch(() => alert("Failed to send request."));
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="mt-4">
      <h5>Grantee Reports (Requires Consent)</h5>
      <Table bordered hover>
        <thead className="table-light">
          <tr>
            <th>Grantee</th>
            <th>Structure</th>
            <th>Consent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id}>
              <td>{r.granteeName || `Grantee #${r.userId}`}</td>
              <td>{r.structure}</td>
              <td>
                <Badge bg={
                  r.consentStatus === "GRANTED" ? "success" :
                  r.consentStatus === "DENIED" ? "danger" : "warning"
                }>
                  {r.consentStatus}
                </Badge>
              </td>
              <td>
                {r.consentStatus === "GRANTED" ? (
                  <Button size="sm" onClick={() => navigate(`/grantor/view-report/${r.id}`)}>
                    View Report
                  </Button>
                ) : (
                  <Button size="sm" variant="outline-primary" onClick={() => requestConsent(r.id)}>
                    Request Access
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default GranteeReportsList;
