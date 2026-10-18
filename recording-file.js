// No transcoding or upload. Confirm the recorded container before naming a local file.
export function recordingFormat(bytes,declared='') {
  const type=declared.split(';')[0].trim().toLowerCase();
  const text=(start,end)=>String.fromCharCode(...bytes.slice(start,end));
  let format=null,accepted=[];
  if(bytes.length>=12&&text(4,8)==='ftyp'){
    format={type:'audio/mp4',extension:'m4a'};accepted=['audio/mp4','video/mp4',''];
  }else if(bytes.length>=8&&bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3&&text(0,bytes.length).includes('webm')){
    format={type:'audio/webm',extension:'webm'};accepted=['audio/webm','video/webm',''];
  }else if(bytes.length>=16&&text(0,4)==='OggS'){
    format={type:'audio/ogg',extension:'ogg'};accepted=['audio/ogg','application/ogg',''];
  }else if(bytes.length>=16&&text(0,4)==='RIFF'&&text(8,12)==='WAVE'){
    format={type:'audio/wav',extension:'wav'};accepted=['audio/wav','audio/wave','audio/x-wav',''];
  }
  if(!format||!accepted.includes(type))throw Error('Unrecognized or mismatched recording container');
  return format;
}
export async function prepareRecordingFile(blob,number) {
  if(!(blob instanceof Blob)||blob.size<16)throw Error('Empty recording');
  const format=recordingFormat(new Uint8Array(await blob.slice(0,512).arrayBuffer()),blob.type);
  const name='little-english-recording-'+Math.max(1,Number(number)||1)+'.'+format.extension;
  return new File([blob],name,{type:format.type,lastModified:0});
}
