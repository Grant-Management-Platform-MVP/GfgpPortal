import React from 'react';

const HighRiskSummary = ({ template, grantees, granteeAnswers, isHighRisk }) => {
  // Add a check for template.sections to prevent errors if sections are not yet loaded
  if (!template || grantees.length === 0 || !template.sections) return null;

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">High Risk Summary</h5>
        <ul className="list-group">
          {grantees.map((grantee) => {
            const answers = granteeAnswers[grantee.id] || {};
            let highRiskCount = 0;
            const highRiskDetails = [];

            // Iterate over each section in the template
            template.sections.forEach((section) => {
              // CORRECTED: Flatten all questions from all subsections within this section
              const allQuestionsInSection = (section.subsections || []).flatMap(
                (subsection) => subsection.questions || []
              );

              // Now iterate over the flattened list of questions
              allQuestionsInSection.forEach((q) => {
                const answer = answers[q.id]?.answer;
                if (isHighRisk(answer)) {
                  highRiskCount++;
                  highRiskDetails.push({
                    section: section.title, // Use section title from the parent section
                    question: q.questionText,
                    answer
                  });
                }
              });
            });

            return (
              <li key={grantee.id} className="list-group-item">
                <strong>{grantee.granteeName || `Grantee #${grantee.userId}`}</strong>: {highRiskCount} high-risk areas
                {highRiskCount > 0 && (
                  <ul className="mt-2">
                    {highRiskDetails.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.section}:</strong> {item.question} — <em>{item.answer}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default HighRiskSummary;