window.U = (() => {
 const esc = value => String(value ?? '').replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const date = v => {try{return v?new Date(v).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'Not provided'}catch(_){return 'Not provided'}};
 const time = v => {try{return v?new Date(v).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'—'}catch(_){return '—'}};
 const slug = s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
 const icon = (name,size=22)=>Icons.svg(name,size);
 const statusClass = s => ['Resolved','Rejected'].includes(s)?'resolved':s==='In Progress'?'progress':'open';
 const badge = s=>`<span class="badge ${statusClass(s)}">${esc(s||'Submitted')}</span>`;
 const formValue=(form,name)=>String(new FormData(form).get(name)||'').trim();
 const externalMap=address=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address);
 const loading=(label='Loading…')=>`<div class="empty"><span class="spinner"></span><p>${esc(label)}</p></div>`;
 const empty=(heading,desc,cta='')=>`<div class="empty"><div class="card-icon">${icon('layers',30)}</div><h3>${esc(heading)}</h3><p>${esc(desc)}</p>${cta}</div>`;
 const escapeCSV = v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 return {esc,date,time,slug,icon,statusClass,badge,formValue,externalMap,loading,empty,escapeCSV};
})();
