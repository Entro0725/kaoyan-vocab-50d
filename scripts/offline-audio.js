/* English pronunciation audio baked into the APK: no Android voice pack needed. */
(() => {
  const ROOT = new URL('./audio/', document.baseURI);
  const pools = new Map();
  let active = null, token = 0, timer = 0, removeMonitor = null, wordIds = null;
  const manifest = fetch(new URL('voice-map.json', ROOT).href, {cache: 'force-cache'})
    .then(response => {
      if (!response.ok) throw new Error('Voice index unavailable: ' + response.status);
      return response.json();
    });
  function stop() {
    token++;
    clearTimeout(timer);
    timer = 0;
    if (removeMonitor) { removeMonitor(); removeMonitor = null; }
    if (active) { active.pause(); active = null; }
  }
  function waitForMetadata(audio) {
    if (audio.readyState >= 1) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const end = () => {
        audio.removeEventListener('loadedmetadata', ready);
        audio.removeEventListener('error', failed);
        clearTimeout(timeout);
      };
      const ready = () => { end(); resolve(); };
      const failed = () => { end(); reject(new Error('Voice audio cannot be opened')); };
      const timeout = setTimeout(() => { end(); reject(new Error('Voice audio timed out')); }, 15000);
      audio.addEventListener('loadedmetadata', ready, {once: true});
      audio.addEventListener('error', failed, {once: true});
      audio.load();
    });
  }
  async function speak(word, accent = 'en-US', rate = 0.88) {
    stop();
    const currentToken = token;
    const index = await manifest;
    if (currentToken !== token) return;
    if (!wordIds) wordIds = new Map((window.__vocab || []).map(x => [x.word, x.id]));
    const id = wordIds.get(String(word));
    if (!id) throw new Error('No built-in pronunciation for word');
    const voice = accent === 'en-GB' ? 'en-GB' : 'en-US';
    const segment = index.voices?.[voice]?.[id-1];
    if (!segment || segment.length !== 3) throw new Error('Missing pronunciation segment');
    const [pack, startMs, endMs] = segment;
    const packKey = voice + ':' + pack;
    let audio = pools.get(packKey);
    if (!audio) {
      audio = new Audio(new URL(voice + '/' + String(pack).padStart(3, '0') + '.mp3', ROOT).href);
      audio.preload = 'metadata';
      pools.set(packKey, audio);
      if (pools.size > 8) {
        const oldest = pools.keys().next().value;
        if (oldest !== packKey) pools.delete(oldest);
      }
    }
    active = audio;
    await waitForMetadata(audio);
    if (currentToken !== token) return;
    const speed = Math.max(0.6, Math.min(1.3, Number(rate) || 0.88));
    audio.playbackRate = speed;
    audio.currentTime = Math.max(0, startMs / 1000);
    const finish = () => {
      if (currentToken !== token) return;
      clearTimeout(timer); timer = 0;
      if (removeMonitor) { removeMonitor(); removeMonitor = null; }
      audio.pause();
      if (active === audio) active = null;
    };
    const monitor = () => { if (audio.currentTime >= (endMs / 1000 - 0.03)) finish(); };
    audio.addEventListener('timeupdate', monitor);
    removeMonitor = () => audio.removeEventListener('timeupdate', monitor);
    try {
      await audio.play();
      if (currentToken !== token) return;
      timer = setTimeout(finish, Math.ceil((endMs - startMs) / speed) + 220);
    } catch (error) {
      if (currentToken !== token) return;
      finish(); throw error;
    }
  }
  window.__kaoyanOfflineSpeech = {supported: true, speak, stop};
})();
