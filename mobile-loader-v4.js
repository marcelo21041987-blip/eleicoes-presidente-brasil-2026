const F={U:0,M:1,Z:2,S:3,C1:4,L1:5,F1:6,NO1:7,B1:8,N1:9,I1:10,C2:11,L2:12,F2:13,NO2:14,B2:15,N2:16,I2:17,BIO1:18,BIO2:19,APT1:20,APT2:21,ABS1:22,ABS2:23};let meta,rows,turn='C',cur={u:null,m:null,z:null,s:null},state=new Map(),mun=new Map(),zone=new Map(),table=[];const $=x=>document.getElementById(x),NF=new Intl.NumberFormat('pt-BR'),PF=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2,minimumFractionDigits:2});const fmt=x=>NF.format(Math.round(x||0)),sg=x=>(x>0?'+':'')+fmt(x),pct=x=>PF.format((x||0)*100)+'%',name=m=>meta.munNames[String(m)]||String(m),uf=i=>meta.ufs[i]||'';
let loadedUF=null,ufLoading=null;
async function fetchJSONFile(file){
  const rel=new URL('data-v2/'+file,document.baseURI).href;
  const raw='https://raw.githubusercontent.com/marcelo21041987-blip/eleicoes-presidente-brasil-2026/main/data-v2/'+file;
  const cdn='https://cdn.jsdelivr.net/gh/marcelo21041987-blip/eleicoes-presidente-brasil-2026@main/data-v2/'+file;
  let last=null;
  for(const url of [rel,raw,cdn]){
    try{
      const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),20000);
      const res=await fetch(url,{cache:'no-store',signal:ctl.signal});
      clearTimeout(tm);
      if(res.ok)return await res.json();
      last=Error('HTTP '+res.status);
    }catch(e){last=e}
  }
  throw last||Error('Falha ao baixar '+file);
}
async function loadUF(u){
  if(loadedUF===u&&rows.length)return;
  if(ufLoading)return ufLoading;
  ufLoading=(async()=>{
    const files=CHUNKS[String(u)]||[];
    const tmp=[];
    $('lt').textContent='Carregando '+uf(u)+'…';
    $('ls').textContent='Dados detalhados somente desta UF';
    $('lb').style.width='8%';
    try{
      for(let j=0;j<files.length;j++){
        $('ls').textContent='Bloco '+(j+1)+' de '+files.length+' • '+uf(u);
        const arr=await fetchJSONFile(files[j]);
        tmp.push(...arr);
        $('lb').style.width=(8+82*(j+1)/Math.max(1,files.length)).toFixed(0)+'%';
        await new Promise(r=>requestAnimationFrame(r));
      }
      rows=tmp; loadedUF=u; state.clear();mun.clear();zone.clear();index();
      $('lb').style.width='100%';
      $('lt').textContent=uf(u)+' carregado';
      $('ls').textContent=fmt(rows.length)+' seções na memória • Brasil continua em modo leve';
    }catch(e){
      rows=[];loadedUF=null;state.clear();mun.clear();zone.clear();
      $('lt').textContent='Erro ao carregar '+uf(u);
      $('ls').textContent=e.message;
      throw e;
    }finally{ufLoading=null}
  })();
  return ufLoading;
}
async function selectUF(u){
  if(u===null){
    cur={u:null,m:null,z:null,s:null};rows=[];loadedUF=null;state.clear();mun.clear();zone.clear();
    $('uf').value='';fillM();
    $('lt').textContent='Resumo nacional pronto';
    $('ls').textContent='Detalhes por seção são carregados somente quando você escolhe uma UF';
    $('lb').style.width='100%';
    render();return;
  }
  await loadUF(u);
  cur={u,m:null,z:null,s:null};
  $('uf').value=u;fillM();render();
}
async function gotoCase(u,m,z,s){
  await selectUF(u);
  cur.m=m;fillZ();$('mun').value=m;
  cur.z=z;fillS();$('z').value=z;
  cur.s=s;$('s').value=s;
  render();window.scrollTo({top:0,behavior:'smooth'});
}
async function streamNational(callback,phase){
  let done=0,total=Object.entries(CHUNKS).filter(([u])=>uf(+u)!=='ZZ').reduce((a,[,f])=>a+f.length,0);
  for(let u=0;u<meta.ufs.length;u++){
    if(uf(u)==='ZZ')continue;
    for(const file of CHUNKS[String(u)]||[]){
      done++;
      $('lt').textContent=phase||'Análise nacional…';
      $('ls').textContent='Bloco '+done+' de '+total+' • '+uf(u);
      $('lb').style.width=Math.max(5,Math.min(98,done/total*100)).toFixed(0)+'%';
      const arr=await fetchJSONFile(file);
      await callback(arr,u,done,total);
      await new Promise(r=>requestAnimationFrame(r));
    }
  }
  $('lb').style.width='100%';
  $('lt').textContent='Resumo nacional pronto';
  $('ls').textContent='Análise nacional concluída sem manter as 499 mil seções na memória';
}


async function load(){
  meta=SUMMARY.meta;
  rows=[];
  $('lb').style.width='100%';
  $('lt').textContent='Resumo nacional pronto';
  $('ls').textContent='Abre sem baixar 499 mil seções • detalhes carregam só ao escolher uma UF';
  init();
}

function index(){state.clear();mun.clear();zone.clear();let pu=-1,pm='',pz='',su=0,sm=0,sz=0;for(let i=0;i<rows.length;i++){let r=rows[i],u=r[F.U],m=r[F.M],z=r[F.Z],mk=u+'|'+m,zk=mk+'|'+z;if(u!==pu){if(pu>=0)state.set(pu,[su,i]);pu=u;su=i}if(mk!==pm){if(pm)mun.set(pm,[sm,i]);pm=mk;sm=i}if(zk!==pz){if(pz)zone.set(pz,[sz,i]);pz=zk;sz=i}}state.set(pu,[su,rows.length]);mun.set(pm,[sm,rows.length]);zone.set(pz,[sz,rows.length])}

