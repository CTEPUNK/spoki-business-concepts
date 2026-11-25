/* The same garment is folded, turned and spread continuously by the visitor. */
(() => {
  'use strict';
  const canvas = document.querySelector('#skirt');
  if (!canvas) return;

  const vertex = `
    attribute vec3 param;
    uniform vec2 fit;
    uniform vec3 pose;
    varying vec3 normal;
    varying vec3 point;
    varying vec3 uvLayer;

    vec3 turn(vec3 p) {
      float r = -.29 + pose.x * .60 + pose.z * .76;
      float pitch = .23 - pose.y * .12 + pose.z * .10;
      float roll = -.13 + pose.x * .06 - pose.z * .09;
      p = vec3(p.x*cos(r)+p.z*sin(r), p.y, p.z*cos(r)-p.x*sin(r));
      p = vec3(p.x, p.y*cos(pitch)-p.z*sin(pitch), p.z*cos(pitch)+p.y*sin(pitch));
      return vec3(p.x*cos(roll)-p.y*sin(roll), p.y*cos(roll)+p.x*sin(roll), p.z);
    }
    vec3 cloth(float a, float v, float k) {
      float t=v, edge=0., band=0.;
      if(k > .5 && k < 3.5) {
        float j=k-1.;
        t = .53 + j*.137 + v*(.176 + .010*j) + .032*sin(a-.6+j*.28);
        edge = pow(v,1.43);
      } else if (k > 3.5 && k < 4.5) {
        t = .074*v; band=.013;
      } else if (k > 4.5) {
        t=.003; band= -.047*v;
      }
      float lift=pose.z;
      float phase=a*11. + 3.25*t + 1.10*sin(a*2.-t*3.3) + .54*lift*t;
      float ripple=.68*cos(phase) + .26*cos(phase*2. + .75) + .13*sin(5.*a-2.*t);
      float flare=pow(max(0.,t),2.1);
      float r=.315+.16*smoothstep(.02,.23,t)-.035*smoothstep(.25,.43,t)
               + .89*pow(max(0.,(t-.20)/.80),1.75) + .15*lift*flare;
      r+= (.008+.165*flare)*ripple;
      if(k>.5 && k<3.5) r+=.025 + .014*sin(a*4.+k);
      r+= edge*(.105+.078*cos(phase+.65)+.043*sin(a*16.+k)) + band;
      float swing=.31*sin(a+.23) +.12*sin(3.*a-.45)+.074*cos(7.*a+t*4.);
      float y=1.105-2.00*t + flare*swing*(1.+lift*.80);
      y+=edge*(.078*sin(a*13.+k*.65)-.039)+max(0.,k-4.5)*v*.005;
      float twist=.46*t+.48*lift*t*t+.13*sin(t*3.3);
      return vec3(r*sin(a+twist)*(1.+.09*lift*flare)+.19*t*t-.12,
                  y, r*cos(a+twist)*(.74+.12*flare)-.04*t);
    }
    void main() {
      vec3 p=cloth(param.x,param.y,param.z);
      vec3 da=cloth(param.x+.0018,param.y,param.z)-cloth(param.x-.0018,param.y,param.z);
      vec3 dv=cloth(param.x,param.y+.0009,param.z)-cloth(param.x,param.y-.0009,param.z);
      vec3 n=normalize(cross(dv,da));
      point=turn(p);
      normal=turn(n);
      float perspective=1. + point.z*.038;
      vec2 projected=point.xy*perspective + vec2(.105*pose.x,-.060*pose.y+.045);
      gl_Position=vec4(projected*fit, -point.z*.23, 1.);
      uvLayer=param;
    }`;
  const fragment = `
    precision mediump float;
    varying vec3 normal;
    varying vec3 point;
    varying vec3 uvLayer;
    void main(){
      vec3 n=normalize(normal);
      vec3 eye=vec3(0.,0.,1.);
      if(dot(n,eye)<0.) n=-n;
      vec3 key=normalize(vec3(-.66,.70,.47));
      vec3 fill=normalize(vec3(.82,.28,-.05));
      float diffuse=max(dot(n,key),0.);
      float highlight=pow(max(dot(n,normalize(key+eye)),0.),19.);
      float rim=pow(1.-max(dot(n,eye),0.),2.1);
      float layer=uvLayer.z;
      float edge=smoothstep(.961,.998,uvLayer.y);
      float weave=sin(uvLayer.x*235.+uvLayer.y*189.)*.007;
      vec3 ink=vec3(.195,.014,.064);
      vec3 red=vec3(.70,.14,.205);
      vec3 c=ink + red*(.16 + .78*diffuse + .17*max(dot(n,fill),0.));
      c+=vec3(.26,.17,.15)*highlight+vec3(.18,.055,.054)*rim;
      if(layer>.5 && layer<3.5) c*=.76+.24*smoothstep(0.,.31,uvLayer.y);
      if(layer>3.5 && layer<4.5) c*=.80;
      if(layer>4.5) c*=.52;
      c+=weave+edge*vec3(.115,.044,.043);
      gl_FragColor=vec4(c,1.);
    }`;

  function gpu() {
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
    if(!gl) return null;
    const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{
      const shader=gl.createShader(type);
      gl.shaderSource(shader,[vertex,fragment][i]); gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    });
    const program=gl.createProgram();
    shaders.forEach(shader=>gl.attachShader(program,shader)); gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const verts=[],indices=[];
    for(let layer=0;layer<6;layer++){
      const around=176,rows=layer===0?31:layer<4?12:3,base=verts.length/3;
      for(let j=0;j<=rows;j++) for(let i=0;i<=around;i++) {
        verts.push(i/around*Math.PI*2,j/rows,layer);
        if(i<around && j<rows) {
          const idx=base+j*(around+1)+i, below=idx+around+1;
          indices.push(idx,below,idx+1,idx+1,below,below+1);
        }
      }
    }
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
    const attr=gl.getAttribLocation(program,'param'); gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr,3,gl.FLOAT,false,0,0);
    const elements=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    const fit=gl.getUniformLocation(program,'fit'),pose=gl.getUniformLocation(program,'pose');
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0,0,0,0);
    return (w,h,x,y,s)=>{
      gl.viewport(0,0,w,h); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const unit=Math.min(w/4.00,h/2.90);
      gl.uniform2f(fit,unit*2/w,unit*2/h);
      gl.uniform3f(pose,x,y,s); gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    };
  }

  function cpu() {
    const sheet=document.createElement('canvas');
    sheet.setAttribute('aria-hidden','true'); canvas.after(sheet); canvas.hidden=true;
    const ctx=sheet.getContext('2d');
    return (w,h,x,y,s)=>{
      if(sheet.width!==w || sheet.height!==h){sheet.width=w;sheet.height=h;}
      ctx.clearRect(0,0,w,h);
      const unit=Math.min(w/4.00,h/2.90);
      ctx.save();ctx.translate(w*.5+x*unit*.1,h*.49+y*unit*.055);ctx.scale(unit,unit);
      ctx.rotate(.08-.05*x+s*.09);
      const faces=[];
      const point=(a,v,k)=>{
        const t=k===0?v:.50+(k-1)*.156+v*(.193+.018*(k-1))+.042*Math.sin(a-.6+(k-1)*.4);
        const fold=a*10+2.55*t+.44*Math.sin(a*3-t*4);
        const flare=t**2.1;
        const r=.315+.105*Math.sin(Math.min(t*3.4,1.6))+.95*flare+.12*s*flare+(.013+.186*flare)*(.68*Math.cos(fold)+.26*Math.cos(2*fold+.75))+(k?v**1.43*(.097+.066*Math.cos(fold+.8)):0);
        const angle=a-.29+.6*x+.76*s+.26*t+.37*s*t*t;
        const z=r*Math.cos(angle)*(.74+.12*flare);
        return [r*Math.sin(angle)+.19*t*t-.12,-1.105+2*t-flare*(.19*Math.sin(a+.85)+.13*Math.sin(3*a-.45))+.12*z,z];
      };
      for(let k=0;k<4;k++)for(let j=0;j<9;j++)for(let i=0;i<100;i++){
        const a=i*Math.PI/50, b=(i+1)*Math.PI/50;
        const p=[point(a,j/9,k),point(b,j/9,k),point(b,(j+1)/9,k),point(a,(j+1)/9,k)];
        const light=.45+.36*Math.sin(i*.61+k*.27+j*.13+x*.8)+.17*Math.cos(a+.5);
        faces.push([p.reduce((n,pt)=>n+pt[2],0),p,'rgb('+Math.round(97+138*light)+','+Math.round(10+46*light)+','+Math.round(32+52*light)+')']);
      }
      faces.sort((a,b)=>a[0]-b[0]);
      for(const [,p,color] of faces){ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);p.slice(1).forEach(pt=>ctx.lineTo(pt[0],pt[1]));ctx.closePath();ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=.003;ctx.fill();ctx.stroke();}
      ctx.restore();
    };
  }
  const scene=canvas.closest('.garment'),hero=canvas.closest('.hero');
  let paint;
  try{paint=gpu();}catch{paint=null;}
  canvas.dataset.renderer=paint?'webgl':'canvas2d';
  if(!paint) paint=cpu();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  let frame=0,lastFrame=0,px=0,py=0,x=0,y=0,visible=true;
  function draw(now){
    frame=0;
    if(!visible || document.hidden) return;
    const ease=1-Math.exp(-Math.max(8,now-lastFrame)/49);lastFrame=now;
    x+=ease*(px-x); y+=ease*(py-y);
    if(Math.abs(px-x)<.002)x=px;
    if(Math.abs(py-y)<.002)y=py;
    const rect=scene.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.75);
    const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
    const s=reduced.matches?0:Math.min(1,Math.max(0,-hero.getBoundingClientRect().top+hero.offsetTop)/Math.max(150,hero.offsetHeight*.76));
    paint(w,h,reduced.matches?0:x,reduced.matches?0:y,s);
    if(!canvas.dataset.ready)canvas.dataset.ready='true';
    if(px!==x || py!==y)queue();else lastFrame=0;
  }
  function queue(){if(!frame){if(!lastFrame)lastFrame=performance.now()-16;frame=requestAnimationFrame(draw);}}
  function neutral(){px=py=0;queue();}
  function move(e){
    if(!fine.matches||reduced.matches||e.pointerType==='touch') return;
    const b=hero.getBoundingClientRect();
    px=Math.max(-1,Math.min(1,2*(e.clientX-b.left)/b.width-1));
    py=Math.max(-1,Math.min(1,2*(e.clientY-b.top)/b.height-1));queue();
  }
  hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',neutral);
  addEventListener('scroll',queue,{passive:true}); addEventListener('resize',queue);
  document.addEventListener('visibilitychange',queue); reduced.addEventListener('change',neutral);
  new ResizeObserver(queue).observe(scene);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)queue();}).observe(hero);
  canvas.addEventListener('webglcontextlost',e=>e.preventDefault());
  canvas.addEventListener('webglcontextrestored',()=>{paint=gpu()||cpu();queue();}); queue();
})();
