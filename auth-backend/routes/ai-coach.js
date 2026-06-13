const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const authRoutes = require('./auth');
const { requireApproved } = require('../middleware/requireApproved');
const router = express.Router();

const authenticateToken = authRoutes.authenticateToken;

// Cap the per-user decision history so the user blob stays bounded.
const MAX_SAVED_DECISIONS = 50;

/**
 * Persist a summary of an analyzed decision onto the user (newest first,
 * capped). Best-effort: a persistence failure must never fail the analysis
 * response the user is waiting on.
 */
async function saveDecision(req, { scenarioId, scenarioTitle, decision, analysis, demo }) {
  try {
    const storage = req.app.locals.storage;
    await storage.withUserLock(req.user.userId, async (tx) => {
      const user = await tx.getUserById(req.user.userId);
      if (!user) return;
      if (!Array.isArray(user.coachDecisions)) user.coachDecisions = [];
      user.coachDecisions.unshift({
        id: `dec_${crypto.randomUUID()}`,
        scenarioId: scenarioId ?? null,
        scenarioTitle: scenarioTitle || null,
        decision: decision
          ? { type: decision.type, price: decision.price, shares: decision.shares, reasoning: decision.reasoning }
          : null,
        totalScore: analysis?.totalScore ?? null,
        breakdown: analysis?.breakdown ?? null,
        summary: analysis?.coaching?.overall || null,
        demo: Boolean(demo),
        createdAt: new Date().toISOString(),
      });
      user.coachDecisions = user.coachDecisions.slice(0, MAX_SAVED_DECISIONS);
      await tx.saveUser(user);
    });
  } catch (error) {
    console.error('[AI-ANALYZE] Failed to persist decision:', error.message);
  }
}

// Provider helpers
const hasGemini = !!process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_ENDPOINT = (model = GEMINI_MODEL) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

async function callGemini({
  contents,
  systemInstruction,
  model = GEMINI_MODEL,
  maxTokens = 700,
  temperature = 0.6,
  topP = 0.9,
  timeout = 60000,
} = {}) {
  if (!hasGemini) {
    throw new Error('Gemini API key not configured');
  }

  const generationConfig = {
    maxOutputTokens: maxTokens,
    temperature,
    topP,
  };

  const body = {
    contents,
    generationConfig,
  };

  if (systemInstruction) {
    body.systemInstruction = {
      role: 'system',
      parts: [{ text: systemInstruction }],
    };
  }

  // Pass the API key as a header (x-goog-api-key) rather than a URL query param,
  // so it never leaks into request logs, proxies, or error traces.
  const endpoint = GEMINI_ENDPOINT(model);
  const resp = await axios.post(endpoint, body, {
    timeout,
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
  });
  const candidate = resp?.data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts.map((part) => part.text || '').join('').trim();

  if (!text) {
    const blockReason = candidate?.finishReason || resp?.data?.promptFeedback?.blockReason;
    
    // Special handling for MAX_TOKENS: it's not really blocked, just cut off.
    if (blockReason === 'MAX_TOKENS') {
      // If we have parts but they joined to empty string (unlikely), or if text is just missing
      console.warn('[GEMINI] Response cut off due to MAX_TOKENS. finishReason:', candidate?.finishReason);
      throw new Error('AI response was truncated. Please try asking a shorter question.');
    }
    
    throw new Error(blockReason ? `Gemini response blocked: ${blockReason}` : 'Gemini returned an empty response');
  }

  return text;
}

function chatSystemPrompt() {
  return `You are Tickr's AI Trading Coach. Your goal is to teach beginners how to trade using historical scenarios.

CRITICAL INSTRUCTIONS:
1. **CONCISE**: You have a strict limit of 2 short paragraphs.
2. **DIRECT**: Get straight to the point. No fluff like "That's a great question" or "It's interesting to note".
3. **SIMPLE**: Use simple language for beginners.
4. **FORMATTING**: Use Markdown (bolding, lists) to make it readable.
5. **NO YAPPING**: Do not over-explain. Give the core concept and how it applies.

When asked about a concept (like Fair Value Gaps):
- Define it simply in 1 sentence.
- Explain if/how it applies to the current scenario in 2-3 sentences.
- Stop.

Do not write an essay. Do not get cut off. Keep it under 150 words.`;
}

