const form = document.getElementById('composer');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const presets = document.querySelectorAll('.preset');

function addMessage(text, who = 'alien') {
  const el = document.createElement('div');
  el.className = 'msg ' + (who === 'user' ? 'user' : 'alien');
  el.innerText = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

presets.forEach(btn => {
  btn.addEventListener('click', () => {
    input.value = btn.dataset.prompt;
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const prompt = input.value.trim();
  if (!prompt) return;

  // Show user message and "thinking" indicator
  addMessage(prompt, 'user');
  input.value = '';
  const thinkingEl = addMessage('… probing cosmic synapses …', 'alien');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        maxOutputTokens: 512 // default value, no token selector needed
      })
    });

    const raw = await res.text();

    if (thinkingEl && thinkingEl.parentNode) thinkingEl.remove();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }

    if (!res.ok) {
      const errMsg = data?.message || '⚠️ Cosmic turbulence detected.';
      addMessage('Error: ' + errMsg, 'alien');
      return;
    }

    const reply =
      (data && (data.message || data?.raw?.candidates?.[0]?.content?.parts?.[0]?.text)) ?
      (data.message || (data.raw?.candidates?.[0]?.content?.parts?.[0]?.text || '')).trim() :
      raw.trim();

    addMessage(reply || '[👽 static noise… no transmission]', 'alien');
  } catch (err) {
    if (thinkingEl && thinkingEl.parentNode) thinkingEl.remove();
    console.error(err);
    addMessage('💥 Network or server error: ' + err.message, 'alien');
  }
});
