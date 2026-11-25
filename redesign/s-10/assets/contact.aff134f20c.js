(() => {
  'use strict';
  const form=document.getElementById('draft-form'),email=document.getElementById('reply-email'),msg=document.getElementById('draft-message');
  const result=document.getElementById('draft-result'),preview=document.getElementById('draft-preview');
  if(new URL(location.href).searchParams.get('from')==='list')msg.value=S10.spec(S10.readList());
  const fields=[[email,document.getElementById('email-error')],[msg,document.getElementById('message-error')]];
  function error(input){
    if(input===email)return email.value.trim()&&email.validity.valid?'':'Укажите email в формате name@example.ru.';
    return msg.value.trim()?'':'Добавьте текст обращения или список деталей.';
  }
  function validate([input,label]){
    const text=error(input);label.hidden=!text;label.textContent=text;
    if(text)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');
    return !text;
  }
  fields.forEach(pair=>pair[0].addEventListener('input',()=>{if(pair[0].hasAttribute('aria-invalid'))validate(pair);}));
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const bad=fields.filter(pair=>!validate(pair));if(bad.length){bad[0][0].focus();return;}
    preview.textContent=email.value.trim()+'\n\n'+msg.value.trim();
    form.hidden=true;result.hidden=false;result.querySelector('h3').focus();
  });
  document.getElementById('draft-edit').addEventListener('click',()=>{result.hidden=true;form.hidden=false;msg.focus();});
  document.getElementById('draft-new').addEventListener('click',()=>{
    form.reset();email.value='';msg.value='';preview.textContent='';
    fields.forEach(([input,error])=>{input.removeAttribute('aria-invalid');error.hidden=true;error.textContent='';});
    result.hidden=true;form.hidden=false;email.focus();
  });
})();
