// Optional parent-enabled recording: one current phrase, session memory only.
const $=s=>document.querySelector(s),dialog=$('#practice-dialog'),status=$('#record-status');
const audio=new Audio();audio.setAttribute('playsinline','');
let enabled=false,pending=false,finalizing=false,recorder=null,stream=null,url=null,timer=null,tick=null,generation=0,current=null;
function tracksOff(){stream?.getTracks().forEach(t=>t.stop());stream=null;}
function stopReplay(){audio.pause();audio.removeAttribute('src');audio.load();}
function clearClip(){stopReplay();if(url)URL.revokeObjectURL(url);url=null;}
function timersOff(){clearTimeout(timer);clearInterval(tick);timer=null;tick=null;}
function support(){return typeof MediaRecorder!=='undefined'&&!!navigator.mediaDevices?.getUserMedia;}
function buttons(){const active=recorder?.state==='recording';$('#record-controls').hidden=!enabled;$('#practice-enable').hidden=enabled;$('#record-start').disabled=!enabled||pending||active||finalizing;$('#record-stop').disabled=!pending&&!active;$('#record-play').disabled=!url||pending||active||finalizing;$('#record-play-stop').disabled=!url;$('#record-delete').disabled=!url&&!pending&&!active&&!finalizing;$('#record-start').textContent=url?'↻ 再试一次':'🎤 我来读';$('#record-live').hidden=!active;$('#record-enable').textContent=enabled?'关闭本次跟读并删除':'允许本次麦克风跟读';$('#record-parent-status').textContent=enabled?'已开启本次跟读。到词句旁点麦克风；关闭模式或进入后台会删除录音。':'默认关闭。不申请麦克风；课程全部可以听和玩。';}
function cancel(){generation++;timersOff();pending=false;finalizing=false;if(recorder&&recorder.state!=='inactive'){try{recorder.stop();}catch{}}recorder=null;tracksOff();clearClip();buttons();}
function closePractice(){cancel();current=null;if(dialog.open)dialog.close();}
function dispose(){enabled=false;closePractice();buttons();}
function enable(){if(enabled){dispose();return;}if(!support()){status.textContent='此浏览器暂不支持录音，仍可听示范和继续玩。';$('#record-parent-status').textContent='此浏览器暂不支持录音，仍可完整听词和玩课。';return;}enabled=true;status.textContent='点麦克风再开始；浏览器会请求许可。最多 12 秒，不上传、不评分。';buttons();}
$('#record-enable').onclick=enable;$('#practice-enable').onclick=enable;
export function openPractice(clip){closePractice();document.dispatchEvent(new Event('course-stop'));current=clip;$('#practice-title').textContent=clip.text;$('#practice-image').src=clip.image;$('#practice-image').alt=clip.zh;$('#practice-meaning').textContent=clip.zh;status.textContent=enabled?'先听示范，再点麦克风说一说。想停随时停。':'先请家长开启本次麦克风跟读。只在内存里听自己，不上传。';buttons();dialog.showModal();}
$('#practice-demo').onclick=()=>{if(current)document.dispatchEvent(new CustomEvent('course-say',{detail:current.id}));};
$('#record-start').onclick=async()=>{if(!enabled||!current||pending||finalizing||recorder?.state==='recording')return;cancel();const token=++generation;pending=true;status.textContent='等待麦克风许可；点停止可以取消。';buttons();document.dispatchEvent(new Event('course-stop'));
try{const obtained=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(token!==generation||!enabled||!current||!dialog.open){obtained.getTracks().forEach(t=>t.stop());return;}stream=obtained;pending=false;
const choices=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'];const mime=choices.find(t=>MediaRecorder.isTypeSupported?.(t)&&audio.canPlayType(t));
const mr=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorder=mr;let chunks=[];
mr.ondataavailable=e=>{if(token===generation&&e.data.size)chunks.push(e.data);};
mr.onerror=()=>{if(token===generation){cancel();status.textContent='录音未完成，麦克风已关闭。可以再试或只听示范。';}};
mr.onstop=()=>{if(token!==generation){chunks=[];return;}timersOff();tracksOff();recorder=null;finalizing=false;if(!enabled||!current){chunks=[];buttons();return;}if(chunks.length){const blob=new Blob(chunks,{type:mr.mimeType||chunks[0].type});url=URL.createObjectURL(blob);status.textContent='✓ 可以听自己啦！这段只在本次内存，关掉面板就删除。';}else{status.textContent='没录到声音，可以再试一次。';}chunks=[];buttons();};
mr.start();const started=performance.now();status.textContent='● 正在录音，说一说吧！';$('#record-seconds').textContent='12 秒';$('#record-progress').value=0;buttons();tick=setInterval(()=>{const elapsed=(performance.now()-started)/1000;$('#record-seconds').textContent=Math.max(0,Math.ceil(12-elapsed))+' 秒';$('#record-progress').value=Math.min(12,elapsed);},200);timer=setTimeout(()=>{if(token===generation)stopRecording();},12000);
}catch(e){if(token!==generation)return;cancel();status.textContent=e.name==='NotAllowedError'?'麦克风权限未允许；仍可听示范和继续玩。':'这次无法录音，麦克风已关闭；仍可听示范和继续玩。';}
};
function stopRecording(){if(pending){cancel();status.textContent='已取消录音请求。';return;}if(recorder?.state==='recording'){timersOff();finalizing=true;recorder.stop();tracksOff();status.textContent='麦克风已关闭，正在准备回听…';buttons();}}
$('#record-stop').onclick=stopRecording;
$('#record-play').onclick=()=>{if(!url||pending||finalizing||recorder?.state==='recording')return;const token=generation;document.dispatchEvent(new Event('course-stop'));stopReplay();audio.src=url;status.textContent='▶ 正在听自己刚说的话。';audio.play().catch(()=>{if(token===generation&&current)status.textContent='这次回放未能开始，可以重试或删除；仍可听示范。';});};
audio.onended=()=>{if(current&&url)status.textContent='回听结束。可以再试一次，或删除。';};
$('#record-play-stop').onclick=()=>{stopReplay();status.textContent='回听已停止。';};
$('#record-delete').onclick=()=>{cancel();status.textContent='录音已删除，麦克风已关闭。';};
$('#practice-close').onclick=closePractice;dialog.addEventListener('close',()=>{if(!dialog.open){cancel();current=null;}});dialog.addEventListener('cancel',e=>{e.preventDefault();closePractice();});
document.addEventListener('course-demo-play',()=>{stopReplay();if(pending||finalizing||recorder?.state==='recording'){cancel();status.textContent='先听示范，再点麦克风来读。';}});
$('#stop-audio').addEventListener('click',()=>{stopReplay();if(pending||finalizing||recorder?.state==='recording'){cancel();status.textContent='声音已停止，麦克风已关闭。';}});
window.addEventListener('hashchange',closePractice);window.addEventListener('pagehide',dispose);document.addEventListener('visibilitychange',()=>{if(document.hidden)dispose();});
$('#parent-open').addEventListener('click',closePractice);$('#update').addEventListener('click',dispose);$('#download').addEventListener('click',dispose);buttons();
