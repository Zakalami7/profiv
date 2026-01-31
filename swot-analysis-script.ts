import { generateSWOTAnalysis } from './services/geminiService';

async function runSWOTAnalysis() {
    try {
        const subject = "full stack development";
        const context = "Contexte éducatif général (Lycée/Collège)";

        console.log(`Performing SWOT analysis for: ${subject}`);
        console.log(`Context: ${context}`);
        console.log('---');

        const result = await generateSWOTAnalysis(subject, context);

        console.log('SWOT Analysis Result:');
        console.log('Synthesis:', result.synthesis);
        console.log('Strengths:', result.strengths);
        console.log('Weaknesses:', result.weaknesses);
        console.log('Opportunities:', result.opportunities);
        console.log('Threats:', result.threats);
        console.log('Strategic Advice:', result.strategicAdvice);
    } catch (error) {
        console.error('Error performing SWOT analysis:', error);
    }
}

runSWOTAnalysis();
