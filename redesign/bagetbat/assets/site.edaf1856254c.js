'use strict';
(() => {
  const materials = JSON.parse(document.querySelector('#materials-data').textContent);
  const defaults = Object.freeze({w:24, h:25, left:4, right:4, top:4, bottom:5, profile:'sea', mat:'sand', fit:'contain'});
  const artwork = 'assets/citrons.a7fe5ca1d069.svg';
  const clamp = (x, min = 0, max = 1) => Math.max(min, Math.min(max, x));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  function attrs(node, values) {
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, value);
  }
  function rectangle(x, y, w, h) { return 'M'+x+' '+y+'h'+w+'v'+h+'h-'+w+'Z'; }
  function geometry(svg, state, imageURL = artwork, sourceSize = {w:360,h:365}) {
    if (!svg) return;
    const profile = materials.profiles.find(item => item.id === state.profile);
    const mat = materials.mats.find(item => item.id === state.mat);
    const left = mat ? state.left : 0, right = mat ? state.right : 0;
    const top = mat ? state.top : 0, bottom = mat ? state.bottom : 0;
    const cm = profile.width / 10;
    const totalW = state.w + left + right + cm * 2;
    const totalH = state.h + top + bottom + cm * 2;
    const model = svg.dataset.frame;
    const layerScene = model === 'layers';
    const scale = Math.min((layerScene ? 266 : 429) / totalW, (layerScene ? 278 : 358) / totalH);
    const W = scale * totalW, H = scale * totalH, face = cm * scale;
    const x = (500 - W)/2, y = (430 - H)/2;
    const wx = x + face + left*scale, wy = y + face + top*scale;
    const windowW = state.w*scale, windowH = state.h*scale;
    const texRatio = {sea:216/70, linen:216/96, cherry:216/33, ink:216/42, sage:216/66}[profile.id];
    const S = sel => svg.querySelector('[data-'+sel+']');
    attrs(S('pattern'),{width:face*texRatio, height:face});
    attrs(S('grain'),{href:'assets/grain-'+profile.id+'.webp',width:face*texRatio,height:face});
    const picBounds = {x:wx,y:wy,width:windowW,height:windowH};
    for (const key of ['clip','paper','bevel']) attrs(S(key),picBounds);
    const factor = (state.fit==='cover' ? Math.max : Math.min)(windowW/sourceSize.w,windowH/sourceSize.h);
    const artWidth=sourceSize.w*factor, artHeight=sourceSize.h*factor;
    attrs(S('picture'),{x:wx+(windowW-artWidth)/2,y:wy+(windowH-artHeight)/2,
      width:artWidth,height:artHeight,href:imageURL,preserveAspectRatio:'xMidYMid meet'});
    const board = rectangle(x+face-.2,y+face-.2,W-2*face+.4,H-2*face+.4)+' '+rectangle(wx,wy,windowW,windowH);
    attrs(S('boardbase'),{d:board,fill:mat?.color || 'transparent'});
    attrs(S('boardink'),{d:board});
    S('board').setAttribute('display', mat?'inline':'none');
    if (mat) S('mat-texture').setAttribute('href','assets/mat-'+mat.id+'.webp');
    const corners = [[x,y,0,W],[x+W,y,90,H],[x+W,y+H,180,W],[x,y+H,270,H]];
    svg.querySelectorAll('[data-rail]').forEach((g,i) => {
      const [sx,sy,angle,length] = corners[i];
      const p = 'M0 0H'+length+'L'+(length-face)+' '+face+'H'+face+'Z';
      g.querySelector('[data-place]').setAttribute('transform','translate('+sx+' '+sy+') rotate('+angle+')');
      g.querySelector('[data-face]').setAttribute('d',p);
      g.querySelector('[data-tone]').setAttribute('d',p);
      g.querySelector('[data-lip]').setAttribute('d','M'+face+' '+face+'H'+(length-face));
    });
    const fmt=x=>Number(x.toFixed(1)).toLocaleString('ru-RU');
    svg.setAttribute('aria-label','Эскиз '+fmt(totalW)+' на '+fmt(totalH)+' см. '+profile.name+(mat?', паспарту '+mat.name:', без паспарту'));
    return {totalW,totalH,profile,mat};
  }
  // Interactive previews use the physical measurements above. The display scenes
  // are already authored as independently movable artwork in the delivered HTML.
  window.Bagetbat = Object.freeze({geometry, materials, defaults, artwork});

  const nativeScroll = CSS.supports('animation-timeline', 'view()') &&
    CSS.supports('animation-range', 'cover 0% cover 100%');
  if (!nativeScroll) {
    let groups = [];
    let renderId = 0;
    let measureId = 0;
    const targets = '.frame-piece,.how-image .frame-pose,.photo-mount,.fan-piece,.preview-ray';
    function render() {
      renderId = 0;
      const y = scrollY;
      for (const group of groups) {
        const progress = clamp((y - group.start) / group.length);
        if (progress === group.last) continue;
        for (const track of group.tracks) track.currentTime = progress * 1000;
        group.last = progress;
      }
    }
    function queueRender() {
      if (groups.length && !renderId) renderId = requestAnimationFrame(render);
    }
    function measure() {
      measureId = 0;
      const height = innerHeight, y = scrollY;
      groups = [];
      if (motion.matches) return;
      for (const surface of document.querySelectorAll('[data-hero-scene],[data-scroll-art]')) {
        const tracks = [...surface.querySelectorAll(targets)].flatMap(el =>
          el.getAnimations().filter(track => track.animationName === 'atelier-position'));
        if (!tracks.length) continue;
        const hero = surface.hasAttribute('data-hero-scene');
        const box = surface.getBoundingClientRect();
        const start = hero ? 0 : box.top + y - height;
        const range = surface.classList.contains('how-image') ? 1 / 1.4 : 1;
        const length = hero ? Math.max(190, height * .48) : (height + box.height) * range;
        groups.push({tracks, start, length});
      }
      render();
    }
    function queueMeasure() {
      if (!measureId) measureId = requestAnimationFrame(measure);
    }
    const resize = new ResizeObserver(queueMeasure);
    for (const area of document.querySelectorAll('body,main > *,[data-scroll-art]')) resize.observe(area);
    addEventListener('scroll', queueRender, {passive: true});
    addEventListener('resize', queueMeasure);
    addEventListener('pageshow', queueMeasure);
    motion.addEventListener('change', queueMeasure);
    document.fonts.ready.then(queueMeasure);
    measure();
  }

  const mounts = {
    hero: ['.hero-object', 13, 8, 9, 13, -3],
    assembly: ['.assembly-surface', 6, 5, 4, 6, 0],
    photo: ['.art-tilt', 6, 4, 5, 7, 0],
    preview: ['.preview-mount', 5, 4, 4, 6, 0],
    sample: ['img', 4, 3, 5, 7, 0],
    mat: ['.mat-sheet', 3, 2, 6, 8, 0],
    fan: ['.fan-rack', 5, 3, 5, 7, 0]
  };
  const heading = 'main h1,main h2,main h3,.control-group > legend';
  const responsiveSurface = heading + ',[data-pointer-art]';
  let owner, visual, pose, pointerX, pointerY, pointerFrame = 0;
  function releasePointer() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    if (visual) visual.style.removeProperty('transform');
    if (owner && !visual) owner.style.removeProperty('--ink-x');
    pointerFrame = 0;
    owner = visual = pose = null;
  }
  function paintPointer() {
    pointerFrame = 0;
    const box = owner.getBoundingClientRect();
    if (!box.width || !box.height) return;
    if (!visual) {
      const inkX = clamp(pointerX - box.left - 16, 0, Math.max(0, box.width - 32));
      owner.style.setProperty('--ink-x', Math.round(inkX) + 'px');
      return;
    }
    const x = clamp(2 * (pointerX - box.left) / box.width - 1, -1, 1);
    const y = clamp(2 * (pointerY - box.top) / box.height - 1, -1, 1);
    const [, dx, dy, rx, ry, rest] = pose;
    visual.style.transform = 'perspective(740px) translate3d(' + (x*dx).toFixed(2) + 'px,' +
      (y*dy).toFixed(2) + 'px,0) rotateX(' + (-y*rx).toFixed(2) + 'deg) rotateY(' +
      (x*ry).toFixed(2) + 'deg) rotate(' + rest + 'deg)';
  }
  function trackPointer(event) {
    if (event.pointerType === 'touch' || event.buttons || motion.matches || !fine.matches) return releasePointer();
    const next = event.target.closest(responsiveSurface);
    if (next !== owner) {
      releasePointer();
      owner = next;
      if (owner?.hasAttribute('data-pointer-art')) {
        pose = mounts[owner.dataset.pointerArt];
        visual = owner.querySelector(pose[0]);
      }
    }
    if (!owner) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
  }
  document.addEventListener('pointermove', trackPointer, {passive: true});
  document.addEventListener('pointerout', event => {
    if (owner && !owner.contains(event.relatedTarget)) releasePointer();
  });
  addEventListener('blur', releasePointer);
  fine.addEventListener('change', releasePointer);
  motion.addEventListener('change', releasePointer);
  const contact=document.querySelector('.contact');
  function placeContact(x=0,y=0) { contact.style.setProperty('--mx',x+'px');contact.style.setProperty('--my',y+'px'); }
  contact.addEventListener('pointermove',ev=>{
    if (ev.pointerType==='touch'||motion.matches||!fine.matches) return;
    const box=contact.getBoundingClientRect();
    placeContact(clamp((ev.clientX-box.left)/box.width*2-1,-1,1)*3,clamp((ev.clientY-box.top)/box.height*2-1,-1,1)*2);
  });
  contact.addEventListener('pointerleave',()=>placeContact());
  motion.addEventListener('change',()=>placeContact());
  const toggle=document.querySelector('.menu-toggle'),menu=document.querySelector('#mobile-nav');
  function closeMenu(restoreFocus=false) {
    menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');
    if(restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click',()=>{
    if(!menu.hidden) {closeMenu();return;}
    menu.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Закрыть меню');
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();closeMenu(true);}});
  document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!e.target.closest('.mobile-nav,.menu-toggle'))closeMenu();});
  document.addEventListener('focusin',e=>{if(!menu.hidden&&!e.target.closest('.mobile-nav,.menu-toggle'))closeMenu();});
  menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  matchMedia('(max-width:740px)').addEventListener('change',()=>closeMenu());
  addEventListener('pageshow',()=>closeMenu());
})();
