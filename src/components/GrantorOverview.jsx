import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Form, Row, Col, Container } from 'react-bootstrap';
import { BarChart2, Users, AlertTriangle, TrendingUp } from 'react-feather';

const predefinedOrgTypes = [
  "Charitable/Foundation",
  "Charitable/other",
  "Community Based",
  "Community Societal",
  "Foundation",
  "Government",
  "Independent",
  "International NGO",
  "National NGO",
  "Non Government",
  "Not for profit",
  "Other Public Sector",
  "Parastatal",
  "Private Sector",
  "Public Sector",
  "Private Partnership",
  "Regional NGO",
  "State owned enterprises",
  "Training Trust",
  "University, Academic and Research",
  "Other"
];

const GrantorOverview = () => {
  const [metrics, setMetrics] = useState({});
  const [grantees, setGrantees] = useState([]);
  const [filters, setFilters] = useState({ location: '', sector: '', risk: '' });
  // const [orgTypes, setOrgTypes] = useState([]);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    fetchMetrics();
    fetchGrantees();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(BASE_URL + 'gfgp/grantor/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Metrics fetch failed:', err);
    }
  };

  const fetchGrantees = async () => {
    try {
      const res = await fetch(BASE_URL + 'gfgp/grantees');
      if (!res.ok) throw new Error('Failed to fetch grantees');
      const data = await res.json();
      setGrantees(data);
      // const uniqueOrgTypes = [...new Set(data.map(g => g.orgType))];
      // setOrgTypes(uniqueOrgTypes);
    } catch (err) {
      console.error('Grantee fetch failed:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredGrantees = grantees.filter(g =>
    (!filters.location || g.location === filters.location) &&
    (!filters.sector || g.orgType === filters.sector) &&
    (!filters.risk || g.selectedStructure === filters.risk)
  );

  const MetricCard = ({ title, value, icon: Icon, color }) => (
    <Col md={3} sm={6}>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="d-flex align-items-center">
          <div className={`bg-${color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`} style={{ width: 48, height: 48 }}>
            <Icon size={20} />
          </div>
          <div>
            <h6 className="mb-0 text-muted">{title}</h6>
            <h4 className="mb-0 fw-bold">{value ?? '—'}</h4>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container>
      <h4 className="mb-4">Metrics Overview</h4>

      <Row>
        <MetricCard title="Total Assessments" value={metrics.totalAssessments} icon={BarChart2} color="primary" />
        <MetricCard title="Pending Invitations" value={metrics.pendingInvites} icon={Users} color="info" />
        <MetricCard title="High Risk Grantees" value={metrics.highRiskCount} icon={AlertTriangle} color="danger" />
        <MetricCard title="Avg. Risk Score" value={metrics.avgRiskScore} icon={TrendingUp} color="warning" />
      </Row>

      <Card className="p-3 mb-4 shadow-sm border-0">
        <h5 className="mb-3">Filter Grantees</h5>
        <Form>
          <Row className="g-3">
            <Col md={4}>
            <Form.Group controlId="filterSector">
              <Form.Label>Sector</Form.Label>
              <Form.Select name="sector" value={filters.sector} onChange={handleFilterChange}>
                <option value="">All Sectors</option>
                {predefinedOrgTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="filterLocation">
                <Form.Label>Location</Form.Label>
                <Form.Select name="location" value={filters.location} onChange={handleFilterChange}>
                  <option value="">All Locations</option>
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="filterRisk">
                <Form.Label>Risk Level</Form.Label>
                <Form.Select name="risk" value={filters.risk} onChange={handleFilterChange}>
                  <option value="">All Risk Levels</option>
                  <option value="foundation">foundation</option>
                  <option value="advanced">advanced</option>
                  <option value="tiered">tiered</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <h5 className="mb-3">Grantees</h5>
          <Table striped bordered hover responsive>
            <thead className="table-light">
              <tr>
                <th>Organization</th>
                <th>Sector</th>
                <th>GFGP Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrantees.length > 0 ? (
                filteredGrantees.map((g, idx) => (
                  <tr key={idx}>
                    <td>{g.name}</td>
                    <td>{g.orgType}</td>
                    <td>{g.selectedStructure}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No grantees match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default GrantorOverview;