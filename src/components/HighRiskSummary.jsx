import React from 'react';


const HighRiskSummary = ({ template, grantees, granteeAnswers, isHighRisk, selectedGranteesTemplates }) => {
  if (!template || grantees.length === 0 || !template.sections) return null;

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">High Risk Summary</h5>
        <ul className="list-group">
          {grantees.map((grantee) => {
            const granteeSpecificTemplate = selectedGranteesTemplates[grantee.id];
            const answersForGrantee = granteeAnswers[grantee.id] || {};

            let highRiskCount = 0;
            const highRiskDetails = [];

            if (granteeSpecificTemplate) {
              granteeSpecificTemplate.sections.forEach((section) => {
                const allQuestionsInSection = (section.subsections || []).flatMap(
                  (subsection) => subsection.questions || []
                );
                allQuestionsInSection.forEach((q) => {
                  const answer = answersForGrantee[q.id]?.answer;
                  if (isHighRisk(answer)) {
                    highRiskCount++;
                    highRiskDetails.push({
                      section: section.title,
                      question: q.questionText,
                      answer
                    });
                  }
                });
              });
            } else {
              highRiskDetails.push({
                section: 'N/A',
                question: 'No template found for this grantee, cannot assess risk.',
                answer: 'N/A'
              });
            }


            return (
              <li key={grantee.id} className="list-group-item">
                <strong>{grantee.granteeName || `Grantee #${grantee.userId}`}</strong>: {highRiskCount} high-risk areas
                {highRiskCount > 0 && (
                  <ul className="mt-2">
                    {highRiskDetails.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.section}:</strong> <span dangerouslySetInnerHTML={{ __html: item.question }} /> — <em>{item.answer}</em>
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