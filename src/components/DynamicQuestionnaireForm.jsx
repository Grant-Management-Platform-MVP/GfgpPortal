import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Spinner } from 'react-bootstrap';

const DynamicQuestionnaireForm = ({ selectedStructure }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/questionnaire?structure=${selectedStructure}`);
        if (!res.ok) throw new Error('Failed to fetch questionnaire');
        const data = await res.json();
        setQuestions(data.questions);
      } catch (err) {
        console.error(err);
        setError('Could not load questionnaire. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedStructure]);

  const handleChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const isVisible = (q) => {
    if (!q.visibleIf) return true;
    const [depId] = Object.keys(q.visibleIf);
    return answers[depId] === q.visibleIf[depId];
  };

  if (loading) return <Spinner animation="border" role="status" />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <Card>
      <Card.Body>
        <Card.Title>Questionnaire</Card.Title>
        <Form>
          {questions.map(q => isVisible(q) && (
            <Form.Group key={q.id} className="mb-3">
              <Form.Label>{q.label}</Form.Label>

              {q.type === 'select' && (
                <Form.Select onChange={e => handleChange(q.id, e.target.value)}>
                  <option value="">Select</option>
                  {q.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </Form.Select>
              )}

              {q.type === 'textarea' && (
                <Form.Control as="textarea" rows={3} onChange={e => handleChange(q.id, e.target.value)} />
              )}

              {q.type === 'file' && (
                <Form.Control type="file" onChange={e => handleChange(q.id, e.target.files[0])} />
              )}

              {q.helpText && (
                <Form.Text className="text-muted">{q.helpText}</Form.Text>
              )}
            </Form.Group>
          ))}

          <Button variant="primary" type="submit" onClick={(e) => {
            e.preventDefault();
            console.log("Submit answers →", answers);
            // You can plug in your API submission logic here
          }}>
            Save
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default DynamicQuestionnaireForm;
