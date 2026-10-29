/* Nosso Dinheiro — aplicação (módulos c1..c3d concatenados, mesma lógica) */
/* ============================================================
   NOSSO DINHEIRO v2.1 — C1: núcleo, estado, calendário
   Dinheiro do casal: tudo é dos dois, sem dívida entre pessoas.
   ============================================================ */
const LSKEY='nossoDinheiro.v2';
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const CATS=[
 {n:'Moradia',c:'#7c5cff',i:'🏠'},{n:'Mercado',c:'#22d3ee',i:'🛒'},{n:'Transporte',c:'#fbbf24',i:'🚗'},
 {n:'Saúde',c:'#34d399',i:'💊'},{n:'Lazer',c:'#f472b6',i:'🎬'},{n:'Educação',c:'#60a5fa',i:'📚'},
 {n:'Assinaturas',c:'#c084fc',i:'📦'},{n:'Compras',c:'#fb7185',i:'🛍️'},{n:'Pet',c:'#a3e635',i:'🐾'},
 {n:'Cartão',c:'#fb923c',i:'💳'},{n:'Salário',c:'#22c55e',i:'💰'},{n:'Outras receitas',c:'#14b8a6',i:'📈'},
 {n:'Outros',c:'#94a3b8',i:'✨'}];
const METODOS=['Pix','Débito','Crédito','Dinheiro','Boleto','Transferência','Conta conjunta'];
const CORMETAS=['#7c5cff','#22d3ee','#34d399','#f472b6','#fbbf24','#60a5fa'];

const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const uid=()=>Math.random().toString(36).slice(2,9);
const catInfo=n=>CATS.find(c=>c.n===n)||CATS[CATS.length-1];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(v){v=Number(v)||0;return (v<0?'−':'')+'R$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function fmtC(v){v=Number(v)||0;const a=Math.abs(v);if(a>=1000000)return 'R$ '+(v/1000000).toFixed(1).replace('.',',')+' mi';if(a>=1000)return 'R$ '+(v/1000).toFixed(a>=10000?0:1).replace('.',',')+' mil';return fmt(v)}
function pct(a,b){b=Number(b)||0;return b>0?(Number(a)||0)/b*100:0}
const pnum=s=>{if(typeof s==='number')return s;const t=String(s==null?'':s).trim().replace(/[R$\s]/g,'');return parseFloat(t.indexOf(',')>-1?t.replace(/\./g,'').replace(',','.'):t)||0};
const iso=d=>{d=new Date(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const MESATUAL=iso(new Date()).slice(0,7);
const hojeISO=()=>iso(new Date());
function addMes(m,n){let p=m.split('-'),y=+p[0],mm=+p[1]+n;y+=Math.floor((mm-1)/12);mm=((mm-1)%12+12)%12+1;return y+'-'+String(mm).padStart(2,'0')}
function diffMes(a,b){const x=a.split('-'),z=b.split('-');return (+z[0]-+x[0])*12+(+z[1]-+x[1])}
function mesNome(m){const p=m.split('-');return MESES[+p[1]-1]+' '+p[0]}
function mesAbrev(m){const p=m.split('-');return MESES[+p[1]-1].slice(0,3)+'/'+p[0].slice(2)}
function dataBR(d){if(!d)return '—';const p=String(d).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d}
function dataLonga(d){if(!d)return '—';const p=String(d).split('-');const dt=new Date(+p[0],+p[1]-1,+p[2]);return p[2]+' de '+MESES[+p[1]-1]+' ('+DIAS[dt.getDay()]+')'}
const diaDe=d=>+String(d).slice(8,10);
const qtdDias=m=>new Date(+m.slice(0,4),+m.slice(5,7),0).getDate();
const diaSemana1=m=>new Date(+m.slice(0,4),+m.slice(5,7)-1,1).getDay();

/* ---------------- ESTADO (começa VAZIO) ---------------- */
function estadoVazio(){
 return {versao:2,criadoEm:hojeISO(),atualizadoEm:new Date().toISOString(),
  casal:{a:'',b:'',rendaA:0,rendaB:0,div:'casal',modo:'casal'},
  lancamentos:[],fixas:[],parcelados:[],recibos:[],metas:[],salarios:[],
  ui:{pagina:'calendario',mes:MESATUAL,tema:'escuro',f:{cat:'',busca:'',tipo:'',pessoa:'',valor:''}}};
}
let S=null;
function normaliza(){
 S.casal=Object.assign({a:'',b:'',rendaA:0,rendaB:0,div:'casal',modo:'casal'},S.casal||{});
 S.casal.rendaA=+S.casal.rendaA||0; S.casal.rendaB=+S.casal.rendaB||0;
 ['lancamentos','fixas','parcelados','recibos','metas','salarios'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]});
 S.lancamentos.forEach(l=>{l.valor=+l.valor||0;if(!l.tipo)l.tipo='despesa';if(l.pctA==null)l.pctA=50});
 S.fixas.forEach(f=>{f.valor=+f.valor||0;f.dia=+f.dia||1;if(!f.pagos)f.pagos={};if(!f.over||typeof f.over!=='object')f.over={}});
 S.parcelados.forEach(p=>{p.valorParcela=+p.valorParcela||0;p.parcelas=+p.parcelas||1;p.dia=+p.dia||10;if(!p.pagos||typeof p.pagos!=='object')p.pagos={}});
 S.metas.forEach(m=>{m.alvo=+m.alvo||0;if(!Array.isArray(m.aportes))m.aportes=[];if(m.desconta==null)m.desconta=true});
 S.metas.forEach(m=>(m.aportes||[]).forEach(a=>{if(!a.id)a.id=uid();a.valor=+a.valor||0}));
 S.salarios.forEach(s=>{s.valor=+s.valor||0;s.dia=+s.dia||5;if(!s.over||typeof s.over!=='object')s.over={};if(s.ativo==null)s.ativo=true;if(!s.inicio)s.inicio='2000-01'});
 S.ui=Object.assign({pagina:'calendario',mes:MESATUAL,tema:'escuro',f:{cat:'',busca:'',tipo:''}},S.ui||{});
 if(!S.ui.mes)S.ui.mes=MESATUAL;
 S.ui.f=Object.assign({cat:'',busca:'',tipo:'',pessoa:'',valor:''},S.ui.f||{});
 S.versao=2;
}
function load(){let raw=null;try{raw=localStorage.getItem(LSKEY)}catch(e){}
 if(raw){try{S=JSON.parse(raw)}catch(e){S=estadoVazio()}}else S=estadoVazio();
 normaliza();}
function save(){
 S.atualizadoEm=new Date().toISOString();
 try{localStorage.setItem(LSKEY,JSON.stringify(S));if(typeof broadcast==='function')broadcast()
  if(typeof nuvemSave==='function')nuvemSave()}
 catch(e){
  try{
   if(S.recibos&&S.recibos.length){
    S.recibos.pop();localStorage.setItem(LSKEY,JSON.stringify(S));
    toast('⚠️ Memória cheia: tirei o recibo mais antigo para salvar — baixe um backup');
   }else toast('⚠️ A memória do navegador está cheia — baixe um backup');
  }catch(e2){toast('⚠️ Não consegui salvar — baixe um backup agora')}
 }
}
const vazioTotal=()=>!S.lancamentos.length&&!S.fixas.length&&!S.parcelados.length&&!S.metas.length&&!S.recibos.length;

const nomeA=()=>S.casal.a||'Pessoa 1';
const nomeB=()=>S.casal.b||'Pessoa 2';
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const rq=q=>q==='A'?nomeA():q==='B'?nomeB():'Conta conjunta';
const quotaProp=()=>{const a=+S.casal.rendaA||0,b=+S.casal.rendaB||0,t=a+b;return t>0?[a/t,b/t]:[.5,.5]};
function shares(o){
 const d=o.div||S.casal.div||'casal';
 if(d==='A')return [100,0];
 if(d==='B')return [0,100];
 if(d==='prop'){const q=quotaProp();return [q[0]*100,q[1]*100]}
 if(d==='pct'){const p=Math.max(0,Math.min(100,+o.pctA||0));return [p,100-p]}
 if(d==='igual')return [50,50];
 return [0,0];
}
function divCurta(o){
 const d=o.div||S.casal.div||'casal';
 if(d==='casal')return 'Do casal';
 if(d==='A')return '100% '+nomeA();
 if(d==='B')return '100% '+nomeB();
 const s=shares(o),r=v=>Math.round(v*10)/10;
 return r(s[0])+'% '+nomeA()+' / '+r(s[1])+'% '+nomeB();
}
function divLonga(o){
 const d=o.div||S.casal.div||'casal';
 if(d==='casal')return 'Do casal — sai do dinheiro em comum, não divide';
 const s=shares(o),r=v=>Math.round(v*10)/10;
 const extra=d==='prop'?' (proporcional à renda)':d==='igual'?' (igual para os dois)':d==='pct'?' (percentual escolhido)':'';
 return r(s[0])+'% '+nomeA()+' · '+r(s[1])+'% '+nomeB()+extra;
}
function opcoesDiv(sel){
 const ops=solo()?[['casal','Meu dinheiro (não divide)'],['A','Só meu']]:[['casal','Do casal (dinheiro em comum, não divide)'],['igual','Igual para os dois (50/50)'],['prop','Proporcional à renda de cada um'],
  ['pct','Percentual personalizado'],['A','100% '+nomeA()],['B','100% '+nomeB()]];
 return ops
  .map(o=>'<option value="'+o[0]+'"'+(o[0]===sel?' selected':'')+'>'+o[1]+'</option>').join('');
}
function opcoesQuem(sel){const l=solo()?[['A',nomeA()],['C','Conta conjunta']]:[['A',nomeA()],['B',nomeB()],['C','Conta conjunta']];
 return l.map(q=>'<option value="'+q[0]+'"'+(q[0]===sel?' selected':'')+'>'+q[1]+'</option>').join('')}
function opcoesCats(sel){return CATS.map(c=>'<option value="'+c.n+'"'+(c.n===sel?' selected':'')+'>'+c.i+' '+c.n+'</option>').join('')}

/* ---------------- CÁLCULOS ---------------- */
const lancMes=m=>S.lancamentos.filter(x=>(x.data||'').slice(0,7)===m);
const despMes=m=>lancMes(m).filter(x=>x.tipo!=='receita');
const recMes=m=>lancMes(m).filter(x=>x.tipo==='receita');
const lancDia=d=>S.lancamentos.filter(x=>x.data===d);
const fixasAtivas=()=>S.fixas.filter(f=>f.ativo!==false);
/* junta a regra geral da conta com o ajuste feito só naquele mês */
function fixaEm(f,m){
 const o=(f.over&&f.over[m])||{};
 const tem=Object.keys(o).length>0;
 return {id:f.id,nome:(o.nome!=null&&o.nome!=='')?o.nome:f.nome,
  valor:o.valor!=null?+o.valor:(+f.valor||0),dia:o.dia!=null?+o.dia:(+f.dia||1),
  categoria:o.categoria||f.categoria,pagador:o.pagador||f.pagador||'C',div:o.div||f.div||S.casal.div||'casal',
  ativo:f.ativo!==false,inicio:f.inicio,pagos:f.pagos||{},over:tem,base:f};
}
const fixasMes=m=>fixasAtivas().filter(f=>!f.inicio||m>=f.inicio).map(f=>fixaEm(f,m));
const fixasDia=(m,d)=>fixasMes(m).filter(f=>+f.dia===d);
const fixaPaga=(f,m)=>!!(f.pagos&&f.pagos[m]);
const parcelaPaga=(p,m)=>!!(p.pagos&&p.pagos[m]);
function parcInfo(p,m){
 const i=diffMes(p.inicio,m);
 return {idx:i,atual:i+1,ativa:i>=0&&i<p.parcelas,falta:Math.max(0,p.parcelas-Math.max(0,i)),
  restante:Math.max(0,(+p.valorParcela||0)*(p.parcelas-Math.max(0,i))),fim:addMes(p.inicio,p.parcelas-1),
  progresso:Math.min(100,Math.max(0,i/p.parcelas*100))};
}
const parcelasMes=m=>S.parcelados.map(p=>({p,i:parcInfo(p,m)})).filter(x=>x.i.ativa);
const parcelasDia=(m,d)=>parcelasMes(m).filter(x=>+x.p.dia===d);
const soma=a=>a.reduce((s,x)=>s+(+x.valor||0),0);
const totDespLanc=m=>soma(despMes(m));
const totReceitas=m=>soma(recMes(m));
const totFixas=m=>fixasMes(m).reduce((s,f)=>s+(+f.valor||0),0);
const totParcelas=m=>parcelasMes(m).reduce((s,x)=>s+(+x.p.valorParcela||0),0);
const totDesp=m=>totDespLanc(m)+totFixas(m)+totParcelas(m);
const rendaCasal=()=>(+S.casal.rendaA||0)+(+S.casal.rendaB||0);
/* ---------------- MODO SOZINHO ---------------- */
const solo=()=>S.casal.modo==='solo';
/* ---------------- SALARIO MENSAL (recebe todo mes, pode mudar) ---------------- */
const valorSalario=(s,m)=>(s.over&&s.over[m]!=null)?+s.over[m]:(+s.valor||0);
const salariosMes=m=>S.salarios.filter(s=>s.ativo!==false&&(!s.inicio||m>=s.inicio));
const totSalarios=m=>salariosMes(m).reduce((x,s)=>x+valorSalario(s,m),0);
const totEntradas=m=>rendaCasal()+totSalarios(m)+totReceitas(m);
const sobraMes=m=>totEntradas(m)-totDesp(m);
const metaAtual=mt=>(mt.aportes||[]).reduce((s,a)=>s+(+a.valor||0),0);
/* cada aporte pode descontar ou nao do salario do mes (herda a regra da meta quando nao definido) */
const aporteDesconta=(mt,a)=>(a&&a.desc!=null)?!!a.desc:(mt.desconta!==false);
const guardadoMes=m=>S.metas.reduce((s,mt)=>s+(mt.aportes||[]).filter(a=>(a.data||'').slice(0,7)===m&&aporteDesconta(mt,a)).reduce((x,a)=>x+(+a.valor||0),0),0);
function aportesDia(ds){const o=[];S.metas.forEach(mt=>(mt.aportes||[]).forEach(a=>{if((a.data||'')===ds)o.push({mt,a})}));return o}
const guardadoTotal=()=>S.metas.reduce((s,mt)=>s+metaAtual(mt),0);
/* o que sobra livre no mês = entradas − despesas − o que foi guardado nas metas */
const dispMes=m=>totEntradas(m)-totDesp(m)-guardadoMes(m);
const alvoTotal=()=>S.metas.reduce((s,mt)=>s+(+mt.alvo||0),0);
const restanteParcelas=m=>S.parcelados.reduce((s,p)=>{const i=parcInfo(p,m);return s+(+p.valorParcela||0)*Math.max(0,p.parcelas-Math.max(0,i.idx))},0);
function divisaoMes(m){
 let a=0,b=0,comum=0;
 const add=(o,val)=>{const d=o.div||S.casal.div||'casal';
  if(d==='casal'){comum+=val;return}
  const s=shares(o);a+=val*s[0]/100;b+=val*s[1]/100;};
 despMes(m).forEach(l=>add(l,+l.valor||0));
 fixasMes(m).forEach(f=>add(f,+f.valor||0));
 parcelasMes(m).forEach(x=>add(x.p,+x.p.valorParcela||0));
 const t=a+b+comum;
 return {a,b,comum,total:t,pa:pct(a,t),pb:pct(b,t),pc:pct(comum,t)};
}
function evolucao(n){
 const out=[];for(let i=n-1;i>=0;i--){const m=addMes(S.ui.mes,-i);
  out.push({m,d:totDesp(m),g:guardadoMes(m),e:totEntradas(m),f:totFixas(m),v:totDespLanc(m),p:totParcelas(m)})}
 return out;
}
function projecao(){
 const y=S.ui.mes.slice(0,4);let fix=0,par=0;
 for(let i=0;i<12;i++){const m=y+'-'+String(i+1).padStart(2,'0');fix+=totFixas(m);par+=totParcelas(m)}
 return {fix,par};
}

/* ---------------- UI BASE ---------------- */
let toastT=null;
function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2800)}
function abrirModal(html,wide){$('#modalBody').innerHTML=html;const c=$('.modalCard');if(c)c.classList.toggle('wide',!!wide);const mo=$('#modal');mo.classList.add('on');mo.scrollTop=0;const bd=$('#modalBody');if(bd)bd.parentElement.scrollTop=0}
function fecharModal(){$('#modal').classList.remove('on')}
let CH={};
function killCharts(){Object.keys(CH).forEach(k=>{try{CH[k].destroy()}catch(e){}});CH={}}
function bar(v,cls){return '<div class="bar '+(cls||'')+'"><i style="width:'+Math.max(0,Math.min(100,v||0))+'%"></i></div>'}
function kpi(lbl,val,sub,gl){return '<div class="card kpi" style="--gl:radial-gradient(circle,'+gl+',transparent 70%)"><div class="lbl">'+lbl+'</div><div class="val">'+val+'</div><div class="sub">'+sub+'</div></div>'}
function pillDiv(o){const d=o.div||S.casal.div||'casal';const c=d==='casal'?'c':d==='A'?'a':d==='B'?'b':'';
 return '<span class="tag '+c+'" title="'+esc(divLonga(o))+'">÷ '+esc(divCurta(o))+'</span>'}
const TEMA=()=>S.ui.tema||'escuro';
function aplicarTema(){
 document.body.setAttribute('data-tema',TEMA());
 const tb=$('[data-act="tema"]');if(tb)tb.textContent=TEMA()==='claro'?'🌙 Escuro':'☀️ Claro';
}

/* ---------------- ROTEADOR ---------------- */
const PG={calendario:pgCalendario,resumo:pgResumo,lanc:pgLanc,fixas:pgFixas,parc:pgParc,recibos:pgRecibos,metas:pgMetas,acerto:pgAcerto,share:pgShare};
function render(){
 aplicarTema();
 const p=S.ui.pagina||'calendario';
 $$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.page===p));
 const m=S.ui.mes;
 $('#mesNome').textContent=mesNome(m);
 $('#mesSub').textContent='Despesas '+fmt(totDesp(m))+' • Entradas '+fmt(totEntradas(m));
 const renTot=rendaCasal()+totSalarios(m);
 $('#casalNome').textContent=(S.casal.a||S.casal.b)?(solo()?nomeA()+' • '+fmt(renTot)+'/mês':nomeA()+' & '+nomeB()+' • '+fmt(renTot)+'/mês'):'meu controle financeiro';
 $$('#tabs button').forEach(b=>{if(b.dataset.page==='acerto')b.style.display=solo()?'none':''});
 killCharts();
 $('#main').innerHTML=(PG[p]||PG.calendario)();
 if(p==='resumo')chartsResumo();
 if(p==='calendario'){const mn=document.getElementById('main');if(mn)mn.insertAdjacentHTML('afterbegin',alertas7()+barraSinc())}
 if(p==='lanc'&&typeof pgLancDepois==='function')pgLancDepois();
 if(p==='lanc'&&typeof cardSalarios==='function'){const mn=document.getElementById('main');if(mn)mn.insertAdjacentHTML('beforeend',cardSalarios())}
 if(p==='lanc'){const sel=document.querySelector('[data-form="lanc"] [name="metodo"]');
  const ehC=sel&&/cr[eé]dito/i.test(sel.value);['blocoCartao','blocoParcelas'].forEach(id=>{const x=document.getElementById(id);if(x)x.style.display=ehC?'':'none'})}
 if(p==='share'&&typeof cardModoUso==='function'){const mn=document.getElementById('main');if(mn)mn.insertAdjacentHTML('afterbegin',cardModoUso())}
 carimboInicio();
 window.scrollTo({top:0,behavior:'smooth'});
}
function irPara(pg){S.ui.pagina=pg;render()}

/* ---------------- CÉLULA DO DIA ---------------- */
function celDia(m,d,dentroModal){
 const ds=m+'-'+String(d).padStart(2,'0');
 const des=soma(despMes(m).filter(x=>x.data===ds));
 const rec=soma(recMes(m).filter(x=>x.data===ds));
 const fx=fixasDia(m,d),fxT=fx.reduce((s,f)=>s+(+f.valor||0),0);
 const pr=parcelasDia(m,d),prT=pr.reduce((s,x)=>s+(+x.p.valorParcela||0),0);
 const pago=fxT>0&&fx.every(f=>fixaPaga(f,m));
 const chips=[];
 if(des>0)chips.push('<span class="ce des">−'+fmt(des)+'</span>');
 if(rec>0)chips.push('<span class="ce rec">+'+fmt(rec)+'</span>');
 if(fxT>0)chips.push('<span class="ce fix'+(pago?' pg':'')+'">'+(pago?'✓ ':'')+fmt(fxT)+'</span>');
 if(prT>0)chips.push('<span class="ce par">'+fmt(prT)+'</span>');
 const lim=dentroModal?4:3,ver=chips.slice(0,lim),resto=chips.length-lim;
 const hoje=ds===hojeISO();
 return '<button class="cald'+(hoje?' hoje':'')+'" data-act="abrirDia" data-iso="'+ds+'"'+(dentroModal?' data-volta-mes="'+m+'"':'')+' title="'+dataBR(ds)+' — toque para ver e lançar">'
  +'<b>'+d+'</b>'+ver.join('')+(resto>0?'<span class="ce more">+'+(resto+1)+'</span>':'')+'</button>';
}
function gradeMes(m,dentroModal){
 const nd=qtdDias(m),start=diaSemana1(m);
 let h='<div class="calhead">'+DIAS.map((d,i)=>'<div'+(i===0||i===6?' class="fds"':'')+'>'+d+'</div>').join('')+'</div><div class="cal">';
 for(let i=0;i<start;i++)h+='<div class="cald off"></div>';
 for(let d=1;d<=nd;d++)h+=celDia(m,d,dentroModal);
 let u=start+nd;while(u%7!==0){h+='<div class="cald off"></div>';u++}
 return h+'</div>';
}
const LEGENDA='<div class="legenda">'
 +'<span><span class="ce des" style="display:inline-block">−R$ 00</span> despesas lançadas</span>'
 +'<span><span class="ce rec" style="display:inline-block">+R$ 00</span> receitas</span>'
 +'<span><span class="ce fix" style="display:inline-block">R$ 00</span> conta fixa vencendo</span>'
 +'<span><span class="ce pg" style="display:inline-block">✓ R$ 00</span> conta fixa já paga</span>'
 +'<span><span class="ce par" style="display:inline-block">R$ 00</span> parcela do mês</span></div>';

/* ---------------- PÁGINA: CALENDÁRIO ---------------- */
function pgCalendario(){
 const m=S.ui.mes,ent=totEntradas(m),des=totDesp(m),sob=ent-des;
 let h='';
 if(vazioTotal()){
  h+='<div class="card" style="margin-bottom:12px;background:linear-gradient(120deg,rgba(124,92,255,.16),transparent)">'
  +'<h3>👋 Bem-vindo ao app de vocês <small>ele começa vazio, do zero</small></h3>'
  +'<div class="quote">Nada de exemplo: os números que aparecerem aqui são só os de vocês. Comece colocando os nomes e as rendas em <b>Compartilhar &amp; Ajustes</b>, depois cadastre as contas fixas e use o calendário para lançar o dia a dia.</div>'
  +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="ir" data-pg="share">⚙️ Colocar nomes e rendas</button>'
  +'<button class="btn" data-act="novoDesp">＋ Primeiro lançamento</button>'
  +'<button class="btn gh" data-act="ir" data-pg="fixas">🔁 Cadastrar conta fixa</button></div></div>';
 }
 h+='<div class="grid g4" style="margin-bottom:12px">'
 +kpi('Entradas de '+mesAbrev(m),fmt(ent),'rendas + receitas lançadas','rgba(34,197,94,.45)')
 +kpi('Despesas do mês',fmt(des),Math.round(pct(des,ent))+'% das entradas','rgba(251,113,133,.45)')
 +kpi('Disponível no mês',fmt(dispMes(m)),'já descontando '+fmt(guardadoMes(m))+' guardado nas metas',(dispMes(m)>=0?'rgba(124,92,255,.45)':'rgba(251,113,133,.45)'))
 +kpi('Guardado no mês',fmt(guardadoMes(m)),S.metas.length+' meta(s) guardando','rgba(34,211,238,.45)')
 +'</div>';

 h+='<div class="card" style="margin-bottom:12px">'
 +'<h3><span>📅 '+mesNome(m)+'</span><small>toque num dia para lançar · toque no mês para ampliar</small></h3>'
 +gradeMes(m,false)
 +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="calCompleto">🔍 Abrir o mês completo</button>'
 +(m!==MESATUAL?'<button class="btn gh" data-act="mesHoje">Voltar para '+mesNome(MESATUAL)+'</button>':'')+'</div>'
 +LEGENDA+'</div>'
 +cardMetaCal(m);

 const abertas=fixasMes(m).filter(f=>!fixaPaga(f,m)).sort((a,b)=>(+a.dia||1)-(+b.dia||1));
 const diaHoje=+hojeISO().slice(8,10);
 const atras=(m===MESATUAL)?abertas.filter(f=>+f.dia<diaHoje):[];
 const fixTot=totFixas(m),fixPg=fixasMes(m).filter(f=>fixaPaga(f,m)).reduce((s,f)=>s+(+f.valor||0),0);
 h+='<div class="grid g2" style="margin-bottom:12px">'
 +'<div class="card"><h3><span>🔁 Contas fixas do mês</span><small>'+abertas.length+' em aberto de '+fixasMes(m).length+'</small></h3>'
 +(fixasMes(m).length?fixasMes(m).slice().sort((a,b)=>(+a.dia||1)-(+b.dia||1)).map(f=>'<div class="li">'
   +'<input type="checkbox" '+(fixaPaga(f,m)?'checked':'')+' data-act="togFixa" data-id="'+f.id+'" aria-label="'+esc(f.nome)+'" style="width:18px;height:18px;accent-color:#22c55e;flex:0 0 auto">'
   +'<span class="tag">dia '+f.dia+'</span><span class="nm" style="'+(fixaPaga(f,m)?'opacity:.55;text-decoration:line-through':'')+'">'+esc(f.nome)+(f.over?' <span class="tag c">ajustada</span>':'')+'</span>'
   +'<b class="mono">'+fmt(f.valor)+'</b></div>').join(''):'<div class="empty">Nenhuma conta fixa ainda.<br>Aluguel, luz, água, internet, streaming...</div>')
 +'<div class="split" style="margin-top:12px"><span class="mut sm">Pago <b class="pos">'+fmt(fixPg)+'</b> de '+fmt(fixTot)+'</span>'
 +'<button class="btn sm pri" data-act="ir" data-pg="fixas">Gerenciar</button></div>'+bar(pct(fixPg,fixTot),'g')
 +(atras.length?'<div class="row-bt" style="margin-top:10px"><span class="pill up">⚠️ '+atras.length+' vencida(s): '+atras.map(f=>esc(f.nome)).join(', ')+'</span></div>':'')+'</div>'

 +'<div class="card"><h3><span>💳 Parcelas deste mês</span><small>'+parcelasMes(m).length+' cobrança(s)</small></h3>'
 +(parcelasMes(m).length?parcelasMes(m).map(x=>'<div style="margin-bottom:11px"><div class="lg" style="margin:0"><span class="nm">'+esc(x.p.nome)+'</span><b class="mono sm">'+fmt(x.p.valorParcela)+'</b></div>'
   +bar(x.i.progresso,'w')+'<div class="mut sm">parcela <b>'+x.i.atual+' de '+x.p.parcelas+'</b> • termina em '+mesAbrev(x.i.fim)+' • falta '+fmt(x.i.restante)+'</div></div>').join('')
  :'<div class="empty">Nenhuma compra parcelada cadastrada.</div>')
 +'<div class="split" style="margin-top:12px"><span class="mut sm">Total do mês <b>'+fmt(totParcelas(m))+'</b></span>'
 +'<button class="btn sm pri" data-act="ir" data-pg="parc">Gerenciar</button></div></div>'
 +'</div>';

 h+='<div class="card"><h3><span>⏭️ O que vem nos próximos dias</span><small>a partir de hoje</small></h3>';
 const prox=[];
 for(let i=0;i<=21;i++){
  const d=new Date();d.setDate(d.getDate()+i);const ds=iso(d),mm=ds.slice(0,7);
  fixasDia(mm,diaDe(ds)).forEach(f=>{if(!fixaPaga(f,mm))prox.push({q:i,ds,t:'Conta fixa',n:f.nome,v:+f.valor||0,cls:'fix'})});
  parcelasDia(mm,diaDe(ds)).forEach(x=>prox.push({q:i,ds,t:'Parcela '+x.i.atual+'/'+x.p.parcelas,n:x.p.nome,v:+x.p.valorParcela||0,cls:'par'}));
  lancDia(ds).forEach(l=>prox.push({q:i,ds,t:l.tipo==='receita'?'Receita':'Despesa',n:l.desc,v:+l.valor||0,cls:l.tipo==='receita'?'rec':'des'}));
 }
 if(!prox.length)h+='<div class="empty">Nada agendado para os próximos dias.</div>';
 else h+=prox.sort((a,b)=>a.q-b.q).slice(0,12).map(p=>'<div class="li"><span class="ce '+p.cls+'" style="min-width:64px;text-align:center">'+(p.q===0?'hoje':'em '+p.q+'d')+'</span>'
  +'<span class="nm">'+esc(p.n)+' <span class="mut sm">• '+p.t+'</span></span><span class="mut sm hidemob">'+dataBR(p.ds)+'</span><b class="mono">'+fmt(p.v)+'</b></div>').join('');
 return h+'</div>';
}

/* ---------------- MODAL: MÊS COMPLETO ---------------- */
function modalMes(m){
 const nd=qtdDias(m),ent=totEntradas(m),des=totDesp(m),sob=ent-des;
 const fx=fixasMes(m),pr=parcelasMes(m),lc=lancMes(m).slice().sort((a,b)=>(a.data||'').localeCompare(b.data||''));
 const fxTot=fx.reduce((s,f)=>s+(+f.valor||0),0);
 const fxPg=fx.filter(f=>fixaPaga(f,m)).reduce((s,f)=>s+(+f.valor||0),0);
 const ev=[];
 lc.forEach(l=>ev.push({d:diaDe(l.data),t:l.tipo==='receita'?'rec':'des',ic:catInfo(l.categoria).i,nome:l.desc,val:+l.valor||0,
  txt:l.tipo==='receita'?'receita':'despesa',sub:rq(l.pagador||'C')+' • '+divCurta(l)+(l.metodo?' • '+l.metodo:'')+(l.obs?' • '+esc(l.obs):'')}));
 fx.forEach(f=>{const pg=fixaPaga(f,m);const atr=m===MESATUAL&&!pg&&+f.dia<+hojeISO().slice(8,10);
  ev.push({d:+f.dia,t:'fix',ic:catInfo(f.categoria).i,nome:f.nome,val:+f.valor||0,pago:pg,
   txt:pg?'conta fixa paga':(atr?'conta fixa vencida':'conta fixa'),
   sub:'vence dia '+f.dia+' • '+rq(f.pagador||'C')+' • '+divCurta(f)+(f.over?' • valor ajustado neste mês':'')+' — marque em Contas fixas'});});
 pr.forEach(x=>ev.push({d:+x.p.dia,t:'par',ic:'💳',nome:x.p.nome,val:+x.p.valorParcela||0,
  txt:'parcela '+x.i.atual+'/'+x.p.parcelas,sub:rq(x.p.pagador||'C')+' • '+divCurta(x.p)+' • termina em '+mesAbrev(x.i.fim)}));
 ev.sort((a,b)=>a.d-b.d);
 let agenda='';
 if(!ev.length)agenda='<div class="empty">Nenhum lançamento, conta fixa ou parcela neste mês.</div>';
 else{
  let at=-1;
  ev.forEach(e=>{
   if(e.d!==at){at=e.d;agenda+='<div class="ag-dia">Dia '+String(e.d).padStart(2,'0')+' · '+dataLonga(m+'-'+String(e.d).padStart(2,'0'))+'</div>'}
   agenda+='<div class="li"><span class="ce '+e.t+(e.pago?' pg':'')+'" style="flex:0 0 auto">'+e.ic+' '+e.txt+'</span>'
   +'<span class="nm">'+esc(e.nome)+'<div class="mut sm">'+e.sub+'</div></span>'
   +'<b class="mono '+(e.t==='rec'?'pos':e.t==='des'?'neg':'')+'">'+(e.t==='rec'?'+':e.t==='des'?'−':'')+fmt(e.val)+'</b></div>';
  });
 }
 const nav='<div class="modhead">'
 +'<button class="round" data-act="mesModal" data-mes="'+addMes(m,-1)+'" title="mês anterior">◀</button>'
 +'<div style="flex:1;min-width:120px"><div style="font-size:18px;font-weight:850;letter-spacing:-.6px">'+mesNome(m)+'</div>'
 +'<div class="mut sm">'+lc.length+' lançamento(s) • '+fx.length+' conta(s) fixa(s) • '+pr.length+' parcela(s)</div></div>'
 +'<button class="round" data-act="mesModal" data-mes="'+addMes(m,1)+'" title="próximo mês">▶</button>'
 +'<button class="btn sm" data-act="mesModal" data-mes="'+MESATUAL+'">Hoje</button></div>';
 abrirModal(nav
 +'<div class="chips"><span class="chip in">Entradas '+fmt(ent)+'</span><span class="chip out">Despesas '+fmt(des)+'</span>'
 +'<span class="chip '+(sob>=0?'ok':'bad')+'">Sobra '+fmt(sob)+'</span>'
 +'<span class="chip fx">Fixas pagas '+fmt(fxPg)+' de '+fmt(fxTot)+'</span></div>'
 +gradeMes(m,true)
 +LEGENDA
 +'<div class="row-bt" style="margin-top:14px"><button class="btn pri sm" data-act="novoDesp">＋ Lançamento</button>'
 +'<button class="btn sm" data-act="irMes" data-mes="'+m+'">📊 Usar este mês no app</button>'
 +'<button class="btn sm gh" data-act="csvLanc" data-mes="'+m+'">⬇️ CSV</button></div>'
 +'<h3 style="margin:18px 0 4px">🗓️ Agenda completa do mês</h3>'
 +'<div style="max-height:44vh;overflow:auto">'+agenda+'</div>',true);
}

/* ---------------- MODAL: DIA ---------------- */
function modalDia(ds,voltaMes){
 const m=ds.slice(0,7);
 const des=lancDia(ds).filter(l=>l.tipo!=='receita');
 const rec=lancDia(ds).filter(l=>l.tipo==='receita');
 const fix=fixasDia(m,diaDe(ds));
 const par=parcelasDia(m,diaDe(ds));
 const apo=aportesDia(ds);
 const linhaL=l=>'<div class="li"><span class="tag">'+catInfo(l.categoria).i+' '+esc(l.categoria||'Outros')+'</span>'
  +'<span class="nm"><b>'+esc(l.desc)+'</b><div class="mut sm">pago por '+esc(rq(l.pagador||'C'))+' • '+esc(divLonga(l))+(l.metodo?' • '+esc(l.metodo):'')+(l.obs?' • '+esc(l.obs):'')+'</div></span>'
  +'<b class="mono '+(l.tipo==='receita'?'pos':'neg')+'">'+(l.tipo==='receita'?'+':'−')+fmt(l.valor)+'</b>'
  +'<button class="btn sm gh" data-act="editLanc" data-id="'+l.id+'" title="editar">✏️</button>'
  +'<button class="btn sm gh danger" data-act="delLanc" data-id="'+l.id+'" title="excluir">🗑️</button></div>';
 abrirModal('<div class="row-bt" style="justify-content:space-between;margin-bottom:6px"><div><div style="font-size:17px;font-weight:850">'+dataLonga(ds)+'</div>'
 +'<div class="mut sm">despesas '+fmt(soma(des))+(rec.length?' • receitas '+fmt(soma(rec)):'')+(fix.length?' • '+fix.length+' conta(s) fixa(s)':'')+'</div></div>'
 +(voltaMes?'<button class="btn sm" data-act="mesModal" data-mes="'+voltaMes+'">← voltar ao mês</button>':'')+'</div>'
 +'<div class="row-bt" style="margin:12px 0"><button class="btn pri sm" data-act="novoDesp" data-iso="'+ds+'">＋ Despesa nesse dia</button>'
 +'<button class="btn sm" data-act="novaRec" data-iso="'+ds+'">＋ Receita nesse dia</button>'
 +'<button class="btn sm ok" data-act="metaDia" data-iso="'+ds+'">🎯 Meta nesse dia</button></div>'
 +(fix.length?'<div class="quote" style="margin-bottom:12px"><b>🔁 Contas fixas vencendo nesse dia</b>'
   +fix.map(f=>'<label class="li" style="cursor:pointer"><input type="checkbox" '+(fixaPaga(f,m)?'checked':'')+' data-act="togFixa" data-id="'+f.id+'" style="width:18px;height:18px;accent-color:#22c55e;flex:0 0 auto">'
   +'<span class="nm">'+esc(f.nome)+'</span><b class="mono">'+fmt(f.valor)+'</b></label>').join('')+'</div>':'')
 +(apo.length?'<div class="quote" style="margin-top:12px"><b>🎯 Guardado nas metas nesse dia</b>'
   +apo.map(x=>'<div class="li"><span class="nm">'+esc(x.mt.nome)+' <span class="mut sm">'+(aporteDesconta(x.mt,x.a)?'desconta do salário':'não desconta')+'</span></span><b class="mono">'+fmt(x.a.valor)+'</b>'
   +'<button class="btn sm gh" data-act="editAporte" data-id="'+x.mt.id+'" data-aid="'+x.a.id+'" title="editar">✏️</button>'
   +'<button class="btn sm gh danger" data-act="delAporte" data-id="'+x.mt.id+'" data-aid="'+x.a.id+'" title="excluir">🗑️</button></div>').join('')+'</div>':'')
 +(des.length?'<h3 style="margin:14px 0 2px">🔻 Despesas lançadas</h3>'+des.map(linhaL).join(''):'')
 +(rec.length?'<h3 style="margin:14px 0 2px">🔺 Receitas lançadas</h3>'+rec.map(linhaL).join(''):'')
 +(par.length?'<div class="quote" style="margin-top:12px"><b>💳 Parcelas com esse dia de cobrança</b>'
   +par.map(x=>'<label class="li" style="cursor:pointer"><input type="checkbox" '+(parcelaPaga(x.p,m)?'checked':'')+' data-act="togParc" data-id="'+x.p.id+'" data-mes="'+m+'" style="width:18px;height:18px;accent-color:#fbbf24;flex:0 0 auto">'
   +'<span class="nm">'+esc(x.p.nome)+' <span class="mut sm">parcela '+x.i.atual+'/'+x.p.parcelas+'</span>'
   +(parcelaPaga(x.p,m)?' <span class="tag g">paga</span>':' <span class="tag">em aberto</span>')+'</span>'
   +'<b class="mono">'+fmt(x.p.valorParcela)+'</b></label>').join('')+'</div>':'')
 +(des.length||rec.length||fix.length||par.length||apo.length?'':'<div class="empty">Nada lançado nesse dia ainda.<br>Use os botões acima para registrar.</div>'));
}

;
/* ============================================================
   C2: Resumo, Lançamentos, Contas fixas, Parcelados
   ============================================================ */

/* ---------------- RESUMO / DASHBOARD ---------------- */
function pgResumo(){
 const m=S.ui.mes,ent=totEntradas(m),des=totDesp(m),sob=ent-des;
 const d=divisaoMes(m),proj=projecao(),gdm=guardadoMes(m);
 const desp=despMes(m);
 const porCat=CATS.map(c=>({n:c.n,c:c.c,i:c.i,total:desp.filter(x=>(x.categoria||'Outros')===c.n).reduce((s,x)=>s+(+x.valor||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
 const somaCat=porCat.reduce((s,x)=>s+x.total,0);
 const restante=restanteParcelas(m);
 let h='';
 const dispM=ent-des-gdm;
 h+='<section class="hero" style="margin-bottom:13px"><div style="flex:1;min-width:260px">'
 +'<span class="pill tmp">'+mesNome(m)+'</span> <span class="pill '+(dispM>=0?'down':'up')+'">'+(dispM>=0?'livre no mês ':'faltou ')+fmt(Math.abs(dispM))+'</span>'
 +'<div class="big">'+fmt(dispM)+'</div>'
 +'<div class="mut sm">Entradas '+fmt(ent)+' − Despesas '+fmt(des)+' − Guardado nas metas '+fmt(gdm)+' • sobra de '+ (ent>0?pct(dispM,ent).toFixed(1).replace('.',','):'0')+'%</div>'
 +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="novoDesp">＋ Lançamento</button>'
 +'<button class="btn" data-act="novoAporte">🐖 Guardar nas metas</button>'
 +'<button class="btn gh" data-act="ir" data-pg="calendario">📅 Ver no calendário</button></div></div>'
 +'<div class="hero-mini" style="display:flex;gap:20px;flex-wrap:wrap">'
 +'<div><span class="lbl mut sm">Contas fixas</span><br><b>'+fmt(totFixas(m))+'</b></div>'
 +'<div><span class="lbl mut sm">Gastos variáveis</span><br><b>'+fmt(totDespLanc(m))+'</b></div>'
 +'<div><span class="lbl mut sm">Parcelas do mês</span><br><b>'+fmt(totParcelas(m))+'</b></div>'
 +'<div><span class="lbl mut sm">Guardado</span><br><b>'+fmt(gdm)+'</b></div>'
 +'<div><span class="lbl mut sm">Falta pagar em parcelas</span><br><b>'+fmt(restante)+'</b></div>'
 +'</div></section>';

 h+='<div class="grid g4" style="margin-bottom:13px">'
 +kpi('Despesas do mês',fmt(des),desp.length+' lançamentos + fixas + parcelas','rgba(251,113,133,.5)')
 +kpi('Entradas do mês',fmt(ent),'renda do casal '+fmt(rendaCasal()),'rgba(52,211,153,.5)')
 +kpi('Custo de vida fixo',fmt(totFixas(m)+totParcelas(m)),'compromissos que se repetem','rgba(34,211,238,.5)')
 +kpi('Taxa de sobra',ent>0?pct(sob,ent).toFixed(1).replace('.',',')+'%':'—','ideal guardar 10% ou mais','rgba(124,92,255,.5)')
 +'</div>';

 if(!desp.length&&!totFixas(m)&&!totParcelas(m)){
  h+='<div class="card" style="margin-bottom:13px"><div class="empty">Este mês ainda está sem lançamentos.<br>Comece pelo calendário: toque num dia e registre o que aconteceu. 📅</div>'
  +'<div class="row-bt" style="justify-content:center"><button class="btn pri" data-act="novoDesp">＋ Lançar agora</button>'
  +'<button class="btn gh" data-act="ir" data-pg="fixas">🔁 Cadastrar contas fixas</button></div></div>';
  return h;
 }

 h+='<div class="grid g2" style="margin-bottom:13px">'
 +'<div class="card"><h3>🍩 Para onde foi o dinheiro <small>'+mesNome(m)+'</small></h3><div style="height:250px"><canvas id="cCat"></canvas></div></div>'
 +'<div class="card"><h3>📈 Últimos 6 meses <small>despesas x guardado</small></h3><div style="height:250px"><canvas id="cEvo"></canvas></div></div>'
 +'</div>';

 h+='<div class="grid g2" style="margin-bottom:13px">'
 +'<div class="card"><h3>🧩 Composição do mês <small>fixo x variável x parcelado</small></h3><div style="height:220px"><canvas id="cComp"></canvas></div></div>'
 +'<div class="card"><h3>💚 Como o mês está dividido <small>informativo — dinheiro em comum</small></h3><div style="height:220px"><canvas id="cDiv"></canvas></div></div>'
 +'</div>';

 h+='<div class="grid g2" style="margin-bottom:13px">'
 +'<div class="card"><h3>🏆 Maiores categorias</h3>'
 +(porCat.length?porCat.slice(0,7).map(c=>'<div class="lg"><span class="dot" style="background:'+c.c+'"></span><span class="nm">'+c.i+' '+c.n+'</span><b class="mono sm">'+fmt(c.total)+'</b></div>'+bar(pct(c.total,somaCat||1),'g')).join(''):'<div class="empty">Sem despesas lançadas.</div>')
 +'</div>'
 +'<div class="card"><h3>📊 Projeção do ano <small>'+m.slice(0,4)+'</small></h3>'
 +'<div class="lg"><span class="nm mut">Contas fixas no ano</span><b class="mono">'+fmt(proj.fix)+'</b></div>'
 +'<div class="lg"><span class="nm mut">Parcelas no ano</span><b class="mono">'+fmt(proj.par)+'</b></div>'
 +'<div class="lg"><span class="nm mut">Fixo + parcelado por mês</span><b class="mono">'+fmt(totFixas(m)+totParcelas(m))+'</b></div>'
 +'<div class="lg"><span class="nm mut">Sobra projetada em 12 meses</span><b class="mono" style="color:#6ee7b7">'+fmt(Math.max(0,sob)*12)+'</b></div>'
 +'<div class="quote" style="margin-top:10px">Se vocês mantiverem esse ritmo, em um ano dá <b>'+fmt(Math.max(0,sob)*12)+'</b>. '
 +((ent>0&&pct(sob,ent)<10)?'Hoje a sobra é de '+pct(sob,ent).toFixed(1).replace('.',',')+'% — vale tentar chegar em 10%.':'A sobra está saudável. 👏')
 +'</div></div></div>';

 h+='<div class="card"><h3>💚 Divisão do mês, pessoa por pessoa <small>'+(S.casal.div==='casal'?'dividindo tudo igualmente':'conforme a regra escolhida')+'</small></h3>'
 +'<div class="grid g3">'
 +'<div><div class="lg" style="margin:0"><span class="nm"><b>'+esc(nomeA())+'</b></span><b class="mono">'+fmt(d.a)+'</b></div>'+bar(d.pa,'a')
 +'<div class="mut sm">'+d.pa.toFixed(1).replace('.',',')+'% das despesas do mês</div></div>'
 +'<div><div class="lg" style="margin:0"><span class="nm"><b>'+esc(nomeB())+'</b></span><b class="mono">'+fmt(d.b)+'</b></div>'+bar(d.pb,'b')
 +'<div class="mut sm">'+d.pb.toFixed(1).replace('.',',')+'% das despesas do mês</div></div>'
 +'<div><div class="lg" style="margin:0"><span class="nm"><b>Conta conjunta</b></span><b class="mono">'+fmt(d.comum)+'</b></div>'+bar(d.pc,'')
 +'<div class="mut sm">'+d.pc.toFixed(1).replace('.',',')+'% pago do dinheiro em comum</div></div>'
 +'</div>'
 +'<div class="quote" style="margin-top:12px">Aqui ninguém deve nada a ninguém: o app só mostra <b>quanto cada um colocou</b> no mês para vocês conversarem sobre o equilíbrio. Quando o lançamento é <b>do casal</b>, o valor sai do dinheiro em comum e não entra nessa conta.</div></div>';
 return h;
}

function chartsResumo(){
 if(typeof Chart==='undefined')return;
 const m=S.ui.mes,desp=despMes(m);
 const CS=getComputedStyle(document.body);
 const CTXT=(CS.getPropertyValue('--chart-txt')||'').trim()||'#8f98b5';
 const CGRID=(CS.getPropertyValue('--chart-grid')||'').trim()||'rgba(255,255,255,.07)';
 const CBRD=(CS.getPropertyValue('--surface-solid')||'').trim()||'#141827';
 Chart.defaults.color=CTXT;Chart.defaults.borderColor=CGRID;Chart.defaults.font.family='Inter,system-ui,sans-serif';
 const porCat=CATS.map(c=>({n:c.n,c:c.c,i:c.i,total:desp.filter(x=>(x.categoria||'Outros')===c.n).reduce((s,x)=>s+(+x.valor||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
 const e1=$('#cCat');
 if(e1)CH.cat=new Chart(e1,{type:'doughnut',data:{labels:porCat.map(c=>c.i+' '+c.n),datasets:[{data:porCat.map(c=>c.total),backgroundColor:porCat.map(c=>c.c),borderColor:CBRD,borderWidth:3,hoverOffset:9}]},
  options:{maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'right',labels:{boxWidth:11,padding:11,font:{size:11.5}}},tooltip:{callbacks:{label:x=>' '+x.label+': '+fmt(x.parsed)}}}}});
 const evo=evolucao(6);
 const e2=$('#cEvo');
 if(e2)CH.evo=new Chart(e2,{type:'line',data:{labels:evo.map(e=>mesAbrev(e.m)),datasets:[
  {label:'Despesas',data:evo.map(e=>e.d),borderColor:'#fb7185',backgroundColor:'rgba(251,113,133,.16)',fill:true,tension:.38,pointRadius:3.5,pointBackgroundColor:'#fb7185',borderWidth:2.5},
  {label:'Guardado',data:evo.map(e=>e.g),borderColor:'#34d399',backgroundColor:'rgba(52,211,153,.14)',fill:true,tension:.38,pointRadius:3.5,pointBackgroundColor:'#34d399',borderWidth:2.5}]},
  options:{maintainAspectRatio:false,plugins:{legend:{labels:{boxWidth:11}},tooltip:{callbacks:{label:x=>' '+x.dataset.label+': '+fmt(x.parsed.y)}}},
   scales:{y:{ticks:{callback:v=>fmtC(v)},grid:{color:'rgba(255,255,255,.06)'}},x:{grid:{display:false}}}}});
 const e3=$('#cComp');
 if(e3)CH.comp=new Chart(e3,{type:'bar',data:{labels:['Contas fixas','Gastos variáveis','Parcelados'],
  datasets:[{data:[totFixas(m),totDespLanc(m),totParcelas(m)],backgroundColor:['#22d3ee','#f472b6','#fbbf24'],borderRadius:9,barThickness:24}]},
  options:{indexAxis:'y',maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>' '+fmt(x.parsed.x)}}},
   scales:{x:{ticks:{callback:v=>fmtC(v)},grid:{color:'rgba(255,255,255,.06)'}},y:{grid:{display:false}}}}});
 const d=divisaoMes(m),e4=$('#cDiv');
 if(e4)CH.div=new Chart(e4,{type:'bar',data:{labels:[nomeA(),nomeB(),'Conta conjunta'],
  datasets:[{data:[Math.round(d.pa*10)/10,Math.round(d.pb*10)/10,Math.round(d.pc*10)/10],
   backgroundColor:['#60a5fa','#f472b6','#94a3b8'],borderRadius:9,barThickness:40}]},
  options:{maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:x=>' '+x.parsed.y.toFixed(1).replace('.',',')+'% das despesas'}}},
   scales:{y:{max:100,ticks:{callback:v=>v+'%'},grid:{color:'rgba(255,255,255,.06)'}},x:{grid:{display:false}}}}});
}

/* ---------------- FORMULÁRIO DE LANÇAMENTO ---------------- */
function formLanc(l){
 const e=l||{tipo:'despesa',desc:'',valor:'',data:hojeISO(),categoria:'Mercado',pagador:'C',div:S.casal.div||'casal',pctA:50,metodo:'Pix',obs:'',recibo:''};
 const pctA=e.pctA==null?50:e.pctA;
 return '<form data-form="lanc"><input type="hidden" name="id" value="'+(l?l.id:'')+'" data-dupes="'+(window.DUPES||0)+'">'
 +'<div class="form">'
 +'<div><label class="f">Tipo</label><select name="tipo" data-act="mudouTipo"><option value="despesa"'+(e.tipo!=='receita'?' selected':'')+'>🔻 Despesa</option><option value="receita"'+(e.tipo==='receita'?' selected':'')+'>🔺 Receita</option></select></div>'
 +'<div><label class="f">Valor (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00" value="'+(e.valor||'')+'"></div>'
 +'<div><label class="f">Data</label><input type="date" name="data" value="'+(e.data||hojeISO())+'"></div>'
 +'<div><label class="f">Categoria</label><select name="categoria">'+opcoesCats(e.categoria)+'</select></div>'
 +'<div class="full"><label class="f">Descrição</label><input name="desc" required placeholder="Ex.: mercado da semana" value="'+esc(e.desc)+'"></div>'
 +'<div><label class="f">'+(e.tipo==='receita'?'Receita de quem':'Quem pagou')+'</label><select name="pagador">'+opcoesQuem(e.pagador||'C')+'</select></div>'
 +'<div><label class="f">Forma de pagamento</label><select name="metodo" data-act="mudouMetodo">'+METODOS.map(x=>'<option'+(x===e.metodo?' selected':'')+'>'+x+'</option>').join('')+'</select></div>'
 +'<div id="blocoCartao"><label class="f">Vence em (cartão de crédito)</label><input type="date" name="venc" value="'+(e.venc||'')+'"><div class="mut sm" style="margin-top:5px">No crédito, o app lança a despesa no dia do <b>vencimento da fatura</b>.</div></div>'
 +'<div id="blocoParcelas"><label class="f">Parcelas no cartão</label><input name="parcelasCartao" type="number" min="1" max="48" step="1" value="'+(e.parcelasCartao||1)+'"><div class="mut sm" style="margin-top:5px">2x ou mais: informe o valor <b>total</b> da compra e o app cria uma parcela por mês.</div></div>'
 +'<div class="full"><label class="f">Como dividir o valor</label><select name="div">'+opcoesDiv(e.div)+'</select>'
 +'<div class="mut sm" style="margin-top:5px">Só para organizar: mostra quanto cada um entra. Não gera dívida nem cobrança entre vocês.</div></div>'
 +'<div><label class="f">% da '+esc(nomeA())+'</label><input name="pctA" type="number" min="0" max="100" step="1" value="'+pctA+'"><div class="mut sm" style="margin-top:5px">Usado só se escolher “Percentual personalizado”.</div></div>'
 +'<div><label class="f">Recibo vinculado</label><select name="recibo"><option value="">— sem recibo —</option>'+S.recibos.map(r=>'<option value="'+r.id+'"'+(e.recibo===r.id?' selected':'')+'>'+esc(r.nome)+'</option>').join('')+'</select></div>'
 +'<div class="full"><label class="f">Observação</label><input name="obs" placeholder="opcional" value="'+esc(e.obs||'')+'"></div>'
 +'<div class="full"><div class="quote" id="cartaoPrev">💳 No crédito você pode informar o vencimento da fatura e dividir a compra em parcelas — o app cria as parcelas dos meses seguintes sozinho.</div></div>'
 +'<div class="full"><div class="quote" id="pagPrev">'+previaDiv(e)+'</div></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">'+(l?'Salvar alteração':'Adicionar lançamento')+'</button>'
 +(l?'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button>':'<button class="btn gh" type="submit" data-act="mais">＋ Adicionar e lançar outro</button>')+'</div></form>';
}

/* ---------------- LANÇAMENTOS ---------------- */
function pgLanc(){
 const m=S.ui.mes,f=S.ui.f;
 let lst=lancMes(m);
 if(f.tipo)lst=lst.filter(x=>x.tipo===f.tipo);
 if(f.cat)lst=lst.filter(x=>(x.categoria||'Outros')===f.cat);
 if(f.pessoa)lst=lst.filter(x=>f.pessoa==='CASAL'?((x.div||S.casal.div||'casal')==='casal'):((x.pagador||'C')===f.pessoa));
 if(f.valor){const sv=String(f.valor).trim();const nv=pnum(sv);if(sv&&nv>0)lst=lst.filter(x=>Math.abs((+x.valor||0)-nv)<0.005)}
 if(f.busca){const b=f.busca.trim().toLowerCase();if(b)lst=lst.filter(x=>(x.desc||'').toLowerCase().includes(b)||(x.obs||'').toLowerCase().includes(b)||(x.categoria||'').toLowerCase().includes(b)||(x.metodo||'').toLowerCase().includes(b)||(+x.valor||0).toFixed(2).replace('.',',').includes(b))}
 lst=lst.slice().sort((a,b)=>(b.data||'').localeCompare(a.data||''));
 const td=soma(lst.filter(x=>x.tipo!=='receita')),tr=soma(lst.filter(x=>x.tipo==='receita'));
 let h='<div class="grid g4" style="margin-bottom:13px">'
 +kpi('Receitas lançadas',fmt(tr),lst.filter(x=>x.tipo==='receita').length+' neste mês','rgba(52,211,153,.5)')
 +kpi('Despesas lançadas',fmt(td),lst.filter(x=>x.tipo!=='receita').length+' neste mês','rgba(251,113,133,.5)')
 +kpi('Resultado',fmt(tr-td),(tr-td>=0?'sobrou':'faltou')+' nestes lançamentos','rgba(124,92,255,.5)')
 +kpi('Total de lançamentos',String(lst.length),'filtro atual','rgba(34,211,238,.5)')
 +'</div>';
 h+='<div class="card novoLanc" style="margin-bottom:13px"><h3>➕ Novo lançamento <small>entra no dia que você escolher</small></h3>'+formLanc(null)+'</div>';
 h+='<div class="card"><h3>🧾 Lançamentos de '+mesNome(m)+' <small>'+lst.length+' item(ns)</small></h3>'
 +'<div class="form" style="margin-bottom:11px">'
 +'<div><label class="f">Tipo</label><select data-act="filtro" data-k="tipo"><option value="">Todos</option><option value="despesa"'+(f.tipo==='despesa'?' selected':'')+'>Despesas</option><option value="receita"'+(f.tipo==='receita'?' selected':'')+'>Receitas</option></select></div>'
 +'<div><label class="f">Categoria</label><select data-act="filtro" data-k="cat"><option value="">Todas</option>'+opcoesCats(f.cat)+'</select></div>'
 +'<div><label class="f">Quem pagou</label><select data-act="filtro" data-k="pessoa">'+opcoesPessoa(f.pessoa||'')+'</select></div>'
 +'<div><label class="f">Valor exato (R$)</label><input data-act="filtro" data-k="valor" inputmode="decimal" placeholder="ex.: 240,00" value="'+esc(f.valor||'')+'"></div>'
 +'<div><label class="f">Busca rápida</label><input data-act="filtro" data-k="busca" placeholder="nome, valor ou categoria" value="'+esc(f.busca)+'"></div>'
 +'<div class="row-bt" style="align-items:flex-end"><button class="btn sm gh" data-act="limparFiltro">Limpar</button><button class="btn sm gh" data-act="excel">📊 Excel</button></div>'
 +'</div>'
 +(lst.length?'<div style="overflow-x:auto"><table><thead><tr><th>Dia</th><th>Descrição</th><th class="hidemob">Categoria</th><th class="hidemob">Pagou</th><th>Divisão</th><th class="num">Valor</th><th></th></tr></thead><tbody>'
  +lst.map(l=>'<tr><td class="mono sm">'+dataBR(l.data).slice(0,5)+'</td>'
  +'<td><b>'+esc(l.desc)+'</b>'+(l.obs?'<div class="mut sm">'+esc(l.obs)+'</div>':'')+(l.metodo?'<div class="mut sm">'+esc(l.metodo)+'</div>':'')+'</td>'
  +'<td class="hidemob"><span class="tag">'+catInfo(l.categoria).i+' '+esc(l.categoria||'Outros')+'</span></td>'
  +'<td class="hidemob">'+esc(rq(l.pagador||'C'))+'</td>'
  +'<td>'+pillDiv(l)+'</td>'
  +'<td class="num" style="color:'+(l.tipo==='receita'?'#6ee7b7':'inherit')+'">'+(l.tipo==='receita'?'+':'−')+fmt(l.valor)+'</td>'
  +'<td class="right" style="white-space:nowrap">'+(l.recibo?'<button class="btn sm gh" data-act="verRecibo" data-id="'+l.recibo+'" title="ver recibo">📎</button> ':'')
  +'<button class="btn sm gh" data-act="duplicar" data-id="'+l.id+'" title="duplicar lançamento">📋</button> <button class="btn sm gh" data-act="editLanc" data-id="'+l.id+'">✏️</button> <button class="btn sm gh danger" data-act="delLanc" data-id="'+l.id+'">🗑️</button></td></tr>').join('')
  +'</tbody></table></div>':'<div class="empty">Nenhum lançamento neste mês com esses filtros.</div>')
 +blocosPessoa(lst)
 +'<div class="row-bt" style="margin-top:13px"><button class="btn pri sm" data-act="excel">📊 Baixar Excel (XLSX)</button>'
 +'<button class="btn sm gh" data-act="csvLanc">⬇️ CSV do mês</button>'
 +'<button class="btn sm gh" data-act="novoLanc">＋ Novo lançamento</button></div>'
 +'</div>';
 return h;
}

/* ---------------- FORMS DE EDIÇÃO (contas fixas / parcelados) ---------------- */
function formFixaEdit(base,m){
 const e=fixaEm(base,m);
 return '<form data-form="fixaEdit"><input type="hidden" name="id" value="'+base.id+'"><input type="hidden" name="mes" value="'+m+'">'
 +'<div class="form">'
 +'<div class="full"><label class="f">Nome da conta</label><input name="nome" required value="'+esc(e.nome)+'"></div>'
 +'<div><label class="f">Valor (R$)</label><input name="valor" required inputmode="decimal" value="'+(+e.valor).toFixed(2).replace('.',',')+'"></div>'
 +'<div><label class="f">Dia do vencimento</label><input name="dia" type="number" min="1" max="31" value="'+e.dia+'"></div>'
 +'<div><label class="f">Categoria</label><select name="categoria">'+opcoesCats(e.categoria)+'</select></div>'
 +'<div><label class="f">Quem paga</label><select name="pagador">'+opcoesQuem(e.pagador)+'</select></div>'
 +'<div class="full"><label class="f">Como dividir</label><select name="div">'+opcoesDiv(e.div)+'</select></div>'
 +'<div class="full"><label class="f">Onde aplicar essa mudança</label><select name="escopo">'
 +'<option value="mes">Somente em '+mesNome(m)+' (os outros meses não mudam)</option>'
 +'<option value="futuro">De '+mesAbrev(m)+' em diante (mantém os meses anteriores)</option>'
 +'<option value="todos">Em todos os meses — é a regra geral da conta</option></select>'
 +'<div class="mut sm" style="margin-top:6px">Use <b>somente neste mês</b> quando a conta vier diferente, como a luz de um mês mais caro.</div></div>'
 +'<div><label class="f">Conta ativa</label><select name="ativo"><option value="1"'+(base.ativo!==false?' selected':'')+'>Sim, aparece todo mês</option><option value="0"'+(base.ativo===false?' selected':'')+'>Não, pausar esta conta</option></select></div>'
 +'</div><div class="row-bt" style="margin-top:14px"><button class="btn pri" type="submit">Salvar alteração</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button>'
 +'<button class="btn danger" type="button" data-act="delFixa" data-id="'+base.id+'">Excluir conta</button></div></form>';
}
function formParcEdit(p,m){
 const i=parcInfo(p,m);
 return '<form data-form="parcEdit"><input type="hidden" name="id" value="'+p.id+'">'
 +'<div class="form">'
 +'<div class="full"><label class="f">Nome da compra</label><input name="nome" required value="'+esc(p.nome)+'"></div>'
 +'<div><label class="f">Valor da parcela (R$)</label><input name="valorParcela" required inputmode="decimal" value="'+(+p.valorParcela).toFixed(2).replace('.',',')+'"></div>'
 +'<div><label class="f">Total de parcelas</label><input name="parcelas" type="number" min="1" max="120" value="'+p.parcelas+'"></div>'
 +'<div><label class="f">Parcela em '+mesAbrev(m)+'</label><input name="parcelaAtual" type="number" min="1" max="120" value="'+(i.ativa?i.atual:1)+'">'
 +'<div class="mut sm" style="margin-top:5px">Ajuste aqui se você já pagou algumas parcelas.</div></div>'
 +'<div><label class="f">Dia da cobrança</label><input name="dia" type="number" min="1" max="31" value="'+(p.dia||10)+'"></div>'
 +'<div><label class="f">Categoria</label><select name="categoria">'+opcoesCats(p.categoria)+'</select></div>'
 +'<div><label class="f">Quem paga</label><select name="pagador">'+opcoesQuem(p.pagador||'C')+'</select></div>'
 +'<div><label class="f">Como dividir</label><select name="div">'+opcoesDiv(p.div)+'</select></div>'
 +'<div><label class="f">Valor total da compra</label><input name="valorTotal" inputmode="decimal" value="'+((+p.valorParcela||0)*(+p.parcelas||0)).toFixed(2).replace('.',',')+'"></div>'
 +'</div><div class="row-bt" style="margin-top:14px"><button class="btn pri" type="submit">Salvar alteração</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button>'
 +'<button class="btn danger" type="button" data-act="delParc" data-id="'+p.id+'">Excluir parcelamento</button></div></form>';
}

/* ---------------- CONTAS FIXAS ---------------- */
function pgFixas(){
 const m=S.ui.mes;
 const lst=fixasMes(m).map(f=>({...f,pago:fixaPaga(f,m)})).sort((a,b)=>(+a.dia||1)-(+b.dia||1));
 const tot=lst.reduce((s,f)=>s+(+f.valor||0),0),pago=lst.filter(f=>f.pago).reduce((s,f)=>s+(+f.valor||0),0);
 let h='<div class="grid g4" style="margin-bottom:13px">'
 +kpi('Fixas por mês',fmt(tot),lst.length+' conta(s) ativa(s)','rgba(34,211,238,.5)')
 +kpi('Já pagas em '+mesAbrev(m),fmt(pago),Math.round(pct(pago,tot))+'% do total','rgba(52,211,153,.5)')
 +kpi('Ainda em aberto',fmt(tot-pago),lst.filter(f=>!f.pago).length+' conta(s)','rgba(251,191,36,.5)')
 +kpi('Compromisso anual',fmt(tot*12),'previsível para 12 meses','rgba(124,92,255,.5)')
 +'</div>'
 +'<div class="card" style="margin-bottom:13px"><h3>➕ Nova conta fixa <small>aparece todo mês no dia escolhido</small></h3>'
 +'<form data-form="fixa"><div class="form">'
 +'<div><label class="f">Nome</label><input name="nome" required placeholder="Ex.: Aluguel"></div>'
 +'<div><label class="f">Valor (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Dia do vencimento</label><input name="dia" type="number" min="1" max="31" value="5"></div>'
 +'<div><label class="f">Categoria</label><select name="categoria">'+opcoesCats('Moradia')+'</select></div>'
 +'<div><label class="f">Quem paga</label><select name="pagador">'+opcoesQuem('C')+'</select></div>'
 +'<div><label class="f">Como dividir</label><select name="div">'+opcoesDiv(S.casal.div||'casal')+'</select></div>'
 +'<div><label class="f">Começa em</label><input type="month" name="inicio" value="'+m+'"></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Adicionar conta fixa</button>'
 +'<button class="btn gh" type="button" data-act="marcarTodas">✅ Marcar todas como pagas</button></div></form></div>'
 +'<div class="card"><h3>🔁 Contas fixas — '+mesNome(m)+'</h3>'
 +(lst.length?'<div style="overflow-x:auto"><table><thead><tr><th>Pago</th><th>Conta</th><th class="hidemob">Vence</th><th class="hidemob">Quem paga</th><th class="hidemob">Divisão</th><th class="num">Valor</th><th></th></tr></thead><tbody>'
  +lst.map(f=>{const c=catInfo(f.categoria);const atras=m===MESATUAL&&!f.pago&&+f.dia<+hojeISO().slice(8,10);
   return '<tr><td><input type="checkbox" '+(f.pago?'checked':'')+' data-act="togFixa" data-id="'+f.id+'" style="width:18px;height:18px;accent-color:#34d399"></td>'
   +'<td><b style="'+(f.pago?'opacity:.55;text-decoration:line-through':'')+'">'+esc(f.nome)+'</b> <span class="tag">'+c.i+' '+esc(f.categoria||'Moradia')+'</span>'
   +(atras?' <span class="tag r">vencida</span>':'')+(f.pago?' <span class="tag g">paga</span>':'')+(f.over?' <span class="tag c">ajustada neste mês</span>':'')+'</td>'
   +'<td class="hidemob mono sm">dia '+f.dia+'</td><td class="hidemob">'+esc(rq(f.pagador||'C'))+'</td>'
   +'<td class="hidemob">'+pillDiv(f)+'</td><td class="num">'+fmt(f.valor)+'</td>'
   +'<td class="right" style="white-space:nowrap"><button class="btn sm gh" data-act="editFixa" data-id="'+f.id+'">✏️</button> <button class="btn sm gh danger" data-act="delFixa" data-id="'+f.id+'">🗑️</button></td></tr>'}).join('')
  +'</tbody></table></div><div class="split" style="display:flex;justify-content:space-between;margin-top:12px"><span class="mut sm">Pago <b style="color:#6ee7b7">'+fmt(pago)+'</b> de '+fmt(tot)+'</span><span class="mut sm">Falta '+fmt(tot-pago)+'</span></div>'+bar(pct(pago,tot),'g')
  :'<div class="empty">Nenhuma conta fixa ainda.<br>Cadastre aluguel, luz, água, internet, streaming, academia...</div>')
 +'</div>';
 return h;
}

/* ---------------- PARCELADOS ---------------- */
function pgParc(){
 const m=S.ui.mes;
 const lst=S.parcelados.map(p=>({p,i:parcInfo(p,m)})).sort((a,b)=>b.i.idx-a.i.idx);
 const doMes=lst.filter(x=>x.i.ativa);
 const totMes=doMes.reduce((s,x)=>s+(+x.p.valorParcela||0),0);
 const restante=restanteParcelas(m);
 const pagoTotal=S.parcelados.reduce((s,p)=>{const i=parcInfo(p,m);return s+(+p.valorParcela||0)*Math.max(0,Math.min(p.parcelas,i.idx))},0);
 const ultimo=lst.reduce((mx,x)=>x.i.fim>mx?x.i.fim:mx,'');
 const cTotal=S.parcelados.reduce((s,p)=>s+(+p.valorParcela||0)*(+p.parcelas||0),0);
 let h='<div class="grid g4" style="margin-bottom:13px">'
 +kpi('Parcelas deste mês',fmt(totMes),doMes.length+' cobrança(s) ativa(s)','rgba(251,191,36,.5)')
 +kpi('Falta pagar (total)',fmt(restante),'somando todas as compras','rgba(251,113,133,.5)')
 +kpi('Já quitado',fmt(pagoTotal),Math.round(pct(pagoTotal,cTotal||1))+'% do valor das compras','rgba(52,211,153,.5)')
 +kpi('Última parcela',ultimo?mesAbrev(ultimo):'—','quando a última compra termina','rgba(124,92,255,.5)')
 +'</div>'
 +'<div class="card" style="margin-bottom:13px"><h3>➕ Nova compra parcelada <small>ex.: 10x de R$ 289,90</small></h3>'
 +'<form data-form="parc"><div class="form">'
 +'<div><label class="f">Nome da compra</label><input name="nome" required placeholder="Ex.: Notebook"></div>'
 +'<div><label class="f">Valor da parcela (R$)</label><input name="valorParcela" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Nº de parcelas</label><input name="parcelas" type="number" min="2" max="120" value="12"></div>'
 +'<div><label class="f">Mês da 1ª parcela</label><input type="month" name="inicio" value="'+m+'"></div>'
 +'<div><label class="f">Dia da cobrança</label><input name="dia" type="number" min="1" max="31" value="10"><div class="mut sm" style="margin-top:5px">Aparece no calendário todo mês.</div></div>'
 +'<div><label class="f">Categoria</label><select name="categoria">'+opcoesCats('Cartão')+'</select></div>'
 +'<div><label class="f">Quem paga</label><select name="pagador">'+opcoesQuem('C')+'</select></div>'
 +'<div><label class="f">Como dividir</label><select name="div">'+opcoesDiv(S.casal.div||'casal')+'</select></div>'
 +'<div><label class="f">Total da compra (opcional)</label><input name="valorTotal" inputmode="decimal" placeholder="0,00"></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Adicionar parcelamento</button></div></form></div>'
 +'<div class="card"><h3>💳 Compras parceladas <small>'+lst.length+' compra(s)</small></h3>'
 +(lst.length?'<div style="overflow-x:auto"><table><thead><tr><th>Compra</th><th style="min-width:150px">Progresso</th><th class="num">Parcela</th><th class="num hidemob">Falta</th><th class="hidemob">Termina</th><th class="hidemob">Divisão</th><th></th></tr></thead><tbody>'
  +lst.map(({p,i})=>{
   const st=i.ativa?'<span class="tag a">em andamento</span>':(i.idx<0?'<span class="tag">começa em '+mesAbrev(p.inicio)+'</span>':'<span class="tag g">quitada 🎉</span>');
   const txt=i.ativa?(i.atual+'/'+p.parcelas+' — faltam '+(p.parcelas-i.idx)):(i.idx<0?'0/'+p.parcelas:p.parcelas+'/'+p.parcelas);
   return '<tr><td><b>'+esc(p.nome)+'</b> <span class="tag">'+catInfo(p.categoria).i+' '+esc(p.categoria||'Cartão')+'</span> '+st
   +'<div class="mut sm">'+esc(rq(p.pagador||'C'))+' • dia '+p.dia+'</div></td>'
   +'<td>'+bar(i.progresso,i.idx>=p.parcelas?'g':'w')+'<span class="mut sm mono">'+txt+'</span>'
   +(i.ativa?('<div style="margin-top:6px">'+(parcelaPaga(p,S.ui.mes)
     ?'<button class="btn sm gh" data-act="marcarParc" data-id="'+p.id+'" data-mes="'+S.ui.mes+'" title="desmarcar">✅ paga em '+mesAbrev(S.ui.mes)+' — desmarcar</button>'
     :'<button class="btn sm" data-act="marcarParc" data-id="'+p.id+'" data-mes="'+S.ui.mes+'" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a1206;font-weight:800">✓ marcar paga em '+mesAbrev(S.ui.mes)+'</button>')+'</div>'):'')   +'</td>'
   +'<td class="num">'+fmt(p.valorParcela)+'</td><td class="num hidemob">'+fmt(i.restante)+'</td><td class="hidemob mono sm">'+mesAbrev(i.fim)+'</td>'
   +'<td class="hidemob">'+pillDiv(p)+'</td>'
   +'<td class="right" style="white-space:nowrap"><button class="btn sm gh" data-act="editParc" data-id="'+p.id+'">✏️</button> <button class="btn sm gh danger" data-act="delParc" data-id="'+p.id+'">🗑️</button></td></tr>'}).join('')
  +'</tbody></table></div>':'<div class="empty">Nenhuma compra parcelada cadastrada.<br>Celular, móveis, viagem, presentes...</div>')
 +'</div>';
 return h;
}

;
/* ============================================================
   C2b: acerto do casal (apex), fechamento, previa de divisão
   ============================================================ */
var DUPES=0;
function previaDiv(o){
 const d=o.div||S.casal.div||'casal';
 if(d==='casal')return '💚 <b>Do casal</b> — sai do dinheiro em comum dos dois. Não entra na conta de acerto.';
 const s2=shares(o),v=+o.valor||0,r=x=>Math.round(x*10)/10;
 let t='';
 if(d==='pct')t=' — a '+esc(nomeA())+' entra com '+Math.round(s2[0])+'% e a '+esc(nomeB())+' com '+Math.round(s2[1])+'%';
 if(d==='prop')t=' — proporcional à renda ('+fmt(S.casal.rendaA)+' e '+fmt(S.casal.rendaB)+')';
 if(d==='igual')t=' — metade para cada um';
 if(d==='A'||d==='B')t=' — esse valor fica todo com uma pessoa (não entra no acerto)';
 if(v>0&&d!=='A'&&d!=='B')t+='<br>Com '+fmt(v)+': <b>'+fmt(v*s2[0]/100)+'</b> para '+esc(nomeA())+' e <b>'+fmt(v*s2[1]/100)+'</b> para '+esc(nomeB())+'.';
 return '÷ <b>'+esc(divCurta(o))+'</b>'+t+'<br><span class="mut">Os valores “100%” e “do casal” não geram acerto entre vocês.</span>';
}

/* ---------------- ACERTO DO CASAL ---------------- */
function apexMes(m){
 const itens=[];
 despMes(m).forEach(l=>itens.push({orig:'gasto',id:l.id,nome:l.desc,valor:+l.valor||0,pagador:l.pagador||'C',
  div:l.div||S.casal.div||'casal',cat:l.categoria||'Outros',extra:''}));
 fixasMes(m).forEach(f=>itens.push({orig:'fixa',id:f.id,nome:f.nome,valor:+f.valor||0,pagador:f.pagador||'C',
  div:f.div||S.casal.div||'casal',cat:f.categoria||'Moradia',extra:'vence dia '+f.dia}));
 parcelasMes(m).forEach(x=>itens.push({orig:'parcela',id:x.p.id,nome:x.p.nome,valor:+x.p.valorParcela||0,pagador:x.p.pagador||'C',
  div:x.p.div||S.casal.div||'casal',cat:x.p.categoria||'Cartão',extra:'parcela '+x.i.atual+'/'+x.p.parcelas}));
 let pagoA=0,pagoB=0,pagoC=0,parteA=0,parteB=0,totalComp=0,efetA=0,efetB=0;
 itens.forEach(i=>{
  const s2=shares(i);
  i.pA=Math.round(s2[0]*10)/10;i.pB=Math.round(s2[1]*10)/10;
  i.parteA=i.valor*s2[0]/100;i.parteB=i.valor*s2[1]/100;
  i.compart=(i.div!=='casal'&&i.div!=='A'&&i.div!=='B');
  if(i.pagador==='A')pagoA+=i.valor;else if(i.pagador==='B')pagoB+=i.valor;else pagoC+=i.valor;
  if(i.compart){
   totalComp+=i.valor;parteA+=i.parteA;parteB+=i.parteB;
   if(i.orig!=='fixa'){efetA+=i.parteA;efetB+=i.parteB}
  }else{i.parteA=0;i.parteB=0}
 });
 const pagoAComp=itens.filter(i=>i.compart&&i.pagador==='A').reduce((s,i)=>s+i.valor,0);
 const pagoBComp=itens.filter(i=>i.compart&&i.pagador==='B').reduce((s,i)=>s+i.valor,0);
 const adiantouA=pagoAComp-parteA;
 const adiantouB=pagoBComp-parteB;
 const saldo=adiantouA;
 const devedor=saldo>0?'B':saldo<0?'A':'';
 const credor=saldo>0?'A':saldo<0?'B':'';
 return {itens,pagoA,pagoB,pagoC,parteA,parteB,totalComp,pagoAComp,pagoBComp,adiantouA,adiantouB,
  saldo,valor:Math.abs(saldo),devedor,credor,quitado:Math.abs(saldo)<0.02,taxaA:pct(pagoAComp,totalComp),taxaB:pct(pagoBComp,totalComp),
  total:itens.reduce((s,i)=>s+(+i.valor||0),0)};
}
function apexPagamentos(m){
 const ac=apexMes(m),out=[];
 const add=(o,val,rot,sub)=>out.push({id:o.id||'',orig:rot,nome:sub,valor:+val||0,quem:o.pagador||'C'});
 despMes(m).forEach(l=>add(l,l.valor,'gasto',l.desc));
 fixasMes(m).forEach(f=>add(f,f.valor,'fixa',f.nome));
 parcelasMes(m).forEach(x=>add(x.p,x.p.valorParcela,'parcela',x.p.nome));
 return out.sort((a,b)=>b.valor-a.valor);
}
function tabelaAcerto(itens){
 return '<div style="overflow-x:auto"><table class="blocos"><thead><tr><th>Item</th><th class="hidemob">Categoria</th><th class="hidemob">Pagou</th><th>Divisão</th>'
 +'<th class="num">Valor</th><th class="num">Parte '+esc(nomeA())+'</th><th class="num">Parte '+esc(nomeB())+'</th></tr></thead><tbody>'
 +itens.map(i=>'<tr><td><b>'+esc(i.nome)+'</b><div class="mut sm">'+(i.orig==='gasto'?'gasto variável':i.orig==='fixa'?'conta fixa':'parcelado')+(i.extra?' · '+i.extra:'')+'</div></td>'
 +'<td class="hidemob"><span class="tag">'+catInfo(i.cat).i+' '+esc(i.cat)+'</span></td>'
 +'<td class="hidemob">'+esc(rq(i.pagador))+'</td>'
 +'<td>'+pillDiv(i)+'</td>'
 +'<td class="num">'+fmt(i.valor)+'</td>'
 +'<td class="num">'+(i.compart?fmt(i.parteA):'<span class="mut">—</span>')+'</td>'
 +'<td class="num">'+(i.compart?fmt(i.parteB):'<span class="mut">—</span>')+'</td></tr>').join('')
 +'</tbody></table></div>';
}
function resumoAcerto(ac,m){
 const ok=ac.quitado;
 return '<div class="card destaque" style="margin-bottom:12px">'
 +'<h3><span>🤝 Acerto de '+mesNome(m)+'</span><small>'+(ok?'equilibrado':'há um adiantamento a devolver')+'</small></h3>'
 +(ok?'<div class="quote">Neste mês ficou equilibrado: as despesas compartilhadas foram cobertas na proporção combinada — <b>ninguém adiantou nada</b>. 🎉</div>'
  :'<div class="quote" style="font-size:14px"><b>'+esc(rq(ac.credor))+'</b> adiantou <b class="warn" style="font-size:19px">'+fmt(ac.valor)+'</b> em despesas compartilhadas neste mês.'
   +'<br><span class="mut sm">A parte de <b>'+esc(rq(ac.devedor))+'</b> nesses gastos foi maior do que ele(a) desembolsou, então a devolução de '+fmt(ac.valor)+' fecha o mês no zero para os dois.</span></div>')
 +'<div class="grid g4" style="margin-top:13px">'
 +'<div><span class="lbl mut sm">'+esc(nomeA())+' pagou</span><br><b class="numf">'+fmt(ac.pagoA)+'</b><div class="mut sm">'+fmt(ac.pagoAComp)+' em despesas compartilhadas</div></div>'
 +'<div><span class="lbl mut sm">'+esc(nomeB())+' pagou</span><br><b class="numf">'+fmt(ac.pagoB)+'</b><div class="mut sm">'+fmt(ac.pagoBComp)+' em despesas compartilhadas</div></div>'
 +'<div><span class="lbl mut sm">Deveriam cobrir</span><br><b class="numf">'+fmt(ac.parteA)+' · '+fmt(ac.parteB)+'</b><div class="mut sm">'+esc(nomeA())+' · '+esc(nomeB())+'</div></div>'
 +'<div><span class="lbl mut sm">Conta conjunta</span><br><b class="numf">'+fmt(ac.pagoC)+'</b><div class="mut sm">pago direto do dinheiro em comum</div></div>'
 +'</div>'
 +'<div class="grid g2" style="margin-top:14px">'
 +'<div><div class="lg" style="margin:0"><span class="nm"><b>'+esc(nomeA())+'</b> <span class="mut sm">pagou '+fmt(ac.taxaA)+' do compartilhado</span></span><b class="mono">'+(ac.adiantouA>=0?'adiantou ':'faltou ')+fmt(Math.abs(ac.adiantouA))+'</b></div>'+bar(ac.taxaA,(ac.adiantouA>=0?'a':'b'))+'</div>'
 +'<div><div class="lg" style="margin:0"><span class="nm"><b>'+esc(nomeB())+'</b> <span class="mut sm">pagou '+fmt(ac.taxaB)+' do compartilhado</span></span><b class="mono">'+(ac.adiantouB>=0?'adiantou ':'faltou ')+fmt(Math.abs(ac.adiantouB))+'</b></div>'+bar(ac.taxaB,(ac.adiantouB>=0?'b':'a'))+'</div>'
 +'</div>'
 +'<div class="quote" style="margin-top:13px"><b>Como o app calcula:</b> soma o que cada um pagou e compara com a parte que caberia a cada um, conforme a divisão de cada lançamento '
 +(S.casal.div==='casal'?'(a regra padrão de vocês é dinheiro em comum, então só os lançamentos marcados com outra divisão entram nessa conta)':'(padrão atual: '+esc(rd2(S.casal.div))+')')
 +'. Total compartilhado analisado: <b>'+fmt(ac.totalComp)+'</b>.</div></div>';
}
function rd2(d){return d==='igual'?'igual para os dois (50/50)':d==='prop'?'proporcional à renda':d==='A'?'100% '+nomeA():d==='B'?'100% '+nomeB():'do casal'}
function pgAcerto(){
 const m=S.ui.mes,ac=apexMes(m);
 let h=resumoAcerto(ac,m);
 h+='<div class="card" style="margin-bottom:12px"><h3><span>📋 Fechamento mensal</span><small>comparar o resultado de cada mês</small></h3>'
 +'<div class="quote">Veja mês a mês quanto entrou, quanto saiu e quanto sobrou. Para comparar em detalhe, abra a tabela completa dos últimos 12 meses.</div>'
 +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="fecharMes">📋 Abrir fechamento dos 12 meses</button>'
 +'<button class="btn" data-act="excel">📊 Exportar Excel</button>'
 +'<button class="btn gh" data-act="ir" data-pg="resumo">📊 Ver gráficos do mês</button></div></div>';
 /* desembolso real */
 const pags=apexPagamentos(m);
 const gA=pags.filter(p=>p.quem==='A'),gB=pags.filter(p=>p.quem==='B'),gC=pags.filter(p=>p.quem==='C');
 const bloco=(q,t,cor)=>{
  h+='<div class="card" style="margin-bottom:12px"><div class="bloco"><span><span class="badgep '+cor+'">'+esc(t)+'</span> desembolsou</span><span>'+gq(q).length+' item(ns) · <b>'+fmt(gq(q).reduce((s,p)=>s+p.valor,0))+'</b></span></div>';
  h+='<div style="overflow-x:auto"><table class="blocos"><thead><tr><th>Item</th><th class="hidemob">Tipo</th><th class="num">Valor pago</th></tr></thead><tbody>';
  gq(q).forEach(p=>{h+='<tr><td>'+esc(p.nome)+'</td><td class="hidemob mut sm">'+p.orig+'</td><td class="num">'+fmt(p.valor)+'</td></tr>'});
  if(!gq(q).length)h+='<tr><td colspan="3" class="mut">Nada pago por aqui.</td></tr>';
  return h+='</tbody></table></div></div>';
 };
 const gq=q=>q==='A'?gA:q==='B'?gB:gC;
 bloco('A',nomeA(),'a');bloco('B',nomeB(),'b');bloco('C','Conta conjunta','c');

 h+='<div class="card" style="margin-bottom:12px"><h3><span>📊 Detalhe do cálculo</span><small>cada lançamento com a divisão aplicada</small></h3>'
 +tabelaAcerto(ac.itens)
 +'<div class="split" style="margin-top:12px"><span class="mut sm">Somando todos os lançamentos do mês</span><b>'+fmt(ac.total)+'</b></div></div>';

 h+='<div class="card"><h3>💡 Como ler esta página</h3><div class="quote" style="line-height:1.75">'
 +'O app soma, para cada lançamento, <b>quem pagou</b> e <b>como dividir</b>. '
 +'Do lado de <b>'+esc(nomeA())+'</b>, entram os valores pagos por ela em itens que têm divisão; do lado de <b>'+esc(nomeB())+'</b>, os pagos por ele. '
 +'Quando uma pessoa paga mais do que a parte dela, o app mostra que ela <b>adiantou</b> esse valor — e é só isso: um número para vocês acertarem quando quiserem, sem cobrança automática.<br><br>'
 +'Lançamentos marcados como <b>do casal</b> saem do dinheiro em comum e ficam fora dessa conta. Lançamentos marcados <b>100% de uma pessoa</b> também não entram.'
 +'</div></div>';
 return h;
}

;
/* ============================================================
   C3: Recibos, Metas, Compartilhar & Ajustes, dados, eventos
   ============================================================ */

/* ---------------- RECIBOS ---------------- */
function pgRecibos(){
 const tot=S.recibos.length,soma=S.recibos.reduce((s,r)=>s+(+r.valor||0),0);
 return '<div class="grid g3" style="margin-bottom:13px">'
 +kpi('Recibos guardados',String(tot),'fotos de notas e comprovantes','rgba(244,114,182,.5)')
 +kpi('Valor somado',fmt(soma),'de todos os comprovantes','rgba(124,92,255,.5)')
 +kpi('Último recibo',S.recibos[0]?dataBR(S.recibos[0].data):'—',S.recibos[0]?esc(S.recibos[0].nome):'nenhum ainda','rgba(34,211,238,.5)')
 +'</div>'
 +'<div class="card" style="margin-bottom:13px"><h3>📎 Anexar recibo <small>foto da nota — fica salvo no aparelho</small></h3>'
 +'<form data-form="recibo"><div class="form">'
 +'<div><label class="f">Título</label><input name="nome" required placeholder="Ex.: Mercado do mês"></div>'
 +'<div><label class="f">Valor (R$)</label><input name="valor" inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Data</label><input type="date" name="data" value="'+hojeISO()+'"></div>'
 +'<div><label class="f">Categoria</label><select name="categoria">'+opcoesCats('Mercado')+'</select></div>'
 +'<div><label class="f">Quem pagou</label><select name="pagador">'+opcoesQuem('C')+'</select></div>'
 +'<div class="full"><label class="f">Observação</label><input name="obs" placeholder="opcional"></div>'
 +'<div class="full"><label class="f">Imagem do recibo</label><input type="file" name="img" accept="image/*" data-act="prevImg">'
 +'<div id="prevBox" style="margin-top:10px"></div>'
 +'<div class="mut sm" style="margin-top:6px">A imagem é reduzida para no máximo <b>800 px de largura</b> em <b>JPEG 70%</b> antes de ser guardada.</div></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Salvar recibo</button></div></form></div>'
 +'<div class="quote" style="margin-bottom:12px">Cada foto entra reduzida a <b>800 px de largura</b> em <b>JPEG 70%</b> — a galeria ocupa agora <b>'+Math.round(JSON.stringify(S.recibos).length/1024)+' KB</b> dos ~5 MB do navegador.</div>'
 +'<div class="card"><h3>🗂️ Galeria <small>toque para abrir</small></h3>'
 +(tot?'<div class="rec-grid">'+S.recibos.map(r=>'<div class="rec" data-act="verRecibo" data-id="'+r.id+'">'
   +(r.img?'<img src="'+r.img+'" alt="'+esc(r.nome)+'">':'<div style="height:118px;display:grid;place-items:center;font-size:34px;background:rgba(255,255,255,.05)">🧾</div>')
   +'<div class="i"><b>'+esc(r.nome)+'</b><span>'+fmt(r.valor)+' • '+dataBR(r.data)+'</span></div></div>').join('')+'</div>'
  :'<div class="empty">Nenhum recibo ainda.<br>Tire foto da nota e anexe aqui — depois dá para transformar em lançamento.</div>')
 +'</div>';
}
function verRecibo(id){
 const r=S.recibos.find(x=>x.id===id);if(!r)return;
 abrirModal('<h3 style="margin:0 0 12px;font-size:17px">🧾 '+esc(r.nome)+'</h3>'
 +(r.img?'<img src="'+r.img+'" style="width:100%;border-radius:13px;border:1px solid rgba(255,255,255,.12);margin-bottom:12px">':'')
 +'<div class="lg"><span class="nm mut">Valor</span><b>'+fmt(r.valor)+'</b></div>'
 +'<div class="lg"><span class="nm mut">Data</span><b>'+dataBR(r.data)+'</b></div>'
 +'<div class="lg"><span class="nm mut">Categoria</span><b>'+esc(r.categoria||'—')+'</b></div>'
 +'<div class="lg"><span class="nm mut">Pagou</span><b>'+esc(rq(r.pagador||'C'))+'</b></div>'
 +(r.obs?'<div class="quote" style="margin-top:10px">'+esc(r.obs)+'</div>':'')
 +'<div class="row-bt" style="margin-top:13px"><button class="btn pri" data-act="lancDeRecibo" data-id="'+r.id+'">＋ Virar lançamento</button>'
 +'<button class="btn danger" data-act="delRecibo" data-id="'+r.id+'">Excluir</button>'
 +'<button class="btn gh" data-act="fecharModal">Fechar</button></div>');
}
/* limita a 800 px de largura e JPEG 70% para não estourar os ~5 MB do navegador */
const IMG_MAX=800, IMG_Q=0.7;
function comprimir(file,cb){
 const fr=new FileReader();
 fr.onerror=()=>{toast('❌ Não consegui ler a imagem');cb('')};
 fr.onload=e=>{
  const img=new Image();
  img.onerror=()=>{toast('❌ Esse arquivo não parece ser uma imagem');cb('')};
  img.onload=()=>{
   const esc2=Math.min(1,IMG_MAX/img.width);
   const cv=document.createElement('canvas');
   cv.width=Math.max(1,Math.round(img.width*esc2));
   cv.height=Math.max(1,Math.round(img.height*esc2));
   const cx=cv.getContext('2d');
   cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
   cx.drawImage(img,0,0,cv.width,cv.height);
   cb(cv.toDataURL('image/jpeg',IMG_Q));
  };
  img.src=e.target.result;
 };
 fr.readAsDataURL(file);
}

/* ---------------- METAS ---------------- */
function pgMetas(){
 const m=S.ui.mes,gt=guardadoTotal(),at=alvoTotal();
 let h='<div class="grid g4" style="margin-bottom:13px">'
 +kpi('Total guardado',fmt(gt),Math.round(pct(gt,at||1))+'% do objetivo do casal','rgba(52,211,153,.5)')
 +kpi('Meta total',fmt(at),S.metas.length+' meta(s) cadastrada(s)','rgba(124,92,255,.5)')
 +kpi('Guardado em '+mesAbrev(m),fmt(guardadoMes(m)),'aportes deste mês','rgba(34,211,238,.5)')
 +kpi('Falta para as metas',fmt(Math.max(0,at-gt)),'soma de tudo que falta','rgba(251,191,36,.5)')
 +'</div>'
 +'<div class="card" style="margin-bottom:13px"><h3>➕ Nova meta <small>reserva, viagem, entrada do apartamento...</small></h3>'
 +'<form data-form="meta"><div class="form">'
 +'<div><label class="f">Nome da meta</label><input name="nome" required placeholder="Ex.: Reserva de emergência"></div>'
 +'<div><label class="f">Valor desejado (R$)</label><input name="alvo" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Prazo (opcional)</label><input type="date" name="prazo"></div>'
 +'<div><label class="f">Descontar do mês</label><select name="desconta"><option value="1">Sim — os aportes saem do valor livre</option><option value="0">Não — é só um objetivo</option></select>'
 +'<div class="mut sm" style="margin-top:5px">Criar a meta <b>não</b> desconta nada. Só cada aporte que você registrar entra na conta.</div></div>'
 +'<div><label class="f">Cor</label><select name="cor">'+CORMETAS.map(c=>'<option value="'+c+'">'+c+'</option>').join('')+'</select></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Criar meta</button></div></form></div>'
 +'<div class="grid g2">';
 if(!S.metas.length){
  h+='<div class="card"><div class="empty">Nenhuma meta ainda.<br>Uma boa primeira meta é a <b>reserva de emergência</b>: cerca de 6 meses de despesas = '
  +fmt((totDesp(m)||0)*6)+'.</div></div>';
 }
 S.metas.forEach(mt=>{
  const a=metaAtual(mt),p=pct(a,mt.alvo),falta=Math.max(0,(+mt.alvo||0)-a);
  let meses=null,porMes=null;
  if(mt.prazo){const d=diffMes(m,mt.prazo.slice(0,7));meses=Math.max(0,d);porMes=(mt.prazo.slice(0,7)<=m)?falta:(meses>0?falta/meses:falta)}
  const ap=(mt.aportes||[]).slice().sort((x,y)=>(y.data||'').localeCompare(x.data||'')).slice(0,4);
  h+='<div class="card"><h3><span>🎯 '+esc(mt.nome)+'</span><small>'+(a>=mt.alvo?'meta alcançada! 🎉':'faltam '+fmt(falta))+'</small></h3>'
  +'<div style="font-size:26px;font-weight:850;letter-spacing:-1px">'+fmt(a)+'</div>'
  +'<div class="mut sm">de '+fmt(mt.alvo)+' • '+p.toFixed(1).replace('.',',')+'% concluído</div>'+bar(p,'g')
  +'<div class="grid g2" style="margin-top:10px">'
  +'<div><span class="lbl mut sm">Falta guardar</span><br><b>'+fmt(falta)+'</b></div>'
  +'<div><span class="lbl mut sm">'+(mt.prazo?'Por mês até o prazo':'Prazo')+'</span><br><b>'+(mt.prazo?fmt(porMes):'sem prazo')+'</b></div></div>'
  +(mt.prazo?'<div class="mut sm" style="margin-top:6px">Prazo '+dataBR(mt.prazo)+' • '+meses+' mês(es) restante(s)</div>':'')
  +(ap.length?'<div style="margin-top:10px">'+ap.map(x=>'<div class="li"><span class="mut sm mono">'+dataBR(x.data).slice(0,5)+'</span><span style="flex:1">'+esc(x.obs||'Aporte')+'</span><b class="mono" style="color:'+((+x.valor||0)<0?'#fda4af':'#6ee7b7')+'">'+((+x.valor||0)<0?'−':'+')+fmt(Math.abs(x.valor))+'</b></div>').join('')+'</div>':'')
  +'<div class="row-bt" style="margin-top:12px"><button class="btn pri sm" data-act="aporteMeta" data-id="'+mt.id+'">🐖 Guardar agora</button>'
  +'<button class="btn sm gh" data-act="retirarMeta" data-id="'+mt.id+'">↩️ Retirar</button>'
  +'<button class="btn sm gh" data-act="metaDesc" data-id="'+mt.id+'">'+(mt.desconta!==false?'💸 desconta do mês: sim':'💸 desconta do mês: não')+'</button>'
  +'<button class="btn sm gh danger" data-act="delMeta" data-id="'+mt.id+'">Excluir</button></div></div>';
 });
 return h+'</div>';
}
/* ---------------- META DENTRO DO CALENDARIO ---------------- */
function cardMetaCal(m){
 const lst=S.metas;
 const totMes=S.metas.reduce((s,mt)=>s+(mt.aportes||[]).filter(a=>(a.data||'').slice(0,7)===m).reduce((x,a)=>x+(+a.valor||0),0),0);
 const desconta=S.metas.reduce((s,mt)=>s+(mt.aportes||[]).filter(a=>(a.data||'').slice(0,7)===m&&aporteDesconta(mt,a)).reduce((x,a)=>x+(+a.valor||0),0),0);
 const diaPad=String(Math.min(+hojeISO().slice(8,10)||1,qtdDias(m))).padStart(2,'0');
 let h='<div class="card" style="margin-bottom:12px;background:linear-gradient(120deg,rgba(52,211,153,.10),transparent)">'
 +'<h3><span>🎯 Guardar numa meta</span><small>direto do calendário · com ou sem desconto do salário</small></h3>'
 +'<form data-form="metaDia"><div class="form">'
 +(lst.length?'<div><label class="f">Meta</label><select name="meta">'+lst.map(mt=>'<option value="'+mt.id+'">'+esc(mt.nome)+'</option>').join('')+'<option value="">＋ criar nova meta</option></select></div>':'<input type="hidden" name="meta" value="">')
 +'<div><label class="f">'+(lst.length?'Nova meta (opcional)':'Nome da meta')+'</label><input name="novaMeta" placeholder="Ex.: Viagem, reserva..."></div>'
 +'<div><label class="f">Valor a guardar (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Dia</label><input type="date" name="data" value="'+m+'-'+diaPad+'"></div>'
 +'<div class="full"><label class="f">Descontar do salário deste mês</label><select name="desc">'
 +'<option value="1">Sim — sai do valor livre de '+mesAbrev(m)+'</option>'
 +'<option value="0">Não — a meta só registra o aporte</option></select>'
 +'<div class="mut sm" style="margin-top:5px">“Sim” entra em <b>Guardado no mês</b> e reduz o <b>Disponível</b>. “Não” deixa o salário do mês intacto.</div></div>'
 +'</div><div class="row-bt" style="margin-top:12px"><button class="btn ok" type="submit">🎯 Guardar na meta</button>'
 +(lst.length?'<button class="btn gh" type="button" data-act="ir" data-pg="metas">Ver metas</button>':'')+'</div></form>';
 if(lst.length){
  h+='<div style="margin-top:14px">'+lst.map(mt=>{
   const ap=(mt.aportes||[]).filter(a=>(a.data||'').slice(0,7)===m);
   const v=ap.reduce((x,a)=>x+(+a.valor||0),0);
   return '<div class="li"><span class="nm">'+esc(mt.nome)+' <span class="mut sm">'+ap.length+' aporte(s) em '+mesAbrev(m)+'</span></span>'
    +'<span class="tag '+(mt.desconta!==false?'g':'')+'">'+(mt.desconta!==false?'desconta do salário':'não desconta')+'</span>'
    +'<b class="mono">'+fmt(v)+'</b>'
    +'<button class="btn sm gh" data-act="metaDesc" data-id="'+mt.id+'" title="alternar desconto">'+(mt.desconta!==false?'💸':'🚫')+'</button>'
    +'<button class="btn sm gh" data-act="aporteMeta" data-id="'+mt.id+'" title="guardar">🐖</button></div>';
  }).join('')+'</div>';
 }
 h+='<div class="split" style="margin-top:12px"><span class="mut sm">Guardado em '+mesAbrev(m)+': <b>'+fmt(totMes)+'</b> · descontando do mês: <b class="pos">'+fmt(desconta)+'</b></span></div>';
 return h+'</div>';
}
function modalAporteEdit(mt,ap){
 if(!mt||!ap)return;
 abrirModal('<h3 style="margin:0 0 12px;font-size:17px">✏️ Editar aporte · '+esc(mt.nome)+'</h3>'
 +'<form data-form="aporteEdit"><input type="hidden" name="id" value="'+mt.id+'"><input type="hidden" name="aid" value="'+ap.id+'"><div class="form">'
 +'<div><label class="f">Valor (R$)</label><input name="valor" required inputmode="decimal" value="'+String(Math.abs(+ap.valor||0)).replace('.',',')+'"></div>'
 +'<div><label class="f">Data</label><input type="date" name="data" value="'+(ap.data||hojeISO())+'"></div>'
 +'<div class="full"><label class="f">Descontar do salário do mês</label><select name="desc">'
 +'<option value="1"'+(aporteDesconta(mt,ap)?' selected':'')+'>Sim — reduz o disponível</option>'
 +'<option value="0"'+(aporteDesconta(mt,ap)?'':' selected')+'>Não — só registra no histórico</option></select></div>'
 +'<div class="full"><label class="f">Observação</label><input name="obs" value="'+esc(ap.obs||'')+'"></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn ok" type="submit">Salvar aporte</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');
}
function modalMetaDia(ds){
 const lst=S.metas;
 abrirModal('<h3 style="margin:0 0 12px;font-size:17px">🎯 Guardar numa meta · '+dataLonga(ds)+'</h3>'
 +'<form data-form="metaDia"><div class="form">'
 +(lst.length?'<div><label class="f">Meta</label><select name="meta">'+lst.map(mt=>'<option value="'+mt.id+'">'+esc(mt.nome)+'</option>').join('')+'<option value="">＋ criar nova meta</option></select></div>':'<input type="hidden" name="meta" value="">')
 +'<div><label class="f">Nova meta (opcional)</label><input name="novaMeta" placeholder="Ex.: Reserva de emergência"></div>'
 +'<div><label class="f">Valor (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
 +'<input type="hidden" name="data" value="'+ds+'">'
 +'<div class="full"><label class="f">Descontar do salário de '+mesAbrev(ds.slice(0,7))+'?</label><select name="desc">'
 +'<option value="1">Sim — reduz o disponível de '+mesAbrev(ds.slice(0,7))+'</option>'
 +'<option value="0">Não — só registra no histórico da meta</option></select></div>'
 +'<div class="full"><label class="f">Observação</label><input name="obs" placeholder="Ex.: sobra do salário, 13º..."></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn ok" type="submit">Confirmar</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');
}
function modalAporte(id){
 const mt=S.metas.find(x=>x.id===id);if(!mt)return;
 abrirModal('<h3 style="margin:0 0 12px;font-size:17px">🐖 Guardar em "'+esc(mt.nome)+'"</h3>'
 +'<form data-form="aporte"><input type="hidden" name="id" value="'+mt.id+'"><div class="form">'
 +'<div><label class="f">Valor do aporte (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Data</label><input type="date" name="data" value="'+hojeISO()+'"></div>'
 +'<div class="full"><label class="f">Descontar do salário</label><select name="desc"><option value="1"'+(mt.desconta!==false?' selected':'')+'>Sim — reduz o disponível de '+mesAbrev(hojeISO().slice(0,7))+'</option><option value="0"'+(mt.desconta===false?' selected':'')+'>Não — só registra no histórico</option></select></div>'
 +'<div class="full"><label class="f">De onde veio</label><input name="obs" placeholder="Ex.: sobra do salário, 13º, venda..."></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn ok" type="submit">Confirmar aporte</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');
}

/* ---------------- SALARIO MENSAL ---------------- */
function cardSalarios(){
 const m=S.ui.mes,lst=S.salarios.slice().sort((a,b)=>(+a.dia||1)-(+b.dia||1));
 const tot=totSalarios(m);
 let h='<div class="card" style="margin-top:13px"><h3><span>💼 Salário de todo mês</span><small>recebe todo mês e pode mudar de valor</small></h3>'
 +'<div class="quote" style="margin-bottom:12px">Cadastre aqui o salário que cai todo mês. Ele entra automaticamente nas <b>entradas</b> de todos os meses, '
 +'e quando o salário mudar você informa <b>a partir de qual mês</b> o valor novo vale — os meses anteriores continuam com o valor antigo.</div>'
 +'<form data-form="salario"><div class="form">'
 +'<div><label class="f">Nome</label><input name="nome" required placeholder="Ex.: Salário CLT" value="Salário"></div>'
 +'<div><label class="f">Valor mensal (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Cai no dia</label><input name="dia" type="number" min="1" max="31" step="1" value="5"></div>'
 +'<div><label class="f">Quem recebe</label><select name="pessoa">'+opcoesQuem('A')+'</select></div>'
 +'<div><label class="f">Vale a partir de</label><input type="month" name="inicio" value="'+m+'"></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Salvar salário</button></div></form>';
 if(!lst.length){h+='<div class="empty" style="margin-top:12px">Nenhum salário cadastrado ainda.<br>Sem salário aqui, use a renda fixa em Compartilhar &amp; Ajustes.</div>'}
 else{
  h+='<div style="margin-top:14px">'+lst.map(s=>{
   const v=valorSalario(s,m),alt=(s.over&&s.over[m]!=null);
   return '<div class="li" style="flex-wrap:wrap;gap:8px"><span class="nm"><b>'+esc(s.nome)+'</b>'
   +'<div class="mut sm">'+esc(rq(s.pessoa||'A'))+' • dia '+s.dia+' • desde '+mesAbrev(s.inicio||m)+(s.ativo===false?' • <b>pausado</b>':'')+(alt?' • valor ajustado neste mês':'')+'</div></span>'
   +'<b class="mono pos">'+fmt(v)+'</b>'
   +'<button class="btn sm gh" data-act="salOver" data-id="'+s.id+'" title="mudar o valor a partir de um mês">🔁 novo valor</button>'
   +'<button class="btn sm gh" data-act="salEdit" data-id="'+s.id+'" title="editar">✏️</button>'
   +'<button class="btn sm gh" data-act="salTog" data-id="'+s.id+'" title="pausar/ativar">'+(s.ativo===false?'▶️':'⏸️')+'</button>'
   +'<button class="btn sm gh danger" data-act="salDel" data-id="'+s.id+'" title="excluir">🗑️</button></div>'}).join('')+'</div>'
  +'<div class="split" style="margin-top:10px"><span class="mut sm">Total de salários em '+mesAbrev(m)+'</span><b class="mono">'+fmt(tot)+'</b></div>';
 }
 return h+'</div>';
}
function modalSalario(s){
 abrirModal('<h3 style="margin:0 0 12px;font-size:17px">'+(s?'✏️ Editar salário':'💼 Novo salário mensal')+'</h3>'
 +'<form data-form="'+(s?'salarioEdit':'salario')+'">'+(s?'<input type="hidden" name="id" value="'+s.id+'">':'')
 +'<div class="form">'
 +'<div><label class="f">Nome</label><input name="nome" required value="'+esc(s?s.nome:'Salário')+'"></div>'
 +'<div><label class="f">Valor mensal (R$)</label><input name="valor" required inputmode="decimal" value="'+(s?(+s.valor).toFixed(2).replace('.',','):'')+'"></div>'
 +'<div><label class="f">Cai no dia</label><input name="dia" type="number" min="1" max="31" value="'+(s?s.dia:5)+'"></div>'
 +'<div><label class="f">Quem recebe</label><select name="pessoa">'+opcoesQuem(s?s.pessoa:'A')+'</select></div>'
 +'<div><label class="f">Vale a partir de</label><input type="month" name="inicio" value="'+(s?s.inicio:S.ui.mes)+'"></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Salvar</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');
}
function modalSalarioOver(s){
 abrirModal('<h3 style="margin:0 0 12px;font-size:17px">🔁 Novo valor de "'+esc(s.nome)+'"</h3>'
 +'<div class="quote" style="margin-bottom:12px">O valor antigo continua valendo nos meses anteriores. '
 +'A partir do mês escolhido passa a valer o valor novo — ótimo para aumento, promoção ou desconto.</div>'
 +'<form data-form="salarioOver"><input type="hidden" name="id" value="'+s.id+'"><div class="form">'
 +'<div><label class="f">Novo valor (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">A partir de</label><input type="month" name="mes" value="'+S.ui.mes+'"></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn ok" type="submit">Aplicar</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');
}

/* ---------------- MODO: CASAL OU SOZINHO ---------------- */
function cardModoUso(){
 const s=solo();
 return '<div class="card" style="margin-bottom:13px"><h3><span>👤 Como você usa o app</span><small>dá para trocar quando quiser</small></h3>'
 +'<form data-form="modo"><div class="form">'
 +'<div class="full"><label class="f">Uso do app</label><select name="modo">'
 +'<option value="casal"'+(s?'':' selected')+'>Controle do casal (duas pessoas)</option>'
 +'<option value="solo"'+(s?' selected':'')+'>Só eu (controle pessoal)</option></select>'
 +'<div class="mut sm" style="margin-top:5px">No modo <b>Só eu</b> o app esconde a segunda pessoa, a aba de acerto do casal e as divisões 50/50. '
 +'Nada é apagado: seus lançamentos continuam aqui.</div></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Salvar modo</button>'
 +'<span class="pill '+(s?'tmp':'down')+'">'+(s?'modo pessoal ativo':'modo casal ativo')+'</span></div></form></div>';
}

/* ---------------- COMPARTILHAR & AJUSTES ---------------- */
function pgShare(){
 const n=S.lancamentos.length,S1=S.fixas.length,S2=S.parcelados.length,mt=S.metas.length,rc=S.recibos.length;
 const json=JSON.stringify({v:2,app:'Nosso Dinheiro',mes:S.ui.mes,resumo:{lancamentos:n,fixas:S1,parcelados:S2,metas:mt,recibos:rc},gerado:hojeISO()});
 const texto='Nosso Dinheiro 💚\n'+mesNome(S.ui.mes)+'\nEntradas '+fmt(totEntradas(S.ui.mes))+' • Despesas '+fmt(totDesp(S.ui.mes))+' • Sobra '+fmt(sobraMes(S.ui.mes))+'\nFixas '+fmt(totFixas(S.ui.mes))+' • Parcelas '+fmt(totParcelas(S.ui.mes))+' • Guardado '+fmt(guardadoMes(S.ui.mes));
 return (typeof cardConta==='function'?cardConta():'')+'<div class="grid g2" style="margin-bottom:13px">'
 +'<div class="card"><h3>🔗 Como vocês dois usam juntos <small>leia antes de usar</small></h3>'
 +'<div class="quote">Este arquivo é um site <b>local</b>: os dados ficam salvos apenas no navegador do aparelho onde você abriu. Isso significa que, <b>por padrão, o que é lançado no seu celular não aparece sozinho no celular do seu cônjuge</b>. Para os dois verem a mesma coisa, use o <b>envio por arquivo ou código</b> abaixo: você gera o código, manda no WhatsApp e ele(a) cola no mesmo app para carregar tudo. Depois de qualquer mudança importante, mande de novo — é rápido.</div>'
 +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="copiarCodigo">📋 Copiar código do mês</button>'
 +'<button class="btn" data-act="copiarTexto">💬 Copiar resumo p/ WhatsApp</button>'
 +'<button class="btn pri" data-act="enviarCodigo">🕒 Enviar o estado atual (com carimbo)</button>'
 +'<button class="btn" data-act="excel">📊 Excel (.xlsx)</button>'
 +'<button class="btn" data-act="exportar">⬇️ Baixar backup (.json)</button>'
 +'<button class="btn" data-act="importar">⬆️ Restaurar backup</button></div></div>'
 +'<div class="card"><h3>📥 Carregar dados do parceiro(a) <small>cola aqui o código que ele(a) te mandou</small></h3>'
 +'<form data-form="importarTexto"><textarea name="codigo" placeholder="Cole aqui o código de dados (o texto longo que começa com a versão do arquivo)..."></textarea>'
 +'<div class="row-bt" style="margin-top:11px"><button class="btn ok" type="submit">Carregar esses dados</button>'
 +'<button class="btn gh" data-act="exportarCodigo" type="button">🔎 Ver/baixar o código atual</button></div>'
 +'<div class="mut sm" style="margin-top:8px">Ao carregar, os dados deste aparelho são <b>substituídos</b> pelos do código. Se o código for <b>mais antigo</b> que o que já está aqui, o app mostra um aviso com os carimbos e <b>só troca se você confirmar</b>.</div></form></div>'
 +'</div>'

 +'<div class="grid g2" style="margin-bottom:13px">'
 +'<div class="card"><h3>👫 O casal <small>só para personalizar o app</small></h3>'
 +'<form data-form="config"><div class="form">'
 +'<div><label class="f">Nome 1</label><input name="a" placeholder="Ex.: Ana" value="'+esc(S.casal.a)+'"></div>'
 +'<div><label class="f">Nome 2</label><input name="b" placeholder="Ex.: Bruno" value="'+esc(S.casal.b)+'"></div>'
 +'<div><label class="f">Renda mensal de '+esc(nomeA())+'</label><input name="rendaA" inputmode="decimal" value="'+(S.casal.rendaA||0)+'"></div>'
 +'<div><label class="f">Renda mensal de '+esc(nomeB())+'</label><input name="rendaB" inputmode="decimal" value="'+(S.casal.rendaB||0)+'"></div>'
 +'<div class="full"><label class="f">Divisão padrão dos lançamentos novos</label><select name="div">'+opcoesDiv(S.casal.div||'casal')+'</select>'
 +'<div class="mut sm" style="margin-top:5px">Ex.: se escolher “<b>igual para os dois</b>”, todo lançamento novo já vem dividido 50/50 — mas isso é só organização, o app nunca cobra ninguém.</div></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Salvar</button></div></form></div>'

 +'<div class="card"><h3>💰 Receita extra do mês <small>freelance, 13º, vendas, bônus</small></h3>'
 +'<form data-form="receita"><div class="form">'
 +'<div><label class="f">Descrição</label><input name="desc" required placeholder="Ex.: freelance"></div>'
 +'<div><label class="f">Valor (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
 +'<div><label class="f">Data</label><input type="date" name="data" value="'+hojeISO()+'"></div>'
 +'<div><label class="f">De quem</label><select name="pagador">'+opcoesQuem('A')+'</select></div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Adicionar receita</button></div></form>'
 +(recMes(S.ui.mes).length?'<div style="margin-top:12px">'+recMes(S.ui.mes).map(r=>'<div class="li"><span class="tag g">'+dataBR(r.data)+'</span><span style="flex:1">'+esc(r.desc)+' <span class="mut sm">('+esc(rq(r.pagador||'A'))+')</span></span><b class="mono" style="color:#6ee7b7">+'+fmt(r.valor)+'</b><button class="btn sm gh danger" data-act="delLanc" data-id="'+r.id+'">🗑️</button></div>').join('')+'</div>':'<div class="mut sm" style="margin-top:10px">Nenhuma receita extra neste mês.</div>')
 +'</div></div>'

 +'<div class="grid g2" style="margin-bottom:13px">'
 +'<div class="card"><h3>📊 Tudo que já está cadastrado</h3>'
 +'<div class="lg"><span class="nm mut">Lançamentos (todos os meses)</span><b>'+n+'</b></div>'
 +'<div class="lg"><span class="nm mut">Contas fixas</span><b>'+S1+'</b></div>'
 +'<div class="lg"><span class="nm mut">Compras parceladas</span><b>'+S2+'</b></div>'
 +'<div class="lg"><span class="nm mut">Metas</span><b>'+mt+'</b></div>'
 +'<div class="lg"><span class="nm mut">Recibos</span><b>'+rc+'</b></div>'
 +'<div class="lg"><span class="nm mut">Guardado acumulado</span><b style="color:#6ee7b7">'+fmt(guardadoTotal())+'</b></div>'
 +'<div class="lg"><span class="nm mut">Parcelas a quitar</span><b style="color:#fcd34d">'+fmt(restanteParcelas(S.ui.mes))+'</b></div>'
 +'<div class="quote" style="margin-top:10px">Este é um espaço <b>do casal</b>: todas as despesas, contas e metas pertencem aos dois. Não existe “quem deve quanto” — o app apenas informa quanto cada um colocou, quando isso faz sentido para vocês.</div></div>'
 +'<div class="card"><h3>🧹 Zerar e recomeçar</h3>'
 +'<p class="mut sm">Apaga tudo deste aparelho e volta ao estado inicial, vazio, sem dados de exemplo.</p>'
 +'<div class="row-bt" style="margin-top:10px"><button class="btn danger" data-act="zerar">🧹 Apagar todos os dados</button>'
 +'<button class="btn gh" data-act="copiarCodigo">📋 Copiar código antes</button></div></div>'
 +'</div>'

 +'<div class="card"><h3>❓ Como usar em 5 passos</h3><div class="quote" style="line-height:1.8">'
 +'1. Aqui em <b>Compartilhar &amp; Ajustes</b>, coloque os nomes e as rendas de vocês dois.<br>'
 +'2. Cadastre o que se repete em <b>Contas fixas</b> (aluguel, luz, água, internet). Elas passam a aparecer automaticamente no <b>Calendário</b>, no dia do vencimento.<br>'
 +'3. Compre alguma coisa? Toque no dia, no calendário, e lance — escolhendo <b>quem pagou</b> e <b>como dividir</b> (do casal, 50/50, proporcional à renda ou um % que vocês combinarem).<br>'
 +'4. Compra em várias vezes vai em <b>Parcelados</b> — o app mostra parcela atual, quanto falta e quando termina.<br>'
 +'5. Fotografe as notas em <b>Recibos</b>, defina quanto querem guardar em <b>Metas</b> e acompanhe o mês inteiro em <b>Resumo</b>.<br>'
 +'Para os dois verem os mesmos números, use o <b>código de dados</b> no topo desta página: gera, manda no WhatsApp e o outro carrega.'
 +'</div></div>';
}

/* ---------------- EXPORT / IMPORT / CSV ---------------- */
function baixar(nome,txt,tipo){const b=new Blob([txt],{type:tipo||'text/plain;charset=utf-8'});const u=URL.createObjectURL(b);
 const a=document.createElement('a');a.href=u;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
async function copiar(txt,msg){
 try{
  if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(txt);toast(msg||'Copiado ✅');return true}
 }catch(e){}
 try{
  const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);
  ta.select();document.execCommand('copy');ta.remove();toast(msg||'Copiado ✅');return true;
 }catch(e){toast('Não consegui copiar — use “Ver/baixar o código atual”');return false}
}
function exportar(){save();baixar('nosso-dinheiro-backup-'+hojeISO()+'.json',JSON.stringify(S),'application/json');toast('Backup baixado ✅')}
function csvLanc(mes){
 const m=mes||S.ui.mes;
 const lst=lancMes(m),head='Mes;Data;Tipo;Descricao;Categoria;Pagador;Divisao;Forma;Valor\n';
 const l=x=>[m,dataBR(x.data),x.tipo,(x.desc||'').replace(/;/g,','),x.categoria||'',rq(x.pagador||'C'),divCurta(x),x.metodo||'',String(x.valor).replace('.',',')].join(';');
 baixar('lancamentos-'+m+'.csv',head+lst.map(l).join('\n'),'text/csv;charset=utf-8');toast('CSV de '+mesAbrev(m)+' baixado ⬇️');
}
/* delega para o importador com aviso de dados mais antigos (c3c) */
function importar(file){importarArquivo(file)}

/* ---------------- EVENTOS ---------------- */
const FICHA='nossoDinheiro.v2';

document.addEventListener('submit',e=>{
 const f=e.target;if(!f||!f.dataset||!f.dataset.form)return;
 const t=f.dataset.form;
 if(t==='importarTexto'){e.preventDefault();
  const cod=(new FormData(f).get('codigo')||'').trim();
  if(!cod){toast('Cole o código primeiro');return}
  let d=null;
  try{d=JSON.parse(cod)}catch(err){toast('❌ Esse texto não é um código de dados válido');return}
  if(!d||(!d.lancamentos&&!d.gastos&&!d.casal)){toast('❌ Esse código não parece ser do Nosso Dinheiro');return}
  const df=Date.parse(d.atualizadoEm||d.criadoEm||'')||0;
  const lf=Date.parse(S.atualizadoEm||'')||0;
  if(df&&lf&&df<lf){avisoCodigoAntigo(d);return}
  S=(d.gastos&&!d.lancamentos)?converterAntigo(d):Object.assign(estadoVazio(),d);
  S.importadoEm=new Date().toISOString();
  normaliza();save();render();
  toast('Dados carregados ✅ agora este é o estado mais novo');
  return;
 }
 e.preventDefault();
 const d=Object.fromEntries(new FormData(f).entries());
 if(t==='lanc'){
  const venc=(d.venc||'').trim();
  const ehCredito=/cr[eé]dito/i.test(d.metodo||'');
  const dataBase=(ehCredito&&venc)?venc:(d.data||hojeISO());
  const l={id:d.id||uid(),tipo:d.tipo||'despesa',desc:(d.desc||'').trim(),valor:pnum(d.valor),data:dataBase,
   categoria:d.categoria,pagador:d.pagador,div:d.div,pctA:Math.max(0,Math.min(100,+d.pctA||0)),metodo:d.metodo,obs:(d.obs||'').trim(),recibo:d.recibo||''};
  const elN=f.querySelector('[name="id"]');
  const nd=elN?(+elN.dataset.dupes||0):0;
  const seguir=!!f.dataset.mais;
  const eraEdicao=!!d.id;
  delete f.dataset.mais;
  if(!l.valor){toast('Informe um valor para continuar');return}
  if(eraEdicao&&nd===0){
   S.lancamentos=S.lancamentos.map(x=>x.id===d.id?l:x);
   save();toast('Lançamento atualizado ✅');fecharModal();render();return;
  }
  delete l.id;l.id=uid();
  const nP=Math.max(1,Math.min(48,Math.round(+d.parcelasCartao||1)));
  if(ehCredito&&nP>1){
   const total=l.valor,base=Math.floor(total/nP*100)/100,dd=Math.min(28,Math.max(1,+String(l.data).slice(8,10)||1));
   for(let i=0;i<nP;i++){
    const mv=addMes(String(l.data).slice(0,7),i);
    S.lancamentos.push(Object.assign({},l,{id:uid(),valor:i===nP-1?Math.round((total-base*(nP-1))*100)/100:base,
     data:mv+'-'+String(dd).padStart(2,'0'),desc:l.desc+' ('+(i+1)+'/'+nP+')',
     obs:((l.obs?l.obs+' · ':'')+'parcela '+(i+1)+'/'+nP+' no cartão')}));
   }
  }else S.lancamentos.push(l);
  save();
  if(String(l.data).slice(0,7)!==S.ui.mes){S.ui.mes=String(l.data).slice(0,7);toast('Salvei e abri '+mesNome(S.ui.mes)+' para você ver ✅')}
  if(seguir){
   window.DUPES=nd+1;
   render();
   const mb=document.getElementById('modalBody');
   if(mb){
    mb.innerHTML='<h3 style="margin:0 0 12px;font-size:17px">'+(l.tipo==='receita'?'🔺 Nova receita':'🔻 Novo lançamento')+'</h3>'
     +'<div class="quote" style="margin-bottom:11px">Salvei <b>'+(l.desc||'o lançamento')+'</b> por <b>'+fmt(l.valor)+'</b>. '
     +'Mantive a data, a categoria, quem pagou e a divisão — agora só mude o valor do próximo.</div>'
     +formLanc(null);
   }
   setTimeout(()=>{
    const q=s=>document.querySelector('[data-form="lanc"] [name="'+s+'"]');
    const c=q('data');if(c)c.value=l.data;
    const cc=q('categoria');if(cc)cc.value=l.categoria;
    const pp=q('pagador');if(pp)pp.value=l.pagador;
    const dv=q('div');if(dv)dv.value=l.div;
    const md=q('metodo');if(md)md.value=l.metodo;
    const pv=document.getElementById('pagPrev');if(pv)pv.innerHTML=previaDiv({div:l.div,pctA:l.pctA,valor:0});
    const vv=q('valor');if(vv)vv.focus();
   },40);
   toast('Lançado '+fmt(l.valor)+' — pode registrar o próximo aqui mesmo');
  }else{
   toast((l.tipo==='receita'?'Receita de ':'Despesa de ')+fmt(l.valor)+' lançada ✅');
   fecharModal();render();
  }
 }
 if(t==='fixa'){S.fixas.push({id:uid(),nome:(d.nome||'').trim(),valor:pnum(d.valor),dia:+d.dia||1,categoria:d.categoria,pagador:d.pagador,div:d.div,ativo:true,inicio:d.inicio||S.ui.mes,pagos:{}});save();render();toast('Conta fixa cadastrada 🔁')}
 if(t==='fixaEdit'){
  const x=S.fixas.find(y=>y.id===d.id);
  if(!x){fecharModal();toast('Conta não encontrada');return}
  x.over=x.over||{};
  const m=d.mes||S.ui.mes;
  const novos={nome:(d.nome||'').trim(),valor:pnum(d.valor),dia:+d.dia||1,categoria:d.categoria,pagador:d.pagador,div:d.div};
  if(d.ativo==='0')x.ativo=false;else x.ativo=true;
  if(d.escopo==='futuro'){
   const antigos={nome:x.nome,valor:+x.valor||0,dia:+x.dia||1,categoria:x.categoria,pagador:x.pagador||'C',div:x.div||S.casal.div||'casal'};
   Object.keys(x.over).forEach(k=>{if(k>=m)delete x.over[k]});
   let k=x.inicio||m,guard=0;
   while(k<m&&guard<72){if(!x.over[k])x.over[k]=Object.assign({},antigos);k=addMes(k,1);guard++}
   Object.assign(x,novos);
   toast('Regra alterada de '+mesAbrev(m)+' em diante ✅');
  }else if(d.escopo==='todos'){
   x.over={};Object.assign(x,novos);
   toast('Regra geral atualizada em todos os meses ✅');
  }else{
   x.over[m]=Object.assign({},novos);
   toast('Ajuste salvo somente em '+mesNome(m)+' ✅');
  }
  save();fecharModal();render();
 }
 if(t==='parc'){S.parcelados.push({id:uid(),nome:(d.nome||'').trim(),valorParcela:pnum(d.valorParcela),parcelas:Math.max(1,+d.parcelas||1),dia:+d.dia||10,inicio:d.inicio||S.ui.mes,categoria:d.categoria,pagador:d.pagador,div:d.div,valorTotal:pnum(d.valorTotal)});save();render();toast('Parcelamento cadastrado 💳')}
 if(t==='parcEdit'){
  const x=S.parcelados.find(y=>y.id===d.id);
  if(!x){fecharModal();toast('Compra não encontrada');return}
  Object.assign(x,{nome:(d.nome||'').trim(),valorParcela:pnum(d.valorParcela),parcelas:Math.max(1,+d.parcelas||1),
   dia:Math.max(1,Math.min(31,+d.dia||10)),categoria:d.categoria,pagador:d.pagador,div:d.div,
   valorTotal:pnum(d.valorTotal)});
  const atual=Math.max(1,Math.min(x.parcelas,+d.parcelaAtual||1));
  x.inicio=addMes(S.ui.mes,-(atual-1));
  save();fecharModal();render();toast('Parcelamento atualizado ✅');
 }
 if(t==='salario'){S.salarios.push({id:uid(),nome:(d.nome||'Salário').trim(),valor:pnum(d.valor),dia:+d.dia||5,pessoa:d.pessoa||'A',inicio:d.inicio||S.ui.mes,ativo:true,over:{}});save();render();toast('Salário cadastrado — entra em todos os meses 💼');return}
 if(t==='salarioEdit'){const s=S.salarios.find(x=>x.id===d.id);if(s){s.nome=(d.nome||s.nome).trim();s.valor=pnum(d.valor);s.dia=+d.dia||5;s.pessoa=d.pessoa||s.pessoa;s.inicio=d.inicio||s.inicio;save();fecharModal();render();toast('Salário atualizado ✅')}return}
 if(t==='salarioOver'){const s=S.salarios.find(x=>x.id===d.id);if(s){s.over=s.over||{};const mm=d.mes||S.ui.mes;s.over[mm]=pnum(d.valor);if(mm<=(s.inicio||'0000-00'))s.valor=pnum(d.valor);save();fecharModal();render();toast('Novo valor vale a partir de '+mesNome(mm)+' ✅')}return}
 if(t==='modo'){S.casal.modo=(d.modo==='solo')?'solo':'casal';if(solo()&&S.ui.pagina==='acerto')S.ui.pagina='resumo';save();render();toast(solo()?'Modo pessoal ativo 👤':'Modo casal ativo 👥');return}
 if(t==='aporteEdit'){
  const mt=S.metas.find(x=>x.id===d.id);if(!mt){fecharModal();return}
  const ap=(mt.aportes||[]).find(x=>x.id===d.aid);if(!ap){fecharModal();return}
  const neg=(+ap.valor||0)<0;
  ap.valor=(neg?-1:1)*Math.abs(pnum(d.valor));
  ap.data=(d.data||ap.data||hojeISO()).slice(0,10);
  ap.desc=d.desc!=='0';
  ap.obs=(d.obs||'').trim();
  save();fecharModal();render();toast('Aporte atualizado ✅');
  return;
 }
 if(t==='metaDia'){
  const val=pnum(d.valor);
  if(!val){toast('Informe o valor que vai guardar');return}
  let mt=S.metas.find(x=>x.id===(d.meta||''));
  const nomeNovo=(d.novaMeta||'').trim();
  const desc=d.desc!=='0';
  const dt=(d.data||hojeISO()).slice(0,10);
  if(!mt){
   if(!nomeNovo){toast('Escolha uma meta ou escreva o nome da nova');return}
   mt={id:uid(),nome:nomeNovo,alvo:pnum(d.alvo)||val,prazo:'',cor:CORMETAS[0],aportes:[],desconta:desc};
   S.metas.push(mt);
  }
  mt.aportes.push({id:uid(),desc:desc,data:dt,valor:val,obs:(d.obs||'').trim()||'Guardado pelo calendário'});
  if(dt.slice(0,7)!==S.ui.mes)S.ui.mes=dt.slice(0,7);
  save();fecharModal();render();
  toast('🎯 '+fmt(val)+' em "'+mt.nome+'"'+(desc?' — descontado do salário de '+mesAbrev(dt.slice(0,7)):' — sem descontar do mês'));
  return;
 }
 if(t==='meta'){S.metas.push({id:uid(),nome:(d.nome||'').trim(),alvo:pnum(d.alvo),prazo:d.prazo||'',cor:d.cor,aportes:[],desconta:d.desconta!=='0'});save();render();toast('Meta criada 🎯 criar a meta não desconta nada — só os aportes entram na conta')}
 if(t==='aporte'){const mt=S.metas.find(x=>x.id===d.id);if(mt){const desc=d.desc!=='0';mt.aportes.push({id:uid(),desc:desc,data:d.data||hojeISO(),valor:pnum(d.valor),obs:(d.obs||'').trim()});save();fecharModal();render();toast('Guardado '+fmt(pnum(d.valor))+(desc?' 🐖 descontado do salário do mês':' 🐖 sem descontar do mês'))}}
 if(t==='retirar'){const mt=S.metas.find(x=>x.id===d.id);if(mt){mt.aportes.push({id:uid(),desc:true,data:d.data||hojeISO(),valor:-Math.abs(pnum(d.valor)),obs:(d.obs||'').trim()||'Retirada'});save();fecharModal();render();toast('Retirada registrada')}}
 if(t==='recibo'){
  const fi=f.querySelector('input[type=file]');
  const done=img=>{const rid=uid();S.recibos.unshift({id:rid,nome:(d.nome||'').trim(),valor:pnum(d.valor),data:d.data||hojeISO(),categoria:d.categoria,pagador:d.pagador,obs:(d.obs||'').trim(),img:img||''});save();render();verRecConf(rid)};
  if(fi&&fi.files&&fi.files[0]){toast('Comprimindo imagem...');comprimir(fi.files[0],done)}else done('');
 }
 if(t==='config'){
  S.casal.a=(d.a||'').trim();S.casal.b=(d.b||'').trim();S.casal.rendaA=pnum(d.rendaA);S.casal.rendaB=pnum(d.rendaB);S.casal.div=d.div||'casal';
  save();render();toast('Ajustes salvos 👫');
 }
 if(t==='receita'){S.lancamentos.push({id:uid(),tipo:'receita',desc:(d.desc||'').trim(),valor:pnum(d.valor),data:d.data||hojeISO(),categoria:'Outras receitas',pagador:d.pagador,div:'casal',pctA:50,metodo:'Pix',obs:''});save();render();toast('Receita adicionada 💰')}
},true);

document.addEventListener('click',e=>{
 const mbA=e.target.closest('[data-act="mais"]');
 if(mbA){const fo=mbA.closest('form');if(fo)fo.dataset.mais='1'}
 const el=e.target.closest('[data-act]');if(!el)return;
 const a=el.dataset.act,id=el.dataset.id,iso_=el.dataset.iso;
 if(a==='mais')return;
 if(a==='ir'){irPara(el.dataset.pg);return}
 if(a==='fecharModal'){fecharModal();return}
 if(a==='novoDesp'){abrirModal('<h3 style="margin:0 0 13px;font-size:17px">🔻 Novo lançamento</h3>'+formLanc(iso_?{tipo:'despesa',desc:'',valor:'',data:iso_,categoria:'Mercado',pagador:'C',div:S.casal.div||'casal',pctA:50,metodo:'Pix',obs:'',recibo:''}:null));return}
 if(a==='novaRec'){abrirModal('<h3 style="margin:0 0 13px;font-size:17px">🔺 Nova receita</h3>'+formLanc({tipo:'receita',desc:'',valor:'',data:iso_||hojeISO(),categoria:'Outras receitas',pagador:'A',div:'casal',pctA:50,metodo:'Pix',obs:'',recibo:''}));return}
 if(a==='editLanc'){const l=S.lancamentos.find(x=>x.id===id);if(l)abrirModal('<h3 style="margin:0 0 13px;font-size:17px">✏️ Editar lançamento</h3>'+formLanc(l));return}
 if(a==='delLanc'){if(confirm('Excluir este lançamento?')){S.lancamentos=S.lancamentos.filter(x=>x.id!==id);save();fecharModal();render();toast('Lançamento excluído')}return}
 if(a==='delFixa'){if(confirm('Excluir esta conta fixa?')){S.fixas=S.fixas.filter(x=>x.id!==id);save();fecharModal();render();toast('Conta fixa excluída')}return}
 if(a==='delParc'){if(confirm('Excluir este parcelamento?')){S.parcelados=S.parcelados.filter(x=>x.id!==id);save();fecharModal();render();toast('Parcelamento excluído')}return}
 if(a==='delMeta'){if(confirm('Excluir esta meta e o histórico dela?')){S.metas=S.metas.filter(x=>x.id!==id);save();render();toast('Meta excluída')}return}
 if(a==='delRecibo'){if(confirm('Excluir este recibo?')){S.recibos=S.recibos.filter(x=>x.id!==id);save();fecharModal();render();toast('Recibo excluído')}return}
 if(a==='abrirDia'){modalDia(iso_,el.dataset.voltaMes||null);return}
 if(a==='calCompleto'){modalMes(S.ui.mes);return}
 if(a==='mesModal'){modalMes(el.dataset.mes||S.ui.mes);return}
 if(a==='irMes'){if(el.dataset.mes){S.ui.mes=el.dataset.mes;save();fecharModal();irPara('calendario')}return}
 if(a==='csvLanc'){csvLanc(el.dataset.mes||S.ui.mes);return}
 if(a==='tema'){S.ui.tema=(TEMA()==='escuro')?'claro':'escuro';save();render();toast('Tema '+(TEMA()==='claro'?'claro ☀️':'escuro 🌙'));return}
 if(a==='editFixa'){const f=S.fixas.find(x=>x.id===id);if(!f){toast('Conta não encontrada');return}abrirModal('<h3>✏️ Editar conta fixa</h3>'+formFixaEdit(f,S.ui.mes));return}
 if(a==='editParc'){const p=S.parcelados.find(x=>x.id===id);if(!p){toast('Compra não encontrada');return}abrirModal('<h3>✏️ Editar parcelamento</h3>'+formParcEdit(p,S.ui.mes));return}
 if(a==='verRecibo'){verRecibo(id);return}
 if(a==='lancDeRecibo'){const r=S.recibos.find(x=>x.id===id);if(!r)return;fecharModal();
  abrirModal('<h3 style="margin:0 0 13px;font-size:17px">🔻 Lançamento a partir do recibo</h3>'+formLanc({tipo:'despesa',desc:r.nome,valor:r.valor,data:r.data,categoria:r.categoria,pagador:r.pagador||'C',div:S.casal.div||'casal',pctA:50,metodo:'Pix',obs:r.obs,recibo:r.id}));return}
 if(a==='marcarParc'){const p=S.parcelados.find(x=>x.id===id);if(!p)return;p.pagos=p.pagos||{};const mm=el.dataset.mes||S.ui.mes;
  if(p.pagos[mm]){delete p.pagos[mm];toast('Parcela de '+mesAbrev(mm)+' voltou para “em aberto”')}else{p.pagos[mm]=true;toast(p.nome+' · parcela de '+mesAbrev(mm)+' paga ✅')}
  save();render();return}
 if(a==='salNovo'){modalSalario(null);return}
 if(a==='salEdit'){const s=S.salarios.find(x=>x.id===id);if(s)modalSalario(s);return}
 if(a==='salOver'){const s=S.salarios.find(x=>x.id===id);if(s)modalSalarioOver(s);return}
 if(a==='salTog'){const s=S.salarios.find(x=>x.id===id);if(!s)return;s.ativo=s.ativo===false;save();render();toast(s.nome+(s.ativo?' ativado ▶️':' pausado ⏸️'));return}
 if(a==='salDel'){const s=S.salarios.find(x=>x.id===id);if(!s)return;S.salarios=S.salarios.filter(x=>x.id!==id);save();render();toast('Salário removido');return}
 if(a==='editAporte'){const mt=S.metas.find(x=>x.id===id);if(!mt)return;const ap=(mt.aportes||[]).find(x=>x.id===el.dataset.aid);modalAporteEdit(mt,ap);return}
 if(a==='metaDia'){modalMetaDia(el.dataset.iso||hojeISO());return}
 if(a==='delAporte'){const mt=S.metas.find(x=>x.id===id);if(!mt)return;const aid=el.dataset.aid;
  mt.aportes=(mt.aportes||[]).filter(x=>x.id!==aid);save();render();toast('Aporte excluído — o mês foi recalculado');return}
 if(a==='metaDesc'){const mt=S.metas.find(x=>x.id===id);if(!mt)return;mt.desconta=mt.desconta===false;save();render();toast(mt.desconta?'Os aportes voltam a descontar do mês':'Os aportes desta meta não descontam do mês');return}
 if(a==='aporteMeta'){modalAporte(id);return}
 if(a==='retirarMeta'){const mt=S.metas.find(x=>x.id===id);if(!mt)return;
  abrirModal('<h3 style="margin:0 0 12px;font-size:17px">↩️ Retirar de "'+esc(mt.nome)+'"</h3><form data-form="retirar"><input type="hidden" name="id" value="'+mt.id+'"><div class="form">'
  +'<div><label class="f">Valor retirado (R$)</label><input name="valor" required inputmode="decimal" placeholder="0,00"></div>'
  +'<div><label class="f">Data</label><input type="date" name="data" value="'+hojeISO()+'"></div>'
  +'<div class="full"><label class="f">Motivo</label><input name="obs" placeholder="Ex.: imprevisto, conserto do carro..."></div>'
  +'</div><div class="row-bt" style="margin-top:13px"><button class="btn danger" type="submit">Confirmar retirada</button>'
  +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');return}
 if(a==='novoAporte'){if(!S.metas.length){toast('Crie uma meta primeiro 🎯');irPara('metas');return}modalAporte(S.metas[0].id);return}
 if(a==='marcarTodas'){S.fixas.forEach(f=>{f.pagos=f.pagos||{};f.pagos[S.ui.mes]=true});save();render();toast('Contas fixas marcadas como pagas ✅');return}
 if(a==='limparFiltro'){S.ui.f={cat:'',busca:'',tipo:'',pessoa:'',valor:''};save();render();toast('Filtros limpos');return}
 if(a==='exportar'){exportar();return}
 if(a==='importar'){$('#fileImport').click();return}
 if(a==='copiarCodigo'){copiar(JSON.stringify(S),'Código copiado ✅ mande no WhatsApp');return}
 if(a==='exportarCodigo'){baixar('nosso-dinheiro-dados-'+hojeISO()+'.json',JSON.stringify(S),'application/json');toast('Código baixado como arquivo');return}
 if(a==='copiarTexto'){copiar('Nosso Dinheiro 💚\n'+mesNome(S.ui.mes)+'\nEntradas '+fmt(totEntradas(S.ui.mes))+' • Despesas '+fmt(totDesp(S.ui.mes))+' • Sobra '+fmt(sobraMes(S.ui.mes))+'\nContas fixas '+fmt(totFixas(S.ui.mes))+' • Parcelas '+fmt(totParcelas(S.ui.mes))+' • Guardado '+fmt(guardadoMes(S.ui.mes)),'Resumo copiado 💬');return}
 if(a==='zerar'){if(confirm('Apagar TODOS os dados deste aparelho e recomeçar vazio?')){S=estadoVazio();save();render();toast('Tudo apagado — recomeçando do zero 🧹')}return}
});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
 if(a==='mesPrev'){S.ui.mes=addMes(S.ui.mes,-1);save();render()}
 if(a==='mesNext'){S.ui.mes=addMes(S.ui.mes,1);save();render()}
 if(a==='mesHoje'){S.ui.mes=MESATUAL;save();render()}
});
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.dataset&&el.dataset.act==='filtro'){const k=el.dataset.k;S.ui.f[k]=el.value;const pos=el.selectionStart;save();render();
  const nv=document.querySelector('[data-act="filtro"][data-k="'+k+'"]');if(nv&&el.tagName==='INPUT'){nv.focus();try{nv.setSelectionRange(pos,pos)}catch(e2){}}return}
 if(el.dataset&&el.dataset.act==='togFixa'){const f=S.fixas.find(x=>x.id===el.dataset.id);if(!f)return;f.pagos=f.pagos||{};
  if(el.checked){f.pagos[S.ui.mes]=true;toast(f.nome+' marcada como paga ✅')}else{delete f.pagos[S.ui.mes];toast(f.nome+' voltou para “em aberto”')}
  save();render();return}
 if(el.dataset&&el.dataset.act==='mudouMetodo'){const ehC=/cr[eé]dito/i.test(el.value);
  ['blocoCartao','blocoParcelas'].forEach(id=>{const x=document.getElementById(id);if(x)x.style.display=ehC?'':'none'});return}
 if(el.dataset&&el.dataset.act==='togParc'){const p=S.parcelados.find(x=>x.id===el.dataset.id);if(!p)return;p.pagos=p.pagos||{};const mm=el.dataset.mes||S.ui.mes;
  if(el.checked){p.pagos[mm]=true;toast(p.nome+' · parcela paga em '+mesAbrev(mm)+' ✅')}else{delete p.pagos[mm];toast(p.nome+' · parcela de '+mesAbrev(mm)+' voltou para “em aberto”')}
  save();render();return}
 if(el.dataset&&el.dataset.act==='prevImg'){const fi=el.files&&el.files[0];if(!fi)return;
  comprimir(fi,img=>{const p=$('#prevBox');if(p)p.innerHTML='<img src="'+img+'" style="max-height:170px;border-radius:12px;border:1px solid rgba(255,255,255,.15)">'});return}
 if(el.id==='fileImport'){if(el.files&&el.files[0]){const fl=el.files[0];el.value='';importarArquivo(fl)}return}
});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b)irPara(b.dataset.page)});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')fecharModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharModal()});
window.addEventListener('beforeunload',save);