function analyzeSystemPrompt() {
  return `You are Tickr's AI Trading Coach providing comprehensive analysis of a student's trading decision in a historical scenario. Your goal is to help them learn from this experience and become better traders.

## Your Analysis Approach
You are evaluating a real decision made by a student learning to trade. Be:
- **Encouraging**: Even poor decisions have learning value. Frame feedback positively.
- **Specific**: Point out exactly what they did well or could improve.
- **Educational**: Explain WHY certain approaches work better, not just WHAT to do.
- **Actionable**: Give concrete steps they can take to improve.

## Analysis Framework
Evaluate across these dimensions:

1. **Decision Quality** (20 points)
   - Was the action type (buy/sell/hold) appropriate for the scenario?
   - Did they understand the situation correctly?

2. **Timing** (20 points)
   - Did they act at the right moment given available information?
   - Did they consider entry/exit timing strategically?

3. **Reasoning Quality** (20 points)
   - Was their logic sound and well-thought-out?
   - Did they consider relevant factors?
   - Is their reasoning clear and defensible?

4. **Risk Management** (20 points)
   - Did they consider position sizing?
   - Did they think about potential downsides?
   - Was their approach appropriate for their risk tolerance?

5. **Market Understanding** (20 points)
   - Did they understand market psychology?
   - Did they consider fundamental and technical factors?
   - Did they show awareness of market context?

## Response Format
Return ONLY valid JSON in this exact structure (no markdown, no code blocks, just pure JSON):
{
  "totalScore": <number 0-100>,
  "breakdown": {
    "decisionQuality": <number 0-20>,
    "timing": <number 0-20>,
    "reasoning": <number 0-20>,
    "riskManagement": <number 0-20>,
    "marketUnderstanding": <number 0-20>
  },
  "coaching": {
    "overall": "<2-3 sentence summary highlighting the main takeaway and what they can learn>",
    "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
    "improvements": ["<specific area to improve 1>", "<specific area to improve 2>"],
    "marketPsychology": "<2-3 sentences about psychological factors relevant to their decision>",
    "fundamentals": "<2-3 sentences about fundamental analysis considerations>",
    "technicalAnalysis": "<2-3 sentences about technical factors if relevant>",
    "riskManagement": "<2-3 sentences about their risk management approach and suggestions>",
    "nextSteps": ["<specific actionable step 1>", "<specific actionable step 2>", "<specific actionable step 3>"]
  },
  "scenarioComparison": "<brief 2-3 sentence explanation of how their decision compared to what actually happened historically - but don't reveal optimal strategy if they want to try again>"
}

## Scoring Guidelines
- **90-100**: Outstanding decision showing strong understanding across all areas
- **80-89**: Good decision with solid reasoning, minor gaps
- **70-79**: Decent decision but missed some important considerations
- **60-69**: Flawed decision but shows some understanding
- **Below 60**: Poor decision indicating need for foundational learning

## Critical Rules
1. **Be encouraging**: Frame feedback as learning opportunities, not failures
2. **Be specific**: "You considered technical indicators" not "Good job"
3. **Be educational**: Explain concepts, don't just judge
4. **Maintain context**: Reference the scenario and their specific reasoning
5. **Stay in character**: You're a coach helping them learn, not a critic

Remember: This analysis should leave the student feeling informed and motivated to learn more, regardless of their score.`;
}

function formatChatUserContent(message, scenario, chatHistory = []) {
  const scenarioInfo = `SCENARIO: ${scenario?.title || 'Unknown'}
CONTEXT: ${scenario?.context || ''}
KEY EVENTS: ${(scenario?.keyEvents || []).join(', ')}

PUZZLE TYPE: ${scenario?.puzzleType || 'unknown'} challenge - ${scenario?.puzzleType === 'buy' ? 'User needs to decide when to enter' : scenario?.puzzleType === 'sell' ? 'User already has a position and needs to decide when to exit' : 'User needs to make trading decisions'}`;

  const historyContext = chatHistory.length > 0 
    ? `\nPREVIOUS CONVERSATION:\n${chatHistory
        .filter(m => m.type === 'user' || m.type === 'ai')
        .slice(-6) // Last 6 messages for context
        .map(m => `${m.type === 'user' ? 'Student' : 'Coach'}: ${m.content}`)
        .join('\n')}\n`
    : '';

  return `${scenarioInfo}${historyContext}

CURRENT QUESTION: ${message}

INSTRUCTIONS: Provide an educational, engaging response that helps the student understand the trading concepts relevant to their question. Use the scenario context to make your explanation concrete and relevant. If this is part of an ongoing conversation, reference previous topics naturally. Never reveal the "correct" trading decision for this scenario - focus on teaching concepts.`;
}

