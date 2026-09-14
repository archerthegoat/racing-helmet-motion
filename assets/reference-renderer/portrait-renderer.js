import { createAutoRevealField } from './auto-reveal-field.js';

const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUV;
void main() {
  vUV = aPosition * .5 + .5;
  gl_Position = vec4(aPosition, 0., 1.);
}`;

const fragmentSource = `
precision highp float;
uniform sampler2D uPhoto;
uniform sampler2D uHelmet;
uniform sampler2D uGhost;
uniform sampler2D uFlow;
uniform sampler2D uPreviousFlow;
uniform sampler2D uCurl;
uniform sampler2D uPreviousCurl;
uniform float uAutoBlend;
uniform float uFlowBlend;
uniform vec2 uSize;
uniform vec2 uShift;
uniform float uRoll;
uniform vec2 uTurn;
uniform vec4 uPhotoRect;
uniform vec4 uHelmetRect;
uniform vec4 uGhostRect;
uniform vec4 uCurlRect;
uniform float uAutoStrength;
uniform float uFull;
uniform float uGhostReady;
uniform float uTime;
uniform float uActivity;
uniform float uGhostMotion;
uniform float uGhostTime;
varying vec2 vUV;
vec4 layer(sampler2D tex, vec2 p, vec4 rect) {
  vec2 uv = (p - rect.xy) / rect.zw;
  if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return vec4(0.);
  return texture2D(tex, vec2(uv.x, 1. - uv.y));
}
vec4 flowAt(vec2 uv) {
  return mix(texture2D(uPreviousFlow,uv),texture2D(uFlow,uv),uFlowBlend);
}
void main() {
  vec2 screenUV = vec2(vUV.x, 1. - vUV.y);
  vec2 screen = screenUV * uSize;
  vec2 pivot = uPhotoRect.xy + uPhotoRect.zw * vec2(.5, .48);
  float c = cos(uRoll), s = sin(uRoll);
  vec2 rayXY = mat2(c, -s, s, c) * (screen - uShift - pivot);
  // Inverse-project one rigid image plane. All layers turn together; no face depth warp.
  float cy=cos(uTurn.x), sy=sin(uTurn.x), cx=cos(uTurn.y), sx=sin(uTurn.y);
  vec3 axisX=vec3(cy,0.,-sy), axisY=vec3(sy*sx,cx,cy*sx);
  vec3 planeNormal=cross(axisX,axisY);
  float perspective=max(800.,uPhotoRect.w*1.8);
  vec3 eye=vec3(0.,0.,perspective), ray=vec3(rayXY,-perspective);
  vec3 hit=eye+ray*(-dot(eye,planeNormal)/dot(ray,planeNormal));
  vec2 p=vec2(dot(hit,axisX),dot(hit,axisY))+pivot;
  vec4 photo = layer(uPhoto, p, uPhotoRect);
  vec2 photoUV = (p - uPhotoRect.xy) / uPhotoRect.zw;
  photo *= (1. - smoothstep(.80, .985, photoUV.y)) * smoothstep(0., .08, photoUV.x) * (1. - smoothstep(.92, 1., photoUV.x));

  vec4 flow = uActivity>0. ? flowAt(screenUV) : vec4(.5,.5,0.,.5);
  vec2 normal = (flow.rg * 2. - 1.) * uActivity;
  float wave = (flow.a * 2. - 1.) * uActivity;
  vec2 refraction = normal * 2.5;
  vec4 flowed = uActivity>0. ? flowAt(clamp(screenUV + normal * 2. / uSize, vec2(0.), vec2(1.))) : vec4(.5,.5,0.,.5);
  float dye = flowed.b * uActivity;
  float edgeNoise = sin(p.x*.057 + uTime*1.2) * sin(p.y*.044 - uTime*.8) * .026 * dye;
  float reveal = smoothstep(.20, .34, dye + abs(wave)*.17 + edgeNoise);
  // Local dye survives its source and keeps shearing, turning and dissipating.
  // Interpolate transport states before thresholding to retain clear moving edges.
  vec4 curl = uAutoStrength>0. ? mix(layer(uPreviousCurl,p,uCurlRect),layer(uCurl,p,uCurlRect),uAutoBlend) : vec4(128./255.,128./255.,0.,0.);
  float autoMask = smoothstep(.16,.30,curl.b)*uAutoStrength;
  float autoWake = smoothstep(.008,.13,curl.b)*uAutoStrength;
  float mask = max(uFull, max(reveal,autoMask));
  vec2 autoRefraction = (curl.rg-128./255.)*2.*autoMask;
  vec4 shell = layer(uHelmet, p + (refraction+autoRefraction) * (1. - uFull), uHelmetRect);

  // The ghost has its own continuous material motion, independent of reveal dye.
  // Normalize to the visible shell, excluding the source photograph's padding.
  vec2 shellUV = (p-uHelmetRect.xy)/uHelmetRect.zw;
  vec2 q = (shellUV-vec2(167./640.,40./425.))/vec2(309./640.,353./425.);
  float t = uGhostTime;
  vec2 drift = vec2(sin(q.y*4.5+t*.63), cos(q.x*4.-t*.47)) * .75*uGhostMotion;
  vec2 ghostPoint = p + refraction*.4 + drift;
  vec4 wire = layer(uGhost, ghostPoint, uGhostRect);
  float line = max(0., dot(wire.rgb, vec3(.2126,.7152,.0722))-.035);
  vec4 ghostShell = layer(uHelmet,ghostPoint,uHelmetRect);
  float shellGray = dot(ghostShell.rgb, vec3(.2126,.7152,.0722));
  vec4 left = layer(uHelmet,ghostPoint+vec2(-1.3,0.),uHelmetRect);
  vec4 right = layer(uHelmet,ghostPoint+vec2(1.3,0.),uHelmetRect);
  vec4 top = layer(uHelmet,ghostPoint+vec2(0.,-1.3),uHelmetRect);
  vec4 bottom = layer(uHelmet,ghostPoint+vec2(0.,1.3),uHelmetRect);
  vec3 gray = vec3(.2126,.7152,.0722);
  float surfaceEdge = length(vec2(dot(left.rgb-right.rgb,gray),dot(top.rgb-bottom.rgb,gray)));
  float rim = length(vec2(left.a-right.a,top.a-bottom.a));
  // Each height appears later: crown -> visor -> chin, with a fading wake above.
  // A shallow curved leading edge preserves direction without a rigid straight cut.
  float edgeBend=.035*sin(q.x*5.4)+.014*sin(q.x*11.3);
  float age=mod(t,2.55)-.12-(clamp(q.y,0.,1.)+edgeBend)*1.18;
  float descend=smoothstep(0.,.16,age)*(1.-smoothstep(.54,.98,age));
  float surface=.84+.16*sin(q.x*4.8+q.y*2.1);
  float light=uGhostMotion*descend*surface;
  float ghostAlpha=uGhostReady*line*(.012+.078*light)+shellGray*(.004+.16*light);
  ghostAlpha+=(rim*.09+surfaceEdge*.03)*(.06+light);
  ghostAlpha *= 1. - uFull;
  vec4 ghost = vec4(vec3(.81,.84,.83) * ghostAlpha, ghostAlpha);

  // Restrained reflected light continues outside the helmet onto the black page.
  // Show a thin local wake, rather than lighting every expanding wave ring.
  float nearWake = smoothstep(.018, .10, dye);
  float crest = smoothstep(.012, .12, length(normal)) * .030 * nearWake;
  float wake = smoothstep(.06, .30, dye) * .018;
  float boundary = min(min(screen.x, uSize.x-screen.x), min(screen.y, uSize.y-screen.y));
  float sheen = (crest + wake + autoWake*.026) * (1. - photo.a*.91) * (1. - uFull) * smoothstep(0., 32., boundary);
  vec4 water = vec4(vec3(.74,.80,.79)*sheen, sheen);
  vec4 underlay = ghost + photo * (1. - ghost.a);
  underlay = underlay + water * (1. - underlay.a);
  vec4 helmet = shell * mask;
  gl_FragColor = helmet + underlay * (1. - helmet.a);
}`;

// A small float field avoids requiring floating-point render-target extensions.
// Only its normals/dye are uploaded; the full-size composite stays on the GPU.
function createWaterField(width, height) {
  const columns = Math.min(300, Math.max(64, Math.round(width/4)));
  const rows = Math.max(48, Math.round(columns*height/width));
  const length = columns*rows;
  let current = new Float32Array(length), previous = new Float32Array(length), next = new Float32Array(length);
  let dye = new Float32Array(length), nextDye = new Float32Array(length);
  const vx = new Float32Array(length), vy = new Float32Array(length), pixels = new Uint8Array(length*4);
  const rowCurl = new Float32Array(rows), columnDrift = new Float32Array(columns);
  const cellX = width/columns, cellY = height/rows;
  function clear() {
    [current,previous,next,dye,nextDye,vx,vy].forEach(field=>field.fill(0));
    for (let i=0;i<length;i++) pixels.set([128,128,0,128],i*4);
  }
  function stroke(from, to, radius, strength=1, elapsed=16.7) {
    const ax=from[0]/cellX, ay=from[1]/cellY, bx=to[0]/cellX, by=to[1]/cellY;
    const dx=bx-ax, dy=by-ay, distance=dx*dx+dy*dy;
    const r=radius/Math.sqrt(cellX*cellY);
    const left=Math.max(1,Math.floor(Math.min(ax,bx)-r*1.5)), right=Math.min(columns-2,Math.ceil(Math.max(ax,bx)+r*1.5));
    const top=Math.max(1,Math.floor(Math.min(ay,by)-r*1.5)), bottom=Math.min(rows-2,Math.ceil(Math.max(ay,by)+r*1.5));
    const travel=Math.sqrt(distance);
    const speed=Math.min(.8,travel/Math.max(1,elapsed)*2.5), heading=Math.atan2(dy,dx);
    // Dose by travelled length, so high-rate pointers do not keep adding energy.
    const waveDose=travel>0 ? Math.min(1,travel/r) : .18;
    for (let y=top;y<=bottom;y++) for (let x=left;x<=right;x++) {
      const t=distance ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/distance)) : 0;
      const q=Math.hypot(x-ax-dx*t,y-ay-dy*t)/r;
      if (q>1.5) continue;
      const influence=Math.exp(-q*q*2.8)*strength, i=y*columns+x;
      dye[i]=Math.max(dye[i],influence);
      current[i]=Math.max(-1,Math.min(1,current[i]+Math.exp(-q*q*6)*strength*waveDose*.055));
      vx[i]=Math.cos(heading)*speed*influence;
      vy[i]=Math.sin(heading)*speed*influence;
    }
  }
  function step(time) {
    for (let y=1;y<rows-1;y++) rowCurl[y]=Math.sin(y*.16+time*.0011)*.12;
    for (let x=1;x<columns-1;x++) columnDrift[x]=Math.cos(x*.13-time*.0008)*.10;
    for (let y=1;y<rows-1;y++) for (let x=1;x<columns-1;x++) {
      const i=y*columns+x;
      const laplacian=current[i-1]+current[i+1]+current[i-columns]+current[i+columns]-4*current[i];
      next[i]=Math.max(-1,Math.min(1,(current[i]+(current[i]-previous[i])*.92+laplacian*.12)*.997));
      const curl=rowCurl[y]*dye[i];
      const sx=Math.max(0,Math.min(columns-1.001,x-vx[i]-curl));
      const sy=Math.max(0,Math.min(rows-1.001,y-vy[i]-columnDrift[x]*dye[i]));
      const ix=Math.floor(sx), iy=Math.floor(sy), fx=sx-ix, fy=sy-iy, j=iy*columns+ix;
      nextDye[i]=Math.max(0,((dye[j]*(1-fx)+dye[j+1]*fx)*(1-fy)+(dye[j+columns]*(1-fx)+dye[j+columns+1]*fx)*fy)*.966-.0018);
      vx[i]*=.95; vy[i]*=.95;
    }
    const old=previous; previous=current; current=next; next=old;
    const oldDye=dye; dye=nextDye; nextDye=oldDye;
  }
  function pack() {
    const encode=value=>Math.round((Math.max(-1,Math.min(1,value))*.5+.5)*255);
    for (let y=1;y<rows-1;y++) for (let x=1;x<columns-1;x++) {
      const i=y*columns+x, at=i*4;
      pixels[at]=encode((current[i-1]-current[i+1])*2.4);
      pixels[at+1]=encode((current[i-columns]-current[i+columns])*2.4);
      pixels[at+2]=Math.round(Math.min(1,dye[i])*255);
      pixels[at+3]=encode(current[i]);
    }
    return pixels;
  }
  clear();
  return { columns,rows,stroke,step,pack,clear,pixels };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => reject(new Error('Asset load timed out')), 12000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Asset unavailable')); };
    image.src = url;
  });
}

export function createPortraitRenderer(canvas, { stage, photo, helmet, ghost, onStatus, onHelmet, onGhost, onDemo, onFull }) {
  let gl, program, buffer, water, curl, positionAttribute;
  const waterTextures=[];
  let flowSlot=0,flowClearPending=false,flowUploads=0;
  const shaders = [], textures = [], uniforms = {};
  let disposed=false, failed=false, ready=false, helmetReady=false, ghostReady=false;
  let enabled=true, reduced=false, visible=true, full=false;
  let width=1,height=1,photoImage,photoRect,helmetRect,ghostRect,visibleHelmet;
  let raf=0,previousFrame=0,frames=0,sequenceStart=null,sequenceKind=null,accumulator=0,lastInput=-Infinity;
  let autoTimer=0,autoCycle=0,autoStart=null,pointerInside=false,focused=false;
  let autoDuration=3800,autoProgress=0,autoStrength=0,curlFrames=0,autoBlend=1;
  let shift=[0,0],targetShift=[0,0],fullAmount=0,lastMark=null;
  let roll=0,targetRoll=0;
  let turn=[0,0],targetTurn=[0,0];
  let ghostMotion=0,ghostTime=0,ambientSuspended=false;
  let wet=false;
  let sampleCount=0,sampleDuration=0,slowFrames=0;
  const lifetime=2200;
  const stepDuration=1000/60;
  canvas.dataset.renderMode='max-fluid-reveal';
  function schedule() {
    if (ready&&!failed&&!disposed&&visible&&!document.hidden&&!raf) raf=requestAnimationFrame(frame);
  }
  function cancelAuto() { clearTimeout(autoTimer); autoTimer=0; canvas.dataset.autoPending='false'; }
  function stopAuto() { cancelAuto(); autoStart=null; autoProgress=0; autoStrength=0; autoBlend=1; curl?.clear(); }
  function stopSequence() {
    if (sequenceKind==='demo') onDemo(false);
    sequenceKind=null; sequenceStart=null; lastMark=null;
  }
  function canAuto() {
    return ready&&helmetReady&&enabled&&!reduced&&!full&&autoStart===null&&visible&&!document.hidden&&!failed&&!disposed&&width>1&&height>1;
  }
  function armAuto(delay=1100+220*(1+Math.sin(autoCycle*2.4))) {
    cancelAuto();
    if (!canAuto()) return;
    canvas.dataset.autoPending='true';
    autoTimer=setTimeout(()=>{
      autoTimer=0; canvas.dataset.autoPending='false';
      if (!canAuto()) return;
      autoStart=performance.now(); autoCycle++; ambientSuspended=false;
      autoDuration=3800+240*Math.sin(autoCycle*1.9); curl.clear();
      canvas.dataset.autoCycle=String(autoCycle); schedule();
    },delay);
  }
  function clearWater() { water?.clear(); wet=false; lastInput=-Infinity; accumulator=0; lastMark=null; flowClearPending=true; }
  function updateFlowTexture(slot,pixels) {
    gl.activeTexture(gl.TEXTURE3+slot); gl.bindTexture(gl.TEXTURE_2D,waterTextures[slot]);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,water.columns,water.rows,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    flowUploads++;
  }
  function reset(restartAuto=true) {
    stopAuto(); stopSequence(); full=false; fullAmount=0; onFull(false); clearWater(); shift=[0,0]; targetShift=[0,0]; roll=0; targetRoll=0; turn=[0,0]; targetTurn=[0,0]; ghostMotion=0; ambientSuspended=true;
    schedule(); if (restartAuto) armAuto(9000);
  }
  function mark(x,y,now,pulse=false) {
    const point=[x*width,y*height];
    const fresh=lastMark&&now-lastMark.time<100;
    const from=fresh ? lastMark.point : point;
    const distance=Math.hypot(point[0]-from[0],point[1]-from[1]);
    const elapsed=fresh ? Math.max(1,now-lastMark.time) : 16.7;
    const radius=Math.min(34,Math.max(18,visibleHelmet[2]*.085));
    if (pulse) {
      water.stroke([point[0]-radius*1.25,point[1]+radius*.30],[point[0]+radius*1.25,point[1]-radius*.30],radius*.90,1.15);
    } else if (!fresh||distance>.35) water.stroke(from,point,radius,1.05,elapsed);
    else return;
    if (!wet) { sampleCount=0; sampleDuration=0; slowFrames=0; }
    lastMark={point,time:now}; lastInput=now; wet=true;
  }
  function aim(x,y) {
    if (!ready||!helmetReady||!enabled||reduced||full) return;
    if (sequenceKind) stopSequence();
    x=Math.max(0,Math.min(1,x)); y=Math.max(0,Math.min(1,y));
    const clamp=value=>Math.max(-1,Math.min(1,value));
    const dx=clamp((x*width-visibleHelmet[0]-visibleHelmet[2]*.5)/(visibleHelmet[2]*.75));
    const dy=clamp((y*height-visibleHelmet[1]-visibleHelmet[3]*.48)/(visibleHelmet[3]*.7));
    targetShift=[dx*.9,dy*.55]; targetRoll=dx*.001;
    targetTurn=[dx*.05,-dy*.022];
    mark(x,y,performance.now()); schedule();
  }
  function pulse(x,y) {
    if (!ready||!helmetReady||!enabled||full) return;
    if (reduced) { full=true; onFull(true); schedule(); return; }
    stopSequence(); mark(x,y,performance.now(),true); schedule();
  }
  function leave() { if (sequenceKind!==null) return; targetShift=[0,0]; targetRoll=0; targetTurn=[0,0]; lastMark=null; schedule(); }
  function frame(now) {
    raf=0;
    if (!ready||failed||disposed||!visible||document.hidden) return;
    if ((wet||autoStart!==null)&&previousFrame) {
      const gap=now-previousFrame;
      sampleCount++; sampleDuration+=gap; if (gap>34) slowFrames++;
    }
    const delta=previousFrame ? Math.min(50,now-previousFrame) : 16.7; previousFrame=now;
    const ease=reduced ? 1 : 1-Math.exp(-delta/115);
    const poseEase=reduced ? 1 : 1-Math.exp(-delta/220);
    if (autoStart!==null) {
      const progress=(now-autoStart)/autoDuration;
      if (progress>=1) {
        autoStart=null; autoProgress=0; autoStrength=0; curl.clear(); armAuto();
        if (!pointerInside&&!focused&&!sequenceKind) { targetShift=[0,0]; targetRoll=0; }
      } else {
        autoProgress=progress;
        autoStrength=1;
        if (!pointerInside&&!focused&&!sequenceKind) {
          targetShift=[Math.sin(progress*Math.PI*2)*1.4,Math.sin(progress*Math.PI)*.65];
          targetRoll=Math.sin(progress*Math.PI*2)*.0016;
        }
      }
    }
    if (sequenceStart!==null) {
      const progress=(now-sequenceStart)/3400;
      if (progress>=1) { stopSequence(); targetShift=[0,0]; targetRoll=0; }
      else {
        const t=progress*Math.PI*2;
        const x=(visibleHelmet[0]+visibleHelmet[2]*(.5+Math.sin(t)*.72))/width;
        const y=(visibleHelmet[1]+visibleHelmet[3]*(.50-Math.cos(t)*.29+Math.sin(t*2)*.09))/height;
        mark(x,y,now); targetShift=[Math.sin(t)*2.6,Math.cos(t)*1.5]; targetRoll=Math.sin(t)*.003;
      }
    }
    shift=shift.map((value,i)=>value+(targetShift[i]-value)*poseEase);
    roll+=(targetRoll-roll)*poseEase;
    turn=turn.map((value,i)=>value+(targetTurn[i]-value)*poseEase);
    const ambientMotion=helmetReady&&enabled&&!reduced&&!full&&!ambientSuspended;
    if(ambientMotion) ghostTime+=delta/1000;
    const ghostTarget=ambientMotion?1:0;
    ghostMotion+=(ghostTarget-ghostMotion)*(reduced?1:1-Math.exp(-delta/180));
    fullAmount+=((full?1:0)-fullAmount)*ease;
    const unsettled=Math.abs(shift[0]-targetShift[0])+Math.abs(shift[1]-targetShift[1])+Math.abs(roll-targetRoll)*500+turn.reduce((sum,value,i)=>sum+Math.abs(value-targetTurn[i])*500,0)+Math.abs(ghostMotion-ghostTarget)+Math.abs(fullAmount-(full?1:0))>.001;
    if (!unsettled) { shift=[...targetShift]; roll=targetRoll; turn=[...targetTurn]; ghostMotion=ghostTarget; fullAmount=full?1:0; }
    if (wet&&now-lastInput>=lifetime) clearWater();
    // Publish a cleared field once, never upload it repeatedly during auto-only frames.
    if (flowClearPending) {
      updateFlowTexture(0,water.pixels); updateFlowTexture(1,water.pixels);
      flowClearPending=false;
    }
    if (wet) {
      accumulator+=delta;
      const steps=Math.min(3,Math.floor(accumulator/stepDuration));
      for (let step=0;step<steps;step++) {
        water.step(now-accumulator+stepDuration); accumulator-=stepDuration;
        // Keep the last two physical states even after a delayed frame catches up.
        // Ordinary 90/120 Hz RAFs only update the blend; a new step uploads once.
        if (step>=steps-2) { flowSlot=1-flowSlot; updateFlowTexture(flowSlot,water.pack()); }
      }
    }
    if(autoStart!==null) {
      const transport=curl.advance(delta,autoProgress,autoCycle,autoDuration);
      autoBlend=transport.blend; curlFrames=transport.updates;
    }
    gl.useProgram(program); gl.viewport(0,0,canvas.width,canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute,2,gl.FLOAT,false,0,0);
    gl.uniform1i(uniforms.uFlow,3+flowSlot); gl.uniform1i(uniforms.uPreviousFlow,4-flowSlot);
    gl.uniform1f(uniforms.uFlowBlend,wet?Math.max(0,Math.min(1,accumulator/stepDuration)):1);
    const activity=wet ? Math.min(1,Math.max(0,(lifetime-(now-lastInput))/450)) : 0;
    gl.uniform2f(uniforms.uShift,...shift);
    gl.uniform1f(uniforms.uRoll,roll);
    gl.uniform2f(uniforms.uTurn,...turn);
    gl.uniform1f(uniforms.uFull,helmetReady?fullAmount:0);
    gl.uniform1f(uniforms.uGhostReady,ghostReady?1:0);
    gl.uniform1f(uniforms.uTime,now/1000);
    gl.uniform1f(uniforms.uActivity,activity);
    gl.uniform1f(uniforms.uGhostMotion,ghostMotion);
    gl.uniform1f(uniforms.uGhostTime,ghostTime);
    gl.uniform1f(uniforms.uAutoStrength,autoStrength);
    gl.uniform1f(uniforms.uAutoBlend,autoBlend);
    gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    canvas.dataset.frames=String(++frames);
    canvas.dataset.shift=shift.map(value=>value.toFixed(2)).join(',');
    canvas.dataset.rollDegrees=(roll*180/Math.PI).toFixed(3);
    canvas.dataset.turnDegrees=turn.map(value=>(value*180/Math.PI).toFixed(3)).join(',');
    canvas.dataset.sequence=sequenceKind|| (full?'full':autoStart!==null?(wet?'auto+flow':'auto'):wet?'flow':unsettled?'settling':ambientMotion?'ghost':'idle');
    canvas.dataset.autoState=autoStart!==null?'sweeping':autoTimer?'waiting':'off';
    canvas.dataset.manualState=sequenceKind|| (wet?'flow':'idle');
    canvas.dataset.ghostMotion=ghostMotion.toFixed(3);
    canvas.dataset.ghostTime=ghostTime.toFixed(3);
    canvas.dataset.autoProgress=autoProgress.toFixed(3);
    canvas.dataset.curlFrames=String(curlFrames);
    canvas.dataset.autoPhase=autoStart===null?'off':autoProgress<.58?'injecting':'dissipating';
    canvas.dataset.reveal=activity.toFixed(3);
    canvas.dataset.frameSample=String(sampleCount);
    canvas.dataset.meanFrameMs=sampleCount?(sampleDuration/sampleCount).toFixed(2):'0';
    canvas.dataset.slowFrames=String(slowFrames);
    canvas.dataset.flowUploads=String(flowUploads);
    if (unsettled||wet||sequenceStart!==null||autoStart!==null||ambientMotion) schedule(); else previousFrame=0;
  }
  function resize() {
    if (!ready||disposed) return;
    const rect=canvas.getBoundingClientRect(), target=stage.getBoundingClientRect();
    if (!rect.width||!rect.height||!target.width||!target.height) return;
    width=rect.width; height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,1.5,1600/width,1400/height);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    const scale=Math.min(target.width/photoImage.width,target.height/photoImage.height)*1.08;
    const imageWidth=photoImage.width*scale,imageHeight=photoImage.height*scale;
    photoRect=[target.left-rect.left+(target.width-imageWidth)/2,target.top-rect.top+(target.height-imageHeight)/2-imageHeight*.1,imageWidth,imageHeight];
    const helmetHeight=imageHeight*.64,helmetWidth=helmetHeight*309/353;
    visibleHelmet=[photoRect[0]+imageWidth*.477-helmetWidth/2,photoRect[1]+imageHeight*.17,helmetWidth,helmetHeight];
    const helmetScale=helmetHeight/353;
    helmetRect=[visibleHelmet[0]-167*helmetScale,visibleHelmet[1]-40*helmetScale,640*helmetScale,425*helmetScale];
    const ghostScale=helmetHeight/875;
    ghostRect=[visibleHelmet[0]-384*ghostScale,visibleHelmet[1]-55*ghostScale,1536*ghostScale,1024*ghostScale];
    water=createWaterField(width,height); clearWater();
    waterTextures.forEach((texture,slot)=>{
      gl.activeTexture(gl.TEXTURE3+slot); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,water.columns,water.rows,0,gl.RGBA,gl.UNSIGNED_BYTE,water.pixels);
    });
    flowSlot=0; flowClearPending=false;
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(uniforms.uSize,width,height);
    gl.uniform4fv(uniforms.uPhotoRect,photoRect); gl.uniform4fv(uniforms.uHelmetRect,helmetRect); gl.uniform4fv(uniforms.uGhostRect,ghostRect);
    gl.uniform4fv(uniforms.uCurlRect,[visibleHelmet[0]-visibleHelmet[2]*.6,visibleHelmet[1]-visibleHelmet[3]*.42,visibleHelmet[2]*2.2,visibleHelmet[3]*1.84]);
    schedule();
  }
  function compile(type,source) {
    const shader=gl.createShader(type); shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
    return shader;
  }
  function upload(image,unit) {
    const texture=gl.createTexture(); textures.push(texture);
    gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    if (image) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
    return texture;
  }
  function fallback() {
    if (disposed) return;
    failed=true; ready=false; cancelAnimationFrame(raf); raf=0; stopAuto(); stopSequence(); onStatus('fallback');
  }
  function releaseGL() {
    if (!gl) return;
    curl?.destroy();
    textures.forEach(texture=>gl.deleteTexture(texture)); shaders.forEach(shader=>gl.deleteShader(shader));
    if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program);
  }
  const onVisibility=()=>{ cancelAnimationFrame(raf); raf=0; previousFrame=0; reset(false); if (!document.hidden) armAuto(900); };
  const onLost=event=>{ event.preventDefault(); fallback(); };
  const observer=new ResizeObserver(resize);
  const intersection=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if (!visible) { cancelAnimationFrame(raf); raf=0; previousFrame=0; reset(false); }
    else { resize(); schedule(); armAuto(900); }
  });
  observer.observe(canvas); observer.observe(stage); intersection.observe(stage);
  document.addEventListener('visibilitychange',onVisibility); canvas.addEventListener('webglcontextlost',onLost);
  (async()=>{
    try {
      gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
      if (!gl) throw new Error('WebGL unavailable');
      photoImage=await loadImage(photo); if (disposed||failed) return;
      program=gl.createProgram(); gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource)); gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));
      gl.linkProgram(program); if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Program unavailable'); gl.useProgram(program);
      buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      positionAttribute=gl.getAttribLocation(program,'aPosition'); gl.enableVertexAttribArray(positionAttribute); gl.vertexAttribPointer(positionAttribute,2,gl.FLOAT,false,0,0);
      for (const name of ['uPhoto','uHelmet','uGhost','uFlow','uPreviousFlow','uFlowBlend','uSize','uShift','uRoll','uTurn','uPhotoRect','uHelmetRect','uGhostRect','uCurl','uPreviousCurl','uAutoBlend','uCurlRect','uAutoStrength','uFull','uGhostReady','uTime','uActivity','uGhostMotion','uGhostTime']) uniforms[name]=gl.getUniformLocation(program,name);
      upload(photoImage,0); upload(null,1); upload(null,2); waterTextures.push(upload(null,3),upload(null,4));
      gl.uniform1i(uniforms.uPhoto,0); gl.uniform1i(uniforms.uHelmet,1); gl.uniform1i(uniforms.uGhost,2); gl.uniform1i(uniforms.uFlow,3); gl.clearColor(0,0,0,0);
      curl=createAutoRevealField(gl,compile,vertexSource); gl.uniform1i(uniforms.uCurl,5); gl.uniform1i(uniforms.uPreviousCurl,6);
      ready=true; resize(); onStatus('ready');
      try {
        const helmetImage=await loadImage(helmet); if (disposed||failed) return;
        upload(helmetImage,1); helmetReady=true; onHelmet('ready'); schedule(); armAuto(900);
        try {
          const ghostImage=await loadImage(ghost); if (disposed||failed) return;
          upload(ghostImage,2); ghostReady=true; canvas.dataset.ghost='ready'; onGhost('ready'); schedule();
        } catch { if (!disposed&&!failed) { canvas.dataset.ghost='fallback'; onGhost('fallback'); } }
      } catch { if (!disposed&&!failed) onHelmet('fallback'); }
    } catch { if (!disposed) { releaseGL(); fallback(); } }
  })();
  return {
    aim,pulse,leave,reset,
    setPointerInside(value) {
      if (pointerInside===value) return;
      pointerInside=value;
      if (value&&sequenceKind) stopSequence();
      if (!value) leave();
    },
    setFocused(value) {
      focused=value;
      if (value&&sequenceKind) stopSequence();
      if (!value) leave();
    },
    setEnabled(value) { enabled=value; if (!value) reset(false); else { ambientSuspended=false; armAuto(900); } schedule(); },
    setReduced(value) { reduced=value; if (value) reset(false); else { ambientSuspended=false; armAuto(900); } schedule(); },
    setFull(value) { if (full===value) return; stopAuto(); stopSequence(); full=value; clearWater(); targetShift=[0,0]; targetRoll=0; targetTurn=[0,0]; ghostMotion=0; schedule(); if (!value) { ambientSuspended=false; armAuto(); } },
    playDemo() {
      if (!ready||!helmetReady||!enabled||failed) return;
      stopSequence(); clearWater(); targetTurn=[0,0];
      if (reduced) { stopAuto(); full=true; onFull(true); }
      else { if (full) { full=false; onFull(false); armAuto(); } sequenceKind='demo'; sequenceStart=performance.now(); onDemo(true); }
      schedule();
    },
    destroy() { disposed=true; cancelAnimationFrame(raf); stopAuto(); observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange',onVisibility); canvas.removeEventListener('webglcontextlost',onLost); releaseGL(); }
  };
}
