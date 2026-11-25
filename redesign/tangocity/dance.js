"use strict";

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
