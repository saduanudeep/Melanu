// ============================================================
// Melanu Technologies - AI Chatbot Cloudflare Worker
// ============================================================
// Deploy this to Cloudflare Workers (free tier)
// Set ANTHROPIC_API_KEY as an environment variable (not in code)
// ============================================================

const SYSTEM_PROMPT = `You are the official AI assistant for Melanu Technologies Pvt Ltd, a global trader and supplier of electronic components.

COMPANY INFO:
- Melanu Technologies is a strategic global sourcing partner
- We serve 5 sectors: Semiconductors, Electric Vehicles, Aerospace & Defense, Automobile, Robotics & Automation
- Products: diodes, rectifiers, MOSFETs, transistors, ICs, resistors, capacitors, inductors, BMS, power modules, MIL-spec connectors, ECUs, sensors, servos, robotic controllers
- 500+ component lines, 25+ countries served, 24-hour quote response

CONTACT:
- Sales: sales@melanu.in
- Purchase: purchase@melanu.in
- Info: info@melanu.in
- Phone/WhatsApp: +91 79892 69904, +91 99105 50878
- Website pages: index.html (home), products.html, about.html, contact.html

RULES:
- Be professional, concise, and friendly
- Keep responses under 80 words
- For quotes, BOMs, or specific part numbers, direct users to the enquiry form (contact.html) or WhatsApp
- Use simple HTML tags only: <b>, <a>, <br>
- Never make up part numbers, prices, or specifications
- If asked something off-topic, politely redirect to electronics/sourcing topics
- Always recommend our official channels for serious enquiries`;

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages } = await request.json();

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return jsonResponse({ error: 'Invalid messages' }, 400);
      }

      // Call Anthropic API
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: messages.slice(-10) // last 10 messages for context
        })
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        console.error('Anthropic API error:', errText);
        return jsonResponse({ error: 'AI service unavailable' }, 502);
      }

      const data = await anthropicRes.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not process that.';

      return jsonResponse({ reply });
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal error' }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
