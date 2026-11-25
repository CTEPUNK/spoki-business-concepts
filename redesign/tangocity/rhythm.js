"use strict";

// One clock drives the pendulum, the click track and the player's eight targets.
(() => {
  const stage=document.querySelector(".rhythm"), tap=byId("beat-tap"), stop=byId("beat-reset");
  const sound=byId("beat-sound"), status=byId("beat-status"), readout=byId("metro-readout");
  const meter=stage.querySelector(".meter-frame"), needle=stage.querySelector(".metro-arm");
  const dance=stage.querySelector(".winning-dance");
  const lamps=[...stage.querySelectorAll(".beat-score span")];
  const interval=750, tolerance=170, countIn=4, total=lamps.length;
  let mode="idle", start=0, frame=0, previousBeat=-1, lastTap=-Infinity, audioVersion=0;
  let mistakes=0, soundOn=true, audio=null;
  const hits=new Set(), activeClicks=new Set();
  function reset() {
    cancelAnimationFrame(frame); frame=0;
    audioVersion++;
    for (const osc of activeClicks) { try {osc.stop();} catch {} }
    activeClicks.clear();
    mode="idle"; hits.clear();mistakes=0;lastTap=-Infinity;previousBeat=-1;
    lamps.forEach(lamp=>lamp.removeAttribute("class"));
    meter.hidden=false;dance.hidden=true;stop.hidden=true;
    stage.removeAttribute("data-ticking");
    needle.style.transform="rotate(-20deg)";
    tap.textContent="Запустить метроном"; status.textContent="80 ударов в минуту";readout.textContent="80 уд/мин";
  }
  async function scheduleAudio(starting=false) {
    const version=++audioVersion;
    if (!soundOn || mode!=="play") return;
    try {
      const Engine=window.AudioContext || window.webkitAudioContext;
      if (!Engine) return;
      audio ||= new Engine();
      if (audio.state!=="running") await audio.resume();
      if (version!==audioVersion || !soundOn || mode!=="play") return;
      const now=performance.now();
      if (starting && now>=start && previousBeat<1) start=now+160;
      const origin=audio.currentTime+(start-now)/1000;
      const first=Math.max(0,Math.ceil((now-start-30)/interval));
      for(let n=first;n<countIn+total;n++) tick(Math.max(audio.currentTime,origin+n*interval/1000),n%4===0);
    } catch { /* The pendulum and beat indicator continue when audio is unavailable. */ }
  }
  function tick(at,accent) {
    const osc=audio.createOscillator(), gain=audio.createGain();
    osc.type="sine";osc.frequency.value=accent?1340:925;
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.16,at+.002);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.055);
    osc.connect(gain).connect(audio.destination);osc.start(at);osc.stop(at+.063);
    activeClicks.add(osc);
    osc.onended=()=>{activeClicks.delete(osc);osc.disconnect();gain.disconnect();};
  }
  function finish() {
    const won=hits.size>=6 && mistakes<=3;
    mode="done";stage.removeAttribute("data-ticking");
    tap.textContent="Сыграть ещё раз";stop.hidden=true;
    const feedback=mistakes>3 ? "Были лишние нажатия. Нажимайте один раз на долю." : "Попробуйте ещё раз и нажимайте вместе с ударами.";
    status.textContent=won ? hits.size+" из 8 в такт. Отличный ритм!" : hits.size+" из 8 в такт. "+feedback;
    readout.textContent=won?"В такт":"80 уд/мин";
    if (won) {
      meter.hidden=true;dance.hidden=false;
    }
  }
  function draw(now) {
    frame=0;
    if (mode==="play") {
      const beat=(now-start)/interval;
      const slot=Math.floor(beat);
      const phase=beat-slot;
      if (!reduceMotion.matches) needle.style.transform="rotate("+(-22*Math.cos(Math.PI*Math.max(0,beat))).toFixed(2)+"deg)";
      stage.toggleAttribute("data-ticking",beat>=0 && phase<.17);
      if (slot!==previousBeat && slot>=0 && slot<countIn+total) {
        previousBeat=slot;
        readout.textContent=slot<countIn?"Вступление · "+(slot+1):"Доля "+(slot-countIn+1)+" из 8";
        if (slot===countIn) status.textContent="Ваш ход. Нажимайте на каждую долю.";
      }
      for(let n=0;n<total;n++) {
        if (!hits.has(n) && now>start+(n+countIn)*interval+tolerance) lamps[n].classList.add("miss");
      }
      if (now>start+(countIn+total-1)*interval+tolerance+70) finish();
    }
    if (mode==="play") frame=requestAnimationFrame(draw);
  }
  function begin() {
    reset();mode="play";start=performance.now()+240;scheduleAudio(true);
    tap.textContent="Отбить долю";stop.hidden=false;status.textContent="Четыре удара для вступления";
    frame=requestAnimationFrame(draw);
  }
  tap.addEventListener("click",()=>{
    if (mode!=="play") { begin();return; }
    const now=performance.now();
    const t=(now-start)/interval-countIn;
    if (t<-.5 || now-lastTap<105) return;
    lastTap=now;
    const n=Math.round(t);
    if(n<0 || n>=total) return;
    const offset=(t-n)*interval;
    if (Math.abs(offset)<=tolerance && !hits.has(n)) {
      hits.add(n);lamps[n].className="hit";status.textContent="В такт · "+hits.size+" из 8";
    } else {
      mistakes++;status.textContent=hits.has(n)?"Один шаг на долю":offset<0?"Чуть рано":"Чуть поздно";
    }
  });
  tap.addEventListener("keydown",e=>{if(e.repeat && (e.key===" " || e.key==="Enter")) e.preventDefault();});
  stop.addEventListener("click",()=>{reset();tap.focus();});
  sound.addEventListener("click",()=>{
    soundOn=!soundOn;sound.setAttribute("aria-pressed",String(soundOn));
    if (soundOn) scheduleAudio();
    else {
      audioVersion++;
      for(const osc of activeClicks) {try{osc.stop();}catch{}}
    }
  });
  function pauseIfPlaying() {if(mode==="play") reset();}
  document.addEventListener("visibilitychange",()=>{if(document.hidden)pauseIfPlaying();});
  window.addEventListener("pagehide",pauseIfPlaying);
  new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)pauseIfPlaying();}).observe(stage);
  byId("beat-controls").hidden=false;
  reset();
})();
