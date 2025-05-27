import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Button, Spinner, Alert } from 'react-bootstrap';

const AssessmentHistoryCard = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await axios.get(`${BASE_URL}gfgp/assessment/${userId}`);
        setAssessments(response.data);
      } catch (err) {
        setError("Failed to fetch assessments.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <p className="mt-2">Loading assessments...</p>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <h5 className="mb-4">Your Assessments</h5>
        {assessments.length === 0 ? (
          <p>No assessments found.</p>
        ) : (
          assessments.map(assessment => (
            <div key={assessment.id} className="mb-3">
              <h6>{assessment.title}</h6>
              <p>Structure: {assessment.structure}</p>
              <p>Date: {new Date(assessment.date).toLocaleDateString()}</p>
              <Button variant="primary">
                {assessment.status === 'incomplete' ? 'Resume' : 'View'}
              </Button>
            </div>
          ))
        )}
      </Card.Body>
    </Card>
  );
};

export default AssessmentHistoryCard;