/* ---------------- INÍCIO: chamado no fim da carga (c3d) ---------------- */
function iniciarApp(){
 injetarCSS2();ligarPWA();registrarSW();ligarCanal();
 load();render();
 window.addEventListener('storage',ev=>{
  if(ev.key!==LSKEY||!ev.newValue)return;
  try{S=JSON.parse(ev.newValue);normaliza();render();toast('🔄 Dados atualizados em outra aba')}catch(e){}
 });
}

;
/* ============================================================
   C3b — Excel (.xlsx), CSV do fechamento, envio de código e PWA
   ============================================================ */
function somaParc(lista){return (lista||[]).reduce((s,x)=>s+(+((x&&x.p&&x.p.valorParcela)||(x&&x.valor)||0)||0),0)}
function _ndGuardado(m){const e=evolucao(12).find(x=>x.m===m);return e?(+e.g||0):0}
function _ndEntradas(m){return (+S.casal.rendaA||0)+(+S.casal.rendaB||0)+soma(recMes(m))}
function contaFixaValorMes(f,m){const o=f.over&&f.over[m];return (+((o&&o.valor!=null)?o.valor:f.valor)||0)}
function situacaoFixa(f,m){
 if(f.ativo===false)return 'pausada';
 return (fixaPaga(f,m)||(f.pagos&&f.pagos[m]))?'paga':'em aberto';
}
function nomeMesLongo(m){
 const p=String(m).split('-');
 const N=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
 return N[(+p[1]||1)-1]+' de '+p[0];
}
var mesNomeLongo=nomeMesLongo; /* alias */
function valoresMes(m){
 const ent=_ndEntradas(m);
 const fx=soma(fixasMes(m));const va=soma(despMes(m));const pa=somaParc(parcelasMes(m));
 const de=fx+va+pa;
 return {m,ent,fx,va,pa,de,sobra:ent-de-_ndGuardado(m),taxa:ent>0?Math.round((ent-de)/ent*1000)/10:0,guardado:_ndGuardado(m)};
}

