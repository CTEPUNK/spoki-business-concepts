(() => {
  'use strict';
  const {data,escape:html,icon}=S10;
  const input=document.getElementById('cat-search'),results=document.getElementById('cat-results');
  const status=document.getElementById('cat-status'),more=document.getElementById('cat-more'),reset=document.getElementById('cat-reset');
  const byId=new Map(data),children=new Map();
  const parent=id=>id.slice(0,Math.max(0,id.lastIndexOf('.')));
  for(const [id,label] of data) {
    const p=parent(id);if(!children.has(p))children.set(p,[]);
    children.get(p).push([id,label]);
  }
  const featured=['29491','21826','23405','25057'];
  const roots=children.get('').slice().sort((a,b)=>{
    const rank=id=>featured.includes(id)?featured.indexOf(id):featured.length;
    return rank(a[0])-rank(b[0])||a[1].localeCompare(b[1],'ru');
  });
  const url=id=>'https://s-10mitino.ru/s-10/categories/?cat='+id+'&amp;page=1';
  const link=(id,title)=>'<a class="textlink" href="'+url(id)+'">'+html(title)+icon('arrow')+'</a>';
  function tree([id,title]){
    if(!children.has(id))return '<div class="cat-leaf" data-cursor-surface="rule">'+link(id,title)+'</div>';
    return '<details class="cat-row" data-branch="'+id+'"><summary data-cursor-surface="rule">'+html(title)+icon('chev')+'</summary><div class="cat-options"></div></details>';
  }
  results.addEventListener('toggle',e=>{
    const branch=e.target;
    if(!branch.matches?.('details[data-branch]')||!branch.open)return;
    const box=branch.querySelector('.cat-options'),id=branch.dataset.branch;
    if(!box.childElementCount)box.innerHTML=link(id,'Ассортимент раздела в S-10')+children.get(id).map(tree).join('');
  },true);
  function trail(id){
    const nodes=id.split('.');nodes.pop();
    return nodes.map((_,i)=>byId.get(nodes.slice(0,i+1).join('.'))).filter(Boolean).join(' / ');
  }
  let limit=12;
  function display() {
    const q=input.value.trim().toLocaleLowerCase('ru');
    reset.hidden=!q;
    const rows=q?data.filter(([id,label])=>label.toLocaleLowerCase('ru').includes(q)||id===q):roots;
    status.textContent=q?'Найдено разделов: '+rows.length:'Основных разделов: '+roots.length;
    if(!rows.length){
      results.innerHTML='<div class="cat-empty"><h3>Категория не найдена</h3><p>Попробуйте название группы, например «диоды» или «конденсаторы».</p></div>';
    }else{
      results.innerHTML=rows.slice(0,limit).map(row=>q?'<div class="cat-hit" data-cursor-surface="rule"><small>'+html(trail(row[0]))+'</small>'+link(row[0],row[1])+'</div>':tree(row)).join('');
    }
    more.hidden=limit>=rows.length;
    more.textContent='Показать ещё '+Math.min(12,Math.max(0,rows.length-limit));
  }
  input.addEventListener('input',()=>{limit=12;display();});
  reset.addEventListener('click',()=>{input.value='';limit=12;display();input.focus();});
  more.addEventListener('click',()=>{const before=limit;limit+=12;display();results.children[before]?.querySelector('summary,a')?.focus();});
  display();
})();
