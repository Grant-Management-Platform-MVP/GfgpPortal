import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Badge, Button, Tab, Nav, Row, Col, Fade } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCubes, FaBrain, FaLayerGroup } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const GFGP_OPTIONS = [
  {
    id: 'foundation',
    title: 'Foundation',
    description:
      'Basic controls for smaller organizations. Suitable for grantees with minimal operational complexity.',
    color: '#64b5f6',
    icon: <FaCubes size={28} style={{color:'#033973' }} />,
    badge: 'Best for small orgs',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description:
      'Includes all Foundation controls plus enhanced governance and financial risk controls.',
    color: '#04ca75',
    icon: <FaBrain size={28} style={{color:'#04ca75' }} />,
    badge: 'Recommended for growing orgs',
  },
  {
    id: 'tiered',
    title: 'Tiered',
    description:
      'A dynamic version of GFGP that adapts to the size, complexity, and risk profile of the grantee.',
    color: '#ffbf60',
    icon: <FaLayerGroup size={28} style={{color:'#ffbf60' }} />,
    badge: 'Most flexible',
  },
];

const SelectStructure = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (structureId) => {
    if (loading) return;

    setSelected(structureId);
    setLoading(true);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.id || storedUser?.userId;

    try {
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const res = await fetch(BASE_URL + 'gfgp/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure: structureId, userId }),
      });

      if (!res.ok) throw new Error('Failed to save structure');

      toast.success(`Structure "${structureId}" selected successfully!`);
      localStorage.setItem('gfgpStructure', structureId);

      setSaved(true);
    } catch (err) {
      toast.error('Something went wrong: ' + err.message, {
        autoClose: 3000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => navigate('/grantee/questionnaire');

  return (
    <div className="container mt-4 position-relative">
      <h2 className="text-center mb-3">Select Your GFGP Structure</h2>
      <p className="text-center text-muted">
        Not sure what to pick? Read each option’s description carefully to guide your choice.
      </p>

      <Alert variant="light" className="shadow-sm text-center mb-5">
        <strong>What is GFGP?</strong> <br />
        The Good Financial Grant Practice (GFGP) is a global standard for financial governance.
        Selecting the right structure ensures that your organization is assessed fairly based on size,
        complexity, and risk exposure.
      </Alert>

      <Tab.Container id="structure-tabs" activeKey={selected || ''} onSelect={(k) => setSelected(k)}>
        <Row>
          <Col md={4} className="mb-3">
            <Nav variant="pills" className="flex-column large-tab-nav">
              {GFGP_OPTIONS.map((option) => (
                <Nav.Item key={option.id}>
                  <Nav.Link
                    eventKey={option.id}
                    style={{
                      color: '#000',
                      borderLeftColor: option.color,
                      borderLeftWidth: '5px',
                      borderLeftStyle: 'solid',
                      fontWeight: selected === option.id ? 'bold' : 'normal',
                      fontSize: '1.25rem',
                      padding: '1rem',
                      backgroundColor: selected === option.id ? `${option.color}10` : 'white',
                      transition: 'all 0.3s ease',
                    }}
                    className="rounded shadow-sm mb-3 transition-tab"
                  >
                    <div className="d-flex align-items-center">
                      <span className="me-3">{option.icon}</span> {option.title}
                    </div>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Col>

          <Col md={8}>
            <Tab.Content>
              {GFGP_OPTIONS.map((option) => (
                <div key={option.id} className="mb-4">
                  <div
                    className="card shadow-sm border-0 animated-pane"
                    style={{
                      borderLeftColor: option.color,
                      backgroundColor: selected === option.id ? `${option.color}10` : '#fff',
                      boxShadow: selected === option.id
                        ? `0 0 0 0.25rem ${option.color}40`
                        : '0 0 4px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <div className="card-body">
                      <h3 className="d-flex justify-content-between align-items-center ">
                        {option.title} <Badge bg="info">{option.badge}</Badge>
                      </h3>
                      <p className="text-muted">{option.description}</p>
                      <Button
                        variant={selected === option.id ? 'primary lg block' : 'outline-primary'}
                        style={{
                          borderColor: option.color,
                          backgroundColor: selected === option.id ? option.color : '',
                        }}
                        onClick={() => handleSelect(option.id)}
                        disabled={loading}
                      >
                        {loading && selected === option.id ? (
                          <>
                            <Spinner size="sm" className="me-2" /> Saving...
                          </>
                        ) : (
                          `Select ${option.title}`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </Tab.Content>

          </Col>
        </Row>
      </Tab.Container>

      {saved && !loading && (
        <div className="text-center mt-4">
          <Alert variant="success" className="d-inline-block">
            ✅ Structure saved successfully!
          </Alert>
          <div className="mt-3 d-flex justify-content-center gap-3">
            <Button variant="success btn-lg" onClick={handleProceed}>
              Start Assessment
            </Button>
            <Button variant="warning btn-lg" onClick={() => navigate('/grantee/')}>
              Maybe Later
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: 'rgba(255,255,255,0.8)', zIndex: 1050 }}
        >
          <div className="text-center">
            <Spinner animation="border" />
            <div className="mt-2 fw-bold">Saving your choice...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectStructure;