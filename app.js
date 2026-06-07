var EXAM_DATA={36:EXAM_DATA_36,35:EXAM_DATA_35,34:EXAM_DATA_34,33:EXAM_DATA_33,32:EXAM_DATA_32,31:EXAM_DATA_31,30:EXAM_DATA_30};
var SUPA_URL='https://pwodhvrsokcvemskrqpw.supabase.co';
var SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3b2RodnJzb2tjdmVtc2tycXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTk1MjIsImV4cCI6MjA5NTQ3NTUyMn0.FmcmggWVjmhRmeE_j2HvUAQbDA1AXYHTAOFw-o_Sb3Y';
var _supa=(window.supabase&&window.supabase.createClient)?window.supabase.createClient(SUPA_URL,SUPA_KEY):null;
var _user=null;
var _dbQuestions={};
var state={examYear:36,subjectIdx:0,filter:'all',search:'',currentQ:0,answers:{},bookmarks:{},resolved:{},examMode:false};
var _myBooks=[];var _mbActive=null;var _mbQ=0;var _mbAns={};var _mbBm={};var _mbChoiceCount=5;
var _navMode='exam';var _mbExpStyle='friendly';var _mbManualQs=[];var _jijunSubj=0;var _jijunChecked={};var _jijunBlankMode=false;var _jijunViewMode='all';
function loadJijunChecked(){try{_jijunChecked=JSON.parse(localStorage.getItem('gh_jijun')||'{}');}catch(e){_jijunChecked={};}}
function saveJijunChecked(){try{localStorage.setItem('gh_jijun',JSON.stringify(_jijunChecked));}catch(e){}}
loadJijunChecked();
function toggleJijunCheck(key){
  if(_jijunChecked[key]){delete _jijunChecked[key];}else{_jijunChecked[key]=true;}
  saveJijunChecked();
  var btn=document.getElementById('jc_'+key);
  if(btn){btn.innerHTML=_jijunChecked[key]?'★':'☆';btn.style.color=_jijunChecked[key]?'#f59e0b':'#cbd5e1';}
}
var _jijunCustomBlanks={};
function loadJijunCustom(){try{_jijunCustomBlanks=JSON.parse(localStorage.getItem('gh_jijun_custom')||'{}');}catch(e){_jijunCustomBlanks={};}}
function saveJijunCustom(){try{localStorage.setItem('gh_jijun_custom',JSON.stringify(_jijunCustomBlanks));}catch(e){}}
loadJijunCustom();
function revealBlank(el){
  el.innerHTML=el.getAttribute('data-ans');
  el.style.background='#dcfce7';el.style.color='#166534';el.style.borderColor='#16a34a';el.style.cursor='default';
  el.onclick=null;
}
function resetBlanks(){showJijun();}
function toggleCustomBlank(itemKey,wordIdx){
  if(!_jijunCustomBlanks[itemKey])_jijunCustomBlanks[itemKey]=[];
  var arr=_jijunCustomBlanks[itemKey];
  var pos=arr.indexOf(wordIdx);
  if(pos>=0){arr.splice(pos,1);}else{arr.push(wordIdx);}
  saveJijunCustom();
  showJijun();
}
function makeBlankHtml(text,itemKey){
  // Step 1: parse text into parts (text segments and auto-blanks)
  // to avoid CSS string contamination, we parse BEFORE making HTML
  var parts=[];
  var pattern=/「([^」]+)」|(\d[\d,\.]*(?:\s*(?:%|m²|㎡|층|년|개월|일|만원|억|천|m|km|㎝))?)/g;
  var last=0;var m;
  while((m=pattern.exec(text))!==null){
    if(m.index>last)parts.push({type:'text',val:text.slice(last,m.index)});
    if(m[1]!==undefined){
      parts.push({type:'text',val:'「'});
      parts.push({type:'auto',val:m[1]});
      parts.push({type:'text',val:'」'});
    }else{
      parts.push({type:'auto',val:m[0]});
    }
    last=pattern.lastIndex;
  }
  if(last<text.length)parts.push({type:'text',val:text.slice(last)});
  // Step 2: split text parts into words for custom blank support
  var customSet={};
  var custom=_jijunCustomBlanks[itemKey]||[];
  custom.forEach(function(i){customSet[i]=true;});
  var wordIdx=0;
  var h='';
  var blankStyle='display:inline-block;background:#eff6ff;color:transparent;border-bottom:2px solid #93c5fd;border-radius:3px;padding:0 3px;cursor:pointer;';
  parts.forEach(function(part){
    if(part.type==='auto'){
      var w=part.val;var minW=w.length>4?'50px':'22px';
      h+='<span class="jb" onclick="revealBlank(this)" data-ans="'+esc(w)+'" style="'+blankStyle+'min-width:'+minW+'">　</span>';
    }else{
      // Split by spaces to make each word clickable
      var tokens=part.val.split(/(\s+)/);
      tokens.forEach(function(tok){
        if(/^\s+$/.test(tok)){h+=tok;return;}
        if(tok===''){return;}
        var wi=wordIdx++;
        var isBlank=customSet[wi];
        if(isBlank){
          var minW2=tok.length>4?Math.round(tok.length*7)+'px':'30px';
          h+='<span class="jb jb-custom" onclick="revealBlank(this)" data-ans="'+esc(tok)+'" data-wi="'+wi+'" data-ik="'+itemKey+'" style="'+blankStyle+'min-width:'+minW2+'">　</span>';
        }else{
          h+='<span class="jw" onclick="toggleCustomBlank(\''+itemKey+'\','+wi+')" data-wi="'+wi+'" style="cursor:pointer;border-radius:3px;padding:0 1px" title="클릭해서 빈칸으로">'+esc(tok)+'</span>';
        }
      });
    }
  });
  return h;
}
function saveS(){try{localStorage.setItem('gh_v2',JSON.stringify({a:state.answers,b:state.bookmarks,r:state.resolved}));}catch(e){}}
function loadS(){
  try{
    var v2=localStorage.getItem('gh_v2');
    if(v2){var s=JSON.parse(v2);state.answers=s.a||{};state.bookmarks=s.b||{};state.resolved=s.r||{};return;}
    // 기존 데이터(연도 없는 키) → 36회로 마이그레이션
    var old=JSON.parse(localStorage.getItem('gh')||'{}');
    var na={};var nb={};var nr={};
    Object.keys(old.a||{}).forEach(function(k){na['36_'+k]=(old.a||{})[k];});
    Object.keys(old.b||{}).forEach(function(k){nb['36_'+k]=(old.b||{})[k];});
    Object.keys(old.r||{}).forEach(function(k){nr['36_'+k]=(old.r||{})[k];});
    state.answers=na;state.bookmarks=nb;state.resolved=nr;
    saveS();
  }catch(e){state.answers={};state.bookmarks={};state.resolved={};}
}
loadS();
function loadMyBooksLocal(){try{_myBooks=JSON.parse(localStorage.getItem('gh_mybooks')||'[]');}catch(e){_myBooks=[];}}
function saveMyBooksLocal(){try{localStorage.setItem('gh_mybooks',JSON.stringify(_myBooks));}catch(e){}}
loadMyBooksLocal();
function curData(){
  var base=EXAM_DATA[state.examYear]||EXAM_DATA_36;
  var ydb=_dbQuestions[state.examYear];
  if(!ydb)return base;
  return base.map(function(s){
    var sdb=ydb[s.subject];
    if(!sdb)return s;
    return {year:s.year,exam:s.exam,subject:s.subject,session:s.session,questions:s.questions.map(function(q){var n=q.q_num||q.number;return(sdb[n]?sdb[n]:q);})};
  });
}
function subj(){return curData()[state.subjectIdx];}
function qk(q){return state.examYear+'_'+state.subjectIdx+'_'+q.number;}
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
  curData().forEach(function(s,si){s.questions.forEach(function(q){var k=state.examYear+'_'+si+'_'+q.number;if(state.answers[k]&&state.answers[k]!==q.answer&&!state.resolved[k])w++;});});
  return w;
}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
function highlight(s){
  return esc(s).replace(/(틀린|틀리지|옳지 않은|옳지않은|잘못된|아닌 것|아닌것)/g,'<span style="color:#ef4444;font-weight:700">$1</span>')
               .replace(/(옳은|맞는|올바른|모두 고른|모두고른)/g,'<span style="color:#2563eb;font-weight:700">$1</span>');
}

