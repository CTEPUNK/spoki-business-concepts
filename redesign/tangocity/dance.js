"use strict";

// Each figure has its own supporting foot and free leg. The same Bézier control
// points connect every drawing, including the return from the last to the first.
const dancePhases = ["Объятие", "Шаг", "Крест", "Очо", "Болео"];
const danceStops = [22, 84, 145, 212, 262, 315, 382];
const poses = [
  { lead:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]], follow:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]] },
  { lead:[[-12,1],[-9,2],[-4,3],[4,4],[13,4],[31,3],[56,0]], follow:[[-11,1],[-10,2],[-7,2],[6,5],[12,5],[17,3],[26,0]],
    raised:[382,255,376,270,363,282,348,296,334,310,317,331,307,348,296,361,291,373,282,376,275,378,271,380,269,383],
    free:[348,293,331,286,315,276,305,265,280,297,236,338,198,360,183,369,172,373,158,377], leadFoot:-65 },
  { lead:[[10,4],[9,4],[6,3],[0,2],[-6,2],[-16,2],[-19,0]], follow:[[11,4],[10,4],[3,5],[-10,2],[-18,0],[-20,1],[-14,0]],
    raised:[382,255,382,268,364,281,345,298,328,313,307,336,293,352,286,361,281,373,275,378,270,381,265,382,258,382],
    free:[343,293,326,283,315,275,305,265,298,303,296,340,304,365,306,371,312,376,321,379], leadFoot:26 },
  { lead:[[-10,-3],[-7,-3],[-9,-2],[-12,0],[-9,-2],[1,-1],[9,0]], follow:[[-10,-2],[-5,-3],[12,-1],[21,1],[24,0],[16,-1],[4,0]],
    raised:[382,255,381,272,371,281,353,298,343,310,355,329,370,343,385,357,401,367,414,375,419,377,423,377,427,376],
    free:[351,300,333,295,319,278,305,265,287,297,270,328,246,354,233,367,215,375,204,379], leadFoot:11 },
  { lead:[[2,-1],[1,0],[6,1],[16,0],[20,-2],[23,0],[21,0]], follow:[[1,0],[1,0],[3,-2],[9,-5],[12,-4],[9,0],[5,0]],
    raised:[382,255,387,267,399,278,405,285,416,299,433,284,448,264,459,249,467,232,476,226,480,223,484,224,487,226],
    free:[411,296,377,297,337,278,305,265,295,298,284,331,264,357,254,369,240,377,228,380], leadFoot:-20 }
];

function danceArtist(svg) {
  const splines = [...svg.querySelectorAll("[data-line]")].map(el => {
    const line = el.dataset.line;
    const rest = el.getAttribute("d").match(/-?[\d.]+/g).map(Number);
    const frames = poses.map(pose => {
      const points = line === "follow-raised" && pose.raised || line === "follow-leg" && pose.free || rest;
      const bend = pose[line.startsWith("lead") ? "lead" : "follow"];
      return points.map((value,i) => {
        const y = points[i - i%2 + 1];
        let k = 0;
        while (k < danceStops.length-2 && y > danceStops[k+1]) k++;
        const t = Math.max(0, Math.min(1,(y-danceStops[k])/(danceStops[k+1]-danceStops[k])));
        const axis = i%2;
        let extra=0;
        if (!axis && line==="lead-leg") extra=(pose.leadFoot || 0)*Math.max(0,(y-230)/150);
        if (!axis && line==="follow-hair") extra=bend[3][0]*Math.max(0,(y-105)/82);
        return value + bend[k][axis]*(1-t) + bend[k+1][axis]*t + extra;
      });
    });
    return {el,frames};
  });
  return position => {
    const x = ((position % poses.length) + poses.length) % poses.length;
    const index = Math.floor(x);
    const f = x-index;
    const ratio = f*f*(3-2*f);
    for (const {el,frames} of splines) {
      const a=frames[index], b=frames[(index+1)%frames.length];
      const p=a.map((n,i)=>(n+(b[i]-n)*ratio).toFixed(2));
      el.setAttribute("d","M"+p[0]+" "+p[1]+" C"+p.slice(2).join(" "));
    }
  };
}