/* ---------------- CSV do fechamento ---------------- */
function csvMes(m){
 const ev=evolucao(12);
 const l=['Mes;Entradas;Contas fixas;Gastos variaveis;Parcelas;Despesas;Sobra;Guardado'];
 ev.forEach(e=>l.push([e.m,e.e.toFixed(2),e.f.toFixed(2),e.v.toFixed(2),e.p.toFixed(2),e.d.toFixed(2),(e.e-e.d).toFixed(2),e.g.toFixed(2)].join(';').replace(/\./g,',')));
 const v=valoresMes(m);
 l.push('');
 l.push('Mes analisado;'+m);
 ['Entradas|'+v.ent,'Contas fixas|'+v.fx,'Gastos variaveis|'+v.va,'Parcelas|'+v.pa,'Despesas totais|'+v.de,'Sobra|'+v.sobra,'Guardado no mes|'+v.guardado]
  .forEach(x=>{const p=x.split('|');l.push(p[0]+';'+p[1].toFixed(2).replace('.',','))});
 try{
  const ac=apexMes(m);
  l.push('');l.push('ACERTO DO CASAL');
  l.push('Pessoa;Pagou;Deveria contribuir;Diferenca');
  l.push([nomeA(),ac.pagoA.toFixed(2).replace('.',','),ac.parteA.toFixed(2).replace('.',','),ac.adiantouA.toFixed(2).replace('.',',')].join(';'));
  l.push([nomeB(),ac.pagoB.toFixed(2).replace('.',','),ac.parteB.toFixed(2).replace('.',','),ac.adiantouB.toFixed(2).replace('.',',')].join(';'));
 }catch(e){}
 baixar('fechamento-'+m+'.csv','\ufeff'+l.join('\r\n'),'text/csv;charset=utf-8');
}

