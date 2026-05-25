var EXAM_DATA={36:EXAM_DATA_36,35:EXAM_DATA_35};
var state={examYear:36,subjectIdx:0,filter:'all',currentQ:0,answers:{},bookmarks:{},resolved:{},adminMode:false,editTarget:null};
function saveS(){try{localStorage.setItem('gh',JSON.stringify({a:state.answers,b:state.bookmarks,r:state.resolved}));}catch(e){}}
function loadS(){try{var s=JSON.parse(localStorage.getItem('gh')||'{}');state.answers=s.a||{};state.bookmarks=s.b||{};state.resolved=s.r||{};}catch(e){}}
loadS();
function curData(){return EXAM_DATA[state.examYear]||EXAM_DATA_36;}
function subj(){return curData()[state.subjectIdx];}
function qk(q){return state.subjectIdx+'_'+q.number;}
function filteredQ(){
  var qs=subj().questions;
  if(state.filter==='wrong')return qs.filter(function(q){var a=state.answers[qk(q)];return a&&a!==q.answer&&!state.resolved[qk(q)];});
  if(state.filter==='bm')return qs.filter(function(q){return state.bookmarks[qk(q)];});
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

function renderSidebar(){
  var w=wrongCount();
  var h='<div class="sidebar-section"><span class="sidebar-label">회차</span><div class="round-tabs">';
  h+='<button class="round-tab'+(state.examYear===36?' active':'')+'" onclick="selYear(36)">36회</button>';
  h+='<button class="round-tab'+(state.examYear===35?' active':'')+'" onclick="selYear(35)">35회</button>';
  h+='<button class="round-tab disabled" onclick="alert(\'34회 준비중!\')">34회</button>';
  h+='<button class="round-tab disabled" onclick="alert(\'33회 준비중!\')">33회</button>';
  h+='</div></div>';
  h+='<div class="sidebar-section"><span class="sidebar-label">1교시</span>';
  curData().forEach(function(s,i){if(s.session!==1)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><div class="sidebar-section"><span class="sidebar-label">2교시</span>';
  curData().forEach(function(s,i){if(s.session!==2)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><hr class="sidebar-divider"><div class="sidebar-section">';
  h+='<div class="sidebar-item" onclick="showWrong()">📕 오답노트'+(w>0?'<span class="sidebar-badge">'+w+'</span>':'')+'</div>';
  h+='<div class="sidebar-item" onclick="showStats()">📊 내 통계</div>';
  h+='<div class="sidebar-item" onclick="showPdf()">📥 PDF 다운로드</div>';
  h+='</div>';
  if(state.adminMode){
    h+='<hr class="sidebar-divider"><div class="sidebar-section">';
    h+='<div class="sidebar-item" onclick="copyDataJson()" style="color:#a16207;font-weight:700">📋 데이터 JSON 복사</div>';
    h+='</div>';
  }
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
  h+='</div><div class="explanation'+(isAns?' show':'')+'"><div class="explanation-title">💡 해설</div>'+esc(q.explanation)+'</div>';
  h+='</div><div class="q-footer"><div class="q-nums"><div class="q-nums-row">'+r1+'</div><div class="q-nums-row">'+r2+'</div></div>';
  h+='<button class="btn-next" onclick="nextQ()">다음 →</button></div></div>';
  document.getElementById('main').innerHTML=h;
}

function selYear(y){state.examYear=y;state.subjectIdx=0;state.currentQ=0;state.filter='all';renderSidebar();renderMain();}
function selSubj(i){state.subjectIdx=i;state.currentQ=0;state.filter='all';renderSidebar();renderMain();}
function setFilter(f){state.filter=f;state.currentQ=0;renderMain();}
function goTo(i){state.currentQ=i;renderMain();}
function nextQ(){var qs=filteredQ();if(state.currentQ<qs.length-1){state.currentQ++;renderMain();}else alert('마지막 문제예요!');}
function pick(key,c,ans){if(state.answers[key])return;state.answers[key]=c;saveS();renderMain();renderSidebar();}
function toggleBm(key){state.bookmarks[key]=!state.bookmarks[key];saveS();renderMain();renderSidebar();}
function resolve(key){state.resolved[key]=true;saveS();var qs=filteredQ();if(state.currentQ>=qs.length)state.currentQ=Math.max(0,qs.length-1);renderMain();renderSidebar();}
function toggleAdmin(){state.adminMode=!state.adminMode;renderMain();alert(state.adminMode?'관리자 모드 ON':'관리자 모드 OFF');}
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
function copyDataJson(){
  var data=curData();
  var yr=state.examYear;
  var out='const EXAM_DATA_'+yr+' = [\n';
  data.forEach(function(s,si){
    out+='  {\n';
    out+='    subject: '+JSON.stringify(s.subject)+',\n';
    out+='    session: '+s.session+',\n';
    out+='    exam: '+JSON.stringify(s.exam)+',\n';
    out+='    year: '+s.year+',\n';
    out+='    questions: [\n';
    s.questions.forEach(function(q,qi){
      out+='      {\n';
      out+='        number: '+q.number+',\n';
      out+='        question: '+JSON.stringify(q.question)+',\n';
      out+='        condition: '+(q.condition?JSON.stringify(q.condition):'null')+',\n';
      out+='        choices: [\n';
      q.choices.forEach(function(c){out+='          '+JSON.stringify(c)+',\n';});
      out+='        ],\n';
      out+='        answer: '+q.answer+',\n';
      out+='        explanation: '+JSON.stringify(q.explanation||'')+',\n';
      out+='        hasImage: '+(q.hasImage?'true':'false')+'\n';
      out+='      }'+(qi<s.questions.length-1?',':'')+'\n';
    });
    out+='    ]\n';
    out+='  }'+(si<data.length-1?',':'')+'\n';
  });
  out+='];';
  if(navigator.clipboard){
    navigator.clipboard.writeText(out).then(function(){
      alert('✅ '+yr+'회 전체 데이터가 클립보드에 복사됐어요!\nexam_data_'+yr+'.js 파일에 붙여넣기 하세요.');
    }).catch(function(){
      var ta=document.createElement('textarea');ta.value=out;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
      alert('✅ 복사됐어요! exam_data_'+yr+'.js에 붙여넣기 하세요.');
    });
  } else {
    var ta=document.createElement('textarea');ta.value=out;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    alert('✅ 복사됐어요! exam_data_'+yr+'.js에 붙여넣기 하세요.');
  }
}
function showPdf(){
  var pdfs=[
    {label:'제36회 기출문제 (2025)', file:'36회_기출.pdf'},
    {label:'제35회 기출문제 (2024)', file:'35회_기출.pdf'},
    {label:'제34회 기출문제 (2023)', file:'34회_기출.pdf'},
    {label:'제33회 기출문제 (2022)', file:'33회_기출.pdf'},
    {label:'제32회 기출문제 (2021)', file:'32회_기출.pdf'},
    {label:'제31회 기출문제 (2020)', file:'31회_기출.pdf'},
    {label:'제30회 기출문제 (2019)', file:'30회_기출.pdf'},
  ];
  var h='<div style="padding:20px"><h2 style="margin-bottom:16px;font-size:18px;font-weight:800">📥 기출문제 PDF 다운로드</h2>';
  pdfs.forEach(function(p){
    h+='<a href="'+p.file+'" download style="display:flex;align-items:center;gap:10px;padding:12px 16px;margin-bottom:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;text-decoration:none;color:#1e293b;font-size:14px;font-weight:600">';
    h+='<span style="font-size:20px">📄</span>'+p.label+'<span style="margin-left:auto;color:#2563eb;font-size:12px">다운로드</span></a>';
  });
  h+='<p style="font-size:12px;color:#94a3b8;margin-top:12px">※ 파일명 형식: 회차_기출.pdf</p>';
  h+='<button onclick="renderMain()" style="margin-top:12px;padding:8px 20px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 돌아가기</button></div>';
  document.getElementById('main').innerHTML=h;
}
renderSidebar();
renderMain();
