window.API = (()=>{
 const base=()=>window.CIVIC_CONFIG.apiUrl.replace(/\/$/,'');
 async function request(path, options={}){
  const token=await Auth.token();if(!token)throw new Error('Please sign in to continue.');
  const res=await fetch(base()+path,{...options,headers:{'Authorization':`Bearer ${token}`,...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})},cache:'no-store'});
  let body={};try{body=await res.json();}catch(_){}
  if(!res.ok){const error=new Error(body.error||body.message||`Request failed (${res.status})`);error.status=res.status;throw error;}
  return body;
 }
 return {
  list:()=>request('/reports'),get:id=>request('/reports/'+encodeURIComponent(id)),
  create:data=>request('/reports',{method:'POST',body:JSON.stringify(data)}),
  update:(id,data)=>request('/reports/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(data)}),
  async upload(reportId,file){
   if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPEG, PNG or WebP image.');
   if(file.size>window.CIVIC_CONFIG.maxImageBytes)throw new Error('Image exceeds the 5 MB limit.');
   const signed=await request('/uploads',{method:'POST',body:JSON.stringify({reportId,contentType:file.type})});
   const uploaded=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
   if(!uploaded.ok)throw new Error('Image upload failed. The report was saved; retry the photo upload.');
   return signed.imageKey;
  }
 };
})();