(() => {
  const hero=document.querySelector(".hero");
  const artist=danceArtist(hero.querySelector(".dance-drawing"));
  const controls=hero.querySelector(".phase-controls"), title=controls.querySelector("output");
  controls.hidden=false;
  let current=0, target=0, raf=0, last=0, pointerStart=null;
  function paint(){
    artist(current);
    const phase=((Math.round(current)%poses.length)+poses.length)%poses.length;
    title.value=dancePhases[phase];
  }
  function frame(now) {
    raf=0;
    current+=(target-current)*(1-Math.exp(-Math.min(64,now-last)/104));
    last=now;
    if (Math.abs(current-target)<.002) current=target;
    paint();
    if (current!==target) raf=requestAnimationFrame(frame);
  }
  function aim(value, manual=false) {
    if (reduceMotion.matches) {
      if (manual) {current=target=value; paint();}
      return;
    }
    target=value;
    if (!raf && current!==target) {last=performance.now();raf=requestAnimationFrame(frame);}
  }
  function scrub(value) {
    aim(value+Math.round((current-value)/poses.length)*poses.length);
  }
  hero.addEventListener("pointerenter",e=>{
    if (e.pointerType!=="mouse" || !finePointer.matches) return;
    pointerStart={x:e.clientX, y:e.clientY};
    if (!document.elementFromPoint(e.clientX,e.clientY)?.closest(".phase-controls")) aim(Math.floor(current+.1)+1);
  });
  hero.addEventListener("pointermove",e=>{
    if (!pointerStart || e.pointerType!=="mouse" || e.target.closest(".phase-controls")) return;
    if (Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<5) return;
    const box=hero.getBoundingClientRect();
    scrub(Math.max(0,Math.min(4,(e.clientX-box.left)/box.width*4)));
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{pointerStart=null;});
  function scrollPose() {
    const rect=hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top>innerHeight) return;
    const sticky=document.querySelector(".site-header").getBoundingClientRect().height;
    scrub(Math.min(4,Math.max(0,(sticky-rect.top)/(rect.height*.76)*4)));
  }
  window.addEventListener("scroll",scrollPose,{passive:true});
  if (window.scrollY>0) scrollPose();
  window.addEventListener("pageshow",e=>{if(e.persisted)scrollPose();});
  controls.addEventListener("click",e=>{
    const button=e.target.closest("[data-phase-step]");
    if (button) aim(Math.round(target)+Number(button.dataset.phaseStep),true);
  });
  reduceMotion.addEventListener("change",()=>{
    if (reduceMotion.matches) {cancelAnimationFrame(raf);raf=0;current=target=Math.round(current);paint();}
  });
})();


// A supporting foot stays planted while its partner advances to the next
// contact. The complete state is a function of scroll position in both directions.
(() => {
  const svg=document.querySelector(".first-trail"), line=svg.querySelector(".walk-line");
  const history=svg.querySelector(".walk-history"), feet=svg.querySelector(".walk-feet");
  const length=line.getTotalLength(), count=14;
  const ns="http://www.w3.org/2000/svg";
  const clamp=x=>Math.max(0,Math.min(1,x));
  function shoe(parent) {
    const g=document.createElementNS(ns,"g"), use=document.createElementNS(ns,"use");
    use.setAttribute("href","./assets/ui.svg?v=3#heel");use.setAttribute("x","-3.1");use.setAttribute("y","-6.5");
    use.setAttribute("width","6.2");use.setAttribute("height","13");
    g.append(use);parent.append(g);return g;
  }
  function place(g,step,side,lift=0) {
    const u=clamp(step/count)*length,p=line.getPointAtLength(u);
    const a=line.getPointAtLength(Math.max(0,u-1)),b=line.getPointAtLength(Math.min(length,u+1));
    const angle=Math.atan2(b.y-a.y,b.x-a.x), offset=side*(4.2+lift);
    const x=p.x-Math.sin(angle)*offset,y=p.y+Math.cos(angle)*offset;
    g.setAttribute("transform","translate("+x.toFixed(2)+" "+y.toFixed(2)+") rotate("+(angle*180/Math.PI+90).toFixed(2)+") scale("+side+" 1)");
  }
  const stamps=Array.from({length:count+1},(_,i)=>{const g=shoe(history);place(g,i,i%2?1:-1);return g;});
  const pair=[shoe(feet),shoe(feet)];
  let raf=0;
  function draw(){
    raf=0;const top=svg.getBoundingClientRect().top;
    const progress=reduceMotion.matches?1:clamp((innerHeight*.94-top)/(innerHeight*.68));
    const distance=progress*count, n=Math.floor(distance), f=distance-n;
    const lastSide=n%2, moving=1-lastSide;
    line.style.strokeDashoffset=String(1-progress);
    stamps.forEach((g,i)=>{g.style.opacity=i<distance-.65?".56":"0";});
    place(pair[lastSide],n,lastSide?1:-1);
    place(pair[moving],Math.max(0,n-1)+Math.min(n,1)*f+f,moving?1:-1,Math.sin(f*Math.PI)*2);
    svg.dataset.step=String(n);
  }
  function queue(){if(!raf)raf=requestAnimationFrame(draw);}
  window.addEventListener("scroll",queue,{passive:true});window.addEventListener("resize",queue);
  window.addEventListener("load",queue);reduceMotion.addEventListener("change",queue);queue();
})();
