// ─── Dialed — Insights ───
// Chart.js insights: overview, bag-level analysis.
// Loads after router.js.

// ─── INSIGHTS ───
function switchInsightView(view){currentInsightView=view;document.getElementById('toggle-overview').classList.toggle('active',view==='overview');document.getElementById('toggle-bag').classList.toggle('active',view==='bag');document.getElementById('insights-overview').style.display=view==='overview'?'block':'none';document.getElementById('insights-bag').style.display=view==='bag'?'block':'none';if(view==='bag')renderBagInsights();}

function destroyChart(id){if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];}}
function chartTheme(){const dark=window.matchMedia('(prefers-color-scheme: dark)').matches;const gc=dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)',tc=dark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.4)';const tt={backgroundColor:dark?'#2a2520':'#fff',titleColor:dark?'#f0ece4':'#1c1814',bodyColor:dark?'#9a9082':'#78726a',borderColor:dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.08)',borderWidth:1,padding:10,cornerRadius:8};return{gc,tc,tt};}

function calcStreak() {
  if (!shots.length) return 0;
  const dates = [...new Set(shots.map(s=>s.date.slice(0,10)))].sort().reverse();
  let streak = 0, prev = null;
  for (const d of dates) {
    if (!prev) { streak = 1; prev = d; continue; }
    const diff = (new Date(prev) - new Date(d)) / 86400000;
    if (diff === 1) { streak++; prev = d; }
    else break;
  }
  return streak;
}

function ratingColor(r) {
  const colors = {1:'#e24b4a',2:'#e8783a',3:'#d4880a',4:'#7ab648',5:'#2a9d4e'};
  return colors[r]||'#888';
}

function renderInsights(){
  const el=document.getElementById('insights-overview');
  if(!shots.length){el.innerHTML='<div class="empty">Log some shots to see insights.</div>';return;}

  // Stats
  const rated=shots.filter(s=>s.rating>0);
  const fiveStars=shots.filter(s=>s.rating===5).length;
  const streak=calcStreak();
  const roasterCounts={};shots.forEach(s=>{if(s.roaster)roasterCounts[s.roaster]=(roasterCounts[s.roaster]||0)+1;});
  const favRoaster=Object.entries(roasterCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
  const originCounts={};shots.forEach(s=>{if(s.origin)originCounts[s.origin]=(originCounts[s.origin]||0)+1;});
  const favOrigin=Object.entries(originCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
  const avgRating=rated.length?(rated.reduce((a,b)=>a+b.rating,0)/rated.length).toFixed(1):'—';

  el.innerHTML=`
    <div class="section-title">User stats</div>
    <div class="profile-section" style="margin-bottom:1.5rem;">
      <table class="stats-table">
        <tr><td>Total shots pulled</td><td>${shots.length}</td></tr>
        <tr><td>Average rating</td><td>${avgRating}${avgRating!=='—'?' ★':''}</td></tr>
        <tr><td>5★ shots</td><td>${fiveStars}</td></tr>
        <tr><td>Favorite roaster</td><td style="font-size:14px;">${favRoaster}</td></tr>
        <tr><td>Favorite origin</td><td style="font-size:14px;">${favOrigin}</td></tr>
        <tr><td>Current daily streak</td><td>${streak} day${streak!==1?'s':''}</td></tr>
        <tr><td>Bags in library</td><td>${roastLib.length}</td></tr>
      </table>
    </div>
    <div class="section-title">Shot scatter — all bags</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">Shot time (x) · Grind (left y) · Ratio (right y) · Color = rating</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;font-size:12px;">
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#2a9d4e;display:inline-block;"></span>5★</span>
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#7ab648;display:inline-block;"></span>4★</span>
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#d4880a;display:inline-block;"></span>3★</span>
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#e8783a;display:inline-block;"></span>2★</span>
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#e24b4a;display:inline-block;"></span>1★</span>
      <span style="display:flex;align-items:center;gap:4px;color:var(--muted);"><span style="width:10px;height:10px;border-radius:50%;background:var(--muted);display:inline-block;opacity:0.5;"></span>unrated</span>
    </div>
    <div class="chart-wrap" style="height:300px;"><canvas id="chart-scatter-all"></canvas></div>`;

  setTimeout(()=>{
    const{gc,tc,tt}=chartTheme();
    destroyChart('chart-scatter-all');
    const scatterData=shots.filter(s=>s.time&&s.grind).map(s=>({
      x:parseFloat(s.time),
      y:parseFloat(s.grind),
      ratio:s.ratio||null,
      rating:s.rating||0,
      label:`${s.roaster||'?'} · ${s.origin||'?'}`
    }));
    if(!scatterData.length){document.getElementById('chart-scatter-all').parentElement.innerHTML='<div class="empty" style="padding:1rem;">Log shots with shot time and grind setting to see this chart.</div>';return;}
    // Group by rating for colored datasets
    const byRating={0:[],1:[],2:[],3:[],4:[],5:[]};
    scatterData.forEach(p=>byRating[p.rating].push(p));
    const ratingLabels={0:'Unrated',1:'1★',2:'2★',3:'3★',4:'4★',5:'5★'};
    const ratingColors={0:'rgba(150,150,150,0.5)',1:'#e24b4a',2:'#e8783a',3:'#d4880a',4:'#7ab648',5:'#2a9d4e'};
    const datasets=Object.entries(byRating).filter(([r,pts])=>pts.length).map(([r,pts])=>({
      label:ratingLabels[r],
      data:pts,
      backgroundColor:ratingColors[r]+'cc',
      pointRadius:7,
      pointHoverRadius:9,
    }));
    chartInstances['chart-scatter-all']=new Chart(document.getElementById('chart-scatter-all'),{
      type:'scatter',
      data:{datasets},
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{...tt,callbacks:{label:(ctx)=>{const p=ctx.raw;return[`${p.label}`,`Time: ${p.x}s · Grind: ${p.y}${p.ratio?' · 1:'+p.ratio.toFixed(2):''}`,p.rating?`Rating: ${'★'.repeat(p.rating)}`:'Unrated'];}}}
        },
        scales:{
          x:{title:{display:true,text:'Shot time (s)',color:tc,font:{size:11}},grid:{color:gc},ticks:{color:tc}},
          y:{title:{display:true,text:'Grind setting',color:tc,font:{size:11}},grid:{color:gc},ticks:{color:tc}}
        }
      }
    });
  },100);
}

