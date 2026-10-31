// Carga el motor del quiz directamente desde el HTML (fuente de verdad) para testearlo en Node.
const fs=require('fs'),vm=require('vm');
module.exports=function load(htmlPath){
 const html=fs.readFileSync(htmlPath,'utf8');
 const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
 const el=()=>({textContent:'',innerHTML:'',hidden:false,style:{},classList:{toggle(){}},querySelector:()=>el(),querySelectorAll:()=>[],appendChild(){},value:'',checked:false,disabled:false});
 const ctx={location:{search:''},URLSearchParams,document:{getElementById:()=>el(),querySelector:()=>el(),querySelectorAll:()=>[],createElement:()=>el()},window:{scrollTo(){}},console,Math,Date,JSON,alert(){}};
 vm.createContext(ctx);
 vm.runInContext(code.replace(/\bconst (QS|SV|P|MODO|NEED_LABELS|PRIO_CARD|SCALP)\b/g,'var $1').replace(/\blet (step|answers)\b/g,'var $1'),ctx);
 return a=>{ctx.__a=a;vm.runInContext('answers=__a',ctx);const mo=ctx.motor();return {routine:'SA'+(mo.needMask?'M':'')+(mo.needCrema?'C':''),m:mo.m,c:mo.c,needs:ctx.needsVisual(),cards:ctx.hallazgos().map(x=>x[0])}};
};