function formatAnalyzeUserContent(userDecisions, scenario, optimalStrategy) {
  const decisionsText = userDecisions
    .map((d, i) => `Decision ${i + 1}:
  Action: ${d.type.toUpperCase()}
  Price: $${d.price}
  Shares: ${d.shares || 'N/A'}
  Reasoning: "${d.reasoning || 'No reasoning provided'}"
  Timestamp: ${new Date(d.timestamp || Date.now()).toISOString()}`)
    .join('\n\n');

  const optimal = Object.values(optimalStrategy || {})
    .map((s, i) => `Step ${i + 1}:
  Action: ${s.type.toUpperCase()}
  Price: $${s.price}
  Shares: ${s.shares || 'N/A'}
  Reasoning: "${s.reasoning || ''}"`)
    .join('\n\n');

  return `HISTORICAL TRADING SCENARIO ANALYSIS

SCENARIO: ${scenario?.title || 'Unknown'}
CONTEXT: ${scenario?.context || ''}
KEY EVENTS: ${(scenario?.keyEvents || []).join(', ')}
PUZZLE TYPE: ${scenario?.puzzleType || 'unknown'}

STUDENT'S DECISION:
${decisionsText}

REFERENCE STRATEGY (for context - use to understand what factors were most important, but don't copy directly):
${optimal}

ANALYSIS INSTRUCTIONS:
Provide a comprehensive, educational analysis of the student's decision. Focus on:
1. What they did well (be specific)
2. What they could improve (be constructive)
3. The concepts they should learn more about
4. How their reasoning compares to expert thinking
5. Actionable next steps for their learning journey

Remember: This is a learning exercise. Your analysis should help them understand trading better, not just score them. Be encouraging while being thorough. Return ONLY valid JSON in the specified format.`;
}

// Lightweight diagnostics to verify env + Ollama/Gemini connectivity
router.get('/diagnostics', async (req, res, next) => {
  // Diagnostic-only: leaks config (models, key presence, endpoints). Dev-only.
  if (process.env.NODE_ENV === 'production') {
    return next();
  }
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL;
  const result = { 
    baseUrl, 
    model, 
    tagsOk: false, 
    generateOk: false, 
    geminiOk: false, 
    geminiModel: GEMINI_MODEL,
    hasGeminiKey: hasGemini,
    errors: [] 
  };
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
  // Gemini check
  if (hasGemini) {
    try {
      const out = await callGemini({
        systemInstruction: 'You are a health check. Reply with OK.',
        contents: [{ role: 'user', parts: [{ text: 'Please reply with OK.' }] }],
        maxTokens: 5,
        temperature: 0,
        timeout: 15000,
      });
      result.geminiOk = /ok/i.test(out || '');
      result.geminiResponse = out;
    } catch (e) {
      result.errors.push(`gemini: ${e.message}`);
    }
  }
  res.json(result);
});

// Test endpoint to verify which AI is being used
router.get('/test-ai', async (req, res, next) => {
  // Diagnostic-only: leaks config (models, key presence, endpoints). Dev-only.
  if (process.env.NODE_ENV === 'production') {
    return next();
  }
  try {
    const result = {
      hasGemini,
      geminiModel: GEMINI_MODEL,
      geminiEndpoint: GEMINI_ENDPOINT(),
      timestamp: new Date().toISOString()
    };

    if (hasGemini) {
      try {
        const response = await callGemini({
          systemInstruction: 'You are a test endpoint. Reply with your exact model name only.',
          contents: [{ role: 'user', parts: [{ text: 'Identify yourself.' }] }],
          maxTokens: 10,
          temperature: 0,
          timeout: 15000,
        });
        result.aiResponse = response;
        result.success = true;
      } catch (error) {
        result.error = error.message;
        result.success = false;
      }
    } else {
      result.error = 'No Gemini API key found';
      result.success = false;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hasGemini,
      geminiModel: GEMINI_MODEL
    });
  }
});

