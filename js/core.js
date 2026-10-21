"use strict";
/* ================= HELPERS ================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icon=(n,cls="ic")=>`<svg class="${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
function toast(msg){const t=document.createElement("div");t.className="toast";t.innerHTML=icon("check","ic sm")+esc(msg);$("#toasts").appendChild(t);setTimeout(()=>{t.style.opacity="0";t.style.transition="opacity .3s";setTimeout(()=>t.remove(),320)},2600)}
async function copyText(txt,msg){try{await navigator.clipboard.writeText(txt)}catch(e){const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(_){}ta.remove()}toast(msg||"Copied to clipboard")}

/* ================= STATE ================= */
const LS_KEY="pplx_replica_v1";
let state={user:null,plan:"Free",recents:[],projects:[],artifacts:[],automations:[],connected:{},cookie:null,likes:{},hiddenStories:[],interests:[],railDismissed:false,projFilter:"All projects",artType:"All types",connCat:"All categories"};
try{const raw=localStorage.getItem(LS_KEY);if(raw)state={...state,...JSON.parse(raw)}}catch(e){}
function save(){try{localStorage.setItem(LS_KEY,JSON.stringify(state))}catch(e){}}
const signedIn=()=>!!state.user;

/* ================= DATA ================= */
const MODELS=[
 {key:"mistral",name:"Mistral Large",logo:"logos/mistral-ai-icon.svg",sub:"mistralai/mistral-large-4-0 · Real AI"},
 {key:"mnai",name:"MNAI 8 Pro",logo:"logos/mnai-ai-icon.svg",sub:"Flagship · Real AI"}];
const OUTLETS=[["reuters","#e0651f","R"],["apnews","#1a1a1a","A"],["bbc.com","#a31621","B"],["cnn","#c00","C"],["theverge","#5200ff","V"],["techcrunch","#0a7d33","T"],["bloomberg","#2800d7","B"],["nature","#0b5d4e","N"],["wikipedia","#333","W"],["nytimes","#111","N"]];
const STORIES=[
 {id:"s1",cat:"Top",title:"Kremlin says Putin open to new three-way Ukraine talks",summary:"Moscow signalled openness to a fresh round of three-way negotiations, even as both sides publicly hold firm on the territorial questions that have stalled every previous round.",sources:21,time:"2 hours ago",seed:"kyiv-talk",outlets:[0,1,3],sec:["Envoys bring new ideas to the table","The two sides remain far apart"]},
 {id:"s2",cat:"Business",title:"Anthropic draft S-1 shows $16.3B revenue, heavy losses",summary:"A draft filing reviewed by investors sketches a business growing at extraordinary speed while spending just as fast on compute, offering the clearest look yet at the economics of frontier AI labs.",sources:26,time:"4 hours ago",seed:"s1-filing",outlets:[6,0,5],sec:["What the filing reveals","Why investors are watching the burn rate"]},
 {id:"s3",cat:"Tech & Science",title:"FAA certifies Boeing 737 Max 10 after years of delays",summary:"The long-delayed certification closes one of the most watched regulatory sagas in aviation and clears the jet for delivery to waiting airlines.",sources:10,time:"5 hours ago",seed:"max10",outlets:[1,2,0],sec:["A certification years in the making","What it means for airlines"]},
 {id:"s4",cat:"Top",title:"Macron vows rioters will pay after worst unrest in years",summary:"France's president promised prosecutions and repairs funding after a third night of unrest, as mayors across the country called for calm and reinforcements.",sources:40,time:"6 hours ago",seed:"france-unrest",outlets:[2,1,0],sec:["A third night of unrest","The political fallout"]},
 {id:"s5",cat:"Tech & Science",title:"A new battery chemistry hits 500 Wh/kg in independent testing",summary:"Independent lab tests confirm the cell chemistry holds its charge density outside the inventor's own facility — a first step toward longer-range EVs and electric flight.",sources:14,time:"7 hours ago",seed:"battery500",outlets:[7,4,5],sec:["How the chemistry works","The road to production"]},
 {id:"s6",cat:"Sports",title:"Champions League: late winner seals a quarter-final classic",summary:"A stoppage-time strike settled a five-goal thriller and sent the home crowd into delirium, setting up a semi-final nobody predicted at the draw.",sources:18,time:"8 hours ago",seed:"ucl-classic",outlets:[2,3,1],sec:["Five goals, one classic","What comes next"]},
 {id:"s7",cat:"Business",title:"Oil steadies as traders weigh supply talks and soft demand data",summary:"Benchmark crude held in a narrow band while markets balanced production diplomacy against another week of softer-than-expected consumption figures.",sources:12,time:"9 hours ago",seed:"oil-steady",outlets:[0,6,1],sec:["Supply talks in focus","Demand signals soften"]},
 {id:"s8",cat:"Arts & Culture",title:"The tiny film festival that keeps launching Oscar winners",summary:"For the fifth year running, a short that premiered at the 400-seat festival went on to awards-season glory. Programmers say the secret is ruthless curation.",sources:9,time:"11 hours ago",seed:"tiny-festival",outlets:[2,9,3],sec:["Ruthless curation","From 400 seats to the Oscars"]},
 {id:"s9",cat:"Entertainment",title:"Streaming's next price war is being fought over live sports",summary:"Platforms that once swore off live rights are now bidding aggressively, betting that appointment viewing is the only reliable churn-killer left.",sources:16,time:"12 hours ago",seed:"sports-stream",outlets:[4,6,9],sec:["The rights land-grab","What subscribers will pay"]},
 {id:"s10",cat:"Tech & Science",title:"Astronomers map a record-breaking fast radio burst to its home galaxy",summary:"The burst, the brightest ever recorded, has been traced to a galaxy 8 billion light-years away — and its signal carries clues about the matter between galaxies.",sources:22,time:"14 hours ago",seed:"frb-map",outlets:[7,2,4],sec:["Brightest burst on record","Reading the space between galaxies"]},
 {id:"s11",cat:"Sports",title:"Teenage sprint sensation breaks the national 100m record again",summary:"The 17-year-old lowered her own national record for the third time this season, and coaches are already talking about the world stage.",sources:11,time:"16 hours ago",seed:"sprint-teen",outlets:[1,2,3],sec:["Third record this season","The world-stage question"]},
 {id:"s12",cat:"Business",title:"Central banks signal patience as inflation cools unevenly",summary:"Policymakers on three continents used near-identical language this week: progress on prices is real, but the last stretch is the hardest.",sources:19,time:"18 hours ago",seed:"central-banks",outlets:[6,0,9],sec:["Progress, unevenly spread","The last stretch problem"]}];
