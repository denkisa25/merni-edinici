(function(){
  "use strict";

  /* ---- shared data layer (mirrors calc.js / build.mjs) ---- */
  var DEFAULT_DATA = {
    ingredients:{
      brashno:{name:"брашно",density:.50}, zahar:{name:"захар",density:.85},
      "pudra-zahar":{name:"пудра захар",density:.50}, oriz:{name:"ориз",density:.78},
      kakao:{name:"какао",density:.36}, oves:{name:"овесени ядки",density:.38},
      mlyako:{name:"мляко",density:1.03}, olio:{name:"олио",density:.92},
      maslo:{name:"масло",density:.96}, med:{name:"мед",density:1.42},
      sol:{name:"сол",density:1.20}, voda:{name:"вода",density:1.00}
    },
    units:{
      chasha:{ml:250,label:"чаша"}, sl:{ml:15,label:"с.л."}, chl:{ml:5,label:"ч.л."},
      ml:{ml:1,label:"мл"}, l:{ml:1000,label:"л"}, cup_us:{ml:240,label:"cup"},
      floz:{ml:29.5735,label:"fl oz"}, g:{g:1,label:"г"}, kg:{g:1000,label:"кг"},
      oz:{g:28.3495,label:"oz"}, lb:{g:453.592,label:"lb"}
    },
    order:["chasha","sl","chl","ml","l","cup_us","floz","g","kg","oz","lb"]
  };
  var DATA = window.__KITCHEN_DATA__ || DEFAULT_DATA;
  if(!DATA.units.l) DATA.units.l={ml:1000,label:"л"};
  if(!DATA.units["бр"]) DATA.units["бр"]={label:"бр"};
  var ING=DATA.ingredients, UNITS=DATA.units;
  var SELECT_ORDER=DATA.order.slice(); if(SELECT_ORDER.indexOf("бр")<0) SELECT_ORDER.push("бр");

  /* ---- unit aliases for parsing ---- */
  var UALIAS={
    "супена лъжица":"sl","супени лъжици":"sl","сл":"sl","tbsp":"sl","tablespoon":"sl","tablespoons":"sl",
    "чаена лъжичка":"chl","чаени лъжички":"chl","чл":"chl","tsp":"chl","teaspoon":"chl","teaspoons":"chl",
    "чаша":"chasha","чаши":"chasha",
    "мл":"ml","ml":"ml","милилитър":"ml","милилитра":"ml",
    "л":"l","l":"l","литър":"l","литра":"l","литри":"l",
    "г":"g","гр":"g","грам":"g","грама":"g","g":"g",
    "кг":"kg","kg":"kg","килограм":"kg","килограма":"kg",
    "cup":"cup_us","cups":"cup_us",
    "fl oz":"floz","floz":"floz",
    "oz":"oz","ounce":"oz","ounces":"oz",
    "lb":"lb","lbs":"lb","pound":"lb","pounds":"lb"
  };
  var FRAC={"½":.5,"⅓":1/3,"⅔":2/3,"¼":.25,"¾":.75,"⅛":.125,"⅜":.375,"⅝":.625,"⅞":.875};

  /* ---- helpers ---- */
  function isVol(u){return UNITS[u]&&typeof UNITS[u].ml==="number";}
  function norm(s){return s.toLowerCase().replace(/\./g,"").replace(/[,;:()]/g," ").replace(/\s+/g," ").trim();}

  function resolveIng(name){
    var n=norm(name); if(!n) return null;
    var best=null,bestLen=0;
    for(var id in ING){
      var k=norm(ING[id].name);
      if(n===k) return {id:id,density:ING[id].density,name:ING[id].name};
      if((n.indexOf(k)>=0||k.indexOf(n)>=0)&&k.length>bestLen){best={id:id,density:ING[id].density,name:ING[id].name};bestLen=k.length;}
    }
    return best;
  }

  function parseQty(s){
    s=s.trim();
    var m=s.match(/^(\d+)\s+(\d+)\/(\d+)/); if(m) return {q:+m[1]+(+m[2]/+m[3]),rest:s.slice(m[0].length)};
    m=s.match(/^(\d+)\/(\d+)/); if(m) return {q:(+m[1])/(+m[2]),rest:s.slice(m[0].length)};
    m=s.match(/^(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)/);
    if(m) return {q:(parseFloat(m[1].replace(",","."))+parseFloat(m[2].replace(",",".")))/2,rest:s.slice(m[0].length),range:true};
    m=s.match(/^(\d*)\s*([½⅓⅔¼¾⅛⅜⅝⅞])/);
    if(m) return {q:(m[1]?+m[1]:0)+FRAC[m[2]],rest:s.slice(m[0].length)};
    m=s.match(/^(\d+(?:[.,]\d+)?)/); if(m) return {q:parseFloat(m[1].replace(",",".")),rest:s.slice(m[0].length)};
    return {q:null,rest:s};
  }

  function parseLine(line){
    var raw=line.trim(); if(!raw) return null;
    var pq=parseQty(raw);
    var toks=norm(pq.rest).split(" ").filter(Boolean);
    var unit=null, used=0;
    if(toks.length>=2 && UALIAS[toks[0]+" "+toks[1]]){ unit=UALIAS[toks[0]+" "+toks[1]]; used=2; }
    else if(toks.length>=1 && UALIAS[toks[0]]){ unit=UALIAS[toks[0]]; used=1; }
    var name=toks.slice(used).join(" ").replace(/^(от|на)\s+/,"").trim();
    var ing=resolveIng(name);
    return {
      name: ing?ing.name:(name||raw),
      amt: pq.q!=null?pq.q:1,
      unit: unit||"бр",
      known: !!ing,
      hadQty: pq.q!=null
    };
  }

  function findTemps(text){
    var out=[],seen={},m,re=/(\d{2,3})\s*°?\s*([cfсф])\b/gi;
    while((m=re.exec(text))){
      var val=+m[1], f=/[fф]/i.test(m[2]);
      var key=val+(f?"F":"C"); if(seen[key])continue; seen[key]=1;
      if(f) out.push({f:val,c:Math.round((val-32)*5/9/5)*5});
    }
    return out;
  }

  /* ---- state ---- */
  var rows=[{name:"брашно",amt:2,unit:"chasha"},{name:"захар",amt:1,unit:"chasha"},{name:"масло",amt:125,unit:"g"}];
  var temps=[];

  /* ---- rounding / format ---- */
  function fmt(n,unit){
    if(!isFinite(n)) return "—";
    var r;
    if(unit==="g"||unit==="ml"){ r = n>=100?Math.round(n/5)*5 : n>=10?Math.round(n) : Math.round(n*10)/10; }
    else { r = n>=10?Math.round(n) : Math.round(n*4)/4; }
    return String(r).replace(".",",");
  }

  /* ---- editor ---- */
  var rowsEl=document.getElementById("rows");
  function unitOptions(sel){
    return SELECT_ORDER.map(function(u){return '<option value="'+u+'"'+(u===sel?" selected":"")+'>'+UNITS[u].label+"</option>";}).join("");
  }
  function buildEditor(){
    rowsEl.innerHTML="";
    rows.forEach(function(r,i){
      var resolved=resolveIng(r.name);
      var div=document.createElement("div");
      div.className="ing-row"+(resolved?"":" warn");
      div.innerHTML=
        '<input list="ing-names" value="'+(r.name||"").replace(/"/g,"&quot;")+'" placeholder="съставка" aria-label="съставка">'+
        '<input type="text" inputmode="decimal" value="'+r.amt+'" aria-label="количество">'+
        '<select aria-label="мерна единица">'+unitOptions(r.unit)+'</select>'+
        '<button class="rm" title="премахни">✕</button>';
      var ins=div.querySelectorAll("input"), sel=div.querySelector("select");
      ins[0].addEventListener("input",function(){rows[i].name=this.value; div.className="ing-row"+(resolveIng(this.value)?"":" warn"); renderOutput();});
      ins[1].addEventListener("input",function(){var v=parseFloat(this.value.replace(",",".")); rows[i].amt=isNaN(v)?0:v; renderOutput();});
      sel.addEventListener("change",function(){rows[i].unit=this.value; renderOutput();});
      div.querySelector(".rm").addEventListener("click",function(){rows.splice(i,1); buildEditor(); renderOutput();});
      rowsEl.appendChild(div);
    });
  }

  /* ---- compute + output ---- */
  function scaleRow(r,factor,toGrams){
    var amt=r.amt*factor, ing=resolveIng(r.name), u=r.unit, ud=UNITS[u];
    if(toGrams && ud){
      if(typeof ud.ml==="number"){
        if(ing) return {name:r.name,amt:amt*ud.ml*ing.density,unit:"g",flag:null};
        return {name:r.name,amt:amt,unit:u,flag:"не е в грамове"};
      }
      if(typeof ud.g==="number") return {name:r.name,amt:amt*ud.g,unit:"g",flag:null};
    }
    return {name:r.name,amt:amt,unit:u,flag:null};
  }

  function renderOutput(){
    var src=Math.max(1,+document.getElementById("src").value||1);
    var tgt=Math.max(1,+document.getElementById("tgt").value||1);
    var toGrams=document.getElementById("to-grams").checked;
    var factor=tgt/src;
    document.getElementById("factor").textContent=
      factor===1?"Без промяна на порциите.":"Мащаб ×"+(Math.round(factor*100)/100)+" ("+src+" → "+tgt+" порции).";

    var live=rows.filter(function(r){return r.name&&r.amt>0;});
    var out=document.getElementById("output");
    if(!live.length){ out.innerHTML='<div class="out"><h3>Резултат</h3><p class="empty">Добави съставки, за да видиш преобразуваната рецепта.</p></div>'; return; }

    var scaled=live.map(function(r){return scaleRow(r,factor,toGrams);});

    var map={},orderKeys=[];
    scaled.forEach(function(s){
      var k=s.name+"|"+s.unit;
      if(!map[k]){map[k]={name:s.name,unit:s.unit,amt:0,flag:s.flag};orderKeys.push(k);}
      map[k].amt+=s.amt;
    });

    function li(s){
      return '<li><span class="nm">'+esc(s.name)+(s.flag?' <span class="flag">('+s.flag+')</span>':"")+
        '</span><span class="amt">'+fmt(s.amt,s.unit)+" "+(UNITS[s.unit]?UNITS[s.unit].label:s.unit)+"</span></li>";
    }

    var recipeHtml=scaled.map(li).join("");
    var shopHtml=orderKeys.map(function(k){return li(map[k]);}).join("");
    var tempHtml=temps.length?'<p class="temp">Температура: '+temps.map(function(t){return t.f+"°F → <b>"+t.c+"°C</b>";}).join(", ")+"</p>":"";

    out.innerHTML=
      '<div class="out"><h3>Преобразувана рецепта</h3><ul class="out-list">'+recipeHtml+"</ul>"+tempHtml+
        '<div class="out-actions"><button class="primary" id="copy">Копирай</button><button id="print">Принтирай</button></div></div>'+
      '<div class="out"><h3>Списък за пазаруване</h3><ul class="out-list">'+shopHtml+"</ul></div>";

    document.getElementById("copy").addEventListener("click",function(){
      var txt=orderKeys.map(function(k){var s=map[k];return s.name+" — "+fmt(s.amt,s.unit)+" "+(UNITS[s.unit]?UNITS[s.unit].label:s.unit);}).join("\n");
      if(navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){var b=document.getElementById("copy");b.textContent="Копирано ✓";setTimeout(function(){b.textContent="Копирай";},1400);}).catch(function(){});
    });
    document.getElementById("print").addEventListener("click",function(){window.print();});
  }
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

  /* ---- wiring ---- */
  document.getElementById("ing-names").innerHTML=Object.keys(ING).map(function(id){return '<option value="'+ING[id].name+'">';}).join("");

  document.getElementById("add-row").addEventListener("click",function(){rows.push({name:"",amt:1,unit:"chasha"}); buildEditor();});
  ["src","tgt","to-grams"].forEach(function(id){document.getElementById(id).addEventListener("input",renderOutput);});
  document.querySelectorAll(".stepper button").forEach(function(b){
    b.addEventListener("click",function(){var inp=document.getElementById(this.dataset.step);inp.value=Math.max(1,(+inp.value||1)+(+this.dataset.d));renderOutput();});
  });

  /* ---- tab system (3 tabs: manual | paste | url) ---- */
  function selectTab(tab){
    ["manual","paste","url"].forEach(function(t){
      document.getElementById("tab-"+t).setAttribute("aria-selected", t===tab);
    });
    document.getElementById("paste-panel").hidden = tab!=="paste";
    document.getElementById("url-panel").hidden   = tab!=="url";
  }
  document.getElementById("tab-paste").addEventListener("click",function(){selectTab("paste");});
  document.getElementById("tab-manual").addEventListener("click",function(){selectTab("manual");});
  document.getElementById("tab-url").addEventListener("click",function(){selectTab("url");});

  document.getElementById("parse-btn").addEventListener("click",function(){
    var text=document.getElementById("paste").value;
    // split on newlines OR commas/semicolons so "2 чаши брашно, 1 чаша захар" also works
    var lines=text.split(/[\n;]+|,(?=\s*\d|\s*[½⅓⅔¼¾⅛])/);
    var withQty=lines.map(parseLine).filter(function(r){return r&&r.hadQty;});
    var parsed=withQty.length ? withQty : lines.map(parseLine).filter(Boolean); // fallback: include all non-empty
    if(parsed.length){ rows=parsed.map(function(p){return {name:p.name,amt:p.amt,unit:p.unit};}); }
    temps=findTemps(text);
    buildEditor(); renderOutput(); selectTab("manual");
    window.scrollTo({top:document.getElementById("manual-panel").getBoundingClientRect().top+window.scrollY-20,behavior:"smooth"});
  });

  /* ---- URL fetch ---- */
  var CORS_PROXY = "https://api.allorigins.win/raw?url=";

  function extractIngredients(html){
    // 1. JSON-LD Recipe schema (most modern recipe sites)
    var jld = [], re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, m;
    while((m=re.exec(html))!==null){
      try{
        var data=JSON.parse(m[1]);
        var nodes=Array.isArray(data)?data:(data["@graph"]||[data]);
        nodes.forEach(function(node){
          if(node["@type"]==="Recipe"&&Array.isArray(node.recipeIngredient)){
            jld=jld.concat(node.recipeIngredient);
          }
        });
      }catch(e){}
    }
    if(jld.length) return jld;

    // 2. Microdata itemprop="recipeIngredient"
    var micro=[], re2=/itemprop=["']recipeIngredient["'][^>]*>([^<]+)/gi;
    while((m=re2.exec(html))!==null){
      var txt=m[1].replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
                  .replace(/&#\d+;/g,"").trim();
      if(txt) micro.push(txt);
    }
    if(micro.length) return micro;

    // 3. HTML selector heuristics (DOMParser available in all modern browsers)
    if(typeof DOMParser==="undefined") return [];
    var doc=(new DOMParser()).parseFromString(html,"text/html");
    var selectors=[
      '[class*="ingredient"] li','[id*="ingredient"] li',
      '[class*="Ingredient"] li','[id*="Ingredient"] li',
      '.recipe-ingredients li','.ingredients li',
      '.wprm-recipe-ingredient','.tasty-recipe-ingredient',
      '[itemprop="recipeIngredient"]'
    ];
    for(var i=0;i<selectors.length;i++){
      var found=doc.querySelectorAll(selectors[i]);
      if(found.length>=2){
        var arr=[];
        found.forEach(function(el){var t=el.textContent.trim();if(t) arr.push(t);});
        if(arr.length) return arr;
      }
    }
    return [];
  }

  function fetchRecipe(){
    var urlEl=document.getElementById("recipe-url");
    var statusEl=document.getElementById("fetch-status");
    var url=urlEl.value.trim();
    if(!url||!/^https?:\/\//i.test(url)){
      statusEl.textContent="Въведи валиден URL (напр. https://...)";
      statusEl.style.color="var(--paprika)";
      return;
    }
    statusEl.textContent="Зарежда се…";
    statusEl.style.color="";
    var btn=document.getElementById("fetch-btn");
    btn.disabled=true;

    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},15000);

    fetch(CORS_PROXY+encodeURIComponent(url),{signal:controller.signal})
      .then(function(res){
        clearTimeout(timer);
        if(!res.ok) throw new Error("HTTP "+res.status);
        return res.text();
      })
      .then(function(html){
        var lines=extractIngredients(html);
        if(!lines.length) throw new Error("Не са открити съставки на тази страница");
        var parsed=lines.map(parseLine).filter(function(r){return r&&r.hadQty;});
        // if nothing has a quantity (e.g. "сол на вкус"), still import all as raw entries
        if(!parsed.length) parsed=lines.map(parseLine).filter(Boolean);
        if(!parsed.length) throw new Error("Не са открити съставки с количества");
        rows=parsed.map(function(p){return{name:p.name,amt:p.amt,unit:p.unit};});
        temps=findTemps(html);
        buildEditor(); renderOutput(); selectTab("manual");
        statusEl.textContent="";
        statusEl.style.color="";
        btn.disabled=false;
        window.scrollTo({top:document.getElementById("manual-panel").getBoundingClientRect().top+window.scrollY-20,behavior:"smooth"});
      })
      .catch(function(err){
        clearTimeout(timer);
        var msg=err&&err.name==="AbortError"?"Изтече времето за изчакване (15 с)":
                (err&&err.message||"Неуспешно зареждане на страницата");
        statusEl.textContent="⚠ "+msg;
        statusEl.style.color="var(--paprika)";
        btn.disabled=false;
      });
  }

  document.getElementById("fetch-btn").addEventListener("click",fetchRecipe);
  document.getElementById("recipe-url").addEventListener("keydown",function(e){
    if(e.key==="Enter") fetchRecipe();
  });

  buildEditor(); renderOutput();
})();
