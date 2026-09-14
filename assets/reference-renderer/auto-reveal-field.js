// A persistent, bounded transport field. New input is local; older dye keeps
// moving through counter-rotating eddies after the source has passed.
// This is a visual approximation, not the reference site's fluid solver.
const updateSource=`
precision highp float;
uniform sampler2D uState;
uniform float uDelta;
uniform float uTime;
uniform float uSeed;
uniform vec4 uStroke;
uniform vec4 uInput;
varying vec2 vUV;
const float neutral=128./255.;
vec4 stateAt(vec2 p){
  vec2 uv=vec2((p.x+.6)/2.2,1.-(p.y+.42)/1.84);
  if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.)))) return vec4(neutral,neutral,0.,0.);
  return texture2D(uState,uv);
}
vec2 eddy(vec2 p,vec2 center,float radius,float spin){
  vec2 d=p-center;
  return vec2(-d.y,d.x)*spin*exp(-dot(d,d)/(radius*radius));
}
void main(){
  vec2 p=vec2(vUV.x*2.2-.6,(1.-vUV.y)*1.84-.42);
  vec2 velocity=(texture2D(uState,vUV).rg-neutral)*4.;
  vec4 old=stateAt(p-velocity*uDelta);
  vec2 drift=vec2(.06*sin(p.y*5.+uSeed),-.16);
  drift+=eddy(p,vec2(.27+.10*sin(uTime*1.1+uSeed),.70-uTime*.10),.42,3.7);
  drift+=eddy(p,vec2(.81+.08*cos(uTime*.8+uSeed),.32-uTime*.035),.34,-4.2);
  velocity=mix((old.rg-neutral)*4.,drift,1.-exp(-uDelta*2.3));
  // At 60 Hz the linear loss exceeds one RGBA8 storage level. Tiny tails must
  // reach zero instead of rounding back to the same value until the hard reset.
  float density=max(0.,old.b*exp(-uDelta*1.35)-uDelta*.24);
  vec2 segment=uStroke.zw-uStroke.xy;
  float along=clamp(dot(p-uStroke.xy,segment)/max(dot(segment,segment),.000001),0.,1.);
  vec2 distance=p-uStroke.xy-segment*along;
  float source=exp(-dot(distance,distance)/(uInput.x*uInput.x)*2.8)*uInput.y;
  density=max(density,source);
  velocity=mix(velocity,uInput.zw,source*(1.-exp(-uDelta*22.)));
  gl_FragColor=vec4(clamp(velocity/4.+neutral,0.,1.),density,0.);
}`;

export function createAutoRevealField(gl,compile,vertexSource){
  const size=384, step=1/60;
  const program=gl.createProgram(), buffer=gl.createBuffer();
  const textures=[], targets=[], uniforms={};
  let current=0,accumulator=0,updates=0;
  function destroy(){
    textures.forEach(texture=>gl.deleteTexture(texture));
    targets.forEach(target=>gl.deleteFramebuffer(target));
    gl.deleteProgram(program); gl.deleteBuffer(buffer);
  }
  function bind(){
    gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,textures[current]);
    gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,textures[1-current]);
  }
  function clear(){
    gl.clearColor(128/255,128/255,0,0);
    targets.forEach(target=>{gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.clear(gl.COLOR_BUFFER_BIT);});
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);
    current=0;accumulator=0;bind();
  }
  try{
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,updateSource));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Transport program unavailable');
    for(const name of ['uState','uDelta','uTime','uSeed','uStroke','uInput']) uniforms[name]=gl.getUniformLocation(program,name);
    for(let i=0;i<2;i++){
      const texture=gl.createTexture(),target=gl.createFramebuffer();textures.push(texture);targets.push(target);
      gl.activeTexture(gl.TEXTURE5+i);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.bindFramebuffer(gl.FRAMEBUFFER,target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Transport target unavailable');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    clear();
  }catch(error){destroy();throw error;}
  finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);}
  const attribute=gl.getAttribLocation(program,'aPosition');
  const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
  function sourceAt(t,seed){
    const angle=-1.3+t*6.7+Math.sin(seed)*.45;
    return [
      .5+Math.cos(angle)*(.47+.06*Math.sin(seed+t*4))+.045*Math.sin(t*9+seed),
      1.03-1.22*t+Math.sin(angle)*.20+.045*Math.sin(t*8-seed),
    ];
  }
  function advance(delta,progress,cycle,duration){
    accumulator+=Math.min(.05,delta/1000);
    const elapsed=progress*duration/1000,seed=cycle*2.399;
    const steps=Math.min(3,Math.floor(accumulator/step));
    if(steps){
      gl.useProgram(program);gl.viewport(0,0,size,size);gl.disable(gl.BLEND);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
      gl.uniform1i(uniforms.uState,5);gl.uniform1f(uniforms.uDelta,step);gl.uniform1f(uniforms.uSeed,seed);
      for(let i=0;i<steps;i++){
        const time=Math.max(0,elapsed-accumulator+step),injectionTime=duration/1000*.58;
        const t=Math.min(1,time/injectionTime),from=sourceAt(Math.max(0,t-step/injectionTime),seed),to=sourceAt(t,seed);
        const dx=to[0]-from[0],dy=to[1]-from[1],length=Math.max(.00001,Math.hypot(dx,dy));
        const strength=time<injectionTime?smooth(t/.045)*smooth((1-t)/.12):0;
        const radius=.13+.028*Math.sin(t*11+seed);
        gl.uniform1f(uniforms.uTime,time);gl.uniform4f(uniforms.uStroke,...from,...to);
        gl.uniform4f(uniforms.uInput,radius,strength,dx/length*.60,dy/length*.60-.10);
        gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,textures[current]);
        gl.bindFramebuffer(gl.FRAMEBUFFER,targets[1-current]);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        current=1-current;accumulator-=step;updates++;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    bind();
    return {blend:Math.max(0,Math.min(1,accumulator/step)),updates};
  }
  return {advance,clear,destroy};
}
