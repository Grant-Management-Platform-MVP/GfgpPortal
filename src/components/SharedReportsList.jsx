import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  Badge,
  Row,
  Col,
  InputGroup,
  FormControl,
  Button,
  OverlayTrigger,
  Tooltip,
  Spinner
} from 'react-bootstrap';
import { BiUser, BiShareAlt } from 'react-icons/bi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SharedReportsList = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem('user'));
  const grantorId = user?.userId;

  // ⬇ Shared fetcher now reusable in requestConsent
  const fetchAllReports = async () => {
    try {
      const res = await axios.get(`${BASE_URL}gfgp/grantor/grantee-assessments`);
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(sorted);
    } catch (err) {
      toast.error('Failed to load grantee assessments');
      console.error('Failed to load grantee assessments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReports();
  }, []);

  const requestConsent = async (reportId, orgId) => {
    const updatedReports = [...reports];
    const reportIndex = updatedReports.findIndex(r => r.id === reportId);

    updatedReports[reportIndex].loading = true;
    setReports(updatedReports);

    try {
      await axios.post(`${BASE_URL}gfgp/request-consent/${reportId}/${orgId}`, {
        grantorId: grantorId
      });
      toast.success('Consent request sent!');
      await fetchAllReports(); // 🔁 Refresh full state
    } catch (error) {
      console.error('Consent request failed', error);
      toast.error('Failed to request consent.');

      updatedReports[reportIndex].loading = false;
      setReports(updatedReports);
    }
  };

  const filteredReports = reports.filter(r =>
    (r.granteeName || `Grantee #${r.userId}`)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const renderConsentActions = (report) => {
    if (report.loading) {
      return (
        <Button size="sm" variant="info" disabled>
          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
          Sending request...
        </Button>
      );
    }

    switch (report.consentStatus) {
      case 'GRANTED':
        return (
          <Link
            to={`/grantor/view-report/${report.granteeId}/${report.structure}/${report.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            View Report
          </Link>
        );
      case 'PENDING':
        return (
          <OverlayTrigger overlay={<Tooltip>Waiting for grantee to approve access</Tooltip>} placement="top">
            <span className="btn btn-sm btn-warning disabled">Pending Approval</span>
          </OverlayTrigger>
        );
      case 'DENIED':
        return (
          <OverlayTrigger overlay={<Tooltip>This grantee has denied access to their report</Tooltip>} placement="top">
            <span className="btn btn-sm btn-outline-danger disabled">Access Denied</span>
          </OverlayTrigger>
        );
      case 'NOT_REQUESTED':
      default:
        return (
          <Button
            size="sm"
            variant="info"
            onClick={() => requestConsent(report.id, report.orgId)}
          >
            Request for Consent from Grantee
          </Button>
        );
    }
  };

  const getConsentBadge = (status) => {
    switch (status) {
      case 'GRANTED':
        return <Badge bg="success" className="me-2">REPORT ACCESS GRANTED</Badge>;
      case 'PENDING':
        return <Badge bg="warning" className="me-2 text-dark">ACCESS PENDING</Badge>;
      case 'DENIED':
        return <Badge bg="danger" className="me-2">REPORT ACCESS DENIED</Badge>;
      case 'NOT_REQUESTED':
      default:
        return <Badge bg="secondary" className="me-2">REPORT ACCESS NOT REQUESTED</Badge>;
    }
  };

  return (
    <div className="container">
      <h5 className="mb-4"><BiShareAlt className="me-2" />Grantee Assessments</h5>

      <InputGroup className="mb-4">
        <FormControl
          placeholder="Search by grantee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      {(() => {
        let content;
        if (loading) {
          content = (
            <div className="d-flex justify-content-center my-5">
              <Spinner animation="border" variant="primary" />
            </div>
          );
        } else if (filteredReports.length === 0) {
          content = <p className="text-muted">No assessments available.</p>;
        } else {
          content = (
            <Row xs={1} sm={2} md={3} className="g-4">
              {filteredReports.map((report) => (
                <Col key={report.id}>
                  <Card
                    className={`h-100 shadow-sm border-${report.consentStatus === 'DENIED' ? 'danger' : 'light'}`}
                    style={report.consentStatus === 'GRANTED' ? { boxShadow: '0 0 10px 2px #28a745' } : {}}
                  >
                    <Card.Body>
                      <Card.Title className="d-flex align-items-center">
                        <BiUser className="me-2" />
                        {report.granteeName || `Grantee #${report.orgId}`}
                      </Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        Submitted on: {new Date(report.createdAt).toLocaleDateString()}
                      </Card.Subtitle>
                      {getConsentBadge(report.consentStatus)}
                      <Badge bg="info">Structure: {report.structure}</Badge>
                    </Card.Body>
                    <Card.Footer className="bg-transparent border-top-0 d-flex justify-content-end">
                      {renderConsentActions(report)}
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          );
        }
        return content;
      })()}
    </div>
  );
};

export default SharedReportsList;