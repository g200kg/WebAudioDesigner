
function WADEngine(graph,actx,dest){
	this.usekey=false;
	this.actx=actx;
	if(!actx)
		this.actx=new AudioContext();
	if(!dest)
		this.dest=this.actx.destination;
	this.nodes={};
	function Find(eng,name){
		if(name=="destination")
			return eng.dest;
		var n=name.split(".");
		if(n.length==1)
			return eng.nodes[n[0]];
		return eng.nodes[n[0]][n[1]];
	}
	function Func(){
		this.vars=[0,0];
		this.c=[];
		this.func=function(x,y){
			return 440*Math.pow(2,(x+y-69)/12);
		};
		this.type="fun";
		this.connect=function(target,o,i){
			o=o?1:0;
			i=i?1:0;
			this.c.push([target,o,i]);
		};
		this.set=function(x,n){
			this.vars[n]=x;
			var y=this.func(this.vars[0],this.vars[1]);
			for(var i=0;i<this.c.length;++i){
				var c=this.c[i];
				if(c[0].set)
					c[0].set(y,c[2]);
				else if(typeof(c[0].value)=="number")
					c[0].value=y;
				else
					c[0]=y;
			}
		};
	}
	function Key(id){
		this.c=[];
		this.type="key";
		this.elem=document.getElementById(id);
		this.elem.addEventListener("change",function(e){
			for(var i=this.c.length-1;i>=0;--i){
				var c=this.c[i];
				var x=e.note[1-c[1]];
				if(c[0].set)
					c[0].set(x,c[2]);
				else if(typeof(c[0].value)=="number")
					c[0].value=x;
				else
					c[0]=x;
			}
		}.bind(this));
		this.connect=function(target,o,i){
			o=o?1:0;
			i=i?1:0;
			this.c.push([target,o,i]);
		};
		this.start=function(){

		};
	}
	function Knob(id){
		this.c=[];
		this.type="kno";
		this.elem=document.getElementById(id);
		this.elem.addEventListener("change",function(e){
			for(var i=this.c.length-1;i>=0;--i){
				var c=this.c[i];
				if(c[0].set)
					c[0].set(e.target.value,c[2]);
				else if(typeof(c[0].value)=="number")
					c[0].value=e.target.value;
				else
					c[0]=e.target.value;
			}
		}.bind(this));
		this.connect=function(target,o,i){
			o=o?1:0;
			i=i?1:0;
			this.c.push([target,o,i]);
		};
	}
	this.Setup=function(node,param){
		if(param){
			for(i in param){
				var p=param[i];
				if(i=="func")
					node[i]=eval("(function (x,y){return "+p+"})");
				else if(typeof(node[i].value)=="number")
					node[i].value=p;
				else
					node[i]=p;
			}
		}
	};
	this.start=function(){
		for(var i=0;i<graph.length;++i){
			switch(graph[i].n.substr(0,3)){
			case "key": this.usekey=true; break;
			}
		}
		if(this.usekey){

		}
		for(var i=0;i<graph.length;++i){
			var node=graph[i];
			switch(node.n.substr(0,3)){
			case "osc": this.Setup(this.nodes[node.n]=this.actx.createOscillator(),node.p); break;
			case "buf":	this.Setup(this.nodes[node.n]=this.actx.createBufferSource(),node.p); break;
			case "str":	this.Setup(this.nodes[node.n]=this.actx.createMediaStreamSource(),node.p); break;
			case "ele":	this.Setup(this.nodes[node.n]=this.actx.createMediaElementSource(),node.p); break;
			case "gai":	this.Setup(this.nodes[node.n]=this.actx.createGain(),node.p); break;
			case "fil":	this.Setup(this.nodes[node.n]=this.actx.createBiquadFilter(),node.p); break;
			case "del":	this.Setup(this.nodes[node.n]=this.actx.createDelay(),node.p); break;
			case "pan":	this.Setup(this.nodes[node.n]=this.actx.createPanner(),node.p); break;
			case "com":	this.Setup(this.nodes[node.n]=this.actx.createDynamicsCompressor(),node.p); break;
			case "sha":	this.Setup(this.nodes[node.n]=this.actx.createWaveShaper(),node.p); break;
			case "con":	this.Setup(this.nodes[node.n]=this.actx.createConvolver(),node.p); break;
			case "scr":	this.Setup(this.nodes[node.n]=this.actx.createScriptProcessor(2048,2,2),node.p); break;
			case "ana":	this.Setup(this.nodes[node.n]=this.actx.createAnalyser(),node.p); break;
			case "spl":	this.Setup(this.nodes[node.n]=this.actx.createChannelSplitter(),node.p); break;
			case "mer":	this.Setup(this.nodes[node.n]=this.actx.createChannelMerger(),node.p); break;
			case "fun":	this.Setup(this.nodes[node.n]=new Func(),node.p); break;
			case "key":	this.nodes[node.n]=new Key(node.n); break;
			case "kno":	this.nodes[node.n]=new Knob(node.n); break;
			}
		}
		for(var i=0;i<graph.length;++i){
			var node=graph[i];
			if(node.c){
				for(var j=node.c.length-1;j>=0;--j){
					var conn=node.c[j];
					var co=ci=0;
					if(conn.t){
						ci=conn.i,co=conn.o;
						ci=ci?1:0;
						co=co?1:0;
						conn=conn.t;
					}
					if(ci)
						this.nodes[node.n].connect(Find(this,conn),co,ci);
					else
						this.nodes[node.n].connect(Find(this,conn),co);
				}
			}
		}
		for(var i in this.nodes){
			if(this.nodes[i].start)
				this.nodes[i].start(0);
		}
	}.bind(this);
}