const TOPIC_STORIES={
 Finance:{title:"Finance",stories:["s2","s7","s12"]},
 Academic:{title:"Academic",stories:["s5","s10","s3"]},
 Health:{title:"Health",stories:["s5","s10","s8"]},
 Patents:{title:"Patents",stories:["s5","s3","s2"]}};
const COMPANIES=[["Tesla, Inc.","TSLA · NASDAQ","$386.71","+3.48%",1],["Meta Platforms, Inc.","META · NASDAQ","$712.33","+2.60%",1],["Netflix","NFLX · NASDAQ","$65.01","-5.36%",0],["Capital One","COF · NYSE","$209.47","+3.92%",1],["Super Micro","SMCI · NASDAQ","$35.41","+9.06%",1]];
const MARKETS=[["S&P 500 ETF","+0.53%","$773.13","+$4.08",1,"2,6 6,4 10,5 14,3 18,4 22,2"],["NASDAQ","+1.13%","26,723.82","+$299.00",1,"2,7 6,5 10,6 14,3 18,4 22,1"],["VIX","+3.87%","16.64","-$0.67",0,"2,3 6,5 10,4 14,6 18,5 22,7"],["Bitcoin","+2.81%","$84,785.75","+$2,314.55",1,"2,6 6,7 10,4 14,5 18,2 22,3"]];
const CONNECTORS=[
 {name:"Gmail",cat:"Productivity",color:"#ea4335",letter:"G",desc:"Search and act on your email without leaving Perplexity."},
 {name:"Google Drive",cat:"Storage",color:"#f9ab00",letter:"D",desc:"Bring documents and files into your searches and projects."},
 {name:"Google Calendar",cat:"Productivity",color:"#4285f4",letter:"C",desc:"Let Computer plan around your schedule and prep for meetings."},
 {name:"GitHub",cat:"Developer tools",color:"#24292e",letter:"G",desc:"Search repos, issues and pull requests from your projects."},
 {name:"Slack",cat:"Communication",color:"#611f69",letter:"S",desc:"Summarize channels and draft replies with full context."},
 {name:"Notion",cat:"Productivity",color:"#111111",letter:"N",desc:"Search your workspace pages and databases in one place."},
 {name:"Linear",cat:"Developer tools",color:"#5e6ad2",letter:"L",desc:"Track issues and roadmaps alongside your research."},
 {name:"Outlook",cat:"Communication",color:"#0072c6",letter:"O",desc:"Connect your Microsoft mailbox and calendar."},
 {name:"Dropbox",cat:"Storage",color:"#0061ff",letter:"D",desc:"Add files from cloud storage to any conversation."}];
const SKILLS=[
 {name:"Deep Research Reports",cat:"Research",color:"#20808d",letter:"R",desc:"Multi-step cited research, packaged as a polished report."},
 {name:"Spreadsheet Builder",cat:"Productivity",color:"#0a7d33",letter:"S",desc:"Turn messy data into clean, formatted spreadsheets."},
 {name:"Slide Deck Maker",cat:"Productivity",color:"#e0651f",letter:"P",desc:"Generate presentation decks from a single prompt."},
 {name:"Web App Prototyper",cat:"Developer tools",color:"#5200ff",letter:"W",desc:"Build working app prototypes you can open and share."}];
const TEMPLATES=[
 {name:"Morning stock brief",desc:"A pre-market summary of overnight moves, earnings and the day's calendar — delivered at 7 AM."},
 {name:"Weekly competitor digest",desc:"Track product launches, pricing changes and press coverage from your rivals, every Monday."},
 {name:"Inbox summarizer",desc:"A nightly digest of the emails that actually need your attention, with drafts ready to send."},
 {name:"Price watch",desc:"Get alerted when tracked products or flights drop below your target price."}];

