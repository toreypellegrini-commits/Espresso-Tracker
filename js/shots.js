// ─── Dialed — Shots ───
// Shot logging form, save, delete, form helpers.
// Loads after router.js.

// ─── LOG SHOT ───
function initExtractionDate(){const el=document.getElementById('f-extractdate');if(el){el.value=todayStr();updateExtractionHint();}}
function updateExtractionHint(){const val=document.getElementById('f-extractdate').value,hint=document.getElementById('extraction-date-hint');if(!val){hint.textContent='';return;}const diff=Math.round((new Date(todayStr()+'T12:00:00')-new Date(val+'T12:00:00'))/86400000);hint.textContent=diff===0?'Today':diff===1?'1 day ago':diff>1?`${diff} days ago`:'';}
document.getElementById('f-extractdate').addEventListener('change',()=>{updateExtractionHint();updateDaysOffRoast();});

function updateDaysOffRoast(){const days=calcDaysOffRoast(document.getElementById('f-roastdate').value,document.getElementById('f-extractdate').value||null);const el=document.getElementById('f-daysoffroast');if(days===null){el.className='computed-field dim';el.textContent='Set roast date above';return;}el.className='computed-field';if(days<7)el.innerHTML=`<span class="days-badge days-fresh">${days}d — resting</span>`;else if(days<=21)el.innerHTML=`<span class="days-badge days-peak">${days}d — peak window</span>`;else el.innerHTML=`<span class="days-badge days-old">${days}d — past peak</span>`;}
function updateRatio(){const dose=parseFloat(document.getElementById('f-dose').value),yld=parseFloat(document.getElementById('f-yield').value),el=document.getElementById('f-ratio');if(!isNaN(dose)&&!isNaN(yld)&&dose>0){el.className='computed-field';el.textContent=`1 : ${(yld/dose).toFixed(2)}`;}else{el.className='computed-field dim';el.textContent='Enter dose & yield';}}
function updateShareNotice(){const grinderId=document.getElementById('f-grinder').value,wrap=document.getElementById('share-notice-wrap'),notice=document.getElementById('share-notice');if(!grinderId){wrap.style.display='none';return;}wrap.style.display='block';const gr=grinderLib.find(x=>x.id==grinderId),gName=gr?gr.name:'this grinder';if(currentRating>=SHARE_MIN_RATING){notice.className='notice notice-success';notice.textContent=`This shot will be shared with the community for ${gName} — rated ${currentRating}★, params only, no tasting notes.`;}else if(currentRating>0){notice.className='notice notice-warning';notice.textContent=`Rated ${currentRating}★ — only shots rated ${SHARE_MIN_RATING}★+ are shared for ${gName}.`;}else{notice.className='notice notice-info';notice.textContent=`Rate this shot ${SHARE_MIN_RATING}★+ to share extraction params with the community for ${gName}. Tasting notes stay private.`;}}

document.querySelectorAll('.star').forEach(s=>{s.addEventListener('click',()=>{currentRating=+s.dataset.v;document.querySelectorAll('.star').forEach(x=>x.classList.toggle('active',+x.dataset.v<=currentRating));document.getElementById('star-label').textContent=['','Poor','Fair','Good','Great','Outstanding'][currentRating];updateShareNotice();});s.addEventListener('mouseover',()=>document.querySelectorAll('.star').forEach(x=>x.style.color=+x.dataset.v<=+s.dataset.v?'#d4880a':''));s.addEventListener('mouseout',()=>document.querySelectorAll('.star').forEach(x=>x.style.color=''));});

function populateRoastDropdown(){const sel=document.getElementById('roast-select'),prev=sel.value;sel.innerHTML='<option value="">— choose a saved roast —</option>';roastLib.filter(r=>!r.finished).forEach(r=>sel.innerHTML+=`<option value="${r.id}">${r.roaster} · ${r.origin}${r.varietal?' ('+r.varietal+')':''}</option>`);if(prev)sel.value=prev;}
function populateGrinderDropdown(){const sel=document.getElementById('f-grinder'),prev=sel.value;sel.innerHTML='<option value="">— none selected —</option>';grinderLib.forEach(g=>sel.innerHTML+=`<option value="${g.id}">${g.name}</option>`);if(prev)sel.value=prev;updateShareNotice();}