// AI Coach chat endpoint for educational responses
router.post('/chat', async (req, res) => {
  try {
    const { message, scenario, chatHistory = [] } = req.body;

    if (!message || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'Message and scenario are required'
      });
    }

    if (hasGemini) {
      // Build conversation history for Gemini
      const contents = [];
      
      // Add recent chat history as conversation turns
      if (chatHistory && chatHistory.length > 0) {
        // Include last 8 messages (4 turns) for context
        const recentHistory = chatHistory
          .filter(m => m.type === 'user' || m.type === 'ai')
          .slice(-8);
        
        for (const msg of recentHistory) {
          contents.push({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: formatChatUserContent(message, scenario, chatHistory) }]
      });

      const content = await callGemini({
        systemInstruction: chatSystemPrompt(),
        contents,
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 90000,
      });
      return res.json({ success: true, response: content });
    }

    // No Gemini key configured → graceful demo coaching so the feature still works.
    return res.json({ success: true, response: demoChatResponse(message, scenario), demo: true });
    } catch (error) {
      console.error('[AI-CHAT] Error:', error?.response?.data || error.message);
      
      // More helpful error messages
      let errorMessage = 'AI chat failed';
      let statusCode = 500;
      
      if (error.message.includes('not configured') || error.message.includes('503')) {
        statusCode = 503;
        errorMessage = 'AI chat service is not configured. Please add GEMINI_API_KEY or configure OLLAMA_BASE_URL/OLLAMA_MODEL.';
      } else if (error.message.includes('timeout')) {
        statusCode = 504;
        errorMessage = 'AI chat request timed out. Please try again with a shorter question.';
      } else if (error.message.includes('truncated')) {
        statusCode = 502; // Bad Gateway / Upstream Error
        errorMessage = 'AI response was truncated. Please try asking a more specific question.';
      } else if (error.message.includes('blocked')) {
        statusCode = 400;
        errorMessage = 'AI response was blocked due to content policy. Please try rephrasing your question.';
      } else if (error.message.includes('empty response')) {
        statusCode = 502;
        errorMessage = 'AI service returned an empty response. Please try again.';
      }
      
      const chatErrorResponse = { success: false, error: errorMessage };
      if (process.env.NODE_ENV !== 'production') {
        chatErrorResponse.details = error.message;
      }
      res.status(statusCode).json(chatErrorResponse);
    }
});

