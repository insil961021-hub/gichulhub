var state={examYear:36,subjectIdx:0,filter:'all',searchQ:'',currentQ:0,answers:{},bookmarks:{},resolved:{},adminMode:false,editTarget:null};
var EXAM_DATA={36:EXAM_DATA_36,35:EXAM_DATA_35};
var EXAM_YEARS={36:{label:'36회',full:true},35:{label:'35회',full:false},34:{label:'34회',full:false},33:{label:'33회',full:false}};
function saveS(){try{localStorage.setItem('gh',JSON.stringify({a:state.answers,b:state.bookmarks,r:state.resolved}));}catch(e){}}
function loadS(){try{var s=JSON.parse(localStorage.getItem('gh')||'{}');state.answers=s.a||{};state.bookmarks=s.b||{};state.resolved=s.r||{};}catch(e){}}
loadS();
function curData(){return EXAM_DATA[state.examYear]||EXAM_DATA_36;}
function subj(){return curData()[state.subjectIdx];}
function qk(q){return state.examYear+'_'+state.subjectIdx+'_'+q.number;}
var CHOSUNG=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function getChosung(s){var r='';for(var i=0;i<s.length;i++){var c=s.charCodeAt(i)-0xAC00;if(c>=0&&c<=11171)r+=CHOSUNG[Math.floor(c/588)];else r+=s[i];}return r;}
function isOnlyJamo(s){return /^[ㄱ-ㅎ]+$/.test(s);}
function matchSearch(text,kw){if(!text)return false;if(isOnlyJamo(kw))return getChosung(text).indexOf(kw)>=0;return text.toLowerCase().indexOf(kw.toLowerCase())>=0;}
function filteredQ(){
  var qs=subj().questions;
  if(state.filter==='wrong')qs=qs.filter(function(q){var a=state.answers[qk(q)];return a&&a!==q.answer&&!state.resolved[qk(q)];});
  if(state.filter==='bm')qs=qs.filter(function(q){return state.bookmarks[qk(q)];});
  if(state.searchQ){
    var kw=state.searchQ;
    qs=qs.filter(function(q){
      return matchSearch(q.question,kw)||matchSearch(q.condition,kw)||matchSearch(q.explanation,kw)||
             q.choices.some(function(c){return matchSearch(c,kw);});
    });
  }
  return qs;
}
function wrongCount(){
  var w=0;
  curData().forEach(function(s,si){s.questions.forEach(function(q){var k=state.examYear+'_'+si+'_'+q.number;if(state.answers[k]&&state.answers[k]!==q.answer&&!state.resolved[k])w++;});});
  return w;
}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
function highlight(s){
  return esc(s).replace(/(틀린|틀리지|옳지 않은|옳지않은|잘못된|아닌 것|아닌것|않는 것|않는것)/g,'<span style="color:#ef4444;font-weight:700">$1</span>')
               .replace(/(옳은|맞는|올바른|모두 고른|모두고른)/g,'<span style="color:#2563eb;font-weight:700">$1</span>');
}

