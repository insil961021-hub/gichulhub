var EXAM_DATA={36:EXAM_DATA_36,35:EXAM_DATA_35,34:EXAM_DATA_34,33:EXAM_DATA_33};
var state={examYear:36,subjectIdx:0,filter:'all',search:'',currentQ:0,answers:{},bookmarks:{},resolved:{},examMode:false};
function saveS(){try{localStorage.setItem('gh',JSON.stringify({a:state.answers,b:state.bookmarks,r:state.resolved}));}catch(e){}}
function loadS(){try{var s=JSON.parse(localStorage.getItem('gh')||'{}');state.answers=s.a||{};state.bookmarks=s.b||{};state.resolved=s.r||{};}catch(e){}}
loadS();
function curData(){return EXAM_DATA[state.examYear]||EXAM_DATA_36;}
function subj(){return curData()[state.subjectIdx];}
function qk(q){return state.subjectIdx+'_'+q.number;}
function filteredQ(){
  var qs=subj().questions;
  if(state.filter==='wrong')qs=qs.filter(function(q){var a=state.answers[qk(q)];return a&&a!==q.answer&&!state.resolved[qk(q)];});
  if(state.filter==='bm')qs=qs.filter(function(q){return state.bookmarks[qk(q)];});
  if(state.search){
    var kw=state.search.toLowerCase();
    qs=qs.filter(function(q){
      return (q.question||'').toLowerCase().indexOf(kw)>=0||
             (q.condition||'').toLowerCase().indexOf(kw)>=0||
             (q.explanation||'').toLowerCase().indexOf(kw)>=0||
             q.choices.some(function(c){return c.toLowerCase().indexOf(kw)>=0;});
    });
  }
  return qs;
}
function wrongCount(){
  var w=0;
  curData().forEach(function(s,si){s.questions.forEach(function(q){var k=si+'_'+q.number;if(state.answers[k]&&state.answers[k]!==q.answer&&!state.resolved[k])w++;});});
  return w;
}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
function highlight(s){
  return esc(s).replace(/(틀린|틀리지|옳지 않은|옳지않은|잘못된|아닌 것|아닌것)/g,'<span style="color:#ef4444;font-weight:700">$1</span>')
               .replace(/(옳은|맞는|올바른|모두 고른|모두고른)/g,'<span style="color:#2563eb;font-weight:700">$1</span>');
}

function toggleMenu(){
  var sd=document.getElementById('sidebar');
  var ov=document.getElementById('menu-overlay');
  if(sd.classList.contains('drawer-open')){sd.classList.remove('drawer-open');ov.classList.remove('open');}
  else{sd.classList.add('drawer-open');ov.classList.add('open');}
}
function closeMenu(){
  var sd=document.getElementById('sidebar');
  var ov=document.getElementById('menu-overlay');
  if(sd){sd.classList.remove('drawer-open');}
  if(ov){ov.classList.remove('open');}
}

