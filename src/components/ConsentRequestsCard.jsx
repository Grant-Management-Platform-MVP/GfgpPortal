import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, Spinner, Alert } from 'react-bootstrap';
import { BiInfoCircle, BiUser } from 'react-icons/bi';

const ConsentRequestsCard = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments`)
      .then((res) => {
        const pending = res.data.filter(r => r.consentStatus === "PENDING")
          .map(r => ({ ...r, actionLoading: false }));
        setRequests(pending);
      })
      .catch(() => setError("Failed to fetch consent requests."))
      .finally(() => setLoading(false));
  }, []);

  const updateConsent = async (id, status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, actionLoading: true } : r));
    try {
      await axios.put(`${BASE_URL}gfgp/consent-requests/${id}`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to update consent.", err  );
      setRequests(prev => prev.map(r => r.id === id ? { ...r, actionLoading: false } : r));
    }
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
        <h5 className="mb-4">Pending Requests for your Compliance Report</h5>

        {requests.length === 0 ? (
          <div className="text-center text-muted py-4">
            <BiInfoCircle size={40} className="mb-2" />
            <p>No pending requests from funders for at the moment.</p>
          </div>
        ) : (
          requests.map(req => (
            <div
              key={req.id}
              className="d-flex justify-content-between align-items-start border rounded p-3 mb-3 flex-column flex-md-row"
              style={{ transition: 'opacity 0.5s ease-in-out' }}
            >
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  <BiUser className="me-2" />
                  <strong>Requested by Grantor: </strong> {req.requestedBy || `Grantor #${req.grantorId}`}
                </div>
                <div><strong>Structure:</strong> {req.structure}</div>
                <div className="text-muted small">
                  Requested on: {new Date(req.consentUpdatedAt || req.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-3 mt-md-0 ms-md-3 d-flex gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => updateConsent(req.id, "GRANTED")}
                  disabled={req.actionLoading}
                >
                  {req.actionLoading ? <Spinner animation="border" size="sm" /> : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => updateConsent(req.id, "DENIED")}
                  disabled={req.actionLoading}
                >
                  {req.actionLoading ? <Spinner animation="border" size="sm" /> : 'Deny'}
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