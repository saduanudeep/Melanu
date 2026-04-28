/* ===== Melanu Technologies — Shared JS ===== */

const SUPABASE_URL = 'https://jafigtmdqbaksizmjoyd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1AZMRvkgLqjWefuDK2k6Yg_jTKpJgU4';

const WHATSAPP_PRIMARY = '917989269904';
const WHATSAPP_SECONDARY = '919910550878';

// AI Chatbot endpoint - this is your Cloudflare Worker URL (set this AFTER deploying the worker)
const AI_CHAT_URL = 'https://melanu-chatbot.saduanudeep.workers.dev';

// Conversation history for AI context
let chatHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initContactForm();
  initChatbot();
  initCarousels();
});

/* ===== Navigation ===== */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle) toggle.addEventListener('click', () => links.classList.toggle('open'));

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
}

/* ===== Contact form: Supabase + WhatsApp redirect ===== */
function initContactForm() {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgEl = document.getElementById('formMsg');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      company: form.company.value.trim(),
      sector: form.sector.value,
      message: form.message.value.trim(),
      created_at: new Date().toISOString()
    };

    let saved = false;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/enquiries`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
      saved = res.ok;
    } catch (err) { console.error('Supabase error:', err); }

    msgEl.className = 'form-msg success';
    msgEl.textContent = saved
      ? '✓ Enquiry submitted! Redirecting to WhatsApp...'
      : '✓ Redirecting to WhatsApp to complete your enquiry...';

    const waMsg = encodeURIComponent(
      `Hello Melanu Technologies,\n\n` +
      `*Name:* ${data.name}\n` +
      `*Email:* ${data.email}\n` +
      `*Phone:* ${data.phone}\n` +
      `*Company:* ${data.company || 'N/A'}\n` +
      `*Sector:* ${data.sector || 'General'}\n\n` +
      `*Message:*\n${data.message}`
    );

    setTimeout(() => {
      window.open(`https://wa.me/${WHATSAPP_PRIMARY}?text=${waMsg}`, '_blank');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Enquiry';
    }, 1200);
  });
}

/* ===== AI Chatbot ===== */
function initChatbot() {
  const botBtn = document.getElementById('botBtn');
  const chatbot = document.getElementById('chatbot');
  const closeBtn = document.getElementById('chatbotClose');
  const sendBtn = document.getElementById('chatSend');
  const inputEl = document.getElementById('chatInput');
  if (!botBtn || !chatbot) return;

  botBtn.addEventListener('click', () => {
    chatbot.classList.add('open');
    botBtn.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    chatbot.classList.remove('open');
    botBtn.style.display = 'flex';
  });

  // Quick reply buttons
  document.querySelectorAll('.chat-quick button').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent;
      sendUserMessage(text);
    });
  });

  // Input + send
  if (sendBtn && inputEl) {
    sendBtn.addEventListener('click', () => {
      const text = inputEl.value.trim();
      if (text) {
        sendUserMessage(text);
        inputEl.value = '';
      }
    });
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const text = inputEl.value.trim();
        if (text) {
          sendUserMessage(text);
          inputEl.value = '';
        }
      }
    });
  }
}

function addBotMessage(text, isUser = false) {
  const body = document.querySelector('.chatbot-body');
  if (!body) return null;
  const msg = document.createElement('div');
  msg.className = `chat-msg ${isUser ? 'user' : 'bot'}`;
  msg.innerHTML = `<div class="bubble">${text}</div>`;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
  return msg;
}

function showTyping() {
  const body = document.querySelector('.chatbot-body');
  if (!body) return null;
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot typing-msg';
  msg.innerHTML = `<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
  return msg;
}

async function sendUserMessage(text) {
  addBotMessage(text, true);
  chatHistory.push({ role: 'user', content: text });

  const typingEl = showTyping();

  // Try to call AI worker first
  let reply = null;
  try {
    const res = await fetch(AI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    if (res.ok) {
      const data = await res.json();
      reply = data.reply;
    }
  } catch (err) {
    console.warn('AI chat unavailable, using fallback:', err);
  }

  // Fallback to rule-based if AI unavailable
  if (!reply) reply = getFallbackReply(text);

  if (typingEl) typingEl.remove();
  addBotMessage(reply);
  chatHistory.push({ role: 'assistant', content: reply });

  // Keep history short
  if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);
}

function getFallbackReply(text) {
  const t = text.toLowerCase();
  if (/whatsapp|chat now/.test(t)) {
    setTimeout(() => window.open(`https://wa.me/${WHATSAPP_PRIMARY}?text=${encodeURIComponent('Hello Melanu Technologies, I have an enquiry.')}`, '_blank'), 500);
    return 'Opening WhatsApp now... 💬';
  }
  if (/call|phone/.test(t)) {
    return 'You can call us at:<br>📞 <a href="tel:+917989269904">+91 79892 69904</a><br>📞 <a href="tel:+919910550878">+91 99105 50878</a>';
  }
  if (/email|mail/.test(t)) {
    return 'Email us at:<br>📧 <a href="mailto:sales@melanu.in">sales@melanu.in</a><br>📧 <a href="mailto:purchase@melanu.in">purchase@melanu.in</a><br>📧 <a href="mailto:info@melanu.in">info@melanu.in</a>';
  }
  if (/product|catalog|component|part/.test(t)) {
    return 'We supply <b>semiconductors</b> (diodes, MOSFETs, ICs), <b>passives</b> (resistors, capacitors, inductors), <b>EV components</b> (BMS, power modules), <b>aerospace</b> (MIL-spec connectors), <b>automobile</b> (sensors, ECUs), and <b>robotics</b> (servos, controllers). <a href="products.html">View catalog →</a>';
  }
  if (/quote|price|cost|bom/.test(t)) {
    return 'For a quotation, please <a href="contact.html">fill our enquiry form</a> or WhatsApp us at <a href="https://wa.me/917989269904" target="_blank">+91 79892 69904</a>. We respond within 24 hours.';
  }
  if (/sector|industry/.test(t)) {
    return 'We serve <b>5 core sectors:</b> Semiconductor manufacturing, Aerospace & Defense, Electric Vehicles, Automobile, and Robotics & Automation.';
  }
  if (/automobile|car|auto/.test(t)) {
    return 'Yes! We supply automotive-grade components: <b>ECUs, sensors, ADAS modules, infotainment chips, and AEC-Q100 qualified parts</b> for OEMs and Tier-1 suppliers.';
  }
  if (/about|who|company/.test(t)) {
    return 'Melanu Technologies Pvt Ltd is a global trader and supplier of mission-critical electronic components serving semiconductor, EV, aerospace, automobile, and robotics industries. <a href="about.html">Learn more →</a>';
  }
  if (/hi|hello|hey/.test(t)) {
    return 'Hello! 👋 I can help with product info, quotes, sectors we serve, or contact details. What do you need?';
  }
  return 'Thanks! For detailed assistance, please <a href="contact.html">submit an enquiry</a> or message us on <a href="https://wa.me/917989269904" target="_blank">WhatsApp</a>.';
}

/* ===== Image Carousel ===== */
function initCarousels() {
  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    let current = 0;
    const total = slides.length;

    // Build dots
    if (dotsContainer) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => go(i));
        dotsContainer.appendChild(dot);
      });
    }

    function go(idx) {
      current = (idx + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      carousel.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => go(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(current + 1));

    // Auto-advance every 5s
    let auto = setInterval(() => go(current + 1), 5000);
    carousel.addEventListener('mouseenter', () => clearInterval(auto));
    carousel.addEventListener('mouseleave', () => auto = setInterval(() => go(current + 1), 5000));
  });
}