function loadDbQuestions(){
  if(!_supa)return;
  _supa.from('questions').select('*').then(function(result){
    if(result.error||!result.data)return;
    _dbQuestions={};
    result.data.forEach(function(row){
      if(!_dbQuestions[row.year])_dbQuestions[row.year]={};
      if(!_dbQuestions[row.year][row.subject])_dbQuestions[row.year][row.subject]={};
      var num=row.q_num||row.number;
      _dbQuestions[row.year][row.subject][num]={number:num,q_num:num,question:row.question,condition:row.condition||'',choices:row.choices,answer:row.answer,explanation:row.explanation||'',image_url:row.image_url||null};
    });
    renderSidebar();renderMain();
  });
}
function renderNav(){
  var el=document.getElementById('nav-auth');
  if(!el)return;
  if(_user){
    var name=(_user.user_metadata&&_user.user_metadata.full_name)||(_user.email||'').split('@')[0];
    el.innerHTML='<span style="font-size:12px;color:#64748b;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+name+'</span><button class="btn-sm" onclick="doLogout()" style="font-size:12px;padding:4px 10px">로그아웃</button>';
  } else {
    el.innerHTML='<button class="btn-sm" onclick="loginGoogle()" style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 12px">&#x1F510; Google&#xB85C;&#xADF8;&#xC778;</button>';
  }
}
function loginGoogle(){
  if(!_supa){alert('Supabase 연결 오류');return;}
  _supa.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.href}});
}
function doLogout(){
  if(!_supa)return;
  _supa.auth.signOut().then(function(){
    _user=null;
    renderNav();
    renderSidebar();
  });
}
function findQuestion(key){
  var parts=key.split('_');
  var si,qn;
  if(parts.length>=3){si=parseInt(parts[1]);qn=parseInt(parts[2]);}
  else{si=parseInt(parts[0]);qn=parseInt(parts[1]);}
  var data=curData();
  if(!data[si])return null;
  for(var i=0;i<data[si].questions.length;i++){
    if(data[si].questions[i].number===qn)return{subj:data[si],q:data[si].questions[i]};
  }
  return null;
}
function saveRowToSupa(key){
  if(!_supa||!_user)return;
  var found=findQuestion(key);
  if(!found)return;
  var answerGiven=state.answers[key]||null;
  var row={
    user_id:_user.id,
    year:state.examYear,
    subject:found.subj.subject,
    q_num:found.q.number,
    answer_given:answerGiven,
    is_correct:answerGiven?(answerGiven===found.q.answer):null,
    is_bookmarked:!!state.bookmarks[key],
    is_resolved:!!state.resolved[key],
    attempt_count:answerGiven?1:0,
    last_attempted_at:new Date().toISOString()
  };
  _supa.from('user_progress').upsert(row,{onConflict:'user_id,year,subject,q_num'}).then(function(r){
    if(r.error)console.error('Supabase save error:',r.error);
  });
}
function syncFromSupa(){
  if(!_supa||!_user)return;
  _supa.from('user_progress').select('*').eq('user_id',_user.id).then(function(result){
    if(result.error||!result.data)return;
    result.data.forEach(function(row){
      var data=EXAM_DATA[row.year];
      if(!data)return;
      var si=-1;
      for(var i=0;i<data.length;i++){if(data[i].subject===row.subject){si=i;break;}}
      if(si<0)return;
      var k=row.year+'_'+si+'_'+row.q_num;
      if(row.answer_given)state.answers[k]=row.answer_given;
      if(row.is_bookmarked)state.bookmarks[k]=true;
      if(row.is_resolved)state.resolved[k]=true;
    });
    saveS();
    renderSidebar();
    renderMain();
  });
  loadMyBooks();
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

function navTabExam(){
  _mbActive=null;_navMode='exam';
  var t1=document.getElementById('nav-tab-exam');
  var t2=document.getElementById('nav-tab-studio');
  if(t1){t1.className='nav-tab active';}
  if(t2){t2.className='nav-tab';}
  renderSidebar();renderMain();
}
function navTabStudio(){
  _navMode='studio';
  var t1=document.getElementById('nav-tab-exam');
  var t2=document.getElementById('nav-tab-studio');
  if(t1){t1.className='nav-tab';}
  if(t2){t2.className='nav-tab active';}
  showMyBookList();
}
function navTabJijun(){
  _navMode='jijun';
  var t1=document.getElementById('nav-tab-exam');
  var t2=document.getElementById('nav-tab-studio');
  if(t1){t1.className='nav-tab';}
  if(t2){t2.className='nav-tab';}
  renderSidebar();showJijun();
}
function selJijunSubj(i){
  _jijunSubj=i;_navMode='jijun';
  renderSidebar();showJijun();
  closeMenu();
}
function showJijun(){
  if(typeof _jijunData==='undefined'||!_jijunData||!_jijunData.length){
    document.getElementById('main').innerHTML='<div class="empty"><div style="font-size:48px">📋</div><p>기출지문 데이터가 없어요.</p></div>';
    return;
  }
  var subj=_jijunData[_jijunSubj];
  if(!subj){_jijunSubj=0;subj=_jijunData[0];}
  var checkedCount=0;
  Object.keys(_jijunChecked).forEach(function(k){if(k.indexOf(_jijunSubj+'_')===0&&_jijunChecked[k])checkedCount++;});
  var total=0;
  subj.sections.forEach(function(s){total+=s.items.length;});
  var h='<div class="page-header"><h1>'+subj.icon+' '+subj.subject+'</h1>';
  h+='<p>기출지문 &middot; '+subj.sections.length+'개 편 &middot; 총 '+total+'개 지문</p></div>';
  h+='<div class="filter-bar" style="flex-wrap:wrap;gap:6px">';
  h+='<button class="filter-btn'+(_jijunViewMode==='all'?' active':'')+'" onclick="_jijunViewMode=\'all\';showJijun()">전체 '+total+'개</button>';
  h+='<button class="filter-btn'+(_jijunViewMode==='checked'?' active':'')+'" onclick="_jijunViewMode=\'checked\';showJijun()">★ 모아보기'+(checkedCount>0?' '+checkedCount+'개':'')+'</button>';
  h+='<button class="filter-btn'+(_jijunBlankMode?' active':'')+'" onclick="_jijunBlankMode=!_jijunBlankMode;showJijun()" style="'+(_jijunBlankMode?'background:#fef3c7;border-color:#f59e0b;color:#92400e':'')+'">✏️ 빈칸뚫기'+((_jijunBlankMode?' ON':''))+'</button>';
  if(_jijunBlankMode){h+='<button onclick="resetBlanks()" style="padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;background:#e0f2fe;color:#0369a1;border:1.5px solid #7dd3fc">↺ 빈칸 초기화</button>';}
  if(_jijunBlankMode){h+='<div style="width:100%;font-size:11px;color:#94a3b8;padding:2px 4px">💡 숫자·법령명은 자동 빈칸 &nbsp;|&nbsp; 단어 클릭 → 직접 빈칸 추가/해제</div>';}
  h+='</div>';
  subj.sections.forEach(function(sec,sidx){
    var visibleItems=sec.items.filter(function(item){
      if(_jijunViewMode==='checked'){var k=_jijunSubj+'_'+sidx+'_'+item.num;return _jijunChecked[k];}
      return true;
    });
    if(!visibleItems.length)return;
    h+='<div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:20px;overflow:hidden">';
    h+='<div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#1e293b">'+esc(sec.section)+'</div>';
    h+='<div style="padding:4px 0">';
    visibleItems.forEach(function(item){
      var k=_jijunSubj+'_'+sidx+'_'+item.num;
      var checked=!!_jijunChecked[k];
      var textHtml=_jijunBlankMode?makeBlankHtml(item.text,k):esc(item.text);
      h+='<div style="display:flex;align-items:flex-start;gap:8px;padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;line-height:1.7;color:#374151">';
      h+='<button id="jc_'+k+'" onclick="toggleJijunCheck(\''+k+'\')" style="flex-shrink:0;background:none;border:none;font-size:18px;cursor:pointer;color:'+(checked?'#f59e0b':'#cbd5e1')+';padding:0;margin-top:1px;line-height:1">'+(checked?'★':'☆')+'</button>';
      h+='<span style="flex-shrink:0;font-weight:700;color:#2563eb;min-width:20px">'+item.num+'.</span>';
      h+='<span>'+textHtml+'</span>';
      h+='</div>';
    });
    h+='</div></div>';
  });
  if(_jijunViewMode==='checked'&&checkedCount===0){
    h+='<div class="empty"><div style="font-size:48px">☆</div><p>★ 버튼을 눌러 지문을 모아보세요!</p></div>';
  }
  document.getElementById('main').innerHTML=h;
}
function renderSidebar(){
  if(_navMode==='jijun'){
    var h='<div class="sidebar-close-btn" onclick="closeMenu()"><span style="font-size:20px">✕</span> 닫기</div>';
    h+='<div class="sidebar-section"><div class="sidebar-item" onclick="navTabExam()" style="color:#64748b;font-size:12px">← 기출문제로</div></div>';
    h+='<div class="sidebar-section"><span class="sidebar-label">기출지문</span>';
    if(typeof _jijunData!=='undefined'&&_jijunData){
      _jijunData.forEach(function(subj,i){
        h+='<div class="sidebar-item'+(_jijunSubj===i?' active':'')+'" onclick="selJijunSubj('+i+')">'+subj.icon+' '+subj.subject+'</div>';
      });
    }
    h+='</div>';
    document.getElementById('sidebar').innerHTML=h;
    return;
  }
  if(_navMode==='studio'){
    var w=wrongCount();
    var h='<div class="sidebar-close-btn" onclick="closeMenu()"><span style="font-size:20px">✕</span> 닫기</div>';
    h+='<div class="sidebar-section"><span class="sidebar-label">문제 스튜디오</span><div style="font-size:11px;color:#94a3b8;padding:2px 4px 6px;line-height:1.4">직접 만드는 나만의 문제집</div>';
    h+='<div class="sidebar-item" onclick="showMyBookList();closeMenu()">📚 내 문제집'+(_myBooks.length?'<span class="sidebar-badge" style="background:#7c3aed">'+_myBooks.length+'</span>':'')+'</div>';
    h+='<div class="sidebar-item" onclick="showMyBookCreate();closeMenu()">✏️ 새로 만들기</div>';
    h+='</div><hr class="sidebar-divider"><div class="sidebar-section">';
    var wm=wrongCountMb();
    h+='<div class="sidebar-item" onclick="showWrongMb();closeMenu()">📕 오답노트'+(wm>0?'<span class="sidebar-badge">'+wm+'</span>':'')+'</div>';
    h+='<div class="sidebar-item" onclick="showStatsMb()">📊 내 통계</div>';
    h+='</div>';
    document.getElementById('sidebar').innerHTML=h;
    return;
  }
  var w=wrongCount();
  var h='<div class="sidebar-close-btn" onclick="closeMenu()"><span style="font-size:20px">✕</span> 닫기</div>';
  h+='<div class="sidebar-section"><span class="sidebar-label">회차</span><div class="round-tabs">';
  [36,35,34,33,32,31,30].forEach(function(yr){h+='<button class="round-tab'+(state.examYear===yr?' active':'')+'" onclick="selYear('+yr+')">'+yr+'회</button>';});
  h+='</div></div>';
  h+='<div class="sidebar-section"><span class="sidebar-label">1교시</span>';
  curData().forEach(function(s,i){if(s.session!==1)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><div class="sidebar-section"><span class="sidebar-label">2교시</span>';
  curData().forEach(function(s,i){if(s.session!==2)return;h+='<div class="sidebar-item'+(state.subjectIdx===i?' active':'')+'" onclick="selSubj('+i+')">'+s.subject+'</div>';});
  h+='</div><hr class="sidebar-divider"><div class="sidebar-section">';
  h+='<div class="sidebar-item" onclick="showWrong();closeMenu()">📕 오답노트'+(w>0?'<span class="sidebar-badge">'+w+'</span>':'')+'</div>';
  h+='<div class="sidebar-item" onclick="showStats()">📊 내 통계</div>';
  h+='<div class="sidebar-item" onclick="showPdf();closeMenu()">📥 PDF 다운로드</div>';
  h+='<div class="sidebar-item" onclick="navTabJijun()">📋 기출지문</div>';
  h+='</div>';
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
  h+='<div class="q-card"><div class="q-header"><span class="q-num">Q'+q.number+'</span>'+(q.is_amended?'<span style="display:inline-block;background:#ff6b35;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:6px;vertical-align:middle">개정</span>':'')+'<div class="q-actions">';
  if(state.filter==='wrong'&&isAns)h+='<button class="btn-resolve" onclick="resolve(\''+key+'\')">✓ 이해했어요</button>';
  h+='<button class="btn-icon'+(isBm?' bookmarked':'')+'" onclick="toggleBm(\''+key+'\')">'+(isBm?'★':'☆')+'</button>';
  h+='</div></div><div class="q-body"><div class="q-text">'+highlight(q.question)+'</div>';
  if(q.condition)h+='<div class="q-condition">'+esc(q.condition)+'</div>';
  if(q.image_url)h+='<div style="margin-bottom:12px"><img src="'+q.image_url+'" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0" alt="문제 이미지"></div>';
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

function selYear(y){_mbActive=null;state.examYear=y;state.subjectIdx=0;state.currentQ=0;state.filter='all';state.search='';renderSidebar();renderMain();closeMenu();}
function selSubj(i){_mbActive=null;state.subjectIdx=i;state.currentQ=0;state.filter='all';state.search='';renderSidebar();renderMain();closeMenu();}
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
function pick(key,c,ans){if(state.answers[key])return;state.answers[key]=c;saveS();saveRowToSupa(key);renderMain();renderSidebar();}
function toggleBm(key){state.bookmarks[key]=!state.bookmarks[key];saveS();saveRowToSupa(key);renderMain();renderSidebar();}
function resolve(key){state.resolved[key]=true;saveS();saveRowToSupa(key);var qs=filteredQ();if(state.currentQ>=qs.length)state.currentQ=Math.max(0,qs.length-1);renderMain();renderSidebar();}
function showWrong(){
  var d=curData();
  for(var i=0;i<d.length;i++){
    if(d[i].questions.some(function(q){var k=state.examYear+'_'+i+'_'+q.number;return state.answers[k]&&state.answers[k]!==q.answer&&!state.resolved[k];})){
      state.subjectIdx=i;state.filter='wrong';state.currentQ=0;renderSidebar();renderMain();return;
    }
  }
  alert('오답이 없어요! 🎉');
}
function goToByNum(num){var qs=filteredQ();for(var i=0;i<qs.length;i++){if(qs[i].number===num){state.currentQ=i;return;}}state.currentQ=0;}
function resetSubject(i){
  if(!confirm('이 과목의 풀이 기록을 초기화할까요? (별표는 유지됩니다)'))return;
  var s=curData()[i];
  s.questions.forEach(function(q){
    var k=state.examYear+'_'+i+'_'+q.number;
    delete state.answers[k];delete state.resolved[k];
    // 북마크는 유지 (delete state.bookmarks[k] 제거)
    if(_supa&&_user){
      var isBm=!!state.bookmarks[k];
      _supa.from('user_progress').upsert({
        user_id:_user.id,year:state.examYear,subject:s.subject,q_num:q.number,
        answer_given:null,is_correct:null,is_resolved:false,is_bookmarked:isBm,
        attempt_count:0,last_attempted_at:new Date().toISOString()
      },{onConflict:'user_id,year,subject,q_num'}).then(function(){});
    }
  });
  saveS();showStats();
}
function saveSessionToSupa(year,subject,cor,wrongCount,total,wrongNums){
  if(!_supa||!_user)return;
  _supa.from('study_sessions').insert({user_id:_user.id,year:year,subject:subject,correct:cor,wrong:wrongCount,total:total,wrong_questions:wrongNums}).then(function(r){if(r.error)console.error('Session save error:',r.error);});
}
function deleteSession(id){
  if(!confirm('이 기록을 삭제할까요?'))return;
  if(!_supa||!_user)return;
  _supa.from('study_sessions').delete().eq('id',id).eq('user_id',_user.id).then(function(){showHistory();});
}
function showHistory(){
  var h='<div style="padding:20px;max-width:700px">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h+='<button onclick="showStats()" style="padding:6px 14px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 통계로</button>';
  h+='<h2 style="font-size:20px;font-weight:800">📋 시험 기록</h2></div>';
  if(!_supa||!_user){h+='<div style="text-align:center;padding:40px;color:#94a3b8">로그인하면 기록을 볼 수 있어요</div></div>';document.getElementById('main').innerHTML=h;return;}
  h+='<div id="history-list"><div style="text-align:center;padding:40px;color:#94a3b8">불러오는 중...</div></div></div>';
  document.getElementById('main').innerHTML=h;
  _supa.from('study_sessions').select('*').eq('user_id',_user.id).order('played_at',{ascending:false}).limit(50).then(function(result){
    var el=document.getElementById('history-list');if(!el)return;
    if(result.error||!result.data||!result.data.length){el.innerHTML='<div style="text-align:center;padding:40px;color:#94a3b8">아직 시험 기록이 없어요<br><small>시험모드 → 채점하기를 해보세요!</small></div>';return;}
    var lh='';
    result.data.forEach(function(row){
      var score=Math.round(row.correct/row.total*100);
      var d=new Date(row.played_at);
      var dateStr=(d.getMonth()+1)+'월 '+d.getDate()+'일 '+d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');
      var emoji=score>=80?'🎉':score>=60?'👍':'💪';
      var wrongList=row.wrong_questions?row.wrong_questions.join(', '):'-';
      lh+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:10px">';
      lh+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
      lh+='<span style="font-size:20px">'+emoji+'</span>';
      lh+='<div style="flex:1"><div style="font-size:14px;font-weight:700;color:#1e293b">'+row.year+'회 '+row.subject+'</div>';
      lh+='<div style="font-size:12px;color:#94a3b8">'+dateStr+'</div></div>';
      lh+='<div style="text-align:right"><div style="font-size:24px;font-weight:900;color:#2563eb">'+score+'<span style="font-size:14px">점</span></div>';
      lh+='<div style="font-size:12px;color:#64748b">'+row.correct+'/'+row.total+'</div></div>';
      lh+='<button onclick="deleteSession(\''+row.id+'\')" style="padding:4px 8px;background:#fef2f2;color:#ef4444;border:1.5px solid #fecaca;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">삭제</button>';
      lh+='</div>';
      if(row.wrong>0){lh+='<div style="font-size:12px;color:#ef4444;background:#fef2f2;padding:6px 10px;border-radius:6px">❌ 틀린 문제: Q'+wrongList+'</div>';}
      lh+='</div>';
    });
    el.innerHTML=lh;
  });
}
function showStats(){
  var yr=state.examYear;
  var d=curData();
  var h='<div style="padding:20px;max-width:700px">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
  h+='<button onclick="renderMain()" style="padding:6px 14px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 돌아가기</button>';
  h+='<h2 style="font-size:20px;font-weight:800;color:#1e293b">📊 내 통계</h2>';
  h+='<button onclick="showHistory()" style="margin-left:auto;padding:6px 14px;background:#eff6ff;color:#2563eb;border:1.5px solid #bfdbfe;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">📋 시험 기록</button>';
  h+='</div>';
  h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">';
  [36,35,34,33,32,31,30].forEach(function(y){
    h+='<button onclick="state.examYear='+y+';showStats()" style="padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid '+(y===yr?'#2563eb':'#e2e8f0')+';background:'+(y===yr?'#eff6ff':'#fff')+';color:'+(y===yr?'#2563eb':'#64748b')+'">'+y+'회</button>';
  });
  h+='</div>';
  d.forEach(function(s,i){
    var done=s.questions.filter(function(q){return state.answers[yr+'_'+i+'_'+q.number];}).length;
    var cor=s.questions.filter(function(q){return state.answers[yr+'_'+i+'_'+q.number]===q.answer;}).length;
    var wrongQs=s.questions.filter(function(q){var k=yr+'_'+i+'_'+q.number;return state.answers[k]&&state.answers[k]!==q.answer&&!state.resolved[k];});
    var pct=s.questions.length?Math.round(done/s.questions.length*100):0;
    var acc=done?Math.round(cor/done*100):0;
    h+='<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:12px">';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    h+='<div><span style="font-size:14px;font-weight:700;color:#1e293b">'+s.subject+'</span><span style="font-size:12px;color:#64748b;margin-left:8px">'+done+'/'+s.questions.length+'문제</span></div>';
    h+='<button onclick="resetSubject('+i+')" style="padding:4px 12px;background:#fef2f2;color:#ef4444;border:1.5px solid #fecaca;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">🔄 다시 풀기</button>';
    h+='</div>';
    h+='<div style="background:#f1f5f9;border-radius:8px;height:8px;overflow:hidden;margin-bottom:8px"><div style="height:100%;background:linear-gradient(90deg,#2563eb,#60a5fa);border-radius:8px;width:'+pct+'%"></div></div>';
    h+='<div style="display:flex;gap:16px;font-size:13px;margin-bottom:'+(wrongQs.length?'10px':'0')+'">';
    h+='<span>✅ 정답 <b style="color:#16a34a">'+cor+'</b></span>';
    h+='<span>❌ 오답 <b style="color:#ef4444">'+wrongQs.length+'</b></span>';
    h+='<span>⬜ 미풀이 <b style="color:#94a3b8">'+(s.questions.length-done)+'</b></span>';
    h+='<span style="margin-left:auto">정답률 <b style="color:#2563eb">'+acc+'%</b></span></div>';
    if(wrongQs.length){
      h+='<div style="margin-top:6px"><span style="font-size:12px;color:#64748b;font-weight:600">틀린 문제: </span>';
      wrongQs.forEach(function(q){
        h+='<button onclick="selSubj('+i+');state.filter=\'all\';goToByNum('+q.number+');renderMain()" style="display:inline-block;min-width:32px;height:26px;padding:0 4px;margin:2px;border-radius:6px;background:#fef2f2;border:1.5px solid #fecaca;color:#ef4444;font-size:12px;font-weight:700;cursor:pointer">'+q.number+'</button>';
      });
      h+='</div>';
    }
    h+='</div>';
  });
  h+='</div>';
  document.getElementById('main').innerHTML=h;
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
  var wrongNums=s.questions.filter(function(q){return state.answers[qk(q)]&&state.answers[qk(q)]!==q.answer;}).map(function(q){return q.number;});
  saveSessionToSupa(state.examYear,s.subject,cor,wrongNums.length,s.questions.length,wrongNums);
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
  h+='<div style="display:flex;gap:8px;margin-top:20px">';
  h+='<button onclick="closeScore()" style="flex:1;padding:12px;background:#f1f5f9;color:#475569;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">확인</button>';
  h+='<button onclick="closeScore();showStats()" style="flex:1;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">📊 통계 보기</button>';
  h+='</div>';
  h+='</div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
}

// ===== 내 문제집 기능 =====
function loadMyBooks(){
  loadMyBooksLocal();
  if(!_supa||!_user){renderSidebar();return;}
  _supa.from('custom_quizbooks').select('*').eq('user_id',_user.id).order('created_at',{ascending:false}).then(function(result){
    if(!result.error&&result.data){
      _myBooks=result.data.map(function(r){return{id:r.id,title:r.title,choice_count:r.choice_count||5,questions:r.questions,created_at:r.created_at};});
      saveMyBooksLocal();
    }
    renderSidebar();
  });
}
function saveNewBook(title,choiceCount,questions){
  var id=Date.now().toString();
  var book={id:id,title:title,choice_count:choiceCount,questions:questions,created_at:new Date().toISOString()};
  _myBooks.unshift(book);saveMyBooksLocal();
  if(_supa&&_user){
    _supa.from('custom_quizbooks').insert({id:id,user_id:_user.id,title:title,choice_count:choiceCount,questions:questions}).then(function(r){if(r.error)console.error('Book save:',r.error);});
  }
  renderSidebar();openMyBook(id);
}
function deleteMyBook(id){
  if(!confirm('이 문제집을 삭제할까요?'))return;
  _myBooks=_myBooks.filter(function(b){return b.id!=id;});saveMyBooksLocal();
  if(_supa&&_user){_supa.from('custom_quizbooks').delete().eq('id',id).eq('user_id',_user.id).then(function(){});}
  renderSidebar();showMyBookList();
}
function openMyBook(id){
  var book=null;
  for(var i=0;i<_myBooks.length;i++){if(_myBooks[i].id==id){book=_myBooks[i];break;}}
  if(!book)return;
  _mbActive=book;_mbQ=0;_mbAns={};_mbBm={};
  renderSidebar();renderMyBook();closeMenu();
}
function downloadMyBook(id){
  var book=null;
  for(var i=0;i<_myBooks.length;i++){if(_myBooks[i].id==id){book=_myBooks[i];break;}}
  if(!book)return;
  var data=JSON.stringify(book.questions,null,2);
  var blob=new Blob([data],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=book.title+'.json';a.click();
  URL.revokeObjectURL(url);
}
function showMyBookList(){
  _mbActive=null;renderSidebar();
  var h='<div style="padding:20px;max-width:700px">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h+='<h2 style="font-size:20px;font-weight:800">📚 내 문제집</h2>';
  h+='<button onclick="showMyBookCreate()" style="margin-left:auto;padding:7px 16px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">+ 새로 만들기</button>';
  h+='</div>';
  if(!_myBooks.length){
    h+='<div style="text-align:center;padding:60px 20px;color:#94a3b8"><div style="font-size:48px">📝</div>';
    h+='<p style="margin-top:12px;font-size:15px;font-weight:600">아직 만든 문제집이 없어요</p>';
    h+='<p style="font-size:13px;margin-top:8px;line-height:1.6">AI 또는 직접 입력으로<br>나만의 문제집을 만들어보세요!</p>';
    h+='<button onclick="showMyBookCreate()" style="margin-top:16px;padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">+ 첫 문제집 만들기</button>';
    h+='</div>';
  } else {
    _myBooks.forEach(function(book){
      var d=new Date(book.created_at);
      var dateStr=(d.getMonth()+1)+'월 '+d.getDate()+'일';
      h+='<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:12px">';
      h+='<div style="flex:1;cursor:pointer" onclick="openMyBook('+book.id+')">';
      h+='<div style="font-size:15px;font-weight:700;color:#1e293b">'+esc(book.title)+'</div>';
      h+='<div style="font-size:12px;color:#64748b;margin-top:2px">'+book.questions.length+'문제 · '+book.choice_count+'지선다 · '+dateStr+'</div>';
      h+='</div>';
      h+='<button onclick="downloadMyBook('+book.id+')" style="padding:5px 10px;background:#f0fdf4;color:#16a34a;border:1.5px solid #86efac;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">💾 백업</button>';
      h+='<button onclick="deleteMyBook('+book.id+')" style="padding:5px 10px;background:#fef2f2;color:#ef4444;border:1.5px solid #fecaca;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">삭제</button>';
      h+='</div>';
    });
  }
  if(!_user){
    h+='<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;font-size:13px;color:#92400e;margin-top:12px">';
    h+='⚠️ 로그인하면 클라우드에 저장돼요. 지금은 이 기기에만 저장됩니다.</div>';
  }
  h+='</div>';
  document.getElementById('main').innerHTML=h;
}
function showMyBookCreate(){
  _mbActive=null;renderSidebar();
  var h='<div style="padding:20px;max-width:700px">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h+='<button onclick="showMyBookList()" style="padding:6px 14px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 목록으로</button>';
  h+='<h2 style="font-size:20px;font-weight:800">📝 새 문제집 만들기</h2>';
  h+='<div style="margin-left:auto;display:flex;gap:6px">';
  h+='<button onclick="showMyBookCreate()" style="padding:5px 12px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #2563eb;background:#eff6ff;color:#2563eb">🤖 AI로 만들기</button>';
  h+='<button onclick="showMyBookManual()" style="padding:5px 12px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #e2e8f0;background:#fff;color:#64748b">✍️ 직접 입력</button>';
  h+='</div>';
  h+='</div>';
  h+='<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:20px">';
  h+='<div style="font-size:13px;font-weight:700;color:#1e40af;margin-bottom:8px">💡 STEP 1 — 기출문제 PDF를 아래 프롬프트와 함께 AI에 전달하세요</div>';
  h+='<div id="prompt-box" style="background:#fff;border-radius:8px;padding:12px;font-size:12px;font-family:monospace;color:#334155;line-height:1.7;white-space:pre-wrap;max-height:180px;overflow:hidden;transition:max-height 0.3s">아래 PDF를 JSON 배열로 변환해줘. JSON만 출력.\n\n과목명: [과목명]  회차: [제N회]  연도: [YYYY]  교시: [1 or 2]\n\n[{\n  "number": 41,\n  "question": "문제 텍스트",\n  "condition": "ㄱ. ...\nㄴ. ... (조건 없으면 null)",\n  "choices": ["① ...", "② ...", "③ ...", "④ ...", "⑤ ..."],\n  "answer": 3,\n  "explanation": "해설 (친근한 말투, 법령 근거 괄호 표시)",\n  "hasImage": false\n}]\n\n[규칙] number: 시험지 번호 그대로 / question: 본문만, 조건은 condition에 분리 /\nchoices: 번호 기호(①②③) 포함, 원문 그대로 / answer: 정답 숫자(추측 금지) /\nexplanation: 친근한 ~해요 말투, 오답 선택지 1~2개도 간략히 / hasImage: 그림·그래프 필수 문제만 true /\n전 문제 빠짐없이 완성된 형태로 출력</div>';
  h+='<div style="display:flex;gap:8px;margin-top:8px;align-items:center">';
  h+='<button id="btn-prompt-toggle" onclick="togglePrompt()" style="padding:4px 10px;background:#f1f5f9;color:#475569;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">▼ 전체 보기</button>';
  h+='<button onclick="copyPrompt()" style="padding:4px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">📋 프롬프트 복사</button>';
  h+='</div>';
  h+='</div>';
  h+='<div style="margin-bottom:16px">';
  h+='<label style="display:block;font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px">문제집 제목</label>';
  h+='<input type="text" id="mb-title" placeholder="예: 민법 핵심 100제" style="width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">';
  h+='</div>';
  h+='<div style="margin-bottom:16px">';
  h+='<label style="display:block;font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px">선다 수</label>';
  h+='<div style="display:flex;gap:8px">';
  h+='<button id="mb-ch-4" onclick="setChoiceCount(4)" style="padding:8px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:2px solid #e2e8f0;background:#fff;color:#64748b">4지선다</button>';
  h+='<button id="mb-ch-5" onclick="setChoiceCount(5)" style="padding:8px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:2px solid #2563eb;background:#eff6ff;color:#2563eb">5지선다</button>';
  h+='</div></div>';
  h+='<div style="margin-bottom:16px">';
  h+='<div style="margin-bottom:16px">';
  h+='<label style="display:block;font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px">해설 스타일</label>';
  h+='<div style="display:flex;gap:8px">';
  h+='<button id="mb-style-f" onclick="setExpStyle(\'friendly\')" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #2563eb;background:#eff6ff;color:#2563eb">😊 친근한 말투</button>';
  h+='<button id="mb-style-c" onclick="setExpStyle(\'concise\')" style="padding:7px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #e2e8f0;background:#fff;color:#64748b">📌 핵심 요약</button>';
  h+='</div></div>';
  h+='<label style="display:block;font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px">STEP 2 — AI 출력 결과를 아래에 붙여넣기</label>'
;
  h+='<textarea id="mb-json" rows="12" placeholder="[ { &quot;number&quot;: 1, &quot;question&quot;: &quot;...&quot;, &quot;choices&quot;: [...], &quot;answer&quot;: 3, &quot;explanation&quot;: &quot;...&quot; } ]" style="width:100%;padding:12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:monospace;resize:vertical"></textarea>';
  h+='</div>';
  h+='<div id="mb-error" style="color:#ef4444;font-size:13px;margin-bottom:12px;display:none"></div>';
  h+='<div style="display:flex;gap:8px;justify-content:flex-end">';
  h+='<button onclick="showMyBookList()" style="padding:9px 20px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-weight:700;cursor:pointer">취소</button>';
  h+='<button onclick="createMyBook()" style="padding:9px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer">📚 문제집 만들기</button>';
  h+='</div></div>';
  document.getElementById('main').innerHTML=h;
  _mbChoiceCount=5;
}
function setExpStyle(style){
  _mbExpStyle=style;
  var bf=document.getElementById('mb-style-f');
  var bc=document.getElementById('mb-style-c');
  if(bf){bf.style.borderColor=style==='friendly'?'#2563eb':'#e2e8f0';bf.style.background=style==='friendly'?'#eff6ff':'#fff';bf.style.color=style==='friendly'?'#2563eb':'#64748b';}
  if(bc){bc.style.borderColor=style==='concise'?'#2563eb':'#e2e8f0';bc.style.background=style==='concise'?'#eff6ff':'#fff';bc.style.color=style==='concise'?'#2563eb':'#64748b';}
  var box=document.getElementById('prompt-box');
  if(!box)return;
  var txt=box.innerText||box.textContent;
  if(style==='concise'){
    txt=txt.replace('"explanation": "해설 (친근한 말투, 법령 근거 괄호 표시)"','"explanation": "해설 (핵심 요약, 법령 조항·숫자 위주)"');
    txt=txt.replace('explanation: 친근한 ~해요 말투, 오답 선택지 1~2개도 간략히','explanation: 핵심 조항/숫자 위주, ~입니다 말투');
  } else {
    txt=txt.replace('"explanation": "해설 (핵심 요약, 법령 조항·숫자 위주)"','"explanation": "해설 (친근한 말투, 법령 근거 괄호 표시)"');
    txt=txt.replace('explanation: 핵심 조항/숫자 위주, ~입니다 말투','explanation: 친근한 ~해요 말투, 오답 선택지 1~2개도 간략히');
  }
  box.innerText=txt;
}
function showMyBookManual(){
  _mbActive=null;_mbManualQs=[];
  var h='<div style="padding:20px;max-width:700px">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">';
  h+='<button onclick="showMyBookList()" style="padding:6px 14px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 목록으로</button>';
  h+='<h2 style="font-size:20px;font-weight:800">✍️ 직접 입력</h2>';
  h+='<div style="margin-left:auto;display:flex;gap:6px">';
  h+='<button onclick="showMyBookCreate()" style="padding:5px 12px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #e2e8f0;background:#fff;color:#64748b">🤖 AI로 만들기</button>';
  h+='<button onclick="showMyBookManual()" style="padding:5px 12px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #2563eb;background:#eff6ff;color:#2563eb">✍️ 직접 입력</button>';
  h+='</div></div>';
  h+='<div style="margin-bottom:16px">';
  h+='<label style="display:block;font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px">문제집 제목</label>';
  h+='<input type="text" id="mb-m-title" placeholder="예: 민법 핵심 50제" style="width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">';
  h+='</div>';
  h+='<div style="margin-bottom:16px"><label style="display:block;font-size:12px;font-weight:700;color:#64748b;margin-bottom:6px">선다 수</label>';
  h+='<div style="display:flex;gap:8px">';
  h+='<button id="mb-mc-4" onclick="setChoiceCount(4)" style="padding:8px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:2px solid #e2e8f0;background:#fff;color:#64748b">4지선다</button>';
  h+='<button id="mb-mc-5" onclick="setChoiceCount(5)" style="padding:8px 20px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:2px solid #2563eb;background:#eff6ff;color:#2563eb">5지선다</button>';
  h+='</div></div>';
  h+='<div id="mb-manual-list"></div>';
  h+='<button onclick="addManualQ()" style="width:100%;padding:10px;background:#f8fafc;color:#2563eb;border:2px dashed #bfdbfe;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:16px">+ 문제 추가</button>';
  h+='<div id="mb-m-error" style="color:#ef4444;font-size:13px;margin-bottom:12px;display:none"></div>';
  h+='<div style="display:flex;gap:8px;justify-content:flex-end">';
  h+='<button onclick="showMyBookList()" style="padding:9px 20px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-weight:700;cursor:pointer">취소</button>';
  h+='<button onclick="createManualBook()" style="padding:9px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer">📚 문제집 만들기</button>';
  h+='</div></div>';
  document.getElementById('main').innerHTML=h;
  _mbChoiceCount=5;
  addManualQ();
}
function renderManualList(){
  var el=document.getElementById('mb-manual-list');
  if(!el)return;
  if(!_mbManualQs.length){el.innerHTML='';return;}
  var h='';
  _mbManualQs.forEach(function(q,i){
    h+='<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px">';
    h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">';
    h+='<span style="background:#eff6ff;color:#2563eb;font-size:12px;font-weight:700;padding:3px 9px;border-radius:6px">Q'+q.number+'</span>';
    h+='<button onclick="removeManualQ('+i+')" style="margin-left:auto;padding:3px 8px;background:#fef2f2;color:#ef4444;border:1.5px solid #fecaca;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">삭제</button>';
    h+='</div>';
    h+='<div style="display:grid;gap:8px">';
    h+='<div style="display:flex;gap:8px;align-items:center"><span style="font-size:12px;color:#64748b;white-space:nowrap;font-weight:600;width:36px">번호</span><input type="number" value="'+q.number+'" onchange="updateManualQNum('+i+',parseInt(this.value))" style="width:70px;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px"></div>';
    h+='<div><span style="font-size:12px;color:#64748b;font-weight:600">문제</span><textarea onchange="updateManualQText('+i+',this.value)" rows="2" style="width:100%;margin-top:4px;padding:8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-family:inherit;resize:vertical">'+esc(q.question)+'</textarea></div>';
    h+='<div><span style="font-size:12px;color:#64748b;font-weight:600">조건 / 보기 (없으면 생략)</span><textarea onchange="updateManualQCond('+i+',this.value)" rows="2" style="width:100%;margin-top:4px;padding:8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-family:inherit;resize:vertical">'+esc(q.condition||'')+'</textarea></div>';
    for(var c=0;c<(_mbChoiceCount||5);c++){
      h+='<div style="display:flex;gap:8px;align-items:center"><span style="font-size:12px;color:#64748b;white-space:nowrap;font-weight:600;width:36px">보기'+(c+1)+'</span>';
      var cv=(q.choices&&q.choices[c])||'';
      h+='<input type="text" value="'+esc(cv)+'" onchange="updateManualQChoice('+i+','+c+',this.value)" style="flex:1;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px"></div>';
    }
    h+='<div style="display:flex;gap:8px;align-items:center"><span style="font-size:12px;color:#64748b;white-space:nowrap;font-weight:600;width:36px">정답</span><div style="display:flex;gap:4px">';
    for(var a=1;a<=(_mbChoiceCount||5);a++){
      h+='<button onclick="updateManualQAns('+i+','+a+')" style="width:32px;height:32px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;border:2px solid '+(q.answer===a?'#2563eb':'#e2e8f0')+';background:'+(q.answer===a?'#2563eb':'#fff')+';color:'+(q.answer===a?'#fff':'#475569')+'">'+a+'</button>';
    }
    h+='</div></div>';
    h+='<div><span style="font-size:12px;color:#64748b;font-weight:600">해설</span><textarea onchange="updateManualQExp('+i+',this.value)" rows="2" style="width:100%;margin-top:4px;padding:8px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-family:inherit;resize:vertical">'+esc(q.explanation||'')+'</textarea></div>';
    h+='</div></div>';
  });
  el.innerHTML=h;
}
function addManualQ(){
  var n=_mbManualQs.length+1;
  _mbManualQs.push({number:n,question:'',condition:'',choices:['','','','',''],answer:1,explanation:''});
  renderManualList();
}
function removeManualQ(i){
  _mbManualQs.splice(i,1);
  renderManualList();
}
function updateManualQ(i,field,val){
  if(!_mbManualQs[i])return;
  _mbManualQs[i][field]=val;
  if(field==='answer')renderManualList();
}
function updateManualQNum(i,val){if(!_mbManualQs[i])return;_mbManualQs[i].number=val;}
function updateManualQText(i,val){if(!_mbManualQs[i])return;_mbManualQs[i].question=val;}
function updateManualQCond(i,val){if(!_mbManualQs[i])return;_mbManualQs[i].condition=val;}
function updateManualQAns(i,val){if(!_mbManualQs[i])return;_mbManualQs[i].answer=val;renderManualList();}
function updateManualQExp(i,val){if(!_mbManualQs[i])return;_mbManualQs[i].explanation=val;}
function updateManualQChoice(i,c,val){
  if(!_mbManualQs[i])return;
  if(!_mbManualQs[i].choices)_mbManualQs[i].choices=[];
  _mbManualQs[i].choices[c]=val;
}
function createManualBook(){
  var title=(document.getElementById('mb-m-title').value||'').trim();
  var errEl=document.getElementById('mb-m-error');
  if(!title){errEl.textContent='제목을 입력해주세요';errEl.style.display='block';return;}
  if(!_mbManualQs.length){errEl.textContent='문제를 1개 이상 추가해주세요';errEl.style.display='block';return;}
  var questions=_mbManualQs.map(function(q){
    return{number:q.number,question:q.question,condition:q.condition||'',choices:q.choices.filter(function(c){return c.trim();}),answer:q.answer,explanation:q.explanation||''};
  });
  var invalid=questions.filter(function(q){return !q.question.trim()||q.choices.length<2;});
  if(invalid.length){errEl.textContent='문제 텍스트와 보기를 2개 이상 입력해주세요 (Q'+invalid[0].number+')';errEl.style.display='block';return;}
  errEl.style.display='none';
  saveNewBook(title,_mbChoiceCount||5,questions);
}
function togglePrompt(){
  var box=document.getElementById('prompt-box');
  var btn=document.getElementById('btn-prompt-toggle');
  if(!box||!btn)return;
  if(box.style.maxHeight==='none'){box.style.maxHeight='180px';btn.textContent='▼ 전체 보기';}
  else{box.style.maxHeight='none';btn.textContent='▲ 접기';}
}
function copyPrompt(){
  var el=document.getElementById('prompt-box');
  if(!el)return;
  var text=el.innerText||el.textContent;
  var styleNote=_mbExpStyle==='concise'?'explanation: 법령 근거 중심으로 간결하게 (예: ~입니다, ~합니다 말투, 핵심 조항/숫자 위주)':'explanation: 친근한 ~해요 말투, 오답 선택지 1~2개도 간략히';
  text=text.replace('explanation: 친근한 ~해요 말투, 오답 선택지 1~2개도 간략히',styleNote);
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(function(){alert('프롬프트 복사됐어요! AI에 PDF와 함께 붙여넣으세요 :)');});}
  else{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('복사됐어요!');}
}
function setChoiceCount(n){
  _mbChoiceCount=n;
  var b4=document.getElementById('mb-ch-4');var b5=document.getElementById('mb-ch-5');
  if(b4){b4.style.borderColor=n===4?'#2563eb':'#e2e8f0';b4.style.background=n===4?'#eff6ff':'#fff';b4.style.color=n===4?'#2563eb':'#64748b';}
  if(b5){b5.style.borderColor=n===5?'#2563eb':'#e2e8f0';b5.style.background=n===5?'#eff6ff':'#fff';b5.style.color=n===5?'#2563eb':'#64748b';}
}
function createMyBook(){
  var title=(document.getElementById('mb-title').value||'').trim();
  var jsonStr=(document.getElementById('mb-json').value||'').trim();
  var errEl=document.getElementById('mb-error');
  if(!title){errEl.textContent='제목을 입력해주세요';errEl.style.display='block';return;}
  if(!jsonStr){errEl.textContent='JSON을 붙여넣어주세요';errEl.style.display='block';return;}
  var match=jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if(match)jsonStr=match[1].trim();
  var questions;
  try{questions=JSON.parse(jsonStr);}
  catch(e){errEl.textContent='JSON 형식이 올바르지 않아요. AI 출력을 다시 확인해보세요. ('+e.message+')';errEl.style.display='block';return;}
  if(!Array.isArray(questions)||!questions.length){errEl.textContent='문제 배열이 비어있어요';errEl.style.display='block';return;}
  questions=questions.map(function(q,i){return{number:q.number||(i+1),question:q.question||'',choices:Array.isArray(q.choices)?q.choices:[],answer:q.answer||1,explanation:q.explanation||'',condition:q.condition||''};});
  errEl.style.display='none';
  saveNewBook(title,_mbChoiceCount||5,questions);
}
function renderMyBook(){
  if(!_mbActive){showMyBookList();return;}
  var qs=_mbActive.questions;
  if(!qs||!qs.length){document.getElementById('main').innerHTML='<div style="padding:20px">문제가 없어요</div>';return;}
  if(_mbQ>=qs.length)_mbQ=0;
  var q=qs[_mbQ];var key=''+_mbQ;
  var chosen=_mbAns[key];var isAns=chosen!==undefined;var isBm=!!_mbBm[key];
  var half=Math.ceil(qs.length/2);var r1='',r2='';
  qs.forEach(function(qq,i){
    var a=_mbAns[''+i];
    var cls='qn'+(i===_mbQ?' current':a!==undefined&&a===qq.answer?' answered':a!==undefined?' wrong-q':'');
    var btn='<button class="'+cls+'" onclick="goToMb('+i+')">'+qq.number+'</button>';
    if(i<half)r1+=btn;else r2+=btn;
  });
  var h='<div class="page-header">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<button onclick="showMyBookList()" style="padding:5px 12px;background:#f1f5f9;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">← 목록</button>';
  h+='<h1 style="font-size:18px;font-weight:800;color:#1e293b">'+esc(_mbActive.title)+'</h1></div>';
  h+='<p style="margin-top:4px;font-size:13px;color:#64748b">'+qs.length+'문제 · '+_mbActive.choice_count+'지선다</p></div>';
  h+='<div class="q-card"><div class="q-header"><span class="q-num">Q'+q.number+'</span><div class="q-actions">';
  h+='<button class="btn-icon'+(isBm?' bookmarked':'')+'" onclick="toggleBmMb('+key+')">'+(isBm?'★':'☆')+'</button>';
  h+='</div></div><div class="q-body"><div class="q-text">'+highlight(q.question)+'</div>';
  if(q.condition)h+='<div class="q-condition">'+esc(q.condition)+'</div>';
  h+='<div class="choices">';
  q.choices.forEach(function(c,i){
    var idx=i+1;
    var cls='choice'+(isAns?(idx===q.answer?' correct':idx===chosen?' wrong':''):'');
    h+='<button class="'+cls+'" onclick="pickMb('+key+','+idx+','+q.answer+')"'+(isAns?' disabled':'')+'>'+esc(c)+'</button>';
  });
  h+='</div>';
  h+='<div class="explanation'+(isAns?' show':'')+'"><div class="explanation-title">💡 해설</div>'+esc(q.explanation)+'</div>';
  h+='</div><div class="q-footer"><div class="q-nums"><div class="q-nums-row">'+r1+'</div><div class="q-nums-row">'+r2+'</div></div>';
  h+='<button class="btn-next" onclick="nextMb()">다음 →</button></div></div>';
  document.getElementById('main').innerHTML=h;
}
function wrongCountMb(){
  if(!_mbActive)return 0;
  var w=0;
  _mbActive.questions.forEach(function(q,i){var a=_mbAns[''+i];if(a!==undefined&&a!==q.answer)w++;});
  return w;
}
function showWrongMb(){
  if(!_mbActive){showMyBookList();return;}
  var qs=_mbActive.questions;
  var wrongs=[];
  for(var i=0;i<qs.length;i++){var a=_mbAns[''+i];if(a!==undefined&&a!==qs[i].answer)wrongs.push({q:qs[i],idx:i,chose:a});}
  if(!wrongs.length){alert('오답이 없어요! 🎉');return;}
  var h='<div style="padding:20px;max-width:700px">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h+='<button onclick="renderMyBook()" style="padding:6px 14px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 문제로</button>';
  h+='<h2 style="font-size:20px;font-weight:800">📕 오답노트 <span style="font-size:14px;color:#ef4444;font-weight:700">'+wrongs.length+'문제</span></h2>';
  h+='</div>';
  wrongs.forEach(function(item){
    var q=item.q;var chose=item.chose;
    h+='<div style="background:#fff;border:1.5px solid #fecaca;border-radius:12px;margin-bottom:16px;overflow:hidden">';
    h+='<div style="padding:12px 18px 0"><span style="background:#fef2f2;color:#ef4444;font-size:12px;font-weight:700;padding:3px 9px;border-radius:6px">Q'+q.number+'</span></div>';
    h+='<div style="padding:10px 18px 14px">';
    h+='<div style="font-size:14px;font-weight:600;color:#1e293b;margin-bottom:10px;line-height:1.6">'+esc(q.question)+'</div>';
    if(q.condition)h+='<div style="background:#f8fafc;border-left:3px solid #93c5fd;border-radius:0 8px 8px 0;padding:8px 12px;margin-bottom:10px;font-size:13px;color:#334155;white-space:pre-wrap">'+esc(q.condition)+'</div>';
    h+='<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px">';
    q.choices.forEach(function(c,ci){
      var idx=ci+1;var isCorrect=(idx===q.answer);var isChose=(idx===chose);
      var bg=isCorrect?'border:1.5px solid #22c55e;background:#f0fdf4;color:#166534;font-weight:600':isChose?'border:1.5px solid #ef4444;background:#fef2f2;color:#991b1b':'border:1.5px solid #e2e8f0;color:#475569';
      h+='<div style="padding:8px 12px;border-radius:8px;font-size:13px;'+bg+'">'+esc(c)+(isCorrect?' ✓':isChose?' ✗':'')+'</div>';
    });
    h+='</div>';
    if(q.explanation)h+='<div style="padding:12px 14px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;font-size:13px;line-height:1.6;color:#451a03"><div style="font-size:11px;font-weight:700;color:#92400e;margin-bottom:4px">💡 해설</div>'+esc(q.explanation)+'</div>';
    h+='</div></div>';
  });
  h+='</div>';
  document.getElementById('main').innerHTML=h;
}
function showStatsMb(){
  if(!_mbActive){showMyBookList();return;}
  var qs=_mbActive.questions;
  var cor=0,wrong=0,unanswered=0;
  qs.forEach(function(q,i){var a=_mbAns[''+i];if(a===undefined)unanswered++;else if(a===q.answer)cor++;else wrong++;});
  var total=qs.length;
  var h='<div style="padding:20px;max-width:700px">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  h+='<button onclick="renderMyBook()" style="padding:6px 14px;background:#f1f5f9;border:none;border-radius:8px;font-weight:700;cursor:pointer">← 문제로</button>';
  h+='<h2 style="font-size:20px;font-weight:800">📊 '+esc(_mbActive.title)+'</h2></div>';
  h+='<div style="display:flex;gap:12px;margin-bottom:20px">';
  h+='<div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#16a34a">'+cor+'</div><div style="font-size:12px;color:#64748b;margin-top:4px">정답</div></div>';
  h+='<div style="flex:1;background:#fef2f2;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#ef4444">'+wrong+'</div><div style="font-size:12px;color:#64748b;margin-top:4px">오답</div></div>';
  h+='<div style="flex:1;background:#f8fafc;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#94a3b8">'+unanswered+'</div><div style="font-size:12px;color:#64748b;margin-top:4px">미풀이</div></div>';
  h+='</div>';
  if(cor+wrong>0){
    var pct=Math.round(cor/(cor+wrong)*100);
    h+='<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px">';
    h+='<div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:8px">정답률</div>';
    h+='<div style="background:#e2e8f0;border-radius:8px;height:10px;overflow:hidden"><div style="height:100%;background:linear-gradient(90deg,#2563eb,#60a5fa);border-radius:8px;width:'+pct+'%"></div></div>';
    h+='<div style="font-size:13px;color:#64748b;margin-top:6px">'+pct+'% ('+cor+'/'+(cor+wrong)+'문제 풀이)</div></div>';
  } else {
    h+='<div style="text-align:center;padding:32px;color:#94a3b8"><div style="font-size:36px">📝</div><p style="margin-top:12px;font-size:14px">아직 푼 문제가 없어요</p></div>';
  }
  h+='</div>';
  document.getElementById('main').innerHTML=h;
}
function pickMb(key,c,ans){if(_mbAns[key]!==undefined)return;_mbAns[key]=c;renderMyBook();renderSidebar();}
function toggleBmMb(key){_mbBm[key]=!_mbBm[key];renderMyBook();}
function goToMb(i){_mbQ=i;renderMyBook();}
function nextMb(){if(!_mbActive)return;if(_mbQ<_mbActive.questions.length-1){_mbQ++;renderMyBook();}else alert('마지막 문제예요!');}
if(_supa){
  _supa.auth.onAuthStateChange(function(event,session){
    _user=session?session.user:null;
    renderNav();
    if(_user&&(event==='SIGNED_IN'||event==='INITIAL_SESSION')){
      syncFromSupa();
    }
  });
}
try {
  if(typeof EXAM_DATA_36==='undefined'){throw new Error('data load failed');}
  renderNav();
  loadDbQuestions();
  renderSidebar();
  renderMain();
} catch(e) {
  document.getElementById('main').innerHTML='<div style="text-align:center;padding:60px 20px"><div style="font-size:48px">&#x1F625;</div><p style="font-size:16px;font-weight:700;color:#1e293b;margin:16px 0 8px">&#xB370;&#xC774;&#xD130;&#xB97C; &#xBD88;&#xB7EC;&#xC624;&#xC9C0; &#xBABB;&#xD588;&#xC5B4;&#xC694;</p><p style="font-size:13px;color:#64748b;margin-bottom:20px">&#xD398;&#xC774;&#xC9C0;&#xB97C; &#xC0C8;&#xB85C;&#xACE0;&#xCE68; &#xD574;&#xC8FC;&#xC138;&#xC694;</p><button onclick="location.reload()" style="padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">&#xC0C8;&#xB85C;&#xACE0;&#xCE68;</button></div>';
}