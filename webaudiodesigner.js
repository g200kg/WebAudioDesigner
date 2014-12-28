
var defaultpatch=[{"type":"destination","name":"destination","x":568,"y":86,"params":[],"connect":[]},{"type":"osc","name":"osc2","x":384,"y":164,"params":[{"name":"type","type":"s","value":"sine"},{"name":"frequency","type":"a","value":"440"},{"name":"detune","type":"a","value":"0"}],"connect":[{"t":"destination","o":0,"i":0}]},{"type":"gain","name":"gain1","x":200,"y":300,"params":[{"name":"gain","type":"a","value":"1000"}],"connect":[{"t":"osc2.detune","o":0}]},{"type":"osc","name":"osc1","x":49,"y":150,"params":[{"name":"type","type":"s","value":"sine"},{"name":"frequency","type":"a","value":"2"},{"name":"detune","type":"a","value":"0"}],"connect":[{"t":"gain1","o":0,"i":0}]}];

function HitTest(x,y){
	if(this.child){
		for(var i=this.child.length-1;i>=0;--i){
			var h=this.child[i].HitTest(x,y);
			if(h)
				return h;
		}
	}
	var pos=this.GetPos();
	if(x>=pos.x&&x<pos.x+this.w&&y>=pos.y&&y<pos.y+this.h){
		return this;
	}
	return null;
}
function GetPos(){
	var pos={x:this.x,y:this.y};
	for(var p=this.parent;p;p=p.parent){
		pos.x+=p.x;
		pos.y+=p.y;
	}
	return pos;
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
function ExportJs(wadobj){
	function SetupParams(node,indent){
		var js="";
		function ptype(ntype,name){
			switch(ntype){
			case "gai":
				switch(name){
				case "gain": return "a";
				}
				break;
			case "del":
				switch(name){
				case "delayTime": return "a";
				}
				break;
			case "buf":
				switch(name){
				case "buffer": return "ob";
				case "playbackRate": return "a";
				case "loop": return "b";
				case "loopStart": return "n";
				case "loopEnd": return "n";
				}
				break;
			case "scr":
				switch(name){
				case "onaudioprocess": return "ts";
				}
				break;
			case "pan":
				switch(name){
				case "panningModel": return "s";
				case "distanceModel": return "s";
				case "refDistance": return "n";
				case "maxDistance": return "n";
				case "rolloffFactor": return "n";
				case "coneInnerAngle": return "n";
				case "coneOuterAngle": return "n";
				case "coneOuterGain": return "n";
				}
				break;
			case "con":
				switch(name){
				case "buffer": return "ob";
				case "normalize": return "b";
				}
				break;
			case "ana":
				switch(name){
				case "fftSize": return "n";
				case "minDecibels": return "n";
				case "maxDecibels": return "n";
				case "smoothingTimeConstant": return "n";
				}
				break;
			case "com":
				switch(name){
				case "threshold": return "a";
				case "knee": return "a";
				case "ratio": return "a";
				case "attack": return "a";
				case "release": return "a";
				}
				break;
			case "fil":
				switch(name){
				case "type": return "s";
				case "frequency": return "a";
				case "detune": return "a";
				case "Q": return "a";
				case "gain": return "a";
				}
				break;
			case "sha":
				switch(name){
				case "curve": return "tc";
				case "oversample": return "b";
				}
				break;
			case "osc":
				switch(name){
				case "type": return "sw";
				case "frequency": return "a";
				case "detune": return "a";
				case "periodic": return "tp";
				}
				break;
			}
			return null;
		}
		if(node.type=="buf"){
//			if(!node.buffer)
//				node.params.buffer="loop.wav";
		}
		if(node.type=="con"){
//			if(!node.buffer)
//				node.params.buffer="Five Columns Long.wav";
		}
		for(var j in node.params){
			var p=node.params[j];
			var sp="      ".substr(0,indent);
			var pt=ptype(node.type,j);
			switch(pt){
			case "sw":
				if(p=="custom"){
				}
				else
					js+=sp+"this."+node.name+"."+j+" = \""+p+"\";\n";
				break;
			case "s":
				js+=sp+"this."+node.name+"."+j+" = \""+p+"\";\n";
				break;
			case "n":
			case "b":
				js+=sp+"this."+node.name+"."+j+" = "+p+";\n";
				break;
			case "a":
				js+=sp+"this."+node.name+"."+j+".value = "+p+";\n";
				break;
			case "tc":
				js+=sp+"this."+node.name+"."+j+" = new Float32Array("+p+");\n";
				break;
			case "ts":
				js+=sp+"this."+node.name+"."+j+" = \n"+p+";\n";
				break;
			case "tp":
				js+=sp+"var p={"+p.replace(/\n/g," ")+"};\n";
				js+=sp+"this."+node.name+".setPeriodicWave(this.audioctx.createPeriodicWave(new Float32Array(p.real),new Float32Array(p.imag)));\n";
				break;
			case "ob":
				js+=sp+"this."+node.name+"."+j+" = this.buffers['"+p+"'].data;\n";
				break;
			}
		}
		return js;
	}
	function Connect(node,indent,mode){
		var c=node.connect;
		if(c){
			for(j=0;j<c.length;++j){
				var n=c[j].t;
				var co=c[j].o;
				var ci=c[j].i;
				if(!n) {
					n=c[j];
					ci=co=0;
				}
				var m=(n.substr(0,3)=="osc"||n.substr(0,6)=="bufsrc");
				if(mode==m){
					if(c[j].i){
						if(c[j].o)
							js+="      ".substr(0,indent)+"this."+node.name+".connect(this."+n+","+co+","+ci+");\n";
						else
							js+="      ".substr(0,indent)+"this."+node.name+".connect(this."+n+",0,"+ci+");\n";
					}
					else{
						if(c[j].o)
							js+="      ".substr(0,indent)+"this."+node.name+".connect(this."+n+","+co+");\n";
						else
							js+="      ".substr(0,indent)+"this."+node.name+".connect(this."+n+");\n";
					}
				}
			}
		}
	}
	var files=[];
	var bufs=[];
	var usestrm=false;
	var useknob=false;
	var usekey=false;
	var usefunc=false;
	var obj=wadobj.o;
	var str=wadobj.s;
	for(var i=0;i<obj.length;++i){
		var o=obj[i];
		if(!o.type) o.type=o.t;
		if(!o.name) o.name=o.n;
		if(!o.params) o.params=o.p;
		if(!o.connect) o.connect=o.c;
		o.type=o.n.substr(0,3);
		if(o.type=="str")
			usestrm=true;
		if(o.type=="kno")
			useknob=true;
		if(o.type=="key")
			usekey=true;
		if(o.type=="fun")
			usefunc=true;
		if(o.type=="buf"){
			if(!o.params.buffer)
				bufs.push(["loop.wav","loop.wav"]);
			else
				bufs.push([o.params.buffer,o.params.buffer]);
		}
		if(o.type=="con"){
			if(!o.params.buffer)
				bufs.push(["Five Columns Long.wav","ir/IMreverbs1/Five Columns Long.wav"]);
			else
				bufs.push([o.params.buffer,"ir/IMreverbs1/"+o.params.buffer]);
		}
	}
	var js="<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n</head>\n<body>\n";
	if(useknob||usekey){
		files.push("webcomponents/webcomponents.min.js");
		files.push("webcomponents/polymer.js");
		files.push("webcomponents/polymer.html");
		files.push("webcomponents/layout.html");
		files.push("webcomponents/controls.html");
		js+="<!-- Knobs/keyboards are used. You should place webcomponents.min.js / polymer.js / polymer.html / layout.html / controls.html to webcomponents folder -->\n";
		js+="<script src=\"webcomponents/webcomponents.min.js\"></script>\n"
			+"<link rel=\"import\" href=\"webcomponents/polymer.html\">\n"
			+"<link rel=\"import\" href=\"webcomponents/controls.html\">\n"
			+"<style>\nwebaudio-knob{margin:10px;}\n</style>\n";
	}
	js+="<script src='wadengine.js'></script>\n";
	js+="<script>\nvar waddata = "+str+"\n\n";
	js+=
	"function AudioEngine(audioctx,destination){\n";
	if(bufs.length){
		js+="  // (BufferSource) or (Convolver) is used. You should place \n"
			+"  // audio files to samples folder. * Note that the IR files are not MIT licensed.\n"
			+"  // sampleurl object has the 'filename':'path to file' pairs.\n";
		js+="  this.sampleurl={\n";
		for(var i=0;i<bufs.length;++i){
			js+="    '"+bufs[i][0]+"':'samples/"+bufs[i][1]+"',\n";
			files.push("samples/"+bufs[i][1]);
		}
		js+="  };\n";
		js+=
			"  function LoadBuffers(actx,list){\n"+
			"    buf={'_count':Object.keys(list).length,'_ready':false};\n"+
			"    for(name in list){\n"+
			"      var o=buf[name]={};\n"+
			"      o.req=new XMLHttpRequest();\n"+
			"      o.req.open('GET',list[name],true);\n"+
			"      o.req.responseType='arraybuffer';\n"+
			"      o.req.buf=buf;\n"+
			"      o.req.nam=name;\n"+
			"      o.req.onload=function(){\n"+
			"        if(this.response){\n"+
			"          actx.decodeAudioData(this.response,\n"+
			"            function(b){\n"+
			"              this.buf[this.nam].data=b;\n"+
			"              if(--this.buf._count==0)\n"+
			"                this.buf._ready=true;\n"+
			"            }.bind(this),\n"+
			"            function(){}\n"+
			"          );\n"+
			"        }\n"+
			"      };\n"+
			"      o.req.onerror=function(){};\n"+
			"      try{o.req.send();} catch(e){}\n"+
			"    }\n"+
			"    return buf;\n"+
			"  }\n";
	}
	if(usekey){
		js+=
		"  function Key(id){\n"+
		"    this.c=[];\n"+
		"    this.type='key';\n"+
		"    this.elem=document.getElementById(id);\n"+
		"    this.elem.addEventListener('change',function(e){\n"+
		"      for(var i=this.c.length-1;i>=0;--i){\n"+
		"        var c=this.c[i];\n"+
		"        var x=e.note[1-c[1]];\n"+
		"        if(c[0].set)\n"+
		"          c[0].set(x,c[2]);\n"+
		"        else if(typeof(c[0].value)=='number')\n"+
		"          c[0].value=x;\n"+
		"        else\n"+
		"          c[0]=x;\n"+
		"      }\n"+
		"    }.bind(this));\n"+
		"    this.connect=function(target,o,i){\n"+
		"      o=o?1:0;\n"+
		"      i=i?1:0;\n"+
		"      this.c.push([target,o,i]);\n"+
		"    };\n"+
		"    this.start=function(){\n"+
		"    };\n"+
		"  }\n";
	}
	if(useknob){
		js+=
		"  function Knob(id){\n"+
		"    this.c=[];\n"+
		"    this.type='kno';\n"+
		"    this.elem=document.getElementById(id);\n"+
		"    this.elem.addEventListener('change',function(e){\n"+
		"      for(var i=this.c.length-1;i>=0;--i){\n"+
		"        var c=this.c[i];\n"+
		"        if(c[0].set)\n"+
		"          c[0].set(e.target.value,c[2]);\n"+
		"        else if(typeof(c[0].value)=='number')\n"+
		"          c[0].value=e.target.value;\n"+
		"        else\n"+
		"          c[0]=e.target.value;\n"+
		"      }\n"+
		"    }.bind(this));\n"+
		"    this.connect=function(target,o,i){\n"+
		"      o=o?1:0;\n"+
		"      i=i?1:0;\n"+
		"      this.c.push([target,o,i]);\n"+
		"    };\n"+
		"  }\n";
	}
	if(usefunc){
		js+=
		"  function Func(func){\n"+
		"    this.vars=[0,0];\n"+
		"    this.c=[];\n"+
		"    this.func=func;\n"+
		"    this.type='fun';\n"+
		"    this.connect=function(target,o,i){\n"+
		"      o=o?1:0;\n"+
		"      i=i?1:0;\n"+
		"      this.c.push([target,o,i]);\n"+
		"    };\n"+
		"    this.set=function(x,n){\n"+
		"      this.vars[n]=x;\n"+
		"      var y=this.func(this.vars[0],this.vars[1]);\n"+
		"      for(var i=0;i<this.c.length;++i){\n"+
		"        var c=this.c[i];\n"+
		"        if(c[0].set)\n"+
		"          c[0].set(y,c[2]);\n"+
		"        else if(typeof(c[0].value)=='number')\n"+
		"          c[0].value=y;\n"+
		"        else\n"+
		"          c[0]=y;\n"+
		"      }\n"+
		"    };\n"+
		"  }\n";
	}
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
		js+="  this.buffers = LoadBuffers(this.audioctx,this.sampleurl);\n";
	js+="  function build(){\n    if(!this.buffers||this.buffers._ready){clearInterval(this.poll);}\n    else return;\n";
	for(var i=1;i<obj.length;++i){
		var o=obj[i];
		o.type=o.n.substr(0,3);
		switch(o.type){
		case "str":
			break;
		case "ele":
			js+="    this."+o.name+" = this.audioctx.createMediaElementSource(document.getElementById(\""+o.name+"\"));\n";
			break;
		case "gai":
			js+="    this."+o.name+" = this.audioctx.createGain();\n";
			js+=SetupParams(o,4);
			break;
		case "fil":
			js+="    this."+o.name+" = this.audioctx.createBiquadFilter();\n";
			js+=SetupParams(o,4);
			break;
		case "del":
			js+="    this."+o.name+" = this.audioctx.createDelay();\n";
			js+=SetupParams(o,4);
			break;
		case "pan":
			js+="    this."+o.name+" = this.audioctx.createPanner();\n";
			js+=SetupParams(o,4);
			break;
		case "com":
			js+="    this."+o.name+" = this.audioctx.createDynamicsCompressor();\n";
			js+=SetupParams(o,4);
			break;
		case "sha":
			js+="    this."+o.name+" = this.audioctx.createWaveShaper();\n";
			js+=SetupParams(o,4);
			break;
		case "con":
			js+="    this."+o.name+" = this.audioctx.createConvolver();\n";
			js+=SetupParams(o,4);
			break;
		case "scr":
			js+="    this."+o.name+" = this.audioctx.createScriptProcessor();\n";
			js+=SetupParams(o,4);
			break;
		case "ana":
			js+="    this."+o.name+" = this.audioctx.createAnalyser();\n";
			js+=SetupParams(o,4);
			break;
		case "spl":
			js+="    this."+o.name+" = this.audioctx.createChannelSplitter();\n";
			break;
		case "mer":
			js+="    this."+o.name+" = this.audioctx.createChannelMerger();\n";
			break;
		case "fun":
			js+="    this."+o.name+" = new Func(function(x,y){return "+o.p.func+"});\n";
			break;
		case "key":
			js+="    this."+o.name+" = new Key('"+o.name+"');\n";
			break;
		case "kno":
			js+="    this."+o.name+" = new Knob('"+o.name+"');\n";
			break;
		}
	}
	for(var i=0;i<obj.length;++i){
		var o=obj[i];
		if(o.type!="osc"&&o.type!="buf"&&o.type!="str"){
			Connect(o,4,false);
		}
	}
	js+="  }\n  this.start=function(){\n";
	for(var i=0;i<obj.length;++i){
		var o=obj[i];
		if(o.type=="osc"){
			js+="    this."+o.name+" = this.audioctx.createOscillator();\n";
			js+=SetupParams(o,4);
		}
		if(o.type=="buf"){
			js+="    this."+o.name+" = this.audioctx.createBufferSource();\n";
			js+=SetupParams(o,4);
		}
	}
	for(var i=0;i<obj.length;++i){
		var o=obj[i];
		Connect(o,4,true);
		if(o.type=="osc"||o.type=="buf"||o.type=="str")
			Connect(o,6,false);
	}
	for(var i=0;i<obj.length;++i){
		var o=obj[i];
		if(o.type=="osc"||o.type=="buf")
			js+="    this."+o.name+".start(0);\n";
	}
	js+="  };\n";
	js+="  this.poll=setInterval(build.bind(this),100);\n"
	js+="}\n";
	js+="window.addEventListener('load',function(){audioengine=new AudioEngine()});\n";
	js+="</script>\n<button onclick='audioengine.start()'>Play</button><br/>\n";
//	js+="window.addEventListener('load',function(){wadengine=new WADEngine(waddata)});\n";
//	js+="</script>\n<button onclick='wadengine.start()'>Start</button><br/>\n";
	for(var i=0;i<obj.length;++i){
		var o=obj[i];
		if(o.type=="kno"){
			js+="<webaudio-knob id=\""+o.name+"\" diameter=\"32\"";
			if(typeof(o.p.min)!="undefined")
				js+=" min="+o.p.min;
			if(typeof(o.p.max)!="undefined")
				js+=" max="+o.p.max;
			if(typeof(o.p.step)!="undefined")
				js+=" step="+o.p.step;
			if(typeof(o.p.value)!="undefined")
				js+=" value="+o.p.value;
			js+="\"></webaudio-knob>\n";
		}
		if(o.type=="key"){
			js+="<webaudio-keyboard id=\""+o.name+"\" min=\"48\" max=\"72\"></webaudio-keyboard>";
		}
	}
	for(var i=0;i<obj.length;++i){
		var o=obj[i];
		if(o.type=="ele"){
			js+="<audio id=\""+o.n+"\" src=\""+o.params.url+"\" controls></audio>\n";
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
	var fl="Required files : ";
	for(var i=0;i<files.length;++i){
		fl+=" <a href=\""+files[i]+"\">"+files[i]+"</a> ";
	}
	document.getElementById("files").innerHTML=fl;
}

function Connector(parent,subtype,dir,x,y,ch){
	this.parent=parent,this.subtype=subtype;
	this.x=x-10,this.y=y-10,this.w=20,this.h=20;
	this.type="conn";
	this.ch=ch;
	this.elem=document.createElement("div");
	this.elem.setAttribute("class","conn");
	var st=this.elem.style;
	var col="#6f6";
	if(subtype=="ki"||subtype=="ko")
		col="#ccf";
	switch(dir){
	case "u":
		this.elem.innerHTML="<svg><path d='M2,10 C2,0 17,0 17,10' fill='"+col+"'/></svg>";
		break;
	case "r":
		this.elem.innerHTML="<svg><path d='M11,2 C20,2 20,17 11,17' fill='"+col+"'/></svg>";
		break;
	case "l":
		this.elem.innerHTML="<svg><path d='M9,2 C0,2 0,17 9,17' fill='"+col+"'/></svg>";
		break;
	}
	st.left=this.x+"px";
	st.top=this.y+"px";
	st.width=this.w+"px";
	st.height=this.h+"px";
	parent.elem.appendChild(this.elem);
}
Connector.prototype.HitTest=HitTest;
Connector.prototype.GetPos=GetPos;

function Io(parent,flags,x,y,w,h,p){
	this.parent=parent,this.x=x,this.y=y,this.w=w,this.h=h;
	this.type="io";
	this.elem=document.createElement("div");
	this.elem.setAttribute("class","io");
	if(flags&1)
		this.elem.style.borderRadius="0px 0px 4px 4px";
	var st=this.elem.style;
	st.left=x+"px";
	st.top=y+"px";
	st.width=w+"px";
	st.height=h+"px";
	this.child=[];
	this.inputs=[0,0];
	this.outputs=[0,0];
	for(var i=0;i<p.length;++i){
		var o=p[i];
		switch(o.t){
		case "si":
			this.child.push(new Connector(this,o.t,o.d,o.x,o.y,o.ch));
			var txt=document.createElement("div");
			txt.setAttribute("class","label");
			txt.setAttribute("style","left:5px;top:"+(o.y-8)+"px;");
			txt.innerHTML="in";
			this.elem.appendChild(txt);
			break;
		case "so":
			this.child.push(new Connector(this,o.t,o.d,o.x,o.y,o.ch));
			var txt=document.createElement("div");
			txt.setAttribute("class","label");
			txt.setAttribute("style","right:5px;top:"+(o.y-8)+"px;");
			txt.innerHTML="out";
			this.elem.appendChild(txt);
			break;
		case "ko":
		case "ki":
			this.child.push(new Connector(this,o.t,o.d,o.x,o.y,o.ch));
			break;
		}
	}
	parent.elem.appendChild(this.elem);
}
Io.prototype.HitTest=HitTest;
Io.prototype.GetPos=GetPos;
Io.prototype.SetEdit=function(val,ch,propagate){
	if(this.parent.subtype=="fun"){
		this.inputs[ch]=val;
		var node=this.parent;

		if(propagate){
			for(var i=node.conn.length-1;i>=0;--i){
				node.conn[i].t.parent.SetEdit(this.parent.func(this.inputs[0],this.inputs[1]),node.conn[i].t.ch,propagate);
			}
		}

	}
}

function Param(parent,name,subtype,flags,x,y,w,h,vx,option,defval,tooltip){
	this.parent=parent,this.name=name,this.subtype=subtype,this.x=x,this.y=y,this.w=w,this.h=h;
	this.defval=this.value=defval;
	this.child=[];
	this.type="param";
	this.elem=document.createElement("div");
	this.elem.setAttribute("class","param");
	this.tooltip=document.createElement("div");
	this.tooltip.setAttribute("class","tooltip");
	this.tooltip.innerHTML=tooltip;
	this.elem.style.left=this.x+"px";
	this.elem.style.top=this.y+"px";
	this.elem.style.width=(this.w-4)+"px";
	this.elem.style.height=this.h+"px";
	var rt="0px 0px ",rb="0px 0px";
	if(flags&2)
		rt="4px 4px ";
	if(flags&1)
		rb="4px 4px ";
	this.elem.style.borderRadius=rt+rb;
	if(flags&4)
		this.elem.style.display="none";
	this.elem.innerHTML=name;
	switch(subtype){
	case "a":
		this.child.push(new Connector(this,"si","l",0,10));
	case "n":
		this.child.push(new Connector(this,"ki","r",this.w,10));
	case "k":
		this.edit=document.createElement("input");
		this.edit.parent=this;
		this.edit.setAttribute("class","edit");
		this.edit.style.margin="0px";
		this.edit.style.padding="0px";
		this.edit.style.left=vx+"px";
		this.edit.style.top="1px";
		this.edit.style.width=(w-vx-6)+"px";
		this.edit.style.height=(this.h-6)+"px";
		this.value=this.edit.value=defval;
		this.edit.addEventListener("change",this.Set);
		this.elem.appendChild(this.edit);
		break;
	case "tf":
		this.edit=document.createElement("input");
		this.edit.parent=this;
		this.edit.setAttribute("class","edit");
		this.edit.setAttribute("list","fxlist");
		this.edit.setAttribute("style","top:16px;left:"+vx+"px;width:160px;height:15px");
		this.value=this.edit.value=defval;
		this.edit.addEventListener("change",function(){this.parent.parent.Rebuild()})
		this.elem.appendChild(this.edit);
		break;
	case "kno":
		this.elem.innerHTML="<webaudio-knob diameter='48'></webaudio-knob>";
		this.edit=this.elem.childNodes[0];
		this.edit.parent=this;
		this.elem.style.width="48px";
		this.elem.style.height="48px";
		this.elem.style.padding="5px 10px";
		this.edit.addEventListener("change",this.Set);
		break;
	case "key":
		this.elem.innerHTML="<webaudio-keyboard width='320' height='50' min='48' max='72'></webaudio-keyboard>";
		this.edit=this.elem.childNodes[0];
		this.edit.parent=this;
		this.elem.style.padding="0px";
		this.edit.addEventListener("change",function(e){
//			this.parent.parent.Note(e.note);
			this.parent.parent.io.inputs[0]=e.note[1];
			this.parent.parent.io.inputs[1]=e.note[0];
			this.parent.parent.Process(true);
		});
		break;
	case "b":
		this.edit=document.createElement("input");
		this.edit.parent=this;
		this.edit.setAttribute("class","edit");
		this.edit.setAttribute("type","button");
		this.edit.setAttribute("style","margin:0px;padidng:0px;left:"+vx+"px;top:1px;width:"+(w-vx-2)+"px;height:"+(this.h-2)+"px");
		this.value=this.edit.value=defval;
		this.edit.addEventListener("click",function(){this.value=(this.value=="true")?"false":"true";this.parent.Set.bind(this)()});
		this.elem.appendChild(this.edit);
		break;
	case "s":
	case "sw":
	case "ob":
		this.child.push(new Connector(this,"ki","r",this.w,10));
		this.edit=document.createElement("select");
		this.edit.setAttribute("class","edit");
		for(var j=0;j<option.length;++j){
			var o=document.createElement("option");
			o.innerHTML=option[j];
			this.edit.appendChild(o);
		}
		this.edit.parent=this;
		this.edit.style.margin="0px";
		this.edit.style.padding="0px";
		this.edit.style.left=vx+"px";
		this.edit.style.top="1px";
		this.edit.style.width=(w-vx-2)+"px";
		this.edit.style.height=(this.h-2)+"px";
		this.value=this.edit.value=defval;
		this.edit.addEventListener("change",this.Set);
		this.elem.appendChild(this.edit);
		break;
	case "tu":
		this.elem.style.background="#abf";
		this.edit=document.createElement("input");
		this.edit.setAttribute("class","edit");
		this.edit.setAttribute("spellcheck","false");
		this.edit.setAttribute("list","urllist");
		this.edit.parent=this;
		this.edit.style.margin="0px";
		this.edit.style.padding="0px";
		this.edit.style.left=vx+"px";
		this.edit.style.top="1px";
		this.edit.style.width=(w-vx-6)+"px";
		this.edit.style.height=(this.h-6)+"px";
		this.value=this.edit.value=defval;
		this.elem.appendChild(this.edit);
		this.edit.addEventListener("change",this.Set);
		break;
	case "tm":
		this.value=defval;
		this.elem.style.background="#abf";
		this.edit=document.createElement("input");
		this.edit.setAttribute("class","edit");
		this.edit.setAttribute("spellcheck",false);
		this.edit.parent=this;
		this.edit.setAttribute("style","margin:0px;padding:0px;left:35px;top:1px;width:240px");
		this.value=this.edit.value=defval;
		this.elem.appendChild(this.edit);
		this.edit.addEventListener("change",this.Set);
		break;
	case "tc":
		this.value=defval;
		this.cv=document.createElement("canvas");
		this.cv.setAttribute("width","64");
		this.cv.setAttribute("height","64");
		this.cv.setAttribute("style","position:absolute;left:65px;top:4px");
		this.elem.appendChild(this.cv);
		this.ctx=this.cv.getContext("2d");
		this.ctx.fillStyle="#000";
		this.ctx.fillRect(0,0,64,64);
		break;
	case "ts":
		this.value=defval;
		break;
	case "tp":
		this.value=defval;
		this.cv=document.createElement("canvas");
		this.cv.setAttribute("width","64");
		this.cv.setAttribute("height","64");
		this.cv.setAttribute("style","position:absolute;left:60px;top:12px");
		this.elem.appendChild(this.cv);
		this.ctx=this.cv.getContext("2d");
		this.ctx.fillStyle="#000";
		this.ctx.fillRect(0,0,64,64);
		break;
	}
	if(tooltip)
		this.elem.appendChild(this.tooltip);
	if(flags&8)
		this.h=0;
	parent.elem.appendChild(this.elem);
}
Param.prototype.HitTest=HitTest;
Param.prototype.GetPos=GetPos;
Param.prototype.Set=function(){
	switch(this.parent.subtype){
	case "a":
		this.parent.value=this.value;
		if(this.parent.parent.node&&!isNaN(this.parent.value)){
			this.parent.parent.node[this.parent.name].value=this.parent.value;
//			this.parent.parent.node[this.parent.name].setValueAtTime(this.parent.value,graph.actx.currentTime);
		}
		break;
	case "n":
		this.parent.value=this.value;
		if(this.parent.parent.node)
			this.parent.parent.node[this.parent.name]=this.parent.value;
		break;
	case "k":
		this.parent.value=this.value;
		this.parent.parent.Rebuild();
		break;
	case "kno":
		this.parent.parent.io.inputs[0]=this.value;
		this.parent.parent.knob.value=this.value;
//		for(var i=this.parent.parent.conn.length-1;i>=0;--i){
//			this.parent.parent.conn[i].t.parent.SetEdit(this.value,this.parent.parent.conn[i].t.ch);
//		}
		break;
	case "key":
//		this.parent.parent.key.value=this.value;
//		for(var i=this.parent.parent.conn.length-1;i>=0;--i){
//			this.parent.parent.conn[i].t.parent.SetEdit(this.value,this.parent.parent.conn[i].t.ch);
//		}
		break;
	case "tf":
		this.parent.parent.Rebuild();
		break;
	case "s":
		this.parent.value=this.options[this.selectedIndex].value;
		if(this.parent.parent.node)
			this.parent.parent.node[this.parent.name]=this.parent.value;
		break;
	case "sw":
		this.parent.value=this.options[this.selectedIndex].value;
		var node=this.parent.parent;
		if(this.parent.value=="custom"){
			node.params[3].elem.style.display="block";
			node.params[3].h=80;
			node.Move(node.x,node.y,node.w,180);
			var tab=eval("({"+node.params[3].value+"})");
			if(node.node)
				node.node.setPeriodicWave(graph.actx.createPeriodicWave(new Float32Array(tab.real),new Float32Array(tab.imag)));
			node.params[3].SetEdit(node.params[3].value);
//			console.log(node.params[3].SetEdit);
		}
		else{
			node.params[3].elem.style.display="none";
			node.params[3].h=0;
			node.Move(node.x,node.y,node.w,100);
		}
		if(this.parent.parent.node&&this.parent.value!="custom"){
			this.parent.parent.node[this.parent.name]=this.parent.value;
		}
		break;
	case "b":
		this.parent.value=(this.value=="true")?true:false;
		if(this.parent.parent.node)
			this.parent.parent.node[this.parent.name]=this.parent.value;
		break;
	case "ob":
		this.parent.value=this.options[this.selectedIndex].value;
		if(this.parent.parent.node)
			this.parent.parent.node[this.parent.name]=graph.buffers[this.parent.value].data;
		break;
	case "tu":
		this.parent.value=this.value;
		this.parent.parent.audio.src=this.parent.value;
		break;
	case "tm":
		this.parent.value=this.value;
		break;
	}
};
Param.prototype.SetEdit=function(val,i){
	switch(this.subtype){
	case "a":
	case "n":
	case "k":
		this.edit.value=ToFixed(parseFloat(val));
		this.Set.bind(this.edit)();
		break;
	case "b":
		this.edit.value=val;
		this.Set.bind(this.edit)();
		break;
	case "kno":
		this.value=val;
		if(this.edit.setValue)
			this.edit.setValue(val,true);
		break;
	case "key":
		break;
	case "sw":
		if(typeof(val)=="number")
			this.edit.selectedIndex=val;
		else{
			for(var i=this.edit.options.length-1;i>=0;--i){
				if(this.edit.options[i].value==val){
					this.edit.selectedIndex=i;
					break;
				}
			}
		}
		this.Set.bind(this.edit)();
		break;
	case "s":
	case "ob":
		if(typeof(val)=="number")
			this.edit.selectedIndex=val;
		else{
			for(var i=this.edit.options.length-1;i>=0;--i){
				if(this.edit.options[i].value==val){
					this.edit.selectedIndex=i;
					break;
				}
			}
		}
		this.Set.bind(this.edit)();
		break;
	case "tf":
		this.edit.value=val;
		this.Set.bind(this.edit)();
//		this.parent.func=eval("("+val+")");
		break;
	case "ts":
		this.value=val;
		break;
	case "tp":
		this.value=val;
		this.ctx.fillStyle="#000";
		this.ctx.fillRect(0,0,64,64);
		this.ctx.strokeStyle="#0f0";
		this.ctx.lineWidth=2;
		var wav=[];
		for(var i=0;i<64;++i)
			wav[i]=0;
		var p=eval("({"+this.value+"})");
		var l=Math.min(p.real.length,p.imag.length);
		for(var i=1;i<l;++i){
			for(var j=0;j<64;++j){
				var th=j*2*3.14159265/64*i;
				wav[j]+=p.real[i]*Math.cos(th)
				wav[j]+=p.imag[i]*Math.sin(th);
			}
		}
		var mx=0;
		for(var i=0;i<64;++i){
			if(wav[i]>mx)
				mx=wav[i];
		}
		this.ctx.beginPath();
		this.ctx.moveTo(0,32-wav[0]/mx*30);
		for(var i=0;i<64;++i){
			this.ctx.lineTo(i,32-wav[i]/mx*30);
		}
		this.ctx.stroke();
		break;
	case "tm":
		this.value=val;
		this.edit.value=val;
		break;
	case "tc":
		this.value=val;
		this.ctx.fillStyle="#000";
		this.ctx.fillRect(0,0,64,64);
		this.ctx.strokeStyle="#0f0";
		this.ctx.lineWidth=2;
		var c=new Float32Array(eval("("+this.value+")"));
		this.ctx.beginPath();
		this.ctx.moveTo(0,32-c[0]*32);
		for(var j=0;j<c.length;++j){
			var x=64*j/(c.length-1);
			var y=32-c[j]*32;
			this.ctx.lineTo(x,y);
		}
		this.ctx.stroke();
		this.parent.node.curve=c;
		break;
	}
};

function Button(parent,type,x,y){
	switch(type){
	case  "nodebtn":
		this.parent=parent,this.type=type,this.x=x,this.y=y,this.w=12,this.h=12;
		this.elem=document.createElement("div");
		this.elem.setAttribute("class","nodebtn");
		this.elem.setAttribute("style","left:"+this.x+"px;top:"+this.y+"px;width:"+this.w+"px;height:"+this.h+"px");
		break;
	case "playbtn":
		this.parent=parent,this.type=type,this.x=x,this.y=y,this.w=20,this.h=10;
		this.elem=document.createElement("div");
		this.elem.parent=this;
		this.elem.setAttribute("class","playbtn");
		this.elem.setAttribute("style","left:"+this.x+"px;top:"+this.y+"px;width:"+this.w+"px;height:"+this.h+"px");
		this.elem.innerHTML="<svg><polygon points='5,2 5,8 15,5' fill='#000'/></svg>";
		this.elem.addEventListener("click",this.Toggle);
		break;
	case "anabtn":
		this.parent=parent,this.type=type,this.x=x,this.y=y,this.w=60,this.h=13;
		this.elem=document.createElement("div");
		this.elem.parent=this;
		this.elem.setAttribute("class","anabtn");
		this.elem.setAttribute("style","left:"+this.x+"px;top:"+this.y+"px;width:"+this.w+"px;height:"+this.h+"px");
		this.elem.innerHTML="Time";
		this.elem.addEventListener("click",function(){
			this.parent.press=!this.parent.press;
			this.innerHTML=this.parent.press?"Freq":"Time";
		});
		break;
	}
	this.press=false;
	parent.elem.appendChild(this.elem);
}
Button.prototype.HitTest=HitTest;
Button.prototype.GetPos=GetPos;
Button.prototype.Toggle=function(){
	this.parent.Press(!this.parent.press);
}
Button.prototype.Press=function(press){
	this.press=press;
	switch(this.type){
	case "playbtn":
		if(this.press){
			this.elem.style.background="#888";
			this.parent.Realize();
		}
		else{
			this.elem.style.background="#ccc";
			this.parent.Unrealize();
		}
		break;
	case "anabtn":
		this.elem.innerHTML=this.press?"Freq":"Time";
		break;
	}
}
function TitleBar(parent,name,x,y,w,h){
	this.x=x,this.y=y,this.w=w,this.h=h;
	this.type="title";
	this.parent=parent;
	this.elem=document.createElement("div");
	var ti=name;
	if(ti.indexOf("_")>=0)
		ti=ti.substring(ti.indexOf("_")+1);
	this.elem.innerHTML=ti;
	this.elem.setAttribute("class","titlebar");
	var st=this.elem.style;
	st.top=y+"px";
	st.left=x+"px";
	st.width=(w-20)+"px";
	if(name=="destination")
		this.child=[];
	else
		this.child=[new Button(this,"nodebtn",2,2)];
	parent.elem.appendChild(this.elem);
}
TitleBar.prototype.HitTest=HitTest;
TitleBar.prototype.GetPos=GetPos;

function ANode(parent,subtype,name,x,y,actx,dest){
	var namtab={des:"destination",osc:"osc",buf:"bufsrc",str:"strmsrc",ele:"elemsrc",gai:"gain",del:"delay",pan:"panner",
		scr:"scrproc",fil:"filter",com:"comp",sha:"shaper",con:"conv",ana:"analys",spl:"split",mer:"merge",
		fun:"func",kno:"knob",key:"keyboard",aut:"automation",seq:"sequencer"};
	this.parent=parent;
	this.type="node";
	this.actx=actx;
	this.subtype=subtype.substr(0,3);
	this.elem=document.createElement("div");
	this.elem.setAttribute("class","node");
	this.child=[];
	this.conn=[];
	this.params=[];
	this.name=name;
	if(this.name==null)
		this.name=graph.GetNextName(this.subtype);
//		this.name=graph.GetNextName(namtab[this.subtype]);
	switch(this.subtype){
	case "seq":
		this.child=[
			new TitleBar(this,this.name,1,1,320,19),
			this.io=new Io(this,0, 1,21,320,19,[{x:260,y:-21,t:"ko",d:"u",ch:0},{x:290,y:-21,t:"ko",d:"u",ch:1}]),
			this.play=new Button(this,"playbtn",16,23),
		];
		this.lbl1=document.createElement("div");
		this.lbl1.setAttribute("style","position:absolute;top:0px;left:245px");
		this.lbl1.innerHTML="note";
		this.lbl2=document.createElement("div");
		this.lbl2.setAttribute("style","position:absolute;top:0px;left:280px");
		this.lbl2.innerHTML="gate";
		this.elem.appendChild(this.lbl1);
		this.elem.appendChild(this.lbl2);
		this.cv=document.createElement("canvas");
		this.ctx=this.cv.getContext("2d");
		this.cv.setAttribute("width",320);
		this.cv.setAttribute("width",160);
		this.elem.appendChild(this.cv);
		this.Move(x,y,320,200);
		this.node=null;
		break;
	case "aut":
		this.child=[
			new TitleBar(this,this.name,1,1,188,19),
			this.io=new Io(this,0,1,21,188,19,[{x:140,y:-21,t:"ko",d:"u",ch:0},{x:188,y:10,t:"ki",d:"r",ch:0}]),
			this.params[0]=new Param(this,"on","sa",0, 1,41,188,59,5,null,"sv\n1\nt\nlr\n0\nt+0.1"),
			this.params[1]=new Param(this,"off","sa",1, 1,101,188,39,5,null,"lr\n0\nt"),
		];
		this.Move(x,y,190,140);
		this.node=null;
		break;
	case "key":
		this.child=[
			new TitleBar(this,this.name,1,1,320,19),
			this.io=new Io(this,0, 1,21,320,19,[{x:260,y:-21,t:"ko",d:"u",ch:0},{x:290,y:-21,t:"ko",d:"u",ch:1}]),
			this.play=new Button(this,"playbtn",16,23),
			this.key=this.params[0]=new Param(this,"val","key",1, 1,41,320,50,0,null,0),
			this.params[1]=new Param(this,"mml","tm",0, 41,21,250,19,30,null,
					"t80o4l16a8f+ga8f+ga>ab<c+def+g"+"f+8def+8>f+gabagaf+ga"+
					"g8bag8f+ef+edef+gab"+"g8bab8<c+d>ab<c+def+ga"+
					"f+8def+8edec+def+edc+"+"d8>b<c+d8>def+gf+ef+<dc+d"+
					">b8<dc+>b8agagf+gab<c+d"+">b8<dc+d8c+>b<c+dedc+d>b<c+"+"d1"),
		];
		this.lbl1=document.createElement("div");
		this.lbl1.setAttribute("style","position:absolute;top:0px;left:245px");
		this.lbl1.innerHTML="note";
		this.lbl2=document.createElement("div");
		this.lbl2.setAttribute("style","position:absolute;top:0px;left:280px");
		this.lbl2.innerHTML="gate";
		this.elem.appendChild(this.lbl1);
		this.elem.appendChild(this.lbl2);
		this.Move(x,y,320,91);
		this.node=null;
		break;
	case "kno":
		this.child=[
			new TitleBar(this,this.name,1,1,68,19),
			this.io=new Io(this,0,0,0,0,0,[{x:32,y:0,t:"ko",d:"u",ch:0}]),
			this.params[0]=new Param(this,"min","k",0, 1,21,68,19,30,null,0),
			this.params[1]=new Param(this,"max","k",0, 1,41,68,19,30,null,100),
			this.params[2]=new Param(this,"step","k",0, 1,61,68,19,30,null,1),
			this.knob=this.params[3]=new Param(this,"val","kno",1, 1,81,68,48,0,null,0),
		];
		this.Move(x,y,70,140);
		this.node=null;
		break;
	case "fun":
		this.child=[
			new TitleBar(this,this.name,1,1,188,19),
			this.io=new Io(this,0, 0,0,0,0,[{x:150,y:0,t:"ko",d:"u",ch:0},{x:189,y:30,t:"ki",d:"r",ch:0},{x:189,y:50,t:"ki",d:"r",ch:1}]),
			this.params[0]=new Param(this,"func","tf",1, 1,21,188,39,5,null,"440*Math.pow(2,(x+y-69)/12)"),
		];
		this.lbl1=document.createElement("div");
		this.lbl1.setAttribute("style","position:absolute;top:20px;left:175px");
		this.lbl1.innerHTML="x";
		this.lbl2=document.createElement("div");
		this.lbl2.setAttribute("style","position:absolute;top:40px;left:175px");
		this.lbl2.innerHTML="y";
		this.elem.appendChild(this.lbl1);
		this.elem.appendChild(this.lbl2);
		this.Move(x,y,190,61);
		this.node=null;
		this.Rebuild();
		break;
	case "des":
		this.child=[
			new TitleBar(this,this.name="destination",1,1,113,19),
			this.io=new Io(this,1, 1,21,113,19,[{x:0,y:10,t:"si",d:"l",ch:0}]),
		];
		this.Move(x,y,115,41);
		this.node=dest;
		break;
	case "osc":
		this.child=[
			new TitleBar(this,this.name,1,1,128,19),
			this.io=new Io(this,0, 1,21,128,19,[{x:128,y:10,t:"so",d:"r",ch:0}]),
			this.play=new Button(this,"playbtn",16,23),
			this.params[0]=new Param(this,"type","sw",0, 1,41,128,19,50,["sine","square","sawtooth","triangle","custom"],"sine","Shape of waveform"),
			this.params[1]=new Param(this,"frequency","a",0, 1,61,128,19,65,null,440,"Frequency in Hz"),
			this.params[2]=new Param(this,"detune","a",1, 1,81,128,19,65,null,0,"Frequency offset in Cent"),
			this.params[3]=new Param(this,"periodic","tp",15, 1,101,128,79,65,null,"real:[0,0,0,0],\nimag:[0,1,1,1]"),
		];
		this.Move(x,y,130,101);
		this.node=null;
		break;
	case "buf":
		this.child=[
			new TitleBar(this,this.name,1,1,158,19),
			this.io=new Io(this,0, 1,21,158,19,[{x:158,y:10,t:"so",d:"r",ch:0}]),
			this.play=new Button(this,"playbtn",16,23),
			this.params[0]=new Param(this,"playbackRate","a",0, 1,41,158,19,90,null,1,"Speed at which to render the audio stream"),
			this.params[1]=new Param(this,"loop","b",0, 1,61,158,19,90,null,false,"Audio data should play in a loop"),
			this.params[2]=new Param(this,"loopStart","n",0, 1,81,158,19,90,null,0,"Looping start position in seconds"),
			this.params[3]=new Param(this,"loopEnd","n",0, 1,101,158,19,90,null,0,"Looping end position in seconds"),
			this.params[4]=new Param(this,"buffer","ob",1, 1,121,158,19,70,["loop.wav","rhythm.wav","voice.mp3","snare.wav"],"loop.wav","Audio asset to be played"),
		];
		this.Move(x,y,160,141);
		this.node=null;
		break;
	case "str":
		this.child=[
			new TitleBar(this,this.name,1,1,148,19),
			this.io=new Io(this,1, 1,21,148,19,[{x:148,y:10,t:"so",d:"r",ch:0}]),
		];
		this.Move(x,y,150,41);
		this.node=null;
		break;
	case "ele":
		this.child=[
			new TitleBar(this,this.name,1,1,228,19),
			this.io=new Io(this,0, 1,21,228,19,[{x:228,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"url","tu",0, 1,41,228,20,30,null,"samples/kerokeroshiyouyo.mp3"),
		];
		this.audio=document.createElement("audio");
		this.audio.setAttribute("class","audiopane");
		this.audio.setAttribute("src","samples/kerokeroshiyouyo.mp3");
		this.audio.setAttribute("controls","true");
		this.audio.setAttribute("style","position:absolute;top:63px;left:0px;width:230px");
		this.elem.appendChild(this.audio);
		try{
			this.node=actx.createMediaElementSource(this.audio);
		} catch(e){alert("cannot use MediaElementSource on this browser");}
		this.Move(x,y,230,93);
		break;
	case "gai":
		this.child=[
			new TitleBar(this,this.name,1,1,108,19),
			this.io=new Io(this,0, 1,21,108,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:108,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"gain","a",1, 1,41,108,19,55,null,1,"Gain value. Phase inversion if negative"),
		];
		this.Move(x,y,110,61);
		this.node=actx.createGain();
		break;
	case "del":
		this.child=[
			new TitleBar(this,this.name,1,1,118,19),
			this.io=new Io(this,0, 1,21,118,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:118,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"delayTime","a",1, 1,41,118,19,65,null,0,"Amount of delay in seconds"),
		];
		this.Move(x,y,120,61);
		this.node=actx.createDelay();
		break;
	case "pan":
		this.child=[
			new TitleBar(this,this.name,1,1,173,19),
			this.io=new Io(this,0, 1,21,173,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:173,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"panningModel","s",0, 1,41,173,19,90,["equalpower","HRTF"],"HRTF","Spatialization algorithm selection"),
			this.params[1]=new Param(this,"distanceModel","s",0, 1,61,173,19,90,["linear","inverse","exponential"],"inverse","Reducing volume algorithm selection"),
			this.params[2]=new Param(this,"refDistance","n",0, 1,81,173,19,110,null,1,"A reference distance for reducing volume algorithm"),
			this.params[3]=new Param(this,"maxDistance","n",0, 1,101,173,19,110,null,10000,"Maximum distance for reducing voluem algorithm"),
			this.params[4]=new Param(this,"rolloffFactor","n",0, 1,121,173,19,110,null,1,"Describes how quickly the volume is reduced with distance"),
			this.params[5]=new Param(this,"coneInnerAngle","n",0, 1,141,173,19,110,null,360,"For directional audio source, an angle for no volume reduction"),
			this.params[6]=new Param(this,"coneOuterAngle","n",0, 1,161,173,19,110,null,360, "For directional audio source, an angle of "),
			this.params[7]=new Param(this,"coneOuterGain","n",1, 1,181,173,19,110,null,0),
		];
		this.Move(x,y,175,201);
		this.node=actx.createPanner();
		break;
	case "scr":
		this.child=[
			new TitleBar(this,this.name,1,1,178,19),
			this.io=new Io(this,0, 1,21,178,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:178,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"onaudioprocess","ts",1, 1,41,178,39,0,null,
				"function(ev){\n"+
				"  var out0=ev.outputBuffer.getChannelData(0);\n"+
				"  var out1=ev.outputBuffer.getChannelData(1);\n"+
				"  var in0=ev.inputBuffer.getChannelData(0);\n"+
				"  var in1=ev.inputBuffer.getChannelData(1);\n"+
				"  for(var i=0;i<ev.target.bufferSize;++i){\n"+
				"    out0[i]=in0[i];\n"+
				"    out1[i]=in1[i];\n"+
				"  }\n"+
				"}"),
		];
		this.Move(x,y,180,81);
		this.node=actx.createScriptProcessor();
		this.SetupParam();
		break;
	case "fil":
		this.child=[
			new TitleBar(this,this.name,1,1,118,19),
			this.io=new Io(this,0, 1,21,118,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:118,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"type","s",0, 1,41,118,19,45,["lowpass","highpass","bandpass","lowshelf","highshelf","peaking","notch","allpass"],"lowpass"),
			this.params[1]=new Param(this,"frequency","a",0, 1,61,118,19,65,null,350),
			this.params[2]=new Param(this,"detune","a",0, 1,81,118,19,65,null,0),
			this.params[3]=new Param(this,"Q","a",0, 1,101,118,19,65,null,1),
			this.params[4]=new Param(this,"gain","a",1, 1,121,118,19,65,null,0),
		];
		this.Move(x,y,120,141);
		this.node=actx.createBiquadFilter();
		break;
	case "com":
		this.child=[
			new TitleBar(this,this.name,1,1,128,19),
			this.io=new Io(this,0, 1,21,128,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:128,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"threshold","a",0, 1,41,128,19,70,null,-24),
			this.params[1]=new Param(this,"knee","a",0, 1,61,128,19,70,null,30),
			this.params[2]=new Param(this,"ratio","a",0, 1,81,128,19,70,null,12),
			this.params[3]=new Param(this,"attack","a",0, 1,101,128,19,70,null,0.003),
			this.params[4]=new Param(this,"release","a",1, 1,121,128,19,70,null,0.25),
		];
		this.Move(x,y,130,141);
		this.node=actx.createDynamicsCompressor();
		break;
	case "sha":
		this.child=[
			new TitleBar(this,this.name,1,1,138,19),
			this.io=new Io(this,0, 1,21,138,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:138,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"oversample","s",0, 1,41,138,19,80,["none","2x","4x"],"none"),
			this.params[1]=new Param(this,"curve","tc",1, 1,61,138,79,80,null,"[\n-0.5,-0.5,0,0.5,0.5\n]"),
		];
		this.Move(x,y,140,141);
		this.node=actx.createWaveShaper();
		this.SetupParam();
		break;
	case "con":
		this.child=[
			new TitleBar(this,this.name,1,1,198,19),
			this.io=new Io(this,0, 1,21,198,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:198,y:10,t:"so",d:"r",ch:0}]),
			this.params[0]=new Param(this,"normalize","b",0, 1,41,198,19,150,null,true),
			this.params[1]=new Param(this,"buffer","ob",1, 1,61,198,19,50,[
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
			],"Five Columns Long.wav"),
		];
		this.Move(x,y,200,81);
		this.node=actx.createConvolver();
		this.SetupParam();
		break;
	case "ana":
		this.child=[
			new TitleBar(this,this.name,1,1,183,19),
			this.io=new Io(this,0, 1,21,183,19,[{x:0,y:10,t:"si",d:"l",ch:0},{x:183,y:10,t:"so",d:"r",ch:0}]),
			this.mode=new Button(this,"anabtn",60,23),
			this.params[0]=new Param(this,"fftSize","n",0, 1,41,183,19,145,null,2048),
			this.params[1]=new Param(this,"minDecibels","n",0, 1,61,183,19,145,null,-100),
			this.params[2]=new Param(this,"maxDecibels","n",0, 1,81,183,19,145,null,-39),
			this.params[3]=new Param(this,"smoothingTimeConstant","n",0, 1,101,183,19,145,null,0.8),
		];
		this.Move(x,y,185,181);
		this.node=actx.createAnalyser();
		this.buf=new Uint8Array(185);
		this.cv=document.createElement("canvas");
		this.cv.setAttribute("width","183");
		this.cv.setAttribute("height","57");
		this.cv.setAttribute("style","position:absolute;left:1px;top:122px");
		this.elem.appendChild(this.cv);
		this.ctx=this.cv.getContext("2d");
		this.timerfunc=function(e){
			if(this.mode.press)
				this.node.getByteFrequencyData(this.buf);
			else
				this.node.getByteTimeDomainData(this.buf);
			this.ctx.fillStyle="#114";
			this.ctx.fillRect(0,0,185,60);
			this.ctx.fillStyle="#0c0";
			for(var i=1;i<this.w-1;++i){
				var v=this.buf[i]*55/256;
				this.ctx.fillRect(i,56,1,-v);
			}
		};
		this.timerid=setInterval(this.timerfunc.bind(this),200);
		this.SetupParam();
		break;
	case "spl":
		this.child=[
			new TitleBar(this,this.name,1,1,98,19),
			this.io=new Io(this,1, 1,21,98,39,[{x:0,y:10,t:"si",d:"l",ch:0},{x:98,y:10,t:"so",d:"r",ch:0},{x:98,y:30,t:"so",d:"r",ch:1}]),
		];
		this.Move(x,y,100,61);
		this.node=actx.createChannelSplitter();
		break;
	case "mer":
		this.child=[
			new TitleBar(this,this.name,1,1,98,19),
			this.io=new Io(this,1, 1,21,98,39,[{x:0,y:10,t:"si",d:"l",ch:0},{x:0,y:30,t:"si",d:"l",ch:1},{x:98,y:10,t:"so",d:"r",ch:0}]),
		];
		this.Move(x,y,100,61);
		this.node=actx.createChannelMerger();
		break;
	}
	parent.base.insertBefore(this.elem,parent.ins);
}
ANode.prototype.HitTest=HitTest;
ANode.prototype.GetPos=GetPos;
ANode.prototype.Note=function(note){
//	for(var i=this.conn.length-1;i>=0;--i){
//		var c=this.conn[i];
//		if(c.o.ch==0)
//			c.t.parent.SetEdit(note[1],c.t.ch);
//		else
//			c.t.parent.SetEdit(note[0],c.t.ch);
//	}
}
ANode.prototype.Rebuild=function(){
	switch(this.subtype){
	case "kno":
		this.knob.elem.innerHTML="<webaudio-knob diameter='48' min='"+this.params[0].value+"' max='"+this.params[1].value+"' step='"+this.params[2].value+"'></webaudio-knob>";
		this.knob.edit=this.knob.elem.childNodes[0];
		this.knob.edit.parent=this.knob;
		this.knob.elem.style.width="48px";
		this.knob.elem.style.height="48px";
		this.knob.elem.style.padding="5px 10px";
		this.knob.edit.addEventListener("change",this.knob.Set);
		break;
	case "fun":
		this.params[0].value=this.params[0].edit.value;
		this.func=eval("(function(x,y){return "+this.params[0].value+";})");
		break;
	}
}
ANode.prototype.Move=function(x,y,w,h){
	this.x=x,this.y=y;
	var s=this.elem.style;
	s.left=this.x+"px";
	s.top=this.y+"px";
	if(w&&h){
		this.w=w,this.h=h;
		s.width=this.w+"px";
		s.height=this.h+"px";
	}
}
ANode.prototype.SetupParam=function(){
	for(var i=this.child.length-1;i>=0;--i){
		var p=this.child[i];
		switch(p.subtype){
		case "a":
			if(this.node)
				this.node[p.name].value=p.value;
			break;
		case "n":
			if(this.node)
				this.node[p.name]=p.value;
			break;
		case "b":
			if(this.node)
				this.node[p.name]=p.value;
			break;
		case "s":
			if(this.node)
				this.node[p.name]=p.value;
			break;
		case "sw":
			if(this.node&&p.value!="custom")
				this.node[p.name]=p.value;
			break;
		case "ob":
			if(this.node)
				this.node[p.name]=graph.buffers[p.value].data;
			break;
		case "ts":
			if(this.node)
				this.node[p.name]=eval("("+p.value+")");
			break;
		case "tp":
			var tab=eval("({"+p.value+"})");
			if(this.node)
				this.node.setPeriodicWave(this.actx.createPeriodicWave(new Float32Array(tab.real),new Float32Array(tab.imag)));
		p.ctx.fillStyle="#000";
		p.ctx.fillRect(0,0,64,64);
		p.ctx.strokeStyle="#0f0";
		p.ctx.lineWidth=2;
		var wav=[];
		for(var ii=0;ii<64;++ii)
			wav[ii]=0;
		var l=Math.min(tab.real.length,tab.imag.length);
		for(var ii=1;ii<l;++ii){
			for(var jj=0;jj<64;++jj){
				var th=jj*2*3.14159265/64*ii;
				wav[jj]+=tab.real[ii]*Math.cos(th)
				wav[jj]+=tab.imag[ii]*Math.sin(th);
			}
		}
		var mx=0;
		for(var ii=0;ii<64;++ii){
			if(wav[ii]>mx)
				mx=wav[ii];
		}
		p.ctx.beginPath();
		p.ctx.moveTo(0,32-wav[0]/mx*30);
		for(var ii=0;ii<64;++ii){
			p.ctx.lineTo(ii,32-wav[ii]/mx*30);
		}
		p.ctx.stroke();
			break;
		case "tc":
			var c=this.node[p.name]=eval("(new Float32Array("+p.value+"))");
			p.ctx.fillStyle="#000";
			p.ctx.fillRect(0,0,64,64);
			p.ctx.strokeStyle="#0f0";
			p.ctx.lineWidth=2;
			p.ctx.beginPath();
			p.ctx.moveTo(0,32-c[0]*32);
			for(var j=0;j<c.length;++j){
				var x=64*j/(c.length-1);
				var y=32-c[j]*32;
				p.ctx.lineTo(x,y);
			}
			p.ctx.stroke();
			break;
		case "tf":
			this.node.func=eval("(function(x,y){return "+p.value+";})");
			break;
		}
	}
};
ANode.prototype.Process=function(propagate){
	switch(this.subtype){
	case "kno":
		this.io.outputs[0]=this.io.inputs[0];
		break;
	case "key":
		this.io.outputs[0]=this.io.inputs[0];
		this.io.outputs[1]=this.io.inputs[1];
		break;
	case "fun":
		this.io.outputs[0]=this.func(this.io.inputs[0],this.io.inputs[1]);
		break;
	default:
		return;
	}
	for(var i=this.conn.length-1;i>=0;--i){
		var c=this.conn[i];
		c.t.parent.SetEdit(this.io.outputs[c.o.ch],c.t.ch,propagate);
	}
}
ANode.prototype.Realize=function(){
	if(this.subtype=="osc"){
		this.node=this.actx.createOscillator();
		this.SetupParam();
	}
	if(this.subtype=="buf"){
		this.node=this.actx.createBufferSource();
		this.SetupParam();
	}
	if(this.subtype=="key"){
		this.mml=new MMLEmitter(this.actx,"/:"+this.params[1].edit.value+":/999",{defaultOctave:4});
		this.mml.anode=this;
		this.mml.tracks[0].on("note",function(e){
//			this.Note([1,e.midi]);
			this.io.inputs[0]=e.midi;
			this.io.inputs[1]=1;
			this.key.edit.setNote(1,e.midi);
			this.e=e;
			e.noteOff(function(){
				this.key.edit.setNote(0,this.e.midi);
//				this.Note([0,this.e.midi]);
				this.io.inputs[0]=this.e.midi;
				this.io.inputs[1]=0;
//				graph.Process(true);
				this.Process(true);
			}.bind(this));
//			graph.Process(true);
			this.Process(true);
		}.bind(this));
		this.mml.start();
	}
	graph.Reconnect();
	if(this.node&&this.node.start)
		this.node.start(0);
}
ANode.prototype.Unrealize=function(){
	if(this.subtype=="osc"){
		if(this.node){
			this.node.stop(0);
			this.node.disconnect();
			delete this.node;
		}
		this.node=null;
	}
	if(this.subtype=="buf"){
		if(this.node)
			this.node.stop(0);
		this.node=null;
	}
	if(this.subtype=="key"){
		this.mml.stop();
	}
};
ANode.prototype.Connect=function(t,o,i){
	var co,ci;
	for(var j=this.io.child.length-1;j>=0;--j){
		co=this.io.child[j];
		if((co.subtype=="ko"||co.subtype=="so")&&co.ch==o)
			break;
	}
	if(t.type=="conn"){
		for(var j=this.conn.length-1;j>=0;--j){
			if(this.conn[j].t==t&&this.conn[j].o==co)
			return;
		}
		this.conn.push({t:t,o:co});
		return;
	}
	if(t.type=="node"){
		for(var j=t.io.child.length-1;j>=0;--j){
			ci=t.io.child[j];
			if((ci.subtype=="si"||ci.subtype=="ki")&&ci.ch==i)
				break;
		}
	}
	else{
		if(co.subtype=="ko"){
			for(var j=t.child.length-1;j>=0;--j){
				if(t.child[j].subtype=="ki"){
					ci=t.child[j];
					break;
				}
			}
		}
		else{
			for(var j=t.child.length-1;j>=0;--j){
				if(t.child[j].subtype=="si"){
					ci=t.child[j];
					break;
				}
			}
		}
	}
	for(var j=this.conn.length-1;j>=0;--j){
		if(this.conn[j].t==ci&&this.conn[j].o==co)
			return;
	}
	this.conn.push({t:ci,o:co});
};
function Graph(canvas,actx,dest){
	this.x=this.y=0;
	this.lx=this.ly=0;
	this.menu=document.getElementById("menu");
	this.menu.onclick=MenuClick;
	this.base=document.getElementById("base");
	this.ins=document.getElementById("ins");
	this.canvas=document.getElementById("canvas");
	this.ctx=this.canvas.getContext("2d");
	this.actx=actx;
	this.dest=dest;
	this.child=[new ANode(this,"des","destination",500,100,actx,dest)];
	this.dragging=null;
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
	this.Process=function(propagate){
		for(var i=graph.child.length-1;i>=0;--i){
			var node=graph.child[i];
			if(node&&node.Process)
				node.Process(propagate);
		}
	};
	setInterval(this.Process,50);
	this.GetJson=function(){
		var o=[];
		for(var i=0;i<this.child.length;++i){
			var n=this.child[i];
			var paramtab={};
			var contab=[];
			if(n.type=="node"){
				for(var j=0;j<n.child.length;++j){
					var p=n.child[j];
					if(p.type=="param"){
						if(p.name=="type"&&p.value=="custom"){
							paramtab.type="custom";
							for(var k=0;k<n.child.length;++k){
								var pp=n.child[k];
								if(pp.name=="periodic"){
									paramtab.periodic=pp.value;
								}
							}
						}
						else if(p.value!=p.defval||p.name=="buffer"||p.name=="url"||p.name=="curve"){
							if(p.subtype=="n"||p.subtype=="a"||p.subtype=="k"||p.subtype=="kno")
								paramtab[p.name]=parseFloat(p.value);
							else
								paramtab[p.name]=p.value;
						}
					}
				}
				for(var j=0;j<n.conn.length;++j){
					var p=n.conn[j];
					if(p.t.parent.type=="io"){
						if(p.t.ch==0&&p.o.ch==0)
							contab.push(p.t.parent.parent.name);
						else{
							var oo={t:p.t.parent.parent.name};
							if(p.t.ch>0) oo.i=p.t.ch;
							if(p.o.ch>0) oo.o=p.o.ch;
							contab.push(oo);
						}
					}
					else if(p.t.parent.type=="param"){
						if(p.o.ch==0)
							contab.push(p.t.parent.parent.name+"."+p.t.parent.name);
						else{
							var oo={t:p.t.parent.parent.name+"."+p.t.parent.name};
							if(p.o.ch>0) oo.o=p.o.ch;
							contab.push(oo);
						}
					}
				}
				o.push({"n":n.name,"x":n.x,"y":n.y,"p":paramtab,"c":contab});
			}
		}
		var s=JSON.stringify(o);
//		s=s.replace(/\"par\"/g,"p");
//		s=s.replace(/\"con\"/g,"c");
		s=s.replace(/\"(.)\":/g,"$1:");
//		s=s.replace(/\"/g,"'");
		s=s.replace(/,p:{}/g,"");
		s=s.replace(/,c:\[\]/g,"");
		return {"o":o,"s":s};
	};
	this.About=function(){
		document.getElementById("menunode").style.display="none";
		document.getElementById("menugraph").style.display="none";
		document.getElementById("menuctrl").style.display="none";
		document.getElementById("aboutpane").style.display="block";
		document.getElementById("urlpane").style.display="none";
		document.getElementById("jspane").style.display="none";
		document.getElementById("aboutclose").onclick=function(){document.getElementById("aboutpane").style.display="none";};
	};
	this.Link=function(){
		var o=this.GetJson().s;
		o=encodeURIComponent(o);
		var url=(location.protocol+"//"+location.host+location.pathname+"?p="+o);
		document.getElementById("aboutpane").style.display="none";
		document.getElementById("jspane").style.display="none";
		document.getElementById("urlpane").style.display="block";
		document.getElementById("url").value=url;
		document.getElementById("urlclose").onclick=function(){document.getElementById("urlpane").style.display="none";};
		document.getElementById("urljump").onclick=function(){location.href=document.getElementById("url").value;};
	};
	this.Export=function(){
		ExportJs(this.GetJson());
	};
	this.Load=function(obj){
		document.getElementById("loading").style.display="block";
		this.New();
		this.child[0].Move(obj[0].x,obj[0].y);
		for(var i=1;i<obj.length;++i){
			var o=obj[i];
			if(!o.type) o.type=o.t;
			if(!o.name) o.name=o.n;
			if(!o.params) o.params=o.p;
			if(!o.connect) o.connect=o.c;
			if(!o.type){
				var n;
				for(n=o.name.length-1;n>=0;--n)
					if(!(o.name[n]=="_"||(o.name[n]>="0"&&o.name[n]<="9")))
						break;
				o.type=o.name.substring(0,n+1);
			}
			o.n=graph.AddNode(o.type,o.name,o.x,o.y);
		}
		for(var i=1;i<obj.length;++i){
			var o=obj[i];
			if(Array.isArray(o.params)){
				for(var j=0;j<o.params.length;++j){
					var p=o.params[j];
					if(!p.name) p.name=p.n;
					if(!p.type) p.type=p.t;
					if(!p.value) p.value=p.v;
					for(var k=0;k<o.n.child.length;++k){
						if(o.n.child[k].name==o.params[j].name){
							o.n.child[k].SetEdit(o.params[j].value);
						}
					}
				}
			}
			else if(o.params){
				for(var j in o.params){
					for(var k=0;k<o.n.child.length;++k){
						if(o.n.child[k].name==j)
							o.n.child[k].SetEdit(o.params[j]);
					}
				}
			}
			else if(o.type=="knob"){
				if(typeof(o.min)=="number")
					o.n.params[0].SetEdit(o.min);
				if(typeof(o.max)=="number")
					o.n.params[1].SetEdit(o.max);
				if(typeof(o.step)=="number")
					o.n.params[2].SetEdit(o.step);
				if(typeof(o.value)=="number")
					o.n.params[3].SetEdit(o.value);
			}
		}
		for(var i=1;i<obj.length;++i){
			var o=obj[i];
			if(o.connect){
				for(var j=0;j<o.connect.length;++j){
					var t=o.connect[j];
					if(t.t){
						var co=t.o,ci=t.i;
						if(!t.o) co=0;
						if(!t.i) ci=0;
						o.n.Connect(graph.Find(t.t),co,ci);
					}
					else{
						o.n.Connect(graph.Find(t),0,0);
					}
				}
			}
		}
		for(var i=graph.child.length-1;i>=0;--i){
			var n=graph.child[i];
			for(j=n.params.length-1;j>=0;--j){
				var p=n.params[j];
				if(p.subtype=="kno")
					p.Set.bind(p.edit)();
			}
		}
		graph.Redraw();
		document.getElementById("loading").style.display="none";
	};
	this.Find=function(name){
		var s=name.split(".");
		for(var i=0;i<this.child.length;++i){
			var n=this.child[i];
			if(s[0]==n.name){
				if(s.length>1){
					var p=n.child;
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
	this.AddNode=function(subtype,name,x,y){
		var node=new ANode(this,subtype,name,x,y,this.actx,this.dest);
		this.child.push(node);
		return node;
	};
	this.GetNextName=function(type){
		var n=1;
		for(;;){
			var nam=type+n;
			for(var i=0;i<this.child.length;++i){
				var t=this.child[i].name;
				var p=t.indexOf("_");
				if(p>=0)
					t=t.substring(0,p);
				if(nam==t)
					break;
			}
			if(i==this.child.length)
				return nam;
			++n;
		}
	};
	this.Redraw=function(){
		var kmode;
		this.ctx.fillStyle="#346";
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
		this.ctx.lineWidth=2;
		for(var i=0;i<this.child.length;++i){
			var node=this.child[i];
			if(node.conn.length){
				kmode=0;
				if(node.subtype=="kno"||node.subtype=="key"||node.subtype=="fun"||node.subtype=="aut")
					kmode=1;
				this.ctx.beginPath();
				for(var j=node.conn.length-1;j>=0;--j){
					var c=node.conn[j];
					var pos=c.o.GetPos();
					pos.x+=c.o.w*.5;
					pos.y+=c.o.h*.5;
					var post=c.t.GetPos();
					post.x+=c.t.w*.5;
					post.y+=c.t.h*.5;
					this.ctx.moveTo(pos.x,pos.y);
					if(kmode)
						this.ctx.bezierCurveTo(pos.x,pos.y-50,post.x+50,post.y,post.x,post.y);
					else
						this.ctx.bezierCurveTo(pos.x+50,pos.y,post.x-50,post.y,post.x,post.y);
				}
				if(kmode)
					this.ctx.strokeStyle="#abf";
				else
					this.ctx.strokeStyle="#6f6";
				this.ctx.stroke();
			}
		}
		if(this.dragging&&this.dragging.type=="conn"){
			var target=graph.HitTest(mouseX,mouseY);
			if(this.dragging!=target){
				var pos=this.dragging.GetPos();
				pos.x+=this.dragging.w*.5;
				pos.y+=this.dragging.h*.5;
				this.ctx.beginPath();
				this.ctx.moveTo(pos.x,pos.y);
				switch(this.dragging.subtype){
				case "si":
					this.ctx.strokeStyle="#6f6";
					this.ctx.bezierCurveTo(pos.x-50,pos.y,mouseX+50,mouseY,mouseX,mouseY);
					break;
				case "so":
					this.ctx.strokeStyle="#6f6";
					this.ctx.bezierCurveTo(pos.x+50,pos.y,mouseX-50,mouseY,mouseX,mouseY);
					break;
				case "ki":
					this.ctx.strokeStyle="#ccf";
					this.ctx.bezierCurveTo(pos.x+50,pos.y,mouseX,mouseY-50,mouseX,mouseY);
					break;
				case "ko":
					this.ctx.strokeStyle="#ccf";
					this.ctx.bezierCurveTo(pos.x,pos.y-50,mouseX+50,mouseY,mouseX,mouseY);
					break;
				}
				this.ctx.lineTo(mouseX,mouseY);
				this.ctx.stroke();
			}
		}
	};
	this.New=function(){
		while(this.child.length>1){
			this.DelNode(this.child[1]);
		}
		this.Redraw();
	};
	this.DelNode=function(node){
		for(var i=this.child.length-1;i>=0;--i){
			var n=this.child[i];
			for(var j=n.conn.length-1;j>=0;--j){
				var c=n.conn[j];
				if(c.t.parent.parent==node)
					n.conn.splice(j,1);
			}
		}
		for(var i=this.child.length-1;i>=0;--i){
			if(this.child[i]==node){
				this.base.removeChild(node.elem);
				this.child.splice(i,1);
			}
		}
		if(node.node){
			node.node.disconnect(0);
			if(node.subtype=="spl")
				node.node.disconnect(1);
			if(node.node.stop)
				node.node.stop(0);
		}
	}
	this.DisconnectNode=function(node){
		node.conn.length=0;
		if(node.node)
			node.node.disconnect();
		if(node.subtype=="spl")
			if(node.node)
				node.node.disconnect(1);
		this.Redraw();
	};
	this.DisconnectWire=function(target){
		if(target.subtype=="so"){
			var node=target.parent.parent;
			for(var i=node.conn.length-1;i>=0;--i){
				var c=node.conn[i];
				if(c.o==target)
					node.conn.splice(i,1);
			}
			if(node.node)
				node.node.disconnect(target.ch);
		}
		if(target.subtype=="si"){
			for(var i=this.child.length-1;i>=0;--i){
				var n=this.child[i];
				for(var j=n.conn.length-1;j>=0;--j){
					var c=n.conn[j];
					if(c.t==target){
						n.conn.splice(j,1);
						if(n.node){
							n.node.disconnect(c.o.ch);
						}
					}
				}
			}
			graph.Reconnect();
		}
		if(target.subtype=="ko"){
			var node=target.parent.parent;
			node.conn.length=0;
		}
		if(target.subtype=="ki"){
			for(var i=this.child.length-1;i>=0;--i){
				var n=this.child[i];
				for(var j=n.conn.length-1;j>=0;--j){
					var c=n.conn[j];
					if(c.t==target)
						n.conn.splice(j,1);
				}
			}
		}
		this.Redraw();
	};
/*	this.SetupParam=function(node){
		if(node.node){
			for(var i=node.child.length-1;i>=0;--i){
				var p=node.child[i];
				if(p.type=="param"){
					node.node[p.name].value=p.value;
				}
			}
		}
	};
*/	this.ResetGraph=function(){
		for(var i=this.child.length-1;i>0;--i){
			var node=this.child[i];
			if(node.node){
				if(node.node.stop)
					node.node.stop(0);
				node.node.disconnect();
				if(node.subtype=="spl")
					node.node.disconnect(1);
				node.node=null;
			}
		}
	};
	this.Reconnect=function(){
		for(var i=1;i<this.child.length;++i){
			var node=this.child[i];
			for(var j=0;j<node.conn.length;++j){
				var c=node.conn[j];
				if(c.t.parent.parent.node){
					switch(c.t.parent.type){
					case "io":
						if(node.node)
							node.node.connect(c.t.parent.parent.node,c.o.ch,c.t.ch);
						break;
					case "param":
						if(node.node)
							node.node.connect(c.t.parent.parent.node[c.t.parent.name],c.o.ch);
						break;
					}
				}
			}
		}
	};
	this.Resize=function(){
		graph.canvas.width=graph.w=window.innerWidth;
		graph.canvas.height=graph.h=window.innerHeight-55;
		graph.Redraw("Rename");
	};
	this.Rename=function(node){
		var nam=prompt("rename");
		if(nam===null)
			return;
		node.name=this.GetNextName(node.subtype)+"_"+nam;
		node.child[0].elem.childNodes[0].nodeValue=nam;
/*		document.getElementById("renametext").value=node.name;
		var dlg=document.getElementById("renamedialog");
		console.log(dlg.show);

		document.getElementById("renamedialog").showModal();
		document.getElementById("renameok").onclick=function(){
			document.getElementById("renamedialog").close();
		};
		document.getElementById("renamecancel").onclick=function(){
			document.getElementById("renamedialog").close();
		};
*/
	};
}
Graph.prototype.HitTest=HitTest;
Graph.prototype.GetPos=GetPos;

function MenuClear(){
	document.getElementById("menugraph").style.display="none";
	document.getElementById("menunode").style.display="none";
	document.getElementById("menuctrl").style.display="none";
	document.getElementById("popup").style.display="none";
	document.getElementById("popup2").style.display="none";
	document.getElementById("text").style.display="none";
	graph.inputfocus=null;
}
function MenuClick(e){
	switch(e.target.id){
	case "playbtn":
		Play();
		return;
	case "menunodebtn":
		var node=document.getElementById("menunode");
		var c=node.style.display;
		MenuClear();
		node.style.display=(c=="block")?"none":"block";
		return;
	case "menugraphbtn":
		var node=document.getElementById("menugraph");
		var c=node.style.display;
		MenuClear();
		node.style.display=(c=="block")?"none":"block";
		return;
	case "menuctrlbtn":
		var node=document.getElementById("menuctrl");
		var c=node.style.display;
		MenuClear();
		node.style.display=(c=="block")?"none":"block";
		return;
	case "menuaboutbtn":
		graph.About();
		MenuClear();
		return;
	case "newgraph":
		graph.New();
		MenuClear();
		return;
	case "export":
		graph.Export();
		MenuClear();
		break;
	case "link":
		graph.Link();
		MenuClear();
		break;
	case "addauto":
		graph.AddNode("aut",null,500,300);
		MenuClear();
		break;
	case "addfunc":
		graph.AddNode("fun",null,500,300);
		MenuClear();
		break;
	case "addkeyb":
		graph.AddNode("key",null,500,300);
		MenuClear();
		break;
	case "addknob":
		graph.AddNode("kno",null,500,300);
		MenuClear();
		break;
	case "addseq":
		graph.AddNode("seq",null,500,300);
		MenuClear();
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
		graph.AddNode(e.target.id.substr(3,3),null,500,300);
		MenuClear();
		return;
	case "delnode":
		graph.DelNode(graph.focus.parent.parent);
		MenuClear();
		graph.Redraw();
		return;
	case "disnode":
		graph.DisconnectNode(graph.focus.parent.parent);
		MenuClear();
		graph.Redraw();
		return;
	case "diswire":
		graph.DisconnectWire(graph.focus);
		MenuClear();
		graph.Redraw();
		return;
	case "rename":
		MenuClear();
		graph.Rename(graph.focus.parent.parent);
		graph.Redraw();
		return;
	}
}
function MouseDown(e){
	var rc=graph.base.getBoundingClientRect();
	mouseX=Math.floor(e.clientX-rc.left);
	mouseY=Math.floor(e.clientY-rc.top);
	graph.dragging=graph.HitTest(mouseX,mouseY);
	if(graph.dragging){
		var pos=graph.dragging.GetPos();
		graph.dragoffset={x:pos.x-mouseX,y:pos.y-mouseY};
	}
	document.activeElement.blur();
	MenuClear();
	graph.lx=graph.ly=0;
}
function MouseMove(e){
	var rc=graph.base.getBoundingClientRect();
	mouseX=Math.floor(e.clientX-rc.left);
	mouseY=Math.floor(e.clientY-rc.top);
	var target=graph.HitTest(mouseX,mouseY);
	var markok=document.getElementById("connokmark").style;
	var markng=document.getElementById("connngmark").style;
	if(target&&target!=graph.dragging&&target.type=="conn"){
		if(graph.dragging==null
				||graph.dragging.subtype=="so"&&target.subtype=="si"
				||graph.dragging.subtype=="si"&&target.subtype=="so"
				||graph.dragging.subtype=="ko"&&target.subtype=="ki"
				||graph.dragging.subtype=="ki"&&target.subtype=="ko"){
			var p=target.GetPos();
			markok.display="block";
			markok.left=(p.x-2)+"px";
			markok.top=(p.y-2)+"px";
			markng.display="none";
		}
		else if(graph.dragging.type=="conn"){
			var p=target.GetPos();
			markng.display="block";
			markng.left=(p.x-2)+"px";
			markng.top=(p.y-2)+"px";
			markok.display="none";
		}
	}
	else{
		markok.display="none";
		markng.display="none";
	}
	if(graph.dragging){
		if(graph.dragging==graph){
			var dx=mouseX+graph.dragoffset.x;
			var dy=mouseY+graph.dragoffset.y;
			for(var i=graph.child.length-1;i>=0;--i){
				var node=graph.child[i];
				node.Move(node.x+dx-graph.lx,node.y+dy-graph.ly);
			}
			graph.lx=dx,graph.ly=dy;
		}
		if(graph.dragging.type=="title")
			graph.dragging.parent.Move(mouseX+graph.dragoffset.x,mouseY+graph.dragoffset.y);
		graph.Redraw();
	}
	if(e.target.className!="edit")
		e.preventDefault();
}
function MouseUp(e){
	var rc=graph.base.getBoundingClientRect();
	mouseX=Math.floor(e.clientX-rc.left);
	mouseY=Math.floor(e.clientY-rc.top);
	var target=graph.HitTest(mouseX,mouseY);
	if(target){
		if(target==graph.dragging){
			switch(target.type){
			case "nodebtn":
				var b=document.getElementById("popup");
				b.style.display="block";
				var pos=target.GetPos();
				b.style.top=(pos.y+10)+"px";
				b.style.left=(pos.x+10)+"px";
				graph.focus=target;
				break;
			case "conn":
				var b=document.getElementById("popup2");
				b.style.display="block";
				var pos=target.GetPos();
				b.style.top=(pos.y+10)+"px";
				b.style.left=(pos.x+10)+"px";
				graph.focus=target;
				break;
			case "param":
				switch(target.subtype){
				case "ts":
					var e=document.getElementById("text");
					e.value=target.value;
					var pos=target.GetPos();
					e.style.display="block";
					e.style.left=pos.x+"px";
					e.style.top=(pos.y+70)+"px";
					e.style.width="400px";
					e.style.height="200px";
//					e.addEventListener("change",function(){target.value=e.value;target.parent.SetupParam()});
					e.onchange=function(){
						target.value=e.value;
						target.parent.SetupParam();
					};
					break;
				case "tp":
					var e=document.getElementById("text");
					e.value=target.value;
					var pos=target.GetPos();
					e.style.display="block";
					e.style.left=pos.x+"px";
					e.style.top=(pos.y+70)+"px";
					e.style.width="200px";
					e.style.height="100px";
//					e.addEventListener("change",function(){target.value=e.value;target.parent.SetupParam()});
					e.onchange=function(){
						target.value=e.value;
						target.parent.SetupParam();
					};
					break;
				case "tc":
					var e=document.getElementById("text");
					e.value=target.value;
					var pos=target.GetPos();
					e.style.display="block";
					e.style.left=pos.x+"px";
					e.style.top=(pos.y+80)+"px";
					e.style.width="200px";
					e.style.height="200px";
					e.onchange=function(){target.value=e.value;target.parent.SetupParam()};
					break;
				}
				break;
			}
		}
		if(graph.dragging){
			var fr=graph.dragging.type+graph.dragging.subtype;
			var to=target.type+target.subtype;
			if(fr=="connso"&&to=="connsi"){
				graph.dragging.parent.parent.Connect(target,graph.dragging.ch,target.ch);
				graph.Reconnect();
			}
			if(fr=="connsi"&&to=="connso"){
				target.parent.parent.Connect(graph.dragging,target.ch,graph.dragging.ch);
				graph.Reconnect();
			}
			if(fr=="connko"&&to=="connki"){
				graph.dragging.parent.parent.Connect(target,graph.dragging.ch,target.ch);
			}
			if(fr=="connki"&&to=="connko"){
				target.parent.parent.Connect(graph.dragging,target.ch,graph.dragging.ch);
			}
		}
	}
	graph.dragging=null;
	graph.Redraw();
}

function Play(){
	var isplay=false;
	for(var i=graph.child.length-1;i>=0;--i){
		var node=graph.child[i];
		if(node.play&&node.play.press){
			isplay=true;
			break;
		}
	}
	if(isplay){
		for(var i=graph.child.length-1;i>=0;--i){
			var node=graph.child[i];
			if(node.play&&node.play.press)
				node.play.Press(false);
		}
	}
	else{
		for(var i=graph.child.length-1;i>=0;--i){
			var node=graph.child[i];
			if(node.play){
				if(!node.play.press)
					node.play.Press(true);
			}
		}
		graph.Reconnect();
	}
}
function Init(){
	AudioContext=window.AudioContext||window.webkitAudioContext;
	audioctx=new AudioContext();
	graph=new Graph(document.getElementById("cv"),audioctx,audioctx.destination);
	document.getElementById("base").addEventListener("mousedown",MouseDown);
	document.getElementById("base").addEventListener("mousemove",MouseMove);
	document.getElementById("base").addEventListener("mouseup",MouseUp);
	window.addEventListener("resize",graph.Resize);
	graph.Resize();
	var vars=document.location.search.substring(1).split("&");
	patch=null;
	for(var i=0;i<vars.length;++i){
		var l=vars[i].split("=");
		if(l[0]=="p"){
			patch=l[1].replace(/\+/g," ");
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
		patch=eval(decodeURIComponent(patch));
		graph.Load(patch);
	}
	else
		graph.Load(defaultpatch);
}
