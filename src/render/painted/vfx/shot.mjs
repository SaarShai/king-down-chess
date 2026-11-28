// The Archer's shot as data: the default timeline of fx-shot.mjs. A skin (vfx/<name>.mjs) changes it with data only.
// Times: ms on the attack's clock from the track's beat (release: the painted release; contact: the arrow lands).
// toMs 'flight': until the contact. Sizes: board units (1 unit = 1 CSS px on a 960 px board).
// phoneBoost: smaller boards get thicker marks, (960 / board CSS px) ^ phoneBoost, at most 1.6. minCssPx: the thinnest stroke.
// The 'victim' track is the struck figure's warm-white hit-flash; 'punch' is the board's damped kick along the shot.
// Reduced motion drops both (fx-shot.mjs).
export default {
 id:'shot',
 minCssPx:1.3,
 phoneBoost:.45,
 arrow:{scale:3.4,fat:1.8,rim:'#fff1c2'},
 tracks:[
 {id:'charge',type:'star',beat:'release',anchor:'arrow',fromMs:-260,toMs:50,size:[4,24],spin:0.004,colours:{edge:'rgba(110,62,6,.85)',core:'#ffe7a0'}},
 {id:'motes',type:'particle',beat:'release',anchor:'arrow',fromMs:-320,toMs:0,count:16,lifeMs:[140,240],speed:[0.17,0.27],aim:'gather',spread:6.28,size:[1.1,2.1],colours:['#fff6d2','#ffcf55','#f0a020'],outline:'rgba(96,54,6,.55)',gravity:0,shape:'dot'},
 {id:'smear',type:'arc',beat:'release',anchor:'arrow',fromMs:0,toMs:110,radius:[10,30],sweep:2.0,width:5,colours:{edge:'rgba(90,50,6,.5)',core:'#fff0b8'}},
 {id:'ribbon',type:'ribbon',beat:'release',anchor:'arrow',to:'impact',fromMs:0,toMs:250,fadeMs:50,maxLength:120,width:7,tailWidth:1.5,strands:2,wobble:3,colours:{edge:'rgba(84,42,2,.8)',mid:'#f0a024',core:'#fffbea'}},
 {id:'bolt',type:'sprite',sprite:'bolt',beat:'release',anchor:'arrow',to:'impact',fromMs:0,toMs:'flight',tint:null,trail:{copies:2,stepMs:12,alpha:[0.45,0.2]}},
 {id:'puff',type:'particle',beat:'release',anchor:'arrow',fromMs:0,count:8,lifeMs:[140,260],speed:[0.03,0.1],aim:'against',spread:1.8,size:[1.6,3],colours:['#f6eed6','#dccca4'],outline:'rgba(120,100,70,.35)',gravity:-0.0002,shape:'dot'},
 {id:'flash',type:'sprite',sprite:'flash',beat:'contact',anchor:'impact',fromMs:0,toMs:90,size:80,colour:'#fff0b8',alpha:[[0,1],[1,0]]},
 {id:'burst',type:'wedge',beat:'contact',anchor:'impact',fromMs:0,toMs:140,length:62,spread:2.3,aim:'against',colours:{edge:'rgba(96,52,4,.75)',core:'#fff5cf'}},
 {id:'ring',type:'ring',beat:'contact',anchor:'impact',fromMs:0,toMs:230,radius:[8,70],squash:0.5,width:5,colours:{edge:'rgba(90,50,6,.6)',core:'#fff3cf'}},
 {id:'sparks',type:'particle',beat:'contact',anchor:'impact',fromMs:0,count:18,lifeMs:[200,380],speed:[0.18,0.5],aim:'against',spread:2.6,size:[1,1.7],colours:['#fffbe6','#ffd56b','#f29a2a'],outline:'rgba(90,46,4,.6)',gravity:0.0007,shape:'streak'},
 {id:'splinters',type:'particle',beat:'contact',anchor:'impact',fromMs:0,count:9,lifeMs:[260,420],speed:[0.1,0.26],aim:'along',spread:1.9,size:[1,1.6],colours:['#6b3f18','#3a2410','#c98a3a'],gravity:0.0011,shape:'streak'},
 {id:'dust',type:'particle',beat:'contact',anchor:'foot',fromMs:20,count:9,lifeMs:[260,440],speed:[0.04,0.1],aim:'along',spread:2.8,size:[3,5.5],colours:['rgba(196,180,146,.85)','rgba(170,152,118,.8)'],gravity:-0.00012,shape:'dot'},
 {id:'hitflash',type:'victim',beat:'contact',fromMs:0,toMs:140,flash:.9,colour:'#fff8e6'},
 {id:'punch',type:'punch',beat:'contact',fromMs:0,toMs:220,px:3,peakMs:28},
 ],
};
