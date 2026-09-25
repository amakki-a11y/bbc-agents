// One-time page: grants the extension microphone access so the
// offscreen document can use it later without a prompt.
const result = document.getElementById('result');
navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
        stream.getTracks().forEach(t => t.stop());
        result.className = 'ok';
        result.textContent = 'Done. The agent can hear you now. You can close this tab.';
    })
    .catch((error) => {
        result.className = 'err';
        result.textContent = `Microphone blocked (${error.message}). Allow it from the lock icon in the address bar, then reload this page.`;
    });