// AI Coach endpoint for real AI analysis. Authenticated: the analyzed decision
// is persisted to the user's coach history (see GET /decisions below).
router.post('/analyze', authenticateToken, requireApproved, async (req, res) => {
  try {
    const { userDecisions, scenario, optimalStrategy, scenarioId, scenarioTitle } = req.body;

    if (hasGemini) {
      const content = await callGemini({
        systemInstruction: analyzeSystemPrompt(),
        contents: [{ role: 'user', parts: [{ text: formatAnalyzeUserContent(userDecisions, scenario, optimalStrategy) }] }],
        maxTokens: 1500,
        temperature: 0.5,
        timeout: 120000,
      });
      
      // Enhanced JSON parsing with better error handling
      let parsed;
      try {
        // Try direct parse first
        parsed = JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (codeBlockMatch) {
          try {
            parsed = JSON.parse(codeBlockMatch[1]);
          } catch {
            // Fall through to other extraction methods
          }
        }
        
        // Try to find JSON object in content
        if (!parsed) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch {
              // Fall through to fallback
            }
          }
        }
        
        // If still no valid JSON, use fallback
        if (!parsed) {
          console.warn('[AI-ANALYZE] Failed to parse JSON, using fallback. Content:', content.substring(0, 200));
          parsed = parseFallbackResponse(content, userDecisions, scenario);
        }
      }
      
      // Validate required fields exist and ensure full structure
      if (!parsed || typeof parsed !== 'object') {
        parsed = {};
      }
      
      // 1. Ensure totalScore exists
      if (typeof parsed.totalScore !== 'number') {
        parsed.totalScore = 50;
      }
      
      // 2. Ensure breakdown exists
      if (!parsed.breakdown) {
        parsed.breakdown = {
          decisionQuality: 10,
          timing: 10,
          reasoning: 10,
          riskManagement: 10,
          marketUnderstanding: 10
        };
      }
      
      // 3. Ensure coaching object exists
      if (!parsed.coaching) {
        parsed.coaching = {};
      }
      
      // 4. Ensure all coaching fields exist with safe defaults
      parsed.coaching.overall = parsed.coaching.overall || 'Analysis completed, but detailed feedback is unavailable.';
      parsed.coaching.strengths = Array.isArray(parsed.coaching.strengths) ? parsed.coaching.strengths : ['Decision noted'];
      parsed.coaching.improvements = Array.isArray(parsed.coaching.improvements) ? parsed.coaching.improvements : ['Continue practicing'];
      parsed.coaching.marketPsychology = parsed.coaching.marketPsychology || 'Consider how market sentiment affects price action.';
      parsed.coaching.fundamentals = parsed.coaching.fundamentals || 'Review the fundamental drivers for this asset.';
      parsed.coaching.technicalAnalysis = parsed.coaching.technicalAnalysis || 'Look for key support and resistance levels.';
      parsed.coaching.riskManagement = parsed.coaching.riskManagement || 'Always consider your risk-reward ratio.';
      parsed.coaching.nextSteps = Array.isArray(parsed.coaching.nextSteps) ? parsed.coaching.nextSteps : ['Review the scenario details', 'Try another trade'];
      
      await saveDecision(req, {
        scenarioId,
        scenarioTitle: scenarioTitle || scenario?.title,
        decision: Array.isArray(userDecisions) ? userDecisions[0] : null,
        analysis: parsed,
        demo: false,
      });
      return res.json({ success: true, analysis: parsed });
    }

    // No Gemini key configured → graceful demo analysis so the feature still works.
    const demo = demoAnalysis(userDecisions, scenario);
    await saveDecision(req, {
      scenarioId,
      scenarioTitle: scenarioTitle || scenario?.title,
      decision: Array.isArray(userDecisions) ? userDecisions[0] : null,
      analysis: demo,
      demo: true,
    });
    return res.json({ success: true, analysis: demo, demo: true });
  } catch (error) {
    console.error('[AI-ANALYZE] Error:', error?.response?.data || error.message);
    
    // More helpful error messages
    let errorMessage = 'AI analysis failed';
    let statusCode = 500;
    
    if (error.message.includes('not configured') || error.message.includes('503')) {
      statusCode = 503;
      errorMessage = 'AI analysis service is not configured. Please add GEMINI_API_KEY or configure OLLAMA_BASE_URL/OLLAMA_MODEL.';
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      errorMessage = 'AI analysis request timed out. Please try again.';
    } else if (error.message.includes('blocked')) {
      statusCode = 400;
      errorMessage = 'AI response was blocked due to content policy. Please check your decision reasoning.';
    } else if (error.message.includes('empty response')) {
      statusCode = 502;
      errorMessage = 'AI service returned an empty response. Please try again.';
    }
    
    const analyzeErrorResponse = { success: false, error: errorMessage };
    if (process.env.NODE_ENV !== 'production') {
      analyzeErrorResponse.details = error.message;
    }
    res.status(statusCode).json(analyzeErrorResponse);
  }
});

// Past analyzed decisions for the signed-in user (newest first, capped at
// MAX_SAVED_DECISIONS by the persist step).
router.get('/decisions', authenticateToken, async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const user = await storage.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, decisions: Array.isArray(user.coachDecisions) ? user.coachDecisions : [] });
  } catch (error) {
    console.error('[AI-COACH] decisions error:', error);
    res.status(500).json({ success: false, message: 'Failed to load decision history' });
  }
});