/* ================= MENU SYSTEM ================= */
const menuRoot=$("#menuRoot");
let menuAnchor=null;
function closeMenu(){menuRoot.innerHTML="";menuAnchor=null}
function openMenu(anchor,build,opts={}){
  if(menuAnchor===anchor&&menuRoot.firstChild){closeMenu();return}
  closeMenu();menuAnchor=anchor;
  const el=document.createElement("div");el.id="menu";if(opts.width)el.style.minWidth=opts.width+"px";
  menuRoot.appendChild(el);build(el);
  const r=anchor.getBoundingClientRect(),mw=el.offsetWidth,mh=el.offsetHeight;
  let left=opts.align==="right"?r.right-mw:r.left;
  left=Math.max(8,Math.min(left,innerWidth-mw-8));
  let top=r.bottom+8;if(top+mh>innerHeight-8)top=Math.max(8,r.top-mh-8);
  el.style.left=left+"px";el.style.top=top+"px";el.style.position="fixed";
}
document.addEventListener("pointerdown",e=>{if(menuRoot.firstChild&&e.target instanceof Element&&!e.target.closest("#menu")&&e.target!==menuAnchor&&!menuAnchor?.contains(e.target))closeMenu()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeMenu();closeModal()}});
$("#main").addEventListener("scroll",()=>closeMenu(),{passive:true});
const lockTail=()=>`<span class="tail">${icon("lock","ic sm")}</span>`;
const checkTail=()=>`<span class="tail"><svg class="menu-check"><use href="#i-check"/></svg></span>`;

/* ================= MODAL SYSTEM ================= */
const modalRoot=$("#modalRoot");
function closeModal(){modalRoot.innerHTML=""}
function openModal(html,dialogCls=""){
  closeModal();closeMenu();
  const ov=document.createElement("div");ov.className="overlay";
  ov.innerHTML=`<div class="dialog ${dialogCls}" role="dialog" aria-modal="true">${html}</div>`;
  ov.addEventListener("pointerdown",e=>{if(e.target===ov)closeModal()});
  modalRoot.appendChild(ov);
  $$("[data-close]",ov).forEach(b=>b.addEventListener("click",closeModal));
  const f=$("input,textarea,select",ov);if(f)setTimeout(()=>f.focus(),60);
  return ov;
}
const xBtn=`<button class="x" data-close aria-label="Close">${icon("x","ic sm")}</button>`;

/* ================= AUTH (real Firebase — project meowsamopdzn-ais) ================= */
const FB_CONFIG={apiKey:"AIzaSyA2JibgDeBwz-9rUVMFX1kW7lk0kJVIstE",authDomain:"meowsamopdzn-ais.firebaseapp.com",projectId:"meowsamopdzn-ais",storageBucket:"meowsamopdzn-ais.firebasestorage.app",messagingSenderId:"595814101069",appId:"1:595814101069:web:2d356073f8828261172c04",measurementId:"G-BR9PSL1JQ1"};
let fbAuth=null;
try{
  if(typeof firebase!=="undefined"&&firebase.initializeApp){
    firebase.initializeApp(FB_CONFIG);
    fbAuth=firebase.auth();
    fbAuth.onAuthStateChanged(u=>{
      if(u){const was=state.user&&state.user.email===u.email;state.user={name:u.displayName||(u.email||"User").split("@")[0],email:u.email||"",fb:true};save();updateAuthUI();if(!was)toast("Signed in as "+state.user.name)}
      else if(state.user&&state.user.fb){state.user=null;save();updateAuthUI()}
    });
  }
}catch(e){fbAuth=null}
function fbReady(){return !!fbAuth}
function fbSignOut(){if(fbReady()&&state.user&&state.user.fb)return fbAuth.signOut();state.user=null;save();updateAuthUI();return Promise.resolve()}

