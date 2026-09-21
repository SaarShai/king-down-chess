/** The sixteen existing character designs, without alternate pawn/knight sculpt poses. */
export const CAST = [
 {key:'pawn',label:'Pawn',type:'pawn',code:1,feature:'Army colour throughout',accent:0xdcc9a2},
 {key:'knight',label:'Knight',type:'knight',code:2,feature:'Helmet crest',accent:0xb84939},
 {key:'bishop',label:'Bishop',type:'bishop',code:3,feature:'Mitre',accent:0x92567e},
 {key:'rook',label:'Rook',type:'rook',code:4,feature:'Tower crown',accent:0xb27851},
 {key:'queen',label:'Queen',type:'queen',code:5,feature:'Crown',accent:0xb76487},
 {key:'guard',label:'Guard',type:'guard',code:9,feature:'Shoulder plates',accent:0x5082ab},
 {key:'archer',label:'Archer',type:'archer',code:7,feature:'Hood',accent:0x718b3c},
 {key:'paladin',label:'Paladin',type:'paladin',code:8,feature:'Raised chest cross',accent:0xc69744},
 {key:'maester',label:'Maester',type:'maester',code:10,feature:'Goggle frame',accent:0x56a5a6},
 {key:'beast',label:'Beast',type:'beast',code:11,feature:'Muzzle harness',accent:0xa96140},
 {key:'king-ember',label:'Ember King',type:'king',code:6,feature:'Cracked chest armour',accent:0xc16b44},
 {key:'king-frost',label:'Frost King',type:'king',code:6,feature:'Raised ice gauntlet',accent:0x67a6bf},
 {key:'king-gaya',label:'Gaya King',type:'king',code:6,feature:'Rhino pauldron',accent:0x7b9b53},
 {key:'king-celestial',label:'Celestial King',type:'king',code:6,feature:'Crown',accent:0xd0ad55},
 {key:'king-shadow',label:'Shadow King',type:'king',code:6,feature:'Sword',accent:0x8067a4},
 {key:'king-spirit',label:'Spirit King',type:'king',code:6,feature:'Clasped hands',accent:0x68aaa3},
] as const;
export const character = (key:string) => CAST.find(c=>c.key===key)!;
export const defaultCharacter = (type:string) => type==='king'?'king-frost':type;
