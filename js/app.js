"use strict";
/* ================= VIEW SWITCHING ================= */
const VIEWS={home:"view-home",discover:"view-discover",story:"view-story",computer:"view-computer",automations:"view-automations",artifacts:"view-artifacts",customize:"view-customize"};
let currentView="home",lastListView="discover";
function showView(name){
  currentView=name;
  Object.entries(VIEWS).forEach(([k,id])=>{$("#"+id).hidden=k!==name});
  $$("#mainNav .nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===name));
  const tabFor={home:"home",discover:"discover",computer:"computer",artifacts:"artifacts"};
  if(tabFor[name])$$("#mobileTabs .mtab").forEach(b=>b.classList.toggle("active",b.dataset.mtab===tabFor[name]));
  $("#main").scrollTop=0;closeMenu();
}
function appsMenu(anchor){
  const items=[["Discover","globe","discover"],["Finance","chart","Finance"],["Health","heartp","Health"],["Academic","book","Academic"],["Patents","patent","Patents"]];
  openMenu(anchor,el=>{
    el.innerHTML=items.map(([l,ic,t])=>`<button class="menu-item" data-app="${t}">${icon(ic)}<span class="grow">${l}</span></button>`).join("");
    $$("[data-app]",el).forEach(b=>b.addEventListener("click",()=>{closeMenu();showDiscover(b.dataset.app)}));
  },{width:230,align:"right"});
}
$$("[data-apps]").forEach(b=>b.addEventListener("click",()=>appsMenu(b)));
function shareMenu(anchor){
  openMenu(anchor,el=>{
    el.innerHTML=`<div class="menu-head">Share this Page</div><button class="menu-item" data-m="copy">${icon("link")}<span class="grow">Copy link</span></button>`;
    $("[data-m='copy']",el).addEventListener("click",()=>{closeMenu();copyText(location.href,"Link copied")});
  },{width:220,align:"right"});
}

/* ================= SIDEBAR ================= */
$("#logoLink").addEventListener("click",e=>{e.preventDefault();showView("home")});
$("#collapseBtn").addEventListener("click",()=>{
  const rail=document.body.classList.toggle("rail");
  $("#collapseBtn").dataset.tip=rail?"Expand sidebar":"Collapse sidebar";
});
$$("#mainNav .nav-item").forEach(b=>b.addEventListener("click",()=>{
  const n=b.dataset.nav;
  if(n==="new"){resetThreadState();showView("home");const c=composers.find(x=>x.ctx==="home");if(c)setTimeout(()=>c.ta.focus(),50)}
  else showView(n);
}));
function sectionToggle(secId,chevId){
  $(chevId).addEventListener("click",()=>{
    const sec=$(secId);sec.classList.toggle("closed");
    $(".sb-sec-body",sec).hidden=sec.classList.contains("closed");
  });
}
sectionToggle("#projectsSection","#projectsChev");
sectionToggle("#recentsSection","#recentsChev");
$("#viewPlansBtn").addEventListener("click",plansModal);
$("#signInBtn").addEventListener("click",()=>loginModal());
$("#computerSignIn").addEventListener("click",()=>loginModal("computer"));
$("#userBtn").addEventListener("click",e=>{
  openMenu(e.currentTarget,el=>{
    el.innerHTML=`<div class="menu-head" style="text-transform:none;font-size:13.5px;color:var(--ink)">${esc(state.user.name)}<br><span style="color:var(--ink-3);font-weight:400;font-size:12px">${esc(state.user.email)} · ${esc(state.plan)} plan</span></div><div class="menu-sep"></div>
     <button class="menu-item" data-u="upgrade">${icon("spark")}<span class="grow">Upgrade to Pro</span></button>
     <button class="menu-item" data-u="out">${icon("user")}<span class="grow">Sign out</span></button>`;
    $("[data-u='upgrade']",el).addEventListener("click",()=>{closeMenu();plansModal()});
    $("[data-u='out']",el).addEventListener("click",()=>{state.user=null;state.plan="Free";save();updateAuthUI();closeMenu();toast("Signed out")});
  },{width:250});
});
function renderRecents(){
  const list=$("#recentsList");
  const threads=state.threads||[];
  $("#recentsEmpty").hidden=threads.length>0||state.recents.length>0;
  list.innerHTML=threads.map(t=>`<button class="sb-list-item" data-tid="${t.id}">${esc(t.title)}</button>`).join("")+
    state.recents.filter(q=>!threads.some(t=>t.title===q)).map(q=>`<button class="sb-list-item" data-q="${esc(q)}">${esc(q)}</button>`).join("");
  $$("[data-tid]",list).forEach(b=>b.addEventListener("click",()=>openThread(b.dataset.tid)));
  $$("[data-q]",list).forEach(b=>b.addEventListener("click",()=>doSearch(b.dataset.q)));
}
function renderProjects(){
  const list=$("#projectsList");$("#projectsEmpty").hidden=state.projects.length>0;
  list.innerHTML=state.projects.map(p=>`<button class="sb-list-item" data-p="${esc(p.name)}">${esc(p.name)}</button>`).join("");
  $$("[data-p]",list).forEach(b=>b.addEventListener("click",()=>{showView("home");toast("Project “"+b.dataset.p+"” — start a thread inside it")}));
}
function openProjectModal(){
  const ov=openModal(`${xBtn}<h2>Create a new Project</h2><p class="sub">Projects keep related threads, files and instructions together.</p>
   <label>Project name</label><input class="field" id="projName" type="text" placeholder="e.g. Market research">
   <div class="form-actions"><button class="btn light" data-close>Cancel</button><button class="btn black" id="projCreate">Create project</button></div>`,"form-dialog");
  $("#projCreate",ov).addEventListener("click",()=>{
    const n=$("#projName",ov).value.trim();if(!n)return toast("Give the project a name");
    state.projects.unshift({name:n});save();renderProjects();closeModal();toast("Project “"+n+"” created");
  });
}
$("#createProjectBtn").addEventListener("click",()=>{signedIn()?openProjectModal():loginModal()});
$("#filterProjectsBtn").addEventListener("click",e=>{
  openMenu(e.currentTarget,el=>{
    el.innerHTML=["All projects","Created by you","Shared with you"].map(f=>`<button class="menu-item" data-f="${f}"><span class="grow">${f}</span>${state.projFilter===f?checkTail():""}</button>`).join("");
    $$("[data-f]",el).forEach(b=>b.addEventListener("click",()=>{state.projFilter=b.dataset.f;save();closeMenu();toast("Project filter: "+b.dataset.f)}));
  },{width:210});
});

/* ================= COMMAND PALETTE ================= */
function openPalette(){
  const ov=openModal(`<input id="palInput" type="text" placeholder="Type a command or search" aria-label="Type a command or search">
   <div class="menu-head">Commands</div><div class="palette-list" id="palList"></div>`,"palette-dialog");
  ov.querySelector(".overlay")?.classList?.add("palette-wrap");
  ov.style.alignItems="flex-start";ov.style.paddingTop="10vh";
  const input=$("#palInput",ov),list=$("#palList",ov);
  const base=[
    {label:"Search with Perplexity",ic:"search",hint:"Home",run:()=>{showView("home");const c=composers.find(x=>x.ctx==="home");if(c)c.ta.focus()}},
    {label:"Start a Computer session",ic:"monitor",hint:"Computer",run:()=>showView("computer")},
    {label:"Create a new Project",ic:"plus",hint:"Projects",run:()=>{signedIn()?openProjectModal():loginModal()}}];
  function render(){
    const q=input.value.trim().toLowerCase();
    let items=base.filter(i=>!q||i.label.toLowerCase().includes(q));
    if(!q){state.recents.slice(0,4).forEach(r=>items.push({label:r,ic:"auto",hint:"Recent",run:()=>{const t=(state.threads||[]).find(x=>x.title===r);t?openThread(t.id):doSearch(r)}}));
            state.projects.forEach(p=>items.push({label:p.name,ic:"cube",hint:"Project",run:()=>{showView("home");toast("Project “"+p.name+"” opened")}}))}
    list.innerHTML=items.length?items.map((i,ix)=>`<button class="palette-item ${ix===0?"sel":""}" data-ix="${ix}">${icon(i.ic)} ${esc(i.label)}<span class="hint">${i.hint}</span></button>`).join(""):`<div class="menu-head">No results</div>`;
    $$(".palette-item",list).forEach(b=>b.addEventListener("click",()=>{const it=items[+b.dataset.ix];closeModal();it.run()}));
    list._items=items;
  }
  input.addEventListener("input",render);
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&list._items?.[0]){const it=list._items[0];closeModal();it.run()}});
  render();
}
$("#paletteBtn").addEventListener("click",openPalette);