/* ---------------- Excel (.xlsx real via SheetJS) ---------------- */
function excel(){
 if(typeof XLSX==='undefined'||!XLSX||!XLSX.utils){toast('❌ A biblioteca de Excel não carregou — recarregue a página');return}
 const m=S.ui.mes,ac=apexMes(m),v=valoresMes(m);
 const wb=XLSX.utils.book_new();
 const add=(nome,aoa)=>{
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols']=(aoa[0]||[]).map((_,i)=>({wch:i===0?36:i===1?18:16}));
  XLSX.utils.book_append_sheet(wb,ws,String(nome).slice(0,31));
 };
 add('Resumo do mes',[
  ['Nosso Dinheiro — finanças do casal'],
  ['Mês',nomeMesLongo(m)],
  ['Gerado em',new Date().toLocaleString('pt-BR')],
  ['Última atualização dos dados',pctTempo(S.atualizadoEm||S.criadoEm)],
  ['Casal',nomeA()+' e '+nomeB()],
  [],
  ['Indicador','Valor (R$)'],
  ['Entradas (rendas + receitas lançadas)',v.ent],
  ['Contas fixas',v.fx],
  ['Gastos variáveis',v.va],
  ['Parcelas de compras parceladas',v.pa],
  ['Despesas totais',v.de],
  ['Sobra do mês (já sem o guardado)',v.sobra],
  ['Taxa de sobra (%)',v.taxa],
  ['Guardado em metas',v.guardado]
 ]);
 const lc=lancMes(m).slice().sort((a,b)=>(a.data||'').localeCompare(b.data||''));
 const l2=[['Dia','Tipo','Descrição','Categoria','Quem pagou','Divisão','Forma','Valor (R$)','Observação']];
 lc.forEach(l=>l2.push([dataBR(l.data).slice(0,5),l.tipo==='receita'?'Receita':'Despesa',l.desc||'',l.categoria||'Outros',
  rq(l.pagador||'C'),divCurta(l),l.metodo||'',(l.tipo==='receita'?1:-1)*(+l.valor||0),l.obs||'']));
 l2.push([]);l2.push(['','','Total de receitas','','','','',soma(lc.filter(x=>x.tipo==='receita')),'']);
 l2.push(['','','Total de despesas','','','','',soma(lc.filter(x=>x.tipo!=='receita')),'']);
 add('Receitas e despesas',l2);
 const l3=[['Conta','Valor (R$)','Dia do vencimento','Categoria','Quem paga','Divisão','Situação no mês','Ativa']];
 fixasMes(m).forEach(f=>l3.push([f.nome||'',contaFixaValorMes(f,m),f.dia||1,f.categoria||'Moradia',rq(f.pagador||'C'),
  divCurta(f),situacaoFixa(f,m),f.ativo===false?'não':'sim']));
 l3.push([]);l3.push(['Total de contas fixas',soma(fixasMes(m)),'','','','','','']);
 add('Contas fixas',l3);
 const l4=[['Compra','Parcela atual','Total de parcelas','Valor da parcela (R$)','Início','Término','Restante (R$)','Categoria','Quem paga','Divisão']];
 parcelasMes(m).forEach(x=>{const p=x.p||{},rest=Math.max(0,(+p.parcelas||0)-(+x.i.atual||0));
  l4.push([p.nome||'',x.i.atual,p.parcelas,+p.valorParcela||0,p.inicio||'',p.fim||'',+(rest*(+p.valorParcela||0)).toFixed(2),
   p.categoria||'Cartão',rq(p.pagador||'C'),divCurta(p)])});
 l4.push([]);l4.push(['Total das parcelas neste mês','','',somaParc(parcelasMes(m)),'','','','','','']);
 add('Parcelados',l4);
 const l5=[['Item','Tipo','Pagou','Divisão','Valor (R$)','Parte '+nomeA()+' (R$)','Parte '+nomeB()+' (R$)']];
 ac.itens.forEach(i=>l5.push([i.nome,i.orig==='gasto'?'Gasto variável':i.orig==='fixa'?'Conta fixa':'Parcelado',rq(i.pagador),
  divCurta(i),i.valor,i.compart?i.parteA:0,i.compart?i.parteB:0]));
 l5.push([]);l5.push(['','','Pagou','Deveria contribuir','Diferença (adiantou)','','']);
 l5.push([nomeA(),'',ac.pagoA,ac.parteA,ac.adiantouA,'','']);
 l5.push([nomeB(),'',ac.pagoB,ac.parteB,ac.adiantouB,'','']);
 l5.push(['Conta conjunta (dinheiro em comum)',ac.pagoC,'','','','','']);
 l5.push([]);l5.push([ac.quitado?'Mês equilibrado: ninguém adiantou nada.':rq(ac.credor)+' adiantou '+fmt(ac.valor)+' — a devolução de '+rq(ac.devedor)+' fecha o mês no zero.']);
 l5.push(['Total compartilhado analisado',ac.totalComp]);
 add('Acerto do casal',l5);
 const l6=[['Mês','Entradas','Contas fixas','Gastos variáveis','Parcelas','Despesas','Sobra','Taxa de sobra (%)','Guardado','Lançamentos','Parcelas no mês']];
 evolucao(12).forEach(e=>l6.push([e.m,e.e,e.f,e.v,e.p,e.d,e.e-e.d,e.e>0?Math.round((e.e-e.d)/e.e*1000)/10:0,e.g,lancMes(e.m).length,parcelasMes(e.m).length]));
 add('Fechamento 12 meses',l6);
 const l7=[['Data','Descrição','Valor (R$)','Categoria','Quem pagou','Tem foto','Observação']];
 S.recibos.slice().sort((a,b)=>(b.data||'').localeCompare(a.data||'')).forEach(r=>l7.push([dataBR(r.data),r.nome||'',+r.valor||0,r.categoria||'',rq(r.pagador||'C'),r.img?'sim':'não',r.obs||'']));
 if(!S.recibos.length)l7.push(['Nenhum recibo guardado','','','','','','']);
 add('Recibos',l7);
 XLSX.writeFile(wb,'nosso-dinheiro-'+m+'.xlsx');
 toast('📊 Excel baixado com '+wb.SheetNames.length+' abas de '+mesNomeLongo(m));
}

/* ---------------- enviar / receber ---------------- */
function copiaAtual(){
 const cod=JSON.stringify(S);
 const qtd=(S.lancamentos||[]).length+' lançamento(s), '+(S.fixas||[]).length+' conta(s) fixa(s), '+(S.parcelados||[]).length+' parcelado(s), '+(S.metas||[]).length+' meta(s)';
 abrirModal('<h3>🔗 Enviar o estado atual</h3>'
 +'<div class="quote">Carimbo deste aparelho: <b>'+stampTxt()+'</b><br>'+qtd+'.</div>'
 +'<div class="quote" style="margin-top:11px">A outra pessoa abre o app, vai em <b>Compartilhar &amp; Ajustes</b>, cola este código em <b>“Carregar dados do parceiro”</b> e confirma. '
 +'O app avisa se o código estiver mais antigo que os dados dela e <b>não deixa sobrescrever</b> sem confirmação.</div>'
 +'<textarea readonly style="width:100%;min-height:150px;margin-top:11px;font-size:11px" onclick="this.select()">'+esc(cod)+'</textarea>'
 +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="copiaTexto">📋 Copiar código</button>'
 +'<button class="btn" data-act="backupJson">💾 Baixar backup .json</button>'
 +'<button class="btn gh" data-act="fecharModal">Fechar</button></div>');
}
function backupJson(){baixar('nosso-dinheiro-backup-'+hojeISO()+'.json',JSON.stringify(S),'application/json');toast('💾 Backup salvo — guarde no Drive ou mande no WhatsApp')}

/* ---------------- PWA ---------------- */
let A2HS=null, SW_OK=false;
function ehIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function estaInstalado(){try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: minimal-ui)').matches||navigator.standalone===true}catch(e){return false}}
function suportaSW(){return 'serviceWorker' in navigator}
function ligarPWA(){
 window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();A2HS=e;
  const b=document.querySelector('[data-act="instalarPwa"]');
  if(b){b.classList.add('pri');b.textContent='📲 Instalar app'}
  toast('📲 Este aparelho pode instalar o app — toque em “Instalar app”');
 });
 window.addEventListener('appinstalled',()=>{A2HS=null;toast('🎉 App instalado! Procure o ícone “Nosso Dinheiro” na tela de início')});
 const b=document.querySelector('[data-act="instalarPwa"]');
 if(b&&ehIOS())b.textContent='📲 Instalar (iPhone)';
 if(b&&estaInstalado())b.style.display='none';
}
function registrarSW(){
 if(!suportaSW())return;
 const seguro=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
 if(!seguro)return;
 navigator.serviceWorker.register('sw.js',{scope:'./'}).then(()=>{SW_OK=true}).catch(()=>{SW_OK=false});
}
function modalInstalar(){
 const ios=ehIOS(),inst=estaInstalado(),https=location.protocol==='https:';
 const temManifest=!!document.querySelector('link[rel="manifest"]');
 const linha=(ok,txt,sub)=>'<div class="li"><span class="ce '+(ok?'rec':'des')+'" style="flex:0 0 auto;min-width:104px;text-align:center">'+(ok?'✅ pronto':'a fazer')+'</span>'
  +'<span class="nm"><b>'+txt+'</b><div class="mut sm">'+sub+'</div></span></div>';
 let h='<h3>📲 Instalar o app no celular e no computador</h3>';
 h+='<div class="quote">O app funciona igual nos dois: mesmo arquivo, mesmas telas. Instalado, ele abre em <b>tela cheia</b>, sem barra de navegador, com ícone na tela de início e <b>funciona sem internet</b>.</div>';
 if(inst){h+='<div class="quote" style="margin-top:11px">🎉 Este aparelho já está rodando o app em modo aplicativo.</div>'}
 else{
  h+='<div style="margin:12px 0">'
  +linha(temManifest,'Manifesto do app','manifest.json com ícones 192 e 512 px, <b>display: standalone</b> e <b>start_url</b>')
  +linha(suportaSW(),'Funciona offline','service worker que guarda a “casca” do app (abre sem internet)')
  +linha(https,'Endereço web seguro (HTTPS)','os navegadores só deixam instalar em https:// — não em arquivo aberto do PC (file://)')
  +'</div>';
  if(A2HS){h+='<div class="row-bt"><button class="btn pri" data-act="instalarAgora">📲 Instalar agora</button></div>'
   +'<div class="quote" style="margin-top:10px">O navegador liberou a instalação neste aparelho agora.</div>'}
 }
 h+='<div class="bloco">iPhone / iPad (Safari) <span class="mut sm">o iOS não tem botão automático</span></div>'
 +'<div class="quote" style="line-height:1.85">1. Abra o app no <b>Safari</b> (no Chrome do iPhone a opção não aparece).<br>'
 +'2. Toque em <b>Compartilhar</b> (o quadrado com a seta para cima), na barra de baixo.<br>'
 +'3. Role e toque em <b>Adicionar à Tela de Início</b>.<br>'
 +'4. Confirme o nome <b>Nosso Dinheiro</b> e toque em <b>Adicionar</b>.<br>'
 +'Pronto — o ícone fica na tela de início e o app abre em tela cheia.</div>'
 +'<div class="bloco">Android (Chrome) e computador (Chrome/Edge)</div>'
 +'<div class="quote" style="line-height:1.85">• <b>Android:</b> menu <b>⋮</b> → <b>Instalar aplicativo</b> (ou <b>Adicionar à tela inicial</b>). Se aparecer a faixa “Instalar app”, use ela.<br>'
 +'• <b>Computador:</b> clique no ícone de <b>instalar</b> na barra de endereço (monitorzinho com seta) → <b>Instalar</b>. Ou menu <b>⋮</b> → <b>Instalar Nosso Dinheiro</b>.<br>'
 +'• <b>Windows / Mac:</b> o app abre em janela própria, com ícone no Menu Iniciar / Launchpad.</div>'
 +'<div class="quote" style="margin-top:11px">Os dados continuam salvos <b>no aparelho</b> (memória do navegador). Instalar não junta os dois celulares: para isso use o <b>código do mês</b> ou o <b>backup .json</b>.</div>'
 +'<div class="row-bt" style="margin-top:13px"><button class="btn gh" data-act="fecharModal">Fechar</button></div>';
 abrirModal(h);
}

;
/* ============================================================
   C3c — carimbo de sincronização, alertas de 7 dias,
   fechamento mensal, guarda de importação e PWA
   ============================================================ */

