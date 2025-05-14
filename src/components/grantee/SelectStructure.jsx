import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap';
import { FaCubes, FaBrain, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GFGP_OPTIONS = [
  {
    id: 'foundation',
    title: 'Foundation',
    description: 'Basic controls for smaller organizations. Suitable for grantees with minimal operational complexity.',
    color: '#007bff',
    icon: <FaCubes size={28} />,
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Includes all Foundation controls plus enhanced governance and financial risk controls.',
    color: '#28a745',
    icon: <FaBrain size={28} />,
  },
  {
    id: 'tiered',
    title: 'Tiered',
    description: 'A dynamic version of GFGP that adapts to the size, complexity, and risk profile of the grantee.',
    color: '#6f42c1',
    icon: <FaLayerGroup size={28} />,
  },
];

const SelectStructure = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (structureId) => {
    setSelected(structureId);
    setLoading(true);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.id || storedUser?.userId;

    try {
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const res = await fetch(BASE_URL + 'gfgp/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ structure: structureId, userId }),
      });

      if (!res.ok) {
        throw new Error('Failed to save structure');
      }

      toast.success(`Structure "${structureId}" selected successfully!`);
      localStorage.setItem('gfgpStructure', structureId);
        navigate('/grantee/questionnaire');

    } catch (err) {
      toast.error('Something went wrong: ' + err.message, {
        autoClose: 3000,
        position: 'top-center',
      });
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 position-relative">
      <h2 className="text-center mb-4">Select GFGP Structure</h2>
      <p className="text-center text-muted mb-5">
        Please choose the structure that best describes your organization.
      </p>

      <div className="row">
        {GFGP_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <div className="col-md-4 mb-4" key={option.id}>
              <div
                className={`card h-100 shadow-lg border-3`}
                style={{
                  borderColor: isSelected ? option.color : 'transparent',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  transition: 'transform 0.2s ease, border-color 0.3s ease',
                }}
              >
                <div className="card-body d-flex flex-column">
                  <div
                    className="mb-3 d-flex align-items-center justify-content-between"
                    style={{ color: option.color }}
                  >
                    <h5 className="card-title mb-0">{option.title}</h5>
                    {option.icon}
                  </div>

                  <div
                    className="card-text mb-4 text-muted"
                    style={{
                      fontSize: '0.95rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {option.description}
                  </div>

                  <button
                    onClick={() => handleSelect(option.id)}
                    className="btn btn-outline-primary mt-auto"
                    style={{
                      backgroundColor: isSelected ? option.color : '',
                      color: isSelected ? 'white' : option.color,
                      borderColor: option.color,
                    }}
                    disabled={loading}
                  >
                    {loading && isSelected ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
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

      {/* Full-page overlay loader */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: 'rgba(255,255,255,0.8)', zIndex: 9999 }}
        >
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 fw-bold">Submitting your choice...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectStructure;