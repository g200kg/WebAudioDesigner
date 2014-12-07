WebAudioDesigner
================

WebAudioAPI GUI design tool

![](images/webaudiodesigner.png)

Available at :
[https://g200kg.github.io/WebAudioDesigner](https://g200kg.github.io/WebAudioDesigner)

## Usage
#### Menu

Menu                              |Description
---                               |---
Play                              |Start all Oscillators and BufferSources
Graph - New Graph                 |Clear current graph
Graph - Export as JavaScript file |Export as simple JavaScript code
Graph - Link to this graph        |Display a URL that contain current graph
Add Node - (Node type)            |Add specified node
Add Knob                          |Add knobs that controls parameter values
About                             |Display info

#### Adding node
Select from menu "Add Node".

#### Adding knob
Select from menu "Add Knob".

#### Deleting node or knob
Select node/knob's pop-up menu "Delete" that will be appear when clicking node's upper left or knob's lower left corner orange square.

#### Make Connection
There are two types of connection, signals (green) and knob to parameter controls (light blue).
Connections are made with dragging between appropreate connectors that are represented as semi-circles.

Signals : 
* connect "out" to "in".
* or connect "out" to parameters (AudioParam) that has green connectors.

Controls :
* knobs to number type parameters that has light-blue connectors.

#### Delete Connection
* Click each connector, then select "Disconnection" from popup menu.
* Click node's popup menu (orange square) and select "Disconnect". This will disconnect all connection from this node.

## Sample patch

[Delay](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:%27destination%27,x:694,y:116,p:%7B%7D,c:%5B%5D%7D,%7Bn:%27gain1%27,x:572,y:199,p:%7B%7D,c:%5B%7Bt:%27destination%27%7D%5D%7D,%7Bn:%27bufsrc1%27,x:65,y:172,p:%7B%27loop%27:true,%27buffer%27:%27loop.wav%27%7D,c:%5B%7Bt:%27delay1%27%7D,%7Bt:%27gain1%27%7D%5D%7D,%7Bn:%27delay1%27,x:314,y:311,p:%7B%27delayTime%27:0.25%7D,c:%5B%7Bt:%27gain2%27%7D,%7Bt:%27gain3%27%7D%5D%7D,%7Bn:%27gain2%27,x:488,y:384,p:%7B%27gain%27:0.5%7D,c:%5B%7Bt:%27gain1%27%7D%5D%7D,%7Bn:%27gain3%27,x:299,y:463,p:%7B%27gain%27:0.5%7D,c:%5B%7Bt:%27delay1%27%7D%5D%7D%5D)

[Chorus](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:%27destination%27,x:694,y:116,p:%7B%7D,c:%5B%5D%7D,%7Bn:%27gain1%27,x:509,y:140,p:%7B%7D,c:%5B%7Bt:%27destination%27%7D%5D%7D,%7Bn:%27bufsrc1%27,x:65,y:172,p:%7B%27loop%27:true,%27buffer%27:%27loop.wav%27%7D,c:%5B%7Bt:%27delay1%27%7D,%7Bt:%27gain1%27%7D%5D%7D,%7Bn:%27delay1%27,x:365,y:247,p:%7B%27delayTime%27:0.02%7D,c:%5B%7Bt:%27gain1%27%7D%5D%7D,%7Bn:%27gain3%27,x:270,y:412,p:%7B%27gain%27:0.002%7D,c:%5B%7Bt:%27delay1.delayTime%27%7D%5D%7D,%7Bn:%27osc1%27,x:99,y:345,p:%7B%27frequency%27:1.5%7D,c:%5B%7Bt:%27gain3%27%7D%5D%7D%5D)

[Phaser](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:%27destination%27,x:962,y:139,p:%7B%7D,c:%5B%5D%7D,%7Bn:%27gain1%27,x:825,y:101,p:%7B%7D,c:%5B%7Bt:%27destination%27%7D%5D%7D,%7Bn:%27bufsrc1%27,x:68,y:97,p:%7B%27loop%27:true,%27buffer%27:%27loop.wav%27%7D,c:%5B%7Bt:%27filt1%27%7D,%7Bt:%27gain1%27%7D%5D%7D,%7Bn:%27osc1%27,x:52,y:435,p:%7B%27frequency%27:3%7D,c:%5B%7Bt:%27gain2%27%7D%5D%7D,%7Bn:%27filt1%27,x:266,y:285,p:%7B%27type%27:%27allpass%27,%27frequency%27:1000%7D,c:%5B%7Bt:%27filt2%27%7D%5D%7D,%7Bn:%27filt2%27,x:426,y:263,p:%7B%27type%27:%27allpass%27,%27frequency%27:1000%7D,c:%5B%7Bt:%27filt3%27%7D%5D%7D,%7Bn:%27gain2%27,x:263,y:561,p:%7B%27gain%27:500%7D,c:%5B%7Bt:%27filt1.frequency%27%7D,%7Bt:%27filt2.frequency%27%7D,%7Bt:%27filt3.frequency%27%7D,%7Bt:%27filt4.frequency%27%7D%5D%7D,%7Bn:%27filt3%27,x:581,y:237,p:%7B%27type%27:%27allpass%27,%27frequency%27:1000%7D,c:%5B%7Bt:%27filt4%27%7D%5D%7D,%7Bn:%27filt4%27,x:735,y:221,p:%7B%27type%27:%27allpass%27,%27frequency%27:1000%7D,c:%5B%7Bt:%27gain1%27%7D%5D%7D%5D)

[FSU](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:%27destination%27,x:568,y:205,p:%7B%7D,c:%5B%5D%7D,%7Bn:%27bufsrc1%27,x:85,y:178,p:%7B%27loop%27:true,%27buffer%27:%27loop.wav%27%7D,c:%5B%7Bt:%27delay1%27%7D%5D%7D,%7Bn:%27delay1%27,x:396,y:154,p:%7B%7D,c:%5B%7Bt:%27destination%27%7D%5D%7D,%7Bn:%27osc1%27,x:81,y:392,p:%7B%27type%27:%27sawtooth%27,%27frequency%27:0.5%7D,c:%5B%7Bt:%27shaper1%27%7D%5D%7D,%7Bn:%27shaper1%27,x:276,y:347,p:%7B%27curve%27:%27new%20Float32Array(%5B%5Cn%5Cn0,%5Cn0,%5Cn0.1,%5Cn0.1,%5Cn0,%5Cn0,%5Cn0.3,%5Cn0.3,%5Cn0.2,%5Cn0.2,%5Cn0.4,%5Cn0.4,%5Cn0.2,%5Cn0.2,%5Cn%5Cn%5D)%27%7D,c:%5B%7Bt:%27delay1.delayTime%27%7D%5D%7D%5D)

[Wah with knob controls](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:'destination',x:584,y:157,p:%7B%7D,c:%5B%5D%7D,%7Bn:'bufsrc1',x:91,y:142,p:%7B'loop':true,'buffer':'loop.wav'%7D,c:%5B%7Bt:'filt1'%7D%5D%7D,%7Bn:'filt1',x:357,y:208,p:%7B'frequency':1000,Q:20%7D,c:%5B%7Bt:'comp1'%7D%5D%7D,%7Bn:'osc1',x:52,y:369,p:%7B'frequency':0.8%7D,c:%5B%7Bt:'gain1'%7D%5D%7D,%7Bn:'gain1',x:219,y:347,p:%7B'gain':398%7D,c:%5B%7Bt:'filt1.frequency'%7D%5D%7D,%7Bn:'comp1',x:504,y:279,p:%7B%7D,c:%5B%7Bt:'destination'%7D%5D%7D,%7Bn:'knob1',x:262,y:502,'min':0,'max':10,'step':0.1,'value':0.8,c:%5B%7Bt:'osc1.frequency'%7D%5D%7D,%7Bn:'knob2',x:353,y:501,'min':0,'max':1000,'step':1,'value':398,c:%5B%7Bt:'gain1.gain'%7D%5D%7D%5D)

[AutoPan with knob controls](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:'destination',x:708,y:115,p:%7B%7D,c:%5B%5D%7D,%7Bn:'bufsrc1',x:48,y:114,p:%7B'loop':true,'buffer':'loop.wav'%7D,c:%5B%7Bt:'split1'%7D%5D%7D,%7Bn:'split1',x:245,y:202,p:%7B%7D,c:%5B%7Bt:'gain1'%7D,%7Bt:'gain2',o:1%7D%5D%7D,%7Bn:'gain1',x:446,y:169,p:%7B'gain':0.5%7D,c:%5B%7Bt:'merge1'%7D%5D%7D,%7Bn:'gain2',x:445,y:252,p:%7B'gain':0.5%7D,c:%5B%7Bt:'merge1',i:1%7D%5D%7D,%7Bn:'merge1',x:595,y:201,p:%7B%7D,c:%5B%7Bt:'destination'%7D%5D%7D,%7Bn:'osc1',x:75,y:340,p:%7B'frequency':0.21%7D,c:%5B%7Bt:'gain4'%7D,%7Bt:'gain3'%7D%5D%7D,%7Bn:'gain3',x:238,y:294,p:%7B'gain':-0.5%7D,c:%5B%7Bt:'gain1.gain'%7D%5D%7D,%7Bn:'gain4',x:240,y:382,p:%7B'gain':0.5%7D,c:%5B%7Bt:'gain2.gain'%7D%5D%7D,%7Bn:'knob1',x:164,y:499,'min':0.1,'max':3,'step':0.01,'value':0.21,c:%5B%7Bt:'osc1.frequency'%7D%5D%7D%5D)

[MediaElementSource and Tone Control](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:'destination',x:603,y:49,p:%7B%7D,c:%5B%5D%7D,%7Bn:'elemsrc1',x:11,y:72,p:%7B'url':'http://www.g200kg.com/music/kerokeroshiyouyo.mp3'%7D,c:%5B%7Bt:'filt1'%7D%5D%7D,%7Bn:'knob1',x:222,y:322,'min':-20,'max':20,'step':1,'value':7,c:%5B%7Bt:'filt1.gain'%7D%5D%7D,%7Bn:'knob2',x:354,y:321,'min':-20,'max':20,'step':1,'value':-1,c:%5B%7Bt:'filt2.gain'%7D%5D%7D,%7Bn:'filt1',x:103,y:170,p:%7B'type':'lowshelf','frequency':200,'gain':7%7D,c:%5B%7Bt:'filt2'%7D%5D%7D,%7Bn:'filt2',x:253,y:143,p:%7B'type':'peaking','frequency':1000,Q:0.5,'gain':-1%7D,c:%5B%7Bt:'filt3'%7D%5D%7D,%7Bn:'filt3',x:408,y:126,p:%7B'type':'highshelf','frequency':5000,'gain':4%7D,c:%5B%7Bt:'comp1'%7D%5D%7D,%7Bn:'knob3',x:482,y:320,'min':-20,'max':20,'step':1,'value':4,c:%5B%7Bt:'filt3.gain'%7D%5D%7D,%7Bn:'comp1',x:572,y:108,p:%7B%7D,c:%5B%7Bt:'destination'%7D%5D%7D%5D)

[Vocoder voice](http://g200kg.github.io/WebAudioDesigner/?p=%5B%7Bn:'destination',x:1055,y:485,p:%7B%7D,c:%5B%5D%7D,%7Bn:'bufsrc1',x:28,y:69,p:%7B'loop':true,'buffer':'voice.mp3'%7D,c:%5B%7Bt:'filt1'%7D,%7Bt:'filt2'%7D,%7Bt:'filt3'%7D,%7Bt:'filt4'%7D,%7Bt:'filt9'%7D,%7Bt:'filt10'%7D%5D%7D,%7Bn:'filt1',x:237,y:74,p:%7B'type':'bandpass','frequency':220,Q:8%7D,c:%5B%7Bt:'shaper1'%7D%5D%7D,%7Bn:'filt2',x:236,y:153,p:%7B'type':'bandpass','frequency':440,Q:8%7D,c:%5B%7Bt:'shaper2'%7D%5D%7D,%7Bn:'filt3',x:237,y:233,p:%7B'type':'bandpass','frequency':660,Q:8%7D,c:%5B%7Bt:'shaper3'%7D%5D%7D,%7Bn:'filt4',x:237,y:313,p:%7B'type':'bandpass','frequency':880,Q:8%7D,c:%5B%7Bt:'shaper4'%7D%5D%7D,%7Bn:'shaper1',x:400,y:74,p:%7B'curve':'new%20Float32Array(%5B%5Cn1,0,1%5Cn%5D)'%7D,c:%5B%7Bt:'filt5'%7D%5D%7D,%7Bn:'shaper2',x:399,y:155,p:%7B'curve':'new%20Float32Array(%5B%5Cn1,0,1%5Cn%5D)'%7D,c:%5B%7Bt:'filt6'%7D%5D%7D,%7Bn:'shaper3',x:401,y:233,p:%7B'curve':'new%20Float32Array(%5B%5Cn1,0,1%5Cn%5D)'%7D,c:%5B%7Bt:'filt7'%7D%5D%7D,%7Bn:'shaper4',x:400,y:312,p:%7B'curve':'new%20Float32Array(%5B%5Cn1,0,1%5Cn%5D)'%7D,c:%5B%7Bt:'filt8'%7D%5D%7D,%7Bn:'filt5',x:581,y:74,p:%7B'frequency':50%7D,c:%5B%7Bt:'gain1.gain'%7D%5D%7D,%7Bn:'filt6',x:581,y:155,p:%7B'frequency':50%7D,c:%5B%7Bt:'gain2.gain'%7D%5D%7D,%7Bn:'filt7',x:581,y:237,p:%7B'frequency':50%7D,c:%5B%7Bt:'gain3.gain'%7D%5D%7D,%7Bn:'filt8',x:580,y:317,p:%7B'frequency':50%7D,c:%5B%7Bt:'gain4.gain'%7D%5D%7D,%7Bn:'gain1',x:877,y:335,p:%7B'gain':0%7D,c:%5B%7Bt:'gain7'%7D%5D%7D,%7Bn:'gain2',x:877,y:381,p:%7B'gain':0%7D,c:%5B%7Bt:'gain7'%7D%5D%7D,%7Bn:'gain3',x:882,y:421,p:%7B'gain':0%7D,c:%5B%7Bt:'gain7'%7D%5D%7D,%7Bn:'gain4',x:878,y:463,p:%7B'gain':0%7D,c:%5B%7Bt:'gain7'%7D%5D%7D,%7Bn:'osc1',x:735,y:25,p:%7B'frequency':220%7D,c:%5B%7Bt:'gain1'%7D%5D%7D,%7Bn:'osc2',x:737,y:132,p:%7B%7D,c:%5B%7Bt:'gain2'%7D%5D%7D,%7Bn:'osc3',x:904,y:27,p:%7B'frequency':660%7D,c:%5B%7Bt:'gain3'%7D%5D%7D,%7Bn:'osc4',x:905,y:135,p:%7B'frequency':880%7D,c:%5B%7Bt:'gain4'%7D%5D%7D,%7Bn:'filt9',x:240,y:390,p:%7B'type':'bandpass','frequency':1100,Q:8%7D,c:%5B%7Bt:'shaper5'%7D%5D%7D,%7Bn:'filt10',x:238,y:468,p:%7B'type':'bandpass','frequency':1320,Q:8%7D,c:%5B%7Bt:'shaper6'%7D%5D%7D,%7Bn:'shaper5',x:397,y:395,p:%7B'curve':'new%20Float32Array(%5B%5Cn1,0,1%5Cn%5D)'%7D,c:%5B%7Bt:'filt12'%7D%5D%7D,%7Bn:'shaper6',x:394,y:472,p:%7B'curve':'new%20Float32Array(%5B%5Cn1,0,1%5Cn%5D)'%7D,c:%5B%7Bt:'filt13'%7D%5D%7D,%7Bn:'filt12',x:580,y:400,p:%7B'frequency':50%7D,c:%5B%7Bt:'gain5.gain'%7D%5D%7D,%7Bn:'filt13',x:583,y:481,p:%7B'frequency':50%7D,c:%5B%7Bt:'gain6.gain'%7D%5D%7D,%7Bn:'gain5',x:879,y:502,p:%7B'gain':0%7D,c:%5B%7Bt:'gain7'%7D%5D%7D,%7Bn:'gain6',x:880,y:554,p:%7B'gain':0%7D,c:%5B%7Bt:'gain7'%7D%5D%7D,%7Bn:'osc5',x:1062,y:24,p:%7B'frequency':1100%7D,c:%5B%7Bt:'gain5'%7D%5D%7D,%7Bn:'osc6',x:1065,y:137,p:%7B'frequency':1320%7D,c:%5B%7Bt:'gain6'%7D%5D%7D,%7Bn:'gain7',x:1059,y:394,p:%7B'gain':4%7D,c:%5B%7Bt:'destination'%7D%5D%7D%5D)

## License
Licensed under [MIT License](LICENSE) except Impulse Response files (included in samples/ir folder).  
Inpulse Response files are Licensed under [Voxengo's license](samples/ir/IMreverbs1/license.txt).  
