export const isHighRisk = (question, answer) => {
    if (!question || !answer) return false;
    const riskAnswers = question.riskAnswers || [];
    return riskAnswers.includes(answer);
};