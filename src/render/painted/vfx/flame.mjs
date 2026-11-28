// Flame Shot: a skin of the shot. The same beats and anchors, new colours, a tinted bolt and one added ember track.
// A skin names its base in `extends`; a track with a known id changes that track, a new id adds one (fx-shot.mjs).
export default {
 id:'flame',
 extends:'shot',
 arrow:{scale:3.4,fat:1.8,rim:'#ffcf70'},
 tracks:[
  {id:'charge',colours:{edge:'rgba(110,22,2,.85)',core:'#ffd27a'}},
  {id:'motes',colours:['#fff0b0','#ff9a2e','#e2401a'],outline:'rgba(90,18,2,.6)'},
  {id:'smear',colours:{edge:'rgba(100,20,2,.5)',core:'#ffd07a'}},
  {id:'ribbon',width:6.5,colours:{edge:'rgba(70,10,0,.75)',mid:'#e8501c',core:'#ffe9a8'}},
  {id:'bolt',tint:{colour:'#ff6a1f',amount:.35}},
  {id:'puff',colours:['#5a4a40','#3e322c'],outline:null},
  {id:'flash',colour:'#ffb36a'},
  {id:'burst',colours:{edge:'rgba(100,16,0,.8)',core:'#ffd98a'}},
  {id:'ring',colours:{edge:'rgba(100,16,0,.65)',core:'#ffb347'}},
  {id:'sparks',colours:['#fff0b0','#ff9a2e','#e2401a'],outline:'rgba(90,18,2,.6)'},
  {id:'hitflash',colour:'#ffe2b8'},
  {id:'embers',type:'particle',beat:'contact',anchor:'impact',fromMs:40,count:12,lifeMs:[360,560],speed:[.03,.08],aim:'up',spread:2.2,size:[1.1,1.8],colours:['#ffcf6a','#ff7a2a'],outline:'rgba(80,14,0,.5)',gravity:-.0002,shape:'dot'},
 ],
};
