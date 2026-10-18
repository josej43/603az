/* Cognito public-client authentication using the regional Cognito Identity Provider API.
   This uses USER_PASSWORD_AUTH, which MUST be enabled on the Cognito app client
   (included in cloudformation/updated-stack.yaml). HTTPS is required in production.
   Browser session tokens are kept in sessionStorage; no client secret is used. */
window.Auth = (() => {
 const config = () => window.CIVIC_CONFIG;
 const key = 'civicpulse.session.v1';
 let session = null;
 try { session = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (_) { session = null; }
 const configured = () => /^us-[a-z]+-\d+_[\w]+$/.test(config().userPoolId) && /^[a-z0-9]{15,}$/i.test(config().userPoolClientId);
 const clientId = () => config().userPoolClientId;
 const jwt = token => {try {let p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p));}catch(_){return {};}};
 const persist = value => {session=value; if(value) sessionStorage.setItem(key,JSON.stringify(value)); else sessionStorage.removeItem(key); window.dispatchEvent(new Event('civic-auth-changed'));};
 async function call(action, payload) {
  if(!configured()) throw new Error('Add your Cognito User Pool ID and App Client ID in assets/js/config.js first.');
  const response = await fetch(`https://cognito-idp.${config().region}.amazonaws.com/`, {
   method:'POST', headers:{'Content-Type':'application/x-amz-json-1.1','X-Amz-Target':`AWSCognitoIdentityProviderService.${action}`},
   body:JSON.stringify(payload)
  });
  let data={};try{data=await response.json();}catch(_){}
  if(!response.ok) {const error=new Error(data.message||data.Message||'Authentication request failed');error.code=(data.__type||'').split('#').pop();throw error;}
  return data;
 }
 function store(result, username) {
  const auth=result.AuthenticationResult;
  if(!auth) throw new Error('Additional authentication challenge required.');
  const profile=jwt(auth.IdToken);
  persist({idToken:auth.IdToken,accessToken:auth.AccessToken,refreshToken:auth.RefreshToken||session?.refreshToken||'',
   expiresAt:Date.now()+(auth.ExpiresIn||3600)*1000,username:username||profile.email||session?.username||'',claims:profile});
  return session;
 }
 async function signIn(email,password){
  const result=await call('InitiateAuth',{AuthFlow:'USER_PASSWORD_AUTH',ClientId:clientId(),AuthParameters:{USERNAME:email,PASSWORD:password}});
  if(result.ChallengeName) { const error=new Error(`Additional Cognito challenge: ${result.ChallengeName}. Contact your administrator.`);error.code=result.ChallengeName;throw error; }
  return store(result,email);
 }
 async function refresh(){
  if(!session?.refreshToken) return null;
  try { const result=await call('InitiateAuth',{AuthFlow:'REFRESH_TOKEN_AUTH',ClientId:clientId(),AuthParameters:{REFRESH_TOKEN:session.refreshToken}});return store(result,session.username); }
  catch(error){persist(null);throw error;}
 }
 async function token(){if(!session)return null;if(Date.now()>session.expiresAt-60000)await refresh();return session?.idToken||null;}
 async function signOut(){
  const old=session;persist(null);
  if(old?.accessToken) try {await call('GlobalSignOut',{AccessToken:old.accessToken});} catch(error){console.warn('Remote sign-out failed; local session cleared',error.code||error.message);}
 }
 return {
  configured,call,token,signIn,signOut,refresh,
  current:()=>session, isSignedIn:()=>!!session,
  isStaff:()=>{const groups=session?.claims?.['cognito:groups']||[];return Array.isArray(groups)?groups.includes('Staff'):String(groups).includes('Staff');},
  signUp:(email,password,name)=>call('SignUp',{ClientId:clientId(),Username:email,Password:password,UserAttributes:[{Name:'email',Value:email},{Name:'name',Value:name}]}),
  confirm:(email,code)=>call('ConfirmSignUp',{ClientId:clientId(),Username:email,ConfirmationCode:code}),
  resend:(email)=>call('ResendConfirmationCode',{ClientId:clientId(),Username:email}),
  forgot:(email)=>call('ForgotPassword',{ClientId:clientId(),Username:email}),
  reset:(email,code,password)=>call('ConfirmForgotPassword',{ClientId:clientId(),Username:email,ConfirmationCode:code,Password:password}),
  changePassword:async(oldPassword,newPassword)=>{const t=await token();if(!t)throw new Error('Please sign in');return call('ChangePassword',{AccessToken:session.accessToken,PreviousPassword:oldPassword,ProposedPassword:newPassword});}
 };
})();