/* ================= EDUCATION MODALS ================= */
$("#suggestSearch").addEventListener("click",()=>{
  const ov=openModal(`${xBtn}<h2>Get the most accurate answers from all of the top AI models</h2>
   <p class="sub">Perplexity searches the web and cites its sources – so you can trust what you read.</p>
   <div class="edu-mock"><div style="color:var(--ink-3);font-size:15px">Ask anything…</div>
    <div class="edu-scroll"><div class="chip-row">${MODELS.map(m=>`<span class="model-chip"><img class="model-logo" src="${m.logo}" alt=""> ${m.name}</span>`).join("")}</div></div></div>
   <button class="btn black block" id="eduLogin">Login or sign up for free</button>`,"edu-dialog");
  $("#eduLogin",ov).addEventListener("click",()=>loginModal());
});
$("#suggestComputer").addEventListener("click",()=>{
  const ov=openModal(`${xBtn}<h2>Get more done with Computer</h2>
   <p class="sub">Computer orchestrates agents that research, build, and ship polished deliverables around the clock.</p>
   <div style="margin-top:14px">
    ${["Send morning stock brief","Building marketing website","Analyze experiment data"].map(t=>`<div class="task-row"><span class="dot"></span>${t}<span style="margin-left:auto;color:var(--ink-3)">${icon("chevr","ic sm")}</span></div>`).join("")}
   </div>
   <div class="edu-panels">
    <div class="edu-panel"><h4>Works inside your stack</h4><div class="app-tiles">
      ${[["G","#ea4335"],["G","#24292e"],["S","#611f69"],["N","#111"]].map(([l,c])=>`<span class="app-tile" style="background:${c}">${l}</span>`).join("")}
      <span style="font-size:12px;color:var(--ink-3);align-self:center">Gmail · GitHub · Slack · Notion</span></div></div>
    <div class="edu-panel"><h4>Set it and forget it</h4><div style="font-size:13px;font-weight:600">Monday Morning Brief</div><div style="font-size:12.5px;color:var(--ink-2);margin-top:4px">Every Monday · 8:00 AM</div></div>
   </div>
   <button class="btn black block" id="eduLogin2">Login or sign up for free</button>`,"edu-dialog");
  $("#eduLogin2",ov).addEventListener("click",()=>loginModal("computer"));
});