function renderSidebar(){
  var w=wrongCount();
  var h='<div class="sidebar-section"><span class="sidebar-label">회차</span><div class="round-tabs">';
  h+='<button class="round-tab'+(state.examYear===36?' active':'')+'" onclick="selYear(36)">36회</button>';
  h+='<button class="round-tab'+(state.examYear===35?' active':'')+'" onclick="selYear(35)">35회 <span style="font-size:10px;color:#f59e0b">일부</span></button>';
  h+='<button class="round-tab disabled" onclick="alert(\'34회 준비중!\')">34회</button>';
  h+='<button class="round-tab disabled" onclick="alert(\'33회 준비중!\')">33회</button>';
  h+='</div></div>';
  h+='<div class="sidebar-section"><span class="sidebar-label">1교시</span>';
  curData().forEach(function(s,i){if(s.session!==1)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><div class="sidebar-section"><span class="sidebar-label">2교시</span>';
  curData().forEach(function(s,i){if(s.session!==2)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><hr class="sidebar-divider"><div class="sidebar-section">';
  h+='<div class="sidebar-item" onclick="showWrong()" style="'+(w>0?'color:#ef4444;font-weight:700':'')+'">📕 오답노트'+(w>0?'<span class="sidebar-badge">'+w+'</span>':'')+'</div>';
  h+='<div class="sidebar-item" onclick="showStats()">📊 내 통계</div>';
  h+='<div class="sidebar-item" onclick="showPdf()">📥 PDF 다운로드</div>';
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
  h+='</div>';
  h+='<div class="progress-card"><div class="progress-info"><h3>학습 진도</h3>';
  h+='<div class="pbar-wrap"><div class="pbar-fill" style="width:'+pct+'%"></div></div>';
  h+='<div class="progress-text">'+done+'/'+s.questions.length+'문제 완료 &middot; 정답률 '+(done?Math.round(cor/done*100):0)+'%</div></div>';
  h+='<div class="progress-stats"><div class="stat"><div class="stat-num">'+cor+'</div><div class="stat-label">정답</div></div>';
  h+='<div class="stat"><div class="stat-num">'+(done-cor)+'</div><div class="stat-label">오답</div></div>';
  h+='<div class="stat"><div class="stat-num">'+(s.questions.length-done)+'</div><div class="stat-label">미풀이</div></div></div></div>';
  if(!qs.length){
    h+='<div class="empty"><div style="font-size:48px">🎉</div><p>'+(state.filter==='wrong'?'오답이 없어요!':'해당 문제가 없어요!')+'</p></div>';
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
  if(state.adminMode)h+='<button class="btn-edit-q" onclick="openEdit('+state.subjectIdx+','+q.number+')">✏️ 수정</button>';
  h+='</div></div><div class="q-body"><div class="q-text">'+highlight(q.question)+'</div>';
  if(q.condition)h+='<div class="q-condition">'+esc(q.condition)+'</div>';
  h+='<div class="choices">';
  q.choices.forEach(function(c,i){
    var idx=i+1;var cls='choice'+(isAns?(idx===q.answer?' correct':idx===chosen?' wrong':''):'');
    h+='<button class="'+cls+'" onclick="pick(\''+key+'\','+idx+','+q.answer+')"'+(isAns?' disabled':'')+'>'+esc(c)+'</button>';
  });
  h+='</div>';if(q.explanation)h+='<div class="explanation'+(isAns?' show':'')+'"><div class="explanation-title">💡 해설</div>'+esc(q.explanation)+'</div>';
  h+='</div><div class="q-footer"><div class="q-nums"><div class="q-nums-row">'+r1+'</div><div class="q-nums-row">'+r2+'</div></div>';
  h+='<button class="btn-next" onclick="nextQ()">다음 →</button></div></div>';
  document.getElementById('main').innerHTML=h;
}

function selYear(y){
  if(!EXAM_DATA[y])return alert('준비중!');
  state.examYear=y;state.subjectIdx=0;state.currentQ=0;state.filter='all';state.searchQ='';
  var inp=document.getElementById('searchInput');if(inp)inp.value='';
  var btn=document.getElementById('searchClearBtn');if(btn)btn.style.display='none';
  var msg=document.getElementById('searchMsg');if(msg)msg.textContent='';
  renderSidebar();renderMain();
}
function selSubj(i){
  state.subjectIdx=i;state.currentQ=0;state.filter='all';state.searchQ='';
  var inp=document.getElementById('searchInput');if(inp)inp.value='';
  var btn=document.getElementById('searchClearBtn');if(btn)btn.style.display='none';
  var msg=document.getElementById('searchMsg');if(msg)msg.textContent='';
  renderSidebar();renderMain();
}
function setFilter(f){state.filter=f;state.currentQ=0;renderMain();}
var searchTimer=null;
function doSearch(v){
  state.searchQ=v;state.currentQ=0;
  var btn=document.getElementById('searchClearBtn');
  if(btn)btn.style.display=v?'block':'none';
  clearTimeout(searchTimer);
  searchTimer=setTimeout(function(){
    var msg=document.getElementById('searchMsg');
    if(msg)msg.textContent=v?'"'+v+'" 검색 결과: '+filteredQ().length+'문제':'';
    renderMain();
  },300);
}
function goTo(i){state.currentQ=i;renderMain();}
function nextQ(){var qs=filteredQ();if(state.currentQ<qs.length-1){state.currentQ++;renderMain();}else alert('마지막 문제예요!');}
function pick(key,c,ans){if(state.answers[key])return;state.answers[key]=c;saveS();renderMain();renderSidebar();}
function toggleBm(key){state.bookmarks[key]=!state.bookmarks[key];saveS();renderMain();renderSidebar();}
function resolve(key){state.resolved[key]=true;saveS();var qs=filteredQ();if(state.currentQ>=qs.length)state.currentQ=Math.max(0,qs.length-1);renderMain();renderSidebar();}
// =============================================
// ✏️  관리자 비밀번호를 여기서 바꾸세요!
var ADMIN_PW = 'gichul1234';
// =============================================
function toggleAdmin(){
  if(state.adminMode){state.adminMode=false;renderMain();return;}
  var pw=prompt('관리자 비밀번호를 입력하세요');
  if(pw===ADMIN_PW){state.adminMode=true;renderMain();alert('관리자 모드 ON ✅');}
  else if(pw!==null){alert('비밀번호가 틀렸어요 ❌');}
}
function showWrong(){
  var data=curData();
  for(var i=0;i<data.length;i++){
    var ii=i;
    if(data[i].questions.some(function(q){var k=state.examYear+'_'+ii+'_'+q.number;return state.answers[k]&&state.answers[k]!==q.answer&&!state.resolved[k];})){
      state.subjectIdx=i;state.filter='wrong';state.currentQ=0;renderSidebar();renderMain();return;
    }
  }
  alert('오답이 없어요! 🎉');
}
function showStats(){
  var msg='📊 내 통계 ('+state.examYear+'회)\n\n';
  curData().forEach(function(s,i){
    var d=s.questions.filter(function(q){return state.answers[state.examYear+'_'+i+'_'+q.number];}).length;
    var c=s.questions.filter(function(q){return state.answers[state.examYear+'_'+i+'_'+q.number]===q.answer;}).length;
    msg+=s.subject+'\n  풀기: '+d+'/'+s.questions.length+' · 정답률: '+(d?Math.round(c/d*100):0)+'%\n\n';
  });
  alert(msg);
}
function openEdit(si,qn){
  var s=curData()[si];var q=null;
  for(var i=0;i<s.questions.length;i++){if(s.questions[i].number===qn){q=s.questions[i];break;}}
  if(!q)return;
  state.editTarget={si:si,qn:qn};
  document.getElementById('eNum').value=s.subject+' Q'+qn;
  document.getElementById('eQ').value=q.question;
  document.getElementById('eCond').value=q.condition||'';
  document.getElementById('eAns').value=q.answer;
  document.getElementById('eExp').value=q.explanation;
  var ch='';
  q.choices.forEach(function(c,i){ch+='<div class="fg"><label>'+c.substring(0,2)+'</label><textarea id="ec'+i+'" rows="2">'+c.substring(2).trim()+'</textarea></div>';});
  document.getElementById('eChoices').innerHTML=ch;
  document.getElementById('editModal').classList.add('show');
}
function closeEdit(){document.getElementById('editModal').classList.remove('show');}
function saveEdit(){
  var t=state.editTarget;var s=curData()[t.si];var q=null;
  for(var i=0;i<s.questions.length;i++){if(s.questions[i].number===t.qn){q=s.questions[i];break;}}
  q.question=document.getElementById('eQ').value;
  q.condition=document.getElementById('eCond').value||null;
  q.answer=parseInt(document.getElementById('eAns').value);
  q.explanation=document.getElementById('eExp').value;
  var sym=['①','②','③','④','⑤'];
  q.choices=sym.map(function(s,i){return s+' '+document.getElementById('ec'+i).value;});
  closeEdit();renderMain();alert('저장됐어요!');
}
function showPdf(){
  var pdfs=[
    {label:'제36회 (2025)',file:'36회_기출.pdf'},{label:'제35회 (2024)',file:'35회_기출.pdf'},
    {label:'제34회 (2023)',file:'34회_기출.pdf'},{label:'제33회 (2022)',file:'33회_기출.pdf'},
    {label:'제32회 (2021)',file:'32회_기출.pdf'},{label:'제31회 (2020)',file:'31회_기출.pdf'},
    {label:'제30회 (2019)',file:'30회_기출.pdf'},{label:'제29회 (2018)',file:'29회_기출.pdf'},
    {label:'제28회 (2017)',file:'28회_기출.pdf'},{label:'제27회 (2016)',file:'27회_기출.pdf'},
    {label:'제26회 (2015)',file:'26회_기출.pdf'},{label:'제25회 (2014)',file:'25회_기출.pdf'},
    {label:'제24회 (2013)',file:'24회_기출.pdf'},{label:'제23회 (2012)',file:'23회_기출.pdf'},
    {label:'제22회 (2011)',file:'22회_기출.pdf'},{label:'제21회 (2010)',file:'21회_기출.pdf'},
    {label:'제20회 (2009)',file:'20회_기출.pdf'},{label:'제19회 (2008)',file:'19회_기출.pdf'},
    {label:'제18회 (2007)',file:'18회_기출.pdf'},{label:'제17회 (2006)',file:'17회_기출.pdf'},
    {label:'제16회 (2005)',file:'16회_기출.pdf'},{label:'제15회 (2004)',file:'15회_기출.pdf'},
  ];
  var h='<div style="padding:20px"><h2 style="margin-bottom:16px;font-size:18px;font-weight:800">📥 기출문제 PDF 다운로드</h2>';
  pdfs.forEach(function(p){
    h+='<a href="'+p.file+'" download style="display:flex;align-items:center;gap:10px;padding:12px 16px;margin-bottom:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;text-decoration:none;color:#1e293b;font-size:14px;font-weight:600">';
    h+='<span style="font-size:20px">📄</span>'+p.label+'<span style="margin-left:auto;color:#2563eb;font-size:12px">다운로드</span></a>';
  });
  h+='<p style="font-size:12px;color:#94a3b8;margin-top:12px">※ 파일이 없으면 준비중이에요</p>';
  h+='<button onclick="renderMain()" style="margin-top:12px;padding:8px 20px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 돌아가기</button></div>';
  document.getElementById('main').innerHTML=h;
}
renderSidebar();
renderMain();
