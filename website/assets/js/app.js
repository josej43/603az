window.App=(()=>{
 const view=document.getElementById('view');
 const {esc,icon}=U;
 let staffRows=[];
 const toast=(message,error=false)=>{const root=document.getElementById('toastRoot');const el=document.createElement('div');el.className='toast'+(error?' error':'');el.textContent=message;root.appendChild(el);setTimeout(()=>el.remove(),5500)};
 const navigate=path=>{location.hash='#'+path.replace(/^#|^\//g,'')};
 const requireAuth=(destination)=>{if(!Auth.isSignedIn()){view.innerHTML=Sections.page('Account required','Sign in to continue','Create a free account or sign in to access this feature.',`<div class="panel"><button class="btn btn-primary" id="signInRequired">Sign in / Create account →</button></div>`);document.getElementById('signInRequired')?.addEventListener('click',()=>AuthUI.open('login'));return false}return true};
 const updateHeader=()=>{
  const signed=Auth.isSignedIn();const login=document.getElementById('loginBtn'),join=document.getElementById('joinBtn');
  login.textContent=signed?'Sign out':'Sign in';join.textContent=signed?'My account ↗':'Get started ↗';
  document.querySelectorAll('[data-nav="staff"]').forEach(el=>{el.hidden=!Auth.isStaff()});
 };
 const render=async()=>{
  const raw=decodeURIComponent(location.hash.slice(1)||'home'),[route,id]=raw.split('/');
  updateHeader();document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===route));
  const pages={home:Sections.home,explore:Sections.explore,about:Sections.about,privacy:Sections.privacy,terms:Sections.terms,help:Sections.help};
  if(pages[route])view.innerHTML=pages[route]();
  else if(route==='report'){if(!requireAuth(route))return;view.innerHTML=ReportsUI.report();wireReport();}
  else if(route==='dashboard'){if(!requireAuth(route))return;view.innerHTML=ReportsUI.dashboard();loadDashboard();}
  else if(route==='account'){if(!requireAuth(route))return;view.innerHTML=Sections.page('Account settings','Your account','Manage your signed-in session and password.',`<div class="panel"><h3>Signed in</h3><p>${esc(Auth.current()?.username||'Account')}</p><div class="hero-actions"><button class="btn btn-primary" id="changePasswordBtn">Change password</button><button class="btn btn-ghost" id="accountLogoutBtn">Sign out</button></div></div>`);document.getElementById('changePasswordBtn').addEventListener('click',()=>AuthUI.open('change'));document.getElementById('accountLogoutBtn').addEventListener('click',async()=>{await Auth.signOut();navigate('home');toast('Signed out')});}
  else if(route==='staff'){if(!requireAuth(route))return;if(!Auth.isStaff()){view.innerHTML=Sections.page('Restricted area','Staff only','Your account does not have the Staff role.','<div class="notice warning">A Cognito administrator must assign staff privileges.</div>');return;}view.innerHTML=ReportsUI.staff();loadStaff();}
  else if(route==='detail'&&id){if(!requireAuth(route))return;view.innerHTML=ReportsUI.detail();loadDetail(id);}
  else view.innerHTML=Sections.page('Not found','Page not found','The page you requested does not exist.','<a href="#home" class="btn btn-primary">Return home</a>');
  document.getElementById('mobileNav').classList.remove('open');document.getElementById('menuBtn').setAttribute('aria-expanded','false');
  Motion.reveal();if(!location.hash.includes('detail'))window.scrollTo({top:0,behavior:'instant'});
 };
 async function loadDashboard(){const el=document.getElementById('dashboardContent');try{const result=await API.list();if(el){el.innerHTML=ReportsUI.dashboardContent(result.items||[]);Motion.reveal();if(result.hasMore||result.nextKey)toast('Showing the first 100 reports. Pagination is not yet available.')}}catch(e){showLoadError(el,e)}}
 async function loadStaff(){const el=document.getElementById('staffContent');try{const result=await API.list();staffRows=result.items||[];if(el){el.innerHTML=ReportsUI.staffContent(staffRows);Motion.reveal();const filter=el.querySelector('#staffFilter');filter?.addEventListener('change',()=>{el.querySelector('#staffList').innerHTML=staffRows.filter(r=>!filter.value||r.status===filter.value).map(ReportsUI.row).join('')||U.empty('No matches','Try a different status.');Motion.reveal()});el.querySelector('#exportCsv')?.addEventListener('click',()=>{const visible=staffRows.filter(r=>!filter.value||r.status===filter.value);const columns=['reportId','title','category','location','priority','status','assignedTo','createdAt'];const csv=[columns.join(','),...visible.map(r=>columns.map(k=>U.escapeCSV(r[k])).join(','))].join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='civicpulse-reports.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});if(result.hasMore)toast('Only the first 100 reports are shown.')}}catch(e){showLoadError(el,e)}}
 async function loadDetail(id){const el=document.getElementById('detailContent');try{const report=await API.get(id);if(el){el.innerHTML=ReportsUI.detailContent(report,Auth.isStaff());el.querySelector('#updateForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;try{const updated=await API.update(id,{status:U.formValue(f,'status'),priority:U.formValue(f,'priority'),assignedTo:U.formValue(f,'assignedTo'),note:U.formValue(f,'note')});toast('Report updated');loadDetail(id)}catch(error){toast(error.message,true);b.disabled=false}})}}catch(e){showLoadError(el,e)}}
 function showLoadError(el,e){if(el)el.innerHTML=`<div class="notice error"><strong>Unable to load data</strong><p>${esc(e.message)}</p><button class="btn btn-ghost btn-sm" id="retryLoad">Retry</button></div>`;el?.querySelector("#retryLoad")?.addEventListener("click",()=>location.reload());toast(e.message,true)}
 function wireReport(){
  const form=document.getElementById('reportForm'),photos=document.getElementById('photoFiles');if(!form)return;
  photos.addEventListener('change',()=>{const files=[...photos.files];document.getElementById('filePreview').textContent=files.map(f=>f.name+' ('+(f.size/1048576).toFixed(1)+' MB)').join(' · ');if(files.length>3)toast('Choose up to three photos.',true)});
  document.getElementById('geoBtn')?.addEventListener('click',()=>{
   if(!navigator.geolocation){toast('Location is not available in this browser.',true);return}
   navigator.geolocation.getCurrentPosition(p=>{form.elements.latitude.value=p.coords.latitude.toFixed(6);form.elements.longitude.value=p.coords.longitude.toFixed(6);toast('Coordinates added to your report.');},()=>toast('Location permission denied or unavailable.',true),{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
  });
  form.addEventListener('submit',async e=>{
   e.preventDefault();const files=[...photos.files];
   if(files.length>3||files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>window.CIVIC_CONFIG.maxImageBytes)){toast('Maximum three JPEG/PNG/WebP photos, 5 MB each.',true);return;}
   const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Submitting report…';
   const fields=['title','category','description','location','postcode','incidentDate','priority','contactPreference'];const data=Object.fromEntries(fields.map(k=>[k,U.formValue(form,k)]));data.hazard=form.elements.hazard.checked;data.accessibility=form.elements.accessibility.checked;
   if(form.elements.latitude.value&&form.elements.longitude.value){data.latitude=Number(form.elements.latitude.value);data.longitude=Number(form.elements.longitude.value)}
   try{
    const report=await API.create(data);let uploaded=0,failures=0;
    for(const file of files){try{await API.upload(report.reportId,file);uploaded++}catch(error){failures++;console.error('Photo upload error',error)}}
    toast(`Report submitted.${uploaded?' '+uploaded+' photo(s) uploaded.':''}${failures?' '+failures+' photo(s) failed; please contact the administrator.':''}`,!!failures);
    navigate('detail/'+encodeURIComponent(report.reportId));
   }catch(error){toast(error.message,true);button.disabled=false;button.textContent='Submit infrastructure report →';}
  });
 }
 function setup(){
  document.getElementById('loginBtn').addEventListener('click',async()=>{if(Auth.isSignedIn()){await Auth.signOut();toast('Signed out');navigate('home');updateHeader()}else AuthUI.open('login')});
  document.getElementById('joinBtn').addEventListener('click',()=>Auth.isSignedIn()?navigate('dashboard'):AuthUI.open('signup'));
  document.getElementById('menuBtn').addEventListener('click',e=>{const nav=document.getElementById('mobileNav');nav.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(nav.classList.contains('open')))});
  window.addEventListener('hashchange',render);window.addEventListener('civic-auth-changed',updateHeader);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')AuthUI.close()});
  document.getElementById('year').textContent=new Date().getFullYear();Icons.hydrate();Motion.init();render();
 }
 document.addEventListener('DOMContentLoaded',setup);
 return {toast,navigate};
})();
