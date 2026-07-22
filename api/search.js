<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Warsaw Building Intelligence</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f0f0f;--s1:#1a1a1a;--s2:#222;
  --bd:rgba(255,255,255,.08);--bds:rgba(255,255,255,.14);
  --t:#e8e8e8;--t2:#999;--t3:#666;
  --ac:#3b82f6;--ac-bg:rgba(59,130,246,.1);--ac-b:rgba(59,130,246,.3);
  --gr:#22c55e;--gr-bg:rgba(34,197,94,.1);--gr-b:rgba(34,197,94,.25);
  --am:#f59e0b;--am-bg:rgba(245,158,11,.1);--am-b:rgba(245,158,11,.25);
  --r:8px;--rl:12px;
}
body{background:var(--bg);color:var(--t);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;font-size:15px;line-height:1.6;min-height:100vh}
.wrap{max-width:800px;margin:0 auto;padding:2rem 1rem 4rem}
.hdr{margin-bottom:1.75rem}
.hdr h1{font-size:22px;font-weight:600;letter-spacing:-.3px}
.hdr p{font-size:13px;color:var(--t3);margin-top:4px}
.sbox{background:var(--s1);border:.5px solid var(--bds);border-radius:var(--rl);padding:1.25rem;margin-bottom:1.25rem}
.slbl{font-size:11px;font-weight:500;color:var(--t3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:.6rem}
.srow{display:flex;gap:8px}
.srow input{flex:1;height:44px;padding:0 14px;background:var(--s2);border:.5px solid var(--bds);border-radius:var(--r);color:var(--t);font-size:15px;outline:none}
.srow input::placeholder{color:var(--t3)}
.srow input:focus{border-color:var(--ac);box-shadow:0 0 0 2px var(--ac-bg)}
.sbtn{height:44px;padding:0 20px;background:var(--ac);color:#fff;border:none;border-radius:var(--r);font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:7px;white-space:nowrap}
.sbtn:hover{opacity:.88}
.sbtn:disabled{opacity:.4;cursor:default}
.hints{font-size:12px;color:var(--t3);margin-top:8px}
.hints span{color:var(--ac);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.card{background:var(--s1);border:.5px solid var(--bd);border-radius:var(--rl);padding:1.25rem;margin-bottom:1rem}
.ctitle{font-size:15px;font-weight:500;display:flex;align-items:center;gap:8px;margin-bottom:.875rem;flex-wrap:wrap}
.csub{font-size:12px;color:var(--t3);margin:-.5rem 0 .875rem}
.badge{font-size:11px;font-weight:500;padding:3px 9px;border-radius:20px}
.bb{background:var(--ac-bg);color:var(--ac);border:.5px solid var(--ac-b)}
.bg{background:var(--gr-bg);color:var(--gr);border:.5px solid var(--gr-b)}
.ba{background:var(--am-bg);color:var(--am);border:.5px solid var(--am-b)}
.bgr{background:var(--s2);color:var(--t2);border:.5px solid var(--bds)}
.sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:1rem}
.stat{background:var(--s2);border-radius:var(--r);padding:12px 14px}
.stn{font-size:24px;font-weight:500}
.stl{font-size:12px;color:var(--t2);margin-top:2px}
.igrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px}
.icell .lbl{font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.listing{border:.5px solid var(--bd);border-radius:var(--r);padding:12px;margin-bottom:8px;background:var(--s2)}
.listing:last-child{margin-bottom:0}
.ltop{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.ltitle{font-size:14px;font-weight:500}
.lmeta{font-size:12px;color:var(--t2);margin-top:3px}
.lprice{font-size:15px;font-weight:500;margin-top:6px}
.llink{font-size:12px;color:var(--ac);margin-top:4px;text-decoration:none;display:inline-block}
.llink:hover{text-decoration:underline}
.pstrip{display:flex;gap:6px;overflow-x:auto;margin-top:10px;padding-bottom:2px;scrollbar-width:thin}
.pstrip img{width:110px;height:74px;border-radius:6px;object-fit:cover;flex-shrink:0;cursor:pointer;border:.5px solid var(--bd);transition:opacity .15s}
.pstrip img:hover{opacity:.8}
.lrow{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:.5px solid var(--bd)}
.lrow:last-child{border-bottom:none;padding-bottom:0}
.lrow a{font-size:14px;color:var(--ac);text-decoration:none}
.lrow a:hover{text-decoration:underline}
.ldesc{font-size:12px;color:var(--t3);margin-top:1px}
.loading{display:flex;align-items:center;gap:12px;padding:2rem 1.25rem;color:var(--t2);font-size:14px}
.spin{width:18px;height:18px;border:2px solid var(--bds);border-top-color:var(--ac);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.notice{font-size:12px;color:var(--t3);background:var(--s2);border:.5px solid var(--bd);border-radius:var(--r);padding:10px 14px;margin-top:1rem;line-height:1.5;display:flex;align-items:flex-start;gap:8px}
.empty{font-size:13px;color:var(--t3);padding:8px 0}
.err{background:rgba(239,68,68,.08);border:.5px solid rgba(239,68,68,.25);border-radius:var(--rl);padding:1.25rem;font-size:13px;color:#f87171;margin-bottom:1rem}
.err strong{display:block;margin-bottom:4px;font-size:14px}
.ahdr{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:1rem}
.atitle{font-size:17px;font-weight:500;flex:1}
.orow{padding:9px 0;border-bottom:.5px solid var(--bd)}
.orow:last-child{border-bottom:none;padding-bottom:0}
.oname{font-size:14px;font-weight:500}
.odet{font-size:12px;color:var(--t2);margin-top:2px}
.lb{display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.lb.open{display:flex}
.lb img{max-width:90vw;max-height:72vh;border-radius:10px;object-fit:contain}
.lbnav{display:flex;align-items:center;gap:20px}
.lbbtn{background:rgba(255,255,255,.12);border:none;color:#fff;font-size:28px;cursor:pointer;border-radius:50%;width:46px;height:46px;display:flex;align-items:center;justify-content:center}
.lbbtn:hover{background:rgba(255,255,255,.22)}
.lbx{position:absolute;top:18px;right:22px;background:none;border:none;color:rgba(255,255,255,.7);font-size:28px;cursor:pointer}
.lbc{color:rgba(255,255,255,.5);font-size:13px;min-width:54px;text-align:center}
@media(max-width:520px){.igrid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>Warsaw Building Intelligence</h1>
    <p>Search any Warsaw address — find apartments for sale, long-term rent, short-term rent, and official city records.</p>
  </div>
  <div class="sbox">
    <div class="slbl">Warsaw Building Search</div>
    <div class="srow">
      <input type="text" id="addr" placeholder="e.g. ul. Jagiellońska 45a, Warszawa" autocomplete="off" />
      <button class="sbtn" id="sbtn" onclick="go()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        Search
      </button>
    </div>
    <div class="hints">Try:
      <span onclick="qs('ul. Jagiellońska 45a, Warszawa')">Jagiellońska 45a</span> ·
      <span onclick="qs('ul. Marszałkowska 140, Warszawa')">Marszałkowska 140</span> ·
      <span onclick="qs('ul. Nowy Świat 18, Warszawa')">Nowy Świat 18</span> ·
      <span onclick="qs('ul. Chmielna 25, Warszawa')">Chmielna 25</span>
    </div>
  </div>
  <div id="out"></div>
</div>

<div class="lb" id="lb">
  <button class="lbx" onclick="clb()">✕</button>
  <img id="lbi" src="" alt="photo" />
  <div class="lbnav">
    <button class="lbbtn" onclick="nlb(-1)">‹</button>
    <span class="lbc" id="lbc"></span>
    <button class="lbbtn" onclick="nlb(1)">›</button>
  </div>
</div>

<script>
let lbP=[],lbI=0;
function olb(p,i){lbP=p;lbI=i;document.getElementById('lbi').src=p[i];document.getElementById('lbc').textContent=(i+1)+' / '+p.length;document.getElementById('lb').classList.add('open')}
function clb(){document.getElementById('lb').classList.remove('open')}
function nlb(d){lbI=(lbI+d+lbP.length)%lbP.length;document.getElementById('lbi').src=lbP[lbI];document.getElementById('lbc').textContent=(lbI+1)+' / '+lbP.length}
document.getElementById('lb').addEventListener('click',e=>{if(e.target===document.getElementById('lb'))clb()});
document.getElementById('addr').addEventListener('keydown',e=>{if(e.key==='Enter')go()});
function qs(a){document.getElementById('addr').value=a;go()}

function thumbs(photos){
  if(!photos||!photos.length)return'';
  const s=JSON.stringify(photos).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  return'<div class="pstrip">'+photos.map((p,i)=>`<img src="${p}" loading="lazy" alt="" onclick="olb(JSON.parse('${s}'),${i})" onerror="this.style.display='none'">`).join('')+'</div>';
}

function listings(items,bc,pn,empty){
  if(!items||!items.length)return`<div class="empty">${empty}</div>`;
  return items.map(x=>`<div class="listing"><div class="ltop"><div style="flex:1;min-width:0">
    <div class="ltitle">${x.title||'—'}</div>
    <div class="lmeta">${[x.size,x.rooms,x.floor,x.rating?'★ '+x.rating+(x.reviews?' ('+x.reviews+')':''):''].filter(Boolean).join(' · ')}</div>
    <div class="lprice">${x.price||''} <span style="font-size:11px;font-weight:400;color:var(--t3)">${pn}</span></div>
    ${x.url?`<a class="llink" href="${x.url}" target="_blank" rel="noopener">${x.source} ↗</a>`:`<span style="font-size:12px;color:var(--t3)">${x.source||''}</span>`}
  </div><span class="badge ${bc}">${x.source||''}</span></div>${thumbs(x.photos)}</div>`).join('');
}

const LINKS=[
  {l:'Geoportal Warszawa',                   d:'Cadastral parcels, zoning plans, aerial view',           u:'https://www.geoportal2.pl/pl/'},
  {l:'Elektroniczne Księgi Wieczyste (EKW)', d:'Land register — legal owners & mortgages',               u:'https://ekw.ms.gov.pl/eukw_ogol/menu.do'},
  {l:'Miejski Informator Multimedialny (MIM)',d:'City portal — building data, permits, address registry', u:'https://mim.um.warszawa.pl/'},
  {l:'GUNB — Building Supervision',          d:'Construction permits, occupancy certificates',            u:'https://www.gunb.gov.pl/'},
  {l:'BIP Warszawa',                         d:'Public bulletin — planning decisions',                    u:'https://bip.warszawa.pl/'},
];
const linksHtml=LINKS.map(l=>`<div class="lrow">
  <div style="width:6px;height:6px;border-radius:50%;background:var(--ac);flex-shrink:0;margin-top:8px"></div>
  <div><a href="${l.u}" target="_blank" rel="noopener">${l.l} ↗</a><div class="ldesc">${l.d}</div></div>
</div>`).join('');

function render(d,addr){
  const b=d.building_info||{},sale=d.sale_listings||[],lt=d.long_term_rentals||[],st=d.short_term_rentals||[],own=d.ownership||[];
  document.getElementById('out').innerHTML=`
    <div class="ahdr">
      <div class="atitle">${addr}</div>
      ${b.district?`<span class="badge bgr">${b.district}</span>`:''}
      ${b.year?`<span class="badge bgr">Built ${b.year}</span>`:''}
    </div>
    <div class="sgrid">
      <div class="stat"><div class="stn" style="color:var(--ac)">${sale.length}</div><div class="stl">For sale</div></div>
      <div class="stat"><div class="stn" style="color:var(--gr)">${lt.length}</div><div class="stl">Long-term rent</div></div>
      <div class="stat"><div class="stn" style="color:var(--am)">${st.length}</div><div class="stl">Short-term rent</div></div>
    </div>
    ${(b.style||b.floors||b.total_units||b.notes)?`<div class="card">
      <div class="ctitle">Building profile</div>
      <div class="igrid">
        ${b.style?`<div class="icell"><div class="lbl">Type</div>${b.style}</div>`:''}
        ${b.year?`<div class="icell"><div class="lbl">Built</div>${b.year}</div>`:''}
        ${b.floors?`<div class="icell"><div class="lbl">Floors</div>${b.floors}</div>`:''}
        ${b.total_units?`<div class="icell"><div class="lbl">Units</div>${b.total_units}</div>`:''}
        ${b.developer?`<div class="icell"><div class="lbl">Developer</div>${b.developer}</div>`:''}
        ${b.notes?`<div class="icell" style="grid-column:1/-1"><div class="lbl">Notes</div>${b.notes}</div>`:''}
      </div></div>`:''}
    <div class="card">
      <div class="ctitle">For sale <span class="badge bb">${sale.length}</span></div>
      ${listings(sale,'bb','','No active sale listings found.')}
    </div>
    <div class="card">
      <div class="ctitle">Long-term rent <span class="badge bg">${lt.length}</span></div>
      <div class="csub">Monthly leases · Otodom, OLX, Gratka</div>
      ${listings(lt,'bg','/month','No long-term rental listings found.')}
    </div>
    <div class="card">
      <div class="ctitle">Short-term rent <span class="badge ba">${st.length}</span></div>
      <div class="csub">Nightly · Nocowanie, Airbnb, Booking.com</div>
      ${listings(st,'ba','/night','No short-term rentals found.')}
    </div>
    ${own.length?`<div class="card">
      <div class="ctitle">Known ownership</div>
      ${own.map(o=>`<div class="orow"><div class="oname">${o.name}</div><div class="odet">${[o.share&&'Share: '+o.share,o.since&&'Since '+o.since,o.type].filter(Boolean).join(' · ')}</div></div>`).join('')}
    </div>`:''}
    <div class="card">
      <div class="ctitle">Official Warsaw sources</div>
      <div class="csub">Verify ownership, permits and zoning directly</div>
      ${linksHtml}
    </div>
    <div class="notice">
      <span style="flex-shrink:0;color:var(--am);font-size:15px">⚠</span>
      Results gathered from public web sources. Always verify on official portals before making decisions.
    </div>`;
}

async function go(){
  const addr=document.getElementById('addr').value.trim();
  if(!addr)return;
  const btn=document.getElementById('sbtn');
  btn.disabled=true;
  document.getElementById('out').innerHTML=`<div class="loading"><div class="spin"></div>Searching listings and public records for <strong style="margin-left:4px">${addr}</strong>…</div>`;
  try{
    const r=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:addr})});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Search failed');
    render(d,addr);
  }catch(e){
    document.getElementById('out').innerHTML=`<div class="err"><strong>Search failed</strong>${e.message}</div><div class="card"><div class="ctitle">Search manually on official sources</div>${linksHtml}</div>`;
  }finally{btn.disabled=false}
}
</script>
</body>
</html>