function updateAuthUI(){
  const u=state.user;
  $("#signInBtn").hidden=!!u;$("#userBtn").hidden=!u;
  $("#computerSignIn").hidden=!!u;
  const sg=$("#suggestGrid");if(sg)sg.hidden=!!u;
  const ms=$("#mSignInBtn"),mu=$("#mUserBtn");
  if(ms)ms.hidden=!!u;
  if(mu){mu.hidden=!u;if(u)$(".avatar",mu).textContent=(u.name||"S").slice(0,1).toUpperCase()}
  if(u){$("#userAvatar").textContent=(u.name||"S").slice(0,1).toUpperCase();$("#userName").textContent=u.name;$("#userPlan").textContent=state.plan+" plan"}
}
function doSignIn(name,email){
  state.user={name:name||"Sam",email:email||"sam@gmail.com",demo:true};save();updateAuthUI();closeModal();
  toast("Signed in as "+state.user.name);
}
function requireAuth(variant){if(signedIn())return true;loginModal(variant);return false}
function loginModal(variant="default"){
  const V={default:{t:"Login or sign up for free",s:"Save and sync your searches",close:false},
    voice:{t:"Sign in to use voice mode",s:"Ask anything out loud and get instant, cited answers.",close:true},
    artifacts:{t:"Sign in to create Artifacts",s:"Turn any prompt into an artifact you can save, edit, and share.",close:true},
    computer:{t:"Login or sign up for free",s:"Hand off work to Computer and pick it up on any device.",close:true}}[variant]||{};
  const ov=openModal(`${xBtn}<h2>${esc(V.t)}</h2><p class="sub">${esc(V.s)}</p>
  <div class="login-stack">
    <button class="btn black block" id="lgGoogle"><span style="font-weight:700;background:#fff;color:#111;border-radius:50%;width:19px;height:19px;display:inline-flex;align-items:center;justify-content:center;font-size:12px">G</span> Continue with Google</button>
    <button class="btn light block" id="lgApple"><span style="font-size:16px"></span> Continue with Apple</button>
    <div class="login-or">or</div>
    <input class="field" id="lgEmail" type="email" placeholder="Enter your email" autocomplete="email">
    <input class="field" id="lgPass" type="password" placeholder="Password" autocomplete="current-password">
    <button class="btn teal block" id="lgContinue" disabled>Continue with email</button>
    <p class="sub" style="margin:2px 0 0;font-size:12px">New here? Continuing creates your account.</p>
  </div>
  <a href="#" class="sso-link" id="lgSso">Single sign-on (SSO)</a>
  ${V.close?`<button class="login-close-txt" data-close>Close</button>`:""}`,"login-dialog");
  const email=$("#lgEmail",ov),pass=$("#lgPass",ov),cont=$("#lgContinue",ov);
  const validate=()=>{cont.disabled=!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())||pass.value.length<1};
  email.addEventListener("input",validate);pass.addEventListener("input",validate);
  pass.addEventListener("keydown",e=>{if(e.key==="Enter"&&!cont.disabled)cont.click()});
  cont.addEventListener("click",async()=>{
    const em=email.value.trim(),pw=pass.value;
    if(!fbReady())return doSignIn(em.split("@")[0].replace(/^\w/,c=>c.toUpperCase()),em);
    cont.disabled=true;cont.textContent="Continuing…";
    try{await fbAuth.signInWithEmailAndPassword(em,pw);closeModal()}
    catch(err){
      if(err.code==="auth/user-not-found"||err.code==="auth/invalid-credential"||err.code==="auth/invalid-login-credentials"){
        try{await fbAuth.createUserWithEmailAndPassword(em,pw);closeModal();return}
        catch(e2){err=e2}
      }
      if(err.code==="auth/operation-not-allowed"||err.code==="auth/configuration-not-found"){
        doSignIn(em.split("@")[0].replace(/^\w/,c=>c.toUpperCase()),em);
        toast("Demo sign-in — enable Email/Password in Firebase for real accounts");
        return;
      }
      cont.disabled=false;cont.textContent="Continue with email";
      toast(err.code==="auth/wrong-password"?"Wrong password — try again":(err.code==="auth/weak-password"?"Password needs at least 6 characters":"Sign-in failed: "+(err.message||err.code)));
    }
  });
  $("#lgGoogle",ov).addEventListener("click",async()=>{
    if(!fbReady())return doSignIn("Sam","sam@gmail.com");
    try{await fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());closeModal()}
    catch(err){toast(err.code==="auth/unauthorized-domain"?"This domain isn't authorized in Firebase yet":(err.code==="auth/operation-not-allowed"?"Google sign-in isn't enabled in Firebase yet":"Google sign-in failed — try email instead"))}
  });
  $("#lgApple",ov).addEventListener("click",()=>toast("Apple sign-in isn't enabled on this project — use Google or email"));
  $("#lgSso",ov).addEventListener("click",e=>{e.preventDefault();email.placeholder="Enter your work email for SSO";email.focus();toast("Enter your work email to continue with SSO")});
}

/* ================= PLANS ================= */
function plansModal(){
  const card=(name,cls,badge,credits,price,desc,items,btn,plan)=>`
   <div class="plan-card ${cls}">${badge?`<span class="badge" style="position:absolute;top:-11px;left:20px;background:var(--teal);color:#fff">${badge}</span>`:""}
    <div class="pname">${name}</div>
    ${credits?`<div class="credits">${credits}</div><div class="limited">LIMITED TIME</div>`:""}
    <div class="price">${price}</div><div class="pdesc">${desc}</div>
    <ul>${items.map(i=>`<li>${icon("check","ic sm")}<span>${i}</span></li>`).join("")}</ul>
    <button class="btn ${plan==="Free"?"light":"black"} block" data-plan="${plan}">${btn}</button></div>`;
  const ov=openModal(`${xBtn}<h2>Select your plan</h2><p class="sub">Upgrade for a broader search experience and premium AI models.</p>
  <div class="plan-radios" role="radiogroup">
    ${["Personal","Education","Business"].map((r,i)=>`<label class="plan-radio ${i===0?"sel":""}"><input type="radio" name="ptype" value="${r}" ${i===0?"checked":""}> ${r}</label>`).join("")}
  </div>
  <div class="plans-grid">
   ${card("Free","","","",'$0',"Answers with accurate AI and citations",["Good for limited daily usage","Better for simple questions","Citations in every answer","Access to basic AI models"],"Continue with free","Free")}
   ${card("perplexity pro","popular","Popular","+$40 free Computer credits",'$17 <span style="color:var(--ink-2);font-weight:500">/month or equivalent, when billed annually</span>',"Advanced answers and top AI models",["<b>Everything in Free and:</b>","Expanded Computer access","4,000 bonus credits","Deep research","Access to top AI models","Select between AI models","Create polished documents & apps","More usage limits and memory"],"Get Pro","Pro")}
   ${card("perplexity max","","","+$450 free Computer credits",'$167 <span style="color:var(--ink-2);font-weight:500">/month or equivalent, when billed annually</span>',"Unlimited usage and top performance",["<b>Everything in Pro and:</b>","Maximum Computer usage","35,000 bonus credits","10,000 monthly credits","Expert level research","Frontier AI models","Highest usage limits and memory","Priority access to new features"],"Get Max","Max")}
  </div>
  <p class="plans-foot">For personal use only and subject to our <a href="#" data-billing>policies</a>. Learn more about <a href="#" data-billing>billing</a>.</p>`,"plans-dialog");
  $$(".plan-radio",ov).forEach(l=>l.addEventListener("click",()=>{$$(".plan-radio",ov).forEach(x=>x.classList.remove("sel"));l.classList.add("sel")}));
  $$("[data-billing]",ov).forEach(a=>a.addEventListener("click",e=>{e.preventDefault();toast("This is a replica — billing pages aren't included")}));
  $$("[data-plan]",ov).forEach(b=>b.addEventListener("click",()=>{
    const p=b.dataset.plan;
    if(p==="Free"){state.plan="Free";save();updateAuthUI();closeModal();toast("You're on the Free plan");return}
    if(!signedIn()){loginModal();return}
    state.plan=p;save();updateAuthUI();closeModal();toast(p+" activated — demo replica, no payment taken");
  }));
}