/* ================= DISCOVER ================= */
let discTopic="Top",weatherUnit="C";
const favi=(ix,sz)=>{const[o,c,l]=OUTLETS[ix%OUTLETS.length];return `<span class="favi" style="background:${c};${sz?`width:${sz}px;height:${sz}px`:""}" title="${o}">${l}</span>`};
const faviStack=idxs=>`<span class="favi-stack">${idxs.map(i=>favi(i)).join("")}</span>`;
const srcLine=s=>`<span class="src-stack">${faviStack(s.outlets)} ${OUTLETS[s.outlets[0]%OUTLETS.length][0]} +${s.outlets.length-1>0?s.outlets.length-1:0} · ${s.sources} sources</span>`;
function storyFootHTML(s){
  const liked=!!state.likes[s.id];
  return `<div class="story-foot">${srcLine(s)}<span style="flex:1"></span>
   <button class="mini-btn ${liked?"liked":""}" data-like="${s.id}" aria-label="Like">${icon("heart","ic sm")} Like</button>
   <button class="mini-btn" data-actions="${s.id}" aria-label="Article actions">${icon("dots","ic sm")}</button></div>`;
}
function bindStoryCards(root){
  $$("[data-open]",root).forEach(el=>el.addEventListener("click",e=>{
    if(e.target.closest("[data-like],[data-actions]"))return;
    const s=STORIES.find(x=>x.id===el.dataset.open);if(s)openStory(s);
  }));
  $$("[data-like]",root).forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation();const id=b.dataset.like;state.likes[id]=!state.likes[id];save();
    b.classList.toggle("liked",state.likes[id]);
  }));
  $$("[data-actions]",root).forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation();
    openMenu(b,el=>{el.innerHTML=`<button class="menu-item" data-d="1"><span class="grow">Dislike</span></button>`;
      $("[data-d]",el).addEventListener("click",()=>{state.hiddenStories.push(b.dataset.actions);save();closeMenu();renderDiscover();toast("Got it — you'll see fewer stories like this")})},{width:180,align:"right"});
  }));
}
function renderDiscover(){
  const feed=$("#discFeed");
  let pool=STORIES.filter(s=>!state.hiddenStories.includes(s.id));
  if(discTopic!=="Top"&&TOPIC_STORIES[discTopic])pool=pool.filter(s=>TOPIC_STORIES[discTopic].stories.includes(s.id));
  else if(discTopic!=="Top")pool=pool.filter(s=>s.cat===discTopic);
  $("#discTitle").textContent=discTopic==="Top"?"Discover":(TOPIC_STORIES[discTopic]?.title||discTopic);
  if(!pool.length){feed.innerHTML=`<div class="empty-state"><h3>Nothing here right now</h3><p>Stories you dislike are hidden. Try another topic.</p></div>`;return}
  const[lead,...rest]=pool;const row=rest.slice(0,3),wide=rest.slice(3);
  feed.innerHTML=`
   <article class="lead-story anim-in" data-open="${lead.id}">
     <h3>${esc(lead.title)}</h3><div class="story-meta">Published ${esc(lead.time)}</div>
     <p>${esc(lead.summary)}</p>${storyFootHTML(lead)}</article>
   ${row.length?`<div class="card-row">${row.map(s=>`<article class="story-card anim-in" data-open="${s.id}"><img src="https://picsum.photos/seed/${s.seed}/640/400" alt="" loading="lazy"><h4>${esc(s.title)}</h4>${storyFootHTML(s)}</article>`).join("")}</div>`:""}
   ${wide.map(s=>`<article class="wide-story anim-in" data-open="${s.id}"><div><h4>${esc(s.title)}</h4><div class="story-meta">Published ${esc(s.time)}</div><p>${esc(s.summary)}</p>${storyFootHTML(s)}</div><img src="https://picsum.photos/seed/${s.seed}/640/420" alt="" loading="lazy"></article>`).join("")}`;
  bindStoryCards(feed);renderRail();
}
function c2f(c){return weatherUnit==="C"?c:Math.round(c*9/5+32)}
function renderRail(){
  const rail=$("#discRail");if(!rail)return;
  const days=[["Wed",21,13],["Thu",22,14],["Fri",20,12],["Sat",19,11],["Sun",23,15]];
  rail.innerHTML=`
   ${state.railDismissed?"":`<div class="rail-card"><h4>Make it yours</h4><button class="x2" id="railX" aria-label="Dismiss">${icon("x","ic sm")}</button>
     <p style="color:var(--ink-2);font-size:13px;line-height:1.55;margin-top:6px">Select topics and interests to customize your Discover experience</p>
     <div class="chip-row">${["Tech & Science","Business","Arts & Culture","Sports","Entertainment"].map(t=>`<button class="topic-chip ${state.interests.includes(t)?"sel":""}" data-int="${t}">${t}</button>`).join("")}</div>
     <button class="btn black sm block" id="saveInterests" style="margin-top:14px" ${state.interests.length?"":"disabled"}>Save Interests</button></div>`}
   <div class="rail-card"><div class="weather-top"><div><div class="weather-temp">${c2f(19)}°</div>
     <div style="color:var(--ink-2);font-size:13px;margin-top:2px">Clouds and sun</div>
     <div style="font-weight:600;font-size:13.5px;margin-top:8px">Mendoza</div>
     <div style="color:var(--ink-3);font-size:12.5px">H: ${c2f(21)}°&nbsp; L: ${c2f(13)}°</div></div>
     <div class="unit-toggle"><button data-u="F" class="${weatherUnit==="F"?"sel":""}">°F</button><button data-u="C" class="${weatherUnit==="C"?"sel":""}">°C</button></div></div>
     <div class="weather-days">${days.map(([d,h,l])=>`<div><b>${d}</b><span>☀</span><span>${c2f(h)}° / ${c2f(l)}°</span></div>`).join("")}</div></div>
   <div class="rail-card"><span class="rail-link">Market Outlook ${icon("chevr","ic sm")}</span>
     <div class="market-row">${MARKETS.map(([n,p,v,d,up,pts])=>`<div class="market-card"><div class="mn">${n} <span class="${up?"up":"down"}">${p}</span></div><div class="mp">${v}</div><div class="${up?"up":"down"}" style="font-size:12px">${d}</div><svg width="100%" height="20" viewBox="0 0 24 8" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${up?"hsl(145,55%,32%)":"hsl(4,65%,45%)"}" stroke-width="1.2"/></svg></div>`).join("")}</div></div>
   <div class="rail-card"><span class="rail-link">Trending Companies ${icon("chevr","ic sm")}</span>
     <div style="margin-top:6px">${COMPANIES.map(([n,t,p,d,up])=>`<div class="company-row"><span class="favi" style="background:var(--hover);color:var(--ink)">${n[0]}</span><span class="grow"><b>${n}</b><span>${t}</span></span><span style="text-align:right"><b>${p}</b><br><span class="${up?"up":"down"}">${d}</span></span></div>`).join("")}</div></div>`;
  const rx=$("#railX");if(rx)rx.addEventListener("click",()=>{state.railDismissed=true;save();renderRail()});
  $$("[data-int]",rail).forEach(b=>b.addEventListener("click",()=>{
    const t=b.dataset.int;const ix=state.interests.indexOf(t);
    ix>=0?state.interests.splice(ix,1):state.interests.push(t);save();renderRail();
  }));
  const sv=$("#saveInterests");if(sv)sv.addEventListener("click",()=>toast("Interests saved — Discover is now tuned to you"));
  $$("[data-u]",rail).forEach(b=>b.addEventListener("click",()=>{weatherUnit=b.dataset.u;renderRail()}));
}
function showDiscover(topic){
  discTopic=topic||"Top";lastListView="discover";showView("discover");renderDiscover();
}
$("#dtabTopics").addEventListener("click",e=>{
  openMenu(e.currentTarget,el=>{
    el.innerHTML=["Tech & Science","Business","Arts & Culture","Sports","Entertainment"].map(t=>`<button class="menu-item" data-t="${t}"><span class="grow">${t}</span>${discTopic===t?checkTail():""}</button>`).join("");
    $$("[data-t]",el).forEach(b=>b.addEventListener("click",()=>{closeMenu();showDiscover(b.dataset.t)}));
  },{width:220});
});
$("#dtabTop").addEventListener("click",()=>showDiscover("Top"));
$("#discShareBtn").addEventListener("click",e=>shareMenu(e.currentTarget));

/* ================= STORY / ANSWER ================= */
let currentBack="discover";
function citeHTML(ix,plus){const[o]=OUTLETS[ix%OUTLETS.length];return `<span class="cite" data-cite="${o}">${favi(ix)} ${o}${plus?" +1":""}</span>`}
function secToolsHTML(sources,secIx){
  return `<div class="sec-tools"><button class="src-pill" data-stools="sources">${icon("globe","ic sm")} ${sources} sources</button>
   <button class="mini-btn" data-stools="link" data-tip="Copy link to section">${icon("link","ic sm")}</button>
   <button class="mini-btn" data-stools="content" data-tip="Copy section content">${icon("copy","ic sm")}</button></div>`;
}
function bindArticle(root){
  $$("[data-cite]",root).forEach(c=>c.addEventListener("click",()=>toast("Source: "+c.dataset.cite+" — opens the original article on the live site")));
  $$("[data-stools]",root).forEach(b=>b.addEventListener("click",()=>{
    const kind=b.dataset.stools;
    if(kind==="sources")return toast("Full source list is shown above the answer");
    if(kind==="link")return copyText(location.href+"#section","Link to section copied");
    const sec=b.closest("[data-section]");copyText(sec?sec.innerText:"","Section content copied");
  }));
  $$("[data-follow]",root).forEach(b=>b.addEventListener("click",()=>doSearch(b.dataset.follow)));
  $$("[data-open]",root).forEach(el=>el.addEventListener("click",()=>{const s=STORIES.find(x=>x.id===el.dataset.open);if(s)openStory(s)}));
}
function articleShell(o){
  const srcCards=o.srcIdx.map((ix,i)=>{const[name]=OUTLETS[ix%OUTLETS.length];return `<button class="src-card"><span class="so">${favi(ix)} ${name}</span><span class="st">${esc(i===0?o.title:o.sections[i-1]?.h||o.title)}</span></button>`}).join("");
  return `
   <h2 class="a-title">${esc(o.title)}</h2>
   ${o.meta?`<div class="story-meta">${esc(o.meta)}</div>`:""}
   <div class="src-cards">${srcCards}</div>
   <p class="lead">${o.lead} ${citeHTML(o.srcIdx[0],true)} ${citeHTML(o.srcIdx[1])}</p>
   <figure class="hero-img"><img src="https://picsum.photos/seed/${o.seed}/1100/620" alt=""><figcaption>${OUTLETS[o.srcIdx[0]%OUTLETS.length][0]}</figcaption></figure>
   ${o.sections.map((sec,i)=>`<div data-section><h3 class="a-sec">${esc(sec.h)}</h3><p class="body">${sec.p} ${citeHTML(o.srcIdx[(i+1)%o.srcIdx.length])}</p>${secToolsHTML(o.sources,i)}</div>`).join("")}
   ${o.followups?`<div class="follow-label">Follow-ups</div>${o.followups.map(f=>`<button class="follow-chip" data-follow="${esc(f)}">${esc(f)} ${icon("chevr","ic sm")}</button>`).join("")}`:""}
   <div class="follow-label" style="margin-top:38px">Discover more</div>
   <div class="more-grid">${STORIES.filter(s=>s.id!==o.id).slice(0,4).map(s=>`<article class="more-card" data-open="${s.id}"><img src="https://picsum.photos/seed/${s.seed}/480/260" alt="" loading="lazy"><h5>${esc(s.title)}</h5><p>${esc(s.summary)}</p></article>`).join("")}</div>`;
}
function openStory(s){
  inChat=false;currentBack="discover";$("#storyBackLabel").textContent="Back to Discover";$("#storyBarTitle").textContent=s.title;
  showView("story");
  $("#articleBody").innerHTML=articleShell({
    id:s.id,title:s.title,meta:"Published "+s.time,seed:s.seed,srcIdx:[...s.outlets,(s.outlets[0]+3)%OUTLETS.length],sources:s.sources,
    lead:esc(s.summary),
    sections:s.sec.map((h,i)=>({h,p:i===0
      ? esc(s.summary)+" Reporting from multiple outlets describes a situation that is still moving, with officials on each side choosing their words carefully in public while negotiations continue in private. Analysts note that the next concrete step — a meeting, a document, a deadline — matters more than the statements around it."
      : "For readers following along, the practical picture is this: the headline development is real, but its consequences depend on decisions that have not been taken yet. Expect further statements in the coming days, and expect each side to frame them differently. This section will update as more sources publish."}))
  });
  bindArticle($("#articleBody"));
}
$("#storyBack").addEventListener("click",()=>{if(inChat){inChat=false;showView("home")}else if(currentBack==="discover")showDiscover(discTopic);else showView("home")});
$("#storyShareBtn").addEventListener("click",e=>shareMenu(e.currentTarget));
/* ================= CHAT THREADS ================= */
if(!Array.isArray(state.threads))state.threads=[];
let inChat=false,currentThreadId=null,threadMsgs=[];
function resetThreadState(){inChat=false;currentThreadId=null;threadMsgs=[];resetChat()}
const modelMeta=k=>MODELS.find(m=>m.key===k)||MODELS[0];
function scrollMainBottom(){const m=$("#main");m.scrollTop=m.scrollHeight}
function syncRecentsFromThreads(){state.recents=state.threads.map(t=>t.title)}
function saveCurrentThread(){
  if(document.body.classList.contains("incognito"))return;
  if(!threadMsgs.some(m=>m.role==="ai"))return;
  const title=(threadMsgs.find(m=>m.role==="user")||{}).text||"New thread";
  if(!currentThreadId)currentThreadId="t"+Date.now().toString(36);
  const rec={id:currentThreadId,title:title.slice(0,90),msgs:threadMsgs.map(m=>({role:m.role,text:String(m.text||"").slice(0,20000),model:m.model||null}))};
  state.threads=[rec,...state.threads.filter(t=>t.id!==currentThreadId)].slice(0,8);
  syncRecentsFromThreads();save();renderRecents();
}
function startThread(){
  inChat=true;currentThreadId=null;threadMsgs=[];chatHistory=[];
  $("#storyBackLabel").textContent="Back";showView("story");
  $("#articleBody").innerHTML=`<div class="thread" id="threadMsgs"></div>`;
}
function appendUserBubble(text){
  const t=$("#threadMsgs");if(!t)return;
  const el=document.createElement("div");el.className="msg-user anim-in";
  el.innerHTML=`<div class="bubble">${esc(text)}</div>`;t.appendChild(el);
}
function appendAiBlock(modelKey){
  const t=$("#threadMsgs");if(!t)return null;
  const meta=modelMeta(modelKey);
  const wrap=document.createElement("div");wrap.className="msg-ai anim-in";
  wrap.innerHTML=`<div class="model-row"><img class="model-logo" src="${meta.logo}" alt=""> ${esc(meta.name)} <span class="live-dot">· Live AI answer</span></div>
   <div class="search-status ai-status" style="margin-top:14px"><span class="spinner"></span> ${esc(meta.name)} is thinking…</div>
   <div class="answer-md"></div><div class="ai-tools-slot"></div>`;
  t.appendChild(wrap);return wrap;
}
function attachAiTools(wrap,raw,modelKey){
  const slot=$(".ai-tools-slot",wrap);if(!slot)return;
  const meta=modelMeta(modelKey);
  slot.innerHTML=`<div class="ai-tools">
    <button class="tool-btn" data-t="copy" data-tip="Copy" aria-label="Copy answer">${icon("copy","ic sm")}</button>
    <button class="tool-btn" data-t="share" data-tip="Share" aria-label="Share">${icon("share","ic sm")}</button>
    <button class="tool-btn" data-t="like" data-tip="Good response" aria-label="Good response">${icon("thumb","ic sm")}</button>
    <button class="tool-btn" data-t="dislike" data-tip="Bad response" aria-label="Bad response">${icon("thumbd","ic sm")}</button>
    <button class="tool-btn" data-t="branch" data-tip="Branch into a new thread" aria-label="Branch">${icon("branch","ic sm")}</button>
    <span class="tool-pill"><img class="model-logo sm" src="${meta.logo}" alt=""> ${esc(meta.name)}</span>
    <span style="flex:1"></span>
    <button class="tool-btn" data-t="more" aria-label="More actions">${icon("dots","ic sm")}</button></div>`;
  const q=s=>$(`[data-t="${s}"]`,slot);
  q("copy").addEventListener("click",()=>copyText(raw,"Answer copied"));
  q("share").addEventListener("click",()=>copyText(location.href,"Link copied"));
  q("like").addEventListener("click",()=>{q("like").classList.add("on");q("dislike").classList.remove("on");toast("Thanks for your feedback")});
  q("dislike").addEventListener("click",()=>{q("dislike").classList.add("on");q("like").classList.remove("on");toast("Thanks — we'll use that to improve")});
  q("branch").addEventListener("click",()=>branchFromAi(wrap));
  q("more").addEventListener("click",e=>{
    openMenu(e.currentTarget,el=>{
      el.innerHTML=`
       <button class="menu-item" data-m="regen">${icon("auto")}<span class="grow">Regenerate response</span></button>
       <button class="menu-item" data-m="copy">${icon("copy")}<span class="grow">Copy</span></button>
       <button class="menu-item" data-m="export">${icon("file")}<span class="grow">Export thread (.md)</span></button>
       <div class="menu-sep"></div>
       <button class="menu-item" data-m="del">${icon("trash")}<span class="grow">Delete thread</span></button>`;
      $("[data-m='regen']",el).addEventListener("click",()=>{closeMenu();regenerateAi(wrap,modelKey)});
      $("[data-m='copy']",el).addEventListener("click",()=>{closeMenu();copyText(raw,"Answer copied")});
      $("[data-m='export']",el).addEventListener("click",()=>{closeMenu();exportThread()});
      $("[data-m='del']",el).addEventListener("click",()=>{closeMenu();deleteCurrentThread()});
    },{width:240,align:"right"});
  });
}
function runAiTurn(modelKey){
  const wrap=appendAiBlock(modelKey);if(!wrap)return;
  const bodyEl=$(".answer-md",wrap),statusEl=$(".ai-status",wrap);
  streamAnswer(chatHistory,modelKey,bodyEl,statusEl,
    raw=>{chatHistory.push({role:"assistant",content:raw});threadMsgs.push({role:"ai",text:raw,model:modelKey});attachAiTools(wrap,raw,modelKey);saveCurrentThread();scrollMainBottom()},
    err=>{statusEl.className="";statusEl.innerHTML=`<div class="empty-state" style="margin-top:8px"><h3>Couldn't get an answer</h3><p>${esc(err.message||"Something went wrong.")}</p><button class="btn black" data-retry>Try again</button></div>`;
      $("[data-retry]",statusEl).addEventListener("click",()=>{wrap.remove();runAiTurn(modelKey)})});
}
function doSearch(q){
  q=(q||"").trim();if(!q)return;
  if(!inChat||currentView!=="story"||!$("#threadMsgs"))startThread();
  if(!threadMsgs.some(m=>m.role==="user"))$("#storyBarTitle").textContent=q;
  appendUserBubble(q);threadMsgs.push({role:"user",text:q});chatHistory.push({role:"user",content:q});
  scrollMainBottom();runAiTurn(activeModel);
}
function renderThreadMsgs(){
  $("#articleBody").innerHTML=`<div class="thread" id="threadMsgs"></div>`;
  threadMsgs.forEach(m=>{
    if(m.role==="user")appendUserBubble(m.text);
    else{const wrap=appendAiBlock(m.model||"mistral");if(!wrap)return;const st=$(".ai-status",wrap);if(st)st.remove();$(".answer-md",wrap).innerHTML=mdToHtml(m.text);attachAiTools(wrap,m.text,m.model||"mistral")}
  });
}
function openThread(id){
  const t=state.threads.find(x=>x.id===id);if(!t)return;
  inChat=true;currentThreadId=t.id;threadMsgs=t.msgs.map(m=>({...m}));
  chatHistory=threadMsgs.map(m=>m.role==="user"?{role:"user",content:m.text}:{role:"assistant",content:m.text});
  $("#storyBackLabel").textContent="Back";$("#storyBarTitle").textContent=t.title;showView("story");renderThreadMsgs();scrollMainBottom();
}
function branchFromAi(wrap){
  const blocks=$$("#threadMsgs .msg-ai");const ix=blocks.indexOf(wrap);
  let aiSeen=-1,endIx=threadMsgs.length-1;
  threadMsgs.forEach((m,i)=>{if(m.role==="ai"){aiSeen++;if(aiSeen===ix)endIx=i}});
  const msgs=threadMsgs.slice(0,endIx+1).map(m=>({...m}));
  if(!msgs.length)return;
  const rec={id:"t"+Date.now().toString(36),title:((msgs.find(m=>m.role==="user")||{}).text||"Branch").slice(0,90),msgs};
  state.threads=[rec,...state.threads].slice(0,8);syncRecentsFromThreads();save();renderRecents();
  openThread(rec.id);toast("Branched into a new thread");
}
function regenerateAi(wrap,modelKey){
  const blocks=$$("#threadMsgs .msg-ai");
  if(blocks.indexOf(wrap)!==blocks.length-1)return toast("Regenerate works on the latest reply");
  if(threadMsgs.length&&threadMsgs[threadMsgs.length-1].role==="ai")threadMsgs.pop();
  if(chatHistory.length&&chatHistory[chatHistory.length-1].role==="assistant")chatHistory.pop();
  wrap.remove();runAiTurn(modelKey);
}
function exportThread(){
  const title=(threadMsgs.find(m=>m.role==="user")||{}).text||"Thread";
  const md="# "+title+"\n\n"+threadMsgs.map(m=>m.role==="user"?("**You:** "+m.text):("**"+modelMeta(m.model||"mistral").name+":** "+m.text)).join("\n\n")+"\n";
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([md],{type:"text/markdown"}));
  a.download=title.slice(0,40).replace(/[^\w ]/g,"").trim().replace(/\s+/g,"-")+".md";
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("Thread exported");
}
function deleteCurrentThread(){
  if(currentThreadId){state.threads=state.threads.filter(t=>t.id!==currentThreadId);syncRecentsFromThreads();save();renderRecents()}
  resetThreadState();showView("home");toast("Thread deleted");
}