function loadRoast(){const r=roastLib.find(x=>x.id==document.getElementById('roast-select').value);if(!r)return;setField('f-roaster',r.roaster);setField('f-origin',r.origin);setField('f-varietal',r.varietal||'');setField('f-roastdate',r.roastDate||'');document.getElementById('f-process').value=r.process||'';document.getElementById('f-roast').value=r.roast||'';updateDaysOffRoast();}

async function saveShot(){
  const btn=document.getElementById('save-shot-btn');btn.disabled=true;btn.textContent='Saving…';setDbStatus('saving','Saving…');
  const dose=parseFloat(g('f-dose')),yld=parseFloat(g('f-yield'));
  const ratio=(!isNaN(dose)&&!isNaN(yld)&&dose>0)?+(yld/dose).toFixed(2):null;
  const roastDate=g('f-roastdate'),extractDate=g('f-extractdate')||todayStr();
  const grinderId=document.getElementById('f-grinder').value||null;
  const grinderName=grinderId?(grinderLib.find(x=>x.id==grinderId)||{}).name||null:null;
  const roastLibId=document.getElementById('roast-select').value||null;
  const shot={id:Date.now(),date:extractDate+'T12:00:00.000Z',roastLibId,roaster:g('f-roaster'),origin:g('f-origin'),varietal:g('f-varietal'),process:g('f-process'),roast:g('f-roast'),roastDate,daysOffRoast:calcDaysOffRoast(roastDate,extractDate),grinderId,grinderName,grind:g('f-grind'),dose:isNaN(dose)?null:dose,yield:isNaN(yld)?null:yld,ratio,temp:g('f-temp'),preinfusion:g('f-preinfusion'),time:g('f-time'),rating:currentRating,notes:g('f-notes')};
  try{
    const row=await dbInsert('shots',shot);shot._db_id=row.id;
    shots.unshift(shot);shots.sort((a,b)=>new Date(b.date)-new Date(a.date));
    setDbStatus('ok','Saved');
    // Check if this bag is now dialed
    if(roastLibId) checkDialedCondition(parseInt(roastLibId));
    const willShare=grinderId&&grinderName&&currentRating>=SHARE_MIN_RATING;
    if(willShare)await publishCommunityShot(shot,grinderName);
    const msg=willShare?`Shot saved and shared (${currentRating}★).`:'Shot saved!';
    flash('save-msg',msg,'success');
    clearForm();
    // Go back to roast detail if we came from there
    if(roastLibId){setTimeout(()=>navTo('roast-detail',{roastId:parseInt(roastLibId)}),1200);}
  }catch(e){setDbStatus('error','Save failed');flash('save-msg','Error saving — please try again','danger');}
  btn.disabled=false;btn.textContent='Save shot';
}

function clearForm(){['f-roaster','f-origin','f-varietal','f-grind','f-dose','f-yield','f-temp','f-preinfusion','f-time','f-notes','f-roastdate'].forEach(id=>setField(id,''));document.getElementById('f-process').value='';document.getElementById('f-roast').value='';document.getElementById('roast-select').value='';document.getElementById('f-grinder').value='';currentRating=0;document.querySelectorAll('.star').forEach(x=>x.classList.remove('active'));document.getElementById('star-label').textContent='tap to rate';setField('f-extractdate',todayStr());updateExtractionHint();updateDaysOffRoast();updateRatio();updateShareNotice();}

async function deleteShot(id){const s=shots.find(x=>x.id==id);if(!s)return;try{await dbDelete('shots',s._db_id);shots=shots.filter(x=>x.id!==id);setDbStatus('ok','Saved');if(currentPage==='roast-detail')renderRoastShots();else if(currentPage==='home')renderHome();else if(currentPage==='myshots')renderMyShots();}catch(e){setDbStatus('error','Error');}}


