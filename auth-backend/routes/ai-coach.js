const express = require('express');
const axios = require('axios');
const router = express.Router();

// Provider helpers
const hasGroq = !!process.env.GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

async function callGroq(messages, { maxTokens = 700, temperature = 0.3, timeout = 45000 } = {}) {
  const resp = await axios.post(
    GROQ_ENDPOINT,
    {
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    },
    {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      timeout,
    }
  );
  const content = resp?.data?.choices?.[0]?.message?.content || '';
  return content;
}

function chatSystemPrompt() {
  return (
    'You are "Coach", an expert trading educator. Your role is to teach, not to advise.\n' +
    '- Never reveal the answer to the puzzle or prescribe a buy/sell/hold action.\n' +
    '- If asked for the answer or what to do, politely refuse and redirect to learning.\n' +
    '- Focus on explaining concepts clearly (market psychology, fundamentals, technicals, risk).\n' +
    '- Use concise paragraphs and short bullet points.\n' +
    '- Avoid speculation and predictions.\n' +
    '- Do not output code blocks.\n'
  );
}

function analyzeSystemPrompt() {
  return (
    'You are an impartial trading coach. Score and critique a user decision for a historical scenario.\n' +
    'Return STRICT minified JSON matching this schema and nothing else: ' +
    '{"totalScore":<0-100>,' +
    '"detailedFeedback":[{"step":1,"score":<0-100>,"feedback":"...","strengths":["..."],"weaknesses":["..."]}],' +
    '"coaching":{' +
    '"overall":"...","marketPsychology":"...","fundamentals":"...",' +
    '"technicalAnalysis":"...","riskManagement":"...","nextSteps":["..."]},' +
    '"strengths":["..."],"weaknesses":["..."]}'
  );
}

function formatChatUserContent(message, scenario) {
  return (
    `SCENARIO: ${scenario?.title || 'Unknown'}\n` +
    `CONTEXT: ${scenario?.context || ''}\n` +
    `KEY EVENTS: ${(scenario?.keyEvents || []).join(', ')}\n\n` +
    `QUESTION: ${message}\n\n` +
    'Teach the concept(s) relevant to the question. Do not give any puzzle answer.'
  );
}

function formatAnalyzeUserContent(userDecisions, scenario, optimalStrategy) {
  const decisionsText = userDecisions
    .map((d, i) => `Step ${i + 1}: ${d.type} @ $${d.price} shares=${d.shares} reason="${d.reasoning}"`)
    .join('\n');
  const optimal = Object.values(optimalStrategy || {})
    .map((s, i) => `Step ${i + 1}: ${s.type} @ $${s.price} shares=${s.shares} reason="${s.reasoning}"`)
    .join('\n');
  return (
    `SCENARIO: ${scenario?.title}\nCONTEXT: ${scenario?.context}\nKEY EVENTS: ${(scenario?.keyEvents || []).join(', ')}\n\n` +
    `USER DECISIONS:\n${decisionsText}\n\nOPTIMAL STRATEGY:\n${optimal}\n\n` +
    'Score accuracy (type, timing), reasoning quality, and risk. Return STRICT JSON only.'
  );
}

// Lightweight diagnostics to verify env + Ollama/Groq connectivity
router.get('/diagnostics', async (req, res) => {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL;
  const result = { baseUrl, model, tagsOk: false, generateOk: false, groqOk: false, errors: [] };
  // Ollama checks
  if (baseUrl) {
    try {
      const tags = await axios.get(`${baseUrl}/api/tags`, { timeout: 15000 });
      result.tagsOk = tags.status === 200;
    } catch (e) {
      result.errors.push(`tags: ${e.message}`);
    }
    try {
      const gen = await axios.post(
        `${baseUrl}/api/generate`,
        { model, prompt: 'ping', stream: false, options: { num_predict: 8 } },
        { timeout: 60000 }
      );
      result.generateOk = !!gen?.data?.response;
    } catch (e) {
      result.errors.push(`generate: ${e.message}`);
    }
  }
  // Groq check
  if (hasGroq) {
    try {
      const out = await callGroq(
        [
          { role: 'system', content: 'You are a health check. Reply with OK.' },
          { role: 'user', content: 'OK?' },
        ],
        { maxTokens: 3, timeout: 15000 }
      );
      result.groqOk = /ok/i.test(out || '');
    } catch (e) {
      result.errors.push(`groq: ${e.message}`);
    }
  }
  res.json(result);
});

// AI Coach chat endpoint for educational responses
router.post('/chat', async (req, res) => {
  try {
    const { message, scenario } = req.body;

    if (hasGroq) {
      const content = await callGroq(
        [
          { role: 'system', content: chatSystemPrompt() },
          { role: 'user', content: formatChatUserContent(message, scenario) },
        ],
        { maxTokens: 700, temperature: 0.35, timeout: 90000 }
      );
      return res.json({ success: true, response: content });
    }

    // Fallback to Ollama
    const aiPrompt = generateChatPrompt(message, scenario, []);
    const baseUrl = process.env.OLLAMA_BASE_URL;
    const model = process.env.OLLAMA_MODEL;
    const response = await axios.post(
      `${baseUrl}/api/generate`,
      { model, prompt: aiPrompt, stream: false, options: { temperature: 0.7, top_p: 0.9, max_tokens: 700, num_predict: 256 } },
      { timeout: 90000 }
    );
    return res.json({ success: true, response: response.data.response });
  } catch (error) {
    console.error('[AI-CHAT] Error:', error?.response?.data || error.message);
    res.status(500).json({ success: false, error: 'AI chat failed', details: error.message });
  }
});