function renderBagInsights(){
  const el=document.getElementById('insights-bag');
  const bagsWithShots=roastLib.filter(r=>shots.some(s=>s.roastLibId==r.id));
  if(!bagsWithShots.length){el.innerHTML='<div class="empty">No shots linked to a roast yet.</div>';return;}
  if(!selectedBagId||!bagsWithShots.find(r=>r.id==selectedBagId))selectedBagId=bagsWithShots[0].id;
  const bag=roastLib.find(r=>r.id==selectedBagId);
  const bagShots=shots.filter(s=>s.roastLibId==selectedBagId).sort((a,b)=>new Date(a.date)-new Date(b.date)||(a.id||0)-(b.id||0));
  const bagOptions=bagsWithShots.map(r=>`<option value="${r.id}"${selectedBagId==r.id?' selected':''}>${r.roastName ? r.roaster+' · '+r.roastName : r.roaster}${r.finished?' ✓':''}</option>`).join('');
  if(!bag||!bagShots.length){el.innerHTML=`<select onchange="selectedBagId=+this.value;renderBagInsights();" style="width:100%;font-size:13px;margin-bottom:1rem;">${bagOptions}</select><div class="empty">No shots for this bag yet.</div>`;return;}

  const rated=bagShots.filter(s=>s.rating>0);
  const avgRating=rated.length?(rated.reduce((a,b)=>a+b.rating,0)/rated.length).toFixed(1):'—';
  const bestShot=rated.length?[...rated].sort((a,b)=>b.rating-a.rating)[0]:null;
  const lastShot=bagShots[bagShots.length-1];
  const MIN_SCATTER=5;

  el.innerHTML=`
    <select onchange="selectedBagId=+this.value;renderBagInsights();" style="width:100%;font-size:13px;margin-bottom:1rem;">${bagOptions}</select>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1rem 1.25rem;margin-bottom:1.25rem;">
      <div style="font-family:var(--font-serif);font-size:15px;font-weight:500;">${bag.roastName ? bag.roaster+' · '+bag.roastName : bag.roaster}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:3px;">${[bag.origin,bag.varietal,bag.process,bag.roast].filter(Boolean).join(' · ')}${bag.roastDate?' · Roasted '+fmtDate(bag.roastDate+'T12:00:00'):''}${bag.finished?` · <span style="color:var(--success-text);">Finished</span>`:''}</div>
    </div>
    <div class="insight-grid">
      <div class="insight-card"><div class="insight-label">Shots pulled</div><div class="insight-val">${bagShots.length}</div></div>
      <div class="insight-card"><div class="insight-label">Average rating</div><div class="insight-val">${avgRating}${avgRating!=='—'?` <span style="font-size:16px;color:#d4880a;">★</span>`:''}</div><div class="insight-sub">${rated.length} rated</div></div>
      <div class="insight-card"><div class="insight-label">Days spanned</div><div class="insight-val">${bagShots.length>1?calcDaysOffRoast(bagShots[0].date.slice(0,10),bagShots[bagShots.length-1].date.slice(0,10)):'—'}</div><div class="insight-sub">first to last</div></div>
      <div class="insight-card"><div class="insight-label">Last pulled</div><div class="insight-val" style="font-size:14px;margin-top:4px;">${fmtDate(lastShot.date)}</div><div class="insight-sub">${lastShot.daysOffRoast!=null?lastShot.daysOffRoast+'d off roast':''}</div></div>
    </div>
    ${bestShot?`<div class="section-title">Best shot from this bag</div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:0.875rem 1.25rem;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:13px;font-weight:600;">${fmtDate(bestShot.date)}${bestShot.daysOffRoast!=null?' · '+bestShot.daysOffRoast+'d off roast':''}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px;">${[bestShot.grind?'Grind '+bestShot.grind:null,bestShot.ratio?'1:'+bestShot.ratio:null,bestShot.temp?bestShot.temp+'°C':null,bestShot.time?bestShot.time+'s':null].filter(Boolean).join(' · ')}</div>
        ${bestShot.notes?`<div style="font-size:12px;color:var(--muted);margin-top:3px;font-style:italic;">${bestShot.notes.slice(0,80)}</div>`:''}
      </div>
      <span style="font-size:16px;color:#d4880a;margin-left:12px;">${'★'.repeat(bestShot.rating)}</span>
    </div>`:''}
    <div class="section-title">Chart 1 — Grind Setting Over Time</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">How your grind setting has changed across shots — track your dial-in journey</div>
    <div class="chart-wrap" style="height:220px;"><canvas id="bag-c0"></canvas></div>
    <div class="section-title">Chart 2 — Dial-In Progression</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">Brew time and yield over shots — are you dialling in?</div>
    <div class="chart-wrap" style="height:220px;"><canvas id="bag-c1"></canvas></div>
    <div class="section-title">Chart 3 — Grind vs Shot Time (Calibration Curve)</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">How grind setting affects extraction time for this coffee · requires ${MIN_SCATTER}+ shots</div>
    <div class="chart-wrap" style="height:220px;"><canvas id="bag-c2"></canvas></div>
    <div class="section-title">Chart 4 — Ratio vs Rating</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">Which brew ratios are tasting best · requires ${MIN_SCATTER}+ shots</div>
    <div class="chart-wrap" style="height:240px;"><canvas id="bag-c3"></canvas></div>
    <div class="section-title">Chart 5 — Shot Time vs Rating</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">Your sweet spot extraction time · requires ${MIN_SCATTER}+ shots</div>
    <div class="chart-wrap" style="height:220px;"><canvas id="bag-c4"></canvas></div>
    <div class="section-title">Chart 6 — Rating by Days Off Roast</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">How ratings change as the bag rests — find your sweet spot</div>
    <div class="chart-wrap" style="height:220px;"><canvas id="bag-c5"></canvas></div>
  `;

  setTimeout(()=>{
    const{gc,tc,tt}=chartTheme();
    const shotLabels=bagShots.map((_,i)=>`Shot ${i+1}`);
    const dateLabels=bagShots.map(s=>fmtDate(s.date));
    const ratingColor=r=>['','#e24b4a','#e8783a','#d4880a','#7ab648','#2a9d4e'][r]+'cc';

    // ── CHART 0 (displayed as Chart 1): Grind Setting Over Time ──
    destroyChart('bag-c0');
    const c0grind=bagShots.map(s=>s.grind?parseFloat(s.grind):null);
    if(c0grind.some(v=>v!==null)){
      const c0vals=c0grind.filter(v=>v!==null);
      const c0min=Math.floor(Math.min(...c0vals))-1;
      const c0max=Math.ceil(Math.max(...c0vals))+1;
      chartInstances['bag-c0']=new Chart(document.getElementById('bag-c0'),{
        type:'line',
        data:{labels:shotLabels,datasets:[{
          label:'Grind setting',
          data:c0grind,
          borderColor:'#b85215',backgroundColor:'#b8521518',
          pointBackgroundColor:'#b85215',
          tension:0.3,pointRadius:5,pointHoverRadius:7,fill:true,spanGaps:true
        }]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},
            tooltip:{...tt,callbacks:{title:(items)=>`${shotLabels[items[0].dataIndex]} · ${dateLabels[items[0].dataIndex]}`,label:(ctx)=>`Grind: ${ctx.raw}`}}},
          scales:{
            x:{grid:{color:gc},ticks:{color:tc}},
            y:{grid:{color:gc},min:c0min,max:c0max,
              ticks:{color:tc,stepSize:1,callback:v=>Number.isInteger(v)?v:''},
              title:{display:true,text:'Grind setting',color:tc,font:{size:11}}}
          }}
      });
    } else {
      document.getElementById('bag-c0').parentElement.innerHTML='<div class="empty" style="padding:1rem;">No grind data for this bag.</div>';
    }

    // ── CHART 2 (displayed as Chart 2): Dial-In Progression ──
    destroyChart('bag-c1');
    const c1time=bagShots.map(s=>s.time?parseFloat(s.time):null);
    const c1yield=bagShots.map(s=>s.yield?parseFloat(s.yield):null);
    if(c1time.some(v=>v!==null)||c1yield.some(v=>v!==null)){
      chartInstances['bag-c1']=new Chart(document.getElementById('bag-c1'),{
        type:'line',
        data:{labels:shotLabels,datasets:[
          {label:'Shot time (s)',data:c1time,borderColor:'#b85215',backgroundColor:'transparent',pointBackgroundColor:'#b85215',tension:0.3,pointRadius:5,pointHoverRadius:7,spanGaps:true,yAxisID:'y'},
          {label:'Yield (g)',data:c1yield,borderColor:'#1a4fa0',backgroundColor:'transparent',pointBackgroundColor:'#1a4fa0',tension:0.3,pointRadius:5,pointHoverRadius:7,spanGaps:true,yAxisID:'y2',borderDash:[4,3]}
        ]},
        options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
          plugins:{legend:{display:true,labels:{color:tc,font:{size:11},usePointStyle:true,pointStyle:'line',pointStyleWidth:24}},
            tooltip:{...tt,callbacks:{title:(items)=>`${shotLabels[items[0].dataIndex]} · ${dateLabels[items[0].dataIndex]}`}}},
          scales:{
            x:{grid:{color:gc},ticks:{color:tc}},
            y:{grid:{color:gc},ticks:{color:tc},title:{display:true,text:'Shot time (s)',color:'#b85215',font:{size:11}},position:'left'},
            y2:{grid:{display:false},ticks:{color:tc},title:{display:true,text:'Yield (g)',color:'#1a4fa0',font:{size:11}},position:'right'}
          }}
      });
    } else {
      document.getElementById('bag-c1').parentElement.innerHTML='<div class="empty" style="padding:1rem;">No brew time or yield data for this bag.</div>';
    }

    // ── CHART 2: Grind vs Shot Time ──
    destroyChart('bag-c2');
    const c2raw=bagShots.filter(s=>s.grind&&s.time).map(s=>({x:parseFloat(s.grind),y:parseFloat(s.time),date:fmtDate(s.date),shotNum:bagShots.indexOf(s)+1}));
    if(c2raw.length>=MIN_SCATTER){
      const c2data=[...c2raw].sort((a,b)=>a.x-b.x);
      const c2xvals=c2data.map(d=>d.x);
      const c2min=Math.floor(Math.min(...c2xvals))-2;
      const c2max=Math.ceil(Math.max(...c2xvals))+2;
      chartInstances['bag-c2']=new Chart(document.getElementById('bag-c2'),{
        type:'scatter',
        data:{datasets:[{label:'Grind vs Time',data:c2data,backgroundColor:'#b8521599',pointRadius:7,pointHoverRadius:9}]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:(ctx)=>`Grind ${ctx.raw.x} → ${ctx.raw.y}s · Shot ${ctx.raw.shotNum} · ${ctx.raw.date}`}}},
          scales:{
            x:{title:{display:true,text:'Grind setting',color:tc,font:{size:11}},grid:{color:gc},min:c2min,max:c2max,
              ticks:{color:tc,stepSize:1,callback:v=>Number.isInteger(v)?v:''}},
            y:{title:{display:true,text:'Shot time (s)',color:tc,font:{size:11}},grid:{color:gc},ticks:{color:tc}}
          }}
      });
    } else {
      document.getElementById('bag-c2').parentElement.innerHTML=`<div class="empty" style="padding:1rem;">Need ${MIN_SCATTER}+ shots with grind + shot time data. You have ${c2raw.length} so far.</div>`;
    }

    // ── CHART 3: Ratio vs Rating with zone shading ──
    destroyChart('bag-c3');
    // Deregister previous zone label plugin if any
    try { Chart.unregister({id:'c3ZoneLabels'}); } catch(e) {}
    const c3raw=bagShots.filter(s=>s.ratio&&s.rating>0).map(s=>({x:parseFloat(s.ratio),y:s.rating,date:fmtDate(s.date),shotNum:bagShots.indexOf(s)+1}));
    if(c3raw.length>=MIN_SCATTER){
      // Zone shading via background plugin
      const c3ZonePlugin={
        id:'c3ZoneLabels',
        beforeDraw(chart){
          if(chart.canvas.id!=='bag-c3')return;
          const{ctx,chartArea:{left,right,top,bottom},scales:{x,y}}=chart;
          const zones=[
            {from:1.0,to:1.5,color:'rgba(90,35,5,0.12)',label:'Ristretto'},
            {from:1.5,to:2.5,color:'rgba(140,60,15,0.09)',label:'Standard'},
            {from:2.5,to:4.0,color:'rgba(184,82,21,0.06)',label:'Modern / Turbo'}
          ];
          ctx.save();
          zones.forEach(z=>{
            const x1=Math.max(x.getPixelForValue(z.from),left);
            const x2=Math.min(x.getPixelForValue(z.to),right);
            ctx.fillStyle=z.color;
            ctx.fillRect(x1,top,x2-x1,bottom-top);
            ctx.fillStyle='rgba(120,60,20,0.45)';
            ctx.font='500 10px sans-serif';
            ctx.textAlign='center';
            ctx.fillText(z.label,(x1+x2)/2,top+12);
          });
          ctx.restore();
        }
      };
      Chart.register(c3ZonePlugin);
      chartInstances['bag-c3']=new Chart(document.getElementById('bag-c3'),{
        type:'scatter',
        data:{datasets:[{
          label:'Ratio vs Rating',data:c3raw,
          backgroundColor:c3raw.map(d=>ratingColor(d.y)),
          pointRadius:8,pointHoverRadius:10
        }]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:(ctx)=>`1:${ctx.raw.x.toFixed(2)} · ${ctx.raw.y}★ · Shot ${ctx.raw.shotNum} · ${ctx.raw.date}`}}},
          scales:{
            x:{title:{display:true,text:'Ratio (yield ÷ dose)',color:tc,font:{size:11}},grid:{color:gc},min:1.0,max:4.0,
              ticks:{color:tc,stepSize:0.25,callback:v=>{const r=Math.round(v*4)/4;return Math.abs(v-r)<0.001?`1:${r%1===0?r.toFixed(0):r}`:'';}}},
            y:{title:{display:true,text:'Rating',color:tc,font:{size:11}},min:0,max:6,ticks:{color:tc,stepSize:1,callback:v=>v===6?'':v},grid:{color:gc}}
          }}
      });
    } else {
      document.getElementById('bag-c3').parentElement.innerHTML=`<div class="empty" style="padding:1rem;">Need ${MIN_SCATTER}+ rated shots with ratio data. You have ${c3raw.length} so far.</div>`;
    }

    // ── CHART 4: Shot Time vs Rating ──
    destroyChart('bag-c4');
    const c4raw=bagShots.filter(s=>s.time&&s.rating>0).map(s=>({x:parseFloat(s.time),y:s.rating,date:fmtDate(s.date),shotNum:bagShots.indexOf(s)+1}));
    if(c4raw.length>=MIN_SCATTER){
      chartInstances['bag-c4']=new Chart(document.getElementById('bag-c4'),{
        type:'scatter',
        data:{datasets:[{label:'Time vs Rating',data:c4raw,backgroundColor:c4raw.map(d=>ratingColor(d.y)),pointRadius:8,pointHoverRadius:10}]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:(ctx)=>`${ctx.raw.x}s · ${ctx.raw.y}★ · Shot ${ctx.raw.shotNum} · ${ctx.raw.date}`}}},
          scales:{
            x:{title:{display:true,text:'Shot time (s)',color:tc,font:{size:11}},grid:{color:gc},ticks:{color:tc}},
            y:{title:{display:true,text:'Rating',color:tc,font:{size:11}},min:0,max:6,ticks:{color:tc,stepSize:1,callback:v=>v===6?'':v},grid:{color:gc}}
          }}
      });
    } else {
      document.getElementById('bag-c4').parentElement.innerHTML=`<div class="empty" style="padding:1rem;">Need ${MIN_SCATTER}+ rated shots with shot time data. You have ${c4raw.length} so far.</div>`;
    }

    // ── CHART 5: Rating by Days Off Roast ──
    destroyChart('bag-c5');
    const c5raw=bagShots.filter(s=>s.rating>0&&s.daysOffRoast!=null);
    const c5all=bagShots.filter(s=>s.rating>0);
    if(c5raw.length>=2){
      const c5data=c5raw.map(s=>({x:s.daysOffRoast,y:s.rating,date:fmtDate(s.date),notes:s.notes||''}));
      chartInstances['bag-c5']=new Chart(document.getElementById('bag-c5'),{
        type:'scatter',
        data:{datasets:[{label:'Rating',data:c5data,backgroundColor:c5raw.map(s=>ratingColor(s.rating)),pointRadius:7,pointHoverRadius:9}]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:(ctx)=>`${ctx.raw.x}d off roast · ${ctx.raw.y}★ · ${ctx.raw.date}${ctx.raw.notes?' · '+ctx.raw.notes.slice(0,40):''}`}}},
          scales:{
            x:{title:{display:true,text:'Days off roast',color:tc,font:{size:11}},grid:{color:gc},ticks:{color:tc}},
            y:{title:{display:true,text:'Rating',color:tc,font:{size:11}},min:0,max:6,ticks:{color:tc,stepSize:1,callback:v=>v===6?'':v},grid:{color:gc}}
          }}
      });
    } else if(c5all.length>=2){
      chartInstances['bag-c5']=new Chart(document.getElementById('bag-c5'),{
        type:'line',
        data:{labels:c5all.map((_,i)=>`Shot ${i+1}`),datasets:[{
          label:'Rating',data:c5all.map(s=>s.rating),
          borderColor:'#d4880a',backgroundColor:'#d4880a18',
          pointBackgroundColor:c5all.map(s=>ratingColor(s.rating).replace('cc','ff')),
          pointRadius:7,pointHoverRadius:9,tension:0.3,fill:true
        }]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{...tt,callbacks:{label:(ctx)=>`${ctx.raw}★${c5all[ctx.dataIndex]?.notes?' · '+c5all[ctx.dataIndex].notes.slice(0,40):''}`}}},
          scales:{
            x:{grid:{color:gc},ticks:{color:tc}},
            y:{title:{display:true,text:'Rating',color:tc,font:{size:11}},min:0,max:6,ticks:{color:tc,stepSize:1,callback:v=>v===6?'':v},grid:{color:gc}}
          }}
      });
    } else {
      document.getElementById('bag-c5').parentElement.innerHTML='<div class="empty" style="padding:1rem;">Log at least 2 rated shots to see taste progression.</div>';
    }

  },100);
}


