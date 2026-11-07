/* Static external design preview: no SDK, credentials, real auth or data API. */
(function(){'use strict';
window.CDFPreview=Object.freeze({version:'intro42',source:'16a813f19ca980ec815c893741d2ef15808c2059',accountActions:false});
function notice(){const el=document.getElementById('auth-status');if(el)el.textContent='Designvorschau: Es wird kein Konto angelegt oder angemeldet.';}
document.addEventListener('submit',function(e){const final=document.querySelector('[data-journey-step="3"]');if(e.target.id==='cdf-login-form'||e.target.id==='cdf-register-form'&&final&&!final.hidden){e.preventDefault();e.stopImmediatePropagation();notice();}},true);
document.addEventListener('click',function(e){if(e.target.closest('#cdf-google,#finish-account,#resend-confirmation')){e.preventDefault();e.stopImmediatePropagation();notice();return;}
const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin)return;
const allowed=['/','/login','/login.html','/pages/login','/pages/login.html','/sanctuary','/pages/artist_sanctuary','/pages/artist_sanctuary.html','/preview-info.html'];
if(!allowed.includes(u.pathname)){e.preventDefault();e.stopImmediatePropagation();location.href='/preview-info.html';}},true);
document.addEventListener('DOMContentLoaded',function(){for(const id of ['cdf-google','finish-account','resend-confirmation']){const el=document.getElementById(id);if(el){el.disabled=true;el.title='In dieser Designvorschau deaktiviert';}}});
})();