/* ================= COMPUTER ================= */
function doComputerSession(q,standard){
  if(!requireAuth("computer"))return;
  const list=$("#sessionList");
  const card=document.createElement("div");card.className="session-card anim-in";
  card.innerHTML=`<div class="s-head">${icon("monitor")}<span>${esc(q)}</span><span class="status-pill working">Working…</span></div>
   <div class="s-body">Computer is researching, drafting and assembling your deliverable (${esc(standard||"Standard")} mode).</div>`;
  list.prepend(card);
  setTimeout(()=>{
    $(".status-pill",card).textContent="Completed";$(".status-pill",card).classList.remove("working");
    $(".s-body",card).innerHTML=`Deliverable ready: a structured brief on “${esc(q)}” — summary, key findings with sources, and recommended next steps. <button class="mini-btn" data-view style="margin-left:6px">${icon("ext","ic sm")} View artifact</button>`;
    $("[data-view]",card).addEventListener("click",()=>toast("The artifact viewer opens on the live site — this replica keeps it as a summary"));
    toast("Computer finished a session");
  },2400);
}

/* ================= AUTOMATIONS ================= */
function renderAutomations(){
  const list=$("#automationList");
  list.innerHTML=state.automations.map((a,i)=>`<div class="session-card anim-in"><div class="s-head">${icon("auto")}<span>${esc(a.name)}</span><span class="status-pill ${a.paused?"working":""}">${a.paused?"Paused":"Active"}</span></div>
   <div class="s-body">${esc(a.prompt)}<br><span style="color:var(--ink-3)">${esc(a.schedule)} · ${esc(a.time||"09:00")}</span></div>
   <div style="display:flex;gap:8px;margin-top:12px"><button class="btn light sm" data-pause="${i}">${a.paused?"Resume":"Pause"}</button><button class="btn light sm" data-del="${i}">${icon("trash","ic sm")} Delete</button></div></div>`).join("");
  $$("[data-pause]",list).forEach(b=>b.addEventListener("click",()=>{const a=state.automations[+b.dataset.pause];a.paused=!a.paused;save();renderAutomations()}));
  $$("[data-del]",list).forEach(b=>b.addEventListener("click",()=>{state.automations.splice(+b.dataset.del,1);save();renderAutomations();toast("Automation deleted")}));
}
function openAutomationModal(prefill={}){
  const ov=openModal(`${xBtn}<h2>Create automation</h2><p class="sub">Computer will run this on your schedule and deliver the result automatically.</p>
   <label>Name</label><input class="field" id="auName" type="text" placeholder="e.g. Morning stock brief" value="${esc(prefill.name||"")}">
   <label>What should Computer do?</label><textarea class="field" id="auPrompt" rows="3" placeholder="Describe the workflow…">${esc(prefill.prompt||"")}</textarea>
   <label>Schedule</label><select class="field" id="auSched"><option>Every day</option><option>Weekdays</option><option>Every Monday</option><option>Custom</option></select>
   <label>Time</label><input class="field" id="auTime" type="time" value="09:00">
   <div class="form-actions"><button class="btn light" data-close>Cancel</button><button class="btn black" id="auCreate">Create automation</button></div>`,"form-dialog");
  $("#auCreate",ov).addEventListener("click",()=>{
    const name=$("#auName",ov).value.trim(),prompt=$("#auPrompt",ov).value.trim();
    if(!name||!prompt)return toast("Add a name and a description");
    state.automations.unshift({name,prompt,schedule:$("#auSched",ov).value,time:$("#auTime",ov).value,paused:false});
    save();renderAutomations();closeModal();toast("Automation “"+name+"” created");
  });
}
$("#createAutomationBtn").addEventListener("click",()=>openAutomationModal());
$("#templateGrid").innerHTML=TEMPLATES.map((t,i)=>`<button class="template-card" data-tpl="${i}"><h4>${icon("auto","ic sm")} ${esc(t.name)}</h4><p>${esc(t.desc)}</p></button>`).join("");
$$("[data-tpl]").forEach(b=>b.addEventListener("click",()=>{const t=TEMPLATES[+b.dataset.tpl];openAutomationModal({name:t.name,prompt:t.desc})}));

