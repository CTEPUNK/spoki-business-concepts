"use strict";

// One clock drives the pendulum, the click track and the player's eight targets.
(() => {
  const stage=document.querySelector(".rhythm"), tap=byId("beat-tap"), stop=byId("beat-reset");
  const sound=byId("beat-sound"), status=byId("beat-status"), readout=byId("metro-readout");
  const meter=stage.querySelector(".meter-frame"), needle=stage.querySelector(".metro-arm");
  const dance=stage.querySelector(".winning-dance"), pose=danceArtist(dance.querySelector("svg"));
  const lamps=[...stage.querySelectorAll(".beat-score span")];
  const interval=750, tolerance=170, countIn=4, total=lamps.length;
  let mode="idle", start=0, nextClick=0, frame=0, previousBeat=-1, finishAt=0, lastTap=-Infinity;
  let mistakes=0, soundOn=true, audio=null;
  const hits=new Set(), activeClicks=new Set();
  function reset() {
    cancelAnimationFrame(frame); frame=0;
    for (const osc of activeClicks) { try {osc.stop();} catch {} }
    activeClicks.clear();
    mode="idle"; hits.clear();mistakes=0;lastTap=-Infinity;previousBeat=-1;
    lamps.forEach(lamp=>lamp.removeAttribute("class"));
    meter.hidden=false;dance.hidden=true;stop.hidden=true;
    stage.removeAttribute("data-ticking");
    needle.style.transform="rotate(-20deg)";
    tap.textContent="Запустить метроном"; status.textContent="80 ударов в минуту";readout.textContent="80 уд/мин";
  }
  function enableAudio() {
    if (!soundOn) return;
    try {
      const Engine=window.AudioContext || window.webkitAudioContext;
      if (!Engine) return;
      audio ||= new Engine();
      if (audio.state==="suspended") audio.resume().catch(()=>{});
    } catch { audio=null; }
  }
  function tick(time,accent) {
    if (!soundOn || audio?.state!=="running") return;
    const osc=audio.createOscillator(), gain=audio.createGain();
    const at=audio.currentTime+Math.max(0,(time-performance.now())/1000);
    osc.type="sine";osc.frequency.value=accent?1340:925;
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.16,at+.002);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.055);
    osc.connect(gain).connect(audio.destination);osc.start(at);osc.stop(at+.063);
    activeClicks.add(osc);
    osc.onended=()=>{activeClicks.delete(osc);osc.disconnect();gain.disconnect();};
  }
  function finish(now) {
    const won=hits.size>=6 && mistakes<=3;
    mode=won?"dance":"done";finishAt=now;stage.removeAttribute("data-ticking");
    tap.textContent="Сыграть ещё раз";stop.hidden=true;
    const feedback=mistakes>3 ? "Были лишние нажатия. Нажимайте один раз на долю." : "Попробуйте ещё раз и нажимайте вместе с ударами.";
    status.textContent=won ? hits.size+" из 8 в такт. Пара танцует!" : hits.size+" из 8 в такт. "+feedback;
    readout.textContent=won?"Танец":"80 уд/мин";
    if (won) {
      meter.hidden=true;dance.hidden=false;pose(reduceMotion.matches?3:0);
    }
  }
  function draw(now) {
    frame=0;
    if (mode==="play") {
      const beat=(now-start)/interval;
      while(nextClick<countIn+total && start+nextClick*interval<=now+105) {
        const when=start+nextClick*interval;
        if (when>=now-40) tick(when,nextClick%4===0);
        nextClick++;
      }
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
      if (now>start+(countIn+total-1)*interval+tolerance+70) finish(now);
    }
    if (mode==="dance") {
      const beats=(now-finishAt)/interval;
      if (!reduceMotion.matches) pose(Math.min(5,beats*5/8));
      if (reduceMotion.matches || beats>=8) mode="done";
    }
    if (mode==="play" || mode==="dance") frame=requestAnimationFrame(draw);
  }
  function begin() {
    reset();enableAudio();mode="play";start=performance.now()+240;nextClick=0;
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
    if (soundOn) enableAudio();
    else for(const osc of activeClicks) {try{osc.stop();}catch{}}
  });
  function pauseIfPlaying() {if(mode==="play" || mode==="dance") reset();}
  document.addEventListener("visibilitychange",()=>{if(document.hidden)pauseIfPlaying();});
  window.addEventListener("pagehide",pauseIfPlaying);
  new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)pauseIfPlaying();}).observe(stage);
  byId("beat-controls").hidden=false;
  reset();
})();
