window.AuthUI = (()=>{
 const {esc}=U;
 const input=(label,name,type='text',extra='')=>`<label class="field"><span>${label}</span><input class="input" name="${name}" type="${type}" ${extra} required></label>`;
 const layouts={
  login:{title:'Welcome back',desc:'Sign in to continue improving your community.',fields:input('Email address','email','email','autocomplete="email"')+input('Password','password','password','autocomplete="current-password"'),submit:'Sign in',links:[['signup','Create an account'],['forgot','Forgot password?']]},
  signup:{title:'Join the movement',desc:'Create a citizen account to submit and track reports.',fields:input('Full name','name','text','autocomplete="name" maxlength="100"')+input('Email address','email','email','autocomplete="email"')+input('Password','password','password','autocomplete="new-password" minlength="10"')+'<p class="panel-note">At least 10 characters including upper/lowercase letters, a number and a symbol.</p><label class="checkbox-row"><input type="checkbox" name="accept" required> I agree to the <a href="#terms" data-modal-nav>terms</a> and have read the <a href="#privacy" data-modal-nav>privacy notice</a>.</label>',submit:'Create account',links:[['login','Already registered? Sign in']]},
  confirm:{title:'Verify your email',desc:'Enter the verification code sent to your inbox.',fields:input('Email address','email','email')+input('Verification code','code','text','inputmode="numeric" autocomplete="one-time-code"'),submit:'Confirm account',links:[['resend','Resend code'],['login','Back to sign in']]},
  resend:{title:'Resend confirmation',desc:'Request a new email verification code.',fields:input('Email address','email','email'),submit:'Resend code',links:[['confirm','I have a code']]},
  forgot:{title:'Reset your password',desc:'We will send a recovery code to your registered email.',fields:input('Email address','email','email'),submit:'Send reset code',links:[['reset','I have a reset code'],['login','Back to sign in']]},
  reset:{title:'Choose a new password',desc:'Use the recovery code from your email.',fields:input('Email address','email','email')+input('Reset code','code','text','autocomplete="one-time-code"')+input('New password','password','password','autocomplete="new-password" minlength="10"'),submit:'Reset password',links:[['login','Back to sign in']]},
  change:{title:'Change password',desc:'Update your account credentials securely.',fields:input('Current password','oldPassword','password','autocomplete="current-password"')+input('New password','password','password','autocomplete="new-password" minlength="10"'),submit:'Update password',links:[]}
 };
 let active='login', emailCache='';
 function open(mode='login'){
  if(!layouts[mode])mode='login';active=mode;
  const l=layouts[mode];
  document.getElementById('modalRoot').innerHTML=`<div class="modal-overlay" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button class="modal-close" type="button" aria-label="Close dialog" data-close>×</button><span class="eyebrow">Secure access / Amazon Cognito</span><h2 id="authTitle">${esc(l.title)}</h2><p>${esc(l.desc)}</p><form id="authForm" class="auth-form"><div class="form-grid auth-fields">${l.fields}</div><p id="authError" class="notice error" role="alert" hidden></p><button class="btn btn-primary btn-block" type="submit">${esc(l.submit)} →</button></form><div class="modal-links">${l.links.map(([m,t])=>`<button type="button" class="text-btn" data-auth="${m}">${esc(t)}</button>`).join('')}</div></div></div>`;
  document.body.classList.add('modal-open');
  const root=document.getElementById('modalRoot');
  root.querySelector('[data-close]').addEventListener('click',close);
  root.querySelector('.modal-overlay').addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay'))close()});
  root.querySelectorAll('[data-auth]').forEach(el=>el.addEventListener('click',()=>open(el.dataset.auth)));
  root.querySelectorAll('[data-modal-nav]').forEach(el=>el.addEventListener('click',close));
  root.querySelector('#authForm').addEventListener('submit',submit);
  const email=root.querySelector('input[name=email]');if(emailCache&&email)email.value=emailCache;
  root.querySelector('input')?.focus();
 }
 function close(){document.getElementById('modalRoot').innerHTML='';document.body.classList.remove('modal-open')}
 async function submit(e){
  e.preventDefault();const f=e.currentTarget,b=f.querySelector('[type=submit]'),err=f.querySelector('#authError');
  const v=name=>U.formValue(f,name);emailCache=v('email')||emailCache;
  b.disabled=true;b.textContent='Please wait…';err.hidden=true;
  try{
   if(active==='login'){await Auth.signIn(v('email'),v('password'));close();App.toast('Signed in successfully');App.navigate('dashboard');return;}
   if(active==='signup'){await Auth.signUp(v('email'),v('password'),v('name'));App.toast('Account created. Check your email for a code.');open('confirm');return;}
   if(active==='confirm'){await Auth.confirm(v('email'),v('code'));App.toast('Email verified. You can sign in now.');open('login');return;}
   if(active==='resend'){await Auth.resend(v('email'));App.toast('A new code has been requested.');open('confirm');return;}
   if(active==='forgot'){await Auth.forgot(v('email'));App.toast('If the account exists, a reset code will be sent.');open('reset');return;}
   if(active==='reset'){await Auth.reset(v('email'),v('code'),v('password'));App.toast('Password updated. Sign in with your new password.');open('login');return;}
   if(active==='change'){await Auth.changePassword(v('oldPassword'),v('password'));App.toast('Password changed successfully.');close();return;}
  }catch(error){err.textContent=error.message||'Authentication failed';err.hidden=false;b.disabled=false;b.textContent=layouts[active].submit+' →';}
 }
 return {open,close};
})();
