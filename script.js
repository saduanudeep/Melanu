/* ===== Melanu Technologies — Shared JS ===== */

// Supabase config
const SUPABASE_URL = 'https://jafigtmdqbaksizmjoyd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1AZMRvkgLqjWefuDK2k6Yg_jTKpJgU4';

// WhatsApp number (primary)
const WHATSAPP_PRIMARY = '917989269904';
const WHATSAPP_SECONDARY = '919910550878';

/* ===== Mobile nav toggle ===== */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }

  // Highlight active nav
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  initChatbot();
  initContactForm();
});

/* ===== Contact form: save to Supabase + WhatsApp redirect ===== */
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

    // Save to Supabase
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
      if (!res.ok) {
        const errText = await res.text();
        console.warn('Supabase response:', res.status, errText);
      }
    } catch (err) {
      console.error('Supabase error:', err);
    }

    // Show message
    if (saved) {
      msgEl.className = 'form-msg success';
      msgEl.textContent = '✓ Enquiry submitted! Redirecting to WhatsApp...';
    } else {
      msgEl.className = 'form-msg success';
      msgEl.textContent = '✓ Redirecting to WhatsApp to complete your enquiry...';
    }

    // Build WhatsApp message
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
  if (!botBtn || !chatbot) return;

  botBtn.addEventListener('click', () => {
    chatbot.classList.add('open');
    botBtn.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    chatbot.classList.remove('open');
    botBtn.style.display = 'flex';
  });

  // Quick reply handlers
  document.querySelectorAll('.chat-quick button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleBotAction(action, btn.textContent);
    });
  });
}

function addBotMessage(text, isUser = false) {
  const body = document.querySelector('.chatbot-body');
  if (!body) return;
  const msg = document.createElement('div');
  msg.className = `chat-msg ${isUser ? 'user' : 'bot'}`;
  msg.innerHTML = `<div class="bubble">${text}</div>`;
  body.appendChild(msg);
  body.scrollTop = body.scrollHeight;
}

function handleBotAction(action, label) {
  addBotMessage(label, true);
  setTimeout(() => {
    let reply = '';
    switch (action) {
      case 'products':
        reply = 'We supply: <b>Semiconductors</b> (diodes, MOSFETs, transistors), <b>Passives</b> (resistors, capacitors, inductors), <b>EV components</b> (BMS, power modules), <b>Aerospace</b> (MIL-spec connectors), <b>Robotics</b> (servos, actuators, controllers). <a href="products.html">View catalog →</a>';
        break;
      case 'quote':
        reply = 'For a quotation, please <a href="contact.html">fill our enquiry form</a> or WhatsApp us at <a href="https://wa.me/917989269904" target="_blank">+91 79892 69904</a>';
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${WHATSAPP_PRIMARY}?text=${encodeURIComponent('Hello Melanu Technologies, I have an enquiry.')}`, '_blank');
        reply = 'Opening WhatsApp...';
        break;
      case 'sectors':
        reply = 'We serve <b>4 core sectors:</b> Semiconductor manufacturing, Aerospace & Defense, Electric Vehicles, and Robotics & Automation.';
        break;
      case 'contact':
        reply = '📧 sales@melanu.in<br>📞 +91 79892 69904<br>📞 +91 99105 50878<br><a href="contact.html">Full contact page →</a>';
        break;
      default:
        reply = 'Thanks! Please use the enquiry form or WhatsApp for detailed support.';
    }
    addBotMessage(reply);
  }, 600);
}
