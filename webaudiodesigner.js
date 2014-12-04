var audioctx;
var graph;
var dragging=null;
var draggingoffset={"x":0,"y":0};

var defaultpatch=[{"type":"destination","name":"destination","x":568,"y":86,"params":[],"connect":[]},{"type":"osc","name":"osc2","x":384,"y":164,"params":[{"name":"type","type":"s","value":"sine"},{"name":"frequency","type":"a","value":"440"},{"name":"detune","type":"a","value":"0"}],"connect":[{"t":"destination","o":0,"i":0}]},{"type":"gain","name":"gain1","x":200,"y":300,"params":[{"name":"gain","type":"a","value":"1000"}],"connect":[{"t":"osc2.detune","o":0}]},{"type":"osc","name":"osc1","x":49,"y":150,"params":[{"name":"type","type":"s","value":"sine"},{"name":"frequency","type":"a","value":"2"},{"name":"detune","type":"a","value":"0"}],"connect":[{"t":"gain1","o":0,"i":0}]}];

function LoadBuffers(actx,list){
  buf={"_count":Object.keys(list).length,"_ready":false};
  for(name in list){
    var o=buf[name]={};
    o.req=new XMLHttpRequest();
    o.req.open("GET",list[name],true);
    o.req.responseType="arraybuffer";
    o.req.buf=buf;
    o.req.nam=name;
    o.req.onload=function(){
      if(this.response){
        actx.decodeAudioData(this.response,
          function(b){
            this.buf[this.nam].data=b;
            if(--this.buf._count==0)
              this.buf._ready=true;
          }.bind(this),
          function(){}
        );
      }
    };
    o.req.onerror=function(){};
    try{o.req.send();} catch(e){}
  }
  return buf;
}

function ExportJs(json){
  function SetupParams(node,indent){
    var js="";
    for(var j=0;j<node.params.length;++j){
      var p=node.params[j];
      var sp="      ".substr(0,indent);
      switch(p.type){
      case "s":
        js+=sp+"this."+node.name+"."+p.name+" = \""+p.value+"\";\n";
        break;
      case "n":
        js+=sp+"this."+node.name+"."+p.name+" = "+p.value+";\n";
        break;
      case "a":
        js+=sp+"this."+node.name+"."+p.name+".value = "+p.value+";\n";
        break;
      case "tc":
        js+=sp+"this."+node.name+"."+p.name+" = "+p.value+";\n";
        break;
      case "ts":
        js+=sp+"this."+node.name+"."+p.name+" = \n"+p.value+";\n";
        break;
      case "ob":
        js+=sp+"this."+node.name+"."+p.name+" = this.buffers['"+p.value+"'].data;\n";
        break;
      }
    }
    return js;
  }
  function Connect(node,indent,mode){
    var c=node.connect;
    if(node.type!="knob"){
      for(j=0;j<c.length;++j){
        var m=(c[j].t.substr(0,3)=="osc"||c[j].t.substr(0,6)=="bufsrc");
        if(mode==m){
          if(c[j].i)
            js+="      ".substr(0,indent)+"this."+node.name+".connect(this."+c[j].t+","+c[j].o+","+c[j].i+");\n";
          else
            js+="      ".substr(0,indent)+"this."+node.name+".connect(this."+c[j].t+","+c[j].o+");\n";
        }
      }
    }
  }
  var files=[];
  var obj=eval(json);
  var bufs=[];
  var usestrm=false;
  var useknob=false;
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type=="strmsrc")
      usestrm=true;
    if(o.type=="knob")
      useknob=true;
    if(o.type=="bufsrc"||o.type=="conv"){
      for(var j=0;j<o.params.length;++j){
        var p=o.params[j];
        if(p.name=="buffer"){
          bufs.push(p.value);
        }
      }
    }
  }
  var js="<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n</head>\n<body>\n";
  if(useknob){
    files.push("webcomponents/webcomponents.min.js");
    files.push("webcomponents/polymer.js");
    files.push("webcomponents/polymer.html");
    files.push("webcomponents/layout.html");
    files.push("webcomponents/controls.html");
    js+="<!-- Knobs are used. You should place webcomponents.min.js / polymer.js / polymer.html / layout.html / controls.html to webcomponents folder -->\n";
    js+="<script src=\"webcomponents/webcomponents.min.js\"></script>\n"
      +"<link rel=\"import\" href=\"webcomponents/polymer.html\">\n"
      +"<link rel=\"import\" href=\"webcomponents/controls.html\">\n"
      +"<style>\nwebaudio-knob{margin:10px;}\n</style>\n";
  }
  js+="<script>\n//WebAudioDesigner Data:"+json+"\n\n";
  if(bufs.length){
    js+="// (BufferSource) or (Convolver) is used. You should place \n"
      +"// audio files to samples folder. * Note that the IR files are not MIT licensed.\n"
      +"// sampleurl object has the 'filename':'path to file' pairs.\n\n";
    js+="var sampleurl={\n";
    for(var i=0;i<bufs.length;++i){
      js+="  '"+bufs[i]+"':'samples/"+bufs[i]+"',\n";
      files.push("samples/"+bufs[i]);
    }
    js+="};\n\n";
    js+=
      "function LoadBuffers(actx,list){\n"+
      "  buf={'_count':Object.keys(list).length,'_ready':false};\n"+
      "  for(name in list){\n"+
      "    var o=buf[name]={};\n"+
      "    o.req=new XMLHttpRequest();\n"+
      "    o.req.open('GET',list[name],true);\n"+
      "    o.req.responseType='arraybuffer';\n"+
      "    o.req.buf=buf;\n"+
      "    o.req.nam=name;\n"+
      "    o.req.onload=function(){\n"+
      "      if(this.response){\n"+
      "        actx.decodeAudioData(this.response,\n"+
      "          function(b){\n"+
      "            this.buf[this.nam].data=b;\n"+
      "            if(--this.buf._count==0)\n"+
      "              this.buf._ready=true;\n"+
      "          }.bind(this),\n"+
      "          function(){}\n"+
      "        );\n"+
      "      }\n"+
      "    };\n"+
      "    o.req.onerror=function(){};\n"+
      "    try{o.req.send();} catch(e){}\n"+
      "  }\n"+
      "  return buf;\n"+
      "}\n\n";
  }
  js+=
  "function AudioEngine(audioctx,destination){\n";
  if(usestrm){
    js+=
    "  this.SetupStream=function(){\n"+
    "    navigator.getUserMedia=(navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia);\n"+
    "    if(navigator.getUserMedia){\n"+
    "      navigator.getUserMedia(\n"+
    "        {audio:true},\n"+
    "        function(strm){\n"+
    "          this.strm=strm;\n"+
    "          this.strmsrc1 = this.audioctx.createMediaStreamSource(this.strm);\n"+
    "        }.bind(this),\n"+
    "        function(err){\n"+
    "          alert('getUserMedia Error.');\n"+
    "        }.bind(this)\n"+
    "      );\n"+
    "    }\n"+
    "    else{\n"+
    "      alert('getUserMedia() not supported.');\n"+
    "    }\n"+
    "  };\n";
  }
  js+=
  "  this.audioctx = audioctx;\n"+
  "  if(!audioctx){\n"+
  "     AudioContext = window.AudioContext||window.webkitAudioContext;\n"+
  "     this.audioctx = new AudioContext();\n"+
  "  }\n"+
  "  if(!destination)\n"+
  "    this.destination=this.audioctx.destination;\n";
  if(usestrm)
    js+="  this.SetupStream();\n";
  if(bufs.length)
    js+="  this.buffers = LoadBuffers(this.audioctx,sampleurl);\n";
  for(var i=1;i<obj.length;++i){
    var o=obj[i];
    switch(o.type){
    case "strmsrc":
      break;
    case "elemsrc":
      js+="  this."+o.name+" = this.audioctx.createMediaElementSource(document.getElementById(\""+o.name+"\"));\n";
      break;
    case "gain":
      js+="  this."+o.name+" = this.audioctx.createGain();\n";
      js+=SetupParams(o,2);
      break;
    case "filt":
      js+="  this."+o.name+" = this.audioctx.createBiquadFilter();\n";
      js+=SetupParams(o,2);
      break;
    case "delay":
      js+="  this."+o.name+" = this.audioctx.createDelay();\n";
      js+=SetupParams(o,2);
      break;
    case "panner":
      js+="  this."+o.name+" = this.audioctx.createPanner();\n";
      js+=SetupParams(o,2);
      break;
    case "comp":
      js+="  this."+o.name+" = this.audioctx.createDynamicsCompressor();\n";
      js+=SetupParams(o,2);
      break;
    case "shaper":
      js+="  this."+o.name+" = this.audioctx.createWaveShaper();\n";
      js+=SetupParams(o,2);
      break;
    case "conv":
      js+="  this."+o.name+" = this.audioctx.createConvolver();\n";
      js+=SetupParams(o,2);
      break;
    case "scrproc":
      js+="  this."+o.name+" = this.audioctx.createScriptProcessor();\n";
      js+=SetupParams(o,2);
      break;
    case "analys":
      js+="  this."+o.name+" = this.audioctx.createAnalyser();\n";
      js+=SetupParams(o,2);
      break;
    case "split":
      js+="  this."+o.name+" = this.audioctx.createChannelSplitter();\n";
      break;
    case "merge":
      js+="  this."+o.name+" = this.audioctx.createChannelMerger();\n";
      break;
    }
  }
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type!="osc"&&o.type!="bufsrc"&&o.type!="strmsrc"){
      Connect(o,2,false);
    }
  }
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type=="knob"){
      js+="  document.getElementById('"+o.name+"').addEventListener('change',function(e){\n";
      for(var j=0;j<o.connect.length;++j){
        var c=o.connect[j];
        var n=c.t;
        if(n.indexOf(".")>0)
          n=n.substring(0,n.indexOf("."));
        js+="    if(this."+n+")\n"
          + "      this."+c.t+".value=e.target.value;\n";
      }
      js+="  }.bind(this));\n";
    }
  }
  js+="  this.start=function(){\n";
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type=="osc"){
      js+="    this."+o.name+" = this.audioctx.createOscillator();\n";
      js+=SetupParams(o,4);
    }
    if(o.type=="bufsrc"){
      js+="    this."+o.name+" = this.audioctx.createBufferSource();\n";
      js+=SetupParams(o,4);
    }
  }
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    Connect(o,4,true);
    if(o.type=="osc"||o.type=="bufsrc"||o.type=="strmsrc")
      Connect(o,4,false);
  }
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type=="osc"||o.type=="bufsrc")
      js+="    this."+o.name+".start(0);\n";
  }
  js+="  };\n}\n";
  js+="window.addEventListener('load',function(){audioengine=new AudioEngine()});\n";
  js+="</script>\n<button onclick='audioengine.start()'>Start</button><br/>\n";
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type=="knob"){
      js+="<webaudio-knob id=\""+o.name+"\" diameter=\"32\" min=\""+o.min+"\" max=\""+o.max+"\" step=\""+o.step+"\" value=\""+o.value+"\"></webaudio-knob>\n";
    }
  }
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type=="elemsrc"){
      js+="<audio id=\""+o.name+"\" src=\""+o.params[0].value+"\" controls></audio>\n";
    }
  }
  js+="</body>\n</html>\n";
  var jspane=document.getElementById("jspane");
  var jsfile=document.getElementById("jsfile");
  var jsclose=document.getElementById("jsclose");
  var jsdownload=document.getElementById("jsdownload");
  jsfile.innerHTML=js;
  jspane.style.display="block";
  jsclose.onclick=function(){document.getElementById("jspane").style.display="none";};
  var url=window.URL||window.webkitURL;
  var b=new Blob([document.getElementById("jsfile").value]);
  var bURL=url.createObjectURL(b);
  var link=document.getElementById("jsdownload");
  link.setAttribute("href",bURL);
  link.setAttribute("download","WebAudiodesigner.html");
  var fl="Related files : ";
  for(var i=0;i<files.length;++i){
    fl+=" <a href=\""+files[i]+"\">"+files[i]+"</a> ";
  }
  document.getElementById("files").innerHTML=fl;
}
function ToFixed(n){
  n=n.toFixed(3);
  for(var i=n.length-1;i>0;--i){
    if(n[i]!="0")
      break;
  }
  if(n[i]==".")
    --i;
  n=n.substring(0,i+1);
  return n;
}
function Widget(){
  this.child=[];
}
Widget.prototype.GetNode=function(t){
  while(t&&t.type!="node")
    t=t.parent;
  return t;
};
Widget.prototype.GetPos=function(){
  var pos={x:this.x,y:this.y};
  for(var p=this.parent;p;p=p.parent){
    pos.x+=p.x,pos.y+=p.y;
  }
  return pos;
};
Widget.prototype.HitTest=function(x,y){
  for(var i=this.child.length-1;i>=0;--i){
    var h=this.child[i].HitTest(x,y);
    if(h)
      return h;
  }
  var pos=this.GetPos();
  if(x>=pos.x&&x<pos.x+this.w&&y>=pos.y&&y<pos.y+this.h){
    return this;
  }
  return null;
};
Widget.prototype.Del=function(w){
  for(var i=this.child.length-1;i>=0;--i)
    if(this.child[i]===w)
      this.child.splice(i,1);
};
function Connector(parent,subtype,dir,x,y){
  this.type="conn",this.subtype=subtype,this.dir=dir,this.x=x-10,this.y=y-10,this.w=20,this.h=20,this.parent=parent;
  parent.child.push(this);
  this.Redraw=function(ctx){
    if(subtype=="sig")
      ctx.fillStyle="#6c6";
    else
      ctx.fillStyle="#ccf";
    ctx.beginPath();
    var pos=this.GetPos();
    ctx.arc(pos.x+10,pos.y+10,7,0,6.29);
    ctx.fill();
  };
}
Connector.prototype=new Widget();

