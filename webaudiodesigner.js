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
  var obj=eval(json);
  var js="<script>\n//WebAudioDesigner Data:"+json+"\n\n";
  var bufs=[];
  var strm=false;
  for(var i=0;i<obj.length;++i){
    var o=obj[i];
    if(o.type=="strmsrc")
      strm=true;
    if(o.type=="bufsrc"||o.type=="conv"){
      for(var j=0;j<o.params.length;++j){
        var p=o.params[j];
        if(p.name=="buffer"){
          bufs.push(p.value);
        }
      }
    }
  }
  if(bufs.length){
    js+="// (BufferSource) or (Convolver) is used. You should place \n"+
    "// audio files to appropreate location on the server.\n"+
    "// sampleurl object has the 'filename':'path to file' pair.\n\n";
    js+="var sampleurl={\n";
    for(var i=0;i<bufs.length;++i)
      js+="  '"+bufs[i]+"':'samples/"+bufs[i]+"',\n";
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
  if(strm){
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
  "    this.destination=this.audioctx.destination;\n"+
  "  this.SetupStream();\n";
  if(bufs.length)
    js+="  this.buffers = LoadBuffers(this.audioctx,sampleurl);\n";
  for(var i=1;i<obj.length;++i){
    var o=obj[i];
    switch(o.type){
    case "strmsrc":
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
  js+="</script>\n<button onclick='audioengine.start()'>Start</button>\n";
  var jspane=document.getElementById("jspane");
  var jsfile=document.getElementById("jsfile");
  var jsclose=document.getElementById("jsclose");
  var jsdownload=document.getElementById("jsdownload");
  jsfile.value=js;
  jspane.style.display="block";
  jsclose.onclick=function(){document.getElementById("jspane").style.display="none";};
  var url=window.URL||window.webkitURL;
  var b=new Blob([document.getElementById("jsfile").value]);
  var bURL=url.createObjectURL(b);
  var link=document.getElementById("jsdownload");
  link.setAttribute("href",bURL);
  link.setAttribute("download","WebAudiodesigner.html")
}
function Button(name,parent,x,y,w,h){
  this.name=name;
  this.parent=parent;
  this.x=x,this.y=y,this.w=w,this.h=h;
  this.type="btn";
  this.press=false;
  this.Redraw=function(ctx,bx,by){
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
  this.HitTest=function(x,y){
    if(x>=this.x&&x<this.x+this.w&&y>=this.y&&y<this.y+this.h)
      return this;
    return null;
  };
}
function Io(name,parent,x,y,n){
  this.name=name;
  this.parent=parent;
  this.x=x,this.y=y,this.w=50,this.h=20;
  this.n=n;
  this.type="io";
  this.subtype=(name=="in")?"in":"out";
  this.Redraw=function(ctx,bx,by){
    ctx.beginPath();
    if(this.subtype=="in")
      ctx.arc(bx+this.x,by+this.y+10,5,0,6);
    else
      ctx.arc(bx+this.x+50,by+this.y+10,5,0,6);
    ctx.fillStyle="#8d9";
    ctx.fill();
    ctx.fillStyle="#000";
    ctx.fillRect(bx+this.x,by+this.y,this.w,this.h+1);
    ctx.fillStyle="#abf";
    ctx.fillRect(bx+this.x+1,by+this.y+1,this.w-2,this.h-1);
    ctx.fillStyle="#000";
    ctx.fillText(this.name,bx+this.x+4,by+this.y+13);
  };
  this.Edit=function(){
    var name=(this.type=="param")?this.parent.name+"."+this.name:this.parent.name;
    for(var i=0;i<graph.nodes.length;++i){
      var n=graph.nodes[i];
      for(var j=0;j<n.connect.length;++j){
        var c=n.connect[j];
      }
    }
  }
}
function Param(x,y,w,h,tx,ty,subtype,option,name,parent){
  this.x=x,this.y=y,this.w=w,this.h=h,this.tx=tx,this.ty=ty;
  this.name=name;
  this.parent=parent;
  this.subtype=subtype;
  this.option=option;
  switch(subtype){
  case "a":
    this.value=parent.node[name].value.toFixed(3);
    for(var i=this.value.length-1;i>0;--i){
      if(this.value[i]!="0")
        break;
    }
    if(this.value[i]==".")
      --i;
    this.value=this.value.substring(0,i+1);
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
  case "ob":
    this.value=option[0];
    this.parent.node[name]=this.parent.graph.buffers[this.value].data;
    break;
  }
  this.bx=this.by=0;
  this.type="param";
  this.Set=function(value){
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
    case "ob":
      this.value=value;
      this.parent.node[this.name]=this.parent.graph.buffers[this.value].data;
      break;
    }
    graph.Redraw();
  };
  this.Redraw=function(ctx,bx,by){
    ctx.fillStyle="#000";
    if(this.subtype=="a"){
      ctx.fillStyle="#8d9";
      ctx.beginPath();
      ctx.arc(bx+this.x,by+this.y+10,5,0,6);
      ctx.fill();
    }
    ctx.fillStyle="#000";
    ctx.fillRect(bx+this.x,by+this.y,this.w,this.h);
    var g=ctx.createLinearGradient(0,by+this.y,0,by+this.y+this.h);
    g.addColorStop(0,"#eef");
    g.addColorStop(1,"#bbc");
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
        break;
      case "tc":
      case "ts":
        graph.text.style.left=(this.parent.x+this.x)+"px";
        graph.text.style.top=(this.parent.y+this.y)+"px";
        graph.text.style.width=this.tx+"px";
        graph.text.style.height=this.ty+"px";
        graph.text.style.display="block";
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
        break;
      }
    }
  };
  this.Edit=function(){
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
    }
  };
}
function Node(graph,name,subtype,x,y){
  this.graph=graph;
  var actx=graph.actx;
  this.name=name,this.x=x,this.y=y,this.w=101;
  this.connect=[];
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
      new Param(0,40,this.w,20,90,0,"a",null,"playbackRate",this),
      new Param(0,60,this.w,20,90,0,"b",null,"loop",this),
      new Param(0,80,this.w,20,90,0,"n",null,"loopStart",this),
      new Param(0,100,this.w,20,90,0,"n",null,"loopEnd",this),
      new Param(0,120,this.w,20,60,0,"ob",["loop.wav","rhythm.wav","voice.mp3","snare.wav"],"buffer",this),
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
      new Param(0,40,this.w,20,70,0,"s",["sine","square","sawtooth","triangle"],"type",this),
      new Param(0,60,this.w,20,70,0,"a",null,"frequency",this),
      new Param(0,80,this.w,20,70,0,"a",null,"detune",this)];
    this.buttons={"play":new Button("play",this,20,24,20,14),"node":new Button("node",this,3,3,14,14)};
    break;
  case "gain":
    this.h=3*20+1;
    this.ioh=20;
    this.w=110;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createGain();
    this.params=[new Param(0,40,this.w,20,60,0,"a",null,"gain",this)];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "filt":
    this.h=7*20+1;
    this.ioh=20;
    this.w=120;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createBiquadFilter();
    this.params=[
      new Param(0,40,this.w,20,60,0,"s",["lowpass","highpass","bandpass","lowshelf","highshelf","peaking","notch","allpass"],"type",this),
      new Param(0,60,this.w,20,80,0,"a",null,"frequency",this),
      new Param(0,80,this.w,20,80,0,"a",null,"detune",this),
      new Param(0,100,this.w,20,80,0,"a",null,"Q",this),
      new Param(0,120,this.w,20,80,0,"a",null,"gain",this)
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
      new Param(0,40,this.w,20,70,0,"a",null,"threshold",this),
      new Param(0,60,this.w,20,70,0,"a",null,"knee",this),
      new Param(0,80,this.w,20,70,0,"a",null,"ratio",this),
      new Param(0,100,this.w,20,70,0,"a",null,"attack",this),
      new Param(0,120,this.w,20,70,0,"a",null,"release",this),
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "delay":
    this.h=3*20+1;
    this.ioh=20;
    this.w=120;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createDelay();
    this.params=[new Param(0,40,this.w,20,70,0,"a",null,"delayTime",this)];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  case "panner":
    this.h=10*20+1;
    this.ioh=20;
    this.w=175;
    this.io=[new Io("in",this,0,20,0),new Io("out",this,this.w-50,20,0)];
    this.node=actx.createPanner();
    this.params=[
      new Param(0,40,this.w,20,95,0,"s",["equalpower","HRTF"],"panningModel",this),
      new Param(0,60,this.w,20,95,0,"s",["linear","inverse","exponential"],"distanceModel",this),
      new Param(0,80,this.w,20,110,0,"n",null,"refDistance",this),
      new Param(0,100,this.w,20,110,0,"n",null,"maxDistance",this),
      new Param(0,120,this.w,20,110,0,"n",null,"rolloffFactor",this),
      new Param(0,140,this.w,20,110,0,"n",null,"coneInnerAngle",this),
      new Param(0,160,this.w,20,110,0,"n",null,"coneOuterAngle",this),
      new Param(0,180,this.w,20,110,0,"n",null,"coneOuterGain",this)
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
      new Param(0,40,this.w,20,150,0,"n",null,"fftSize",this),
      new Param(0,60,this.w,20,150,0,"n",null,"minDecibels",this),
      new Param(0,80,this.w,20,150,0,"n",null,"maxDecibels",this),
      new Param(0,100,this.w,20,150,0,"n",null,"smoothingTimeConstant",this)
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
      for(i=0;i<graph.nodes.length;++i)
        if(graph.nodes[i]==this)
          break;
      for(++i;i<graph.nodes.length;++i){
        graph.nodes[i].Redraw(this.graph.ctx);
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
      new Param(0,40,this.w,20,80,0,"s",["none","2x","4x"],"oversample",this),
      new Param(0,60,this.w,80,170,120,"tc","new Float32Array([\n-0.5,-0.5,0,0.5,0.5\n])","curve",this),
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
      new Param(0,40,this.w,20,70,0,"b",null,"normalize",this),
      new Param(0,60,this.w,40,4,20,"ob",["Five Columns Long.wav","French 18th Century Salon.wav","Narrow Bumpy Space.wav"],"buffer",this),
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
      new Param(0,40,this.w,40,280,180,"ts",
        "function(ev){\n"+
        "  var out0=ev.outputBuffer.getChannelData(0);\n"+
        "  var out1=ev.outputBuffer.getChannelData(1);\n"+
        "  var in0=ev.inputBuffer.getChannelData(0);\n"+
        "  var in1=ev.inputBuffer.getChannelData(1);\n"+
        "  for(var i=0;i<ev.target.bufferSize;++i){\n"+
        "    out0[i]=in0[i];\n"+
        "    out1[i]=in1[i];\n"+
        "  }\n"+
        "}","onaudioprocess",this),
    ];
    this.buttons={"node":new Button("node",this,3,3,14,14)};
    break;
  }
  this.RestartNode=function(){
    switch(this.subtype){
    case "osc":
      this.node.disconnect();
      this.node=this.graph.actx.createOscillator();
      this.node.type=this.params[0].value;
      this.node.frequency.value=this.params[1].value;
      this.node.detune.value=this.params[2].value;
      break;
    case "bufsrc":
      this.node.disconnect();
      this.node=this.graph.actx.createBufferSource();
      this.node.playbackRate.value=this.params[0].value;
      this.node.loop=this.params[1].value;
      this.node.loopStart=this.params[2].value;
      this.node.loopEnd=this.params[3].value;
      this.node.onended=function(){this.buttons.play.press=false;graph.Redraw()}.bind(this);
      this.node.buffer=this.graph.buffers[this.params[4].value].data;
      break;
    }
  };
  this.Redraw=function(ctx){
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
      ctx.fillText(this.subtype.toUpperCase()+" : "+this.name,this.x+20,this.y+13);
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
  this.HitTest=function(x,y){
    for(var i=0;i<this.io.length;++i){
      if(y>=this.y+this.io[i].y&&y<this.y+this.io[i].y+20
        &&x>=this.x-5+this.io[i].x&&x<this.x+5+this.io[i].x+this.io[i].w)
        return this.io[i];
    }
    for(var i=0;i<this.params.length;++i){
      var p=this.params[i];
      if(y>=this.y+p.y&&y<this.y+p.y+p.h)
        return p;
    }
//    if(x<this.x+20&&y<this.y+20){
//      return this.btn;
//    }
    for(var i in this.buttons){
      if(this.buttons[i].HitTest(x-this.x,y-this.y)){
        return this.buttons[i];
      }
    }
//    if((this.subtype=="osc"||this.subtype=="bufsrc") &&x>=this.x+20&&x<this.x+40&&y>=this.y+20&&y<this.y+40){
//      return this.playbtn;
//    }
//    if(this.subtype=="analys"&&y>=this.y+120){
//      return this.modebtn;
//    }
    return this;
  };
  this.Move=function(x,y){
    this.x=x,this.y=y;
  };
  this.Connect=function(target,o,i){
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
}
function Graph(canvas,actx,dest){
  this.canvas=canvas;
  canvas.onmousedown=MouseDown;
  canvas.onmousemove=MouseMove;
  canvas.onmouseup=MouseUp;
  canvas.oncontextmenu=function(e){e.preventDefault();};
  canvas.ondblclick=DblClick;
  this.ctx=canvas.getContext("2d");
  this.input=document.getElementById("input");
  this.select=document.getElementById("select");
  this.text=document.getElementById("text");
  this.actx=actx;
  this.dest=dest;
  this.nodes=[new Node(this,"destination","destination",800,100)];
  this.playing=false;
  this.strm=null;
  this.buffers=LoadBuffers(
    actx,
    {
      "loop.wav":"samples/loop.wav",
      "voice.mp3":"samples/voice.mp3",
      "rhythm.wav":"samples/rhythm.wav",
      "snare.wav":"samples/snare.wav",
      "Five Columns Long.wav":"samples/ir/IMreverbs1/Five Columns Long.wav",
      "French 18th Century Salon.wav":"samples/ir/IMreverbs1/French 18th Century Salon.wav",
      "Narrow Bumpy Space.wav":"samples/ir/IMreverbs1/Narrow Bumpy Space.wav",
    }
  );
  this.GetJson=function(){
    var o=[];
    for(var i=0;i<this.nodes.length;++i){
      var n=this.nodes[i];
      var paramtab=[];
      var contab=[];
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
    return o;
  };
  this.Play=function(){
    this.playing=false;
    for(var i=0;i<this.nodes.length;++i){
      var n=this.nodes[i];
      if(n.buttons.play && n.buttons.play.press){
        this.playing=true;
        break;
      }
    }
    if(this.playing){
      for(var i=0;i<this.nodes.length;++i){
        var n=this.nodes[i];
        if(n.buttons.play){
          if(n.buttons.play.press){
            if(n.node.stop)
              n.node.stop(0);
            n.buttons.play.press=false;
          }
        }
      }
    }
    else{
      var t=audioctx.currentTime+0.05;
      for(var i=0;i<this.nodes.length;++i){
        var n=this.nodes[i];
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
    this.nodes[0].x=obj[0].x;
    this.nodes[0].y=obj[0].y;
    for(var i=1;i<obj.length;++i){
      var o=obj[i];
      o.n=graph.AddNode(o.type,o.name,o.x,o.y);
      for(var j=0;j<o.params.length;++j){
        var p=o.params[j];
        for(var k=0;k<o.n.params.length;++k){
          if(o.n.params[k].name==o.params[j].name)
            o.n.params[k].Set(o.params[j].value);
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
    while(this.nodes.length>1){
      this.DelNode(this.nodes[1]);
    }
    this.Redraw();
  };
  this.Find=function(name){
    var s=name.split(".");
    for(var i=0;i<this.nodes.length;++i){
      var n=this.nodes[i];
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
    for(var i=this.nodes.length-1;i>=1;--i){
      var n=this.nodes[i];
      n.node.disconnect();
      if(n.subtype=="split")
        n.node.disconnect(1);
    }
    for(var i=0;i<this.nodes.length;++i){
      var n=this.nodes[i];
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
  };
  this.AddNode=function(type,name,x,y){
    if(name==null)
      name=this.GetNextName(type);
    var node=new Node(this,name,type,x,y);
    if(node.type)
      this.nodes.push(node);
    this.Redraw();
    return node;
  };
  this.DelNode=function(node){
    for(var i=this.nodes.length-1;i>=0;--i){
      var n=this.nodes[i];
      for(var j=n.connect.length-1;j>=0;--j){
        if(n.connect[j].t==node||n.connect[j].t.parent==node){
          n.connect.splice(j,1);
        }
      }
      if(n==node){
        node.node.disconnect();
        if(node.subtype=="split")
          node.node.disconnect(1);
        if(node.buttons.play&&node.buttons.play.press)
          node.node.stop(0);
        if(node.subtype=="analys")
          clearInterval(node.timerid);
        this.nodes.splice(i,1);
      }
    }
    this.Redraw();
  };
  this.DisconnectNode=function(node){
    node.connect.length=0;
    node.node.disconnect();
    if(node.subtype=="split")
      node.node.disconnect(1);
    this.Redraw();
  };
  this.DisconnectWire=function(target){
    if(target.subtype=="out"){
      var n=target.parent;
      for(var j=n.connect.length-1;j>=0;--j){
        var c=n.connect[j];
        if(c.o==target.n)
          n.connect.splice(j,1);
      }
      n.node.disconnect(target.parent.node,target.n);
    }
    else{
      for(var i=this.nodes.length-1;i>=0;--i){
        var n=this.nodes[i];
        for(var j=n.connect.length-1;j>=0;--j){
          var c=n.connect[j];
          n.node.disconnect(c.o);
          if(target.type=="param"){
            if(c.t==target)
              n.connect.splice(j,1);
          }
          else if(target.subtype=="in"){
            if(c.t==target.parent&&c.i==target.n)
              n.connect.splice(j,1);
          }
        }
      }
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
      for(var i=this.nodes.length-1;i>=0;--i){
        var n=this.nodes[i];
        for(var j=n.connect.length-1;j>=0;--j){
          var c=n.connect[j];
          if(c.t==target.parent&&c.i==target.n)
            return true;
        }
      }
    }
    else if(target.type=="param"){
      for(var i=this.nodes.length-1;i>=0;--i){
        var n=this.nodes[i];
        for(var j=n.connect.length-1;j>=0;--j){
          var c=n.connect[j];
        if(c.t==target)
          return true;
        }
      }
    }
    return false;
  }
  this.Redraw=function(){
    this.ctx.font="bold 10px Verdana,sans-serif";
    this.ctx.fillStyle="#346";
    this.ctx.fillRect(0,0,canvas.width,canvas.height);
    this.ctx.strokeStyle="#0e8";
    this.ctx.beginPath();
    for(var i=0;i<this.nodes.length;++i){
      var n=this.nodes[i];
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
    this.ctx.stroke();
    for(var i=0;i<this.nodes.length;++i){
      this.nodes[i].Redraw(this.ctx);
    }
  };
  this.HitTest=function(x,y){
    for(var i=this.nodes.length-1;i>=0;--i){
      var n=this.nodes[i];
      if(x>=n.x-5&&x<n.x+n.w+5&&y>=n.y&&y<n.y+n.h){
        return n.HitTest(x,y);
      }
    }
  };
  this.GetNextName=function(type){
    var n=1;
    for(;;){
      var nam=type+n;
      for(var i=0;i<this.nodes.length;++i){
        if(nam==this.nodes[i].name){
          break;
        }
      }
      if(i==this.nodes.length)
        return nam;
      ++n;
    }
  };
}
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
  var rc=e.target.getBoundingClientRect();
  mouseX=Math.floor(e.clientX-rc.left);
  mouseY=Math.floor(e.clientY-rc.top);
  var item=graph.HitTest(mouseX,mouseY);
  if(item&&item.type=="btn"){
    switch(item.name){
    case "node":
      var b=document.getElementById("popup");
      b.style.display="block";
      b.style.top=(item.parent.y+10)+"px";
      b.style.left=(item.parent.x+10)+"px";
      graph.focus=item.parent;
      break;
    case "play":
      if(item.press){
        item.press=false;
        if(item.parent.node.stop)
          item.parent.node.stop(0);
      }
      else{
        if(item.press==false){
          item.parent.RestartNode();
          item.parent.graph.ReConnect();
        }
        item.press=true;
        if(item.parent.node.start)
          item.parent.node.start(0);
      }
      break;
    case "mode":
      item.press=!item.press;
      break;
    }
    return;
  }
//  if(item&&item.type=="mode"){
//    item.parent.ToggleMode();
//    return;
//  }
//  if(item&&item.type=="btn"&&item.parent.subtype!="destination"){
//    var b=document.getElementById("popup");
//    b.style.display="block";
//    b.style.top=(item.parent.y+10)+"px";
//    b.style.left=(item.parent.x+10)+"px";
//    graph.focus=item.parent;
//    return;
//  }
  dragging=item;
  if(dragging){
    draggingoffset={"x":mouseX-dragging.x,"y":mouseY-dragging.y};
  }
  MenuClear();
}
function MouseMove(e){
  var rc = e.target.getBoundingClientRect();
  mouseX = Math.floor(e.clientX - rc.left);
  mouseY = Math.floor(e.clientY - rc.top);
  var target=graph.HitTest(mouseX,mouseY);
  if(dragging){
    if(dragging.type=="node"){
      dragging.Move(mouseX-draggingoffset.x,mouseY-draggingoffset.y);
      graph.Redraw();
    }
    if(dragging!=target&&((dragging.type=="param"&&dragging.subtype=="a")||dragging.type=="io")){
      graph.Redraw();
      graph.ctx.beginPath();
      graph.ctx.strokeStyle="#840";
      if(dragging.subtype=="out"){
        var px=dragging.parent.x+dragging.x+50;
        var py=dragging.parent.y+dragging.y+10;
        graph.ctx.moveTo(px,py);
        graph.ctx.bezierCurveTo(px+50,py,mouseX-50,mouseY,mouseX,mouseY);
      }
      else{
        var px=dragging.parent.x+dragging.x;
        var py=dragging.parent.y+dragging.y+10;
        graph.ctx.moveTo(px,py);
        graph.ctx.bezierCurveTo(px-50,py,mouseX+50,mouseY,mouseX,mouseY);
      }
      graph.ctx.strokeStyle="#fe8";
      graph.ctx.stroke();
    }
  }
}
function DisconnectMenu(target){
  var m=document.getElementById("popup2");
  m.style.left=(target.parent.x+target.x-3)+"px";
  m.style.top=(target.parent.y+target.y+16)+"px";
  m.style.display="block";
  graph.focus=target;
}
function MouseUp(e){
  var rc=e.target.getBoundingClientRect();
  mouseX=Math.floor(e.clientX-rc.left);
  mouseY=Math.floor(e.clientY-rc.top);
  var target=graph.HitTest(mouseX,mouseY);
  if(dragging&&(dragging.type=="param"||dragging.type=="io")&&target==dragging){
    if(target.type=="param" && mouseX>=dragging.parent.x+5)
      target.Edit();
    else{
      if(graph.Connected(target))
        DisconnectMenu(target);
    }
  }
  if(dragging&&target){
    if(dragging.type=="io"&&dragging.subtype=="out"){
      if(target.type=="io"&&target.subtype=="in")
        dragging.parent.Connect(target.parent,dragging.n,target.n);
      if(target.type=="param"&&target.subtype=="a")
        dragging.parent.Connect(target,dragging.n);
    }
    else if(dragging.type=="io"&&dragging.subtype=="in"){
      if(target.type=="io"&&target.subtype=="out")
        target.parent.Connect(dragging.parent,target.n,dragging.n);
    }
    else if(dragging.type=="param"){
      if(target.type=="io"&&target.subtype=="out"){
        target.parent.Connect(dragging,target.n);
      }
    }
  }
  dragging=null;
  graph.Redraw();
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
    var e=document.createElement("div");
    e.setAttribute("class","knobpane");
    e.innerHTML="<webaudio-knob diameter='32'></webaudio-knob>";
    document.getElementById("base").appendChild(e);
    break;
  case "addosc":
  case "addbufsrc":
  case "addstrmsrc":
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
  menu=document.getElementById("menu");
  menu.onclick=MenuClick;
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