function init(){
 meta.ufs.forEach((x,i)=>{let o=new Option(x==='ZZ'?'ZZ — Exterior':x,i);$('uf').add(o)});
 document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{turn=b.dataset.t;document.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('on',x===b));render()});
 $('uf').onchange=async()=>{let v=$('uf').value===''?null:+$('uf').value;try{await selectUF(v)}catch(e){console.error(e)}};
 $('mun').onchange=()=>{cur.m=$('mun').value===''?null:+$('mun').value;cur.z=cur.s=null;fillZ();render()};
 $('z').onchange=()=>{cur.z=$('z').value===''?null:+$('z').value;cur.s=null;fillS();render()};
 $('s').onchange=()=>{cur.s=$('s').value===''?null:+$('s').value;render()};
 $('q').oninput=drawTable;$('sort').onchange=drawTable;$('on').onchange=outliers;
 if($('bioTurn'))$('bioTurn').onchange=render;
 $('triageFilter').onchange=calcularTriagem;
 $('outlierPanel').ontoggle=outliers;
 $('transPanel').ontoggle=()=>{if($('transPanel').open)renderTransversal()};
 $('transRun').onclick=renderTransversal;
 $('transX').onchange=()=>{};$('transY').onchange=()=>{};$('transMin').onchange=()=>{};
 $('matrixRun').onclick=renderMatrix;
 initTransSelectors();render();
}

function fillM(){let e=$('mun');e.innerHTML='<option value="">Todos</option>';e.disabled=cur.u===null;$('z').innerHTML='<option value="">Todas</option>';$('z').disabled=true;$('s').innerHTML='<option value="">Todas</option>';$('s').disabled=true;if(cur.u===null)return;let[a,b]=state.get(cur.u),last=-1;for(let i=a;i<b;i++){let m=rows[i][F.M];if(m!==last){e.add(new Option(name(m),m));last=m}}}
function fillZ(){let e=$('z');e.innerHTML='<option value="">Todas</option>';e.disabled=cur.m===null;$('s').innerHTML='<option value="">Todas</option>';$('s').disabled=true;if(cur.m===null)return;let[a,b]=mun.get(cur.u+'|'+cur.m),last=-1;for(let i=a;i<b;i++){let z=rows[i][F.Z];if(z!==last){e.add(new Option('Zona '+z,z));last=z}}}
function fillS(){let e=$('s');e.innerHTML='<option value="">Todas</option>';e.disabled=cur.z===null;if(cur.z===null)return;let[a,b]=zone.get(cur.u+'|'+cur.m+'|'+cur.z);for(let i=a;i<b;i++)e.add(new Option('Seção '+rows[i][F.S],rows[i][F.S]))}
function range(){if(cur.z!==null)return zone.get(cur.u+'|'+cur.m+'|'+cur.z);if(cur.m!==null)return mun.get(cur.u+'|'+cur.m);if(cur.u!==null)return state.get(cur.u);return[0,rows.length]}
function sel(){if(cur.s===null)return null;let[a,b]=range();for(let i=a;i<b;i++)if(rows[i][F.S]===cur.s)return rows[i];return null}
function one(r){return{n:1,c1:r[F.C1],l1:r[F.L1],f1:r[F.F1],no1:r[F.NO1],b1:r[F.B1],n1:r[F.N1],i1:r[F.I1],c2:r[F.C2],l2:r[F.L2],f2:r[F.F2],no2:r[F.NO2],b2:r[F.B2],n2:r[F.N2],i2:r[F.I2],bio1:r[F.BIO1],bio2:r[F.BIO2],apt1:r[F.I1]?r[F.APT1]:0,apt2:r[F.I2]?r[F.APT2]:0,abs1:r[F.I1]?r[F.ABS1]:0,abs2:r[F.I2]?r[F.ABS2]:0}}
function agg(a,b){let A={n:0,c1:0,l1:0,f1:0,no1:0,b1:0,n1:0,i1:0,c2:0,l2:0,f2:0,no2:0,b2:0,n2:0,i2:0,bio1:0,bio2:0,apt1:0,apt2:0,abs1:0,abs2:0};for(let i=a;i<b;i++){let r=rows[i];A.n++;A.c1+=r[F.C1];A.l1+=r[F.L1];A.f1+=r[F.F1];A.no1+=r[F.NO1];A.b1+=r[F.B1];A.n1+=r[F.N1];A.i1+=r[F.I1];A.c2+=r[F.C2];A.l2+=r[F.L2];A.f2+=r[F.F2];A.no2+=r[F.NO2];A.b2+=r[F.B2];A.n2+=r[F.N2];A.i2+=r[F.I2];A.bio1+=r[F.BIO1];A.bio2+=r[F.BIO2];if(r[F.I1]){A.apt1+=r[F.APT1];A.abs1+=r[F.ABS1]}if(r[F.I2]){A.apt2+=r[F.APT2];A.abs2+=r[F.ABS2]}}return A}

function render(){
 let rr=range(),r=sel(),A=cur.u===null?SUMMARY.national:(r?one(r):agg(...rr));
 crumb();kpis(A);bars(A);controls(A);biometrics(A);mostrarComparacao(A);calcularTriagem();detail(r);buildTable(rr);drawTable();outliers();
 if($('matrixWrap'))$('matrixWrap').style.display='none';
 if($('transPanel')&&$('transPanel').open&&cur.u!==null)renderTransversal();
}


function crumb(){
 let h='<button data-c="b">Brasil</button>';
 if(cur.u!==null)h+='<span>›</span><button data-c="u">'+uf(cur.u)+'</button>';
 if(cur.m!==null)h+='<span>›</span><button data-c="m">'+name(cur.m)+'</button>';
 if(cur.z!==null)h+='<span>›</span><button data-c="z">Zona '+cur.z+'</button>';
 if(cur.s!==null)h+='<span>›</span><strong>Seção '+cur.s+'</strong>';
 $('cr').innerHTML=h;
 $('cr').querySelectorAll('button').forEach(b=>b.onclick=async()=>{
   let c=b.dataset.c;
   if(c==='b'){await selectUF(null)}
   else if(c==='u'){cur.m=cur.z=cur.s=null;$('mun').value='';fillZ();render()}
   else if(c==='m'){cur.z=cur.s=null;$('z').value='';fillS();render()}
   else{cur.s=null;$('s').value='';render()}
 })
}

