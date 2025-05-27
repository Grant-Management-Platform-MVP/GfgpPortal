import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCubes, FaBrain, FaLayerGroup } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const GFGP_OPTIONS = [
  {
    id: 'foundation',
    title: 'Foundation',
    description: 'Basic controls for smaller organizations. Suitable for grantees with minimal operational complexity.',
    color: '#007bff',
    icon: <FaCubes size={28} />,
    badge: 'Best for small orgs',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Includes all Foundation controls plus enhanced governance and financial risk controls.',
    color: '#28a745',
    icon: <FaBrain size={28} />,
    badge: 'Recommended for growing orgs',
  },
  {
    id: 'tiered',
    title: 'Tiered',
    description: 'A dynamic version of GFGP that adapts to the size, complexity, and risk profile of the grantee.',
    color: '#6f42c1',
    icon: <FaLayerGroup size={28} />,
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

      <div className="row">
        {GFGP_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <div className="col-md-4 mb-4" key={option.id}>
              <div
                className={`card h-100 shadow border-2`}
                style={{
                  borderColor: isSelected ? option.color : 'transparent',
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <div className="card-body d-flex flex-column">
                  <div className="mb-2 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{option.title}</h5>
                    {option.icon}
                  </div>

                  <Badge bg="info" className="mb-3 text-light">{option.badge}</Badge>

                  <p className="text-muted" style={{ flexGrow: 1 }}>{option.description}</p>

                  <button
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-outline-primary'} mt-auto`}
                    style={{
                      backgroundColor: isSelected ? option.color : '',
                      borderColor: option.color,
                    }}
                    onClick={() => handleSelect(option.id)}
                    disabled={loading}
                  >
                    {loading && isSelected ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Saving...
                      </>
                    ) : (
                      `Select ${option.title}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* After Save Confirmation */}
      {saved && !loading && (
        <div className="text-center mt-4">
          <Alert variant="success" className="d-inline-block">
            ✅ Structure saved successfully!
          </Alert>
          <div className="mt-3 d-flex justify-content-center gap-3">
            <Button variant="success btn-lg btn-block" onClick={handleProceed}>
              Start Assessment
            </Button>
            <Button variant="warning btn-lg btn-block" onClick={() => navigate('/grantee/dashboard')}>
              Maybe Later
            </Button>
          </div>
        </div>
      )}

      {/* Optional loading screen */}
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