function KnobParam(parent,x,y,w,h){
  this.x=x,this.y=y,this.w=w,this.h=h;
  this.parent=parent;
  this.type="knobparam";
  this.subtype="";
}
KnobParam.prototype=new Widget();
KnobParam.prototype.Edit=function(){
  graph.inputfocus=this;
  graph.text.onchange=function(e){
    this.Set(e.target.value);
  }.bind(this);
  graph.Redraw();
};
KnobParam.prototype.Set=function(s){
  var v=eval("({"+s.replace(/\n/g,",")+"})");
  this.parent.min=v.min;
  this.parent.max=v.max;
  this.parent.step=v.step;
  this.parent.value=v.value;
  this.parent.UpdateKnob();
  graph.Redraw();
}
KnobParam.prototype.Redraw=function(ctx){
  var p=this.GetPos();
  ctx.fillStyle="#000";
  ctx.fillText("min:"+this.parent.min,p.x+5,p.y+14);
  ctx.fillText("max:"+this.parent.max,p.x+5,p.y+26);
  ctx.fillText("step:"+this.parent.step,p.x+5,p.y+38);
  ctx.fillText("value:"+this.parent.value,p.x+5,p.y+50);
  if(graph.inputfocus==this){
    graph.text.value="min:"+this.parent.min+"\nmax:"+this.parent.max+"\nstep:"+this.parent.step+"\nvalue:"+this.parent.value;
    graph.text.style.left=(p.x)+"px";
    graph.text.style.top=(p.y)+"px";
    graph.text.style.width=this.w+"px";
    graph.text.style.height=this.h+"px";
    graph.text.style.display="block";
    graph.input.style.display="none";
    graph.select.style.display="none";
    graph.urlinput.style.display="none";
  }
};
function Knob(parent,name,x,y,min,max,step,value){
  this.x=x,this.y=y,this.w=70,this.h=64+20*3,this.name=name,this.min=min,this.max=max,this.step=step,this.value=value;
  this.elem=document.createElement("div");
  this.elem.setAttribute("class","knobpane");
  this.elem.style.left=(x+16)+"px";
  this.elem.style.top=(y+64)+"px";
  document.getElementById("base").insertBefore(this.elem,document.getElementById("insertpoint"));
  this.elem.knob=this;
  this.parent=parent;
  this.type="knob";
  this.connect=[];
  this.child=[new KnobParam(this,0,0,70,56)];
  this.connector=[new Connector(this.child[0],"knob","u",32,0)];
  this.buttons={"node":new Button("node",this,3,this.h-17,14,14)};
  parent.child.push(this);
  this.UpdateKnob();
}
Knob.prototype=new Widget();
Knob.prototype.Redraw=function(ctx){
  this.connector[0].Redraw(ctx);
  ctx.fillStyle="#000";
  ctx.fillRect(this.x,this.y,this.w,this.h);
  ctx.fillStyle="#abf";
  ctx.fillRect(this.x+1,this.y+1,68,54);
  ctx.fillStyle="#aaa";
  ctx.fillRect(this.x+1,this.y+56,this.w-2,this.h-57-20);
  var g=ctx.createLinearGradient(this.x,this.y+this.h-20,this.x,this.y+this.h);
  g.addColorStop(0,"#dfa");
  g.addColorStop(1,"#bc7");
  ctx.fillStyle=g;
  ctx.fillRect(this.x+1,this.y+this.h-19,this.w-2,18);
  ctx.fillStyle="#000";
  ctx.fillText(this.name,this.x+20,this.y+this.h-7);
  this.buttons["node"].Redraw(ctx,this.x,this.y);
  this.child[0].Redraw(ctx);
};
Knob.prototype.Move=function(x,y){
  this.x=x,this.y=y;
  this.elem.style.left=(this.x+16)+"px";
  this.elem.style.top=(this.y+64)+"px";
};
Knob.prototype.Connect=function(target){
  for(var i=this.connect.length-1;i>=0;--i)
    if(this.connect[i].t==target)
      return;
  this.connect.push({t:target});
};
Knob.prototype.UpdateKnob=function(){
  this.elem.innerHTML="<webaudio-knob diameter='32' valuetip='1' min="+this.min
    +" max="+this.max
    +" step="+this.step
    +" value="+this.value
    +" style='position:absolute;top:0px;left:0px'></webaudio-knob>";
}
function Button(name,parent,x,y,w,h){
  this.name=name;
  this.parent=parent;
  parent.child.push(this);
  this.x=x,this.y=y,this.w=w,this.h=h;
  this.type="btn";
  this.press=false;
}
Button.prototype=new Widget();
Button.prototype.Redraw=function(ctx,bx,by){
  var x=bx+this.x;
  var y=by+this.y;
  ctx.fillStyle="#000";
  ctx.fillRect(x,y,this.w,this.h);
  if(this.press)
    ctx.fillStyle="#888";
  else
    ctx.fillStyle="#ccc";
  ctx.fillRect(x+1,y+1,this.w-2,this.h-2);
  ctx.fillStyle="#000";
  switch(this.name){
  case "node":
    ctx.fillStyle="#e84";
    ctx.fillRect(x+2,y+2,this.w-4,this.h-4);
    break;
  case "play":
    ctx.beginPath();
    ctx.moveTo(x+this.w*.25,y+this.h*.2);
    ctx.lineTo(x+this.w*.75,y+this.h*.5);
    ctx.lineTo(x+this.w*.25,y+this.h*.8);
    ctx.fill();
    break;
  case "mode":
    if(this.press)
      ctx.fillText("Time",x+18,y+10);
    else
      ctx.fillText("Freq",x+18,y+10);
    break;
  }
};