/* ================= COMPOSER ================= */
const PLACEHOLDERS=["Ask anything…","Type / for search modes","Type @ for connectors"];
let phIdx=0;
const composers=[];
function composerHTML(ctx){
  return `<div class="composer" data-ctx="${ctx}">
    <div class="attach-row"></div>
    <textarea rows="1" placeholder="${PLACEHOLDERS[0]}" aria-label="Ask anything"></textarea>
    <div class="composer-row">
      <button class="cbtn icon-only" data-act="add" data-tip="Add files or tools" aria-label="Add files or tools">${icon("plus")}</button>
      <div class="seg" role="group" aria-label="Search mode">
        <button class="seg-btn" data-act="mode">${icon("search","ic sm")}<span data-mode-label>Search</span>${icon("chevd","ic sm chev")}</button>
        <button class="seg-btn" data-act="computer" aria-pressed="false">${icon("monitor","ic sm")}<span>Computer</span><span class="seg-chev" hidden>${icon("chevd","ic sm chev")}</span></button>
      </div>
      <span class="sp"></span>
      ${ctx==="computer"?`<button class="cbtn" data-act="standard"><span class="cbtn-label">Standard</span>${icon("chevd","ic sm chev")}</button>`:""}
      <button class="cbtn effort-btn" data-act="effort" hidden>${icon("tune","ic sm")}<span data-effort-label>Light</span>${icon("chevd","ic sm chev")}</button>
      <button class="cbtn" data-act="model"><img class="model-logo" data-model-logo src="logos/mistral-ai-icon.svg" alt=""><span class="cbtn-label" data-model-label>Mistral Large</span>${icon("chevd","ic sm chev")}</button>
      <button class="cbtn icon-only" data-act="mic" data-tip="Dictation" aria-label="Dictation">${icon("mic")}</button>
      <button class="voice-btn" data-act="voice" data-tip="Use voice mode" aria-label="Use voice mode">${icon("wave","ic sm")}</button>
      <button class="submit-btn" data-act="submit" aria-label="Submit" hidden>${icon("up","ic sm")}</button>
    </div></div>
  <div class="composer-foot" hidden>
    <button data-foot="project">${icon("folder","ic sm")} Work in a project</button>
    <span class="sp"></span>
    <button data-foot="connect">${icon("hex","ic sm")} Connect an app</button>
    <span class="sp"></span>
    <button data-foot="desktop">${icon("monitor","ic sm")} Use desktop app</button>
  </div>`;
}
function setComputerMode(c,on){
  c.computer=on;
  const segBtn=$('[data-act="computer"]',c.root);
  segBtn.classList.toggle("on",on);segBtn.setAttribute("aria-pressed",String(on));
  const ch=$(".seg-chev",segBtn);if(ch)ch.hidden=!on;
  c.root.classList.toggle("computer-mode",on);
  if(c.foot)c.foot.hidden=!on;
  const eff=$('[data-act="effort"]',c.root);if(eff)eff.hidden=!on;
  c.ta.placeholder=on?"Do anything…":PLACEHOLDERS[phIdx];
}
function effortMenu(c,anchor){
  openMenu(anchor,el=>{
    el.innerHTML=["Light","Standard","Thorough"].map(e=>`<button class="menu-item" data-e="${e}"><span class="grow">${e}${e==="Light"?'<br><span class="sub">Fast, everyday work</span>':e==="Standard"?'<br><span class="sub">Deeper research and drafting</span>':'<br><span class="sub">Maximum depth, slowest</span>'}</span>${c.effort===e?checkTail():(e==="Light"?"":lockTail())}</button>`).join("");
    $$("[data-e]",el).forEach(b=>b.addEventListener("click",()=>{
      if(b.dataset.e!=="Light"&&!(signedIn()&&state.plan!=="Free")){closeMenu();return signedIn()?plansModal():loginModal()}
      c.effort=b.dataset.e;$("[data-effort-label]",c.root).textContent=c.effort;closeMenu();
    }));
  },{width:250,align:"right"});
}
function buildComposers(){
  $$("[data-composer]").forEach(host=>{
    const ctx=host.dataset.composer;
    host.innerHTML=composerHTML(ctx);
    const root=$(".composer",host),ta=$("textarea",root);
    const c={ctx,root,ta,foot:$(".composer-foot",host),mode:"Search",model:"Mistral Large",computer:false,standard:"Standard",effort:"Light",attachments:[]};
    composers.push(c);
    if(ctx==="computer")setComputerMode(c,true);
    ta.addEventListener("input",()=>syncComposer(c,true));
    ta.addEventListener("keydown",e=>{
      if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitComposer(c)}
    });
    ta.addEventListener("paste",e=>{
      const cd=e.clipboardData;if(!cd)return;
      const files=[...(cd.files||[])];
      if(files.length){e.preventDefault();intakeFiles(c,files);return}
      const text=cd.getData("text")||"";
      const words=text.trim()?text.trim().split(/\s+/).length:0;
      if(words>500){e.preventDefault();c.attachments.push({kind:"text",name:"pasted-text.txt",text});renderAttach(c);toast("That paste was "+words+" words — added as pasted-text.txt")}
    });
    root.addEventListener("dragover",e=>{e.preventDefault();root.classList.add("drag-over")});
    root.addEventListener("dragleave",e=>{if(!root.contains(e.relatedTarget))root.classList.remove("drag-over")});
    root.addEventListener("drop",e=>{e.preventDefault();root.classList.remove("drag-over");if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length)intakeFiles(c,e.dataTransfer.files)});
    if(c.foot)c.foot.addEventListener("click",e=>{
      const b=e.target.closest("[data-foot]");if(!b)return;
      if(b.dataset.foot==="project"){if(!state.projects.length)return toast("No projects yet — create one from the sidebar");toast("Working in project “"+state.projects[0].name+"”")}
      else if(b.dataset.foot==="connect")showView("customize");
      else if(b.dataset.foot==="desktop")openModal(`${xBtn}<h2>Computer on desktop</h2><p class="sub">This replica runs Computer fully in your browser — sessions, files and deliverables work the same here, no desktop app needed.</p><button class="btn black block" data-close>Got it</button>`,"form-dialog");
    });
    root.addEventListener("click",e=>{
      const btn=e.target.closest("[data-act]");if(!btn)return;
      const act=btn.dataset.act;
      if(act==="add")addMenu(c,btn);
      else if(act==="mode")modeMenu(c,btn);
      else if(act==="model")modelMenu(c,btn);
      else if(act==="standard")standardMenu(c,btn);
      else if(act==="effort")effortMenu(c,btn);
      else if(act==="computer")setComputerMode(c,!c.computer);
      else if(act==="mic")dictate(c,btn);
      else if(act==="voice")voiceMode();
      else if(act==="submit")submitComposer(c);
    });
  });
  if(!window.__pplxDnD){window.__pplxDnD=1;window.addEventListener("dragover",e=>e.preventDefault());window.addEventListener("drop",e=>e.preventDefault())}
  setInterval(()=>{phIdx=(phIdx+1)%PLACEHOLDERS.length;composers.forEach(c=>{if(!c.ta.value&&!c.computer)c.ta.placeholder=PLACEHOLDERS[phIdx]})},3000);
}
function syncComposer(c,fromInput){
  const ta=c.ta;ta.style.height="auto";ta.style.height=Math.min(ta.scrollHeight,150)+"px";
  const has=ta.value.trim().length>0||c.attachments.length>0;
  $('[data-act="voice"]',c.root).hidden=has;
  $('[data-act="submit"]',c.root).hidden=!has;
  if(fromInput){
    const v=ta.value;
    if(v.endsWith("/")&&(v.length===1||v[v.length-2]===" "||v[v.length-2]==="\n"))modeMenu(c,$('[data-act="mode"]',c.root));
    if(v.endsWith("@")&&(v.length===1||v[v.length-2]===" "||v[v.length-2]==="\n"))connectorsPanel(c,$('[data-act="add"]',c.root));
  }
}
function submitComposer(c){
  const q=c.ta.value.trim();const atts=c.attachments.slice();
  if(!q&&!atts.length)return;
  c.ta.value="";c.attachments=[];renderAttach(c);syncComposer(c);
  if(c.ctx==="computer")return doComputerSession(q||"Work on the attached files",c.standard);
  if(c.ctx==="automation")return openAutomationModal({prompt:q});
  doSearch(q,atts);
}
function renderAttach(c){
  const row=$(".attach-row",c.root);
  row.innerHTML=c.attachments.map((a,i)=>a.kind==="image"
    ?`<span class="attach-chip img"><img class="att-thumb" src="${a.dataUrl}" alt=""> ${esc(a.name)} <button data-att="${i}" aria-label="Remove attachment">${icon("x","ic sm")}</button></span>`
    :`<span class="attach-chip">${icon("file","ic sm")} ${esc(a.name)} <button data-att="${i}" aria-label="Remove attachment">${icon("x","ic sm")}</button></span>`).join("");
  $$("[data-att]",row).forEach(b=>b.addEventListener("click",()=>{c.attachments.splice(+b.dataset.att,1);renderAttach(c)}));
  syncComposer(c);
}
/* ---- attachment intake: picker, drag & drop, paste ---- */
function readImageFile(f,cb){
  let settled=false;const done=att=>{if(!settled){settled=true;cb(att)}};
  const fallback=()=>{
    if(!f.arrayBuffer)return toast("Couldn't read that image");
    f.arrayBuffer().then(buf=>{
      let bin="";const bytes=new Uint8Array(buf);
      for(let i=0;i<bytes.length;i+=32768)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+32768));
      done({kind:"image",name:f.name,dataUrl:"data:"+(f.type||"image/png")+";base64,"+btoa(bin)});
    }).catch(()=>toast("Couldn't read that image"));
  };
  try{
    const rd=new FileReader();
    rd.onload=()=>{
      const dataUrl=rd.result;
      const timer=setTimeout(()=>done({kind:"image",name:f.name,dataUrl}),1600);
      const img=new Image();
      img.onload=()=>{clearTimeout(timer);
        const max=1280,sc=Math.min(1,max/Math.max(img.width||1,img.height||1));
        if(sc>=1||!img.width)return done({kind:"image",name:f.name,dataUrl});
        try{
          const cv=document.createElement("canvas");cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);
          cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
          done({kind:"image",name:f.name,dataUrl:cv.toDataURL("image/jpeg",0.85)});
        }catch(e){done({kind:"image",name:f.name,dataUrl})}
      };
      img.onerror=()=>{clearTimeout(timer);done({kind:"image",name:f.name,dataUrl})};
      img.src=dataUrl;
    };
    rd.onerror=()=>fallback();
    rd.readAsDataURL(f);
  }catch(e){fallback()}
}
function intakeFiles(c,files){
  [...files].forEach(f=>{
    if(f.size>10*1024*1024)return toast("“"+f.name+"” is over 10 MB — skipped");
    if(f.type&&f.type.startsWith("image/")){readImageFile(f,att=>{c.attachments.push(att);renderAttach(c)});return}
    if((f.type&&f.type.startsWith("text/"))||/\.(txt|md|json|csv|log|js|ts|py|html|css|xml)$/i.test(f.name)){
      if(f.text)f.text().then(t=>{c.attachments.push({kind:"text",name:f.name,text:t.slice(0,30000)});renderAttach(c)}).catch(()=>{c.attachments.push({kind:"file",name:f.name});renderAttach(c)});
      else{c.attachments.push({kind:"file",name:f.name});renderAttach(c)}
      return;
    }
    c.attachments.push({kind:"file",name:f.name});renderAttach(c);
  });
}
/* ---- composer menus ---- */
function addMenu(c,anchor){
  openMenu(anchor,el=>{
    el.innerHTML=`
     <button class="menu-item" data-m="upload">${icon("file")}<span class="grow">Upload files or images</span>${signedIn()?"":lockTail()}</button>
     <button class="menu-item" data-m="connectors">${icon("hex")}<span class="grow">Connectors</span><span class="tail">${icon("chevr","ic sm")}</span></button>
     <button class="menu-item" data-m="projects">${icon("cube")}<span class="grow">Projects</span><span class="tail">${icon("chevr","ic sm")}</span></button>`;
    $("[data-m='upload']",el).addEventListener("click",()=>{
      if(!signedIn()){closeMenu();return loginModal()}
      closeMenu();pendingComposer=c;$("#filePicker").click();
    });
    $("[data-m='connectors']",el).addEventListener("click",()=>connectorsPanel(c,anchor,el));
    $("[data-m='projects']",el).addEventListener("click",()=>projectsPanel(c,anchor,el));
  },{width:264});
}
function connectorsPanel(c,anchor,existingEl){
  const render=el=>{
    el.innerHTML=`
     <button class="menu-head link" data-m="upgrade">Upgrade to connect more sources <span style="margin-left:auto">${icon("chevr","ic sm")}</span></button>
     <div class="menu-sep"></div>
     <label class="menu-item" style="cursor:pointer"><span class="grow">Web</span><input type="checkbox" class="menu-cb" id="cbWeb" checked></label>
     <label class="menu-item" style="cursor:pointer"><span class="grow">Academic</span><input type="checkbox" class="menu-cb" id="cbAcad"></label>
     <button class="menu-item" data-m="cloud">${icon("cloud")}<span class="grow">Add files from cloud</span>${signedIn()?"":lockTail()}</button>`;
    $("[data-m='upgrade']",el).addEventListener("click",()=>{closeMenu();signedIn()?plansModal():loginModal()});
    $("#cbWeb",el).addEventListener("change",e=>toast("Web source "+(e.target.checked?"on":"off")));
    $("#cbAcad",el).addEventListener("change",e=>toast("Academic source "+(e.target.checked?"on":"off")));
    $("[data-m='cloud']",el).addEventListener("click",()=>{if(!signedIn()){closeMenu();loginModal()}else toast("No cloud drives connected yet — add one in Customize")});
  };
  if(existingEl)render(existingEl);else openMenu(anchor,render,{width:264});
}
function projectsPanel(c,anchor,existingEl){
  const render=el=>{
    el.innerHTML=`
     <button class="menu-item" data-m="newproj" ${signedIn()?"":'style="opacity:.5"'}>${icon("plus")}<span class="grow">Create new project</span>${signedIn()?"":lockTail()}</button>
     <div class="menu-sep"></div>
     ${state.projects.length?state.projects.map(p=>`<button class="menu-item" data-proj="${esc(p.name)}">${icon("cube")}<span class="grow">${esc(p.name)}</span></button>`).join(""):`<div class="menu-head">No projects found</div>`}`;
    $("[data-m='newproj']",el).addEventListener("click",()=>{closeMenu();signedIn()?openProjectModal():loginModal()});
    $$("[data-proj]",el).forEach(b=>b.addEventListener("click",()=>{closeMenu();toast("Project “"+b.dataset.proj+"” attached to this thread");c.ta.focus()}));
  };
  if(existingEl)render(existingEl);else openMenu(anchor,render,{width:264});
}
function modeMenu(c,anchor){
  const modes=[{n:"Search"},{n:"Deep research",lock:true},{n:"Model council",lock:true,badge:"Max"},{n:"Learn step by step",lock:true}];
  openMenu(anchor,el=>{
    el.innerHTML=modes.map(m=>`<button class="menu-item" data-mode="${m.n}"><span class="grow">${m.n}${m.badge?` <span class="badge max">${m.badge}</span>`:""}</span>${c.mode===m.n?checkTail():(m.lock?lockTail():"")}</button>`).join("");
    $$("[data-mode]",el).forEach(b=>b.addEventListener("click",()=>{
      const m=modes.find(x=>x.n===b.dataset.mode);
      if(m.lock){closeMenu();return signedIn()?plansModal():loginModal()}
      c.mode=m.n;$("[data-mode-label]",c.root).textContent=m.n;$("#modeLabel").textContent=m.n;closeMenu();c.ta.focus();
    }));
  },{width:250});
}
function modelMenu(c,anchor){
  openMenu(anchor,el=>{
    el.innerHTML=`<div class="menu-head">Model</div>`+
     MODELS.map(m=>`<button class="menu-item" data-model="${m.key}"><img class="model-logo" src="${m.logo}" alt=""><span class="grow">${m.name}<br><span class="sub">${m.sub}</span></span>${typeof activeModel!=="undefined"&&activeModel===m.key?checkTail():""}</button>`).join("")+
     `<div class="menu-sep"></div><div class="menu-head" style="font-weight:400">Answers are generated live by the selected model.</div>`;
    $$("[data-model]",el).forEach(b=>b.addEventListener("click",()=>{setActiveModel(b.dataset.model);closeMenu();toast("Model set to "+(MODELS.find(m=>m.key===b.dataset.model)||{}).name);c.ta.focus()}));
  },{width:290,align:"right"});
}
function standardMenu(c,anchor){
  openMenu(anchor,el=>{
    el.innerHTML=`
     <button class="menu-item" data-std="Standard"><span class="grow">Standard</span>${c.standard==="Standard"?checkTail():""}</button>
     <button class="menu-item" data-std="Advanced"><span class="grow">Advanced</span>${lockTail()}</button>`;
    $$("[data-std]",el).forEach(b=>b.addEventListener("click",()=>{
      if(b.dataset.std==="Advanced"){closeMenu();return signedIn()?plansModal():loginModal()}
      c.standard="Standard";closeMenu();
    }));
  },{width:220});
}
let pendingComposer=null;
$("#filePicker").addEventListener("change",e=>{
  if(pendingComposer){const files=[...e.target.files];files.forEach(f=>{state.artifacts.unshift({name:f.name,type:"Documents",kind:"uploaded",when:"Just now"})});save();if(typeof renderArtifacts==="function")renderArtifacts();intakeFiles(pendingComposer,files);pendingComposer.ta.focus();pendingComposer=null}
  e.target.value="";
});
/* ---- dictation & voice ---- */
function dictate(c,btn){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(SR){
    try{const r=new SR();r.lang="en-US";btn.classList.add("listening");
      r.onresult=e=>{c.ta.value+=(c.ta.value?" ":"")+e.results[0][0].transcript;syncComposer(c)};
      r.onend=()=>btn.classList.remove("listening");r.onerror=()=>btn.classList.remove("listening");r.start();return}catch(e){}
  }
  btn.classList.add("listening");toast("Listening… (simulated dictation)");
  setTimeout(()=>{btn.classList.remove("listening");if(!c.ta.value){c.ta.value="What are the latest developments in AI?";syncComposer(c)}},1600);
}
function voiceMode(){
  if(!signedIn())return loginModal("voice");
  const vr=$("#voiceRoot");
  vr.innerHTML=`<div class="voice-overlay"><button class="icon-btn voice-x" id="voiceClose" aria-label="Close voice mode">${icon("x","ic lg")}</button>
   <div class="voice-orb">${icon("wave","ic lg")}</div><h2>Listening…</h2><p>Ask anything out loud and get instant, cited answers.</p>
   <p style="margin-top:26px;font-size:12.5px;color:var(--ink-3)">Demo replica — no audio is recorded.</p></div>`;
  $("#voiceClose").addEventListener("click",()=>{vr.innerHTML=""});
}