function kpis(A){let c=turn==='1'?A.c1:A.c2,l=turn==='1'?A.l1:A.l2,f=turn==='1'?A.f1:A.f2,bn=turn==='1'?A.b1+A.n1:A.b2+A.n2,m=l-f;$('ksec').textContent=fmt(A.n);$('ksec2').textContent=cur.s!==null?'seção selecionada':'no escopo; inclui não instaladas';$('kcmp').textContent=fmt(c);$('kcmp2').textContent=turn==='C'?'Δ '+sg(A.c2-A.c1):turn+'º turno';$('kl').textContent=fmt(l);$('kl2').textContent=turn==='C'?'Δ '+sg(A.l2-A.l1):turn+'º turno';$('kf').textContent=fmt(f);$('kf2').textContent=turn==='C'?'Δ '+sg(A.f2-A.f1):turn+'º turno';$('km').textContent=sg(m);$('km2').textContent=turn==='C'?'1T '+sg(A.l1-A.f1)+' → 2T '+sg(A.l2-A.f2)+' • desloc. '+sg((A.l2-A.f2)-(A.l1-A.f1)):turn+'º turno';$('kbn').textContent=fmt(bn);$('kbn2').textContent=turn==='C'?'1T '+fmt(A.b1+A.n1)+' → 2T '+fmt(A.b2+A.n2):'brancos + nulos na urna; sem nulos técnicos'}
function bars(A){let sets=[];if(turn==='1'||turn==='C')sets.push(['1º turno',A.l1,A.f1,Math.max(0,A.no1-A.l1-A.f1)]);if(turn==='2'||turn==='C')sets.push(['2º turno',A.l2,A.f2,Math.max(0,A.no2-A.l2-A.f2)]);let h='';for(let[s,l,f,o]of sets){let total=l+f+o||1;h+='<div><div class="muted" style="margin-bottom:4px">'+s+' • nominais '+fmt(total)+'</div>';for(let[n,v,c]of[['Lula',l,'lula'],['Flávio',f,'flavio'],['Outros',o,'outros']]){if(n==='Outros'&&v===0)continue;h+='<div class="bar"><span>'+n+'</span><div class="track"><div class="fill '+c+'" style="width:'+Math.max(.3,v/total*100)+'%"></div></div><strong>'+fmt(v)+' <span class="muted">('+pct(v/total)+')</span></strong></div>'}h+='</div>'}$('bars').innerHTML=h;$('vnote').innerHTML=turn==='C'?'Deslocamento da margem Lula−Flávio: <strong>'+sg((A.l2-A.f2)-(A.l1-A.f1))+'</strong>. Δ comparecimento: <strong>'+sg(A.c2-A.c1)+'</strong>.':'Margem Lula−Flávio: <strong>'+sg((turn==='1'?A.l1-A.f1:A.l2-A.f2))+'</strong>.'}
function biometrics(A){let bt=$('bioTurn')?$('bioTurn').value:'2',c,b;if(bt==='1'){c=A.c1;b=A.bio1}else if(bt==='2'){c=A.c2;b=A.bio2}else{c=A.c2;b=A.bio2}$('bc').textContent=bt==='C'?'1T '+fmt(A.c1)+' → 2T '+fmt(A.c2):fmt(c);$('bsem').textContent=bt==='C'?'1T '+fmt(A.bio1)+' → 2T '+fmt(A.bio2):fmt(b);$('bdemais').textContent=bt==='C'?'1T '+fmt(Math.max(0,A.c1-A.bio1))+' → 2T '+fmt(Math.max(0,A.c2-A.bio2)):fmt(Math.max(0,c-b));$('brate').textContent=bt==='C'?(A.c1?pct(A.bio1/A.c1):'—')+' → '+(A.c2?pct(A.bio2/A.c2):'—'):(c?pct(b/c):'—');$('bnote').innerHTML=bt==='C'?'Variação do contador: <strong>'+sg(A.bio2-A.bio1)+'</strong>. O campo significa eleitoras/es <strong>com biometria, mas não habilitados por meio dela</strong>; não é o total sem cadastro biométrico. “Demais votantes” é apenas o complemento aritmético do comparecimento.':'Campo oficial <code>QT_ELEI_BIOM_SEM_HABILITACAO</code>: eleitoras/es com biometria cadastrada, mas que não foram habilitados por meio dela. Não representa o total sem cadastro biométrico. O complemento não deve ser interpretado automaticamente como “digital reconhecida”.'}
function controls(A){let d1=A.no1+A.b1+A.n1-A.c1,d2=A.no2+A.b2+A.n2-A.c2;$('close1').innerHTML=d1===0?'<span class="good">Fecha em 0</span>':'<span class="bad">Dif. '+sg(d1)+'</span>';$('close2').innerHTML=d2===0?'<span class="good">Fecha em 0</span>':'<span class="bad">Dif. '+sg(d2)+'</span>';$('inst1').textContent=fmt(A.i1)+' / '+fmt(A.n);$('inst2').textContent=fmt(A.i2)+' / '+fmt(A.n)}
function detail(r){let d=$('detail');if(!r){d.classList.remove('show');return}d.classList.add('show');let fs=[['UF',uf(r[F.U])],['Município',name(r[F.M])],['Zona',r[F.Z]],['Seção',r[F.S]],['1ºT comparecimento',fmt(r[F.C1])],['2ºT comparecimento',fmt(r[F.C2])],['1ºT aptos',fmt(r[F.APT1])],['2ºT aptos',fmt(r[F.APT2])],['1ºT abstenções',r[F.I1]?fmt(r[F.ABS1]):'Seção não instalada'],['2ºT abstenções',r[F.I2]?fmt(r[F.ABS2]):'Seção não instalada'],['1ºT instalada',r[F.I1]?'Sim':'Não'],['2ºT instalada',r[F.I2]?'Sim':'Não'],['1ºT Lula / Flávio',fmt(r[F.L1])+' / '+fmt(r[F.F1])],['2ºT Lula / Flávio',fmt(r[F.L2])+' / '+fmt(r[F.F2])],['1ºT brancos / nulos',fmt(r[F.B1])+' / '+fmt(r[F.N1])],['2ºT brancos / nulos',fmt(r[F.B2])+' / '+fmt(r[F.N2])],['1ºT sem hab. biométrica',fmt(r[F.BIO1])+' ('+(r[F.C1]?pct(r[F.BIO1]/r[F.C1]):'—')+')'],['2ºT sem hab. biométrica',fmt(r[F.BIO2])+' ('+(r[F.C2]?pct(r[F.BIO2]/r[F.C2]):'—')+')'],['1ºT demais votantes',fmt(Math.max(0,r[F.C1]-r[F.BIO1]))],['2ºT demais votantes',fmt(Math.max(0,r[F.C2]-r[F.BIO2]))]];$('facts').innerHTML=fs.map(x=>'<div class="fact"><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('')}

function buildTable(rr){
 table=[];
 if(cur.s!==null){$('ttl').textContent='Seção selecionada';return}
 if(cur.u===null){
   table=SUMMARY.perUF.map((A,u)=>({k:u,A,lab:uf(u)==='ZZ'?'ZZ — Exterior':uf(u),sub:''}));
   $('ttl').textContent='Estados e exterior';$('h1').textContent='UF';return;
 }
 let level=cur.m===null?'m':cur.z===null?'z':'s',
 get=level==='m'?r=>r[F.M]:level==='z'?r=>r[F.Z]:r=>r[F.S],
 a=rr[0],b=rr[1],start=a,last=null;
 for(let i=a;i<=b;i++){
   let k=i<b?get(rows[i]):null;
   if(i===a){last=k;start=i}
   else if(k!==last){
     let A=level==='s'?one(rows[start]):agg(start,i),
     lab=level==='m'?name(last):level==='z'?'Zona '+last:'Seção '+last;
     table.push({k:last,A,lab,sub:''});start=i;last=k
   }
 }
 $('ttl').textContent=level==='m'?'Municípios':level==='z'?'Zonas eleitorais':'Seções';
 $('h1').textContent=level==='m'?'Município':level==='z'?'Zona':'Seção';
}

function metric(o,k){let A=o.A;if(k==='l2')return A.l2;if(k==='f2')return A.f2;if(k==='c2')return A.c2;if(k==='bio2')return A.bio2;if(k==='biorate2')return A.c2?A.bio2/A.c2:0;return(A.l2-A.f2)-(A.l1-A.f1)}

function drawTable(){
 let q=$('q').value.trim().toLocaleUpperCase('pt-BR'),k=$('sort').value,
 arr=table.filter(x=>!q||x.lab.toLocaleUpperCase('pt-BR').includes(q));
 arr.sort((a,b)=>metric(b,k)-metric(a,k));
 $('tb').innerHTML=arr.map(o=>{let A=o.A,sh=(A.l2-A.f2)-(A.l1-A.f1);return'<tr data-k="'+o.k+'"><td><strong>'+o.lab+'</strong></td><td>'+o.sub+'</td><td>'+fmt(A.n)+'</td><td>'+fmt(A.l1)+'</td><td>'+fmt(A.f1)+'</td><td>'+fmt(A.l2)+'</td><td>'+fmt(A.f2)+'</td><td class="'+(sh>=0?'good':'bad')+'">'+sg(sh)+'</td><td>'+fmt(A.c2)+'</td><td>'+fmt(A.bio1)+'</td><td>'+fmt(A.bio2)+'</td><td>'+(A.c2?pct(A.bio2/A.c2):'—')+'</td><td>'+fmt(A.b2+A.n2)+'</td></tr>'}).join('');
 let level=cur.u===null?'u':cur.m===null?'m':cur.z===null?'z':'s';
 $('tb').querySelectorAll('tr').forEach(tr=>tr.onclick=async()=>{
   let k=+tr.dataset.k;
   if(level==='u'){try{await selectUF(k)}catch(e){console.error(e)}}
   else if(level==='m'){cur.m=k;$('mun').value=k;fillZ();render()}
   else if(level==='z'){cur.z=k;$('z').value=k;fillS();render()}
   else{cur.s=k;$('s').value=k;render()}
 })
}


function outliers(){
 if(!$('outlierPanel').open)return;
 let N=+$('on').value;
 if(cur.u===null){
   let o=SUMMARY.outliersNational.slice(0,N);
   $('ob').innerHTML=o.map(x=>{let r=x.r,sh=x.sh;return'<tr data-u="'+r[0]+'" data-m="'+r[1]+'" data-z="'+r[2]+'" data-s="'+r[3]+'"><td>'+uf(r[0])+'</td><td>'+name(r[1])+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td><td>'+fmt(r[4])+' / '+fmt(r[5])+'</td><td>'+fmt(r[6])+' / '+fmt(r[7])+'</td><td class="'+(sh>=0?'good':'bad')+'">'+(sh>0?'+':'')+PF.format(sh*100)+' p.p.</td><td>'+sg(r[9]-r[8])+'</td></tr>'}).join('');
   $('ob').querySelectorAll('tr').forEach(tr=>tr.onclick=()=>gotoCase(+tr.dataset.u,+tr.dataset.m,+tr.dataset.z,+tr.dataset.s));
   return;
 }
 let[a,b]=range(),o=[];
 for(let i=a;i<b;i++){let r=rows[i],d1=r[F.L1]+r[F.F1],d2=r[F.L2]+r[F.F2];if(d1<100||d2<100)continue;let sh=r[F.L2]/d2-r[F.L1]/d1;o.push([Math.abs(sh),sh,r])}
 o.sort((a,b)=>b[0]-a[0]);o=o.slice(0,N);
 $('ob').innerHTML=o.map(x=>{let r=x[2],sh=x[1];return'<tr data-u="'+r[F.U]+'" data-m="'+r[F.M]+'" data-z="'+r[F.Z]+'" data-s="'+r[F.S]+'"><td>'+uf(r[F.U])+'</td><td>'+name(r[F.M])+'</td><td>'+r[F.Z]+'</td><td>'+r[F.S]+'</td><td>'+fmt(r[F.L1])+' / '+fmt(r[F.F1])+'</td><td>'+fmt(r[F.L2])+' / '+fmt(r[F.F2])+'</td><td class="'+(sh>=0?'good':'bad')+'">'+(sh>0?'+':'')+PF.format(sh*100)+' p.p.</td><td>'+sg(r[F.C2]-r[F.C1])+'</td></tr>'}).join('');
 $('ob').querySelectorAll('tr').forEach(tr=>tr.onclick=()=>gotoCase(+tr.dataset.u,+tr.dataset.m,+tr.dataset.z,+tr.dataset.s));
}

function escHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mostrarComparacao(A){
 const nacional=cur.u===null;
 const dados=[['Aptos em seções instaladas',A.apt1,A.apt2],['Comparecimento',A.c1,A.c2],['Abstenções',A.abs1,A.abs2],['Votos em branco',A.b1,A.b2],['Nulos registrados na urna',A.n1,A.n2],['Nulos técnicos — total nacional',nacional?5246:null,nacional?0:null],['Total de nulos — relatório nacional',nacional?A.n1+5246:null,nacional?A.n2:null],['Biometria cadastrada, sem habilitação por ela',A.bio1,A.bio2]];
 $('auditTotals').innerHTML=dados.map(([label,x,y])=>'<tr><td>'+label+'</td><td>'+(x===null?'—':fmt(x))+'</td><td>'+(y===null?'—':fmt(y))+'</td><td>'+(x===null||y===null?'—':sg(y-x))+'</td></tr>').join('');
 const a1=A.apt1?pct(A.abs1/A.apt1):'—',a2=A.apt2?pct(A.abs2/A.apt2):'—';
 $('auditTotalsNote').textContent='Abstenção sobre aptos em seções instaladas: '+a1+' no 1º turno e '+a2+' no 2º. '+(nacional?'Os nulos técnicos são os valores do relatório nacional do TSE.':'Nulos técnicos não foram discriminados para este recorte; por isso aparecem como não disponíveis.');
}

function calcularTriagem(){
 const filter=$('triageFilter').value;
 if(cur.u===null){
   const T=SUMMARY.triageNational,names=['Menos de 5%','5% a menos de 10%','10% a menos de 20%','20% a menos de 50%','50% ou mais'];
   $('crossScope').textContent=fmt(T.eligible)+' seções com ao menos 100 comparecimentos em cada turno. Brasil: 26 estados e DF; exterior excluído deste cruzamento.';
   $('crossRows').innerHTML=T.bins.map((g,i)=>'<tr><td>'+names[i]+'</td><td>'+fmt(g.n)+'</td><td>'+(g.apt1?fmt(g.abs1)+' ('+pct(g.abs1/g.apt1)+') → '+fmt(g.abs2)+' ('+pct(g.abs2/g.apt2)+')':'—')+'</td><td>'+(g.c1?fmt(g.bn1)+' ('+pct(g.bn1/g.c1)+') → '+fmt(g.bn2)+' ('+pct(g.bn2/g.c2)+')':'—')+'</td></tr>').join('');
   $('triBio').textContent=fmt(T.counts.bio);$('triTurnout').textContent=fmt(T.counts.turnout);$('triInvalid').textContent=fmt(T.counts.invalid);$('triEligible').textContent=fmt(T.counts.eligible);
   const list=T.top[filter]||[];
   $('triageRows').innerHTML=list.length?list.map(r=>'<tr data-u="'+r[0]+'" data-m="'+r[1]+'" data-z="'+r[2]+'" data-s="'+r[3]+'"><td>'+escHtml(uf(r[0])+' · '+name(r[1]))+'</td><td>'+r[2]+' / '+r[3]+'</td><td>'+fmt(r[4])+' → '+fmt(r[5])+'</td><td>'+fmt(r[6])+' → '+fmt(r[7])+'</td><td>'+fmt(r[8])+' → '+fmt(r[9])+'</td><td>'+fmt(r[10])+' → '+fmt(r[11])+'</td><td>'+fmt(r[12])+' → '+fmt(r[13])+'</td></tr>').join(''):'<tr><td colspan="7" class="audit-empty">Nenhuma seção atende ao critério.</td></tr>';
   $('triageRows').querySelectorAll('tr[data-u]').forEach(tr=>tr.onclick=()=>gotoCase(+tr.dataset.u,+tr.dataset.m,+tr.dataset.z,+tr.dataset.s));
   $('triageNote').textContent='Resumo nacional pré-calculado. Clique em um caso para carregar apenas a UF correspondente. A triagem não determina a causa da variação.';
   return;
 }
 const selected=sel(), rangeNow=range();
 const bins=Array.from({length:5},()=>({n:0,apt1:0,apt2:0,abs1:0,abs2:0,c1:0,c2:0,bn1:0,bn2:0}));
 const counts={bio:0,turnout:0,invalid:0,eligible:0}, list=[];let eligible=0;
 const start=rangeNow[0],end=rangeNow[1];
 for(let i=start;i<end;i++){
  const r=rows[i];if(selected&&r!==selected)continue;
  if(!r[F.I1]||!r[F.I2]||r[F.C1]<100||r[F.C2]<100)continue;
  eligible++;
  let ratio=r[F.BIO2]/r[F.C2],k=ratio<.05?0:ratio<.1?1:ratio<.2?2:ratio<.5?3:4,g=bins[k];
  g.n++;g.apt1+=r[F.APT1];g.apt2+=r[F.APT2];g.abs1+=r[F.ABS1];g.abs2+=r[F.ABS2];g.c1+=r[F.C1];g.c2+=r[F.C2];g.bn1+=r[F.B1]+r[F.N1];g.bn2+=r[F.B2]+r[F.N2];
  const dc=r[F.C2]-r[F.C1],b1=r[F.B1]+r[F.N1],b2=r[F.B2]+r[F.N2],di=b2-b1,dp=Math.abs(b2/r[F.C2]-b1/r[F.C1]),da=r[F.APT2]-r[F.APT1];
  const hit={bio:ratio>=.5,turnout:Math.abs(dc)>=100&&Math.abs(dc)/r[F.C1]>=.5,invalid:Math.abs(di)>=20&&dp>=.1,eligible:Math.abs(da)>20};
  for(const k2 of Object.keys(counts))if(hit[k2])counts[k2]++;
  if(hit[filter])list.push({i,score:filter==='bio'?ratio:filter==='turnout'?Math.abs(dc):filter==='invalid'?Math.abs(di):Math.abs(da)});
 }
 const names=['Menos de 5%','5% a menos de 10%','10% a menos de 20%','20% a menos de 50%','50% ou mais'];
 $('crossScope').textContent=fmt(eligible)+' seções com ao menos 100 comparecimentos em cada turno. O cruzamento acompanha os filtros escolhidos.';
 $('crossRows').innerHTML=bins.map((g,i)=>'<tr><td>'+names[i]+'</td><td>'+fmt(g.n)+'</td><td>'+(g.apt1?fmt(g.abs1)+' ('+pct(g.abs1/g.apt1)+') → '+fmt(g.abs2)+' ('+pct(g.abs2/g.apt2)+')':'—')+'</td><td>'+(g.c1?fmt(g.bn1)+' ('+pct(g.bn1/g.c1)+') → '+fmt(g.bn2)+' ('+pct(g.bn2/g.c2)+')':'—')+'</td></tr>').join('');
 $('triBio').textContent=fmt(counts.bio);$('triTurnout').textContent=fmt(counts.turnout);$('triInvalid').textContent=fmt(counts.invalid);$('triEligible').textContent=fmt(counts.eligible);
 list.sort((x,y)=>y.score-x.score);
 $('triageRows').innerHTML=list.length?list.slice(0,25).map(({i})=>{let r=rows[i];return '<tr data-row="'+i+'"><td>'+escHtml(uf(r[F.U])+' · '+name(r[F.M]))+'</td><td>'+r[F.Z]+' / '+r[F.S]+'</td><td>'+fmt(r[F.C1])+' → '+fmt(r[F.C2])+'</td><td>'+fmt(r[F.ABS1])+' → '+fmt(r[F.ABS2])+'</td><td>'+fmt(r[F.B1]+r[F.N1])+' → '+fmt(r[F.B2]+r[F.N2])+'</td><td>'+fmt(r[F.BIO1])+' → '+fmt(r[F.BIO2])+'</td><td>'+fmt(r[F.APT1])+' → '+fmt(r[F.APT2])+'</td></tr>'}).join(''):'<tr><td colspan="7" class="audit-empty">Nenhuma seção atende ao critério neste recorte.</td></tr>';
 $('triageNote').textContent='Exibindo até 25 de '+fmt(list.length)+' casos do critério escolhido. A triagem não determina a causa da variação; consulte BU, log e ata.';
 $('triageRows').querySelectorAll('tr[data-row]').forEach(tr=>tr.onclick=()=>{let r=rows[+tr.dataset.row];gotoCase(r[F.U],r[F.M],r[F.Z],r[F.S])});
}


const TRANS_METRICS={
 c1:{label:'Comparecimento — 1º turno',short:'Comp. 1T',unit:'count'},c2:{label:'Comparecimento — 2º turno',short:'Comp. 2T',unit:'count'},dc:{label:'Variação de comparecimento (2T − 1T)',short:'Δ comp.',unit:'count'},dcp:{label:'Variação percentual do comparecimento',short:'Δ comp. %',unit:'pct'},
 apt1:{label:'Aptos — 1º turno',short:'Aptos 1T',unit:'count'},apt2:{label:'Aptos — 2º turno',short:'Aptos 2T',unit:'count'},dapt:{label:'Variação de aptos (2T − 1T)',short:'Δ aptos',unit:'count'},
 abs1:{label:'Taxa de abstenção — 1º turno',short:'Abst. 1T',unit:'pct'},abs2:{label:'Taxa de abstenção — 2º turno',short:'Abst. 2T',unit:'pct'},dabs:{label:'Variação da taxa de abstenção',short:'Δ abst. p.p.',unit:'pp'},
 inv1:{label:'Brancos + nulos / comparecimento — 1º turno',short:'Br/Nu 1T',unit:'pct'},inv2:{label:'Brancos + nulos / comparecimento — 2º turno',short:'Br/Nu 2T',unit:'pct'},dinv:{label:'Variação de brancos + nulos',short:'Δ Br/Nu p.p.',unit:'pp'},
 bio1:{label:'Biometria sem habilitação / comparecimento — 1º turno',short:'Bio 1T',unit:'pct'},bio2:{label:'Biometria sem habilitação / comparecimento — 2º turno',short:'Bio 2T',unit:'pct'},dbio:{label:'Variação da taxa biométrica',short:'Δ bio p.p.',unit:'pp'},
 l1:{label:'Votos Lula — 1º turno',short:'Lula 1T',unit:'count'},l2:{label:'Votos Lula — 2º turno',short:'Lula 2T',unit:'count'},dl:{label:'Variação de votos Lula',short:'Δ Lula',unit:'count'},
 f1:{label:'Votos Flávio — 1º turno',short:'Flávio 1T',unit:'count'},f2:{label:'Votos Flávio — 2º turno',short:'Flávio 2T',unit:'count'},df:{label:'Variação de votos Flávio',short:'Δ Flávio',unit:'count'},
 share1:{label:'Participação Lula entre Lula+Flávio — 1º turno',short:'Part. Lula 1T',unit:'pct'},share2:{label:'Participação Lula entre Lula+Flávio — 2º turno',short:'Part. Lula 2T',unit:'pct'},dshare:{label:'Variação da participação Lula entre finalistas',short:'Δ part. Lula',unit:'pp'},
 margin1:{label:'Margem Lula − Flávio — 1º turno',short:'Margem 1T',unit:'count'},margin2:{label:'Margem Lula − Flávio — 2º turno',short:'Margem 2T',unit:'count'},dmargin:{label:'Deslocamento da margem Lula − Flávio',short:'Δ margem',unit:'count'}
};
const MATRIX_KEYS=['bio2','abs2','inv2','dcp','dapt','dbio','dabs','dinv','dshare'];
function initTransSelectors(){let x=$('transX'),y=$('transY');x.innerHTML='';y.innerHTML='';for(const [k,m] of Object.entries(TRANS_METRICS)){x.add(new Option(m.label,k));y.add(new Option(m.label,k))}x.value='bio2';y.value='dshare'}
function transVal(r,k){let c1=r[F.C1],c2=r[F.C2],a1=r[F.APT1],a2=r[F.APT2],d1=r[F.L1]+r[F.F1],d2=r[F.L2]+r[F.F2];switch(k){case'c1':return c1;case'c2':return c2;case'dc':return c2-c1;case'dcp':return c1?(c2-c1)/c1*100:null;case'apt1':return a1;case'apt2':return a2;case'dapt':return a2-a1;case'abs1':return a1?r[F.ABS1]/a1*100:null;case'abs2':return a2?r[F.ABS2]/a2*100:null;case'dabs':return a1&&a2?(r[F.ABS2]/a2-r[F.ABS1]/a1)*100:null;case'inv1':return c1?(r[F.B1]+r[F.N1])/c1*100:null;case'inv2':return c2?(r[F.B2]+r[F.N2])/c2*100:null;case'dinv':return c1&&c2?((r[F.B2]+r[F.N2])/c2-(r[F.B1]+r[F.N1])/c1)*100:null;case'bio1':return c1?r[F.BIO1]/c1*100:null;case'bio2':return c2?r[F.BIO2]/c2*100:null;case'dbio':return c1&&c2?(r[F.BIO2]/c2-r[F.BIO1]/c1)*100:null;case'l1':return r[F.L1];case'l2':return r[F.L2];case'dl':return r[F.L2]-r[F.L1];case'f1':return r[F.F1];case'f2':return r[F.F2];case'df':return r[F.F2]-r[F.F1];case'share1':return d1?r[F.L1]/d1*100:null;case'share2':return d2?r[F.L2]/d2*100:null;case'dshare':return d1&&d2?(r[F.L2]/d2-r[F.L1]/d1)*100:null;case'margin1':return r[F.L1]-r[F.F1];case'margin2':return r[F.L2]-r[F.F2];case'dmargin':return(r[F.L2]-r[F.F2])-(r[F.L1]-r[F.F1]);default:return null}}
function transEligible(r,min){if(!r[F.I1]||!r[F.I2]||r[F.C1]<min||r[F.C2]<min)return false;if(cur.u===null&&uf(r[F.U])==='ZZ')return false;return true}
function tfmt(v,k){if(v===null||!Number.isFinite(v))return'—';let u=TRANS_METRICS[k].unit;if(u==='count')return NF.format(Math.round(v));return PF.format(v)+(u==='pp'?' p.p.':'%')}
function corrLabel(r){let a=Math.abs(r);if(!Number.isFinite(r))return'Correlação não calculável neste recorte.';let mag=a<.1?'muito fraca':a<.3?'fraca':a<.5?'moderada':a<.7?'acentuada':'forte';return'Associação linear '+mag+' e '+(r>0?'positiva':r<0?'negativa':'nula')+'. Correlação não demonstra causalidade.'}
function scopeLabel(){if(cur.s!==null)return'1 seção';if(cur.z!==null)return'Zona '+cur.z;if(cur.m!==null)return name(cur.m);if(cur.u!==null)return uf(cur.u);return'Brasil (sem ZZ)'}

async function renderTransversal(){
 if(!$('transPanel').open)return;
 let xk=$('transX').value,yk=$('transY').value,min=Math.max(0,+$('transMin').value||0);
 if(cur.u===null){
   $('transInterpret').textContent='Calculando o Brasil por blocos, sem carregar todas as seções simultaneamente.';
   let n=0,sx=0,sy=0,sxx=0,syy=0,sxy=0,minx=Infinity,maxx=-Infinity,miny=Infinity,maxy=-Infinity,sample=[],seen=0;
   try{
     await streamNational(async arr=>{
       for(const r of arr){
         if(!r[F.I1]||!r[F.I2]||r[F.C1]<min||r[F.C2]<min)continue;
         let x=transVal(r,xk),y=transVal(r,yk);if(x===null||y===null||!Number.isFinite(x)||!Number.isFinite(y))continue;
         n++;sx+=x;sy+=y;sxx+=x*x;syy+=y*y;sxy+=x*y;
         if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
         seen++;if(sample.length<1800)sample.push([x,y]);else{let q=Math.floor(Math.random()*seen);if(q<1800)sample[q]=[x,y]}
       }
     },'Análise transversal nacional…');
     let mx=n?sx/n:NaN,my=n?sy/n:NaN,vx=n?sxx/n-mx*mx:NaN,vy=n?syy/n-my*my:NaN,sdx=vx>0?Math.sqrt(vx):0,sdy=vy>0?Math.sqrt(vy):0,cov=n?sxy/n-mx*my:NaN,rr=sdx&&sdy?cov/(sdx*sdy):NaN;
     let top=[];
     await streamNational(async arr=>{
       for(const r of arr){
         if(!r[F.I1]||!r[F.I2]||r[F.C1]<min||r[F.C2]<min)continue;
         let x=transVal(r,xk),y=transVal(r,yk);if(x===null||y===null||!Number.isFinite(x)||!Number.isFinite(y))continue;
         let zx=sdx?(x-mx)/sdx:0,zy=sdy?(y-my)/sdy:0,score=Math.sqrt(zx*zx+zy*zy),item={r,x,y,zx,zy,score};
         if(top.length<25){top.push(item);top.sort((p,q)=>q.score-p.score)}else if(score>top[top.length-1].score){top[top.length-1]=item;top.sort((p,q)=>q.score-p.score)}
       }
     },'Localizando extremos nacionais…');
     $('transN').textContent=fmt(n);$('transR').textContent=Number.isFinite(rr)?rr.toFixed(4):'—';$('transR2').textContent=Number.isFinite(rr)?(rr*rr).toFixed(4):'—';
     $('transMeanX').textContent=Number.isFinite(mx)?tfmt(mx,xk):'—';$('transMeanY').textContent=Number.isFinite(my)?tfmt(my,yk):'—';$('transScope').textContent='Brasil (sem ZZ)';
     $('transHX').textContent=TRANS_METRICS[xk].short;$('transHY').textContent=TRANS_METRICS[yk].short;
     $('transInterpret').textContent=corrLabel(rr)+' Universo processado por blocos; nenhuma base nacional completa ficou residente na memória.';
     drawTransScatter(sample,minx,maxx,miny,maxy,xk,yk);
     $('transOutliers').innerHTML=top.map((o,j)=>{let r=o.r;return'<tr data-j="'+j+'"><td>'+escHtml(uf(r[F.U])+' · '+name(r[F.M]))+'</td><td>'+r[F.Z]+' / '+r[F.S]+'</td><td>'+tfmt(o.x,xk)+'</td><td>'+tfmt(o.y,yk)+'</td><td>'+o.zx.toFixed(2)+'</td><td>'+o.zy.toFixed(2)+'</td><td><strong>'+o.score.toFixed(2)+'</strong></td></tr>'}).join('');
     $('transOutliers').querySelectorAll('tr[data-j]').forEach(tr=>tr.onclick=()=>{let r=top[+tr.dataset.j].r;gotoCase(r[F.U],r[F.M],r[F.Z],r[F.S])});
   }catch(e){$('transInterpret').textContent='Erro na análise nacional: '+e.message;console.error(e)}
   return;
 }
 let[a,b]=range(),n=0,sx=0,sy=0,sxx=0,syy=0,sxy=0,minx=Infinity,maxx=-Infinity,miny=Infinity,maxy=-Infinity;
 for(let i=a;i<b;i++){let r=rows[i];if(!transEligible(r,min))continue;let x=transVal(r,xk),y=transVal(r,yk);if(x===null||y===null||!Number.isFinite(x)||!Number.isFinite(y))continue;n++;sx+=x;sy+=y;sxx+=x*x;syy+=y*y;sxy+=x*y;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y}
 let mx=n?sx/n:NaN,my=n?sy/n:NaN,vx=n?sxx/n-mx*mx:NaN,vy=n?syy/n-my*my:NaN,sdx=vx>0?Math.sqrt(vx):0,sdy=vy>0?Math.sqrt(vy):0,cov=n?sxy/n-mx*my:NaN,rr=sdx&&sdy?cov/(sdx*sdy):NaN;
 $('transN').textContent=fmt(n);$('transR').textContent=Number.isFinite(rr)?rr.toFixed(4):'—';$('transR2').textContent=Number.isFinite(rr)?(rr*rr).toFixed(4):'—';$('transMeanX').textContent=Number.isFinite(mx)?tfmt(mx,xk):'—';$('transMeanY').textContent=Number.isFinite(my)?tfmt(my,yk):'—';$('transScope').textContent=scopeLabel();$('transHX').textContent=TRANS_METRICS[xk].short;$('transHY').textContent=TRANS_METRICS[yk].short;$('transInterpret').textContent=corrLabel(rr)+' Universo: seções instaladas nos dois turnos, com comparecimento mínimo de '+fmt(min)+' em cada turno.';
 if(n<2||!Number.isFinite(mx)||!Number.isFinite(my)){$('transChart').innerHTML='<div class="audit-empty">Observações insuficientes para o cruzamento.</div>';$('transOutliers').innerHTML='<tr><td colspan="7" class="audit-empty">Observações insuficientes.</td></tr>';return}
 let step=Math.max(1,Math.floor(n/1800)),seen2=0,sample2=[],top2=[];
 for(let i=a;i<b;i++){let r=rows[i];if(!transEligible(r,min))continue;let x=transVal(r,xk),y=transVal(r,yk);if(x===null||y===null||!Number.isFinite(x)||!Number.isFinite(y))continue;if(seen2%step===0&&sample2.length<2200)sample2.push([x,y]);seen2++;let zx=sdx?(x-mx)/sdx:0,zy=sdy?(y-my)/sdy:0,score=Math.sqrt(zx*zx+zy*zy);let item={i,x,y,zx,zy,score};if(top2.length<25){top2.push(item);top2.sort((p,q)=>q.score-p.score)}else if(score>top2[top2.length-1].score){top2[top2.length-1]=item;top2.sort((p,q)=>q.score-p.score)}}
 drawTransScatter(sample2,minx,maxx,miny,maxy,xk,yk);
 $('transOutliers').innerHTML=top2.map(o=>{let r=rows[o.i];return'<tr data-row="'+o.i+'"><td>'+escHtml(uf(r[F.U])+' · '+name(r[F.M]))+'</td><td>'+r[F.Z]+' / '+r[F.S]+'</td><td>'+tfmt(o.x,xk)+'</td><td>'+tfmt(o.y,yk)+'</td><td>'+o.zx.toFixed(2)+'</td><td>'+o.zy.toFixed(2)+'</td><td><strong>'+o.score.toFixed(2)+'</strong></td></tr>'}).join('');
 $('transOutliers').querySelectorAll('tr[data-row]').forEach(tr=>tr.onclick=()=>{let r=rows[+tr.dataset.row];gotoCase(r[F.U],r[F.M],r[F.Z],r[F.S])});
}

function drawTransScatter(sample,minx,maxx,miny,maxy,xk,yk){let W=900,H=380,L=76,R=22,T=20,BT=58,dx=maxx-minx||1,dy=maxy-miny||1,sx=x=>L+(x-minx)/dx*(W-L-R),sy=y=>H-BT-(y-miny)/dy*(H-T-BT),pts=sample.map(p=>'<circle class="trans-point" cx="'+sx(p[0]).toFixed(1)+'" cy="'+sy(p[1]).toFixed(1)+'" r="2"/>').join('');let gx='',gy='';for(let j=0;j<=4;j++){let px=L+j*(W-L-R)/4,py=T+j*(H-T-BT)/4;gx+='<line class="trans-gridline" x1="'+px+'" y1="'+T+'" x2="'+px+'" y2="'+(H-BT)+'"/>';gy+='<line class="trans-gridline" x1="'+L+'" y1="'+py+'" x2="'+(W-R)+'" y2="'+py+'"/>'}let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Gráfico de dispersão"><g>'+gx+gy+pts+'</g><text class="trans-axis" x="'+L+'" y="'+(H-34)+'">'+escHtml(tfmt(minx,xk))+'</text><text class="trans-axis" text-anchor="end" x="'+(W-R)+'" y="'+(H-34)+'">'+escHtml(tfmt(maxx,xk))+'</text><text class="trans-axis" x="8" y="'+(H-BT)+'">'+escHtml(tfmt(miny,yk))+'</text><text class="trans-axis" x="8" y="'+(T+8)+'">'+escHtml(tfmt(maxy,yk))+'</text><text class="trans-axis" text-anchor="middle" x="'+((L+W-R)/2)+'" y="'+(H-10)+'">'+escHtml(TRANS_METRICS[xk].label)+'</text><text class="trans-axis" transform="translate(15 '+((T+H-BT)/2)+') rotate(-90)" text-anchor="middle">'+escHtml(TRANS_METRICS[yk].label)+'</text></svg>';$('transChart').innerHTML=svg}

async function renderMatrix(){
 let min=Math.max(0,+$('transMin').value||0),K=MATRIX_KEYS.length,n=0,s=Array(K).fill(0),ss=Array(K).fill(0),cross=Array.from({length:K},()=>Array(K).fill(0));
 const consume=arr=>{for(const r of arr){if(!r[F.I1]||!r[F.I2]||r[F.C1]<min||r[F.C2]<min)continue;let v=MATRIX_KEYS.map(k=>transVal(r,k));if(v.some(x=>x===null||!Number.isFinite(x)))continue;n++;for(let j=0;j<K;j++){s[j]+=v[j];ss[j]+=v[j]*v[j];for(let k=0;k<=j;k++)cross[j][k]+=v[j]*v[k]}}};
 try{
   if(cur.u===null)await streamNational(async arr=>consume(arr),'Matriz nacional…');
   else{let[a,b]=range();consume(rows.slice(a,b))}
   let corr=(j,k)=>{let mj=s[j]/n,mk=s[k]/n,vj=ss[j]/n-mj*mj,vk=ss[k]/n-mk*mk,c=cross[Math.max(j,k)][Math.min(j,k)]/n-mj*mk;return vj>0&&vk>0?c/Math.sqrt(vj*vk):NaN};
   $('matrixHead').innerHTML='<tr><th>Variável</th>'+MATRIX_KEYS.map(k=>'<th title="'+escHtml(TRANS_METRICS[k].label)+'">'+escHtml(TRANS_METRICS[k].short)+'</th>').join('')+'</tr>';
   $('matrixBody').innerHTML=MATRIX_KEYS.map((rk,i)=>'<tr><th title="'+escHtml(TRANS_METRICS[rk].label)+'">'+escHtml(TRANS_METRICS[rk].short)+'</th>'+MATRIX_KEYS.map((ck,j)=>{let r=i===j?1:corr(i,j),cl=Number.isFinite(r)&&Math.abs(r)>=.5?' class="corr-hi"':'';return'<td'+cl+'>'+(Number.isFinite(r)?r.toFixed(3):'—')+'</td>'}).join('')+'</tr>').join('');
   $('matrixWrap').style.display='block';
 }catch(e){$('matrixWrap').style.display='block';$('matrixBody').innerHTML='<tr><td class="audit-empty">Erro: '+escHtml(e.message)+'</td></tr>';console.error(e)}
}


load().catch(e=>{$('lt').textContent='Erro ao carregar';$('ls').textContent=e.message;console.error(e)});
