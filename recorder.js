// Optional parent-enabled recording. Only explicit user clicks export a local file.
import {prepareRecordingFile} from './recording-file.js';
const $=s=>document.querySelector(s),dialog=$('#practice-dialog'),status=$('#record-status');
const audio=new Audio();audio.setAttribute('playsinline','');
let enabled=false,pending=false,finalizing=false,recorder=null,stream=null,url=null,timer=null,tick=null,generation=0,current=null,clipFile=null,serial=0,sharing=false,downloading=false,downloadTimer=null;
function tracksOff(){stream?.getTracks().forEach(t=>t.stop());stream=null;}
function stopReplay(){audio.pause();audio.removeAttribute('src');audio.load();}
function clearClip(){stopReplay();if(url)URL.revokeObjectURL(url);url=null;clipFile=null;clearTimeout(downloadTimer);downloadTimer=null;downloading=false;$('#record-file-info').textContent='';$('#record-export-status').textContent='';}
function timersOff(){clearTimeout(timer);clearInterval(tick);timer=null;tick=null;}
function support(){return typeof MediaRecorder!=='undefined'&&!!navigator.mediaDevices?.getUserMedia;}
function buttons(){const active=recorder?.state==='recording';const ready=enabled&&!!current&&!!url&&!!clipFile&&!pending&&!active&&!finalizing;$('#record-download').disabled=!ready||sharing||downloading;$('#record-share').disabled=!ready||sharing||downloading;$('#record-share').textContent=sharing?'正在打开分享…':'分享录音';$('#record-controls').hidden=!enabled;$('#practice-enable').hidden=enabled;$('#record-start').disabled=!enabled||pending||active||finalizing;$('#record-stop').disabled=!pending&&!active;$('#record-play').disabled=!url||pending||active||finalizing;$('#record-play-stop').disabled=!url;$('#record-delete').disabled=!url&&!pending&&!active&&!finalizing;$('#record-start').textContent=url?'↻ 再试一次':'🎤 我来读';$('#record-live').hidden=!active;$('#record-enable').textContent=enabled?'关闭本次跟读并删除':'允许本次麦克风跟读';$('#record-parent-status').textContent=enabled?'已开启本次跟读。到词句旁点麦克风；关闭模式或进入后台会清除未导出录音。':'默认关闭。不申请麦克风；课程全部可以听和玩。';}
function cancel(){generation++;timersOff();pending=false;finalizing=false;if(recorder&&recorder.state!=='inactive'){try{recorder.stop();}catch{}}recorder=null;tracksOff();clearClip();buttons();}
function closePractice(){cancel();current=null;if(dialog.open)dialog.close();}
function dispose(){enabled=false;closePractice();buttons();}
function enable(){if(enabled){dispose();return;}if(!support()){status.textContent='此浏览器暂不支持录音，仍可听示范和继续玩。';$('#record-parent-status').textContent='此浏览器暂不支持录音，仍可完整听词和玩课。';return;}enabled=true;status.textContent='点麦克风再开始；浏览器会请求许可。最多 12 秒，不上传、不评分。';buttons();}
$('#record-enable').onclick=enable;$('#practice-enable').onclick=enable;
export function openPractice(clip){closePractice();document.dispatchEvent(new Event('course-stop'));current=clip;$('#practice-title').textContent=clip.text;$('#practice-image').src=clip.image;$('#practice-image').alt=clip.zh;$('#practice-meaning').textContent=clip.zh;status.textContent=enabled?'先听示范，再点麦克风说一说。想停随时停。':'先请家长开启本次麦克风跟读。只在内存里听自己，不上传。';buttons();dialog.showModal();}
$('#practice-demo').onclick=()=>{if(current)document.dispatchEvent(new CustomEvent('course-say',{detail:current.id}));};
$('#record-start').onclick=async()=>{if(!enabled||!current||pending||finalizing||recorder?.state==='recording')return;cancel();const token=++generation;pending=true;status.textContent='等待麦克风许可；点停止可以取消。';buttons();document.dispatchEvent(new Event('course-stop'));
try{const obtained=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(token!==generation||!enabled||!current||!dialog.open){obtained.getTracks().forEach(t=>t.stop());return;}stream=obtained;pending=false;
const choices=['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];const mime=choices.find(t=>MediaRecorder.isTypeSupported?.(t)&&audio.canPlayType(t));
const mr=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorder=mr;let chunks=[];
mr.ondataavailable=e=>{if(token===generation&&e.data.size)chunks.push(e.data);};
mr.onerror=()=>{if(token===generation){cancel();status.textContent='录音未完成，麦克风已关闭。可以再试或只听示范。';}};
mr.onstop=async()=>{if(token!==generation){chunks=[];return;}timersOff();tracksOff();recorder=null;finalizing=true;buttons();
if(!enabled||!current){chunks=[];finalizing=false;buttons();return;}
const blob=new Blob(chunks,{type:mr.mimeType||chunks[0]?.type||''});chunks=[];
if(!blob.size){finalizing=false;status.textContent='没录到声音，可以再试一次。';buttons();return;}
let file=null;
try{file=await prepareRecordingFile(blob,++serial);}catch{}
if(token!==generation||!enabled||!current||!dialog.open)return;
clipFile=file;url=URL.createObjectURL(file||blob);finalizing=false;
status.textContent='✓ 可以听自己啦！未导出录音只在本次内存；刷新或关掉面板前请先保存。';
$('#record-file-info').textContent=file?'文件已准备：'+file.name+' · '+Math.ceil(file.size/1024)+' KB。刷新前请先保存。':'这次录音格式暂不能可靠导出，仍可回听；请换支持的浏览器重录。';
$('#record-export-status').textContent=file?(canShareFile(file)?'可下载，或由你打开系统分享面板选择应用及收件人。':'此浏览器暂不支持分享此音频文件；请先下载，再在“文件/下载”中分享。'):'';
buttons();};
mr.start();const started=performance.now();status.textContent='● 正在录音，说一说吧！';$('#record-seconds').textContent='12 秒';$('#record-progress').value=0;buttons();tick=setInterval(()=>{const elapsed=(performance.now()-started)/1000;$('#record-seconds').textContent=Math.max(0,Math.ceil(12-elapsed))+' 秒';$('#record-progress').value=Math.min(12,elapsed);},200);timer=setTimeout(()=>{if(token===generation)stopRecording();},12000);
}catch(e){if(token!==generation)return;cancel();status.textContent=e.name==='NotAllowedError'?'麦克风权限未允许；仍可听示范和继续玩。':'这次无法录音，麦克风已关闭；仍可听示范和继续玩。';}
};
function stopRecording(){if(pending){cancel();status.textContent='已取消录音请求。';return;}if(recorder?.state==='recording'){timersOff();finalizing=true;recorder.stop();tracksOff();status.textContent='麦克风已关闭，正在准备回听…';buttons();}}
$('#record-stop').onclick=stopRecording;
$('#record-play').onclick=()=>{if(!url||pending||finalizing||recorder?.state==='recording')return;const token=generation;document.dispatchEvent(new Event('course-stop'));stopReplay();audio.src=url;status.textContent='▶ 正在听自己刚说的话。';audio.play().catch(()=>{if(token===generation&&current)status.textContent='这次回放未能开始，可以重试或删除；仍可听示范。';});};
function canShareFile(file){try{return typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]})===true;}catch{return false;}}
function exportReady(){return enabled&&current&&dialog.open&&clipFile&&url&&!pending&&!finalizing&&recorder?.state!=='recording';}
$('#record-download').onclick=()=>{if(!exportReady()||sharing||downloading)return;document.dispatchEvent(new Event('course-stop'));stopReplay();const token=generation;downloading=true;buttons();
const link=document.createElement('a');link.href=url;link.download=clipFile.name;link.hidden=true;dialog.append(link);try{link.click();$('#record-export-status').textContent='已请求下载；请在浏览器下载列表或“文件”中确认保存。刷新前先确认文件可打开。';}catch{$('#record-export-status').textContent='这次未能下载；可以重试，或使用支持文件分享的浏览器。';}finally{link.remove();}
downloadTimer=setTimeout(()=>{downloading=false;if(token===generation)buttons();},800);};
$('#record-share').onclick=async()=>{if(!exportReady()||sharing||downloading)return;const file=clipFile,token=generation;
if(!canShareFile(file)){$('#record-export-status').textContent='此浏览器暂不支持分享此音频文件；请先下载，再在“文件/下载”中分享。';return;}
document.dispatchEvent(new Event('course-stop'));stopReplay();sharing=true;buttons();$('#record-export-status').textContent='由你在系统面板中选择应用和收件人；本应用不会代你发送。';
try{
 // File is prepared in onstop. No asynchronous work precedes share(): retain click activation.
 await navigator.share({files:[file],title:'一起说英语 · 跟读录音'});
 if(token===generation&&clipFile===file&&dialog.open)$('#record-export-status').textContent='系统分享操作已结束；本应用不能确认对方是否收到，请自行确认。';
}catch(error){
 if(token===generation&&clipFile===file&&dialog.open)$('#record-export-status').textContent=error.name==='AbortError'?'已取消分享，未确认发送。录音仍可下载。':'这次未能分享；可以重试，或先下载再在“文件/下载”中分享。';
}finally{sharing=false;buttons();}};
audio.onended=()=>{if(current&&url)status.textContent='回听结束。可以再试一次，或删除。';};
$('#record-play-stop').onclick=()=>{stopReplay();status.textContent='回听已停止。';};
$('#record-delete').onclick=()=>{cancel();status.textContent='录音已删除，麦克风已关闭。';};
$('#practice-close').onclick=closePractice;dialog.addEventListener('close',()=>{if(!dialog.open){cancel();current=null;}});dialog.addEventListener('cancel',e=>{e.preventDefault();closePractice();});
document.addEventListener('course-demo-play',()=>{stopReplay();if(pending||finalizing||recorder?.state==='recording'){cancel();status.textContent='先听示范，再点麦克风来读。';}});
$('#stop-audio').addEventListener('click',()=>{stopReplay();if(pending||finalizing||recorder?.state==='recording'){cancel();status.textContent='声音已停止，麦克风已关闭。';}});
window.addEventListener('hashchange',closePractice);window.addEventListener('pagehide',dispose);document.addEventListener('visibilitychange',()=>{if(document.hidden)dispose();});
$('#parent-open').addEventListener('click',closePractice);$('#update').addEventListener('click',dispose);$('#download').addEventListener('click',dispose);buttons();
