import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const STATUS_KEYS = ['Met', 'Partially Met', 'Not Met', 'N/A'];

// A slightly more robust getStatusLabel, though the provided one is fine for these keys
const getStatusLabel = (answer) => {
  switch (answer) {
    case 'Yes': return 'Met';
    case 'In-progress': return 'Partially Met';
    case 'No': return 'Not Met';
    case 'Not Applicable': return 'N/A';
    default: return 'N/A'; // For "No Response" or unhandled answers
  }
};

const getGranteeChartData = (template, grantees, granteeAnswers) => {
  return grantees.map((g) => {
    const counts = {
      grantee: g.granteeName || `Grantee #${g.userId}`,
      Met: 0,
      'Partially Met': 0,
      'Not Met': 0,
      'N/A': 0,
      // You might also want to track 'No Response' explicitly if it's a significant status
      // 'No Response': 0,
    };

    // Ensure template.sections exist before trying to iterate
    if (!template?.sections) {
      return counts; // Return counts with zeros if no sections are available
    }

    template.sections.forEach((section) => {
      // CORRECTED: Flatten questions from all subsections within the current section
      const allQuestionsInSection = (section.subsections || []).flatMap(
        (subsection) => subsection.questions || []
      );

      allQuestionsInSection.forEach((q) => {
        const answer = granteeAnswers[g.id]?.[q.id]?.answer;
        const label = getStatusLabel(answer);

        // Only increment if the label is one of the tracked statuses
        if (STATUS_KEYS.includes(label)) {
          counts[label]++;
        }
        // If you add 'No Response', handle it here:
        // else {
        //   counts['No Response']++;
        // }
      });
    });

    return counts;
  });
};

const ComparisonBarChart = ({ grantees, granteeAnswers, template }) => {
  // Add a check for template.sections to prevent immediate errors if sections are not yet loaded
  if (!template?.sections || grantees.length === 0) return null;

  const chartData = getGranteeChartData(template, grantees, granteeAnswers);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="grantee" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {/* These colors align with your previous STATUS_MAP colors for consistency */}
        <Bar dataKey="Met" stackId="a" fill="#198754" />         {/* Success Green */}
        <Bar dataKey="Partially Met" stackId="a" fill="#ffc107" /> {/* Warning Yellow */}
        <Bar dataKey="Not Met" stackId="a" fill="#dc3545" />     {/* Danger Red */}
        <Bar dataKey="N/A" stackId="a" fill="#6c757d" />         {/* Secondary Gray */}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ComparisonBarChart;