// ── Demo-mode coaching (used when GEMINI_API_KEY is not configured) ──────────
// Provides genuinely useful, on-topic educational responses without an LLM so
// the AI Coach is fully functional out of the box. Responses are flagged with
// `demo: true` so the UI can show a subtle "demo mode" note.
function demoChatResponse(message, scenario) {
  const title = scenario?.title || 'this scenario';
  const msg = (message || '').toLowerCase();
  let topic;
  if (/risk|stop|loss|position siz|how much/.test(msg)) {
    topic = '**Risk management** is about survival first. Size each position so a single bad trade can\'t sink you — many traders risk no more than 1–2% of their account per idea, and decide their exit *before* entering.';
  } else if (/buy|enter|entry|get in/.test(msg)) {
    topic = 'Strong **entries** come from a plan, not a feeling. Wait for confirmation — a level holding, a trend resuming — instead of chasing a move that has already happened.';
  } else if (/sell|exit|take profit|get out|hold/.test(msg)) {
    topic = '**Exits** decide your P&L more than entries do. Define a target and a stop in advance, and consider scaling out so you lock in gains without trying to call the exact top.';
  } else if (/fundamental|earnings|valuation|company/.test(msg)) {
    topic = '**Fundamentals** ask whether the business is actually worth more — earnings, growth, competitive position. They tell you *what* to own; technicals help with *when*.';
  } else if (/technical|chart|pattern|support|resistance|trend/.test(msg)) {
    topic = '**Technical analysis** reads price and volume for clues about supply and demand. Trend, plus support/resistance levels, are the highest-value basics to start with.';
  } else if (/psycholog|fear|greed|emotion|fomo|panic/.test(msg)) {
    topic = '**Trading psychology** is the hidden edge. Fear and greed make people sell bottoms and buy tops — a written plan you commit to in advance is the antidote.';
  } else {
    topic = 'The key is to separate the **decision** from the **outcome**: a sound process can still lose on any single trade, and a reckless one can get lucky. Judge yourself on the process, not the result.';
  }
  return `*(Demo coach — add a \`GEMINI_API_KEY\` on the backend for personalized AI answers.)*\n\n` +
    `On **${title}**: ${topic}\n\n` +
    `A good next step: open the **Learn** section for a short lesson on this, then come back and apply it here. ` +
    `Want to go deeper on entries, exits, or risk?`;
}

function demoAnalysis(userDecisions = [], scenario = null) {
  const decisions = Array.isArray(userDecisions) ? userDecisions : [];
  const reasoned = decisions.filter((d) => d && typeof d.reasoning === 'string' && d.reasoning.trim().length >= 20).length;
  const hasActivity = decisions.length > 0;
  // Heuristic score: rewards making decisions and explaining the reasoning.
  let score = 55;
  if (hasActivity) score += 10;
  if (decisions.length >= 2) score += 10;
  if (reasoned > 0) score += Math.min(20, reasoned * 8);
  score = Math.max(40, Math.min(92, score));
  const part = Math.round(score / 5);
  return {
    totalScore: score,
    breakdown: {
      decisionQuality: part,
      timing: part,
      reasoning: part,
      riskManagement: part,
      marketUnderstanding: score - part * 4,
    },
    coaching: {
      overall: hasActivity
        ? 'You engaged with the scenario and committed to decisions — that\'s how real skill is built. Focus next on making your reasoning explicit before each trade.'
        : 'Try making at least one decision in the scenario, and write a sentence on *why* — the reasoning is where the learning happens.',
      strengths: reasoned > 0 ? ['You explained the thinking behind your trades'] : ['You took part in the scenario'],
      improvements: ['Define your exit and risk *before* entering', 'Tie each decision to the scenario\'s key events'],
      marketPsychology: 'Notice when fear or greed is driving a choice — that awareness alone improves results.',
      fundamentals: 'Ask whether the underlying story (earnings, demand, catalysts) actually changed, or only the price.',
      technicalAnalysis: 'Mark the key support/resistance levels and the prevailing trend before deciding.',
      riskManagement: 'Size positions so no single trade can do serious damage; always know your stop.',
      nextSteps: ['Review a related lesson in Learn', 'Replay the scenario with a written plan', 'Compare your exits to the optimal path'],
    },
    scenarioComparison: scenario
      ? `This scenario was based on real historical events. Your decisions show ${score >= 70 ? 'solid' : 'developing'} grasp of the core trading principles.`
      : '',
  };
}

