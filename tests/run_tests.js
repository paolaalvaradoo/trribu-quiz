// Uso: node tests/run_tests.js ruta/al/quiz.html   → sale con código 1 si algo falla (sirve para GitHub Actions)
const load=require('./engine.js');const run=load(process.argv[2]);
const base={signos:['bien'],porosidad:'media',tratamientos:['ninguno'],calor:'natural',tipo:'lacio',grosor:'medio',cuero:'equilibrado',prio:['prevenir'],futuros:['nada']};
let fail=0;
for(const [name,x,exp] of require('./golden_profiles.json')){const r=run({...base,...x});const ok=r.routine===exp;if(!ok)fail++;console.log((ok?'OK  ':'FAIL')+' '+name+' → '+r.routine+(ok?'':' (esperado '+exp+')'));}
// Invariantes sobre perfiles aleatorios
const S=['enredo','quiebre','puntas','cuerpo','opaco','secoTodo','textura','canas','frizz'],PR=['enredo','quiebre','cuerpo','pelitos','canas','ondas','frizz','suave','brillo'];
const pick=a=>a[Math.random()*a.length|0],sh=a=>a.slice().sort(()=>Math.random()-.5);
let inv=0;
for(let i=0;i<20000;i++){const bien=Math.random()<.1;const a={...base,signos:bien?['bien']:sh(S).slice(0,1+(Math.random()*3|0)),porosidad:pick(['alta','media','baja']),tratamientos:(t=>t.length?t:['ninguno'])(['tinteRaices','tinteTodo','mechas','keratina'].filter(()=>Math.random()<.25)),calor:pick(['natural','secadora','plancha','diario']),tipo:pick(['lacio','suaves','ondas','rizado','crespo']),prio:Math.random()<.1?['prevenir']:sh(PR).slice(0,1+(Math.random()*3|0))};
 const r=run(a);const e=m=>{inv++;if(inv<=10)console.log('INVARIANTE ROTO:',m,JSON.stringify(a));};
 if(!r.needs.length||r.needs.length>3)e('necesidades 0 o >3');
 if(!r.cards.length||r.cards.length>3)e('tarjetas 0 o >3');
 if(new Set(r.cards).size!==r.cards.length)e('tarjetas repetidas');
 if(bien&&r.routine==='SAMC')e('pelo bien con 2 productos extra');
 if(r.needs.some(n=>['frizz','proteccion','ondas'].includes(n))&&!r.routine.includes('C'))e('necesidad de La Crema sin La Crema');
}
console.log('\nPerfiles fallidos:',fail,'· Invariantes rotos:',inv);process.exit(fail||inv?1:0);
