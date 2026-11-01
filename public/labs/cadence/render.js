/* Original WebGL2 renderer and explicit CPU inspection fallback. No external requests. */
(function(scope){'use strict';
const C={floor:[.30,.055,.13],wall:[.47,.09,.21],rim:[.70,.19,.32],white:[.83,.98,1],blue:[.04,.60,.96],red:[.95,.13,.30],gold:[1,.69,.20],purple:[.45,.16,.67]};
const vs=`#version 300 es
precision highp float;layout(location=0) in vec3 p;layout(location=1) in vec3 norm;layout(location=2) in vec3 ip;layout(location=3) in vec3 scale;layout(location=4) in vec3 col;uniform mat4 vp;out vec3 n;out vec3 c;out vec3 world;void main(){world=p*scale+ip;n=normalize(norm/max(scale,vec3(.01)));c=col;gl_Position=vp*vec4(world,1.);}`;
const fs=`#version 300 es
precision highp float;in vec3 n;in vec3 c;in vec3 world;out vec4 outColor;void main(){vec3 normal=normalize(n);float d=max(dot(normal,normalize(vec3(-.4,1.,.8))),0.);float back=max(dot(normal,normalize(vec3(.6,.4,-1.))),0.);vec3 v=normalize(vec3(0.,9.,14.)-world);vec3 h=normalize(v+normalize(vec3(-.4,1.,.8)));float spec=pow(max(dot(normal,h),0.),35.)*.35;vec3 lit=c*(.38+d*.65+back*.20)+vec3(spec);float fog=smoothstep(18.,83.,-world.z);lit=mix(lit,vec3(.13,.018,.074),fog*.92);outColor=vec4(pow(lit,vec3(.88)),1.);}`;
function perspective(fovy,aspect,near,far){let f=1/Math.tan(fovy/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
function normalize(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l);}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function lookAt(eye,target){const z=normalize(eye.map((v,i)=>v-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]);}
function multiply(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
function sphere(){const verts=[],point=(i,j)=>{let a=i/8*Math.PI,b=j/12*Math.PI*2;return[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];};for(let i=0;i<8;i++)for(let j=0;j<12;j++){const a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);for(const p of[a,b,c,a,c,d])verts.push(...p,...p);}return new Float32Array(verts);}
function cube(){const v=[];for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){const n=[0,0,0];n[axis]=sign;const pts=[];for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]]){let p=[0,0,0];p[axis]=sign;p[(axis+1)%3]=a;p[(axis+2)%3]=b;pts.push(p);}for(const i of[0,1,2,0,2,3])v.push(...pts[i],...n);}return new Float32Array(v);}
function Renderer(canvas,labelCanvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'default'}),software=gl?null:canvas.getContext('2d');if(!gl&&!software)throw Error('描画を初期化できません。');
 let program=null,vpLocation=null,ball=null,box=null;const ballData=sphere(),boxData=cube();
 if(gl){const compile=(type,text)=>{const sh=gl.createShader(type);gl.shaderSource(sh,text);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));vpLocation=gl.getUniformLocation(program,'vp');}
 function mesh(data){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);for(let i=0;i<2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12);}const inst=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,inst);for(let i=2;i<5;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,36,(i-2)*12);gl.vertexAttribDivisor(i,1);}return{vao,inst,size:data.length/6};}
 if(gl){ball=mesh(ballData);box=mesh(boxData);gl.enable(gl.DEPTH_TEST);}
 let vp,width=390,height=694;const ctx=labelCanvas.getContext('2d');
 function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);labelCanvas.width=canvas.width;labelCanvas.height=canvas.height;ctx.setTransform(d,0,0,d,0,0);vp=multiply(perspective(Math.PI/3,width/height,.1,140),lookAt([0,9,14],[0,0,-17]));}
 function project(x,y,z){const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];if(w<=0)return null;return{x:((vp[0]*x+vp[4]*y+vp[8]*z+vp[12])/w*.5+.5)*width,y:(.5-(vp[1]*x+vp[5]*y+vp[9]*z+vp[13])/w*.5)*height,w};}
 let lastCount=0;
 function draw(model){const b=[],q=[],add=(arr,x,y,z,sx,sy,sz,c)=>arr.push(x,y,z,sx,sy,sz,...c);const t=model.t,travel=t*8,phase=model.result||'',endTime=model.endAge||0;
  add(q,0,-.38,-35,3.8,.35,45,C.floor);for(const x of[-1.2,1.2])add(q,x,-.005,-35,.025,.012,45,[.89,.43,.48]);
  for(let j=0;j<(gl?38:19);j++){const spacing=gl?3:6,z=10-j*spacing+(travel%spacing);for(const x of[-4,4]){add(b,x,.65,z,.72,1.2,1.65,C.wall);add(b,x*.97,1.3,z-.5,.50,.40,.9,C.rim);}}
  for(let i=0;i<16;i++){const z=8-i*6+(travel%6);for(let j=0;j<4;j++)add(b,(j%2?1:-1)*(4.25+j*.1),2.2+(j>>1)*1.2,z,.38,.65,1.2,[.40,.065,.19]);}
  ctx.clearRect(0,0,width,height);
  for(const event of model.plan.events.filter(e=>e.at>=t&&e.at<=t+10)){const z=-(event.at-t)*8;
   for(let lane=0;lane<3;lane++){const o=event.options[lane],x=(lane-1)*2.4,negative=['subtract','divide'].includes(o.op),color=negative?C.red:o.power?C.gold:C.blue;
    if(o.op!=='none'||o.power){for(const dx of[-.96,.96])add(q,x+dx,1.15,z,.065,1.15,.10,color);add(q,x,2.25,z,.98,.10,.11,color);}
    const num=(o.loss||o.riskBps)?(event.kind==='boss'?1:5+lane*2):0;
    for(let j=0;j<num;j++){const ex=x+(j%3-1)*.40,ez=z-1.1-Math.floor(j/3)*.6,sy=event.kind==='boss'?.95:.28;add(b,ex,.40,ez,event.kind==='boss'?.65:.25,sy,event.kind==='boss'?.6:.28,[.31,.24,.36]);add(b,ex-.09,.51,ez+.2,.04,.05,.04,C.red);add(b,ex+.09,.51,ez+.2,.04,.05,.04,C.red);}
    if(event.kind==='wall'&&lane===2)add(q,x+.85,.58,z-.4,.28,.6,.4,C.rim);
    for(let j=0;j<Math.min(4,Math.ceil(o.coins/10));j++)add(b,x+(j-1.5)*.24,.28,z+1,.12,.12,.04,C.gold);
    const p=project(x,2.6,z);if(p&&p.y>72&&p.y<height-110){const font=Math.max(10,Math.min(29,240/p.w));ctx.font=`800 ${font}px system-ui`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(10,6,20,.9)';ctx.strokeText(o.label,p.x,p.y);ctx.fillStyle=negative?'#ffb5c7':o.power?'#ffe1a4':'#c9f8ff';ctx.fillText(o.label,p.x,p.y);if(o.loss||o.riskBps){ctx.font=`600 ${Math.max(9,font*.45)}px system-ui`;const risk=`危険 ${o.riskBps?o.riskBps/100+'% + ':''}${o.loss}`;ctx.strokeText(risk,p.x,p.y+font*.72);ctx.fillStyle='#ffb5c7';ctx.fillText(risk,p.x,p.y+font*.72);}}
   }
  }
  if(model.plan.duration-t<11||phase){const z=phase?-8:-(model.plan.duration-t)*8,clear=phase==='clear',fail=phase==='absorbed',color=fail?C.purple:clear?[1,.86,.51]:[.98,.72,.48];for(let i=0;i<44;i++){const a=i/44*Math.PI*2;add(b,Math.cos(a)*2.6,2.4+Math.sin(a)*2.5,z,.24,.30,.35,color);}add(b,0,2.4,z-.3,2.25,2.2,.18,fail?[.07,.015,.13]:[.95,.78,.51]);if(phase)for(let j=0;j<70;j++){const a=j*2.399+endTime*(fail?-2:1),r=clear?(endTime*1.3+j%4*.4):Math.max(.1,3-(endTime+j*.03)%3);add(b,Math.cos(a)*r,2+Math.sin(a)*r,-7-j%5,.03,.05,.05,clear?[1,.97,.8]:[.7,.29,.95]);}}
  const n=model.state.units,drawCount=n===0n?0:Math.min(gl?150:30,Number(n>150n?150n:n));lastCount=drawCount;const skin=[C.white,[.91,.67,.25],[.52,.27,.83],[.21,.85,.76]][model.skin||0];
  for(let i=0;i<drawCount;i++){const row=Math.floor(i/10),col=i%10,dense=Math.min(1,drawCount/15);let x=model.x+(col-4.5)*.13*dense,z=-row*.20+(i%2)*.05,y=.26+Math.sin(t*4+i)*.025;if(drawCount===1)x=model.x;if(phase){const f=Math.min(1,endTime/2);x*=1-f;z+=(phase==='absorbed'?-9:-6)*f;y+=f*1.5;}add(b,x,y,z,.15,.17,.23,skin);for(let j=1;j<=3;j++)add(b,x+Math.sin(t*10+i+j)*.035*j,y-.015,z+j*.13,.034*(1-j*.17),.032,j===1?.13:.09,skin);}
  if(model.running&&!model.state.finished&&t>2)for(let i=0;i<12;i++)add(b,model.x+Math.sin(i*3)*.22,.42,-((t*18+i*2)%22),.025,.025,.26,C.blue);
  if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.13,.018,.074,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(vpLocation,false,vp);for(const[m,data]of[[box,q],[ball,b]]){gl.bindVertexArray(m.vao);gl.bindBuffer(gl.ARRAY_BUFFER,m.inst);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArraysInstanced(gl.TRIANGLES,0,m.size,data.length/9);}}
  else{const tris=[];
   for(const[geometry,instances]of[[boxData,q],[ballData,b]])for(let o=0;o<instances.length;o+=9){const xyz=instances.slice(o,o+3),sc=instances.slice(o+3,o+6),color=instances.slice(o+6,o+9);
    if(geometry===ballData){const p=project(...xyz),px=project(xyz[0]+sc[0],xyz[1],xyz[2]),py=project(xyz[0],xyz[1]+sc[1],xyz[2]),pz=project(xyz[0],xyz[1],xyz[2]+sc[2]);if(p&&px&&py&&pz){const rx=Math.max(.6,Math.abs(px.x-p.x)),ry=Math.max(.6,Math.abs(py.y-p.y),Math.abs(pz.y-p.y));tris.push({sphere:true,p,rx,ry,z:xyz[2],color});}continue;}
    for(let v=0;v<geometry.length;v+=18){const pts=[],n=[0,0,0];let z=0;for(let k=0;k<3;k++){const pos=[0,1,2].map(a=>geometry[v+k*6+a]*sc[a]+xyz[a]),pp=project(...pos);if(!pp)break;pts.push(pp);z+=pos[2]/3;for(let a=0;a<3;a++)n[a]+=geometry[v+k*6+3+a]/Math.max(.01,sc[a]);}if(pts.length<3||pts.every(p=>p.y<0)||pts.every(p=>p.y>height)||pts.every(p=>p.x<0)||pts.every(p=>p.x>width))continue;const nn=normalize(n),light=.4+Math.max(0,nn[0]*-.3+nn[1]*.8+nn[2]*.4)*.68,fog=Math.max(0,Math.min(.9,(-z-18)/65)),dark=[.13,.018,.074],rgb=color.map((c,a)=>Math.round(Math.pow(c*light*(1-fog)+dark[a]*fog,.88)*255));tris.push({pts,z,fill:`rgb(${rgb.join(',')})`});}
   }
   software.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);software.fillStyle='#210513';software.fillRect(0,0,width,height);tris.sort((a,b)=>a.z-b.z);
   for(const tr of tris){if(tr.sphere){const rgb=tr.color.map(c=>Math.round(c*255)),g=software.createRadialGradient(tr.p.x-tr.rx*.25,tr.p.y-tr.ry*.3,0,tr.p.x,tr.p.y,Math.max(tr.rx,tr.ry));g.addColorStop(0,`rgb(${rgb.map(c=>Math.min(255,c*1.15)).join(',')})`);g.addColorStop(.7,`rgb(${rgb.join(',')})`);g.addColorStop(1,`rgb(${rgb.map(c=>c*.45).join(',')})`);software.beginPath();software.ellipse(tr.p.x,tr.p.y,tr.rx,tr.ry,0,0,Math.PI*2);software.fillStyle=g;software.fill();continue;}software.beginPath();software.moveTo(tr.pts[0].x,tr.pts[0].y);software.lineTo(tr.pts[1].x,tr.pts[1].y);software.lineTo(tr.pts[2].x,tr.pts[2].y);software.closePath();software.fillStyle=tr.fill;software.fill();}
  }
  return {renderedUnits:drawCount,instances:(b.length+q.length)/9,renderer:gl?'WebGL2':'CPU検証表示（GPU未検証）'};
 }
 resize();return{draw,resize,project,get count(){return lastCount;}};
}
scope.KRRenderer=Renderer;
})(window);