// Ollama legacy prompts (kept for fallback)
function generateChatPrompt(message, scenario, chatHistory) {
  const historyContext = chatHistory && chatHistory.length > 0
    ? `\nPREVIOUS CONVERSATION:\n${chatHistory
        .filter(m => m.type === 'user' || m.type === 'ai')
        .slice(-6)
        .map(m => `${m.type === 'user' ? 'Student' : 'Coach'}: ${m.content}`)
        .join('\n')}\n`
    : '';

  return `You are Tickr's AI Trading Coach - an expert educator helping students master trading through historical scenarios.

SCENARIO: ${scenario?.title || 'Unknown'}
CONTEXT: ${scenario?.context || ''}
KEY EVENTS: ${(scenario?.keyEvents || []).join(', ')}
${historyContext}
STUDENT'S QUESTION: "${message}"

Your role is to be an educational mentor. Provide:
- Clear explanations of trading concepts
- Real examples from the scenario
- Thought-provoking questions to guide learning
- Practical frameworks for decision-making

You CANNOT:
- Tell them what to buy/sell/hold
- Give specific price targets
- Make predictions
- Give direct investment advice

Provide an engaging, educational response that helps them understand trading better.`;
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

function parseFallbackResponse(aiResponse, userDecisions = null, scenario = null) {
  const scoreMatch = aiResponse.match(/score.*?(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 70; // Default to 70 instead of 50
  
  // Extract key information from the response
  const sections = aiResponse.split('\n\n').filter(s => s.trim().length > 0);
  
  // Try to extract structured information
  const strengths = extractListItems(aiResponse, ['strength', 'good', 'well', 'excellent', 'positive']);
  const weaknesses = extractListItems(aiResponse, ['weakness', 'improve', 'better', 'consider', 'should']);
  const nextSteps = extractListItems(aiResponse, ['next', 'action', 'step', 'recommend', 'suggest']);
  
  return {
    totalScore: score,
    breakdown: {
      decisionQuality: Math.floor(score * 0.2),
      timing: Math.floor(score * 0.2),
      reasoning: Math.floor(score * 0.2),
      riskManagement: Math.floor(score * 0.2),
      marketUnderstanding: Math.floor(score * 0.2)
    },
    coaching: {
      overall: sections[0]?.substring(0, 300) || 'Your decision shows thoughtful consideration. Let\'s explore the key concepts you applied.',
      strengths: strengths.length > 0 ? strengths : ['You took the time to make a reasoned decision'],
      improvements: weaknesses.length > 0 ? weaknesses : ['Consider exploring related trading concepts'],
      marketPsychology: extractSection(aiResponse, 'psychology') || 'Market psychology plays a key role in trading decisions. Emotions like fear and greed can significantly impact outcomes.',
      fundamentals: extractSection(aiResponse, 'fundamental') || 'Fundamental analysis involves evaluating a company\'s financial health, competitive position, and growth prospects.',
      technicalAnalysis: extractSection(aiResponse, 'technical') || 'Technical analysis uses price patterns and indicators to identify potential entry and exit points.',
      riskManagement: extractSection(aiResponse, 'risk') || 'Effective risk management involves position sizing, setting stop losses, and understanding your risk tolerance.',
      nextSteps: nextSteps.length > 0 ? nextSteps : ['Review trading concepts in the Learn section', 'Practice more scenarios', 'Focus on understanding market psychology']
    },
    scenarioComparison: scenario ? `This scenario was based on real historical events. Your decision demonstrates ${score >= 70 ? 'solid' : 'developing'} understanding of trading principles.` : ''
  };
}

function extractListItems(text, keywords) {
  const items = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      // Try to extract list items
      const bulletMatch = line.match(/[-•*]\s*(.+)/);
      if (bulletMatch) {
        items.push(bulletMatch[1].trim());
      } else {
        // Extract sentence after keyword
        const keywordIndex = keywords.findIndex(k => lowerLine.includes(k));
        if (keywordIndex >= 0) {
          const cleanLine = line.replace(/^[^:]*:\s*/, '').trim();
          if (cleanLine.length > 10 && cleanLine.length < 200) {
            items.push(cleanLine);
          }
        }
      }
      if (items.length >= 3) break;
    }
  }
  return items.slice(0, 3);
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
