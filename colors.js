// Original color play; fixed audio and optional practice share the course lifecycle.
export function createColorWorld({data,app,play,practice,finish}) {
  const all=data.colors,byId=id=>all.find(c=>c.id===id),$=s=>app.querySelector(s);
  const e=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const go=path=>location.hash='colors'+(path?'/'+path:'');
  const note='颜色的名字有时会重叠，屏幕与实物也可能不同。色块和 HEX 只作样本，没有唯一标准答案。';
  let selected=[];
  const swatch=(c,large=false)=>'<span class="color-swatch '+(large?'large':'')+'" style="background:'+c.hex+'" aria-hidden="true"></span>';
  const speech=c=>'<button class="secondary" data-color-say="'+c.id+'">🔊 <span lang="en">'+e(c.en)+'</span></button><button class="practice-open" data-color-practice="'+c.id+'">🎤 我来读</button>';
  const tile=c=>'<button class="color-tile" data-card="'+c.id+'">'+swatch(c)+'<strong lang="en">'+e(c.en)+'</strong><small>'+e(c.zh)+'</small></button>';
  const railCard=(l,attribute='data-line')=>'<button class="rail-card" '+attribute+'="'+l.id+'"><span class="rail-mark" style="background:'+l.hex+'"><b>'+l.number+'</b></span><strong>'+e(l.zh)+'</strong><span lang="en">'+e(l.name)+'</span><small>'+e(l.colorName)+'</small></button>';
  function render(){
    const parts=location.hash.slice(1).split('/'),section=parts[1]||'home',arg=parts[2];
    let body='',back='',title='',after=()=>{};
    if(section==='home'){
      title='颜色，一起发现。';back='course';
      body='<p>先玩几种喜欢的颜色，想看更多随时展开。没有解锁，也不用全部记住。</p><div class="color-modes">'+[
        ['learn/first','🎨','先玩六种颜色','红 · 黄 · 蓝 · 绿 · 橙 · 紫'],
        ['learn/next','🧺','再认识五种','粉 · 棕 · 黑 · 白 · 灰'],
        ['catalog/all','🔎','亲子查色卡','展开色系 · 放大 · 并排看看'],
        ['quiz/first/0','🔊','听颜色，找色卡','只用基础色，慢慢找'],
        ['life/red','🌿','关屏找颜色','把颜色带回生活'],
        ['rails','🚈','吉隆坡线路颜色','看标识色，不猜车身颜色']
      ].map(([path,icon,name,desc])=>'<button data-color-go="'+path+'"><span>'+icon+'</span><strong>'+name+'</strong><small>'+desc+'</small></button>').join('')+'</div><p class="color-note">'+note+'</p>';
    } else if(section==='learn'){
      title=arg==='next'?'再认识五种颜色':'先和六种颜色打招呼';
      body='<p>点喜欢的色卡，听一听，也可以一起说。想停就停。</p><div class="color-grid">'+(arg==='next'?data.next:data.first).map(id=>tile(byId(id))).join('')+'</div><div class="actions"><button class="primary" data-color-go="quiz/'+(arg==='next'?'next':'first')+'/0">玩听音找颜色</button><button class="secondary" data-color-go="done">今天玩到这里</button></div>';
    } else if(section==='card'){
      const c=byId(arg);if(!c){go('');return;}
      title=c.zh;back='catalog/'+c.family;
      body='<div class="color-detail">'+swatch(c,true)+'<h2 lang="en">'+e(c.en)+'</h2><div class="actions">'+speech(c)+'</div><p>'+e(c.life)+'</p><div class="actions"><button class="secondary" data-color-go="life/'+c.id+'">关屏找这种颜色</button><button class="secondary" data-color-go="catalog/'+c.family+'">展开同色家族</button></div><p class="color-note">'+note+' · '+c.hex+'</p></div>';
    } else if(section==='catalog'){
      title='亲子查色卡';const families=[...new Set(all.map(c=>c.family))],filter=families.includes(arg)?arg:'all',visible=filter==='all'?all:all.filter(c=>c.family===filter);
      body='<p>全部 '+all.length+' 张都能自由看。选择两张放大并排，近色不用分对错。</p><div class="color-families">'+['all',...families].map(f=>'<button data-family="'+f+'" aria-pressed="'+(filter===f)+'">'+(f==='all'?'全部':f==='blue-green'?'蓝绿之间':e(byId(f)?.zh||f))+'</button>').join('')+'</div><div class="compare-toolbar"><span id="compare-selection" role="status">已选 '+selected.length+' / 2</span><button id="compare-open" class="primary" '+(selected.length===2?'':'disabled')+'>放大并排看</button><button id="compare-clear" class="subtle">清除选择</button></div><div class="color-grid catalog">'+visible.map(c=>'<div class="catalog-item">'+tile(c)+'<button data-compare="'+c.id+'" aria-pressed="'+selected.includes(c.id)+'">'+(selected.includes(c.id)?'✓ 已选':'＋ 加入比较')+'</button></div>').join('')+'</div><p class="color-note">'+note+'</p>';
      after=()=>{
        app.querySelectorAll('[data-family]').forEach(b=>b.onclick=()=>go('catalog/'+b.dataset.family));
        app.querySelectorAll('[data-compare]').forEach(b=>b.onclick=()=>{const id=b.dataset.compare;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<2)selected.push(id);else{app.querySelector('#compare-selection').textContent='已选两张；先取消一张再换。';return;}render();});
        $('#compare-clear').onclick=()=>{selected=[];render();};$('#compare-open').onclick=()=>go('compare/'+selected.join('/'));
      };
    } else if(section==='compare'){
      title='放大，并排看看';back='catalog/all';
      const colors=[byId(arg),byId(parts[3])];if(colors.some(c=>!c)){go('catalog/all');return;}
      body='<div class="color-comparison">'+colors.map(c=>'<section>'+swatch(c,true)+'<h2>'+e(c.zh)+'</h2><p lang="en">'+e(c.en)+'</p><div class="actions">'+speech(c)+'</div><small>'+c.hex+' · 样本</small></section>').join('')+'</div><p class="color-note">'+note+' 像不像、喜欢哪种，都可以和家长说。</p>';
    } else if(section==='quiz'){
      const ids=arg==='next'?data.next:data.first,index=Math.max(0,Math.min(ids.length-1,Number(parts[3])||0)),target=byId(ids[index]),other=byId(ids[(index+Math.floor(ids.length/2))%ids.length]),options=index%2?[target,other]:[other,target];
      title='听一听，找颜色';
      body='<p>点听音，再找你看到的颜色。想跳过也可以。</p><button class="secondary" data-color-say="'+target.id+'">🔊 听要找的颜色</button><div class="color-grid color-choices">'+options.map(c=>'<button class="color-tile" data-color-choice="'+c.id+'">'+swatch(c)+'<strong>'+e(c.zh)+'</strong></button>').join('')+'</div><p id="color-feedback" class="feedback" role="status"></p><div class="actions"><button id="color-next" class="primary" hidden>继续玩 →</button><button id="color-skip" class="secondary">这次跳过</button><button class="subtle" data-color-go="done">今天玩到这里</button></div>';
      after=()=>{
        const next=()=>go(index+1<ids.length?'quiz/'+arg+'/'+(index+1):'done');
        $('#color-next').onclick=next;$('#color-skip').onclick=next;
        app.querySelectorAll('[data-color-choice]').forEach(b=>b.onclick=()=>{const choice=byId(b.dataset.colorChoice);if(choice.id===target.id){$('#color-feedback').textContent='找到啦！也可以和家长说说看到的颜色。';$('#color-next').hidden=false;play(choice.audioId);}else{$('#color-feedback').textContent='这是 '+choice.zh+'。再听一听，慢慢找；也可以跳过。';play(choice.audioId,()=>play(target.audioId));}});
      };
    } else if(section==='life'){
      const c=byId(arg)||byId('red');title='把颜色带回生活';
      body='<div class="color-detail">'+swatch(c)+'<h2>'+e(c.zh)+'</h2><div class="actions">'+speech(c)+'</div><div class="game"><h3>放下屏幕，和家长一起找</h3><p>'+e(c.life)+'</p><p>说“像这种颜色”也可以；光线不同、名字不同都没关系。只找安全、够得到的物品。</p></div><div class="actions"><button class="secondary" data-color-go="life/'+all[(all.indexOf(c)+1)%all.length].id+'">换一种颜色</button><button class="primary" data-color-go="done">关屏去找啦</button></div></div>';
    } else if(section==='rails'){
      title='吉隆坡线路的颜色';
      body='<p>看看线路标识上的色带。<strong>标识色和车身颜色不一定相同。</strong></p><div class="actions"><button class="primary" data-color-go="rail-find/red">听颜色，找线路</button><button class="secondary" data-color-go="rail-pair/green">给线路配同色卡</button></div><div class="rail-grid">'+data.rail.lines.map(l=>railCard(l)).join('')+'</div><p class="color-note">原创简化色卡，不是导航图。MRT、LRT 和单轨是不同制式；不画站点、方向或换乘关系。</p><button class="subtle" data-color-go="sources">家长看资料来源</button>';
    } else if(section==='rail-find'||section==='rail-pair'){
      const families=['red','yellow','green','orange'],family=families.includes(arg)?arg:'red',c=byId(family),pair=section==='rail-pair';title=pair?'给线路配同色卡':'听颜色，找线路';
      body='<p>这几条线路先玩红、黄、绿、橙。同一个色家族可以有不止一条线，近色不硬判错。</p><div class="actions">'+(pair?swatch(c):'')+'<button class="secondary" data-color-say="'+c.id+'">🔊 '+(pair?e(c.en):'听颜色')+'</button></div><div class="rail-grid">'+data.rail.lines.map(l=>railCard(l,'data-rail-choice')).join('')+'</div><p id="color-feedback" class="feedback" role="status"></p><div class="actions"><button id="rail-next" class="primary">换一种颜色</button><button class="secondary" data-color-go="rails">回到线路色卡</button></div>';
      after=()=>{
        $('#rail-next').onclick=()=>go(section+'/'+families[(families.indexOf(family)+1)%families.length]);
        app.querySelectorAll('[data-rail-choice]').forEach(b=>b.onclick=()=>{const l=data.rail.lines.find(x=>x.id===b.dataset.railChoice),picked=byId(l.color);$('#color-feedback').textContent=l.family===family?'可以呀！'+l.zh+'的标识是'+l.colorName+'。同色家族的其他线也可以找。':'这条是'+l.colorName+'。颜色叫法有重叠；再听听，也可以和家长一起看看。';play(picked.audioId);});
      };
    } else if(section==='line'){
      const l=data.rail.lines.find(x=>x.id===arg);if(!l){go('rails');return;}const c=byId(l.color);title=l.zh;back='rails';
      body='<div class="color-detail">'+railCard(l)+'<p>'+e(l.colorName)+'</p><div class="actions">'+speech(c)+'</div><p>看的是 '+e(l.name)+' 的线路标识色，不是在猜列车车身。</p><button class="secondary" data-color-go="rail-pair/'+l.family+'">一起找同色卡</button><p class="color-note">原创学习卡，不是导航图。</p></div>';
    } else if(section==='sources'){
      title='家长的颜色小注释';back='rails';
      body='<div class="color-source"><h2>名字不是一道唯一答案题</h2><p>'+note+' 金黄色只是平面色样，不代表屏幕能呈现金属光泽；蓝绿之间也有许多叫法。细分色供亲子查找，不要求孩子区分或背诵。</p><h2>轨道色卡的依据</h2><p>'+e(data.rail.sourceTitle)+'；核对日期：'+e(data.rail.verifiedOn)+'。</p><p>'+e(data.rail.note)+'</p><p>只节选已运营的 3、4、5、8、9、12 号线路。中文名称为便于陪玩的译名；英文名称、线号与制式依官方图例。</p><p><a href="'+data.rail.sourcePage+'" target="_blank" rel="noopener">MRT Corp 官方页面</a> · <a href="'+data.rail.sourcePDF+'" target="_blank" rel="noopener">2026 官方网络图 PDF（外部资料）</a></p><p>本应用不复制整张地图，也不提供站点、换乘、时间或导航。出行请查看运营方最新信息。离线时仍可读本页说明，外部来源链接需要联网。</p></div>';
    } else if(section==='done'){
      title='今天玩到这里啦';finish();
      body='<p>今天看到哪种颜色都很好，不用记住全部。和家长放下屏幕，去找一件喜欢的颜色吧。</p><div class="color-rainbow">'+data.first.map(id=>swatch(byId(id))).join('')+'</div><div class="actions"><button class="primary" data-color-go="">回到颜色世界</button><button class="secondary" data-course-home>回到生活课程</button></div>';
    } else {go('');return;}
    app.innerHTML='<div class="nav"><button id="color-back" class="subtle">← '+(back==='course'?'生活课程':'返回')+'</button><span>COLOR WORLD · 亲子陪玩</span></div><section class="color-world"><span class="eyebrow">A LITTLE COLOR, A BIG WORLD</span><h1>'+e(title)+'</h1>'+body+'</section>';
    $('#color-back').onclick=()=>back==='course'?location.hash='':go(back);
    app.querySelectorAll('[data-color-go]').forEach(b=>b.onclick=()=>go(b.dataset.colorGo));
    app.querySelectorAll('[data-course-home]').forEach(b=>b.onclick=()=>location.hash='');
    app.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>go('card/'+b.dataset.card));
    app.querySelectorAll('[data-line]').forEach(b=>b.onclick=()=>go('line/'+b.dataset.line));
    app.querySelectorAll('[data-color-say]').forEach(b=>b.onclick=()=>play(byId(b.dataset.colorSay).audioId));
    app.querySelectorAll('[data-color-practice]').forEach(b=>b.onclick=()=>practice(byId(b.dataset.colorPractice).audioId));
    after();window.scrollTo(0,0);
  }
  return {render};
}
