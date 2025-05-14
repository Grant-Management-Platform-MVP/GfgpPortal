import React, { useState } from 'react';
import { Button, Card, Form, Modal, Accordion } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

const structures = ['Foundation', 'Advanced', 'Tiered'];

const defaultQuestion = () => ({
  id: uuidv4(),
  questionText: '',
  type: 'TEXT',
  required: false,
  options: [],
  guidance: '',
  uploadEvidence: false,
  conditional: null
});

const defaultSection = () => ({
  id: uuidv4(),
  title: '',
  description: '',
  displayOrder: 1,
  questions: [defaultQuestion()]
});

const QuestionnaireBuilder = () => {
  const [structure, setStructure] = useState('');
  const [version, setVersion] = useState('');
  const [sections, setSections] = useState([defaultSection()]);
  const [showPreview, setShowPreview] = useState(false);

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const addSection = () => {
    setSections([...sections, defaultSection()]);
  };

  const removeSection = (index) => {
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
  };

  const updateQuestion = (sIndex, qIndex, field, value) => {
    const updated = [...sections];
    updated[sIndex].questions[qIndex][field] = value;
    setSections(updated);
  };

  const addQuestion = (sIndex) => {
    const updated = [...sections];
    updated[sIndex].questions.push(defaultQuestion());
    setSections(updated);
  };

  const removeQuestion = (sIndex, qIndex) => {
    const updated = [...sections];
    updated[sIndex].questions.splice(qIndex, 1);
    setSections(updated);
  };

  const handlePreview = () => setShowPreview(true);
  const closePreview = () => setShowPreview(false);

  const handleSubmit = () => {
    const payload = {
      structure,
      version,
      sections
    };
    console.log('Final Questionnaire JSON:', JSON.stringify(payload, null, 2));
    // Send to backend here
  };

  return (
    <div className="container mt-5">
      <Card className="p-4 shadow">
        <h3 className="mb-4">GFGP Questionnaire Builder</h3>

        <Form.Group className="mb-3">
          <Form.Label>Structure</Form.Label>
          <Form.Select value={structure} onChange={(e) => setStructure(e.target.value)}>
            <option value="">Select structure</option>
            {structures.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Version</Form.Label>
          <Form.Control
            placeholder="e.g., v1.0, v2.1"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </Form.Group>

        <Accordion defaultActiveKey="0">
          {sections.map((section, sIndex) => (
            <Accordion.Item eventKey={sIndex.toString()} key={section.id}>
              <Accordion.Header>Section {sIndex + 1}: {section.title || 'Untitled'}</Accordion.Header>
              <Accordion.Body>
                <Form.Group className="mb-2">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    value={section.title}
                    onChange={(e) => updateSection(sIndex, 'title', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    value={section.description}
                    onChange={(e) => updateSection(sIndex, 'description', e.target.value)}
                  />
                </Form.Group>

                {section.questions.map((q, qIndex) => (
                  <Card key={q.id} className="mb-3 p-3">
                    <h6>Question {qIndex + 1}</h6>
                    <Form.Group className="mb-2">
                      <Form.Label>Text</Form.Label>
                      <Form.Control
                        value={q.questionText}
                        onChange={(e) =>
                          updateQuestion(sIndex, qIndex, 'questionText', e.target.value)
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Type</Form.Label>
                      <Form.Select
                        value={q.type}
                        onChange={(e) => updateQuestion(sIndex, qIndex, 'type', e.target.value)}
                      >
                        <option value="TEXT">Text</option>
                        <option value="SINGLE_CHOICE">Single Choice</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                        <option value="FILE_UPLOAD">File Upload</option>
                      </Form.Select>
                    </Form.Group>

                    {(q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') && (
                      <Form.Group className="mb-2">
                        <Form.Label>Options (comma separated)</Form.Label>
                        <Form.Control
                          value={q.options.join(', ')}
                          onChange={(e) =>
                            updateQuestion(sIndex, qIndex, 'options', e.target.value.split(',').map(opt => opt.trim()))
                          }
                        />
                      </Form.Group>
                    )}

                    <Form.Group className="mb-2">
                      <Form.Check
                        label="Required?"
                        checked={q.required}
                        onChange={(e) =>
                          updateQuestion(sIndex, qIndex, 'required', e.target.checked)
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>Guidance</Form.Label>
                      <Form.Control
                        placeholder="e.g. Include governing board..."
                        value={q.guidance}
                        onChange={(e) => updateQuestion(sIndex, qIndex, 'guidance', e.target.value)}
                      />
                    </Form.Group>

                    {q.type !== 'FILE_UPLOAD' && (
                      <Form.Group className="mb-2">
                        <Form.Check
                          label="Upload Evidence?"
                          checked={q.uploadEvidence}
                          onChange={(e) =>
                            updateQuestion(sIndex, qIndex, 'uploadEvidence', e.target.checked)
                          }
                        />
                      </Form.Group>
                    )}

                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeQuestion(sIndex, qIndex)}
                    >
                      Remove Question
                    </Button>
                  </Card>
                ))}

                <Button variant="outline-primary" onClick={() => addQuestion(sIndex)} className="me-2">
                  + Add Question
                </Button>
                <Button variant="outline-danger" onClick={() => removeSection(sIndex)}>
                  Delete Section
                </Button>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>

        <div className="mt-4 d-flex justify-content-between">
          <Button variant="secondary" onClick={addSection}>+ Add Section</Button>
          <div>
            <Button variant="info" className="me-2" onClick={handlePreview}>Preview</Button>
            <Button variant="success" onClick={handleSubmit}>Save Questionnaire</Button>
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={closePreview} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Questionnaire Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify({ structure, version, sections }, null, 2)}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closePreview}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuestionnaireBuilder;
