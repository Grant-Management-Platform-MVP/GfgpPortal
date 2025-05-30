import React from 'react';
import { Table, Card } from 'react-bootstrap';

const STATUS_MAP = {
  Yes: 'Yes',
  'In-progress': 'In-progress',
  No: 'No',
  'Not Applicable': 'N/A',
  'No Response': '—',
};

const SectionComparisonTable = ({ template, grantees, granteeAnswers }) => {
  if (!template?.sections) return <p>No template data available.</p>;

  return (
    <>
      {template.sections.map((section, sectionIdx) => (
        <Card className="mb-4 shadow-sm" key={section.sectionId || sectionIdx}>
          <Card.Body>
            <h5>{section.title || `Section ${sectionIdx + 1}`}</h5>
            <p className="text-muted">{section.description}</p>

            <Table bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Question</th>
                  {grantees.map((g) => (
                    <th key={g.id}>
                      {g.granteeName || `Grantee #${g.userId}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* CORRECTED: Flatten questions from all subsections within this section */}
                {(section.subsections || [])
                  .flatMap(subsection => subsection.questions || [])
                  .map((q) => (
                    <tr key={q.id}>
                      <td>{q.questionText}</td>
                      {grantees.map((g) => {
                        const response = granteeAnswers[g.id]?.[q.id];
                        // Use STATUS_MAP for consistent labels, default to 'No Response' (or '—')
                        const label = STATUS_MAP[response?.answer] || STATUS_MAP['No Response'];
                        return <td key={g.id}>{label}</td>;
                      })}
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ))}
    </>
  );
};

export default SectionComparisonTable;