function renderSidebar(){
  var w=wrongCount();
  var h='<div class="sidebar-close-btn" onclick="closeMenu()"><span style="font-size:20px">✕</span> 닫기</div>';
  h+='<div class="sidebar-section"><span class="sidebar-label">회차</span><div class="round-tabs">';
  h+='<button class="round-tab'+(state.examYear===36?' active':'')+'" onclick="selYear(36)">36회</button>';
  h+='<button class="round-tab'+(state.examYear===35?' active':'')+'" onclick="selYear(35)">35회</button>';
  h+='<button class="round-tab'+(state.examYear===34?' active':'')+'" onclick="selYear(34)">34회</button>';
  h+='<button class="round-tab'+(state.examYear===33?' active':'')+'" onclick="selYear(33)">33회</button>';
  h+='</div></div>';
  h+='<div class="sidebar-section"><span class="sidebar-label">1교시</span>';
  curData().forEach(function(s,i){if(s.session!==1)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><div class="sidebar-section"><span class="sidebar-label">2교시</span>';
  curData().forEach(function(s,i){if(s.session!==2)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><hr class="sidebar-divider"><div class="sidebar-section">';
  h+='<div class="sidebar-item" onclick="showWrong();closeMenu()">📕 오답노트'+(w>0?'<span class="sidebar-badge">'+w+'</span>':'')+'</div>';
  h+='<div class="sidebar-item" onclick="showStats()">📊 내 통계</div>';
  h+='<div class="sidebar-item" onclick="showPdf();closeMenu()">📥 PDF 다운로드</div>';
  h+='</div>';
  document.getElementById('sidebar').innerHTML=h;
}

function renderMain(){
  var s=subj();var qs=filteredQ();
  if(state.currentQ>=qs.length)state.currentQ=0;
  var done=s.questions.filter(function(q){return state.answers[qk(q)];}).length;
  var cor=s.questions.filter(function(q){return state.answers[qk(q)]===q.answer;}).length;
  var pct=s.questions.length?Math.round(done/s.questions.length*100):0;
  var h='<div class="page-header"><h1>'+s.subject+'</h1><p>'+s.exam+' ('+s.year+') &middot; '+s.questions.length+'문제 &middot; '+s.session+'교시</p></div>';
  h+='<div class="filter-bar">';
  h+='<button class="filter-btn'+(state.filter==='all'?' active':'')+'" onclick="setFilter(\'all\')">전체 '+s.questions.length+'문제</button>';
  h+='<button class="filter-btn'+(state.filter==='wrong'?' active':'')+'" onclick="setFilter(\'wrong\')">오답만</button>';
  h+='<button class="filter-btn'+(state.filter==='bm'?' active':'')+'" onclick="setFilter(\'bm\')">★ 북마크</button>';
  h+='<button class="filter-btn'+(state.examMode?' active':'')+'" onclick="toggleExamMode()" '+(state.examMode?'style="background:#fff3cd;border-color:#f59e0b;color:#92400e"':'')+'>&#x1F4DD; '+(state.examMode?'&#x2705; &#xC2DC;&#xD5D8;&#xBAA8;&#xB4DC;':'&#xC2DC;&#xD5D8;&#xBAA8;&#xB4DC;')+'</button>';
  if(state.examMode){h+='<button onclick="gradeExam()" style="padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;background:#ef4444;color:#fff;border:1.5px solid #ef4444">&#x1F4CB; &#xCC44;&#xC810;&#xD558;&#xAE30;</button>';}
  h+='<input type="text" id="searchBox" placeholder="&#x1F50D; &#xD0A4;&#xC6CC;&#xB4DC; &#xAC80;&#xC0C9;..." value="'+esc(state.search)+'" oninput="setSearch(this.value)" style="margin-left:auto;padding:5px 12px;border:1.5px solid #e2e8f0;border-radius:20px;font-size:13px;outline:none;width:180px">';
  h+='</div>';
  h+='<div class="progress-card"><div class="progress-info"><h3>학습 진도</h3>';
  h+='<div class="pbar-wrap"><div class="pbar-fill" style="width:'+pct+'%"></div></div>';
  h+='<div class="progress-text">'+done+'/'+s.questions.length+'문제 완료 &middot; 정답률 '+(done?Math.round(cor/done*100):0)+'%</div></div>';
  h+='<div class="progress-stats"><div class="stat"><div class="stat-num">'+cor+'</div><div class="stat-label">정답</div></div>';
  h+='<div class="stat"><div class="stat-num">'+(done-cor)+'</div><div class="stat-label">오답</div></div>';
  h+='<div class="stat"><div class="stat-num">'+(s.questions.length-done)+'</div><div class="stat-label">미풀이</div></div></div></div>';
  if(!qs.length){
    var emptyMsg=state.search?'"'+state.search+'" 검색 결과가 없어요!':state.filter==='wrong'?'오답이 없어요!':'해당 문제가 없어요!';
    h+='<div class="empty"><div style="font-size:48px">'+(state.search?'🔍':'🎉')+'</div><p>'+emptyMsg+'</p></div>';
    document.getElementById('main').innerHTML=h;return;
  }
  var q=qs[state.currentQ];var key=qk(q);
  var chosen=state.answers[key];var isAns=!!chosen;var isBm=!!state.bookmarks[key];
  var half=Math.ceil(qs.length/2);var r1='',r2='';
  qs.forEach(function(qq,i){
    var k=qk(qq);var a=state.answers[k];
    var cls='qn'+(i===state.currentQ?' current':a&&a===qq.answer?' answered':a?' wrong-q':'');
    var btn='<button class="'+cls+'" onclick="goTo('+i+')">'+qq.number+'</button>';
    if(i<half)r1+=btn;else r2+=btn;
  });
  h+='<div class="q-card"><div class="q-header"><span class="q-num">Q'+q.number+'</span><div class="q-actions">';
  if(state.filter==='wrong'&&isAns)h+='<button class="btn-resolve" onclick="resolve(\''+key+'\')">✓ 이해했어요</button>';
  h+='<button class="btn-icon'+(isBm?' bookmarked':'')+'" onclick="toggleBm(\''+key+'\')">'+(isBm?'★':'☆')+'</button>';
  h+='</div></div><div class="q-body"><div class="q-text">'+highlight(q.question)+'</div>';
  if(q.condition)h+='<div class="q-condition">'+esc(q.condition)+'</div>';
  h+='<div class="choices">';
  q.choices.forEach(function(c,i){
    var idx=i+1;var cls='choice'+(isAns?(state.examMode?' selected':(idx===q.answer?' correct':idx===chosen?' wrong':'')):'');
    h+='<button class="'+cls+'" onclick="pick(\''+key+'\','+idx+','+q.answer+')"'+(isAns?' disabled':'')+'>'+esc(c)+'</button>';
  });
  h+='</div><div class="explanation'+(isAns?' show':'')+'"><div class="explanation-title">💡 해설</div>'+esc(q.explanation)+'</div>';
  h+='</div><div class="q-footer"><div class="q-nums"><div class="q-nums-row">'+r1+'</div><div class="q-nums-row">'+r2+'</div></div>';
  h+='<button class="btn-next" onclick="nextQ()">다음 →</button></div></div>';
  document.getElementById('main').innerHTML=h;
}

function selYear(y){state.examYear=y;state.subjectIdx=0;state.currentQ=0;state.filter='all';state.search='';renderSidebar();renderMain();closeMenu();}
function selSubj(i){state.subjectIdx=i;state.currentQ=0;state.filter='all';state.search='';renderSidebar();renderMain();closeMenu();}
function setFilter(f){state.filter=f;state.currentQ=0;renderMain();}
var _sTimer=null;
function setSearch(v){
  state.search=v;state.currentQ=0;
  clearTimeout(_sTimer);
  _sTimer=setTimeout(function(){
    renderMain();
    var nb=document.getElementById('searchBox');
    if(nb){nb.value=state.search;nb.focus();}
  },300);
}
function goTo(i){state.currentQ=i;renderMain();}
function nextQ(){var qs=filteredQ();if(state.currentQ<qs.length-1){state.currentQ++;renderMain();}else alert('마지막 문제예요!');}
function pick(key,c,ans){if(state.answers[key])return;state.answers[key]=c;saveS();renderMain();renderSidebar();}
function toggleBm(key){state.bookmarks[key]=!state.bookmarks[key];saveS();renderMain();renderSidebar();}
function resolve(key){state.resolved[key]=true;saveS();var qs=filteredQ();if(state.currentQ>=qs.length)state.currentQ=Math.max(0,qs.length-1);renderMain();renderSidebar();}
function showWrong(){
  var d=curData();
  for(var i=0;i<d.length;i++){
    if(d[i].questions.some(function(q){var k=i+'_'+q.number;return state.answers[k]&&state.answers[k]!==q.answer&&!state.resolved[k];})){
      state.subjectIdx=i;state.filter='wrong';state.currentQ=0;renderSidebar();renderMain();return;
    }
  }
  alert('오답이 없어요! 🎉');
}
function showStats(){
  var msg='📊 내 통계 ('+state.examYear+'회)\n\n';
  curData().forEach(function(s,i){
    var d=s.questions.filter(function(q){return state.answers[i+'_'+q.number];}).length;
    var c=s.questions.filter(function(q){return state.answers[i+'_'+q.number]===q.answer;}).length;
    msg+=s.subject+'\n  풀기: '+d+'/'+s.questions.length+' · 정답률: '+(d?Math.round(c/d*100):0)+'%\n\n';
  });
  alert(msg);
}
function showPdf(){
  var pdfs=[
    {label:'제36회 기출문제+정답 (2025)', n:'36'},
    {label:'제35회 기출문제+정답 (2024)', n:'35'},
    {label:'제34회 기출문제+정답 (2023)', n:'34'},
    {label:'제33회 기출문제+정답 (2022)', n:'33'},
    {label:'제32회 기출문제+정답 (2021)', n:'32'},
    {label:'제31회 기출문제+정답 (2020)', n:'31'},
    {label:'제30회 기출문제+정답 (2019)', n:'30'},
    {label:'제29회 기출문제+정답 (2018)', n:'29'},
    {label:'제28회 기출문제+정답 (2017)', n:'28'},
    {label:'제27회 기출문제+정답 (2016)', n:'27'},
    {label:'제26회 기출문제+정답 (2015)', n:'26'},
    {label:'제25회 기출문제+정답 (2014)', n:'25'},
    {label:'제24회 기출문제+정답 (2013)', n:'24'},
    {label:'제23회 기출문제+정답 (2012)', n:'23'},
    {label:'제22회 기출문제+정답 (2011)', n:'22'},
    {label:'제21회 기출문제+정답 (2010)', n:'21'},
    {label:'제20회 기출문제+정답 (2009)', n:'20'},
    {label:'제19회 기출문제+정답 (2008)', n:'19'},
    {label:'제18회 기출문제+정답 (2007)', n:'18'},
    {label:'제17회 기출문제+정답 (2006)', n:'17'},
    {label:'제16회 기출문제+정답 (2005)', n:'16'},
    {label:'제15회 기출문제+정답 (2004)', n:'15'},
  ];
  var h='<div style="padding:20px"><h2 style="margin-bottom:16px;font-size:18px;font-weight:800">📥 기출문제 PDF 다운로드</h2>';
  pdfs.forEach(function(p){
    var file='공인중개사_'+p.n+'회.pdf';
    h+='<a href="'+file+'" download style="display:flex;align-items:center;gap:10px;padding:12px 16px;margin-bottom:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;text-decoration:none;color:#1e293b;font-size:14px;font-weight:600">';
    h+='<span style="font-size:20px">📄</span>'+p.label+'<span style="margin-left:auto;color:#2563eb;font-size:12px">다운로드</span></a>';
  });
  h+='<p style="font-size:12px;color:#94a3b8;margin-top:12px">※ 파일명 형식: 공인중개사_N회.pdf</p>';
  h+='<button onclick="renderMain()" style="margin-top:12px;padding:8px 20px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 돌아가기</button></div>';
  document.getElementById('main').innerHTML=h;
}
function toggleExamMode(){
  if(!state.examMode){
    var s=subj();
    s.questions.forEach(function(q){delete state.answers[qk(q)];});
    saveS();
    state.examMode=true;
  } else {
    state.examMode=false;
  }
  state.currentQ=0;
  renderSidebar();
  renderMain();
}
function gradeExam(){
  state.examMode=false;
  var s=subj();
  var done=s.questions.filter(function(q){return state.answers[qk(q)];}).length;
  var cor=s.questions.filter(function(q){return state.answers[qk(q)]===q.answer;}).length;
  renderSidebar();
  renderMain();
  showScore(cor,done,s.questions.length,s.subject);
}
function closeScore(){var el=document.getElementById('score-overlay');if(el)el.remove();}
function showScore(cor,done,total,subjectName){
  var score=Math.round(cor/total*100);
  var emoji=score>=80?'&#x1F389;':score>=60?'&#x1F44D;':'&#x1F4AA;';
  var h='<div id="score-overlay" onclick="if(event.target===this)closeScore()" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:500;display:flex;align-items:center;justify-content:center">';
  h+='<div style="background:#fff;border-radius:24px;padding:36px 44px;text-align:center;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3)">';
  h+='<div style="font-size:52px">'+emoji+'</div>';
  h+='<p style="font-size:13px;color:#64748b;margin:8px 0 4px">'+subjectName+'</p>';
  h+='<h2 style="font-size:42px;font-weight:900;color:#2563eb;margin:8px 0">'+score+'<span style="font-size:22px">&#xC810;</span></h2>';
  h+='<p style="font-size:16px;color:#475569;margin:4px 0">&#x1F3AF; '+cor+' / '+total+' &#xC815;&#xB2F5;</p>';
  if(done<total){h+='<p style="font-size:12px;color:#f59e0b;margin-top:6px">&#x26A0;&#xFE0F; &#xBBF8;&#xD480;&#xC774; '+(total-done)+'&#xBB38;&#xC81C; &#xD3EC;&#xD568;</p>';}
  h+='<button onclick="closeScore()" style="margin-top:24px;padding:12px 36px;background:#2563eb;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;width:100%">&#xD655;&#xC778;</button>';
  h+='</div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}
try {
  if(typeof EXAM_DATA_36==='undefined'){throw new Error('36í ë°ì´í° ë¡ë ì¤í¨');}
  renderSidebar();
  renderMain();
} catch(e) {
  document.getElementById('main').innerHTML='<div style="text-align:center;padding:60px 20px"><div style="font-size:48px">&#x1F625;</div><p style="font-size:16px;font-weight:700;color:#1e293b;margin:16px 0 8px">&#xB370;&#xC774;&#xD130;&#xB97C; &#xBD88;&#xB7EC;&#xC624;&#xC9C0; &#xBABB;&#xD588;&#xC5B4;&#xC694;</p><p style="font-size:13px;color:#64748b;margin-bottom:20px">&#xD398;&#xC774;&#xC9C0;&#xB97C; &#xC0C8;&#xB85C;&#xACE0;&#xCE68; &#xD574;&#xC8FC;&#xC138;&#xC694;</p><button onclick="location.reload()" style="padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">&#xC0C8;&#xB85C;&#xACE0;&#xCE68;</button></div>';
}