function Io(name,parent,x,y,n){
  this.name=name;
  this.parent=parent;
  parent.child.push(this);
  this.x=x,this.y=y,this.w=50,this.h=20;
  this.n=n;
  this.type="io";
  if(name=="in")
    this.child=[new Connector(this,"sig","l",0,10)];
  else
    this.child=[new Connector(this,"sig","o",this.w,10)];
  this.subtype=(name=="in")?"in":"out";
}
Io.prototype=new Widget();
Io.prototype.Redraw=function(ctx,bx,by){
  this.child[0].Redraw(ctx);
  ctx.fillStyle="#000";
  ctx.fillRect(bx+this.x,by+this.y,this.w,this.h+1);
  ctx.fillStyle="#abf";
  ctx.fillRect(bx+this.x+1,by+this.y+1,this.w-2,this.h-1);
  ctx.fillStyle="#000";
  ctx.fillText(this.name,bx+this.x+4,by+this.y+13);
};

function Param(parent,x,y,w,h,tx,ty,subtype,option,name){
  this.x=x,this.y=y,this.w=w,this.h=h,this.tx=tx,this.ty=ty;
  this.name=name;
  this.parent=parent;
  parent.child.push(this);
  this.child=[];
  this.subtype=subtype;
  this.option=option;
  if(subtype=="a")
    this.connector=[new Connector(this,"sig","l",0,10),new Connector(this,"knob","r",this.w,10)];
  else if(subtype=="n")
    this.connector=[new Connector(this,"knob","r",this.w,10)];
  else
    this.connector=[];
  switch(subtype){
  case "a":
    this.value=ToFixed(this.parent.node[name].value);
    break;
  case "s":
  case "n":
  case "b":
    this.value=parent.node[name];
    break;
  case "tc":
    this.value=option;
    this.parent.node[name]=eval(this.value);
    break;
  case "ts":
    this.value=option;
    this.parent.node[name]=eval("("+this.value+")");
    break;
  case "tu":
    this.value=option;
    break;
  case "ob":
    this.value=option[0];
    this.parent.node[name]=this.parent.parent.buffers[this.value].data;
    break;
  }
  this.bx=this.by=0;
  this.type="param";
}
Param.prototype=new Widget();
Param.prototype.Set=function(value){
  switch(this.subtype){
  case "a":
    this.value=value;
    this.parent.node[this.name].value=value;
    break;
  case "n":
  case "s":
  case "b":
    this.value=value;
    this.parent.node[this.name]=value;
    break;
  case "tc":
    this.value=value;
    this.parent.node[this.name]=eval(this.value);
    break;
  case "ts":
    this.value=value;
    this.parent.node[this.name]=eval("("+value+")");
    break;
  case "tu":
    this.value=value;
    this.parent.elem.src=this.value;
    break;
  case "ob":
    this.value=value;
    this.parent.node[this.name]=this.parent.parent.buffers[this.value].data;
    break;
  }
  graph.Redraw();
};
Param.prototype.Redraw=function(ctx,bx,by){
  for(var i=0;i<this.connector.length;++i)
    this.connector[i].Redraw(ctx);
  ctx.fillStyle="#000";
  ctx.fillRect(bx+this.x,by+this.y,this.w,this.h);
  if(this.subtype=="tu")
    var g="#abf";
  else{
    var g=ctx.createLinearGradient(0,by+this.y,0,by+this.y+this.h);
    g.addColorStop(0,"#eef");
    g.addColorStop(1,"#bbc");
  }
  ctx.fillStyle=g;
  ctx.fillRect(bx+this.x+1,by+this.y+1,this.w-2,this.h-1);
  ctx.fillStyle="#000";
  ctx.fillText(this.name,bx+this.x+4,by+this.y+14);
  switch(this.subtype){
  case "tc":
    var c=this.parent.node.curve;
    ctx.strokeStyle="#8e8";
    ctx.fillStyle="#335";
    ctx.fillRect(bx+this.x+60,by+this.y+40-32,64,64);
    ctx.beginPath();
    ctx.moveTo(bx+this.x+60,by+this.y+40-c[0]*32);
    for(var i=0;i<c.length;++i){
      ctx.lineTo(bx+this.x+(i/(c.length-1))*64+60,by+this.y+40-c[i]*32);
    }
    ctx.stroke();
    break;
  case "ts":
    ctx.fillText(" = function(){...}",bx+this.x+4,by+this.y+14+20);
    break;
  case "ob":
    ctx.fillText(this.value,bx+this.x+this.tx,by+this.y+14+this.ty);
    break;
  case "tu":
    ctx.font="normal 10px Verdana,sans-serif";
    ctx.fillText(this.value.substr(-27),bx+this.x+30,by+this.y+14);
    ctx.font="bold 10px Verdana,sans-serif";
    break;
  default:
    ctx.fillText(this.value,bx+this.x+this.tx,by+this.y+14);
    break;
  }
  if(bx!=this.bx||by!=this.by)
    this.bx=bx,this.by=by;
  if(graph.inputfocus==this){
    switch(this.subtype){
    case "a":
    case "n":
      graph.input.style.left=(this.parent.x+this.x+this.tx)+"px";
      graph.input.style.top=(this.parent.y+this.y)+"px";
      graph.input.style.width=(this.parent.w-this.tx-5)+"px";
      graph.input.style.height="15px";
      graph.input.style.display="block";
      graph.text.style.display="none";
      graph.select.style.display="none";
      graph.urlinput.style.display="none";
      break;
    case "tc":
    case "ts":
      graph.text.style.left=(this.parent.x+this.x)+"px";
      graph.text.style.top=(this.parent.y+this.y+14)+"px";
      graph.text.style.width=this.tx+"px";
      graph.text.style.height=this.ty+"px";
      graph.text.style.display="block";
      graph.input.style.display="none";
      graph.select.style.display="none";
      graph.urlinput.style.display="none";
      break;
    case "tu":
      graph.urlinput.style.left=(this.parent.x+this.x)+"px";
      graph.urlinput.style.top=(this.parent.y+this.y)+"px";
      graph.urlinput.style.width=this.tx+"px";
      graph.urlinput.style.height=this.ty+"px";
      graph.urlinput.style.display="block";
      graph.text.style.display="none";
      graph.input.style.display="none";
      graph.select.style.display="none";
      break;
    case "s":
    case "b":
    case "ob":
      graph.select.style.left=(this.parent.x+this.x+this.tx)+"px";
      graph.select.style.top=(this.parent.y+this.y+this.ty+1)+"px";
      graph.select.style.width=(this.parent.w-this.tx)+"px";
      graph.select.style.height="19px";
      graph.select.style.display="block";
      graph.input.style.display="none";
      graph.text.style.display="none";
      graph.urlinput.style.display="none";
      break;
    }
  }
};
Param.prototype.Edit=function(){
  switch(this.subtype){
  case "s":
  case "ob":
    while(graph.select.childNodes.length)
      graph.select.removeChild(graph.select.childNodes[0]);
    for(i in this.option){
      var e=document.createElement("option");
      e.innerHTML=this.option[i];
      if(this.value==this.option[i])
        e.setAttribute("selected",1);
      graph.select.appendChild(e);
    }
    graph.select.onchange=function(e){
      this.Set(e.target.value);
      graph.Redraw();
    }.bind(this);
    graph.inputfocus=this;
    graph.Redraw();
    graph.select.focus();
    return;
  case "b":
    this.Set(!this.value);
    graph.Redraw();
    return;
  case "a":
    graph.input.value=this.value;
    graph.input.onchange=function(e){
      this.Set(e.target.value);
    }.bind(this);
    graph.inputfocus=this;
    graph.Redraw();
    graph.input.focus();
    return;
  case "n":
    graph.input.value=this.value;
    graph.input.onchange=function(e){
      this.Set(e.target.value);
    }.bind(this);
    graph.inputfocus=this;
    graph.Redraw();
    graph.input.focus();
    return;
  case "tc":
  case "ts":
    graph.text.value=this.value;
    graph.text.onchange=function(e){
      this.Set(e.target.value);
    }.bind(this);
    graph.inputfocus=this;
    graph.Redraw();
    graph.text.focus();
    return;
  case "tu":
    graph.urlinput.value=this.value;
    graph.urlinput.onchange=function(e){
      this.Set(e.target.value);
    }.bind(this);
    graph.inputfocus=this;
    graph.Redraw();
    graph.urlinput.focus();
    return;
  }
};

