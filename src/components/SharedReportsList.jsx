import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Badge, Row, Col, InputGroup, FormControl } from 'react-bootstrap';
import { BiUser, BiShareAlt } from 'react-icons/bi';

const SharedReportsList = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchSharedReports = async () => {
      try {
        const res = await axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments`);
        const shared = res.data
          .filter(a => a.consentStatus === 'GRANTED')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReports(shared);
      } catch (err) {
        console.error('Failed to load shared reports', err);
      }
    };

    fetchSharedReports();
  }, []);

  const filteredReports = reports.filter(r =>
    (r.granteeName || `Grantee #${r.userId}`)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h5 className="mb-4"><BiShareAlt className="me-2" />Shared Grantee Reports</h5>

      <InputGroup className="mb-4">
        <FormControl
          placeholder="Search by grantee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      {filteredReports.length === 0 ? (
        <p className="text-muted">No shared reports available.</p>
      ) : (
        <Row xs={1} sm={2} md={3} className="g-4">
          {filteredReports.map((r) => (
            <Col key={r.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center">
                    <BiUser className="me-2" />
                    {r.granteeName || `Grantee #${r.userId}`}
                  </Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Shared on: {new Date(r.createdAt).toLocaleDateString()}
                  </Card.Subtitle>
                  <Badge bg="info" className="me-2">
                    Structure: {r.structure}
                  </Badge>
                </Card.Body>
                <Card.Footer className="bg-transparent border-top-0 d-flex justify-content-end">
                  <Link
                    to={`/grantor/view-report/${r.userId}/${r.structure}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    View Report
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default SharedReportsList;
