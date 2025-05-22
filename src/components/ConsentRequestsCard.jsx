import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, Spinner, Alert } from 'react-bootstrap';
import { BiInfoCircle } from 'react-icons/bi';

const ConsentRequestsCard = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments`)
      .then((res) => {
        const pending = res.data.filter(r => r.consentStatus === "PENDING");
        setRequests(pending);
      })
      .catch(() => setError("Failed to fetch consent requests."))
      .finally(() => setLoading(false));
  }, []);

  const updateConsent = (id, status) => {
    axios.put(`${BASE_URL}gfgp/consent-requests/${id}`, { status })
      .then(() => setRequests(prev => prev.filter(r => r.id !== id)))
      .catch(() => alert("Failed to update consent."));
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p className="mt-2">Loading consent requests...</p>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <h5 className="mb-4">Pending Consent Requests for your Compliance Report</h5>

        {requests.length === 0 ? (
          <div className="text-center text-muted py-4">
            <BiInfoCircle size={40} className="mb-2" />
            <p>No pending consent requests at the moment.</p>
          </div>
        ) : (
          requests.map(req => (
            <div
              key={req.id}
              className="d-flex justify-content-between align-items-center border rounded p-3 mb-3"
            >
              <div>
                <strong>Structure:</strong> {req.structure} <br />
                <small className="text-muted">
                  Requested on: {new Date(req.consentUpdatedAt || req.createdAt).toLocaleString()}
                </small>
              </div>
              <div className="d-flex gap-2">
                <Button size="sm" variant="success" onClick={() => updateConsent(req.id, "GRANTED")}>
                  Accept
                </Button>
                <Button size="sm" variant="danger" onClick={() => updateConsent(req.id, "DENIED")}>
                  Deny
                </Button>
              </div>
            </div>
          ))
        )}
      </Card.Body>
    </Card>
  );
};

export default ConsentRequestsCard;