function ANode(parent,name,subtype,x,y){
  this.parent=parent;
  this.child=[];
  var actx=parent.actx;
  this.name=name,this.x=x,this.y=y,this.w=101;
  this.connect=[];
  parent.child.push(this);
  this.type="node";
  this.subtype=subtype;
  switch(subtype){
  case "destination":
    this.h=2*20+1;
    this.ioh=20;
    this.w=115;
    this.io=[new Io("in",this,0,20,0)];
    this.node=actx.destination;
    this.params=[];
    this.buttons={};
    break;
  case "elemsrc":
    this.h=92;
    this.ioh=71;
    this.w=230;
    this.io=[new Io("out",this,this.w-50,20,0)];
    this.params=[new Param(this,0,40,this.w,40,350,15,"tu","http://www.g200kg.com/music/kerokeroshiyouyo.mp3","url")];
    this.elem=document.createElement("audio");
    this.elem.setAttribute("class","audiopane");
    this.elem.setAttribute("src","http://www.g200kg.com/music/kerokeroshiyouyo.mp3");
    this.elem.setAttribute("controls","true");
    this.elem.style.left=(this.x+1)+"px";
    this.elem.style.top=(this.y+61)+"px";
//    this.elem.onloadeddata=function(){this.node=actx.createMediaElementSource(this.elem);console.log(this.elem)}.bind(this);
//    this.elem.onended=function(){this.buttons.play.press=false;graph.Redraw();}.bind(this);
    document.getElementById("base").insertBefore(this.elem,document.getElementById("insertpoint"));
    try{
      this.node=actx.createMediaElementSource(this.elem);
    } catch(e){alert("cannot use MediaElementSource on this browser");}
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "strmsrc":
    if(graph.strm==null){
      navigator.getUserMedia=(navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia);
      if(navigator.getUserMedia){
        navigator.getUserMedia(
          {audio:true},
          function(strm){
            graph.strm=strm;
            this.node=actx.createMediaStreamSource(strm);
          }.bind(this),
          function(err){
            alert("getUserMedia Error.");
            this.type=null;
            MenuClear();
          }.bind(this)
        );
      }
      else{
        alert("getUserMedia() not supported.");
        this.type=null;
        MenuClear();
        return;
      }
    }
    else{
      this.node=actx.createMediaStreamSource(graph.strm);
    }
    this.h=2*20+1;
    this.ioh=20;
    this.w=150;
    this.io=[new Io("out",this,this.w-50,20,0)];
    this.params=[];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "split":
    this.h=3*20+1;
    this.ioh=40;
    this.w=120;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0),new Io("out",this,this.w-50,40,1)];
    this.node=actx.createChannelSplitter();
    this.params=[];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "merge":
    this.h=3*20+1;
    this.ioh=40;
    this.w=120;
    this.io=[new Io("in",this,0,20,0),new Io("in",this,0,40,1),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createChannelMerger();
    this.params=[];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "bufsrc":
    this.h=141;
    this.ioh=20;
    this.w=160;
    this.io=[new Io("out",this,this.w-50,20,0)];
    this.node=actx.createBufferSource();
    this.params=[
      new Param(this,0,40,this.w,20,90,0,"a",null,"playbackRate"),
      new Param(this,0,60,this.w,20,90,0,"b",null,"loop"),
      new Param(this,0,80,this.w,20,90,0,"n",null,"loopStart"),
      new Param(this,0,100,this.w,20,90,0,"n",null,"loopEnd"),
      new Param(this,0,120,this.w,20,60,0,"ob",["loop.wav","rhythm.wav","voice.mp3","snare.wav"],"buffer"),
    ]
    this.buttons={"play":new Button("play",this,20,24,20,14),"node":new Button("node",this,3,3,14,14)};
    break;
  case "osc":
    this.h=5*20+1;
    this.ioh=20;
    this.w=130;
    this.io=[new Io("out",this,this.w-50,20,0)];
    this.node=actx.createOscillator();
    this.params=[
      new Param(this,0,40,this.w,20,70,0,"s",["sine","square","sawtooth","triangle"],"type"),
      new Param(this,0,60,this.w,20,70,0,"a",null,"frequency"),
      new Param(this,0,80,this.w,20,70,0,"a",null,"detune")];
    this.buttons={"play":new Button("play",this,20,24,20,14),"node":new Button("node",this,3,3,14,14)};
    break;
  case "gain":
    this.h=3*20+1;
    this.ioh=20;
    this.w=110;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createGain();
    this.params=[new Param(this,0,40,this.w,20,60,0,"a",null,"gain")];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "filt":
    this.h=7*20+1;
    this.ioh=20;
    this.w=120;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createBiquadFilter();
    this.params=[
      new Param(this,0,40,this.w,20,60,0,"s",["lowpass","highpass","bandpass","lowshelf","highshelf","peaking","notch","allpass"],"type"),
      new Param(this,0,60,this.w,20,80,0,"a",null,"frequency"),
      new Param(this,0,80,this.w,20,80,0,"a",null,"detune"),
      new Param(this,0,100,this.w,20,80,0,"a",null,"Q"),
      new Param(this,0,120,this.w,20,80,0,"a",null,"gain")
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "comp":
    this.h=7*20+1;
    this.ioh=20;
    this.w=130;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createDynamicsCompressor();
    this.params=[
      new Param(this,0,40,this.w,20,70,0,"a",null,"threshold"),
      new Param(this,0,60,this.w,20,70,0,"a",null,"knee"),
      new Param(this,0,80,this.w,20,70,0,"a",null,"ratio"),
      new Param(this,0,100,this.w,20,70,0,"a",null,"attack"),
      new Param(this,0,120,this.w,20,70,0,"a",null,"release"),
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "delay":
    this.h=3*20+1;
    this.ioh=20;
    this.w=120;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createDelay();
    this.params=[new Param(this,0,40,this.w,20,70,0,"a",null,"delayTime")];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "panner":
    this.h=10*20+1;
    this.ioh=20;
    this.w=175;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createPanner();
    this.params=[
      new Param(this,0,40,this.w,20,95,0,"s",["equalpower","HRTF"],"panningModel"),
      new Param(this,0,60,this.w,20,95,0,"s",["linear","inverse","exponential"],"distanceModel"),
      new Param(this,0,80,this.w,20,110,0,"n",null,"refDistance"),
      new Param(this,0,100,this.w,20,110,0,"n",null,"maxDistance"),
      new Param(this,0,120,this.w,20,110,0,"n",null,"rolloffFactor"),
      new Param(this,0,140,this.w,20,110,0,"n",null,"coneInnerAngle"),
      new Param(this,0,160,this.w,20,110,0,"n",null,"coneOuterAngle"),
      new Param(this,0,180,this.w,20,110,0,"n",null,"coneOuterGain")
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "analys":
    this.h=181;
    this.ioh=20;
    this.w=185;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createAnalyser();
    this.params=[
      new Param(this,0,40,this.w,20,150,0,"n",null,"fftSize"),
      new Param(this,0,60,this.w,20,150,0,"n",null,"minDecibels"),
      new Param(this,0,80,this.w,20,150,0,"n",null,"maxDecibels"),
      new Param(this,0,100,this.w,20,150,0,"n",null,"smoothingTimeConstant")
    ];
    this.buttons={"mode":new Button("mode",this,60,24,65,14),"node":new Button("node",this,3,3,14,14)};
    this.buf=new Uint8Array(185);
    this.timerfunc=function(e){
      if(this.buttons.mode.press)
        this.node.getByteTimeDomainData(this.buf);
      else
        this.node.getByteFrequencyData(this.buf);
      graph.ctx.fillStyle="#000";
      graph.ctx.fillRect(this.x+1,this.y+122,183,58);
      graph.ctx.fillStyle="#0c0";
      for(var i=1;i<this.w-1;++i){
        var v=this.buf[i]*55/256;
        graph.ctx.fillRect(this.x+i,this.y+180,1,-v);
      }
      var i;
      for(i=0;i<graph.child.length;++i)
        if(graph.child[i]==this)
          break;
      for(++i;i<graph.child.length;++i){
        graph.child[i].Redraw(this.parent.ctx);
      }
    };
    this.timerid=setInterval(this.timerfunc.bind(this),200);
    break;
  case "shaper":
    this.h=7*20+1;
    this.ioh=20;
    this.w=140;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createWaveShaper();
    this.params=[
      new Param(this,0,40,this.w,20,80,0,"s",["none","2x","4x"],"oversample"),
      new Param(this,0,60,this.w,80,170,120,"tc","new Float32Array([\n-0.5,-0.5,0,0.5,0.5\n])","curve"),
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "conv":
    this.h=5*20+1;
    this.ioh=20;
    this.w=200;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createConvolver();
    this.params=[
      new Param(this,0,40,this.w,20,70,0,"b",null,"normalize"),
      new Param(this,0,60,this.w,40,4,20,"ob",[
        "Five Columns Long.wav",
        "Five Columns.wav",
        "French 18th Century Salon.wav",
        "Going Home.wav",
        "In The Silo Revised.wav",
        "Narrow Bumpy Space.wav",
        "Nice Drum Room.wav",
        "Parking Garage.wav",
        "Rays.wav",
        "Trig Room.wav",
        ],"buffer"),
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "scrproc":
    this.h=81;
    this.ioh=20;
    this.w=180;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createScriptProcessor();
    this.params=[
      new Param(this,0,40,this.w,40,280,180,"ts",
        "function(ev){\n"+
        "  var out0=ev.outputBuffer.getChannelData(0);\n"+
        "  var out1=ev.outputBuffer.getChannelData(1);\n"+
        "  var in0=ev.inputBuffer.getChannelData(0);\n"+
        "  var in1=ev.inputBuffer.getChannelData(1);\n"+
        "  for(var i=0;i<ev.target.bufferSize;++i){\n"+
        "    out0[i]=in0[i];\n"+
        "    out1[i]=in1[i];\n"+
        "  }\n"+
        "}","onaudioprocess"),
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  }
  this.RestartNode=function(){
    switch(this.subtype){
    case "osc":
      this.node.disconnect();
      this.node=this.parent.actx.createOscillator();
      this.node.type=this.params[0].value;
      this.node.frequency.value=this.params[1].value;
      this.node.detune.value=this.params[2].value;
      break;
    case "bufsrc":
      this.node.disconnect();
      this.node=this.parent.actx.createBufferSource();
      this.node.playbackRate.value=this.params[0].value;
      this.node.loop=this.params[1].value;
      this.node.loopStart=this.params[2].value;
      this.node.loopEnd=this.params[3].value;
      this.node.onended=function(){this.buttons.play.press=false;graph.Redraw()}.bind(this);
      this.node.buffer=this.parent.buffers[this.params[4].value].data;
      break;
    }
  };
}
ANode.prototype=new Widget();
ANode.prototype.Redraw=function(ctx){
  ctx.fillStyle="#000";
  ctx.fillRect(this.x,this.y,this.w,this.h);
  var g=ctx.createLinearGradient(this.x,this.y,this.x,this.y+20);
  g.addColorStop(0,"#dfa");
  g.addColorStop(1,"#bc7");
  ctx.fillStyle=g;
  ctx.fillRect(this.x+1,this.y+1,this.w-2,20-2);
  ctx.fillStyle="#abf";
  ctx.fillRect(this.x+1,this.y+21,this.w-2,this.ioh-1);
  ctx.fillStyle="#000";
  switch(this.subtype){
  case "destination":
    ctx.fillText("DESTINATION",this.x+20,this.y+13);
    break;
  default:
    ctx.fillText(this.name,this.x+20,this.y+13);
    break;
  }
  for(var i=0;i<this.io.length;++i){
    this.io[i].Redraw(ctx,this.x,this.y);
  }
  for(var i in this.buttons){
    this.buttons[i].Redraw(ctx,this.x,this.y);
  }
  for(var i=0;i<this.params.length;++i){
    var p=this.params[i];
    p.Redraw(ctx,this.x,this.y);
  }
};
ANode.prototype.Connect=function(target,o,i){
  if(!o)
    o=0;
  if(!i)
    i=0;
  this.connect.push({"t":target,"o":o,"i":i});
  if(target.type=="param")
    this.node.connect(target.parent.node[target.name],o);
  else
    this.node.connect(target.node,o,i);
};
ANode.prototype.Move=function(x,y){
  this.x=x,this.y=y;
  if(this.elem){
    this.elem.style.left=(this.x+1)+"px";
    this.elem.style.top=(this.y+61)+"px";
  }
};


function Graph(canvas,actx,dest){
  menu=document.getElementById("menu");
  menu.onclick=MenuClick;
  this.x=this.y=0;
  this.canvas=canvas;
  canvas.onmousedown=MouseDown;
  canvas.onmousemove=MouseMove;
  canvas.onmouseup=MouseUp;
  canvas.ondblclick=DblClick;
  this.ctx=canvas.getContext("2d");
  this.input=document.getElementById("input");
  this.select=document.getElementById("select");
  this.text=document.getElementById("text");
  this.urlinput=document.getElementById("urlinput");
  this.actx=actx;
  this.dest=dest;
  this.child=[new ANode(this,"destination","destination",800,100)];
  this.playing=false;
  this.strm=null;
  this.conntarget=null;
  this.buffers=LoadBuffers(
    actx,
    {
      "loop.wav":"samples/loop.wav",
      "voice.mp3":"samples/voice.mp3",
      "rhythm.wav":"samples/rhythm.wav",
      "snare.wav":"samples/snare.wav",
      "Five Columns Long.wav":"samples/ir/IMreverbs1/Five Columns Long.wav",
      "Five Columns.wav":"samples/ir/IMreverbs1/Five Columns.wav",
      "French 18th Century Salon.wav":"samples/ir/IMreverbs1/French 18th Century Salon.wav",
      "Going Home.wav":"samples/ir/IMreverbs1/Going Home.wav",
      "In The Silo Revised.wav":"samples/ir/IMreverbs1/In The Silo Revised.wav",
      "Narrow Bumpy Space.wav":"samples/ir/IMreverbs1/Narrow Bumpy Space.wav",
      "Nice Drum Room.wav":"samples/ir/IMreverbs1/Nice Drum Room.wav",
      "Parking Garage.wav":"samples/ir/IMreverbs1/Parking Garage.wav",
      "Rays.wav":"samples/ir/IMreverbs1/Rays.wav",
      "Trig Room.wav":"samples/ir/IMreverbs1/Trig Room.wav",
    }
  );
  this.GetJson=function(){
    var o=[];
    for(var i=0;i<this.child.length;++i){
      var n=this.child[i];
      var paramtab=[];
      var contab=[];
      if(n.type=="node"){
        for(var j=0;j<n.params.length;++j){
          var p=n.params[j];
          paramtab.push({"name":p.name,"type":p.subtype,"value":p.value});
        }
        for(var j=0;j<n.connect.length;++j){
          var p=n.connect[j];
          if(p.t.type=="node"){
            if(p.t.subtype=="destination")
              contab.push({"t":"destination","o":p.o,"i":0});
            else
              contab.push({"t":p.t.name,"o":p.o,"i":p.i});
          }
          else if(p.t.type=="param")
            contab.push({"t":p.t.parent.name+"."+p.t.name,"o":p.o});
        }
        o.push({"type":n.subtype,"name":n.name,"x":n.x,"y":n.y,"params":paramtab,"connect":contab});
      }
      else if(n.type=="knob"){
        for(var j=0;j<n.connect.length;++j){
          var p=n.connect[j];
          contab.push({"t":p.t.parent.name+"."+p.t.name});
        }
        o.push({"type":"knob","name":n.name,"x":n.x,"y":n.y,"min":n.min,"max":n.max,"step":n.step,"value":n.value,"connect":contab});
      }
    }
    return o;
  };
  this.Play=function(){
    this.playing=false;
    for(var i=0;i<this.child.length;++i){
      var n=this.child[i];
      if(n.buttons.play&&n.buttons.play.press){
        this.playing=true;
        break;
      }
    }
    if(this.playing){
      for(var i=0;i<this.child.length;++i){
        var n=this.child[i];
        if(n.buttons.play){
          if(n.buttons.play.press){
            if(n.subtype=="elemsrc"){
              n.elem.pause();
              n.elem.currentTime=0;
            }
            else if(n.node.stop)
              n.node.stop(0);
            n.buttons.play.press=false;
          }
        }
      }
    }
    else{
      var t=audioctx.currentTime+0.05;
      for(var i=0;i<this.child.length;++i){
        var n=this.child[i];
        if(n.subtype=="elemsrc")
          n.elem.play();
        if(n.buttons.play){
          n.RestartNode();
        if(n.node.start)
            n.node.start(t);
          n.buttons.play.press=true;
        }
      }
      this.ReConnect();
    }
    this.Redraw();
  };
  this.About=function(){
    document.getElementById("menunode").style.display="none";
    document.getElementById("menugraph").style.display="none";
    document.getElementById("menuknob").style.display="none";
    document.getElementById("aboutpane").style.display="block";
    document.getElementById("urlpane").style.display="none";
    document.getElementById("jspane").style.display="none";
    document.getElementById("aboutclose").onclick=function(){document.getElementById("aboutpane").style.display="none";};
  };
  this.Link=function(){
    var o=this.GetJson();
    var url=(location.protocol+"//"+location.host+location.pathname+"?p="+encodeURI(JSON.stringify(o)));
    document.getElementById("aboutpane").style.display="none";
    document.getElementById("jspane").style.display="none";
    document.getElementById("urlpane").style.display="block";
    document.getElementById("url").value=url;
    document.getElementById("urlclose").onclick=function(){document.getElementById("urlpane").style.display="none";};
    document.getElementById("urljump").onclick=function(){location.href=document.getElementById("url").value;};
  };
  this.Export=function(){
    var o=this.GetJson();
    ExportJs(JSON.stringify(o));
  };
  this.Load=function(obj){
    this.New();
    this.child[0].x=obj[0].x;
    this.child[0].y=obj[0].y;
    for(var i=1;i<obj.length;++i){
      var o=obj[i];
      if(o.type=="knob"){
        o.n=graph.AddKnob(o.x,o.y,o.min,o.max,o.step,o.value);
      }
      else{
        o.n=graph.AddNode(o.type,o.name,o.x,o.y);
        for(var j=0;j<o.params.length;++j){
          var p=o.params[j];
          for(var k=0;k<o.n.params.length;++k){
            if(o.n.params[k].name==o.params[j].name)
              o.n.params[k].Set(o.params[j].value);
          }
        }
      }
    }
    for(var i=1;i<obj.length;++i){
      var o=obj[i];
      for(var j=0;j<o.connect.length;++j){
        var t=o.connect[j];
        o.n.Connect(graph.Find(t.t),t.o,t.i);
      }
    }
    graph.Redraw();
  };
  this.New=function(){
    while(this.child.length>1){
      this.DelNode(this.child[1]);
    }
    this.Redraw();
  };
  this.Find=function(name){
    var s=name.split(".");
    for(var i=0;i<this.child.length;++i){
      var n=this.child[i];
      if(s[0]==n.name){
        if(s.length>1){
          var p=n.params;
          for(var j=0;j<p.length;++j){
            if(p[j].name==s[1])
              return p[j];
          }
        }
        else
          return n;
      }
    }
  };
  this.ReConnect=function(){
    for(var i=this.child.length-1;i>=1;--i){
      var n=this.child[i];
      if(n.type=="node"){
        n.node.disconnect();
        if(n.subtype=="split")
          n.node.disconnect(1);
      }
    }
    for(var i=0;i<this.child.length;++i){
      var n=this.child[i];
      if(n.type=="node"){
        for(var j=0;j<n.connect.length;++j){
          var c=n.connect[j];
          switch(c.t.type){
          case "node":
            n.node.connect(c.t.node,c.o,c.i);
            break;
          case "param":
            n.node.connect(c.t.parent.node[c.t.name],c.o);
            break;
          }
        }
      }
    }
  };
  this.AddNode=function(type,name,x,y){
    if(name==null)
      name=this.GetNextName(type);
    var node=new ANode(this,name,type,x,y);
    this.Redraw();
    return node;
  };
  this.DelNode=function(node){
    if(node.type=="node"){
      for(var i=this.child.length-1;i>=0;--i){
        var n=this.child[i];
        for(var j=n.connect.length-1;j>=0;--j){
          if(n.connect[j].t==node||n.connect[j].t.parent==node){
            n.connect.splice(j,1);
          }
        }
        if(n==node){
          if(node.node)
            node.node.disconnect();
          if(node.subtype=="split")
            node.node.disconnect(1);
          if(node.subtype=="elemsrc")
            document.getElementById("base").removeChild(node.elem);
          if(node.buttons.play&&node.buttons.play.press&&node.node.stop)
            node.node.stop(0);
          if(node.subtype=="analys")
            clearInterval(node.timerid);
          this.child.splice(i,1);
        }
      }
    }
    if(node.type=="knob"){
      for(var i=this.child.length-1;i>=0;--i){
        var n=this.child[i];
        if(n==node){
          document.getElementById("base").removeChild(n.elem);
          this.child.splice(i,1);
        }
      }
    }
    this.Redraw();
  };
  this.DisconnectNode=function(node){
    if(node.type=="knob"){
      this.DisconnectWire(node.connector[0]);
      return;
    }
    node.connect.length=0;
    node.node.disconnect();
    if(node.subtype=="split")
      node.node.disconnect(1);
    this.Redraw();
  };
  this.DisconnectWire=function(target){
    switch(target.parent.type){
    case "knob":
      target.parent.connect.length=0;
      break;
    case "io":
      switch(target.parent.subtype){
      case "out":
        var n=target.parent.parent;
        for(var j=n.connect.length-1;j>=0;--j){
          var c=n.connect[j];
          if(c.o==target.parent.n)
            n.connect.splice(j,1);
        }
        n.node.disconnect(target.parent.node,target.n);
        break;
      case "in":
        for(var i=this.child.length-1;i>=0;--i){
          var n=this.child[i];
          for(var j=n.connect.length-1;j>=0;--j){
            var c=n.connect[j];
            n.node.disconnect(c.o);
            if(c.t==target.parent.parent&&c.i==target.parent.n)
              n.connect.splice(j,1);
          }
        }
        break;
      }
      break;
    case "param":
      switch(target.subtype){
      case "sig":
        for(var i=this.child.length-1;i>=0;--i){
          var n=this.child[i];
          if(n.type=="node"){
            for(var j=n.connect.length-1;j>=0;--j){
              var c=n.connect[j];
              n.node.disconnect(c.o);
              if(c.t==target.parent)
                n.connect.splice(j,1);
            }
          }
        }
        break;
      case "knob":
        for(var i=this.child.length-1;i>=0;--i){
          var n=this.child[i];
          if(n.type=="knob"){
            for(var j=n.connect.length-1;j>=0;--j){
              var c=n.connect[j];
              if(c.t==target.parent)
                n.connect.splice(j,1);
            }
          }
        }
        break;
      }
      break;
    }
    this.ReConnect();
    this.Redraw();
  };
  this.Connected=function(target){
    if(target.subtype=="out"){
      var n=target.parent;
      for(var j=n.connect.length-1;j>=0;--j){
        var c=n.connect[j];
        if(c.o==target.n)
          return true;
      }
    }
    else if(target.subtype=="in"){
      for(var i=this.child.length-1;i>=0;--i){
        var n=this.child[i];
        for(var j=n.connect.length-1;j>=0;--j){
          var c=n.connect[j];
          if(c.t==target.parent&&c.i==target.n)
            return true;
        }
      }
    }
    else if(target.type=="param"){
      for(var i=this.child.length-1;i>=0;--i){
        var n=this.child[i];
        for(var j=n.connect.length-1;j>=0;--j){
          var c=n.connect[j];
        if(c.t==target)
          return true;
        }
      }
    }
    return false;
  }
  this.AddKnob=function(x,y,min,max,step,value){
    var k=new Knob(graph,this.GetNextName("knob"),x,y,min,max,step,value);
    k.elem.addEventListener("change",function(){
      this.knob.value=parseFloat(ToFixed(this.knob.elem.childNodes[0].value));
      for(var i=0;i<k.connect.length;++i){
        var t=k.connect[i];
        t.t.parent.node[t.t.name].value=t.t.value=this.knob.value;
      }
      graph.Redraw();
    })
    graph.Redraw();
    return k;
  }
  this.Redraw=function(){
    this.ctx.lineWidth=2;
    this.ctx.font="bold 10px Verdana,sans-serif";
    this.ctx.fillStyle="#346";
    this.ctx.fillRect(0,0,canvas.width,canvas.height);
    this.ctx.beginPath();
    for(var i=this.child.length-1;i>=0;--i){
      var n=this.child[i];
      if(n.type=="node"){
        for(var j=0;j<n.connect.length;++j){
          var t=n.connect[j];
          this.ctx.moveTo(n.x+n.w,n.y+30+t.o*20);
          switch(t.t.type){
          case "node":
            this.ctx.bezierCurveTo(n.x+n.w+50,n.y+30+t.o*20,t.t.x-50,t.t.y+30+t.i*20,t.t.x,t.t.y+30+t.i*20);
            break;
          case "param":
            this.ctx.bezierCurveTo(n.x+n.w+50,n.y+30+t.o*20,t.t.parent.x+t.t.x-50,t.t.parent.y+t.t.y+10,t.t.parent.x+t.t.x,t.t.parent.y+t.t.y+10);
            break;
          }
        }
      }
    }
    this.ctx.strokeStyle="#0e8";
    this.ctx.stroke();
    this.ctx.beginPath();
    for(var i=this.child.length-1;i>=0;--i){
      var k=this.child[i];
      if(k.type=="knob"){
        for(var j=k.connect.length-1;j>=0;--j){
          var t=k.connect[j].t;
          var pk=k.GetPos();
          var pt=t.GetPos();
          pk.x+=32;
          pt.x+=t.w,pt.y+=10;
          this.ctx.moveTo(pk.x,pk.y);
          this.ctx.bezierCurveTo(pk.x,pk.y-50,pt.x+50,pt.y,pt.x,pt.y);
        }
      }
    }
    this.ctx.strokeStyle="#ccf";
    this.ctx.stroke();
    for(var i=0;i<this.child.length;++i){
      this.child[i].Redraw(this.ctx);
    }
    if(this.conntarget){
      if(dragging){
        var from=dragging.subtype+dragging.parent.type+dragging.parent.subtype;
        var to=this.conntarget.subtype+this.conntarget.parent.type+this.conntarget.parent.subtype;
        var con=false;
        switch(from){
        case "sigioout":
          if(to=="sigioin"||to=="sigparama")
            con=true;
          break;
        case "sigioin":
          if(to=="sigioout")
            con=true;
          break;
        case "sigparama":
          if(to=="sigioout")
            con=true;
          break;
        case "knobparama":
        case "knobparamn":
          if(to=="knobknobparam")
            con=true;
          break;
        case "knobknobparam":
          if(to=="knobparama"||to=="knobparamn")
            con=true;
          break;
        }
      }
      else
        con=true;
      if(con){
        this.ctx.beginPath();
        var p=this.conntarget.GetPos();
        this.ctx.arc(p.x+10,p.y+10,10,0,6.29);
        this.ctx.strokeStyle="#fff";
        this.ctx.stroke();
      }
      else{
        this.ctx.beginPath();
        var p=this.conntarget.GetPos();
        this.ctx.moveTo(p.x,p.y);
        this.ctx.lineTo(p.x+20,p.y+20);
        this.ctx.moveTo(p.x+20,p.y);
        this.ctx.lineTo(p.x,p.y+20);
        this.ctx.strokeStyle="#f00";
        this.ctx.stroke();
      }
    }
  };
  this.GetNextName=function(type){
    var n=1;
    for(;;){
      var nam=type+n;
      for(var i=0;i<this.child.length;++i){
        if(nam==this.child[i].name){
          break;
        }
      }
      if(i==this.child.length)
        return nam;
      ++n;
    }
  };
}
Graph.prototype=new Widget();

function KeyPress(e){
  switch(e.charCode){
  case 115://s
    break;
  }
}
function KeyDown(e){
  var t=document.activeElement.tagName;
  if(t=="INPUT"||t=="TEXTAREA")
    return;
  switch(e.keyCode){
//  case 65:
//    var v=document.querySelector(".audiopane");
//    var k=graph.actx.createMediaElementSource(v);
//    return;
  case 8:
    e.preventDefault();
    return false;
  }
}
function DblClick(e){
  e.preventDefault();
  e.stopPropagation();
  return false;
}
function MouseDown(e){
  var rc=graph.canvas.getBoundingClientRect();
  mouseX=Math.floor(e.clientX-rc.left);
  mouseY=Math.floor(e.clientY-rc.top);
  dragging=graph.HitTest(mouseX,mouseY);
  if(dragging)
    draggingoffset={"x":mouseX-dragging.x,"y":mouseY-dragging.y};
  MenuClear();
}
function MouseMove(e){
  var rc = graph.canvas.getBoundingClientRect();
  mouseX = Math.floor(e.clientX - rc.left);
  mouseY = Math.floor(e.clientY - rc.top);
  var target=graph.HitTest(mouseX,mouseY);
  if(target&&target.type=="conn"){
    if(graph.conntarget!=target){
      graph.conntarget=target;
      if(!dragging)
        graph.Redraw();
    }
  }
  else{
    if(graph.conntarget){
      graph.conntarget=null;
      if(!dragging)
        graph.Redraw();
    }
  }
  if(dragging){
    if(dragging.type=="node"||dragging.type=="knob"){
      dragging.Move(mouseX-draggingoffset.x,mouseY-draggingoffset.y);
      graph.Redraw();
      return;
    }
    if(dragging!=target){
      graph.Redraw();
      var p=dragging.GetPos();
      graph.ctx.beginPath();
      graph.ctx.moveTo(p.x+10,p.y+10);
      switch(dragging.parent.type){
      case "knobparam":
        graph.ctx.strokeStyle="#ccf";
        graph.ctx.bezierCurveTo(p.x+10,p.y+10-50,mouseX+50,mouseY,mouseX,mouseY);
        break;
      case "io":
        graph.ctx.strokeStyle="#0f0";
        if(dragging.parent.subtype=="in")
          graph.ctx.bezierCurveTo(p.x+10-50,p.y+10,mouseX+50,mouseY,mouseX,mouseY);
        else
          graph.ctx.bezierCurveTo(p.x+10+50,p.y+10,mouseX-50,mouseY,mouseX,mouseY);
        break;
      case "param":
        if(dragging.subtype=="sig"){
          graph.ctx.strokeStyle="#0f0";
          graph.ctx.bezierCurveTo(p.x+10-50,p.y+10,mouseX+50,mouseY,mouseX,mouseY);
        }
        else{
          graph.ctx.strokeStyle="#ccf";
          graph.ctx.bezierCurveTo(p.x+10+50,p.y+10,mouseX,mouseY-50,mouseX,mouseY);
        }
        break;
      }
      graph.ctx.stroke();
    }
  }
}
function MouseUp(e){
  var rc=graph.canvas.getBoundingClientRect();
  mouseX=Math.floor(e.clientX-rc.left);
  mouseY=Math.floor(e.clientY-rc.top);
  var target=graph.HitTest(mouseX,mouseY);
  if(dragging){
    if(dragging==target){
      switch(dragging.type){
      case "btn":
        switch(dragging.name){
        case "node":
          MenuClear();
          var b=document.getElementById("popup");
          b.style.display="block";
          var pos=target.GetPos();
          b.style.top=(pos.y+10)+"px";
          b.style.left=(pos.x+10)+"px";
          graph.focus=target.parent;
          break;
        case "play":
          if(target.parent.subtype=="elemsrc"){
            if(target.press){
              target.press=false;
              target.parent.elem.pause();
              target.parent.elem.currentTime=0;
            }
            else{
              target.press=true;
              target.parent.elem.play();
            }
            break;
          }
          if(target.press){
            target.press=false;
            if(target.parent.node.stop)
              target.parent.node.stop(0);
          }
          else{
            target.parent.RestartNode();
            target.parent.parent.ReConnect();
            target.press=true;
            if(target.parent.node.start)
              target.parent.node.start(0);
          }
          break;
        case "mode":
          target.press=!target.press;
          break;
        }
        break;
      case "param":
        target.Edit();
        break;
      case "knobparam":
        target.Edit();
        break;
      case "conn":
        switch(target.parent.type){
        case "knobparam":
          if(target.parent.parent.connect.length>0)
            DisconnectMenu(target.parent);
          break;
        case "io":
          if(target.parent.subtype=="out"&&target.parent.parent.connect.length>0)
            DisconnectMenu(target);
          if(target.parent.subtype=="in"&&graph.Connected(target.parent))
            DisconnectMenu(target);
          break;
        case "param":
          if(graph.Connected(target.parent))
            DisconnectMenu(target);
          break;
        }
        break;
      }
    }
    else if(target){
      if(dragging.parent.type=="io"){
        if(dragging.parent.subtype=="out"&&target.parent&&target.parent.type=="io"&&target.parent.subtype=="in")
          dragging.parent.parent.Connect(target.parent.parent,dragging.parent.n,target.parent.n);
        if(dragging.parent.subtype=="out"&&target.parent&&target.parent.type=="param"&&target.parent.subtype=="a")
          dragging.parent.parent.Connect(target.parent,dragging.parent.n);
        if(dragging.parent.subtype=="in"&&target.parent&&target.parent.type=="io"&&target.parent.subtype=="out")
          target.parent.parent.Connect(dragging.parent.parent,target.parent.n,dragging.parent.n);
      }
      if(dragging.parent.type=="param"){
        if(dragging.parent.subtype=="a"&&target.parent.type=="io"&&target.parent.subtype=="out")
          target.parent.parent.Connect(dragging.parent,dragging.parent.n);
        if(target.parent.parent.type=="knob")
          target.parent.parent.Connect(dragging.parent);
      }
      if(dragging.parent.type=="knobparam"){
        if(target.parent.type=="param")
          dragging.parent.parent.Connect(target.parent);
      }
    }
  }
//  if(dragging==null)
//    MenuClear();
  dragging=null;
  graph.Redraw();
}
function DisconnectMenu(target){
  var p=target.GetPos();
  var m=document.getElementById("popup2");
  m.style.left=(p.x+10)+"px";
  m.style.top=(p.y+10)+"px";
  m.style.display="block";
  graph.focus=target;
}
function Resize(){
  graph.canvas.width=window.innerWidth;
  graph.Redraw();
}
function MenuClear(){
  document.getElementById("menugraph").style.display="none";
  document.getElementById("menunode").style.display="none";
  document.getElementById("menuknob").style.display="none";
  document.getElementById("popup").style.display="none";
  document.getElementById("popup2").style.display="none";
  document.getElementById("input").style.display="none";
  document.getElementById("select").style.display="none";
  document.getElementById("text").style.display="none";
  document.getElementById("urlinput").style.display="none";
  graph.inputfocus=null;
}
function MenuClick(e){
  switch(e.target.id){
  case "playpgn":
  case "playbtn":
    MenuClear();
    graph.Play();
    return;
  case "menugraphbtn":
    var grp=document.getElementById("menugraph");
    var c=grp.style.display;
    MenuClear();
    grp.style.display=(c=="block")?"none":"block";
    return;
  case "menunodebtn":
    var node=document.getElementById("menunode");
    var c=node.style.display;
    MenuClear();
    node.style.display=(c=="block")?"none":"block";
    return;
  case "menuknobbtn":
    var knob=document.getElementById("menuknob");
    var c=knob.style.display;
    MenuClear();
    knob.style.display=(c=="block")?"none":"block";
    return;
  case "menuaboutbtn":
    graph.About();
    return;
  case "newgraph":
    graph.New();
    break;
  case "export":
    graph.Export();
    break;
  case "link":
    graph.Link();
    break;
  case "addknob":
    graph.AddKnob(500,300,0,100,1,0);
    break;
  case "addosc":
  case "addbufsrc":
  case "addstrmsrc":
  case "addelemsrc":
  case "addgain":
  case "addfilt":
  case "adddelay":
  case "addpanner":
  case "addcomp":
  case "addshaper":
  case "addconv":
  case "addscrproc":
  case "addanalys":
  case "addsplit":
  case "addmerge":
    graph.AddNode(e.target.id.substring(3),null,500,350);
    break;
  case "delnode":
    graph.DelNode(graph.focus);
    break;
  case "disnode":
    graph.DisconnectNode(graph.focus);
    break;
  case "diswire":
    graph.DisconnectWire(graph.focus);
    break;
  }
  MenuClear();
}
function Init(){
  document.onkeydown=KeyDown;
  document.onkeypress=KeyPress;
  window.onresize=Resize;
  AudioContext=window.AudioContext||window.webkitAudioContext;
  audioctx=new AudioContext();
  graph=new Graph(document.getElementById("cv"),audioctx,audioctx.destination);
  Resize();
  var vars=document.location.search.substring(1).split("&");
  patch=null;
  for(var i=0;i<vars.length;++i){
    var l=vars[i].split("=");
    if(l[0]=="p"){
      patch=l[1];
    }
  }
  intid=setInterval(StartIfReady,100);
}
function StartIfReady(){
  if(graph.buffers._ready){
    clearInterval(intid);
    Start();
  }
}
function Start(){
  if(patch){
    patch=eval(decodeURI(patch));
    graph.Load(patch);
  }
  else
    graph.Load(defaultpatch);
}
