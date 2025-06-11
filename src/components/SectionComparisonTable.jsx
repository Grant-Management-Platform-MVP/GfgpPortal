import React from 'react';
import { Table, Card } from 'react-bootstrap';

const STATUS_MAP = {
  Yes: 'Yes',
  'In-progress': 'In-progress',
  No: 'No',
  'Not Applicable': 'N/A',
  'No Response': '—',
};

const SectionComparisonTable = ({ template, grantees, granteeAnswers, selectedGranteesTemplates }) => {
  if (!template?.sections) return <p>No template data available to structure the comparison.</p>;

  return (
    <>
      {template.sections.map((section, sectionIdx) => (
        <Card className="mb-4 shadow-sm" key={section.sectionId || sectionIdx}>
          <Card.Body>
            <h5>{section.title || `Section ${sectionIdx + 1}`}</h5>
            <p className="text-muted" dangerouslySetInnerHTML={{ __html: section.description }} />

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
                {(section.subsections || [])
                  .flatMap(subsection => subsection.questions || [])
                  .map((q) => (
                    <tr key={q.id}>
                      {/* Display question text from the reference template */}
                      <td dangerouslySetInnerHTML={{ __html: q.questionText }} />
                      {grantees.map((g) => {
                        // Get the specific template for the current grantee
                        const granteeSpecificTemplate = selectedGranteesTemplates[g.id];
                        const answersForGrantee = granteeAnswers[g.id];
                        const questionExistsInGranteeTemplate = granteeSpecificTemplate?.sections
                          ?.flatMap(s => s.subsections || [])
                          .flatMap(sub => sub.questions || [])
                          .some(question => question.id === q.id);

                        let label = STATUS_MAP['No Response'];

                        if (questionExistsInGranteeTemplate) {
                          const response = answersForGrantee?.[q.id];
                          label = STATUS_MAP[response?.answer] || STATUS_MAP['No Response'];
                        } else {
                          // If question does not exist in grantee's specific template, mark as N/A
                          label = 'N/A (Not applicable to this assessment)';
                        }

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