// AI Coach endpoint for real AI analysis
router.post('/analyze', async (req, res) => {
  try {
    const { userDecisions, scenario, optimalStrategy } = req.body;

    if (hasGroq) {
      const content = await callGroq(
        [
          { role: 'system', content: analyzeSystemPrompt() },
          { role: 'user', content: formatAnalyzeUserContent(userDecisions, scenario, optimalStrategy) },
        ],
        { maxTokens: 900, temperature: 0.2, timeout: 120000 }
      );
      try {
        const parsed = JSON.parse(content);
        return res.json({ success: true, analysis: parsed });
      } catch {
        // Try to salvage JSON from content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return res.json({ success: true, analysis: JSON.parse(jsonMatch[0]) });
        }
        return res.json({ success: true, analysis: parseFallbackResponse(content) });
      }
    }

    // Fallback to Ollama path
    const aiPrompt = generateAIPrompt(userDecisions, scenario, optimalStrategy);
    const baseUrl = process.env.OLLAMA_BASE_URL;
    const model = process.env.OLLAMA_MODEL;
    const response = await axios.post(
      `${baseUrl}/api/generate`,
      { model, prompt: aiPrompt, stream: false, options: { temperature: 0.7, top_p: 0.9, max_tokens: 1200, num_predict: 512 } },
      { timeout: 120000 }
    );
    const aiAnalysis = parseAIResponse(response.data.response);
    return res.json({ success: true, analysis: aiAnalysis });
  } catch (error) {
    console.error('[AI-ANALYZE] Error:', error?.response?.data || error.message);
    res.status(500).json({ success: false, error: 'AI analysis failed', details: error.message });
  }
});

// Ollama legacy prompts (kept for fallback)
function generateChatPrompt(message, scenario, chatHistory) {
  return `You are an expert trading coach helping a student learn about trading. You are analyzing the scenario: ${scenario.title}

SCENARIO CONTEXT:
${scenario.context}

KEY EVENTS:
${(scenario.keyEvents || []).join(', ')}

IMPORTANT: You are ONLY allowed to provide educational information and guidance. You CANNOT give direct trading advice or tell the user what to do. Your role is to:

1. Explain trading concepts and terminology
2. Provide educational insights about market psychology
3. Explain fundamental and technical analysis concepts
4. Discuss risk management principles
5. Help the user understand the scenario better

You CANNOT:
- Tell the user to buy, sell, or hold
- Give specific price targets
- Make predictions about what will happen
- Suggest specific trading strategies

User's question: "${message}"

Provide an educational, helpful response that teaches trading concepts without giving direct advice.`;
}

function generateAIPrompt(userDecisions, scenario, optimalStrategy) {
  return `You are an expert trading coach analyzing a historical market scenario. 

SCENARIO: ${scenario.title}
CONTEXT: ${scenario.context}
KEY EVENTS: ${(scenario.keyEvents || []).join(', ')}

USER DECISIONS:
${userDecisions.map((decision, index) => 
  `Step ${index + 1}: ${decision.type.toUpperCase()} at $${decision.price} (${decision.shares} shares)
   Reasoning: "${decision.reasoning}"`
).join('\n')}

OPTIMAL STRATEGY:
${Object.values(optimalStrategy || {}).map((step, index) => 
  `Step ${index + 1}: ${step.type.toUpperCase()} at $${step.price} (${step.shares} shares)
   Reasoning: "${step.reasoning}"`
).join('\n')}

Analyze the user's trading decisions and provide:
1. Overall score (0-100) with detailed breakdown
2. Specific feedback on decision quality, reasoning, timing, and risk management
3. Market psychology insights
4. Fundamental analysis evaluation
5. Technical analysis assessment
6. Risk management evaluation
7. Specific improvement recommendations

Format your response as JSON:
{"totalScore":75,"detailedFeedback":[{"step":1,"score":80,"feedback":"...","strengths":["..."],"weaknesses":["..."]}],"coaching":{"overall":"...","marketPsychology":"...","fundamentals":"...","technicalAnalysis":"...","riskManagement":"...","nextSteps":["..."]},"strengths":["..."],"weaknesses":["..."]}`;
}

function parseAIResponse(aiResponse) {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return parseFallbackResponse(aiResponse);
  } catch (error) {
    return parseFallbackResponse(aiResponse);
  }
}

function parseFallbackResponse(aiResponse) {
  const scoreMatch = aiResponse.match(/score.*?(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
  const sections = aiResponse.split('\n\n');
  return {
    totalScore: score,
    detailedFeedback: [{ step: 1, score, feedback: 'AI analysis completed', strengths: ['Analysis provided'], weaknesses: ['Response parsing limited'] }],
    coaching: {
      overall: sections[0] || 'AI analysis completed',
      marketPsychology: extractSection(aiResponse, 'psychology'),
      fundamentals: extractSection(aiResponse, 'fundamental'),
      technicalAnalysis: extractSection(aiResponse, 'technical'),
      riskManagement: extractSection(aiResponse, 'risk'),
      nextSteps: ['Review the analysis', 'Practice more scenarios'],
    },
    strengths: ['AI analysis provided'],
    weaknesses: ['Response format limited'],
  };
}

function extractSection(text, keyword) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(keyword)) {
      return lines[i].replace(/^[^:]*:\s*/, '');
    }
  }
  return 'Analysis provided';
}

module.exports = router;