/* ---------------- datas ---------------- */
function _iso(dt){const d=new Date(dt);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

/* ---------------- carimbo de tempo ---------------- */
let BC=null;
function broadcast(){try{if('BroadcastChannel' in window){BC=BC||new BroadcastChannel('nossoDinheiro');BC.postMessage({t:'sync',em:S.atualizadoEm||null})}}catch(e){}}
function ligarCanal(){
 try{
  if('BroadcastChannel' in window){
   BC=BC||new BroadcastChannel('nossoDinheiro');
   BC.onmessage=()=>{try{const raw=localStorage.getItem(LSKEY);if(raw){S=JSON.parse(raw);normaliza()}render()}catch(e){}};
  }
 }catch(e){}
}
function pctTempo(d){
 const t=Date.parse(d||'');if(!t)return 'sem registro';
 const s=Math.max(0,Math.round((Date.now()-t)/1000));
 if(s<60)return 'atualizado agora';
 const m=Math.round(s/60);if(m<60)return 'atualizado há '+m+' min';
 const h=Math.round(m/60);if(h<24)return 'atualizado há '+h+'h';
 const dd=Math.round(h/24);return 'atualizado há '+dd+' dia'+(dd>1?'s':'');
}
function stampTxt(){const d=S.atualizadoEm||S.criadoEm||'';return '🕒 '+(d?pctTempo(d)+' ('+dataBR(String(d).slice(0,10))+')':'sem registro')}
function carimboInicio(){
 const el=document.getElementById('stampInicio');if(!el)return;
 const d=S.atualizadoEm||S.criadoEm;
 if(!d){el.style.display='none';return}
 el.style.display='inline-flex';
 el.textContent='🕒 '+(S.atualizadoEm?pctTempo(S.atualizadoEm):'sem registro');
 const t=Date.parse(d);
 el.title='Última atualização dos dados: '+(t?new Date(t).toLocaleString('pt-BR'):'—')+' — toque para gerar o código deste aparelho';
}
function barraSinc(){
 return '<div style="margin-bottom:12px"><button class="quando" data-act="copiarCodigo" title="Gerar o código com os dados deste aparelho">'+stampTxt()+' <span class="mut sm">· toque para enviar ao cônjuge</span></button></div>';
}

/* ---------------- alertas de vencimento (7 dias) ---------------- */
function emDias(n){return n===0?'vence hoje':n===1?'vence amanhã':'vence em '+n+' dias'}
function alertas7(){
 const base=new Date();base.setHours(0,0,0,0);
 const out=[];
 for(let i=0;i<7;i++){
  const d=new Date(base);d.setDate(d.getDate()+i);
  const ds=_iso(d),mm=ds.slice(0,7),dd=diaDe(ds);
  fixasDia(mm,dd).forEach(f=>{
   if(!fixaPaga(f,mm))out.push({q:i,ds,tipo:'fixa',nome:f.nome,valor:+f.valor||0,id:f.id,
    sub:'Conta fixa · '+rq(f.pagador||'C')+(f.over&&f.over[mm]?' · valor ajustado neste mês':'')});
  });
  parcelasDia(mm,dd).forEach(x=>{if(parcelaPaga(x.p,mm))return;out.push({q:i,ds,tipo:'parcela',nome:x.p.nome,valor:+x.p.valorParcela||0,
   sub:'Parcela '+x.i.atual+'/'+x.p.parcelas+' · termina em '+mesAbrev(x.i.fim)})});
  lancDia(ds).forEach(l=>{
   if(l.tipo!=='receita')out.push({q:i,ds,tipo:'desp',nome:l.desc,valor:+l.valor||0,sub:'Despesa lançada · '+rq(l.pagador||'C')});
  });
 }
 out.sort((a,b)=>a.q-b.q);
 const cls={fixa:'fx',parcela:'par',desp:'des'};
 let h='<div class="card alerta" style="margin-bottom:12px"><h3><span>🔔 Vencendo nos próximos 7 dias</span><small>contas fixas, parcelas e despesas lançadas</small></h3>';
 if(!out.length){h+='<div class="empty">Nenhuma conta vencendo nos próximos 7 dias. 🎉</div>'}
 else{
  h+=out.slice(0,10).map(x=>'<div class="li"><span class="ce '+cls[x.tipo]+'" style="flex:0 0 auto;min-width:104px;text-align:center">'+emDias(x.q)+'</span>'
   +'<span class="nm"><b>'+esc(x.nome)+'</b><div class="mut sm">'+x.sub+' · '+dataBR(x.ds)+'</div></span>'
   +(x.tipo==='fixa'?'<button class="btn sm gh" data-act="togFixa" data-id="'+x.id+'" title="marcar como paga">✓ paguei</button>':'')
   +'<b class="mono">'+fmt(x.valor)+'</b></div>').join('');
  const soma7=out.reduce((s,x)=>s+x.valor,0);
  h+='<div class="split" style="margin-top:12px"><span class="mut sm">'+(out.length>10?'mostrando 10 de '+out.length+' · ':'')+'total no período</span><b>'+fmt(soma7)+'</b></div>';
 }
 return h+'</div>';
}

/* ---------------- CSS extra ---------------- */
const CSS2=[
'.quando{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;border:1px solid var(--line-2);background:var(--surface);font-size:11.5px;color:var(--mut);font-weight:650;cursor:pointer;font-family:inherit}',
'#stampInicio{display:none}',
'.alerta{border-color:color-mix(in srgb,var(--warn,#fbbf24) 40%,transparent)}',
'.bloco{margin:16px 0 4px;font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:var(--mut);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid var(--line-2)}',
'.badgep{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:800;border:1px solid var(--line-2);white-space:nowrap}',
'.badgep.a{color:#93c5fd;border-color:rgba(96,165,250,.45)}.badgep.b{color:#f9a8d4;border-color:rgba(244,114,182,.45)}.badgep.c{color:#94a3b8}',
'table.blocos th,table.blocos td{font-size:12px;padding:8px}',
'.selo{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:800;border:1px solid var(--line-2)}',
'.selo.c{color:var(--sky,#38bdf8);border-color:color-mix(in srgb,var(--sky,#38bdf8) 40%,transparent)}',
'.destaque{background:linear-gradient(120deg,color-mix(in srgb,#7c5cff 16%,transparent),transparent);border-color:color-mix(in srgb,#7c5cff 35%,transparent)}',
'.numf{font-variant-numeric:tabular-nums;font-weight:800}',
'.pos{color:var(--pos)}.neg{color:var(--neg)}',
'.num,.right{text-align:right}'
].join('\n');
function injetarCSS2(){
 if(document.getElementById('css2'))return;
 const s=document.createElement('style');s.id='css2';s.textContent=CSS2;
 document.head.appendChild(s);
}

/* ---------------- fechamento mensal (comparar meses) ---------------- */
function modalFechamento(){
 const ev=evolucao(12);
 let guardou=0,piorM=null,melhorM=null;
 ev.forEach(e=>{guardou+=Math.max(0,e.g);
  if(!piorM||e.d>piorM.d)piorM={m:e.m,d:e.d};
  if(!melhorM||e.d<melhorM.d)melhorM={m:e.m,d:e.d}});
 const linhas=ev.map(e=>{
  const sob=e.e-e.d, tx=e.e>0?Math.round(sob/e.e*1000)/10:0;
  const gt=e.e>0?Math.round(e.g/e.e*1000)/10:0;
  const atual=e.m===S.ui.mes;
  return '<tr'+(atual?' style="background:var(--surface-2)"':'')+'>'
  +'<td><b>'+mesAbrev(e.m)+'</b>'+(atual?' <span class="selo c">aberto</span>':'')+'<div class="mut sm">'+lancMes(e.m).length+' lanç. · '+parcelasMes(e.m).length+' parc.</div></td>'
  +'<td class="num">'+fmt(e.e)+'</td><td class="num">'+fmt(e.f)+'</td><td class="num">'+fmt(e.v)+'</td><td class="num">'+fmt(e.p)+'</td>'
  +'<td class="num"><b>'+fmt(e.d)+'</b></td>'
  +'<td class="num '+(sob>=0?'pos':'neg')+'">'+fmt(sob)+'</td>'
  +'<td class="num '+(tx>=0?'pos':'neg')+'">'+String(tx).replace('.',',')+'%</td>'
  +'<td class="num pos">'+fmt(e.g)+'</td><td class="num">'+String(gt).replace('.',',')+'%</td>'
  +'<td class="right" style="white-space:nowrap"><button class="btn sm gh" data-act="detalhesMes" data-mes="'+e.m+'" title="ver o dia a dia deste mês">👁️</button>'
  +'<button class="btn sm gh" data-act="trocarMesFech" data-mes="'+e.m+'" title="usar este mês no app">↗️</button></td></tr>';
 });
 abrirModal('<div style="font-size:17px;font-weight:850">📋 Fechamento mensal</div>'
 +'<div class="mut sm" style="margin-bottom:10px">comparação dos últimos 12 meses · a linha destacada é o mês aberto no app</div>'
 +'<div class="chips"><span class="chip in">Guardado em 12 meses '+fmt(guardou)+'</span>'
 +'<span class="chip out">Mês mais caro '+mesAbrev(piorM.m)+' · '+fmt(piorM.d)+'</span>'
 +'<span class="chip ok">Mais econômico '+mesAbrev(melhorM.m)+' · '+fmt(melhorM.d)+'</span></div>'
 +'<div style="overflow-x:auto;max-height:58vh"><table><thead><tr><th>Mês</th><th class="num">Entradas</th><th class="num">Fixas</th><th class="num">Variáveis</th><th class="num">Parcelas</th><th class="num">Despesas</th><th class="num">Sobra</th><th class="num">Taxa</th><th class="num">Guardado</th><th class="num">% guard.</th><th></th></tr></thead><tbody>'
 +linhas.join('')+'</tbody></table></div>'
 +'<div class="quote" style="margin-top:12px">Em <b>'+mesAbrev(piorM.m)+'</b> as despesas chegaram a '+fmt(piorM.d)+' e em <b>'+mesAbrev(melhorM.m)+'</b> ficaram em '+fmt(melhorM.d)
 +' — diferença de <b>'+fmt(piorM.d-melhorM.d)+'</b>. Use <b>↗️</b> para trazer qualquer mês para o app.</div>'
 +'<div class="row-bt" style="margin-top:13px"><button class="btn pri sm" data-act="excel">📊 Baixar Excel do fechamento</button>'
 +'<button class="btn sm gh" data-act="fecharModal">Fechar</button></div>',true);
}

/* ---------------- guarda de importação ---------------- */
function avisoCodigoAntigo(d){
 const df=Date.parse(d.atualizadoEm||d.criadoEm||'')||0;
 const lf=Date.parse(S.atualizadoEm||'')||0;
 const q=(x)=>((x&&x.lancamentos)?x.lancamentos.length:((x&&x.gastos)?x.gastos.length:0));
 window._codPendente=()=>{
  S=(d.gastos&&!d.lancamentos)?converterAntigo(d):Object.assign(estadoVazio(),d);
  S.importadoEm=new Date().toISOString();
  normaliza();save();render();
  toast('Dados carregados ✅ agora este é o estado mais novo');
 };
 abrirModal('<h3>⚠️ Esse código é mais antigo que os seus dados</h3>'
 +'<div class="quote">Carimbo do código: <b>'+(df?pctTempo(new Date(df).toISOString()):'sem carimbo')+'</b> ('+(df?dataBR(new Date(df).toISOString().slice(0,10)):'—')+')<br>'
 +'Carimbo deste aparelho: <b>'+(lf?pctTempo(S.atualizadoEm):'sem registro')+'</b>.<br><br>'
 +'Carregar por cima <b>apaga o que está aqui</b>: são <b>'+q(S)+' lançamento(s) neste aparelho</b> contra <b>'+q(d)+' no código recebido</b>.</div>'
 +'<div class="quote" style="margin-top:11px">💡 O caminho certo: peça para a outra pessoa abrir o app dela e tocar em <b>🕒 carimbo “toque para enviar”</b> ou em <b>📋 Copiar código do mês</b>. Assim o código vem mais novo que o seu.</div>'
 +'<div class="row-bt" style="margin-top:13px"><button class="btn danger" data-act="forcarCodigo">Carregar de qualquer forma</button>'
 +'<button class="btn gh" data-act="fecharModal">Cancelar e manter o que tenho</button></div>');
}
function converterAntigo(d){
 const o=estadoVazio();
 (d.gastos||[]).forEach(g=>o.lancamentos.push({id:uid(),tipo:'despesa',desc:g.desc||'',valor:+g.valor||0,data:g.data,
  categoria:g.categoria||'Outros',pagador:g.quem||'C',div:'casal',pctA:50,metodo:g.metodo||'Pix',obs:g.obs||''}));
 (d.fixas||[]).forEach(f=>o.fixas.push({id:uid(),nome:f.nome||'',valor:+f.valor||0,dia:+f.dia||1,categoria:f.categoria||'Moradia',
  pagador:f.quem||'C',div:'casal',ativo:true,inicio:f.inicio||o.ui.mes,pagos:f.pagos||{},over:{}}));
 o.casal=Object.assign(o.casal,{a:(d.casal&&d.casal.a)||'',b:(d.casal&&d.casal.b)||'',
  rendaA:(d.casal&&+d.casal.rendaA)||0,rendaB:(d.casal&&+d.casal.rendaB)||0});
 return o;
}
function importarArquivo(file){
 const fr=new FileReader();
 fr.onerror=()=>toast('❌ Não consegui ler o arquivo');
 fr.onload=e=>{
  let d=null;
  try{d=JSON.parse(e.target.result)}catch(err){toast('❌ Arquivo inválido — não é um backup do app');return}
  if(!d||(!d.lancamentos&&!d.gastos&&!d.casal)){toast('❌ Esse arquivo não é um backup do Nosso Dinheiro');return}
  const antigo=!!(d.gastos&&!d.lancamentos);
  const df=Date.parse(d.atualizadoEm||d.criadoEm||'')||0, lf=Date.parse(S.atualizadoEm||'')||0;
  const aplicar=()=>{
   S=antigo?converterAntigo(d):Object.assign(estadoVazio(),d);
   S.importadoEm=new Date().toISOString();
   normaliza();save();render();
   toast(antigo?'Backup da versão antiga convertido ✅':'Backup carregado ✅');
  };
  if(df&&lf&&df<lf){
   window._backupPendente=aplicar;
   abrirModal('<h3>⚠️ Esse backup é mais antigo que os seus dados</h3>'
   +'<div class="quote">O arquivo é de <b>'+dataBR(new Date(df).toISOString().slice(0,10))+'</b> ('+pctTempo(new Date(df).toISOString())+'),'
   +' mas este aparelho tem dados de <b>'+dataBR(S.atualizadoEm.slice(0,10))+'</b>. Restaurar por cima <b>apaga</b> o que existe aqui.</div>'
   +'<div class="row-bt" style="margin-top:13px"><button class="btn danger" data-act="forcarArquivo">Restaurar de qualquer forma</button>'
   +'<button class="btn gh" data-act="fecharModal">Cancelar e manter o que tenho</button></div>');
   return;
  }
  aplicar();
 };
 fr.readAsText(file);
}

/* ---------------- filtro por pessoa ---------------- */
function opcoesPessoa(sel){
 const o=[['','Todos'],['A',nomeA()],['B',nomeB()],['C','Conta conjunta'],['CASAL','Do casal (dinheiro em comum)']];
 return o.map(x=>'<option value="'+x[0]+'"'+(sel===x[0]?' selected':'')+'>'+(x[0]===''?'Todos':'Só '+x[1])+'</option>').join('');
}

;
/* ============================================================
   C3d — novas ações: duplicar, fechamento, acerto, Excel,
   recibos com conferência e instalação do app
   ============================================================ */
function pgLancDepois(){
 if(S.ui.pagina!=='lanc')return;
 const main=document.getElementById('main');if(!main)return;
 const foco=window._focoLanc||null;window._focoLanc=null;
 if(foco){const i=main.querySelector('[data-form="lanc"] [name="'+foco+'"]');if(i)i.focus()}
}
function verRecConf(id){
 const r=S.recibos.find(x=>x.id===id);if(!r)return;
 const kb=r.img?Math.round(r.img.length*0.75/1024):0;
 const total=Math.round(JSON.stringify(S.recibos).length/1024);
 abrirModal('<h3>🧾 Confira a nota antes de guardar</h3>'
 +(r.img?'<img src="'+r.img+'" style="width:100%;border-radius:12px;border:1px solid var(--line-2)">':'<div class="empty">Salvo sem imagem.</div>')
 +'<div class="quote" style="margin-top:11px">A foto foi reduzida para no máximo <b>800 px de largura</b> em <b>JPEG 70%</b>: esta ocupa cerca de <b>'+kb+' KB</b>. '
 +'Na galeria inteira são <b>'+total+' KB</b> dos ~5 MB do navegador.</div>'
 +'<div class="mut sm" style="margin-top:8px">Se a nota ficou ilegível, troque por uma foto mais próxima e bem iluminada.</div>'
 +'<div class="row-bt" style="margin-top:13px"><button class="btn ok" data-act="guardaRec" data-id="'+r.id+'">✅ Está legível, guardar</button>'
 +'<button class="btn" data-act="editRec" data-id="'+r.id+'">🔁 Trocar por outra foto</button>'
 +'<button class="btn danger" data-act="delRecibo" data-id="'+r.id+'">🗑️ Descartar</button>'
 +'<button class="btn gh" data-act="fecharModal">Fechar</button></div>');
}
function editRec(id){
 const r=S.recibos.find(x=>x.id===id);if(!r)return;
 abrirModal('<h3>🔁 Trocar a foto de “'+esc(r.nome)+'”</h3>'
 +'<form data-form="recImg"><input type="hidden" name="id" value="'+r.id+'"><div class="form">'
 +'<div class="full"><label class="f">Nova imagem do recibo</label><input type="file" name="img" accept="image/*" required></div>'
 +'<div class="full mut sm">A nova foto também é reduzida para 800 px / JPEG 70%.</div>'
 +'</div><div class="row-bt" style="margin-top:13px"><button class="btn pri" type="submit">Salvar nova foto</button>'
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');
}
/* ---------------- filtro por pessoa: blocos ---------------- */
function tabelaPessoa(l){
 if(!l.length)return '<div class="empty" style="padding:12px">Nada por aqui com o filtro atual.</div>';
 return '<div style="overflow-x:auto"><table class="blocos"><thead><tr><th>Dia</th><th>Descrição</th><th class="hidemob">Categoria</th><th>Divisão</th><th class="num">Valor</th><th></th></tr></thead><tbody>'
 +l.slice().sort((a,b)=>(a.data||'').localeCompare(b.data||'')).map(x=>'<tr><td class="mono sm">'+dataBR(x.data).slice(0,5)+'</td>'
  +'<td><b>'+esc(x.desc)+'</b>'+(x.obs?'<div class="mut sm">'+esc(x.obs)+'</div>':'')+'</td>'
  +'<td class="hidemob"><span class="tag">'+catInfo(x.categoria).i+' '+esc(x.categoria||'Outros')+'</span></td>'
  +'<td>'+pillDiv(x)+'</td>'
  +'<td class="num '+(x.tipo==='receita'?'pos':'')+'">'+(x.tipo==='receita'?'+':'−')+fmt(x.valor)+'</td>'
  +'<td class="right" style="white-space:nowrap"><button class="btn sm gh" data-act="duplicar" data-id="'+x.id+'" title="duplicar lançamento">📋</button>'
  +'<button class="btn sm gh" data-act="editLanc" data-id="'+x.id+'">✏️</button></td></tr>').join('')
 +'</tbody></table></div>';
}
function blocosPessoa(lst){
 const g={A:[],B:[],C:[]};
 lst.forEach(x=>{const q=x.pagador||'C';g[q==='A'?'A':q==='B'?'B':'C'].push(x)});
 const casal=lst.filter(x=>(x.div||S.casal.div||'casal')==='casal');
 const linha=(t,q,cor)=>{const l=g[q];if(!l.length)return '';
  const des=soma(l.filter(x=>x.tipo!=='receita')),rec=soma(l.filter(x=>x.tipo==='receita'));
  return '<div class="bloco"><span><span class="badgep '+cor+'">'+esc(t)+'</span> '+l.length+' lançamento(s)</span>'
  +'<span>despesas <b class="neg">'+fmt(des)+'</b>'+(rec?' · receitas <b class="pos">'+fmt(rec)+'</b>':'')
  +' <span class="mut">· do casal '+fmt(soma(l.filter(x=>(x.div||S.casal.div||'casal')==='casal')))+'</span></span></div>'+tabelaPessoa(l);
 };
 let h=linha(nomeA(),'A','a')+linha(nomeB(),'B','b')+linha('Conta conjunta','C','c');
 h+='<div class="bloco"><span><span class="badgep c">💚 Do casal</span> '+casal.length+' lançamento(s) saindo do dinheiro em comum</span><span><b>'+fmt(soma(casal))+'</b></span></div>';
 h+=casal.length?tabelaPessoa(casal):'<div class="empty" style="padding:12px">Nenhum lançamento marcado como “do casal” neste mês.</div>';
 return h;
}
/* ---------------- ações novas ---------------- */
document.addEventListener('click',e=>{
 const ma=e.target.closest('[data-act="mais"]');
 if(ma){const fo=ma.closest('form');if(fo)fo.dataset.mais='1'}
 const el=e.target.closest('[data-act]');if(!el)return;
 const a=el.dataset.act,id=el.dataset.id;
 if(a==='mais')return;
 if(a==='fecharMes'){modalFechamento();return}
 if(a==='trocarMesFech'){if(el.dataset.mes){S.ui.mes=el.dataset.mes;fecharModal();S.ui.pagina='resumo';render();toast('Mostrando '+mesNome(S.ui.mes))}return}
 if(a==='detalhesMes'){modalMes(el.dataset.mes||S.ui.mes);return}
 if(a==='novoLanc'){DUPES=0;window._focoLanc='desc';
  if(S.ui.pagina!=='lanc'){S.ui.pagina='lanc';render()}
  else{const b=document.querySelector('.novoLanc');if(b&&b.scrollIntoView)b.scrollIntoView({behavior:'smooth',block:'center'});
   const i=document.querySelector('[data-form="lanc"] [name="desc"]');if(i)i.focus()}
  return}
 if(a==='duplicar'){
  const l=S.lancamentos.find(x=>x.id===id);if(!l){toast('Lançamento não encontrado');return}
  DUPES=1;
  abrirModal('<h3 style="margin:0 0 11px;font-size:17px">📋 Duplicar lançamento</h3>'
  +'<div class="quote" style="margin-bottom:11px">Cópia de <b>'+esc(l.desc)+'</b> — o original não é alterado. A data já vem com hoje.</div>'
  +formLanc({tipo:l.tipo,desc:l.desc,valor:l.valor,data:hojeISO(),categoria:l.categoria,pagador:l.pagador,div:l.div,pctA:l.pctA,metodo:l.metodo,obs:l.obs,recibo:l.recibo||''}));
  return}
 if(a==='guardarRec'){fecharModal();toast('Recibo guardado 📎')}
 if(a==='editRec'){editRec(id);return}
 if(a==='excel'){excel();return}
 if(a==='csvMes'){csvMes(el.dataset.mes||S.ui.mes);toast('CSV do fechamento baixado');return}
 if(a==='enviarCodigo'){copiaAtual();return}
 if(a==='copiaTexto'){const t=JSON.stringify(S);let ok=false;
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t);ok=true}}catch(er){}
  if(ok)toast('Código copiado ✅ mande no WhatsApp');else toast('Toque no texto e copie');
  return}
 if(a==='backupJson'){backupJson();return}
 if(a==='forcarCodigo'){const fn=window._codPendente;window._codPendente=null;fecharModal();if(fn)fn();return}
 if(a==='forcarArquivo'){const fn=window._backupPendente;window._backupPendente=null;fecharModal();if(fn)fn();return}
 if(a==='instalarPwa'){modalInstalar();return}
 if(a==='instalarAgora'){if(A2HS){const ev=A2HS;A2HS=null;fecharModal();ev.prompt();if(ev.userChoice)ev.userChoice.then(()=>toast('Confirme a instalação no navegador 📲'))}else modalInstalar();return}
});
/* troca de foto do recibo */
document.addEventListener('submit',e=>{
 const f=e.target;
 if(!f||f.dataset.form!=='recImg')return;
 e.preventDefault();
 const d=Object.fromEntries(new FormData(f).entries());
 const r=S.recibos.find(x=>x.id===d.id);if(!r){toast('Recibo não encontrado');return}
 const fi=f.querySelector('input[type=file]');
 if(!fi||!fi.files||!fi.files[0]){toast('Escolha uma imagem');return}
 toast('Comprimindo a nova imagem...');
 comprimir(fi.files[0],img=>{
  if(!img)return;
  r.img=img;save();render();
  toast('Foto trocada ✅ agora ocupa '+Math.round(img.length*0.75/1024)+' KB');
  verRecConf(r.id);
 });
},true);

/* ---------------- sobe o app (todos os módulos já carregados) ---------------- */
iniciarApp();

;
/* ==================== CONTA / LOGIN / NUVEM (compartilhado entre 2 pessoas) ==================== */
window.NOSSO_FIREBASE = window.NOSSO_FIREBASE || null;
const FBCFG_KEY='nossoDinheiro.firebase', CONTA_KEY='nossoDinheiro.conta', FB_VER='10.12.2';
const SYNC={unsub:null,timer:null,lock:false,erro:'',pendente:''};
var CONTA=null, FB={app:null,auth:null,db:null};