/* ================= ARTIFACTS ================= */
let artTab="all",artView="grid";
function renderArtifacts(){
  const grid=$("#artifactGrid"),q=($("#artifactSearch").value||"").toLowerCase();
  const items=state.artifacts.filter(a=>(artTab==="all"||a.kind===artTab)&&(state.artType==="All types"||a.type===state.artType)&&(!q||a.name.toLowerCase().includes(q)));
  grid.className="artifact-grid"+(artView==="list"?" list":"");
  grid.innerHTML=items.map(a=>`<div class="artifact-card"><span class="a-ic">${icon("file","ic")}</span><h4>${esc(a.name)}</h4><p>${esc(a.type)} · ${esc(a.when||"Just now")} · ${a.kind==="created"?"Created by you":a.kind==="uploaded"?"Uploaded by you":"Shared with you"}</p></div>`).join("");
  $("#artifactEmpty").hidden=items.length>0;
}
$("#artifactSearch").addEventListener("input",renderArtifacts);
$("#gridViewBtn").addEventListener("click",()=>{artView="grid";$("#gridViewBtn").classList.add("sel");$("#listViewBtn").classList.remove("sel");renderArtifacts()});
$("#listViewBtn").addEventListener("click",()=>{artView="list";$("#listViewBtn").classList.add("sel");$("#gridViewBtn").classList.remove("sel");renderArtifacts()});
$$("#artifactTabs .ftab").forEach(b=>b.addEventListener("click",()=>{$$("#artifactTabs .ftab").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");artTab=b.dataset.atab;renderArtifacts()}));
$("#artifactTypeBtn").addEventListener("click",e=>{
  openMenu(e.currentTarget,el=>{
    el.innerHTML=["All types","Documents","Images","Reports","Apps","Presentations"].map(t=>`<button class="menu-item" data-t="${t}"><span class="grow">${t}</span>${state.artType===t?checkTail():""}</button>`).join("");
    $$("[data-t]",el).forEach(b=>b.addEventListener("click",()=>{state.artType=b.dataset.t;save();closeMenu();renderArtifacts()}));
  },{width:210});
});
function openArtifactModal(){
  const ov=openModal(`${xBtn}<h2>Create an artifact</h2><p class="sub">Turn any prompt into an artifact you can save, edit, and share.</p>
   <label>Type</label><select class="field" id="afType"><option>Documents</option><option>Reports</option><option>Images</option><option>Presentations</option><option>Apps</option></select>
   <label>Describe it</label><textarea class="field" id="afPrompt" rows="3" placeholder="e.g. A one-page brief on the EV market in India"></textarea>
   <div class="form-actions"><button class="btn light" data-close>Cancel</button><button class="btn black" id="afCreate">Create artifact</button></div>`,"form-dialog");
  $("#afCreate",ov).addEventListener("click",()=>{
    const p=$("#afPrompt",ov).value.trim();if(!p)return toast("Describe the artifact first");
    const type=$("#afType",ov).value;
    state.artifacts.unshift({name:p.length>64?p.slice(0,64)+"…":p,type:type==="Documents"?"Documents":type,kind:"created",when:"Just now"});
    save();artTab="all";$$("#artifactTabs .ftab").forEach(x=>x.classList.toggle("sel",x.dataset.atab==="all"));renderArtifacts();closeModal();toast("Artifact created");
  });
}
$("#createArtifactBtn").addEventListener("click",()=>{requireAuth("artifacts")&&openArtifactModal()});

/* ================= CONNECTORS ================= */
let connTab="connectors",connScope="Discover";
function renderConnectors(){
  const q=($("#connSearch").value||"").toLowerCase();
  const src=connTab==="connectors"?CONNECTORS:SKILLS;
  let items=src.filter(c=>(state.connCat==="All categories"||c.cat===state.connCat)&&(!q||c.name.toLowerCase().includes(q)));
  if(connScope==="Discover")items=items.slice(0,6);
  $("#connGrid").innerHTML=items.length?items.map(c=>{
    const on=!!state.connected[c.name];
    return `<div class="conn-card"><div class="c-head"><span class="app-tile" style="background:${c.color};width:34px;height:34px;font-size:13px">${c.letter}</span><h4>${c.name}</h4></div>
     <p>${c.desc}</p><button class="btn ${on?"light":"black"} sm" data-conn="${c.name}">${on?"Connected":"Connect"}</button></div>`}).join("")
    :`<div class="empty-state" style="grid-column:1/-1"><h3>No matches</h3><p>Try a different search or category.</p></div>`;
  $$("[data-conn]",$("#connGrid")).forEach(b=>b.addEventListener("click",()=>{
    const n=b.dataset.conn;
    if(state.connected[n]){delete state.connected[n];save();renderConnectors();toast(n+" disconnected");return}
    if(!signedIn())return loginModal();
    state.connected[n]=true;save();renderConnectors();toast(n+" connected");
  }));
}
$("#connSearch").addEventListener("input",renderConnectors);
$("#connDiscoverBtn").addEventListener("click",()=>{connScope="Discover";$("#connDiscoverBtn").classList.add("sel");$("#connAllBtn").classList.remove("sel");renderConnectors()});
$("#connAllBtn").addEventListener("click",()=>{connScope="All";$("#connAllBtn").classList.add("sel");$("#connDiscoverBtn").classList.remove("sel");renderConnectors()});
$("#ctabConnectors").addEventListener("click",()=>{connTab="connectors";$("#ctabConnectors").classList.add("sel");$("#ctabSkills").classList.remove("sel");$("#connSub").textContent="Connect services so Perplexity can access and act on your data.";$("#connSearch").placeholder="Search all connectors";renderConnectors()});
$("#ctabSkills").addEventListener("click",()=>{connTab="skills";$("#ctabSkills").classList.add("sel");$("#ctabConnectors").classList.remove("sel");$("#connSub").textContent="Skills give Perplexity reusable abilities — enable one and it shows up in every new thread.";$("#connSearch").placeholder="Search skills";renderConnectors()});
$("#connCatBtn").addEventListener("click",e=>{
  openMenu(e.currentTarget,el=>{
    el.innerHTML=["All categories","Productivity","Developer tools","Communication","Storage","Finance","Research"].map(t=>`<button class="menu-item" data-t="${t}"><span class="grow">${t}</span>${state.connCat===t?checkTail():""}</button>`).join("");
    $$("[data-t]",el).forEach(b=>b.addEventListener("click",()=>{state.connCat=b.dataset.t;save();$("#connCatBtn").firstChild.textContent=b.dataset.t+" ";closeMenu();renderConnectors()}));
  },{width:210});
});

/* ================= INCOGNITO ================= */
function toggleIncognito(force){
  const on=force!==undefined?force:document.body.classList.toggle("incognito");
  if(force!==undefined)document.body.classList.toggle("incognito",on);
  $("#heroTitle").textContent=on?"You're incognito":"What do you want to know?";
  $("#incognitoSub").hidden=!on;$("#suggestGrid").hidden=on;
  $("#recentsChev").style.visibility=on?"hidden":"";
  $("#incognitoBtn").dataset.tip=on?"Exit incognito":"Use incognito";
  if(on)toast("Incognito on — sessions won't be saved");
}
$("#incognitoBtn").addEventListener("click",()=>toggleIncognito());

/* ================= COOKIE ================= */
if(!state.cookie)setTimeout(()=>{$("#cookieBanner").hidden=false},700);else $("#cookieBanner").hidden=true;
$("#cookieAccept").addEventListener("click",()=>{state.cookie="accepted";save();$("#cookieBanner").hidden=true;toast("Thanks — cookie choice saved")});
$("#cookieDecline").addEventListener("click",()=>{state.cookie="declined";save();$("#cookieBanner").hidden=true;toast("Optional cookies declined")});

/* ================= KEYBOARD ================= */
document.addEventListener("keydown",e=>{
  const mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key.toLowerCase()==="k"){e.preventDefault();openPalette()}
  else if(mod&&e.key.toLowerCase()==="i"){e.preventDefault();showView("home");const c=composers.find(x=>x.ctx==="home");if(c)c.ta.focus()}
  else if(e.ctrlKey&&e.key===";"){e.preventDefault();toggleIncognito()}
});

/* ================= INIT ================= */
buildComposers();
updateModelUI();
updateAuthUI();
renderRecents();
renderProjects();
renderAutomations();
renderArtifacts();
renderConnectors();
renderDiscover();
showView("home");

/* ================= MOBILE BAR / TABS ================= */
$("#mLogo").addEventListener("click",e=>{e.preventDefault();showView("home")});
$("#mPaletteBtn").addEventListener("click",openPalette);
$("#mIncognitoBtn").addEventListener("click",()=>toggleIncognito());
$("#mSignInBtn").addEventListener("click",()=>loginModal());
$("#mUserBtn").addEventListener("click",e=>{$("#userBtn").dispatchEvent(new Event("click",{bubbles:true}))});
$$("#mobileTabs .mtab").forEach(b=>b.addEventListener("click",()=>{
  const t=b.dataset.mtab;
  if(t==="home")showView("home");
  else if(t==="discover")showDiscover("Top");
  else if(t==="new"){resetThreadState();showView("home");const c=composers.find(x=>x.ctx==="home");if(c){c.ta.value="";syncComposer(c);setTimeout(()=>c.ta.focus(),60)}}
  else showView(t);
}));