function lerLS(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function gravaLS(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function cfgNuvem(){var w=(typeof window!=='undefined')?window.NOSSO_FIREBASE:null;if(w&&w.apiKey)return w;var s=lerLS(FBCFG_KEY,null);return (s&&s.apiKey)?s:null}
function hashPin(p){var h=5381,s='nd:'+String(p);for(var i=0;i<s.length;i++)h=(((h<<5)+h)^s.charCodeAt(i))>>>0;return h.toString(36)}
function carregarConta(){CONTA=lerLS(CONTA_KEY,null);return CONTA}
function salvarConta(){try{gravaLS(CONTA_KEY,CONTA)}catch(e){}}
function horaBR(iso){try{return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}
function gerarConvite(){var L='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a='',b='',i;
 for(i=0;i<4;i++)a+=L.charAt(Math.floor(Math.random()*L.length));
 for(i=0;i<4;i++)b+=String(Math.floor(Math.random()*10));
 return 'CASAL-'+a+b}
function msgErro(e){
 var c=(e&&e.code)||'';
 if(/invalid-email/i.test(c))return 'E-mail inválido.';
 if(/wrong-password|invalid-credential|invalid-login/i.test(c))return 'E-mail ou senha incorretos.';
 if(/user-not-found/i.test(c))return 'Não existe conta com esse e-mail — use "Criar conta".';
 if(/email-already-in-use/i.test(c))return 'Esse e-mail já tem conta — use "Entrar".';
 if(/weak-password/i.test(c))return 'A senha precisa de pelo menos 6 caracteres.';
 if(/network|unavailable|offline/i.test(c))return 'Sem conexão com a nuvem agora — tente em instantes.';
 if(/operation-not-allowed/i.test(c))return 'Ative "E-mail/senha" no Firebase Authentication.';
 if(/permission-denied/i.test(c))return 'A nuvem negou o acesso — confira as regras do Firestore.';
 if(/missing|invalid-api-key|api-key/i.test(c))return 'Configuração da nuvem inválida — confira o firebaseConfig.';
 return (e&&e.message)?e.message:'Não consegui completar agora.';
}

/* ---------- SDK do Firebase (carregado só quando a nuvem é usada) ---------- */
function carregarScript(src){return new Promise(function(ok,err){var s=document.createElement('script');s.src=src;s.async=true;s.onload=function(){ok(true)};s.onerror=function(){err(new Error('Não consegui carregar a biblioteca da nuvem (verifique a internet).'))};document.head.appendChild(s)})}
async function carregarSDK(){
 if(window.firebase&&window.firebase.firestore)return true;
 await carregarScript('https://www.gstatic.com/firebasejs/'+FB_VER+'/firebase-app-compat.js');
 await carregarScript('https://www.gstatic.com/firebasejs/'+FB_VER+'/firebase-auth-compat.js');
 await carregarScript('https://www.gstatic.com/firebasejs/'+FB_VER+'/firebase-firestore-compat.js');
 return true;
}
async function conectarFB(){
 var cfg=cfgNuvem();
 if(!cfg||!cfg.apiKey)throw new Error('Nuvem não configurada — abra "Conta & nuvem" e cole a configuração do seu projeto Firebase (é grátis).');
 if(!FB.app||!FB.db){
  await carregarSDK();
  FB.app=(firebase.apps&&firebase.apps.length)?firebase.app():firebase.initializeApp(cfg);
  FB.auth=firebase.auth();
  FB.db=firebase.firestore();
  try{FB.db.enablePersistence({synchronizeTabs:true})}catch(e){}
 }
 return FB;
}

/* ---------- entrada / saída de sessão ---------- */
function entrarSessao(obj){
 CONTA=obj; salvarConta(); escutarCasa(); esconderGate();
 try{render()}catch(e){}
 toast(obj.modo==='nuvem'?'☁️ Conectado — os dois veem os mesmos dados':'📱 Modo só neste aparelho');
}
function entrarLocal(){
 CONTA=CONTA||{modo:'local',criadoEm:new Date().toISOString()};
 CONTA.modo='local'; salvarConta(); esconderGate(); try{render()}catch(e){}
 toast('📱 Modo só neste aparelho — dá para criar conta depois em Compartilhar');
}
async function entrarEmail(email,senha){
 if(!email||!senha)throw new Error('Preencha e-mail e senha.');
 var F=await conectarFB();
 var cred=await F.auth.signInWithEmailAndPassword(String(email).trim(),String(senha));
 await aposAuth(cred.user,null);
}
async function criarContaEmail(email,senha,nome,casa){
 if(!email||!senha)throw new Error('Preencha e-mail e senha.');
 if(String(senha).length<6)throw new Error('A senha precisa de pelo menos 6 caracteres.');
 var F=await conectarFB();
 var cred=await F.auth.createUserWithEmailAndPassword(String(email).trim(),String(senha));
 try{if(nome&&cred.user.updateProfile)await cred.user.updateProfile({displayName:nome})}catch(e){}
 await criarCasa(cred.user,casa||('Casa de '+(nome||'vocês')));
}
function snapshotPreNuvem(){
 if(lerLS('nossoDinheiro.preNuvem',null))return;
 try{gravaLS('nossoDinheiro.preNuvem',{em:new Date().toISOString(),dados:JSON.stringify(S)})}catch(e){}
}
async function aposAuth(user,nomeCasa){
 snapshotPreNuvem();
 var F=await conectarFB();
 var ref=F.db.collection('usuarios').doc(user.uid);
 var snap=await ref.get();
 if(snap.exists&&snap.data()&&snap.data().casaId){await abrirCasa(snap.data().casaId,user)}
 else if(nomeCasa){await criarCasa(user,nomeCasa)}
 else{modalSemCasa()}
}
async function criarCasa(user,nome){
 var F=await conectarFB();
 var id=F.db.collection('casas').doc().id;
 var convite=gerarConvite();
 var p=payloadNuvem();
 await F.db.collection('casas').doc(id).set({nome:nome||'Nossa casa',convite:convite,membros:[user.uid],
  dados:p.dados,atualizadoEm:S.atualizadoEm||new Date().toISOString(),criadoEm:new Date().toISOString()});
 await F.db.collection('usuarios').doc(user.uid).set({casaId:id,email:user.email||''},{merge:true});
 fecharModal();
 entrarSessao({modo:'nuvem',uid:user.uid,email:user.email||'',casaId:id,casaNome:nome||'Nossa casa',convite:convite,membros:[user.uid],syncEm:new Date().toISOString()});
}
async function abrirCasa(casaId,user){
 var F=await conectarFB();
 var ref=F.db.collection('casas').doc(casaId);
 var snap=await ref.get();
 if(!snap.exists)throw new Error('Essa casa não existe mais — peça um código novo.');
 var c=snap.data()||{};
 var membros=(c.membros||[]).slice();
 if(membros.indexOf(user.uid)<0){
  membros.push(user.uid);
  try{await ref.update({membros:firebase.firestore.FieldValue.arrayUnion(user.uid)})}catch(e){}
 }
 try{await F.db.collection('usuarios').doc(user.uid).set({casaId:casaId,email:user.email||''},{merge:true})}catch(e){}
 entrarSessao({modo:'nuvem',uid:user.uid,email:user.email||'',casaId:casaId,casaNome:c.nome||'Nossa casa',convite:c.convite||'',membros:membros,syncEm:new Date().toISOString()});
 await escolherDados(c,ref);
}
async function entrarPorCodigo(cod){
 var F=await conectarFB();
 var codigo=String(cod||'').toUpperCase().replace(/\s+/g,'').trim();
 if(!codigo)throw new Error('Digite o código de convite.');
 if(!F.auth.currentUser)throw new Error('Faça login com seu e-mail primeiro (aba Entrar) e depois o código.');
 var q=await F.db.collection('casas').where('convite','==',codigo).limit(1).get();
 if(!q||q.empty)throw new Error('Código não encontrado — confira com quem criou a casa.');
 await abrirCasa(q.docs[0].id,F.auth.currentUser);
}
function sairConta(){
 try{if(FB.auth&&FB.auth.signOut)FB.auth.signOut()}catch(e){}
 try{if(SYNC.unsub)SYNC.unsub()}catch(e){}
 SYNC.unsub=null;
 if(CONTA&&CONTA.modo==='nuvem'){CONTA=null;try{localStorage.removeItem(CONTA_KEY)}catch(e){}}
 else if(CONTA){CONTA.modo='local';salvarConta()}
 telaEntrada('entrar'); toast('Você saiu da conta');
}

/* ---------- dados / sincronização ---------- */
function payloadNuvem(){
 var full=JSON.stringify(S);
 if(full.length<800000)return {dados:full,semImagens:false};
 var copia=JSON.parse(full);
 (copia.recibos||[]).forEach(function(r){delete r.img});
 return {dados:JSON.stringify(copia),semImagens:true};
}
function nuvemSave(){
 if(SYNC.lock)return;
 if(!CONTA||CONTA.modo!=='nuvem'||!FB.db)return;
 clearTimeout(SYNC.timer);
 SYNC.timer=setTimeout(function(){gravarNuvem(false).catch(function(){})},900);
}
async function gravarNuvem(forcar){
 if(!CONTA||CONTA.modo!=='nuvem'||!FB.db)throw new Error('Nuvem não conectada.');
 var p=payloadNuvem();
 await FB.db.collection('casas').doc(CONTA.casaId).set({dados:p.dados,atualizadoEm:S.atualizadoEm||new Date().toISOString(),atualizadoPor:CONTA.email||''},{merge:true});
 CONTA.syncEm=new Date().toISOString(); salvarConta(); SYNC.erro='';
 atualizarStatusConta();
 if(p.semImagens)toast('☁️ Sincronizado — recibos grandes ficam só neste aparelho');
 if(forcar)toast('☁️ Enviado para a nuvem agora');
}
function escutarCasa(){
 try{if(SYNC.unsub)SYNC.unsub()}catch(e){}
 SYNC.unsub=null;
 if(!CONTA||CONTA.modo!=='nuvem'||!FB.db)return;
 SYNC.unsub=FB.db.collection('casas').doc(CONTA.casaId).onSnapshot(function(doc){
  if(!doc.exists)return;
  var c=doc.data()||{};
  CONTA.membros=c.membros||CONTA.membros||[];
  CONTA.convite=c.convite||CONTA.convite;
  CONTA.casaNome=c.nome||CONTA.casaNome;
  salvarConta();
  var rem=Date.parse(c.atualizadoEm||'')||0, loc=Date.parse((S&&S.atualizadoEm)||'')||0;
  if(rem>loc+1500){
   SYNC.lock=true; try{aplicarTexto(c.dados,false)}catch(e){} SYNC.lock=false;
  }
  atualizarStatusConta();
 },function(err){SYNC.erro=msgErro(err);atualizarStatusConta()});
}
function aplicarTexto(txt,avisar){
 var d=null; try{d=JSON.parse(txt)}catch(e){return}
 if(!d||(!d.casal&&!d.lancamentos&&!d.gastos))return;
 var ui=(S&&S.ui)?S.ui:null;
 S=Object.assign(estadoVazio(),d); normaliza();
 if(ui){S.ui.mes=ui.mes||S.ui.mes;S.ui.pagina=ui.pagina||S.ui.pagina;S.ui.tema=ui.tema||S.ui.tema}
 try{save()}catch(e){}
 try{render()}catch(e){}
 if(avisar!==false)toast('☁️ Dados atualizados da nuvem');
}
async function escolherDados(c,ref){
 var rem=Date.parse(c.atualizadoEm||'')||0, loc=Date.parse((S&&S.atualizadoEm)||'')||0;
 var remoto=null; try{remoto=JSON.parse(c.dados||'')}catch(e){}
 if(!remoto)return;
 if(rem>loc+1500){SYNC.lock=true;aplicarTexto(c.dados,false);SYNC.lock=false;toast('☁️ Usei os dados da nuvem (mais recentes)');return}
 if(loc>rem+1500){
  SYNC.pendente=c.dados||'';
  abrirModal('<h3 style="margin:0 0 10px;font-size:17px">☁️ Qual dado vale?</h3>'
  +'<div class="quote">Este aparelho tem dados <b>mais novos</b> ('+esc(horaBR(S.atualizadoEm))+') que a nuvem ('+esc(horaBR(c.atualizadoEm))+'). Escolha o que fica:</div>'
  +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="syncEnviar">Enviar os meus para a nuvem</button>'
  +'<button class="btn gh" data-act="syncUsar">Usar os da nuvem</button></div>');
 }
}

/* ---------- PIN (trava de privacidade do aparelho) ---------- */
function modalPin(){
 var tem=!!(CONTA&&CONTA.pin);
 abrirModal('<h3 style="margin:0 0 10px;font-size:17px">🔒 PIN deste aparelho</h3>'
 +'<div class="quote">O PIN só impede alguém que pegue seu celular de abrir o app. Ele <b>não</b> é criptografia e não substitui a senha da conta.</div>'
 +'<form data-form="pinNew"><div class="form"><div><label class="f">'+(tem?'Novo PIN (4 a 8 números)':'PIN (4 a 8 números)')+'</label>'
 +'<input name="pin" inputmode="numeric" maxlength="8" placeholder="••••" required></div></div>'
 +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" type="submit">Salvar PIN</button>'
 +(tem?'<button class="btn gh danger" type="button" data-act="pinOff">Remover PIN</button>':'')
 +'<button class="btn gh" type="button" data-act="fecharModal">Cancelar</button></div></form>');
}

/* ---------- tela de entrada ---------- */
function esconderGate(){var g=document.getElementById('gate');if(g&&g.parentNode)g.parentNode.removeChild(g)}
function gateMsg(txt,ok){
 var b=document.getElementById('gateMsg'); if(!b)return;
 b.textContent=txt||''; b.className='gateMsg'+(txt?(ok?' ok':' erro'):'');
}
function telaEntrada(aba){
 aba=aba||'entrar';
 var velho=document.getElementById('gate'); if(velho&&velho.parentNode)velho.parentNode.removeChild(velho);
 var cfg=cfgNuvem();
 var h='<div class="gateCard"><div class="gateLogo">₵</div><h2>Nosso Dinheiro</h2>'
 +'<p class="mut sm" style="margin:2px 0 14px">Entre para abrir as finanças da casa</p>';
 if(aba==='pin'){
  h+='<form data-form="gatePin"><label class="f">PIN deste aparelho</label>'
  +'<input name="pin" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="••••" required>'
  +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" type="submit">Abrir</button>'
  +'<button class="btn gh" type="button" data-act="gateLocal">Esquecer PIN e usar sem conta</button></div></form>';
 }else{
  h+='<div class="gateTabs"><button type="button" data-act="gateTab" data-tab="entrar" class="'+(aba==='entrar'?'on':'')+'">Entrar</button>'
  +'<button type="button" data-act="gateTab" data-tab="criar" class="'+(aba==='criar'?'on':'')+'">Criar conta</button></div>';
  if(aba==='criar'){
   h+='<form data-form="criar"><label class="f">Seu nome</label><input name="nome" placeholder="Ex.: Alvaro" autocomplete="name">'
   +'<label class="f">E-mail</label><input name="email" type="email" placeholder="voce@email.com" autocomplete="email" required>'
   +'<label class="f">Senha (mínimo 6)</label><input name="senha" type="password" autocomplete="new-password" required>'
   +'<label class="f">Nome da casa</label><input name="casa" placeholder="Ex.: Casa Alvaro e Marina">'
   +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" type="submit">Criar conta e casa</button></div></form>';
  }else{
   h+='<form data-form="entrar"><label class="f">E-mail</label><input name="email" type="email" autocomplete="email" required>'
   +'<label class="f">Senha</label><input name="senha" type="password" autocomplete="current-password" required>'
   +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" type="submit">Entrar</button>'
   +'<button class="btn gh" type="button" data-act="gateTab" data-tab="criar">Criar conta</button></div>'
   +'<div style="margin-top:9px;text-align:right"><button class="btn sm gh" type="button" data-act="gateEsqueci">Esqueci a senha</button></div></form>'
   +'<form data-form="recuperar" style="display:none;margin-top:10px;border-top:1px solid var(--line);padding-top:11px">'
   +'<label class="f">Recuperar acesso — enviamos um link para criar nova senha</label>'
   +'<div class="row-bt"><input name="email" type="email" placeholder="voce@email.com" style="flex:1"><button class="btn ok" type="submit">Enviar link</button></div></form>'
   +'<form data-form="entrarCodigo" style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px">'
   +'<label class="f">2ª pessoa: já tenho um código de convite</label>'
   +'<div class="row-bt"><input name="codigo" placeholder="CASAL-XXXX" style="flex:1"><button class="btn ok" type="submit">Entrar na casa</button></div></form>';
  }
  h+='<div class="gateOr">ou</div>'
  +'<button class="btn gh" style="width:100%" data-act="gateLocal">📱 Usar só neste aparelho (sem conta)</button>'
  +'<div class="mut sm" style="margin-top:11px">'+(cfg?'☁️ Nuvem configurada — vocês dois veem os mesmos dados.':'⚠️ Nuvem ainda não configurada. Sem ela o login não sincroniza entre celulares — veja o guia em <b>Compartilhar → Conta &amp; nuvem</b> (grátis).')+'</div>';
 }
 h+='<div id="gateMsg" class="gateMsg"></div></div>';
 var g=document.createElement('div'); g.id='gate'; g.className='gate'; g.innerHTML=h; document.body.appendChild(g);
}

/* ---------- cartão na aba Compartilhar ---------- */
function atualizarStatusConta(){
 var el=document.getElementById('contaStatus'); if(!el)return;
 if(!CONTA||CONTA.modo!=='nuvem'){el.textContent='';return}
 el.textContent=SYNC.erro?('⚠️ '+SYNC.erro):'☁️ conectado';
}
function cardConta(){
 if(!CONTA||CONTA.modo!=='nuvem'){
  return '<div class="card" style="margin-bottom:13px"><h3><span>👤 Conta &amp; nuvem</span><small>'+(CONTA?'modo só neste aparelho':'você ainda não entrou')+'</small></h3>'
  +'<div class="quote">Assim, os dados ficam salvos <b>apenas neste navegador</b>. Para <b>duas pessoas verem e editarem juntos</b>, crie uma conta gratuita: cada um entra com o próprio e-mail e a casa fica compartilhada na nuvem.</div>'
  +'<div class="row-bt" style="margin-top:11px"><button class="btn pri" data-act="abrirGate">👤 Entrar / criar conta</button>'
  +'<button class="btn" data-act="irNuvem">☁️ Ativar nuvem</button>'
  +(CONTA&&CONTA.pin?'<button class="btn gh" data-act="pinOff">🔓 Remover PIN</button>':'<button class="btn gh" data-act="pinDef">🔒 Criar PIN</button>')
  +(lerLS('nossoDinheiro.preNuvem',null)?'<button class="btn gh" data-act="restaurarPreNuvem">↩️ Cópia de antes da nuvem</button>':'')
  +'</div></div>';
 }
 var ini=String(CONTA.email||'?').charAt(0).toUpperCase();
 var membros=(CONTA.membros||[]).length||1;
 return '<div class="card" style="margin-bottom:13px;background:linear-gradient(120deg,rgba(52,211,153,.10),transparent)">'
 +'<h3><span>👤 Conta &amp; nuvem</span><small id="contaStatus">'+(SYNC.erro?('⚠️ '+esc(SYNC.erro)):'☁️ conectado')+'</small></h3>'
 +'<div class="li"><span class="tag g" style="font-size:14px">'+esc(ini)+'</span>'
 +'<span class="nm"><b>'+esc(CONTA.email||'conta')+'</b><div class="mut sm">'+esc(CONTA.casaNome||'Nossa casa')+' • '+membros+' pessoa(s) na casa</div></span></div>'
 +'<div class="quote" style="margin-top:11px"><b>Código de convite da casa:</b> '
 +'<span class="mono" style="font-size:17px;letter-spacing:1.5px">'+esc(CONTA.convite||'—')+'</span>'
 +'<div class="mut sm">Mande esse código para seu cônjuge: ele cria a conta dele e escolhe <b>“Entrar na casa”</b>. A partir daí os dois veem e editam os mesmos dados.</div>'
 +'<div class="row-bt" style="margin-top:9px"><button class="btn sm" data-act="copiarConvite">📋 Copiar código</button>'
 +'<button class="btn sm ok" data-act="sincNuvem">🔄 Sincronizar agora</button></div></div>'
 +'<div class="mut sm" style="margin-top:9px">'+(CONTA.syncEm?'Última sincronização: '+esc(horaBR(CONTA.syncEm)):'Ainda não sincronizou nesta sessão')+'</div>'
 +'<div class="row-bt" style="margin-top:10px"><button class="btn sm gh" data-act="pinDef">🔒 PIN</button>'
 +'<button class="btn sm gh" data-act="irNuvem">⚙️ Nuvem</button>'
 +(lerLS('nossoDinheiro.preNuvem',null)?'<button class="btn sm gh" data-act="restaurarPreNuvem">↩️ Cópia local</button>':'')
 +'<button class="btn sm gh danger" data-act="sairConta">Sair da conta</button></div></div>';
}

/* ---------- modais auxiliares ---------- */
function modalNuvem(){
 var cfg=cfgNuvem();
 abrirModal('<h3 style="margin:0 0 10px;font-size:17px">☁️ Ativar o compartilhamento na nuvem</h3>'
 +'<div class="quote">Passo a passo (tudo no plano grátis do Firebase):<br>'
 +'1. Abra <b>console.firebase.google.com</b> e crie um projeto.<br>'
 +'2. Em <b>Authentication</b> → Sign-in method, ative <b>E-mail/senha</b>.<br>'
 +'3. Em <b>Firestore Database</b> → criar banco (modo produção).<br>'
 +'4. Em <b>Configurações do projeto → Seus apps → Web</b>, copie o objeto <b>firebaseConfig</b>.<br>'
 +'5. Cole abaixo e salve. Depois publique as regras de segurança do guia.</div>'
 +'<form data-form="fbcfg"><label class="f">Cole aqui o firebaseConfig</label>'
 +'<textarea name="cfg" rows="6" style="width:100%" placeholder="{ apiKey: \'...\', authDomain: \'...\', projectId: \'...\' }">'+(cfg?esc(JSON.stringify(cfg,null,1)):'')+'</textarea>'
 +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" type="submit">Salvar configuração</button>'
 +(cfg?'<button class="btn gh" type="button" data-act="limparNuvem">Remover configuração</button>':'')
 +'<button class="btn gh" type="button" data-act="fecharModal">Fechar</button></div></form>');
}
function modalSemCasa(){
 abrirModal('<h3 style="margin:0 0 10px;font-size:17px">🏠 Sua conta ainda não tem uma casa</h3>'
 +'<form data-form="novaCasa"><label class="f">Criar uma casa nova</label>'
 +'<div class="row-bt"><input name="casa" placeholder="Ex.: Casa Alvaro e Marina" style="flex:1"><button class="btn pri" type="submit">Criar</button></div></form>'
 +'<div class="gateOr">ou</div>'
 +'<form data-form="codigoCasa"><label class="f">Entrar numa casa que já existe (código do convite)</label>'
 +'<div class="row-bt"><input name="codigo" placeholder="CASAL-XXXX" style="flex:1"><button class="btn ok" type="submit">Entrar</button></div></form>');
}

/* ---------- eventos ---------- */
document.addEventListener('click',function(e){
 var el=(e.target&&e.target.closest)?e.target.closest('[data-act]'):null; if(!el)return;
 var a=el.getAttribute('data-act');
 try{
  if(a==='gateTab'){telaEntrada(el.getAttribute('data-tab')||'entrar');return}
  if(a==='gateLocal'){entrarLocal();return}
  if(a==='abrirGate'){telaEntrada('entrar');return}
  if(a==='copiarConvite'){if(CONTA&&CONTA.convite)copiar(CONTA.convite,'Código da casa copiado ✅');return}
  if(a==='sincNuvem'){gravarNuvem(true).catch(function(err){toast('⚠️ '+msgErro(err))});return}
  if(a==='sairConta'){sairConta();return}
  if(a==='irNuvem'){modalNuvem();return}
  if(a==='limparNuvem'){try{localStorage.removeItem(FBCFG_KEY)}catch(err){};fecharModal();toast('Configuração removida');return}
  if(a==='gateEsqueci'){var fr=document.querySelector('[data-form=\"recuperar\"]');if(fr){fr.style.display='block';var em=fr.querySelector('[name=email]');var atual=document.querySelector('[data-form=\"entrar\"] [name=email]');if(em&&atual&&atual.value)em.value=atual.value;if(em)em.focus()}return}
  if(a==='restaurarPreNuvem'){
   var cp=lerLS('nossoDinheiro.preNuvem',null); if(!cp||!cp.dados){toast('Não há cópia guardada');return}
   abrirModal('<h3 style="margin:0 0 10px;font-size:17px">↩️ Restaurar cópia local</h3>'
   +'<div class="quote">Essa cópia foi guardada em <b>'+esc(horaBR(cp.em))+'</b>, antes de conectar a nuvem. Restaurar substitui os dados deste aparelho por ela (a nuvem não é alterada até você sincronizar).</div>'
   +'<div class="row-bt" style="margin-top:12px"><button class="btn pri" data-act="restaurarPreOk">Restaurar agora</button>'
   +'<button class="btn gh" data-act="fecharModal">Cancelar</button></div>');
   return}
  if(a==='restaurarPreOk'){var c2=lerLS('nossoDinheiro.preNuvem',null);if(c2&&c2.dados){aplicarTexto(c2.dados,false);fecharModal();toast('Cópia restaurada ✅')}return}
  if(a==='pinDef'){modalPin();return}
  if(a==='pinOff'){if(CONTA){delete CONTA.pin;salvarConta();fecharModal();try{render()}catch(err){};toast('PIN removido')}return}
  if(a==='syncEnviar'){gravarNuvem(true).then(function(){fecharModal()}).catch(function(err){toast('⚠️ '+msgErro(err))});return}
  if(a==='syncUsar'){if(SYNC.pendente)aplicarTexto(SYNC.pendente,true);fecharModal();return}
 }catch(err){toast('⚠️ '+(err.message||'erro'))}
},true);

document.addEventListener('submit',async function(e){
 var f=e.target; if(!f||!f.dataset||!f.dataset.form)return;
 var t=f.dataset.form;
 if(['entrar','criar','entrarCodigo','gatePin','fbcfg','pinNew','novaCasa','codigoCasa','recuperar'].indexOf(t)<0)return;
 e.preventDefault();
 var d={}; try{new FormData(f).forEach(function(v,k){d[k]=v})}catch(err){}
 var noGate=!!document.getElementById('gate');
 try{
  if(t==='entrar'){gateMsg('Entrando…',true);await entrarEmail(d.email,d.senha)}
  else if(t==='criar'){gateMsg('Criando sua conta…',true);await criarContaEmail(d.email,d.senha,d.nome,d.casa)}
  else if(t==='entrarCodigo'){gateMsg('Procurando a casa…',true);await entrarPorCodigo(d.codigo)}
  else if(t==='recuperar'){
   gateMsg('Enviando o link…',true);
   var Fr=await conectarFB();
   await Fr.auth.sendPasswordResetEmail(String(d.email||'').trim());
   gateMsg('Link enviado para '+(d.email||'')+' — confira a caixa de entrada e o spam. Depois volte e entre com a senha nova.',true);
  }
  else if(t==='gatePin'){
   if(CONTA&&CONTA.pin&&hashPin(d.pin)===CONTA.pin){esconderGate();toast('Aberto ✅')}
   else gateMsg('PIN incorreto — tente de novo.',false);
  }
  else if(t==='pinNew'){
   var p=String(d.pin||'').replace(/\D/g,'');
   if(p.length<4)throw new Error('Use de 4 a 8 números.');
   CONTA=CONTA||{modo:'local'}; CONTA.pin=hashPin(p); salvarConta(); fecharModal(); try{render()}catch(err){}; toast('PIN criado 🔒');
  }
  else if(t==='fbcfg'){
   var txt=String(d.cfg||'').trim();
   if(!txt)throw new Error('Cole a configuração primeiro.');
   var obj=null;
   try{obj=JSON.parse(txt)}catch(err){try{obj=(new Function('return ('+txt+')'))()}catch(err2){obj=null}}
   if(!obj||!obj.apiKey)throw new Error('Não reconheci a configuração — ela começa com { apiKey: ... }.');
   gravaLS(FBCFG_KEY,obj); FB={app:null,auth:null,db:null}; fecharModal();
   toast('☁️ Nuvem configurada — agora entre ou crie sua conta');
   if(noGate)telaEntrada('entrar'); else try{render()}catch(err){}
  }
  else if(t==='novaCasa'){await criarCasa(FB.auth.currentUser,d.casa||'Nossa casa')}
  else if(t==='codigoCasa'){await entrarPorCodigo(d.codigo)}
 }catch(err){
  var msg=msgErro(err);
  if(noGate)gateMsg(msg,false); else toast('⚠️ '+msg);
 }
},false);

/* ---------- início ---------- */
function iniciarConta(){
 carregarConta();
 if(!CONTA){telaEntrada('entrar');return}
 if(CONTA.modo==='local'){
  if(CONTA.pin)telaEntrada('pin');
  return;
 }
 if(!cfgNuvem()){
  SYNC.erro='nuvem sem configuração';
  telaEntrada('entrar');
  return;
 }
 if(window.firebase&&window.firebase.firestore&&window.firebase.apps&&window.firebase.apps.length){
  FB.app=window.firebase.app(); FB.auth=window.firebase.auth(); FB.db=window.firebase.firestore();
  escutarCasa(); return;
 }
 carregarSDK().then(function(){
  FB.app=(firebase.apps&&firebase.apps.length)?firebase.app():firebase.initializeApp(cfgNuvem());
  FB.auth=firebase.auth(); FB.db=firebase.firestore();
  try{FB.db.enablePersistence({synchronizeTabs:true})}catch(e){}
  FB.auth.onAuthStateChanged(function(u){if(!u){telaEntrada('entrar')}});
  if(CONTA.casaId)escutarCasa(); else if(FB.auth.currentUser)modalSemCasa();
 }).catch(function(err){SYNC.erro=msgErro(err);telaEntrada('entrar')});
}

/* dispara a tela de entrada / retomada de sessão no fim do bundle */
try{iniciarConta()}catch(e){console.error('conta:',e)}
