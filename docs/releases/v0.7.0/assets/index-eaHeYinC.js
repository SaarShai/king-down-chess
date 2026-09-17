(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=Object.freeze({archerChecks:!0,beastChains:!0,guardImmune:!0,guardCaptures:`none`,guardStep:1,guardDoubleFirst:`off`,guardNoSecondRank:!1,guardCaptureLimit:0,archerMove:`any`,archerShots:`classic`,beastMove:`any`,beastCapture:`adjacent`,beastCaptureForward:!1,maesterLongSwap:!0,maesterKingSwapAnywhere:!1,maesterSwapAny:!1,maesterSwapEnemy:!1,maesterStep:1,paladinKamikaze:`nonPawn`,paladinChecks:!1,paladinReturn:!1,paladinJumpsFriends:!0,paladinBlockedByEnemies:!0,secondPlayerDoubleFirstTurn:!1,bishopsOppositeColours:!0,promotionSet:`anyNonKingNoGuard`,fiftyMove:!0,threefold:!0,insufficientMaterial:!0}),t={...e},n=Object.freeze({...e,archerMove:`ortho`,beastMove:`forward`,paladinKamikaze:`always`,promotionSet:`anyNonKing`}),r=Object.freeze({...n,archerMove:`fwdBack`,archerShots:`forward3`,beastMove:`diagFwdBack`,beastCapture:`diagForward`});function i(n){return Object.assign(t,e,n),t}var a=` PNBRQKALGMS`,o=[``,`pawn`,`knight`,`bishop`,`rook`,`queen`,`king`,`archer`,`paladin`,`guard`,`maester`,`beast`],s=[5,4,3,2,7,8,9,10,11],c={anyNonKing:s,standard:[5,4,3,2],anyNonKingNoFairy:[5,4,3,2],anyNonKingNoGuard:s.filter(e=>e!==9)},l=(e,t)=>e|t<<4,u=e=>e&15,d=e=>e>>4&1,f=e=>e&7,p=e=>e>>3,m=(e,t)=>t<<3|e,h=e=>`abcdefgh`[f(e)]+(p(e)+1),g=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],_=g.slice(0,4),v=g.slice(4),y=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],b=[[1,1],[1,-1],[-1,1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]],x=[-2,-1,0,1,2].flatMap(e=>[-2,-1,0,1,2].filter(t=>Math.max(Math.abs(e),Math.abs(t))===2).map(t=>[e,t])),S={classic:b,plusDiag2:[...b,[2,2],[2,-2],[-2,2],[-2,-2]],ring2:[...v,...x],forward3:[[1,1],[-1,1],[0,2]]},C=S.forward3.map(([e,t])=>[e,-t]),w=e=>t.archerShots===`forward3`&&e===1?C:S[t.archerShots],T=[[0,1],[0,-1]],E=[[[1,1],[-1,1]],[[1,-1],[-1,-1]]];function D(e,t,n){let r=f(e)+t,i=p(e)+n;return r<0||r>7||i<0||i>7?-1:m(r,i)}var O=e=>e===0?1:-1,k=(e,n)=>!t.guardNoSecondRank||u(e)!==9||p(n)!==(d(e)===0?1:6),A=(e,t)=>Math.max(Math.abs(f(e)-f(t)),Math.abs(p(e)-p(t)));function j(e,n){let r=u(e);return r===9&&(t.guardCaptures===`none`||t.guardCaptures===`pawns`&&n!==1)||r===9&&t.guardCaptureLimit&&e&32?!1:n===9&&t.guardImmune?r===6:n!==6||(r!==8||t.paladinChecks)&&(t.archerChecks||r!==7)}function ee(e,t){return e.indexOf(l(6,t))}function M(e,t,n,r,i,a,o){for(let[s,c]of i){let i=D(t,s,c);if(i<0)continue;let l=e[i];l?d(l)!==n&&j(r,u(l))&&o.push({from:t,to:i,captures:[i]}):a===`all`&&o.push({from:t,to:i,captures:[]})}}function te(e,t,n,r,i,a,o){for(let[s,c]of i)for(let i=D(t,s,c);i>=0;i=D(i,s,c)){let s=e[i];if(!s){a===`all`&&o.push({from:t,to:i,captures:[]});continue}d(s)!==n&&j(r,u(s))&&o.push({from:t,to:i,captures:[i]});break}}function ne(e,n,r,i){let a=e[n],o=d(a);switch(u(a)){case 1:{let a=O(o),s=o===0?1:6,l=o===0?7:0,f=(e,r)=>{if(p(e)===l)for(let a of c[t.promotionSet])i.push({from:n,to:e,captures:r,promo:a});else i.push({from:n,to:e,captures:r})};if(r===`all`){let t=D(n,0,a);if(t>=0&&!e[t]){f(t,[]);let r=D(n,0,2*a);p(n)===s&&r>=0&&!e[r]&&i.push({from:n,to:r,captures:[]})}}for(let t of[-1,1]){let r=D(n,t,a);r>=0&&e[r]&&d(e[r])!==o&&j(1,u(e[r]))&&f(r,[r])}return}case 2:return M(e,n,o,a,y,r,i);case 6:return M(e,n,o,a,g,r,i);case 9:{let s=i.length;M(e,n,o,a,g,r,i);let c=t.guardDoubleFirst!==`off`&&p(n)===(o===0?0:7);if((t.guardStep===2||c)&&r===`all`)for(let[r,a]of g){let o=D(n,r,a);if(o<0||e[o]&&!(c&&t.guardDoubleFirst===`leap`))continue;let s=D(o,r,a);s>=0&&!e[s]&&i.push({from:n,to:s,captures:[]})}if(t.guardNoSecondRank)for(let e=i.length-1;e>=s;e--)k(a,i[e].to)||i.splice(e,1);return}case 3:return te(e,n,o,a,v,r,i);case 4:return te(e,n,o,a,_,r,i);case 5:return te(e,n,o,a,g,r,i);case 7:{let a=t.archerMove===`any`?g:t.archerMove===`fwdBack`?T:_;if(r===`all`)for(let[t,r]of a){let a=D(n,t,r);a>=0&&!e[a]&&i.push({from:n,to:a,captures:[]})}for(let[t,r]of w(o)){let a=D(n,t,r);a>=0&&e[a]&&d(e[a])!==o&&j(7,u(e[a]))&&i.push({from:n,to:n,captures:[a]})}return}case 8:for(let[a,s]of g)for(let c=D(n,a,s);c>=0;c=D(c,a,s)){let a=e[c];if(!a){r===`all`&&i.push({from:n,to:c,captures:[]});continue}if(d(a)===o){if(t.paladinJumpsFriends)continue;break}if(j(8,u(a))){if(t.paladinReturn)i.push({from:n,to:n,captures:[c]});else{let e={from:n,to:c,captures:[c]};(t.paladinKamikaze===`always`||t.paladinKamikaze===`nonPawn`&&u(a)!==1)&&(e.selfRemove=!0),i.push(e)}}if(t.paladinBlockedByEnemies)break}return;case 10:{for(let[a,s]of g){let c=D(n,a,s);if(c<0)continue;let l=e[c];l?d(l)===o?r===`all`&&k(l,n)&&i.push({from:n,to:c,captures:[],swap:!0}):(j(10,u(l))&&i.push({from:n,to:c,captures:[c]}),r===`all`&&t.maesterSwapEnemy&&u(l)!==6&&i.push({from:n,to:c,captures:[],swap:!0})):r===`all`&&i.push({from:n,to:c,captures:[]})}if(t.maesterStep===2&&r===`all`)for(let[t,r]of g){let a=D(n,t,r);if(a<0||e[a])continue;let o=D(a,t,r);o>=0&&!e[o]&&i.push({from:n,to:o,captures:[]})}if(r===`all`&&t.maesterSwapAny)for(let t=0;t<64;t++){let r=e[t];r&&d(r)===o&&u(r)!==6&&A(n,t)>1&&k(r,n)&&i.push({from:n,to:t,captures:[],swap:!0})}let a=o===0?0:7,s=e=>t.maesterKingSwapAnywhere||p(e)===a;if(r===`all`&&t.maesterLongSwap&&s(n)){let t=ee(e,o);t>=0&&s(t)&&A(t,n)>1&&i.push({from:n,to:t,captures:[],swap:!0})}return}case 11:{let a=O(o),s=t.beastMove===`any`?g:t.beastMove===`diagFwdBack`?v:[[0,a]];if(r===`all`)for(let[t,r]of s){let a=D(n,t,r);a>=0&&!e[a]&&i.push({from:n,to:a,captures:[]})}let c=t.beastCapture===`diagForward`?E[o]:g,l=null,f=(s,p)=>{for(let[m,h]of c){if(t.beastCapture===`adjacent`&&m===0&&h===a&&!t.beastCaptureForward)continue;let c=D(s,m,h);if(c<0)continue;let g=(l??e)[c];if(!g||d(g)===o)continue;let _=u(g);if(!j(11,_)||p.length>0&&_===6)continue;let v=[...p,c];i.push({from:n,to:c,captures:v}),r!==`attacks`&&_!==6&&t.beastChains&&(l??=new Uint8Array(e),l[c]=0,f(c,v),l[c]=g)}};f(n,[]);return}}}function N(e,n){return n.promo?l(n.promo,d(e)):t.guardCaptureLimit&&n.captures.length>0&&u(e)===9?e|32:e}function re(e,n){let r=new Uint8Array(e.board),i=r[n.from],a=r[n.to];for(let e of n.captures)r[e]=0;r[n.from]=n.swap?a:0,r[n.to]=n.selfRemove?0:N(i,n);let o=n.captures.length>0||u(i)===1;return{board:r,turn:t.secondPlayerDoubleFirstTurn&&e.ply===1?e.turn:e.turn^1,halfmove:o?0:e.halfmove+1,ply:e.ply+1}}function ie(e,n,r){return t.beastCapture===`diagForward`?e!==0&&n===-O(r):t.beastCaptureForward||e!==0||n!==-O(r)}function ae(e,n,r){let i=e[n]?u(e[n]):0,a=(t,n)=>{let a=e[t];return a!==0&&d(a)===r&&u(a)===n&&(i===0||j(a,i))};for(let[e,t]of y){let r=D(n,e,t);if(r>=0&&a(r,2))return!0}for(let[i,o]of g){let s=D(n,i,o);if(!(s<0)&&(a(s,6)||a(s,10)||t.guardCaptures!==`none`&&a(s,9)&&k(e[s],n)||a(s,11)&&ie(i,o,r)))return!0}for(let e of[-1,1]){let t=D(n,e,-O(r));if(t>=0&&a(t,1))return!0}for(let[e,t]of w(r)){let r=D(n,-e,-t);if(r>=0&&a(r,7))return!0}for(let a=0;a<8;a++){let[o,s]=g[a],c=a<4?4:3,l=!1,f=!1;for(let a=D(n,o,s);a>=0;a=D(a,o,s)){let n=e[a];if(!n)continue;if(d(n)!==r){if(t.paladinBlockedByEnemies)break;l=!0;continue}let o=u(n);if(!l&&(o===c||o===5)&&(i===0||j(n,i))||!f&&o===8&&(i===0||j(n,i)))return!0;l=!0,t.paladinJumpsFriends||(f=!0)}}return!1}function oe(e,t=e.turn){let n=ee(e.board,t);return n>=0&&ae(e.board,n,t^1)}function P(e,t=`all`){let n=[];for(let r=0;r<64;r++)e.board[r]&&d(e.board[r])===e.turn&&ne(e.board,r,t,n);return n}function se(e,n=`all`){let r=t.secondPlayerDoubleFirstTurn&&e.ply===1;return P(e,n).filter(t=>{let n=re(e,t);return!oe(n,e.turn)&&(!r||!oe(n,e.turn^1))})}function F(e){let n=[0,0];for(let r=0;r<64;r++){let i=e[r];if(!i)continue;let a=u(i);if(a===1||a===4||a===5||a===7||a===10||a===11||a===9&&t.guardCaptures===`any`||a===8&&t.paladinChecks)return!1;(a===2||a===3)&&n[d(i)]++}return n[0]<=1&&n[1]<=1}function ce(e){return se(e).length===0?oe(e)?`checkmate`:`stalemate`:t.fiftyMove&&e.halfmove>=100?`draw50`:t.insufficientMaterial&&F(e.board)?`drawMaterial`:`playing`}var le=`QLRRBBNNAAGMMSS`,ue=`RNBQKBNR`;function de(e,t){for(let n=e.length-1;n>0;n--){let r=Math.floor(t()*(n+1));[e[n],e[r]]=[e[r],e[n]]}return e}function fe(e=Math.random){for(;;){let n=de([...de(le.split(``),e).slice(0,7),`K`],e),r=n.flatMap((e,t)=>e===`B`?[t]:[]);if(!(t.bishopsOppositeColours&&r.length===2&&(r[0]+r[1])%2==0))return n.join(``)}}function pe(e=fe()){if(!/^[A-Z]{8}$/.test(e)||e.split(`K`).length!==2)throw Error(`bad back rank ${e}`);let t=new Uint8Array(64);for(let n=0;n<8;n++){let r=a.indexOf(e[n]);if(r<=0)throw Error(`bad piece letter ${e[n]}`);t[m(n,0)]=l(r,0),t[m(n,7)]=l(r,1),t[m(n,1)]=l(1,0),t[m(n,6)]=l(1,1)}return{board:t,turn:0,halfmove:0,ply:0}}function me(e){let t=[];for(let n=7;n>=0;n--){let r=``,i=0;for(let t=0;t<8;t++){let o=e.board[m(t,n)];if(!o){i++;continue}i&&=(r+=i,0);let s=o&32?`H`:a[u(o)];r+=d(o)===0?s:s.toLowerCase()}i&&(r+=i),t.push(r)}return`${t.join(`/`)} ${e.turn===0?`w`:`b`} - - ${e.halfmove} ${Math.floor(e.ply/2)+1}`}function he(e){let[t,n=`w`,,,r=`0`,i=`1`]=e.trim().split(/\s+/),o=new Uint8Array(64),s=t.split(`/`);if(s.length!==8)throw Error(`bad FEN ${e}`);s.forEach((t,n)=>{let r=0;for(let i of t){if(/\d/.test(i)){r+=+i;continue}let t=i.toUpperCase(),s=t===`H`?32:0,c=s?9:a.indexOf(t);if(c<=0||r>7)throw Error(`bad FEN ${e}`);o[m(r++,7-n)]=l(c,i===t?0:1)|s}});let c=n===`w`?0:1;return{board:o,turn:c,halfmove:+r,ply:(i-1)*2+c}}function ge(e,t){let n=u(e.board[t.from]),r=n===1?``:a[n],i;return i=t.swap?`${r}${h(t.from)}<>${h(t.to)}`:t.to===t.from?`${r}${h(t.from)}*${h(t.captures[0])}`:t.captures.length>1?`${r}${h(t.from)}${t.captures.map(e=>`x`+h(e)).join(``)}`:`${r}${h(t.from)}${t.captures.length?`x`:`-`}${h(t.to)}`,t.promo&&(i+=`=`+a[t.promo]),i}var _e=`full`,ve=`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`,ye=1408,be=16384,xe=4096,I=new Int16Array(ye*32),Se=new Int16Array(32),Ce=new Int16Array(64),we=0,L=new Int32Array(32),Te=new Int32Array(32);function R(e,t){for(let e=0;e<32;e++)L[e]=Se[e],Te[e]=Se[e];for(let n=0;n<64;n++){let r=e[n];if(!r)continue;let i=(r&15)-1,a=(r>>4&1)===t?0:11,o=t===0?n:n^56,s=(a+i<<6|o)*32;for(let e=0;e<32;e++)L[e]+=I[s+e];s=(11-a+i<<6|o^56)*32;for(let e=0;e<32;e++)Te[e]+=I[s+e]}let n=we*be;for(let e=0;e<32;e++){let t=L[e]<0?0:L[e]>16384?be:L[e],r=Te[e]<0?0:Te[e]>16384?be:Te[e];n+=t*Ce[e]+r*Ce[32+e]}return Math.round(n*400/(be*xe))}var z=45153;function Ee(e,t=`full`){let n=atob(e);if(n.length!==90306)throw Error(`net: blob is ${n.length} bytes, expected ${z*2}`);let r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);let i=new Int16Array(r.buffer),a=0;I.set(i.subarray(a,a+=ye*32)),Se.set(i.subarray(a,a+=32)),Ce.set(i.subarray(a,a+=64)),we=i[a],De=t}var De=`full`;Ee(ve,_e);var Oe=new Int32Array(12);Oe[1]=100,Oe[2]=316,Oe[3]=322,Oe[4]=449,Oe[5]=933,Oe[6]=0,Oe[7]=337,Oe[8]=326,Oe[9]=96,Oe[10]=320,Oe[11]=308;var ke={1:100,2:316,3:322,4:449,5:933,6:0,7:337,8:326,9:96,10:320,11:308};Object.freeze({P:100,N:316,B:322,R:449,Q:933,K:0,A:337,L:326,G:96,M:320,S:308});var Ae=Object.freeze({P:1,N:2,B:3,R:4,Q:5,K:6,A:7,L:8,G:9,M:10,S:11}),je=0,Me=new Int32Array(12);Me[3]=0,Me[4]=2,Me[5]=-1,Me[8]=1;var Ne=10,Pe=18,Fe=9,Ie=25,Le=5,Re=3,ze=[0,8,7],Be=5681,Ve=e=>{let t=new Int16Array(64);for(let n=0;n<8;n++)for(let r=0;r<8;r++)t[(7-n)*8+r]=e[n*8+r];return t},He=[];He[1]=Ve([0,0,0,0,0,0,0,0,108,101,95,95,95,95,101,108,48,53,49,52,52,49,53,48,32,16,14,15,15,14,16,32,24,11,-3,6,6,-3,11,24,26,12,3,-1,-1,3,12,26,20,3,-7,-7,-7,-7,3,20,0,-2,-1,4,4,-1,-2,0]),He[2]=Ve([-49,-35,-25,-25,-25,-25,-35,-49,-35,-15,1,6,6,1,-15,-35,-24,5,14,21,21,14,5,-24,-21,12,16,23,23,16,12,-21,-27,3,19,24,24,19,3,-27,-22,-3,11,10,10,11,-3,-22,-35,-15,-2,6,6,-2,-15,-35,-46,-33,-21,-10,-10,-21,-33,-46]),He[3]=Ve([-19,-11,-10,-10,-10,-10,-11,-19,-12,5,-2,0,0,-2,5,-12,-11,8,7,10,10,7,8,-11,-11,-2,7,13,13,7,-2,-11,-8,4,3,11,11,3,4,-8,-12,1,4,16,16,4,1,-12,-11,-4,5,0,0,5,-4,-11,-19,-4,-6,-6,-6,-6,-4,-19]),He[4]=Ve([-1,-1,0,4,4,0,-1,-1,8,13,15,16,16,15,13,8,2,0,1,3,3,1,0,2,0,1,1,2,2,1,1,0,-4,-2,-1,0,0,-1,-2,-4,-1,1,0,1,1,0,1,-1,-6,-1,0,0,0,0,-1,-6,-2,2,8,12,12,8,2,-2]),He[5]=Ve([-20,-10,-10,-6,-6,-10,-10,-20,-10,0,1,0,0,1,0,-10,-10,1,6,5,5,6,1,-10,-4,-1,3,6,6,3,-1,-4,-7,-4,5,3,3,5,-4,-7,-11,-3,1,7,7,1,-3,-11,-9,-1,2,2,2,2,-1,-9,-19,-5,-5,-2,-2,-5,-5,-19]),He[7]=Ve([0,5,10,12,12,10,5,0,5,15,23,26,26,23,15,5,9,23,31,35,35,31,23,9,11,27,29,34,34,29,27,11,9,22,33,31,31,33,22,9,4,20,21,20,20,21,20,4,4,10,9,15,15,9,10,4,-18,-7,0,-1,-1,0,-7,-18]),He[8]=Ve([-15,-15,-15,-15,-15,-15,-15,-15,-10,-10,-10,-10,-10,-10,-10,-10,-6,-6,-5,-6,-6,-5,-6,-6,0,-1,1,1,1,1,-1,0,2,3,7,5,5,7,3,2,3,11,11,11,11,11,11,3,5,11,12,15,15,12,11,5,7,12,13,14,14,13,12,7]),He[9]=Ve([-30,-30,-30,-30,-30,-30,-30,-30,-25,-25,-25,-25,-25,-25,-25,-25,-20,-20,-20,-20,-20,-20,-20,-20,-12,-13,-11,-14,-14,-11,-13,-12,-4,-5,-7,-7,-7,-7,-5,-4,-1,-2,5,5,5,5,-2,-1,-3,4,7,3,3,7,4,-3,9,5,11,-2,-2,11,5,9]),He[10]=Ve([-20,-15,-12,-10,-10,-12,-15,-20,-15,-8,-5,-1,-1,-5,-8,-15,-10,-1,4,7,7,4,-1,-10,-4,5,11,14,14,11,5,-4,1,8,14,21,21,14,8,1,3,10,10,15,15,10,10,3,10,4,3,6,6,3,4,10,0,2,-3,3,3,-3,2,0]),He[11]=Ve([5,9,12,14,14,12,9,5,13,24,29,33,33,29,24,13,10,25,30,35,35,30,25,10,5,18,27,34,34,27,18,5,4,14,22,30,30,22,14,4,-2,5,16,23,23,16,5,-2,-5,-5,4,4,4,4,-5,-5,-23,-14,-9,-10,-10,-9,-14,-23]);var Ue=Ve([-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-35,-35,-35,-35,-35,-35,-35,-35,-30,-30,-30,-30,-30,-30,-30,-30,-25,-25,-25,-26,-26,-25,-25,-25,-12,-16,-18,-22,-22,-18,-16,-12,0,1,-5,-16,-16,-5,1,0,12,13,-1,-5,-5,-1,13,12]),We=Ve([-40,-25,-15,-10,-10,-15,-25,-40,-25,-9,0,6,6,0,-9,-25,-14,1,13,21,21,13,1,-14,-9,9,22,21,21,22,9,-9,-10,7,19,17,17,19,7,-10,-14,0,12,17,17,12,0,-14,-24,-11,-1,2,2,-1,-11,-24,-38,-26,-19,-12,-12,-19,-26,-38]),Ge=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],Ke=(e,t,n)=>{let r=(e&7)+t,i=(e>>3)+n;return r<0||r>7||i<0||i>7?-1:i<<3|r};function qe(e,t,n,r){let i=n===3?4:0,a=n===4?4:8,o=0;for(let s=i;s<a;s++){let[i,a]=Ge[s];for(let s=Ke(t,i,a);s>=0;s=Ke(s,i,a)){let t=e[s];if(!t){o++;continue}if(n===8){if(d(t)===r)continue;o++;break}d(t)!==r&&o++;break}}return o*Me[n]}function Je(e,t,n){let r=n===0?1:-1,i=0;for(let a=0;a<8;a++){let[o,s]=Ge[a];if(o===0&&s===r)continue;let c=Ke(t,o,s);if(c<0)continue;let l=e[c];l&&d(l)!==n&&j(11,u(l))&&i++}return Math.min(i*Ne,Pe)}function Ye(e,t,n){let r=n===0?1:-1,i=0;for(let a=-1;a<=1;a++){let o=Ke(t,a,r);if(o<0)continue;let s=e[o];if(!s||d(s)!==n){i-=Re;continue}let c=u(s);i+=c===9?Ie:c===1?Fe:Le}return i}var Xe=(e,t)=>Math.max(Math.abs((e&7)-(t&7)),Math.abs((e>>3)-(t>>3))),Ze=[-1,-1],Qe=[];function $e(e,t){let n=0,r=0;Ze[0]=Ze[1]=-1,Qe.length=0;for(let t=0;t<64;t++){let i=e[t];if(!i)continue;let a=u(i),o=d(i);if(a===6){Ze[o]=t;continue}let s=Oe[a]+He[a][o===0?t:t^56];a!==1&&(r+=Oe[a]),a===3||a===4||a===5||a===8?s+=qe(e,t,a,o):a===11?s+=Je(e,t,o):a===10&&Qe.push(t),n+=o===0?s:-s}let i=Math.min(1,r/Be);for(let t=0;t<2;t++){let r=t,a=Ze[t];if(a<0)continue;let o=r===0?a:a^56,s=Ue[o]*i+We[o]*(1-i)+Ye(e,a,r)*i;for(let t=0;t<Qe.length;t++){let n=Qe[t];if(d(e[n])!==r)continue;let i=Xe(n,a);i<=2&&(s+=ze[i])}n+=r===0?s:-s}return Math.round(t===0?n:-n)+je}var et=`linear`,tt=(e,t)=>{if(et===`nnue`)return R(e,t);let n=$e(e,t);if(et===`linear`)return n;let r=R(e,t);return n+(r>150?150:r<-150?-150:r)},nt=`PNBRQALGMS`;function rt(){let e={},t={};for(let e of Object.keys(Ae))t[e]=Oe[Ae[e]];for(let t of nt)e[t]=[...He[Ae[t]]];return{values:t,pst:e,kingMg:[...Ue],kingEg:[...We],mob:{B:Me[3],R:Me[4],Q:Me[5],L:Me[8]},beastTarget:Ne,beastTargetMax:Pe,shield:{pawn:Fe,guard:Ie,other:Le,open:Re},maesterNearKing:[...ze],tempo:je,phaseMax:Be,evaluator:et}}rt();var it=2654435769,at=()=>(it^=it<<13,it^=it>>>17,it^=it<<5,it>>>0),ot=new Int32Array(3072),st=new Int32Array(3072),ct=ot.length/2,lt=(e,t)=>{for(let n=e;n<t;n++)ot[n]=at()|0,st[n]=at()&1048575};lt(0,ct);var ut=at()|0,dt=at()&1048575;lt(ct,ot.length);var ft=(e,t)=>(e&32?24:0)+d(e)*12+u(e)<<6|t,pt=(e,t)=>t*4294967296+(e>>>0);function mt(e,t,n){let r=0,i=0;for(let t=0;t<64;t++){let n=e[t];if(!n)continue;let a=ft(n,t);r^=ot[a],i^=st[a]}t&&(r^=ut,i^=dt),n[0]=r,n[1]=i}var ht=1e5,gt=99e3,_t=ht*2,vt=64,yt=8,bt=120,xt=new Uint8Array(64),St=0,Ct=0,wt=0,Tt=new Int32Array(2),Et=new Int32Array(2048),Dt=new Uint8Array(2048),Ot=0,kt=Array.from({length:74},()=>[]),At=Array.from({length:74},()=>new Int32Array(96)),jt=new Float64Array(74),Mt=new Int32Array(132),Nt=new Int32Array(4096),Pt=1<<17,Ft=131071,It=0,Lt=1,Rt=2,zt=new Float64Array(Pt),Bt=new Int32Array(Pt),Vt=new Int32Array(Pt),Ht=new Int32Array(Pt),Ut=0,Wt=!1,Gt=0,Kt=1,qt=[];function Jt(e,t){let n=xt[e];if(Et[Ot]=e,Dt[Ot]=n,Ot++,n){let t=ft(n,e);Ct^=ot[t],wt^=st[t]}if(t){let n=ft(t,e);Ct^=ot[n],wt^=st[n]}xt[e]=t}function Yt(e){let t=Ot,n=xt[e.from],r=xt[e.to];for(let t=0;t<e.captures.length;t++)Jt(e.captures[t],0);return Jt(e.from,e.swap?r:0),Jt(e.to,e.selfRemove?0:N(n,e)),Ct^=ut,wt^=dt,t}function Xt(e){for(;Ot>e;){Ot--;let e=Et[Ot],t=Dt[Ot],n=xt[e];if(n){let t=ft(n,e);Ct^=ot[t],wt^=st[t]}if(t){let n=ft(t,e);Ct^=ot[n],wt^=st[n]}xt[e]=t}Ct^=ut,wt^=dt}function Zt(e){let t=Ot,n=xt[e.from],r=xt[e.to];for(let t=0;t<e.captures.length;t++)Et[Ot]=e.captures[t],Dt[Ot]=xt[e.captures[t]],Ot++,xt[e.captures[t]]=0;return Et[Ot]=e.from,Dt[Ot]=n,Ot++,xt[e.from]=e.swap?r:0,Et[Ot]=e.to,Dt[Ot]=xt[e.to],Ot++,xt[e.to]=e.selfRemove?0:N(n,e),t}function Qt(e){for(;Ot>e;)Ot--,xt[Et[Ot]]=Dt[Ot]}var $t=e=>{let t=xt.indexOf(l(6,e));return t>=0&&ae(xt,t,e^1)};function en(e,t,n){e.length=0;for(let r=0;r<64;r++){let i=xt[r];i&&d(i)===t&&ne(xt,r,n,e)}let r=0;for(let n=0;n<e.length;n++){let i=e[n],a=Zt(i),o=!$t(t);Qt(a),o&&(e[r++]=i)}return e.length=r,e}function tn(e){let t=0;for(let n=0;n<e.captures.length;n++)t+=ke[u(xt[e.captures[n]])];return e.promo&&(t+=ke[e.promo]-ke[1]),e.selfRemove&&(t-=ke[u(xt[e.from])]),t}var nn=e=>(e.from|e.to<<6|(e.promo??0)<<12|Math.min(e.captures.length,15)<<16)+1;function rn(e,t,n){At[t].length<e.length&&(At[t]=new Int32Array(e.length*2));let r=At[t],i=Mt[t*2],a=Mt[t*2+1];for(let t=0;t<e.length;t++){let o=e[t],s=nn(o);s===n?r[t]=1<<28:o.captures.length||o.promo?r[t]=(1<<24)+tn(o)*16-ke[u(xt[o.from])]:s===i?r[t]=8388609:s===a?r[t]=1<<23:r[t]=Math.min(Nt[o.from<<6|o.to],(1<<22)-1)}return r}function an(e,t,n){let r=n;for(let i=n+1;i<e.length;i++)t[i]>t[r]&&(r=i);if(r===n)return;let i=e[n];e[n]=e[r],e[r]=i;let a=t[n];t[n]=t[r],t[r]=a}function on(e,t,n){for(let r=e-2;r>=0&&r>=e-t;r-=2)if(jt[r]===n)return!0;let r=qt.length;for(let i=r-1;i>=0&&i>=r-(t-e);i--)if(qt[i]===n)return!0;return!1}var sn=(e,t)=>e>=gt?e+t:e<=-99e3?e-t:e,cn=(e,t)=>e>=gt?e-t:e<=-99e3?e+t:e;function ln(e,t,n,r,i,a,o){let s=n<<2|i;zt[t]===e&&Ht[t]>>2>n&&i!==It||(zt[t]=e,Bt[t]=sn(r,o),Ht[t]=s,Vt[t]=a||Vt[t])}var un=()=>(!(++Ut&1023)&&performance.now()>Gt&&(Wt=!0),Wt);function dn(e,t,n,r){let i=St^n&1;if(un()||n>=72)return tt(xt,i);let a=$t(i),o;if(a)o=-2e5;else{if(o=tt(xt,i),o>=t||r===0)return o;o>e&&(e=o)}let s=en(kt[n],i,a?`all`:`captures`);if(a&&s.length===0)return-1e5+n;let c=rn(s,n,0),l=o;for(let i=0;i<s.length;i++){an(s,c,i);let u=s[i];if(!a&&l+tn(u)+bt<e)continue;let d=Yt(u),f=-dn(-t,-e,n+1,r-1);if(Xt(d),Wt||(f>o&&(o=f),f>e&&(e=f),e>=t))break}return o}function fn(e,t,n,r,i){let a=St^r&1;if(un()||r>=vt)return tt(xt,a);let o=pt(Ct,wt);if(i>=100||on(r,i,o))return 0;if(jt[r]=o,t<-1e5+r&&(t=-1e5+r),n>1e5-r-1&&(n=ht-r-1),t>=n)return t;let s=Ct&Ft,c=0;if(zt[s]===o){c=Vt[s];let i=Ht[s];if(i>>2>=e){let e=cn(Bt[s],r),a=i&3;if(a===It||a===Lt&&e>=n||a===Rt&&e<=t)return e}}let l=$t(a);if(l&&r<Kt*2&&e++,e<=0)return dn(t,n,r,yt);let d=en(kt[r],a,`all`);if(d.length===0)return l?-1e5+r:0;let f=rn(d,r,c),p=-2e5,m=0,h=Rt;for(let a=0;a<d.length;a++){an(d,f,a);let o=d[a],s=o.captures.length===0&&!o.promo,c=o.captures.length||u(xt[o.from])===1?0:i+1,l=Yt(o),g=-fn(e-1,a===0?-n:-t-1,-t,r+1,c);if(a>0&&g>t&&g<n&&(g=-fn(e-1,-n,-t,r+1,c)),Xt(l),Wt)return p===-2e5?t:p;if(g>p&&(p=g,m=nn(o)),g>t&&(t=g,h=It),t>=n){if(h=Lt,s){let t=nn(o);Mt[r*2]!==t&&(Mt[r*2+1]=Mt[r*2],Mt[r*2]=t),Nt[o.from<<6|o.to]+=e*e}break}}return ln(o,s,e,p,h,m,r),p}function pn(e,t={}){let n=t.timeMs??(t.maxDepth?1/0:1e3),r=performance.now(),i=Math.min(t.maxDepth??vt,56);Gt=r+n,xt.set(e.board),St=e.turn,mt(xt,e.turn,Tt),Ct=Tt[0],wt=Tt[1],Ot=0,Ut=0,Wt=!1,Kt=1,qt=t.history?t.history.map(Number):[],Mt.fill(0);for(let e=0;e<Nt.length;e++)Nt[e]>>=3;jt[0]=pt(Ct,wt);let a=t.multiPv===2,o=en(kt[0],e.turn,`all`),s={move:o[0]??null,score:0,depth:0,nodes:0};if(o.length===0)return s;let c=0;for(let t=1;t<=i;t++){Kt=t;let i=-2e5,l=-2e5,d=-1,f=-2e5;for(let n=0;n<o.length;n++){let r=o[n],s=r.captures.length||u(xt[r.from])===1?0:e.halfmove+1,c=Yt(r),p=-fn(t-1,a||n===0?-2e5:-f-1,a?_t:-f,1,s);if(!a&&n>0&&p>f&&(p=-fn(t-1,-2e5,-f,1,s)),Xt(c),Wt)break;p>i?(l=i,i=p,d=n):p>l&&(l=p),p>f&&(f=p)}if(d>=0&&(s.move=o[d],s.score=i,s.depth=t,a&&l>-2e5&&(s.second=l),o.unshift(...o.splice(d,1))),Wt||Math.abs(i)>=gt)break;let p=performance.now()-r;if(p+(p-c)*1.4>n||p>n*.75)break;c=p}return s.nodes=Ut,s}var mn=class{pos;backRank=``;history=[];status=`playing`;cache=null;seen=new Map;constructor(e){this.newGame(e)}newGame(e=fe()){this.backRank=e,this.pos=pe(e),this.history=[],this.seen.clear(),this.cache=null,this.update()}load(e){this.backRank=``,this.pos=e,this.history=[],this.seen.clear(),this.cache=null,this.update()}key(){return me(this.pos).split(` `,2).join(` `)}update(){this.seen.set(this.key(),(this.seen.get(this.key())??0)+1),this.setStatus()}setStatus(){let e=ce(this.pos);this.status=e===`playing`&&(this.seen.get(this.key())??1)>=3?`drawRepetition`:e}get legal(){return this.cache??=se(this.pos)}get inCheck(){return oe(this.pos)}play(e){this.history.push({pos:this.pos,move:e,lan:ge(this.pos,e)}),this.pos=re(this.pos,e),this.cache=null,this.update()}undo(){let e=this.history.pop();if(!e)return!1;let t=(this.seen.get(this.key())??1)-1;return t>0?this.seen.set(this.key(),t):this.seen.delete(this.key()),this.pos=e.pos,this.cache=null,this.setStatus(),!0}playLan(e){let t=0;for(let n of e){let e=this.legal.find(e=>ge(this.pos,e)===n);if(!e)break;this.play(e),t++}return t}},hn=class{worker=this.spawn();id=0;spawn(){try{let e=new Worker(new URL(new URL(`worker-CMvLmNQ1.js`,import.meta.url).href,``+import.meta.url),{type:`module`});return e.onerror=()=>{this.worker=null},e}catch{return null}}think(e,t){let n=++this.id,r=this.worker,i=()=>n===this.id;return r?new Promise(a=>{let o=e=>{e.data.id===n&&(clearTimeout(s),r.removeEventListener(`message`,o),i()&&a(e.data))},s=setTimeout(()=>{r.removeEventListener(`message`,o),i()&&(this.worker=null,a(pn(e,t)))},(t.timeMs??1e3)+2500);r.addEventListener(`message`,o),r.postMessage({id:n,pos:e,opts:t})}):new Promise(n=>setTimeout(()=>{i()&&n(pn(e,t))},30))}cancel(){this.worker?.terminate(),this.worker=this.spawn(),this.id++}},gn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},_n={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},vn=1e3,yn=1001,bn=1002,xn=1003,Sn=1004,Cn=1005,wn=1006,Tn=1007,En=1008,Dn=1009,On=1010,kn=1011,An=1012,jn=1013,Mn=1014,Nn=1015,Pn=1016,Fn=1017,In=1018,Ln=1020,Rn=35902,zn=35899,Bn=1021,Vn=1022,Hn=1023,Un=1026,Wn=1027,Gn=1028,Kn=1029,qn=1030,Jn=1031,Yn=1033,Xn=33776,Zn=33777,Qn=33778,$n=33779,er=35840,tr=35841,nr=35842,rr=35843,ir=36196,ar=37492,or=37496,sr=37488,cr=37489,lr=37490,ur=37491,dr=37808,fr=37809,pr=37810,mr=37811,hr=37812,gr=37813,_r=37814,vr=37815,yr=37816,br=37817,xr=37818,Sr=37819,Cr=37820,wr=37821,Tr=36492,Er=36494,Dr=36495,Or=36283,kr=36284,Ar=36285,jr=36286,Mr=2300,Nr=2301,Pr=2302,Fr=2303,Ir=2400,Lr=2401,Rr=2402,zr=3200,Br=`srgb`,Vr=`srgb-linear`,Hr=`linear`,Ur=`srgb`,Wr=7680,Gr=35044,Kr=35048,qr=2e3;function Jr(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function Yr(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Xr(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Zr(){let e=Xr(`canvas`);return e.style.display=`block`,e}var Qr={};function $r(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function ei(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function B(...e){e=ei(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function V(...e){e=ei(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function ti(...e){let t=e.join(` `);t in Qr||(Qr[t]=!0,B(...e))}function ni(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var ri={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},ii=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},ai=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),oi=1234567,si=Math.PI/180,ci=180/Math.PI;function li(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(ai[e&255]+ai[e>>8&255]+ai[e>>16&255]+ai[e>>24&255]+`-`+ai[t&255]+ai[t>>8&255]+`-`+ai[t>>16&15|64]+ai[t>>24&255]+`-`+ai[n&63|128]+ai[n>>8&255]+`-`+ai[n>>16&255]+ai[n>>24&255]+ai[r&255]+ai[r>>8&255]+ai[r>>16&255]+ai[r>>24&255]).toLowerCase()}function H(e,t,n){return Math.max(t,Math.min(n,e))}function ui(e,t){return(e%t+t)%t}function di(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function fi(e,t,n){return e===t?0:(n-e)/(t-e)}function pi(e,t,n){return(1-n)*e+n*t}function mi(e,t,n,r){return pi(e,t,1-Math.exp(-n*r))}function hi(e,t=1){return t-Math.abs(ui(e,t*2)-t)}function gi(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function _i(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function vi(e,t){return e+Math.floor(Math.random()*(t-e+1))}function yi(e,t){return e+Math.random()*(t-e)}function bi(e){return e*(.5-Math.random())}function xi(e){e!==void 0&&(oi=e);let t=oi+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Si(e){return e*si}function Ci(e){return e*ci}function wi(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function Ti(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Ei(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function Di(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:B(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Oi(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function U(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var ki={DEG2RAD:si,RAD2DEG:ci,generateUUID:li,clamp:H,euclideanModulo:ui,mapLinear:di,inverseLerp:fi,lerp:pi,damp:mi,pingpong:hi,smoothstep:gi,smootherstep:_i,randInt:vi,randFloat:yi,randFloatSpread:bi,seededRandom:xi,degToRad:Si,radToDeg:Ci,isPowerOfTwo:wi,ceilPowerOfTwo:Ti,floorPowerOfTwo:Ei,setQuaternionFromProperEuler:Di,normalize:U,denormalize:Oi},W=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=H(this.x,e.x,t.x),this.y=H(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=H(this.x,e,t),this.y=H(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(H(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(H(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ai=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:B(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(H(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Mi.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Mi.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=H(this.x,e.x,t.x),this.y=H(this.y,e.y,t.y),this.z=H(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=H(this.x,e,t),this.y=H(this.y,e,t),this.z=H(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(H(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ji.copy(this).projectOnVector(e),this.sub(ji)}reflect(e){return this.sub(ji.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(H(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ji=new G,Mi=new Ai,K=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return ti(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Ni.makeScale(e,t)),this}rotate(e){return ti(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Ni.makeRotation(-e)),this}translate(e,t){return ti(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Ni.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ni=new K,Pi=new K().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Fi=new K().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ii(){let e={enabled:!0,workingColorSpace:Vr,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=Li(e.r),e.g=Li(e.g),e.b=Li(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Ri(e.r),e.g=Ri(e.g),e.b=Ri(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?Hr:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return ti(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return ti(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[Vr]:{primaries:t,whitePoint:r,transfer:Hr,toXYZ:Pi,fromXYZ:Fi,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Br},outputColorSpaceConfig:{drawingBufferColorSpace:Br}},[Br]:{primaries:t,whitePoint:r,transfer:Ur,toXYZ:Pi,fromXYZ:Fi,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Br}}}),e}var q=Ii();function Li(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Ri(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var zi,Bi=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{zi===void 0&&(zi=Xr(`canvas`)),zi.width=e.width,zi.height=e.height;let t=zi.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=zi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=Xr(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Li(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Li(t[e]/255)*255):t[e]=Li(t[e]);return{data:t,width:e.width,height:e.height}}return B(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Vi=0,Hi=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Vi++}),this.uuid=li(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Ui(r[t].image)):e.push(Ui(r[t]))}else e=Ui(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Ui(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Bi.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(B(`Texture: Unable to serialize Texture.`),{})}var Wi=0,Gi=new G,Ki=class e extends ii{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=yn,i=yn,a=wn,o=En,s=Hn,c=Dn,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Wi++}),this.uuid=li(),this.name=``,this.source=new Hi(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new W(0,0),this.repeat=new W(1,1),this.center=new W(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new K,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Gi).x}get height(){return this.source.getSize(Gi).y}get depth(){return this.source.getSize(Gi).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){B(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){B(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case vn:e.x-=Math.floor(e.x);break;case yn:e.x=e.x<0?0:1;break;case bn:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case vn:e.y-=Math.floor(e.y);break;case yn:e.y=e.y<0?0:1;break;case bn:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ki.DEFAULT_IMAGE=null,Ki.DEFAULT_MAPPING=300,Ki.DEFAULT_ANISOTROPY=1;var qi=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=H(this.x,e.x,t.x),this.y=H(this.y,e.y,t.y),this.z=H(this.z,e.z,t.z),this.w=H(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=H(this.x,e,t),this.y=H(this.y,e,t),this.z=H(this.z,e,t),this.w=H(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(H(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ji=class extends ii{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:wn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new qi(0,0,e,t),this.scissorTest=!1,this.viewport=new qi(0,0,e,t),this.textures=[];let r=new Ki({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:wn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Hi(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Yi=class extends Ji{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Xi=class extends Ki{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=xn,this.minFilter=xn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Zi=class extends Ki{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=xn,this.minFilter=xn,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},Qi=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/$i.setFromMatrixColumn(e,0).length(),i=1/$i.setFromMatrixColumn(e,1).length(),a=1/$i.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(ta,e,na)}lookAt(e,t,n){let r=this.elements;return aa.subVectors(e,t),aa.lengthSq()===0&&(aa.z=1),aa.normalize(),ra.crossVectors(n,aa),ra.lengthSq()===0&&(Math.abs(n.z)===1?aa.x+=1e-4:aa.z+=1e-4,aa.normalize(),ra.crossVectors(n,aa)),ra.normalize(),ia.crossVectors(aa,ra),r[0]=ra.x,r[4]=ia.x,r[8]=aa.x,r[1]=ra.y,r[5]=ia.y,r[9]=aa.y,r[2]=ra.z,r[6]=ia.z,r[10]=aa.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],te=r[7],ne=r[11],N=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*te,i[8]=a*C+o*D+s*j+c*ne,i[12]=a*w+o*O+s*ee+c*N,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*te,i[9]=l*C+u*D+d*j+f*ne,i[13]=l*w+u*O+d*ee+f*N,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*te,i[10]=p*C+m*D+h*j+g*ne,i[14]=p*w+m*O+h*ee+g*N,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*te,i[11]=_*C+v*D+y*j+b*ne,i[15]=_*w+v*O+y*ee+b*N,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=$i.set(r[0],r[1],r[2]).length(),o=$i.set(r[4],r[5],r[6]).length(),s=$i.set(r[8],r[9],r[10]).length();i<0&&(a=-a),ea.copy(this);let c=1/a,l=1/o,u=1/s;return ea.elements[0]*=c,ea.elements[1]*=c,ea.elements[2]*=c,ea.elements[4]*=l,ea.elements[5]*=l,ea.elements[6]*=l,ea.elements[8]*=u,ea.elements[9]*=u,ea.elements[10]*=u,t.setFromRotationMatrix(ea),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=qr,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=qr,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},$i=new G,ea=new Qi,ta=new G(0,0,0),na=new G(1,1,1),ra=new G,ia=new G,aa=new G,oa=new Qi,sa=new Ai,ca=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(H(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-H(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(H(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-H(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(H(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-H(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:B(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return oa.makeRotationFromQuaternion(e),this.setFromRotationMatrix(oa,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return sa.setFromEuler(this),this.setFromQuaternion(sa,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ca.DEFAULT_ORDER=`XYZ`;var la=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&(1<<e|0))}},ua=0,da=new G,fa=new Ai,pa=new Qi,ma=new G,ha=new G,ga=new G,_a=new Ai,va=new G(1,0,0),ya=new G(0,1,0),ba=new G(0,0,1),xa={type:`added`},Sa={type:`removed`},Ca={type:`childadded`,child:null},wa={type:`childremoved`,child:null},Ta=class e extends ii{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ua++}),this.uuid=li(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new G,n=new ca,r=new Ai,i=new G(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Qi},normalMatrix:{value:new K}}),this.matrix=new Qi,this.matrixWorld=new Qi,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new la,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return fa.setFromAxisAngle(e,t),this.quaternion.multiply(fa),this}rotateOnWorldAxis(e,t){return fa.setFromAxisAngle(e,t),this.quaternion.premultiply(fa),this}rotateX(e){return this.rotateOnAxis(va,e)}rotateY(e){return this.rotateOnAxis(ya,e)}rotateZ(e){return this.rotateOnAxis(ba,e)}translateOnAxis(e,t){return da.copy(e).applyQuaternion(this.quaternion),this.position.add(da.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(va,e)}translateY(e){return this.translateOnAxis(ya,e)}translateZ(e){return this.translateOnAxis(ba,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(pa.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ma.copy(e):ma.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),ha.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?pa.lookAt(ha,ma,this.up):pa.lookAt(ma,ha,this.up),this.quaternion.setFromRotationMatrix(pa),r&&(pa.extractRotation(r.matrixWorld),fa.setFromRotationMatrix(pa),this.quaternion.premultiply(fa.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(V(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(xa),Ca.child=e,this.dispatchEvent(Ca),Ca.child=null):V(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Sa),wa.child=e,this.dispatchEvent(wa),wa.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),pa.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),pa.multiply(e.parent.matrixWorld)),e.applyMatrix4(pa),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(xa),Ca.child=e,this.dispatchEvent(Ca),Ca.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ha,e,ga),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ha,_a,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Ta.DEFAULT_UP=new G(0,1,0),Ta.DEFAULT_MATRIX_AUTO_UPDATE=!0,Ta.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ea=class extends Ta{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Da={type:`move`},Oa=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ea,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ea,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ea,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Da)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Ea;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},ka={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Aa={h:0,s:0,l:0},ja={h:0,s:0,l:0};function Ma(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var J=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Br){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,q.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=q.workingColorSpace){return this.r=e,this.g=t,this.b=n,q.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=q.workingColorSpace){if(e=ui(e,1),t=H(t,0,1),n=H(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Ma(i,r,e+1/3),this.g=Ma(i,r,e),this.b=Ma(i,r,e-1/3)}return q.colorSpaceToWorking(this,r),this}setStyle(e,t=Br){function n(t){t!==void 0&&parseFloat(t)<1&&B(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:B(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);B(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Br){let n=ka[e.toLowerCase()];return n===void 0?B(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Li(e.r),this.g=Li(e.g),this.b=Li(e.b),this}copyLinearToSRGB(e){return this.r=Ri(e.r),this.g=Ri(e.g),this.b=Ri(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Br){return q.workingToColorSpace(Na.copy(this),e),Math.round(H(Na.r*255,0,255))*65536+Math.round(H(Na.g*255,0,255))*256+Math.round(H(Na.b*255,0,255))}getHexString(e=Br){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=q.workingColorSpace){q.workingToColorSpace(Na.copy(this),t);let n=Na.r,r=Na.g,i=Na.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=q.workingColorSpace){return q.workingToColorSpace(Na.copy(this),t),e.r=Na.r,e.g=Na.g,e.b=Na.b,e}getStyle(e=Br){q.workingToColorSpace(Na.copy(this),e);let t=Na.r,n=Na.g,r=Na.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(Aa),this.setHSL(Aa.h+e,Aa.s+t,Aa.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Aa),e.getHSL(ja);let n=pi(Aa.h,ja.h,t),r=pi(Aa.s,ja.s,t),i=pi(Aa.l,ja.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Na=new J;J.NAMES=ka;var Pa=class extends Ta{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ca,this.environmentIntensity=1,this.environmentRotation=new ca,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Fa=new G,Ia=new G,La=new G,Ra=new G,za=new G,Ba=new G,Va=new G,Ha=new G,Ua=new G,Wa=new G,Ga=new qi,Ka=new qi,qa=new qi,Ja=class e{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Fa.subVectors(e,t),r.cross(Fa);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Fa.subVectors(r,t),Ia.subVectors(n,t),La.subVectors(e,t);let a=Fa.dot(Fa),o=Fa.dot(Ia),s=Fa.dot(La),c=Ia.dot(Ia),l=Ia.dot(La),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Ra)!==null&&Ra.x>=0&&Ra.y>=0&&Ra.x+Ra.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Ra)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Ra.x),s.addScaledVector(a,Ra.y),s.addScaledVector(o,Ra.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Ga.setScalar(0),Ka.setScalar(0),qa.setScalar(0),Ga.fromBufferAttribute(e,t),Ka.fromBufferAttribute(e,n),qa.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Ga,i.x),a.addScaledVector(Ka,i.y),a.addScaledVector(qa,i.z),a}static isFrontFacing(e,t,n,r){return Fa.subVectors(n,t),Ia.subVectors(e,t),Fa.cross(Ia).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Fa.subVectors(this.c,this.b),Ia.subVectors(this.a,this.b),Fa.cross(Ia).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;za.subVectors(r,n),Ba.subVectors(i,n),Ha.subVectors(e,n);let s=za.dot(Ha),c=Ba.dot(Ha);if(s<=0&&c<=0)return t.copy(n);Ua.subVectors(e,r);let l=za.dot(Ua),u=Ba.dot(Ua);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(za,a);Wa.subVectors(e,i);let f=za.dot(Wa),p=Ba.dot(Wa);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Ba,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Va.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Va,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(za,a).addScaledVector(Ba,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Ya=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Za.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Za.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Za.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Za):Za.fromBufferAttribute(r,t),Za.applyMatrix4(e.matrixWorld),this.expandByPoint(Za);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Qa.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Qa.copy(e.boundingBox)),Qa.applyMatrix4(e.matrixWorld),this.union(Qa)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Za),Za.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ao),oo.subVectors(this.max,ao),$a.subVectors(e.a,ao),eo.subVectors(e.b,ao),to.subVectors(e.c,ao),no.subVectors(eo,$a),ro.subVectors(to,eo),io.subVectors($a,to);let t=[0,-no.z,no.y,0,-ro.z,ro.y,0,-io.z,io.y,no.z,0,-no.x,ro.z,0,-ro.x,io.z,0,-io.x,-no.y,no.x,0,-ro.y,ro.x,0,-io.y,io.x,0];return!lo(t,$a,eo,to,oo)||(t=[1,0,0,0,1,0,0,0,1],!lo(t,$a,eo,to,oo))?!1:(so.crossVectors(no,ro),t=[so.x,so.y,so.z],lo(t,$a,eo,to,oo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Za).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Za).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Xa[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Xa[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Xa[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Xa[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Xa[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Xa[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Xa[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Xa[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Xa),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Xa=[new G,new G,new G,new G,new G,new G,new G,new G],Za=new G,Qa=new Ya,$a=new G,eo=new G,to=new G,no=new G,ro=new G,io=new G,ao=new G,oo=new G,so=new G,co=new G;function lo(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){co.fromArray(e,a);let o=i.x*Math.abs(co.x)+i.y*Math.abs(co.y)+i.z*Math.abs(co.z),s=t.dot(co),c=n.dot(co),l=r.dot(co);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var uo=new G,fo=new W,po=0,mo=class extends ii{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:po++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Gr,this.updateRanges=[],this.gpuType=Nn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)fo.fromBufferAttribute(this,t),fo.applyMatrix3(e),this.setXY(t,fo.x,fo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)uo.fromBufferAttribute(this,t),uo.applyMatrix3(e),this.setXYZ(t,uo.x,uo.y,uo.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)uo.fromBufferAttribute(this,t),uo.applyMatrix4(e),this.setXYZ(t,uo.x,uo.y,uo.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)uo.fromBufferAttribute(this,t),uo.applyNormalMatrix(e),this.setXYZ(t,uo.x,uo.y,uo.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)uo.fromBufferAttribute(this,t),uo.transformDirection(e),this.setXYZ(t,uo.x,uo.y,uo.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Oi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=U(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Oi(t,this.array)),t}setX(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Oi(t,this.array)),t}setY(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Oi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Oi(t,this.array)),t}setW(e,t){return this.normalized&&(t=U(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),n=U(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array),i=U(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},ho=class extends mo{constructor(e,t,n){super(new Uint16Array(e),t,n)}},go=class extends mo{constructor(e,t,n){super(new Uint32Array(e),t,n)}},_o=class extends mo{constructor(e,t,n){super(new Float32Array(e),t,n)}},vo=new Ya,yo=new G,bo=new G,xo=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?vo.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;yo.subVectors(e,this.center);let t=yo.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(yo,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(bo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(yo.copy(e.center).add(bo)),this.expandByPoint(yo.copy(e.center).sub(bo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},So=0,Co=new Qi,wo=new Ta,To=new G,Eo=new Ya,Do=new Ya,Oo=new G,ko=class e extends ii{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:So++}),this.uuid=li(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Jr(e)?go:ho)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new K().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Co.makeRotationFromQuaternion(e),this.applyMatrix4(Co),this}rotateX(e){return Co.makeRotationX(e),this.applyMatrix4(Co),this}rotateY(e){return Co.makeRotationY(e),this.applyMatrix4(Co),this}rotateZ(e){return Co.makeRotationZ(e),this.applyMatrix4(Co),this}translate(e,t,n){return Co.makeTranslation(e,t,n),this.applyMatrix4(Co),this}scale(e,t,n){return Co.makeScale(e,t,n),this.applyMatrix4(Co),this}lookAt(e){return wo.lookAt(e),wo.updateMatrix(),this.applyMatrix4(wo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(To).negate(),this.translate(To.x,To.y,To.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new _o(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&B(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ya);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){V(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Eo.setFromBufferAttribute(n),this.morphTargetsRelative?(Oo.addVectors(this.boundingBox.min,Eo.min),this.boundingBox.expandByPoint(Oo),Oo.addVectors(this.boundingBox.max,Eo.max),this.boundingBox.expandByPoint(Oo)):(this.boundingBox.expandByPoint(Eo.min),this.boundingBox.expandByPoint(Eo.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&V(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xo);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){V(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new G,1/0);return}if(e){let n=this.boundingSphere.center;if(Eo.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Do.setFromBufferAttribute(n),this.morphTargetsRelative?(Oo.addVectors(Eo.min,Do.min),Eo.expandByPoint(Oo),Oo.addVectors(Eo.max,Do.max),Eo.expandByPoint(Oo)):(Eo.expandByPoint(Do.min),Eo.expandByPoint(Do.max))}Eo.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Oo.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Oo));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Oo.fromBufferAttribute(a,t),o&&(To.fromBufferAttribute(e,t),Oo.add(To)),r=Math.max(r,n.distanceToSquared(Oo))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&V(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){V(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new mo(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new G,s[e]=new G;let c=new G,l=new G,u=new G,d=new W,f=new W,p=new W,m=new G,h=new G;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new G,y=new G,b=new G,x=new G;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new mo(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new G,i=new G,a=new G,o=new G,s=new G,c=new G,l=new G,u=new G;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Oo.fromBufferAttribute(e,t),Oo.normalize(),e.setXYZ(t,Oo.x,Oo.y,Oo.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new mo(a,r,i)}if(this.index===null)return B(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Ao=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=Gr,this.updateRanges=[],this.version=0,this.uuid=li()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=li()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=li()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},jo=new G,Mo=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)jo.fromBufferAttribute(this,t),jo.applyMatrix4(e),this.setXYZ(t,jo.x,jo.y,jo.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)jo.fromBufferAttribute(this,t),jo.applyNormalMatrix(e),this.setXYZ(t,jo.x,jo.y,jo.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)jo.fromBufferAttribute(this,t),jo.transformDirection(e),this.setXYZ(t,jo.x,jo.y,jo.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Oi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=U(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=U(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Oi(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Oi(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Oi(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Oi(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),n=U(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=U(t,this.array),n=U(n,this.array),r=U(r,this.array),i=U(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){$r(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new mo(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){$r(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},No=new G,Po=new G,Fo=new K,Io=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=No.subVectors(n,t).cross(Po.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(No),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Fo.getNormalMatrix(e),r=this.coplanarPoint(No).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Lo=0,Ro=class extends ii{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Lo++}),this.uuid=li(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new J(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Wr,this.stencilZFail=Wr,this.stencilZPass=Wr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){B(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){B(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new J().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Io().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new W().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new W().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},zo=class extends Ro{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new J(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Bo,Vo=new G,Ho=new G,Uo=new G,Wo=new W,Go=new W,Ko=new Qi,qo=new G,Jo=new G,Yo=new G,Xo=new W,Zo=new W,Qo=new W,$o=class extends Ta{constructor(e=new zo){if(super(),this.isSprite=!0,this.type=`Sprite`,Bo===void 0){Bo=new ko;let e=new Ao(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);Bo.setIndex([0,1,2,0,2,3]),Bo.setAttribute(`position`,new Mo(e,3,0,!1)),Bo.setAttribute(`uv`,new Mo(e,2,3,!1))}this.geometry=Bo,this.material=e,this.center=new W(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&V(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),Ho.setFromMatrixScale(this.matrixWorld),Ko.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Uo.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ho.multiplyScalar(-Uo.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;es(qo.set(-.5,-.5,0),Uo,a,Ho,r,i),es(Jo.set(.5,-.5,0),Uo,a,Ho,r,i),es(Yo.set(.5,.5,0),Uo,a,Ho,r,i),Xo.set(0,0),Zo.set(1,0),Qo.set(1,1);let o=e.ray.intersectTriangle(qo,Jo,Yo,!1,Vo);if(o===null&&(es(Jo.set(-.5,.5,0),Uo,a,Ho,r,i),Zo.set(0,1),o=e.ray.intersectTriangle(qo,Yo,Jo,!1,Vo),o===null))return;let s=e.ray.origin.distanceTo(Vo);s<e.near||s>e.far||t.push({distance:s,point:Vo.clone(),uv:Ja.getInterpolation(Vo,qo,Jo,Yo,Xo,Zo,Qo,new W),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function es(e,t,n,r,i,a){Wo.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?Go.copy(Wo):(Go.x=a*Wo.x-i*Wo.y,Go.y=i*Wo.x+a*Wo.y),e.copy(t),e.x+=Go.x,e.y+=Go.y,e.applyMatrix4(Ko)}var ts=new G,ns=new G,rs=new G,is=new G,as=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ts)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ts.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ts.copy(this.origin).addScaledVector(this.direction,t),ts.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){ns.copy(e).add(t).multiplyScalar(.5),rs.copy(t).sub(e).normalize(),is.copy(this.origin).sub(ns);let i=e.distanceTo(t)*.5,a=-this.direction.dot(rs),o=is.dot(this.direction),s=-is.dot(rs),c=is.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(ns).addScaledVector(rs,d),f}intersectSphere(e,t){if(e.radius<0)return null;ts.subVectors(e.center,this.origin);let n=ts.dot(this.direction),r=ts.dot(ts)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,ts)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let te=S/w,ne=C/w,N=1/w,re=T-te*D,ie=E-ne*D,ae=O-te*A,oe=k-ne*A,P=j-te*M,se=ee-ne*M,F=P*oe-se*ae,ce=re*se-ie*P,le=ae*ie-oe*re;if(r){if(F<0||ce<0||le<0)return null}else if((F<0||ce<0||le<0)&&(F>0||ce>0||le>0))return null;let ue=F+ce+le;if(ue===0)return null;let de=N*(F*D+ce*A+le*M);return(ue>0?de<0:de>0)?null:this.at(de/ue,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},os=class extends Ro{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ca,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ss=new Qi,cs=new as,ls=new xo,us=new G,ds=new G,fs=new G,ps=new G,ms=new G,hs=new G,gs=new G,_s=new G,vs=class extends Ta{constructor(e=new ko,t=new os){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){hs.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(ms.fromBufferAttribute(s,e),a?hs.addScaledVector(ms,r):hs.addScaledVector(ms.sub(t),r))}t.add(hs)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ls.copy(n.boundingSphere),ls.applyMatrix4(i),cs.copy(e.ray).recast(e.near),!(ls.containsPoint(cs.origin)===!1&&(cs.intersectSphere(ls,us)===null||cs.origin.distanceToSquared(us)>(e.far-e.near)**2))&&(ss.copy(i).invert(),cs.copy(e.ray).applyMatrix4(ss),(n.boundingBox===null||cs.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,cs)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=bs(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=bs(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=bs(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=bs(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ys(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;_s.copy(s),_s.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(_s);return l<n.near||l>n.far?null:{distance:l,point:_s.clone(),object:e}}function bs(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,ds),e.getVertexPosition(c,fs),e.getVertexPosition(l,ps);let u=ys(e,t,n,r,ds,fs,ps,gs);if(u){let e=new G;Ja.getBarycoord(gs,ds,fs,ps,e),i&&(u.uv=Ja.getInterpolatedAttribute(i,s,c,l,e,new W)),a&&(u.uv1=Ja.getInterpolatedAttribute(a,s,c,l,e,new W)),o&&(u.normal=Ja.getInterpolatedAttribute(o,s,c,l,e,new G),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new G,materialIndex:0};Ja.getNormal(ds,fs,ps,t.normal),u.face=t,u.barycoord=e}return u}var xs=class extends Ki{constructor(e=null,t=1,n=1,r,i,a,o,s,c=xn,l=xn,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ss=class extends mo{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Cs=new Qi,ws=new Qi,Ts=[],Es=new Ya,Ds=new Qi,Os=new vs,ks=new xo,As=class extends vs{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ss(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Ds)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ya),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Cs),Es.copy(e.boundingBox).applyMatrix4(Cs),this.boundingBox.union(Es)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new xo),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Cs),ks.copy(e.boundingSphere).applyMatrix4(Cs),this.boundingSphere.union(ks)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Os.geometry=this.geometry,Os.material=this.material,Os.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ks.copy(this.boundingSphere),ks.applyMatrix4(n),e.ray.intersectsSphere(ks)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Cs),ws.multiplyMatrices(n,Cs),Os.matrixWorld=ws,Os.raycast(e,Ts);for(let e=0,n=Ts.length;e<n;e++){let n=Ts[e];n.instanceId=i,n.object=this,t.push(n)}Ts.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Ss(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new xs(new Float32Array(r*this.count),r,this.count,Gn,Nn));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},js=new xo,Ms=new W(.5,.5),Ns=new G,Ps=class{constructor(e=new Io,t=new Io,n=new Io,r=new Io,i=new Io,a=new Io){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=qr,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),js.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),js.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(js)}intersectsSprite(e){return js.center.set(0,0,0),js.radius=.7071067811865476+Ms.distanceTo(e.center),js.applyMatrix4(e.matrixWorld),this.intersectsSphere(js)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Ns.x=r.normal.x>0?e.max.x:e.min.x,Ns.y=r.normal.y>0?e.max.y:e.min.y,Ns.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ns)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Fs=class extends Ki{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Is=class extends Ki{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Ls=class extends Ki{constructor(e,t,n=Mn,r,i,a,o=xn,s=xn,c,l=Un,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Hi(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Rs=class extends Ls{constructor(e,t=Mn,n=301,r,i,a=xn,o=xn,s,c=Un){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},zs=class extends Ki{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Bs=class e extends ko{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new _o(c,3)),this.setAttribute(`normal`,new _o(l,3)),this.setAttribute(`uv`,new _o(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new G;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Vs=class e extends ko{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new _o(p,3)),this.setAttribute(`normal`,new _o(m,3)),this.setAttribute(`uv`,new _o(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};function Hs(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Ws(i))i.isRenderTargetTexture?(B(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(Ws(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function Us(e){let t={};for(let n=0;n<e.length;n++){let r=Hs(e[n]);for(let e in r)t[e]=r[e]}return t}function Ws(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Gs(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Ks(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:q.workingColorSpace}var qs={clone:Hs,merge:Us},Js=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ys=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Xs=class extends Ro{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Js,this.fragmentShader=Ys,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Hs(e.uniforms),this.uniformsGroups=Gs(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new J().setHex(r.value);break;case`v2`:this.uniforms[n].value=new W().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new qi().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Qi().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Zs=class extends Xs{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Qs=class extends Ro{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:``},this.type=`MeshToonMaterial`,this.color=new J(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new J(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},$s=class extends Ro{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type=`MeshNormalMaterial`,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}},ec=class extends Ro{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type=`MeshLambertMaterial`,this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new J(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ca,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},tc=class extends Ro{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=zr,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},nc=class extends Ro{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function rc(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function ic(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var ac=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},oc=class extends ac{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ir,endingEnd:Ir}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Lr:i=e,o=2*t-n;break;case Rr:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Lr:a=e,s=2*n-t;break;case Rr:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},sc=class extends ac{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},cc=class extends ac{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},lc=class extends ac{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=fc(n,t,g,y,r);i[p]=uc(x,o,_,b,m)}return i}};function uc(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function dc(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function fc(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=uc(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=dc(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var pc=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=rc(t,this.TimeBufferType),this.values=rc(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:rc(e.times,Array),values:rc(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),ic(e.settings)&&(n.settings={inTangents:rc(e.settings.inTangents,Array),outTangents:rc(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new cc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new sc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new oc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new lc(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Mr:t=this.InterpolantFactoryMethodDiscrete;break;case Nr:t=this.InterpolantFactoryMethodLinear;break;case Pr:t=this.InterpolantFactoryMethodSmooth;break;case Fr:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return B(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Mr;case this.InterpolantFactoryMethodLinear:return Nr;case this.InterpolantFactoryMethodSmooth:return Pr;case this.InterpolantFactoryMethodBezier:return Fr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;ic(this.settings)&&(mc(this.settings.inTangents,e),mc(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(V(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(V(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){V(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){V(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&Yr(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){V(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Pr,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,ic(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function mc(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}pc.prototype.ValueTypeName=``,pc.prototype.TimeBufferType=Float32Array,pc.prototype.ValueBufferType=Float32Array,pc.prototype.DefaultInterpolation=Nr;var hc=class extends pc{constructor(e,t,n){super(e,t,n)}};hc.prototype.ValueTypeName=`bool`,hc.prototype.ValueBufferType=Array,hc.prototype.DefaultInterpolation=Mr,hc.prototype.InterpolantFactoryMethodLinear=void 0,hc.prototype.InterpolantFactoryMethodSmooth=void 0;var gc=class extends pc{constructor(e,t,n,r){super(e,t,n,r)}};gc.prototype.ValueTypeName=`color`;var _c=class extends pc{constructor(e,t,n,r){super(e,t,n,r)}};_c.prototype.ValueTypeName=`number`;var vc=class extends ac{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Ai.slerpFlat(i,0,a,c-o,a,c,s);return i}},yc=class extends pc{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new vc(this.times,this.values,this.getValueSize(),e)}};yc.prototype.ValueTypeName=`quaternion`,yc.prototype.InterpolantFactoryMethodSmooth=void 0;var bc=class extends pc{constructor(e,t,n){super(e,t,n)}};bc.prototype.ValueTypeName=`string`,bc.prototype.ValueBufferType=Array,bc.prototype.DefaultInterpolation=Mr,bc.prototype.InterpolantFactoryMethodLinear=void 0,bc.prototype.InterpolantFactoryMethodSmooth=void 0;var xc=class extends pc{constructor(e,t,n,r){super(e,t,n,r)}};xc.prototype.ValueTypeName=`vector`;var Sc={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(Cc(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!Cc(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function Cc(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}var wc=new class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return e=e.normalize(`NFC`),s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}},Tc=class{constructor(e){this.manager=e===void 0?wc:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Tc.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var Ec=new WeakMap,Dc=class extends Tc{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Sc.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=Ec.get(a);e===void 0&&(e=[],Ec.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=Xr(`img`);function s(){l(),t&&t(this);let n=Ec.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}Ec.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),Sc.remove(`image:${e}`);let n=Ec.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}Ec.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Sc.add(`image:${e}`,o),i.manager.itemStart(e),o.src=e,o}},Oc=class extends Tc{constructor(e){super(e)}load(e,t,n,r){let i=new Ki,a=new Dc(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(e){i.image=e,i.needsUpdate=!0,t!==void 0&&t(i)},n,r),i}},kc=class extends Ta{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new J(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Ac=class extends kc{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Ta.DEFAULT_UP),this.updateMatrix(),this.groundColor=new J(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},jc=new Qi,Mc=new G,Nc=new G,Pc=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new W(512,512),this.mapType=Dn,this.map=null,this.mapPass=null,this.matrix=new Qi,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ps,this._frameExtents=new W(1,1),this._viewportCount=1,this._viewports=[new qi(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Mc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Mc),Nc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Nc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){jc.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(jc,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(jc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Fc=new G,Ic=new Ai,Lc=new G,Rc=class extends Ta{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Qi,this.projectionMatrix=new Qi,this.projectionMatrixInverse=new Qi,this.coordinateSystem=qr,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Fc,Ic,Lc),Lc.x===1&&Lc.y===1&&Lc.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Fc,Ic,Lc.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Fc,Ic,Lc),Lc.x===1&&Lc.y===1&&Lc.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Fc,Ic,Lc.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},zc=new G,Bc=new W,Vc=new W,Hc=class extends Rc{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ci*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(si*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ci*2*Math.atan(Math.tan(si*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){zc.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(zc.x,zc.y).multiplyScalar(-e/zc.z),zc.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(zc.x,zc.y).multiplyScalar(-e/zc.z)}getViewSize(e,t){return this.getViewBounds(e,Bc,Vc),t.subVectors(Vc,Bc)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(si*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Uc=class extends Pc{constructor(){super(new Hc(90,1,.5,500)),this.isPointLightShadow=!0}},Wc=class extends kc{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new Uc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Gc=class extends Rc{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Kc=class extends Pc{constructor(){super(new Gc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},qc=class extends kc{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Ta.DEFAULT_UP),this.updateMatrix(),this.target=new Ta,this.shadow=new Kc}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},Jc=-90,Yc=1,Xc=class extends Ta{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Hc(Jc,Yc,e,t);r.layers=this.layers,this.add(r);let i=new Hc(Jc,Yc,e,t);i.layers=this.layers,this.add(i);let a=new Hc(Jc,Yc,e,t);a.layers=this.layers,this.add(a);let o=new Hc(Jc,Yc,e,t);o.layers=this.layers,this.add(o);let s=new Hc(Jc,Yc,e,t);s.layers=this.layers,this.add(s);let c=new Hc(Jc,Yc,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Zc=class extends Hc{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Qc=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=$c.bind(this),e.addEventListener(`visibilitychange`,this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener(`visibilitychange`,this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e===void 0?performance.now():e)-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function $c(){this._document.hidden===!1&&this.reset()}var el=`\\[\\]\\.:\\/`,tl=RegExp(`[\\[\\]\\.:\\/]`,`g`),nl=`[^\\[\\]\\.:\\/]`,rl=`[^`+el.replace(`\\.`,``)+`]`,il=`((?:WC+[\\/:])*)`.replace(`WC`,nl),al=`(WCOD+)?`.replace(`WCOD`,rl),ol=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,nl),sl=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,nl),cl=RegExp(`^`+il+al+ol+sl+`$`),ll=[`material`,`materials`,`bones`,`map`],ul=class{constructor(e,t,n){let r=n||dl.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},dl=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(tl,``)}static parseTrackName(e){let t=cl.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);ll.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){B(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){V(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){V(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){V(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){V(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){V(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){V(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){V(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;V(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){V(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){V(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};dl.Composite=ul,dl.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},dl.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},dl.prototype.GetterByBindingType=[dl.prototype._getValue_direct,dl.prototype._getValue_array,dl.prototype._getValue_arrayElement,dl.prototype._getValue_toArray],dl.prototype.SetterByBindingTypeAndVersioning=[[dl.prototype._setValue_direct,dl.prototype._setValue_direct_setNeedsUpdate,dl.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[dl.prototype._setValue_array,dl.prototype._setValue_array_setNeedsUpdate,dl.prototype._setValue_array_setMatrixWorldNeedsUpdate],[dl.prototype._setValue_arrayElement,dl.prototype._setValue_arrayElement_setNeedsUpdate,dl.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[dl.prototype._setValue_fromArray,dl.prototype._setValue_fromArray_setNeedsUpdate,dl.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var fl=new Qi,pl=class{constructor(e,t,n=0,r=1/0){this.ray=new as(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new la,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):V(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return fl.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(fl),this}intersectObject(e,t=!0,n=[]){return hl(e,this,n,t),n.sort(ml),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)hl(e[r],this,n,t);return n.sort(ml),n}};function ml(e,t){return e.distance-t.distance}function hl(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)hl(r[e],t,n,!0)}}var gl=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){let e=1e-6;return this.phi=H(this.phi,e,Math.PI-e),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(H(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var _l=class extends ii{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function vl(e,t,n,r){let i=yl(r);switch(n){case Bn:return e*t;case Gn:return e*t/i.components*i.byteLength;case Kn:return e*t/i.components*i.byteLength;case qn:return e*t*2/i.components*i.byteLength;case Jn:return e*t*2/i.components*i.byteLength;case Vn:return e*t*3/i.components*i.byteLength;case Hn:return e*t*4/i.components*i.byteLength;case Yn:return e*t*4/i.components*i.byteLength;case Xn:case Zn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Qn:case $n:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case tr:case rr:return Math.max(e,16)*Math.max(t,8)/4;case er:case nr:return Math.max(e,8)*Math.max(t,8)/2;case ir:case ar:case sr:case cr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case or:case lr:case ur:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case dr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case fr:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case pr:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case mr:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case hr:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case gr:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case _r:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case vr:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case yr:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case br:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case xr:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Sr:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Cr:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case wr:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Tr:case Er:case Dr:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Or:case kr:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Ar:case jr:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function yl(e){switch(e){case Dn:case On:return{byteLength:1,components:1};case An:case kn:case Pn:return{byteLength:2,components:1};case Fn:case In:return{byteLength:2,components:4};case Mn:case jn:case Nn:return{byteLength:4,components:1};case Rn:case zn:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?B(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function bl(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function xl(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Y={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},X={common:{diffuse:{value:new J(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new K}},envmap:{envMap:{value:null},envMapRotation:{value:new K},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new K}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new K}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new K},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new K},normalScale:{value:new W(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new K},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new K}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new K}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new K}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new J(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new G},probesMax:{value:new G},probesResolution:{value:new G}},points:{diffuse:{value:new J(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0},uvTransform:{value:new K}},sprite:{diffuse:{value:new J(16777215)},opacity:{value:1},center:{value:new W(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}}},Sl={basic:{uniforms:Us([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.fog]),vertexShader:Y.meshbasic_vert,fragmentShader:Y.meshbasic_frag},lambert:{uniforms:Us([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new J(0)},envMapIntensity:{value:1}}]),vertexShader:Y.meshlambert_vert,fragmentShader:Y.meshlambert_frag},phong:{uniforms:Us([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new J(0)},specular:{value:new J(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Y.meshphong_vert,fragmentShader:Y.meshphong_frag},standard:{uniforms:Us([X.common,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.roughnessmap,X.metalnessmap,X.fog,X.lights,{emissive:{value:new J(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag},toon:{uniforms:Us([X.common,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.gradientmap,X.fog,X.lights,{emissive:{value:new J(0)}}]),vertexShader:Y.meshtoon_vert,fragmentShader:Y.meshtoon_frag},matcap:{uniforms:Us([X.common,X.bumpmap,X.normalmap,X.displacementmap,X.fog,{matcap:{value:null}}]),vertexShader:Y.meshmatcap_vert,fragmentShader:Y.meshmatcap_frag},points:{uniforms:Us([X.points,X.fog]),vertexShader:Y.points_vert,fragmentShader:Y.points_frag},dashed:{uniforms:Us([X.common,X.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Y.linedashed_vert,fragmentShader:Y.linedashed_frag},depth:{uniforms:Us([X.common,X.displacementmap]),vertexShader:Y.depth_vert,fragmentShader:Y.depth_frag},normal:{uniforms:Us([X.common,X.bumpmap,X.normalmap,X.displacementmap,{opacity:{value:1}}]),vertexShader:Y.meshnormal_vert,fragmentShader:Y.meshnormal_frag},sprite:{uniforms:Us([X.sprite,X.fog]),vertexShader:Y.sprite_vert,fragmentShader:Y.sprite_frag},background:{uniforms:{uvTransform:{value:new K},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Y.background_vert,fragmentShader:Y.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new K}},vertexShader:Y.backgroundCube_vert,fragmentShader:Y.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Y.cube_vert,fragmentShader:Y.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Y.equirect_vert,fragmentShader:Y.equirect_frag},distance:{uniforms:Us([X.common,X.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Y.distance_vert,fragmentShader:Y.distance_frag},shadow:{uniforms:Us([X.lights,X.fog,{color:{value:new J(0)},opacity:{value:1}}]),vertexShader:Y.shadow_vert,fragmentShader:Y.shadow_frag}};Sl.physical={uniforms:Us([Sl.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new K},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new K},clearcoatNormalScale:{value:new W(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new K},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new K},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new K},sheen:{value:0},sheenColor:{value:new J(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new K},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new K},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new K},transmissionSamplerSize:{value:new W},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new K},attenuationDistance:{value:0},attenuationColor:{value:new J(0)},specularColor:{value:new J(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new K},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new K},anisotropyVector:{value:new W},anisotropyMap:{value:null},anisotropyMapTransform:{value:new K}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag};var Cl={r:0,b:0,g:0},wl=new Qi,Tl=new K;Tl.set(-1,0,0,0,1,0,0,0,1);function El(e,t,n,r,i,a){let o=new J(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new vs(new Bs(1,1,1),new Xs({name:`BackgroundCubeMaterial`,uniforms:Hs(Sl.backgroundCube.uniforms),vertexShader:Sl.backgroundCube.vertexShader,fragmentShader:Sl.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(wl.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Tl),l.material.toneMapped=q.getTransfer(i.colorSpace)!==Ur,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new vs(new Vs(2,2),new Xs({name:`BackgroundMaterial`,uniforms:Hs(Sl.background.uniforms),vertexShader:Sl.background.vertexShader,fragmentShader:Sl.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=q.getTransfer(i.colorSpace)!==Ur,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Cl,Ks(e)),n.buffers.color.setClear(Cl.r,Cl.g,Cl.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Dl(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Ol(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function kl(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(B(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&B(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Al(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Io,s=new K,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var jl=4,Ml=6,Nl=20,Pl=256,Fl=new Gc,Il=new J,Ll=null,Rl=0,zl=0,Bl=!1,Vl=new G,Hl=new G,Ul=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Vl}=i;Ll=this._renderer.getRenderTarget(),Rl=this._renderer.getActiveCubeFace(),zl=this._renderer.getActiveMipmapLevel(),Bl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Xl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Yl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ll,Rl,zl),this._renderer.xr.enabled=Bl,e.scissorTest=!1,Kl(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ll=this._renderer.getRenderTarget(),Rl=this._renderer.getActiveCubeFace(),zl=this._renderer.getActiveMipmapLevel(),Bl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:wn,minFilter:wn,generateMipmaps:!1,type:Pn,format:Hn,colorSpace:Vr,depthBuffer:!1},r=Gl(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Gl(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Wl(r)),this._blurMaterial=Jl(r,e,t),this._ggxMaterial=ql(r,e,t)}return r}_compileMaterial(e){let t=new vs(new ko,e);this._renderer.compile(t,Fl)}_sceneToCubeUV(e,t,n,r,i){let a=new Hc(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(Il),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new vs(new Bs,new os({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(Il),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;Kl(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Xl()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Yl());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Kl(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Fl)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-jl?n-d+jl:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,Kl(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Fl),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,Kl(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Fl)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];Kl(t,3*l*(r>this._lodMax-jl?r-this._lodMax+jl:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,Fl)}};function Wl(e){let t=[],n=[],r=e,i=e-jl+1+Ml;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?Hl.set(1,r,n):e===1?Hl.set(-n,1,-r):e===2?Hl.set(-n,r,1):e===3?Hl.set(-1,r,-n):e===4?Hl.set(-n,-1,r):Hl.set(n,r,-1),Hl.toArray(l,(e*6+t)*3)}}let u=new ko;u.setAttribute(`position`,new mo(c,3)),u.setAttribute(`outputDirection`,new mo(l,3)),n.push(new vs(u,null)),r>jl&&r--}return{lodMeshes:n,sizeLods:t}}function Gl(e,t,n){let r=new Yi(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Kl(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function ql(e,t,n){return new Xs({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:Pl,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Zl(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Jl(e,t,n){return new Xs({name:`SphericalGaussianBlur`,defines:{SAMPLES:Nl,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Zl(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Yl(){return new Xs({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Zl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Xl(){return new Xs({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Zl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Zl(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Ql=class extends Yi{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Fs(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Bs(5,5,5),i=new Xs({name:`CubemapFromEquirect`,uniforms:Hs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new vs(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=wn),new Xc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function $l(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Ql(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Ul(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Ul(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function eu(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&ti(`WebGLRenderer: `+e+` extension not supported.`),t}}}function tu(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?go:ho)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function nu(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function ru(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:V(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function iu(e,t,n){let r=new WeakMap,i=new qi;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new Xi(h,p,m,u);g.type=Nn,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new W(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function au(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var ou={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function su(e,t,n,r,i,a){let o=new Yi(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new ko;l.setAttribute(`position`,new _o([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new _o([0,2,0,0,2,0],2));let u=new Zs({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new vs(l,u),f=new Gc(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new Yi(t,n,{type:Pn,depthBuffer:!1,stencilBuffer:!1}),c=new Yi(t,n,{type:Pn,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},q.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=ou[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var cu=new Ki,lu=new Ls(1,1),uu=new Xi,du=new Zi,fu=new Fs,pu=[],mu=[],hu=new Float32Array(16),gu=new Float32Array(9),_u=new Float32Array(4);function vu(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=pu[i];if(a===void 0&&(a=new Float32Array(i),pu[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function yu(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function bu(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function xu(e,t){let n=mu[t];n===void 0&&(n=new Int32Array(t),mu[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Su(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Cu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(yu(n,t))return;e.uniform2fv(this.addr,t),bu(n,t)}}function wu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(yu(n,t))return;e.uniform3fv(this.addr,t),bu(n,t)}}function Tu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(yu(n,t))return;e.uniform4fv(this.addr,t),bu(n,t)}}function Eu(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(yu(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),bu(n,t)}else{if(yu(n,r))return;_u.set(r),e.uniformMatrix2fv(this.addr,!1,_u),bu(n,r)}}function Du(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(yu(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),bu(n,t)}else{if(yu(n,r))return;gu.set(r),e.uniformMatrix3fv(this.addr,!1,gu),bu(n,r)}}function Ou(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(yu(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),bu(n,t)}else{if(yu(n,r))return;hu.set(r),e.uniformMatrix4fv(this.addr,!1,hu),bu(n,r)}}function ku(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Au(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(yu(n,t))return;e.uniform2iv(this.addr,t),bu(n,t)}}function ju(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(yu(n,t))return;e.uniform3iv(this.addr,t),bu(n,t)}}function Mu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(yu(n,t))return;e.uniform4iv(this.addr,t),bu(n,t)}}function Nu(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Pu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(yu(n,t))return;e.uniform2uiv(this.addr,t),bu(n,t)}}function Fu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(yu(n,t))return;e.uniform3uiv(this.addr,t),bu(n,t)}}function Iu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(yu(n,t))return;e.uniform4uiv(this.addr,t),bu(n,t)}}function Lu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(lu.compareFunction=n.isReversedDepthBuffer()?518:515,a=lu):a=cu,n.setTexture2D(t||a,i)}function Ru(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||du,i)}function zu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||fu,i)}function Bu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||uu,i)}function Vu(e){switch(e){case 5126:return Su;case 35664:return Cu;case 35665:return wu;case 35666:return Tu;case 35674:return Eu;case 35675:return Du;case 35676:return Ou;case 5124:case 35670:return ku;case 35667:case 35671:return Au;case 35668:case 35672:return ju;case 35669:case 35673:return Mu;case 5125:return Nu;case 36294:return Pu;case 36295:return Fu;case 36296:return Iu;case 35678:case 36198:case 36298:case 36306:case 35682:return Lu;case 35679:case 36299:case 36307:return Ru;case 35680:case 36300:case 36308:case 36293:return zu;case 36289:case 36303:case 36311:case 36292:return Bu}}function Hu(e,t){e.uniform1fv(this.addr,t)}function Uu(e,t){let n=vu(t,this.size,2);e.uniform2fv(this.addr,n)}function Wu(e,t){let n=vu(t,this.size,3);e.uniform3fv(this.addr,n)}function Gu(e,t){let n=vu(t,this.size,4);e.uniform4fv(this.addr,n)}function Ku(e,t){let n=vu(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function qu(e,t){let n=vu(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Ju(e,t){let n=vu(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Yu(e,t){e.uniform1iv(this.addr,t)}function Xu(e,t){e.uniform2iv(this.addr,t)}function Zu(e,t){e.uniform3iv(this.addr,t)}function Qu(e,t){e.uniform4iv(this.addr,t)}function $u(e,t){e.uniform1uiv(this.addr,t)}function ed(e,t){e.uniform2uiv(this.addr,t)}function td(e,t){e.uniform3uiv(this.addr,t)}function nd(e,t){e.uniform4uiv(this.addr,t)}function rd(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?lu:cu;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function id(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||du,a[e])}function ad(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||fu,a[e])}function od(e,t,n){let r=this.cache,i=t.length,a=xu(n,i);yu(r,a)||(e.uniform1iv(this.addr,a),bu(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||uu,a[e])}function sd(e){switch(e){case 5126:return Hu;case 35664:return Uu;case 35665:return Wu;case 35666:return Gu;case 35674:return Ku;case 35675:return qu;case 35676:return Ju;case 5124:case 35670:return Yu;case 35667:case 35671:return Xu;case 35668:case 35672:return Zu;case 35669:case 35673:return Qu;case 5125:return $u;case 36294:return ed;case 36295:return td;case 36296:return nd;case 35678:case 36198:case 36298:case 36306:case 35682:return rd;case 35679:case 36299:case 36307:return id;case 35680:case 36300:case 36308:case 36293:return ad;case 36289:case 36303:case 36311:case 36292:return od}}var cd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Vu(t.type)}},ld=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=sd(t.type)}},ud=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},dd=/(\w+)(\])?(\[|\.)?/g;function fd(e,t){e.seq.push(t),e.map[t.id]=t}function pd(e,t,n){let r=e.name,i=r.length;for(dd.lastIndex=0;;){let a=dd.exec(r),o=dd.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){fd(n,l===void 0?new cd(s,e,t):new ld(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new ud(s),fd(n,e)),n=e}}}var md=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);pd(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function hd(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var gd=37297,_d=0;function vd(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var yd=new K;function bd(e){q._getMatrix(yd,q.workingColorSpace,e);let t=`mat3( ${yd.elements.map(e=>e.toFixed(4))} )`;switch(q.getTransfer(e)){case Hr:return[t,`LinearTransferOETF`];case Ur:return[t,`sRGBTransferOETF`];default:return B(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function xd(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+vd(e.getShaderSource(t),r)}return i}function Sd(e,t){let n=bd(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var Cd={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function wd(e,t){let n=Cd[t];return n===void 0?(B(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Td=new G;function Ed(){return q.getLuminanceCoefficients(Td),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Td.x.toFixed(4)}, ${Td.y.toFixed(4)}, ${Td.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Dd(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Ad).join(`
`)}function Od(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function kd(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Ad(e){return e!==``}function jd(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Md(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Nd=/^[ \t]*#include +<([\w\d./]+)>/gm;function Pd(e){return e.replace(Nd,Id)}var Fd=new Map;function Id(e,t){let n=Y[t];if(n===void 0){let e=Fd.get(t);if(e!==void 0)n=Y[e],B(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return Pd(n)}var Ld=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rd(e){return e.replace(Ld,zd)}function zd(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Bd(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Vd={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Hd(e){return Vd[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Ud={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Wd(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Ud[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var Gd={302:`ENVMAP_MODE_REFRACTION`};function Kd(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Gd[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var qd={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Jd(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:qd[e.combine]||`ENVMAP_BLENDING_NONE`}function Yd(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Xd(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Hd(n),l=Wd(n),u=Kd(n),d=Jd(n),f=Yd(n),p=Dd(n),m=Od(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Ad).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Ad).join(`
`),_.length>0&&(_+=`
`)):(g=[Bd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Ad).join(`
`),_=[Bd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Y.tonemapping_pars_fragment,n.toneMapping===0?``:wd(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Y.colorspace_pars_fragment,Sd(`linearToOutputTexel`,n.outputColorSpace),Ed(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Ad).join(`
`)),o=Pd(o),o=jd(o,n),o=Md(o,n),s=Pd(s),s=jd(s,n),s=Md(s,n),o=Rd(o),s=Rd(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=hd(i,i.VERTEX_SHADER,y),S=hd(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=xd(i,x,`vertex`),n=xd(i,S,`fragment`);V(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):B(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new md(i,h),T=kd(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,gd)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=_d++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Zd=0,Qd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new $d(e),t.set(e,n)),n}},$d=class{constructor(e){this.id=Zd++,this.code=e,this.usedTimes=0}};function ef(e){return e===1030||e===37490||e===36285}function tf(e,t,n,r,i,a){let o=new la,s=new Qd,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&B(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=Sl[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),ee=e.state.buffers.depth.getReversed(),M=h.isInstancedMesh===!0,te=h.isBatchedMesh===!0,ne=!!i.map,N=!!i.matcap,re=!!x,ie=!!i.aoMap,ae=!!i.lightMap,oe=!!i.bumpMap&&i.wireframe===!1,P=!!i.normalMap,se=!!i.displacementMap,F=!!i.emissiveMap,ce=!!i.metalnessMap,le=!!i.roughnessMap,ue=i.anisotropy>0,de=i.clearcoat>0,fe=i.dispersion>0,pe=i.retroreflectivity>0,me=i.iridescence>0,he=i.sheen>0,ge=i.transmission>0,_e=ue&&!!i.anisotropyMap,ve=de&&!!i.clearcoatMap,ye=de&&!!i.clearcoatNormalMap,be=de&&!!i.clearcoatRoughnessMap,xe=me&&!!i.iridescenceMap,I=me&&!!i.iridescenceThicknessMap,Se=he&&!!i.sheenColorMap,Ce=he&&!!i.sheenRoughnessMap,we=!!i.specularMap,L=!!i.specularColorMap,Te=!!i.specularIntensityMap,R=ge&&!!i.transmissionMap,z=ge&&!!i.thicknessMap,Ee=!!i.gradientMap,De=!!i.alphaMap,Oe=i.alphaTest>0,ke=!!i.alphaHash,Ae=!!i.extensions,je=0;i.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(je=e.toneMapping);let Me={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:te,batchingColor:te&&h._colorsTexture!==null,instancing:M,instancingColor:M&&h.instanceColor!==null,instancingMorph:M&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:q.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:ne,matcap:N,envMap:re,envMapMode:re&&x.mapping,envMapCubeUVHeight:S,aoMap:ie,lightMap:ae,bumpMap:oe,normalMap:P,displacementMap:se,emissiveMap:F,normalMapObjectSpace:P&&i.normalMapType===1,normalMapTangentSpace:P&&i.normalMapType===0,packedNormalMap:P&&i.normalMapType===0&&ef(i.normalMap.format),metalnessMap:ce,roughnessMap:le,anisotropy:ue,anisotropyMap:_e,clearcoat:de,clearcoatMap:ve,clearcoatNormalMap:ye,clearcoatRoughnessMap:be,dispersion:fe,retroreflection:pe,iridescence:me,iridescenceMap:xe,iridescenceThicknessMap:I,sheen:he,sheenColorMap:Se,sheenRoughnessMap:Ce,specularMap:we,specularColorMap:L,specularIntensityMap:Te,transmission:ge,transmissionMap:R,thicknessMap:z,gradientMap:Ee,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:De,alphaTest:Oe,alphaHash:ke,combine:i.combine,mapUv:ne&&m(i.map.channel),aoMapUv:ie&&m(i.aoMap.channel),lightMapUv:ae&&m(i.lightMap.channel),bumpMapUv:oe&&m(i.bumpMap.channel),normalMapUv:P&&m(i.normalMap.channel),displacementMapUv:se&&m(i.displacementMap.channel),emissiveMapUv:F&&m(i.emissiveMap.channel),metalnessMapUv:ce&&m(i.metalnessMap.channel),roughnessMapUv:le&&m(i.roughnessMap.channel),anisotropyMapUv:_e&&m(i.anisotropyMap.channel),clearcoatMapUv:ve&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:ye&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:xe&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:I&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:Se&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:Ce&&m(i.sheenRoughnessMap.channel),specularMapUv:we&&m(i.specularMap.channel),specularColorMapUv:L&&m(i.specularColorMap.channel),specularIntensityMapUv:Te&&m(i.specularIntensityMap.channel),transmissionMapUv:R&&m(i.transmissionMap.channel),thicknessMapUv:z&&m(i.thicknessMap.channel),alphaMapUv:De&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(P||ue),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(ne||De),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&P===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ee,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:je,decodeVideoTexture:ne&&i.map.isVideoTexture===!0&&q.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:F&&i.emissiveMap.isVideoTexture===!0&&q.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Ae&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Ae&&i.extensions.multiDraw===!0||te)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Me.vertexUv1s=c.has(1),Me.vertexUv2s=c.has(2),Me.vertexUv3s=c.has(3),c.clear(),Me}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=Sl[t];n=qs.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new Xd(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function nf(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function rf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function af(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function of(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||rf),r.length>1&&r.sort(t||af),i.length>1&&i.sort(t||af)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function sf(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new of,e.set(t,[i])):n>=r.length?(i=new of,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function cf(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new G,color:new J};break;case`SpotLight`:n={position:new G,direction:new G,color:new J,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new G,color:new J,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new G,skyColor:new J,groundColor:new J};break;case`RectAreaLight`:n={color:new J,position:new G,halfWidth:new G,halfHeight:new G}}return e[t.id]=n,n}}}function lf(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var uf=0;function df(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function ff(e){let t=new cf,n=lf(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new G);let i=new G,a=new Qi,o=new Qi;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(df);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=X.LTC_FLOAT_1,r.rectAreaLTC2=X.LTC_FLOAT_2):(r.rectAreaLTC1=X.LTC_HALF_1,r.rectAreaLTC2=X.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=uf++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function pf(e){let t=new ff(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function mf(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new pf(e),t.set(n,[a])):r>=i.length?(a=new pf(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var hf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,gf=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,_f=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],vf=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],yf=new Qi,bf=new G,xf=new G;function Sf(e,t,n){let r=new Ps,i=new W,a=new W,o=new qi,s=new tc,c=new nc,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new Xs({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new W},radius:{value:4}},vertexShader:hf,fragmentShader:gf}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new ko;m.setAttribute(`position`,new mo(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new vs(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(B(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){B(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){B(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new Yi(i.x,i.y,{format:qn,type:Pn,minFilter:wn,magFilter:wn,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Ls(i.x,i.y,Nn),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=Un,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=xn,d.map.depthTexture.magFilter=xn}else l.isPointLight?(d.map=new Ql(i.x),d.map.depthTexture=new Rs(i.x,Mn)):(d.map=new Yi(i.x,i.y),d.map.depthTexture=new Ls(i.x,i.y,Mn)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=Un,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=wn,d.map.depthTexture.magFilter=wn):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=xn,d.map.depthTexture.magFilter=xn);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),bf.setFromMatrixPosition(l.matrixWorld),e.position.copy(bf),xf.copy(e.position),xf.add(_f[t]),e.up.copy(vf[t]),e.lookAt(xf),e.updateMatrixWorld(),n.makeTranslation(-bf.x,-bf.y,-bf.z),yf.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(yf,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new Yi(i.x,i.y,{format:qn,type:Pn}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Cf(e,t){function n(){let t=!1,n=new qi,r=null,i=new qi(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?ce(e.DEPTH_TEST):le(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=ri[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?ce(e.STENCIL_TEST):le(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,te=0,ne=e.getParameter(e.VERSION);ne.indexOf(`WebGL`)===-1?ne.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),M=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(ne)[1]),M=te>=1);let N=null,re={},ie=e.getParameter(e.SCISSOR_BOX),ae=e.getParameter(e.VIEWPORT),oe=new qi().fromArray(ie),P=new qi().fromArray(ae);function se(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let F={};F[e.TEXTURE_2D]=se(e.TEXTURE_2D,e.TEXTURE_2D,1),F[e.TEXTURE_CUBE_MAP]=se(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),F[e.TEXTURE_2D_ARRAY]=se(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),F[e.TEXTURE_3D]=se(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),ce(e.DEPTH_TEST),o.setFunc(3),_e(!1),ve(1),ce(e.CULL_FACE),he(0);function ce(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function le(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ue(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function de(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function fe(t){return h!==t&&(e.useProgram(t),h=t,!0)}let pe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};pe[103]=e.MIN,pe[104]=e.MAX;let me={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function he(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(le(e.BLEND),g=!1);return}if(g===!1&&(ce(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:V(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:V(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:V(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:V(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(pe[n],pe[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(me[r],me[i],me[o],me[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function ge(t,n){t.side===2?le(e.CULL_FACE):ce(e.CULL_FACE);let r=t.side===1;n&&(r=!r),_e(r),t.blending===1&&t.transparent===!1?he(0):he(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),be(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?ce(e.SAMPLE_ALPHA_TO_COVERAGE):le(e.SAMPLE_ALPHA_TO_COVERAGE)}function _e(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ve(t){t===0?le(e.CULL_FACE):(ce(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function ye(t){t!==k&&(M&&e.lineWidth(t),k=t)}function be(t,n,r){t?(ce(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):le(e.POLYGON_OFFSET_FILL)}function xe(t){t?ce(e.SCISSOR_TEST):le(e.SCISSOR_TEST)}function I(t){t===void 0&&(t=e.TEXTURE0+ee-1),N!==t&&(e.activeTexture(t),N=t)}function Se(t,n,r){r===void 0&&(r=N===null?e.TEXTURE0+ee-1:N);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(N!==r&&(e.activeTexture(r),N=r),e.bindTexture(t,n||F[t]),i.type=t,i.texture=n)}function Ce(){let t=re[N];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function we(){try{e.compressedTexImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function L(){try{e.compressedTexImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Te(){try{e.texSubImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function R(){try{e.texSubImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function z(){try{e.compressedTexSubImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Ee(){try{e.compressedTexSubImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function De(){try{e.texStorage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Oe(){try{e.texStorage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function ke(){try{e.texImage2D(...arguments)}catch(e){V(`WebGLState:`,e)}}function Ae(){try{e.texImage3D(...arguments)}catch(e){V(`WebGLState:`,e)}}function je(t){return d[t]===void 0?e.getParameter(t):d[t]}function Me(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Ne(t){oe.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),oe.copy(t))}function Pe(t){P.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),P.copy(t))}function Fe(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function Ie(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Le(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},N=null,re={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,oe.set(0,0,e.canvas.width,e.canvas.height),P.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:ce,disable:le,bindFramebuffer:ue,drawBuffers:de,useProgram:fe,setBlending:he,setMaterial:ge,setFlipSided:_e,setCullFace:ve,setLineWidth:ye,setPolygonOffset:be,setScissorTest:xe,activeTexture:I,bindTexture:Se,unbindTexture:Ce,compressedTexImage2D:we,compressedTexImage3D:L,texImage2D:ke,texImage3D:Ae,pixelStorei:Me,getParameter:je,updateUBOMapping:Fe,uniformBlockBinding:Ie,texStorage2D:De,texStorage3D:Oe,texSubImage2D:Te,texSubImage3D:R,compressedTexSubImage2D:z,compressedTexSubImage3D:Ee,scissor:Ne,viewport:Pe,reset:Le}}function wf(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new W,u=new WeakMap,d=new Set,f,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function h(e,t){return m?new OffscreenCanvas(e,t):Xr(`canvas`)}function g(e,t,n){let r=1,i=we(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=h(n,a));let o=t?h(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),B(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&B(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function _(e){return e.generateMipmaps}function v(t){e.generateMipmap(t)}function y(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function b(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];B(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||B(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?Hr:q.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function x(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,B(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function S(e,t){return _(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function C(e){let t=e.target;t.removeEventListener(`dispose`,C),T(t),t.isVideoTexture&&u.delete(t),t.isHTMLTexture&&d.delete(t)}function w(e){let t=e.target;t.removeEventListener(`dispose`,w),D(t)}function T(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&E(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function E(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function D(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let O=0;function k(){O=0}function A(){return O}function j(e){O=e}function ee(){let e=O;return e>=i.maxTextures&&B(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),O+=1,e}function M(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function te(t,i){let a=r.get(t);if(t.isVideoTexture&&Se(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)B(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)B(`WebGLRenderer: Texture marked for update but image is incomplete`);else{le(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function ne(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){le(a,t,i);return}t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i)}function N(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){le(a,t,i);return}n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function re(t,i){let a=r.get(t);if(t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version){ue(a,t,i);return}n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let ie={[vn]:e.REPEAT,[yn]:e.CLAMP_TO_EDGE,[bn]:e.MIRRORED_REPEAT},ae={[xn]:e.NEAREST,[Sn]:e.NEAREST_MIPMAP_NEAREST,[Cn]:e.NEAREST_MIPMAP_LINEAR,[wn]:e.LINEAR,[Tn]:e.LINEAR_MIPMAP_NEAREST,[En]:e.LINEAR_MIPMAP_LINEAR},oe={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function P(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&B(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,ie[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,ie[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,ie[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ae[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ae[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,oe[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function se(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,C));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=M(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&E(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function F(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ce(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=F(n.start,r.width,4),c=F(t.start,r.width,4);n.start<=i+1&&a===c&&F(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function le(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=se(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=q.getPrimaries(q.workingColorSpace),r=o.colorSpace===``?null:q.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=g(o.image,!1,i.maxTextureSize);t=Ce(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=b(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);P(c,o);let h,y=o.mipmaps,C=o.isVideoTexture!==!0,w=f.__version===void 0||l===!0,T=u.dataReady,E=S(o,t);if(o.isDepthTexture)m=x(o.format===Wn,o.type),w&&(C?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(y.length>0){C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else C?(w&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&ce(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){C&&w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,y[0].width,y[0].height,t.depth);for(let i=0,a=y.length;i<a;i++)if(h=y[i],o.format!==1023){if(r!==null){if(C){if(T){if(o.layerUpdates.size>0){let t=vl(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else B(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else C?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?B(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(C){if(w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=vl(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)C?(w&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(w){if(C)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(y.length>0){if(C&&w){let t=we(y[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(C){if(w){let r=we(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);_(o)&&v(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ue(t,o,s){if(o.image.length!==6)return;let c=se(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=q.getPrimaries(q.workingColorSpace),r=o.colorSpace===``?null:q.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=g(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Ce(o,m[e]);let h=m[0],y=a.convert(o.format,o.colorSpace),x=a.convert(o.type),C=b(o.internalFormat,y,x,o.normalized,o.colorSpace),w=o.isVideoTexture!==!0,T=u.__version===void 0||c===!0,E=l.dataReady,D=S(o,h);P(e.TEXTURE_CUBE_MAP,o);let O;if(f){w&&T&&n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,h.width,h.height);for(let t=0;t<6;t++){O=m[t].mipmaps;for(let r=0;r<O.length;r++){let i=O[r];o.format===1023?w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,y,x,i.data):y===null?B(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):w?E&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,i.data)}}}else{if(O=o.mipmaps,w&&T){O.length>0&&D++;let t=we(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,t.width,t.height)}for(let t=0;t<6;t++)if(p){w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,y,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,m[t].width,m[t].height,0,y,x,m[t].data);for(let r=0;r<O.length;r++){let i=O[r].image[t].image;w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,i.width,i.height,0,y,x,i.data)}}else{w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,y,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,y,x,m[t]);for(let r=0;r<O.length;r++){let i=O[r];w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,y,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,y,x,i.image[t])}}}_(o)&&v(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function de(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=b(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),I(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,xe(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function fe(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=x(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;I(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,xe(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,xe(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=b(o.internalFormat,c,l,o.normalized,o.colorSpace);I(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,xe(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,xe(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function pe(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,(!l.__webglTexture||i.depthTexture.image.width!==i.width||i.depthTexture.image.height!==i.height)&&(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,C)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),P(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else te(i.depthTexture,0);let u=l.__webglTexture,d=xe(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)I(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)I(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function me(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)pe(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?pe(i.__webglFramebuffer[0],t,0):pe(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),fe(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),fe(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function he(t,n,i){let a=r.get(t);n!==void 0&&de(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&me(t)}function ge(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,w);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&I(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=b(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=xe(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),fe(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),P(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)de(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else de(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);_(i)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),P(c,a),de(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),_(a)&&v(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),P(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)de(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else de(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);_(i)&&v(r),n.unbindTexture()}t.depthBuffer&&me(t)}function _e(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(_(a)){let t=y(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),v(t),n.unbindTexture()}}}let ve=[],ye=[];function be(t){if(t.samples>0){if(I(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(ve.length=0,ye.length=0,ve.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(ve.push(l),ye.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,ye)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,ve))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function xe(e){return Math.min(i.maxSamples,e.samples)}function I(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Se(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function Ce(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(q.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&B(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):V(`WebGLTextures: Unsupported texture color space:`,n)),t}function we(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=ee,this.resetTextureUnits=k,this.getTextureUnits=A,this.setTextureUnits=j,this.setTexture2D=te,this.setTexture2DArray=ne,this.setTexture3D=N,this.setTextureCube=re,this.rebindTextures=he,this.setupRenderTarget=ge,this.updateRenderTargetMipmap=_e,this.updateMultisampleRenderTarget=be,this.setupDepthRenderbuffer=me,this.setupFrameBufferTexture=de,this.useMultisampledRTT=I,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Tf(e,t){function n(n,r=``){let i,a=q.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Ef=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Df=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Of=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new zs(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Xs({vertexShader:Ef,fragmentShader:Df,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new vs(new Vs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},kf=class extends ii{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new Of,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new W,C=null,w=null,T=new Hc;T.viewport=new qi;let E=new Hc;E.viewport=new qi;let D=[T,E],O=new Zc,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Oa,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Oa,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Oa,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,P.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&B(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&B(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?Wn:Un,a=_.stencil?Ln:Mn);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Yi(d.textureWidth,d.textureHeight,{format:Hn,type:Dn,depthTexture:new Ls(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Yi(f.framebufferWidth,f.framebufferHeight,{format:Hn,type:Dn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),P.setContext(r),P.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}let te=new G,ne=new G;function N(e,t,n){te.setFromMatrixPosition(t.matrixWorld),ne.setFromMatrixPosition(n.matrixWorld);let r=te.distanceTo(ne),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function re(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;re(O,i);for(let e=0;e<a.length;e++)re(a[e],i);a.length===2?N(O,T,E):O.projectionMatrix.copy(T.projectionMatrix),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),ie(e,O,i)};function ie(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=ci*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ae=null;function oe(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new Hc,o.layers.enable(n),o.viewport=new qi,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new zs,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ae&&ae(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let P=new bl;P.setAnimationLoop(oe),this.setAnimationLoop=function(e){ae=e},this.dispose=function(){}}},Af=new Qi,jf=new K;jf.set(-1,0,0,0,1,0,0,0,1);function Mf(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Ks(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Af.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(jf),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Nf(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return V(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?B(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):B(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var Pf=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Ff=null;function If(){return Ff===null&&(Ff=new xs(Pf,16,16,qn,Pn),Ff.name=`DFG_LUT`,Ff.minFilter=wn,Ff.magFilter=wn,Ff.wrapS=yn,Ff.wrapT=yn,Ff.generateMipmaps=!1,Ff.needsUpdate=!0),Ff}var Lf=class{constructor(e={}){let{canvas:t=Zr(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Dn}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([Yn,Jn,Kn]),g=new Set([Dn,Mn,An,Ln,Fn,In]),_=new Uint32Array(4),v=new Int32Array(4),y=new G,b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=Br;let j=0,ee=0,M=null,te=-1,ne=null,N=new qi,re=new qi,ie=null,ae=new J(0),oe=0,P=t.width,se=t.height,F=1,ce=null,le=null,ue=new qi(0,0,P,se),de=new qi(0,0,P,se),fe=!1,pe=new Ps,me=!1,he=!1,ge=new Qi,_e=new G,ve=new qi,ye={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},be=!1;function xe(){return M===null?F:1}let I=n;function Se(e,n){return t.getContext(e,n)}let Ce,we,L,Te,R,z,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,Be,Ve,He;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,Ge,!1),t.addEventListener(`webglcontextrestored`,Ke,!1),t.addEventListener(`webglcontextcreationerror`,qe,!1),I===null){let t=`webgl2`;if(I=Se(t,e),I===null)throw Se(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}Ue()}catch(e){throw t.removeEventListener(`webglcontextlost`,Ge,!1),t.removeEventListener(`webglcontextrestored`,Ke,!1),t.removeEventListener(`webglcontextcreationerror`,qe,!1),V(`WebGLRenderer: `+e.message),e}function Ue(){Ce=new eu(I),Ce.init(),Be=new Tf(I,Ce),we=new kl(I,Ce,e,Be),L=new Cf(I,Ce),we.reversedDepthBuffer&&d&&L.buffers.depth.setReversed(!0),O=I.createFramebuffer(),k=I.createFramebuffer(),A=I.createFramebuffer(),Te=new ru(I),R=new nf,z=new wf(I,Ce,L,R,we,Be,Te),Ee=new $l(T),De=new xl(I),Ve=new Dl(I,De),Oe=new tu(I,De,Te,Ve),ke=new au(I,Oe,De,Ve,Te),Le=new iu(I,we,z),Pe=new Al(R),Ae=new tf(T,Ee,Ce,we,Ve,Pe),je=new Mf(T,R),Me=new sf,Ne=new mf(Ce),Ie=new El(T,Ee,L,ke,p,s),Fe=new Sf(T,ke,we),He=new Nf(I,Te,we,L),Re=new Ol(I,Ce,Te),ze=new nu(I,Ce,Te),Te.programs=Ae.programs,T.capabilities=we,T.extensions=Ce,T.properties=R,T.renderLists=Me,T.shadowMap=Fe,T.state=L,T.info=Te}m!==1009&&(w=new su(m,t.width,t.height,o,r,i));let We=new kf(T,I);this.xr=We,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let e=Ce.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ce.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return F},this.setPixelRatio=function(e){e!==void 0&&(F=e,this.setSize(P,se,!1))},this.getSize=function(e){return e.set(P,se)},this.setSize=function(e,n,r=!0){if(We.isPresenting){B(`WebGLRenderer: Can't change size while VR device is presenting.`);return}P=e,se=n,t.width=Math.floor(e*F),t.height=Math.floor(n*F),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(P*F,se*F).floor()},this.setDrawingBufferSize=function(e,n,r){P=e,se=n,F=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009){V(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){B(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(N)},this.getViewport=function(e){return e.copy(ue)},this.setViewport=function(e,t,n,r){e.isVector4?ue.set(e.x,e.y,e.z,e.w):ue.set(e,t,n,r),L.viewport(N.copy(ue).multiplyScalar(F).round())},this.getScissor=function(e){return e.copy(de)},this.setScissor=function(e,t,n,r){e.isVector4?de.set(e.x,e.y,e.z,e.w):de.set(e,t,n,r),L.scissor(re.copy(de).multiplyScalar(F).round())},this.getScissorTest=function(){return fe},this.setScissorTest=function(e){L.setScissorTest(fe=e)},this.setOpaqueSort=function(e){ce=e},this.setTransparentSort=function(e){le=e},this.getClearColor=function(e){return e.copy(Ie.getClearColor())},this.setClearColor=function(){Ie.setClearColor(...arguments)},this.getClearAlpha=function(){return Ie.getClearAlpha()},this.setClearAlpha=function(){Ie.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(M!==null){let t=M.texture.format;e=h.has(t)}if(e){let e=M.texture.type,t=g.has(e),n=Ie.getClearColor(),r=Ie.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,I.clearBufferuiv(I.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,I.clearBufferiv(I.COLOR,0,v))}else r|=I.COLOR_BUFFER_BIT}t&&(r|=I.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&I.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Ge,!1),t.removeEventListener(`webglcontextrestored`,Ke,!1),t.removeEventListener(`webglcontextcreationerror`,qe,!1),Ie.dispose(),Me.dispose(),Ne.dispose(),R.dispose(),Ee.dispose(),ke.dispose(),Ve.dispose(),He.dispose(),Ae.dispose(),We.dispose(),We.removeEventListener(`sessionstart`,et),We.removeEventListener(`sessionend`,tt),nt.stop()};function Ge(e){e.preventDefault(),$r(`WebGLRenderer: Context Lost.`),E=!0}function Ke(){$r(`WebGLRenderer: Context Restored.`),E=!1;let e=Te.autoReset,t=Fe.enabled,n=Fe.autoUpdate,r=Fe.needsUpdate,i=Fe.type;Ue(),Te.autoReset=e,Fe.enabled=t,Fe.autoUpdate=n,Fe.needsUpdate=r,Fe.type=i}function qe(e){V(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function Je(e){let t=e.target;t.removeEventListener(`dispose`,Je),Ye(t)}function Ye(e){Xe(e),R.remove(e)}function Xe(e){let t=R.get(e).programs;t!==void 0&&(t.forEach(function(e){Ae.releaseProgram(e)}),e.isShaderMaterial&&Ae.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ye);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=ft(e,t,n,r,i);L.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Oe.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Ve.setup(i,r,s,n,c);let h,g=Re;if(c!==null&&(h=De.get(c),g=ze,g.setIndex(h)),i.isMesh)r.wireframe===!0?(L.setLineWidth(r.wireframeLinewidth*xe()),g.setMode(I.LINES)):g.setMode(I.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),L.setLineWidth(e*xe()),i.isLineSegments?g.setMode(I.LINES):i.isLineLoop?g.setMode(I.LINE_LOOP):g.setMode(I.LINE_STRIP)}else i.isPoints?g.setMode(I.POINTS):i.isSprite&&g.setMode(I.TRIANGLES);if(i.isBatchedMesh){if(Ce.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?De.get(c).bytesPerElement:1,o=R.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(I,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function Ze(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),me===!0&&Pe.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,ct(e,t,r),e.side=0,e.needsUpdate=!0,ct(e,t,r),e.side=2):ct(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Ne.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),he=this.localClippingEnabled,me=Pe.init(this.clippingPlanes,he),me===!0&&Pe.setGlobalState(this.clippingPlanes,t),D!==null&&Fe.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];Ze(o,n,t,e),r.add(o)}else Ze(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){let t=R.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}Ce.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Qe=null;function $e(e){Qe&&Qe(e)}function et(){nt.stop()}function tt(){nt.start()}let nt=new bl;nt.setAnimationLoop($e),typeof self<`u`&&nt.setContext(self),this.setAnimationLoop=function(e){Qe=e,We.setAnimationLoop(e),e===null?nt.stop():nt.start()},We.addEventListener(`sessionstart`,et),We.addEventListener(`sessionend`,tt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){V(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=We.enabled===!0&&We.isPresenting===!0,r=w!==null&&(M===null||n)&&w.begin(T,M);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),We.enabled===!0&&We.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(We.cameraAutoUpdate===!0&&We.updateCamera(t),t=We.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,M),x=Ne.get(e,C.length),x.init(t),x.state.textureUnits=z.getTextureUnits(),C.push(x),ge.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),pe.setFromProjectionMatrix(ge,qr,t.reversedDepth),he=this.localClippingEnabled,me=Pe.init(this.clippingPlanes,he),b=Me.get(e,S.length),b.init(),S.push(b),We.enabled===!0&&We.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&rt(e,t,-1/0,T.sortObjects)}rt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(ce,le),be=We.enabled===!1||We.isPresenting===!1||We.hasDepthSensing()===!1,be&&Ie.addToRenderList(b,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),me===!0&&Pe.beginShadows();let i=x.state.shadowsArray;if(Fe.render(i,e,t),me===!0&&Pe.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];at(n,r,e,a)}be&&Ie.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];it(b,e,n,n.viewport)}}else r.length>0&&at(n,r,e,t),be&&Ie.render(e),it(b,e,t)}M!==null&&ee===0&&(z.updateMultisampleRenderTarget(M),z.updateRenderTargetMipmap(M)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Ve.resetDefaultState(),te=-1,ne=null,C.pop(),C.length>0?(x=C[C.length-1],z.setTextureUnits(x.state.textureUnits),me===!0&&Pe.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function rt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)x.pushLightProbeGrid(e);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(pe)){r&&ve.setFromMatrixPosition(e.matrixWorld).applyMatrix4(ge);let i=ke.update(e),a=e.material;a.visible&&b.push(e,i,a,n,ve.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(pe))){let i=ke.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),ve.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),ve.copy(e.boundingSphere.center)),ve.applyMatrix4(e.matrixWorld).applyMatrix4(ge)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,ve.z,s,t)}}else a.visible&&b.push(e,i,a,n,ve.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)rt(i[e],t,n,r)}function it(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),me===!0&&Pe.setGlobalState(T.clippingPlanes,n),r&&L.viewport(N.copy(r)),i.length>0&&ot(i,t,n),a.length>0&&ot(a,t,n),o.length>0&&ot(o,t,n),L.buffers.depth.setTest(!0),L.buffers.depth.setMask(!0),L.buffers.color.setMask(!0),L.setPolygonOffset(!1)}function at(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=Ce.has(`EXT_color_buffer_half_float`)||Ce.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new Yi(1,1,{generateMipmaps:!0,type:e?Pn:Dn,minFilter:En,samples:Math.max(4,we.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:q.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||N;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(ae),oe=T.getClearAlpha(),oe<1&&T.setClearColor(16777215,.5),T.clear(),be&&Ie.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),me===!0&&Pe.setGlobalState(T.clippingPlanes,r),ot(e,n,r),z.updateMultisampleRenderTarget(a),z.updateRenderTargetMipmap(a),Ce.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,st(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(z.updateMultisampleRenderTarget(a),z.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(ae,oe),d!==void 0&&(r.viewport=d),T.toneMapping=u}function ot(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&st(o,t,n,s,l,c)}}function st(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function ct(e,t,n){t.isScene!==!0&&(t=ye);let r=R.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Ae.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Ae.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Ee.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,Je),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return ut(e,s),d}else s.uniforms=Ae.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Ae.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Pe.uniform),ut(e,s),r.needsLights=mt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=x.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function lt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=md.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function ut(e,t){let n=R.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function dt(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];y.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(y))return n}return null}function ft(e,t,n,r,i){t.isScene!==!0&&(t=ye),z.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=M===null?T.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:q.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Ee.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=R.get(r),y=x.state.lights;if(me===!0&&(he===!0||e!==ne)){let t=e===ne&&r.id===te;Pe.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Pe.numPlanes||v.numIntersection!==Pe.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=x.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;b===!0&&(S=ct(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,S,v));let C=!1,w=!1,E=!1,O=S.getUniforms(),k=v.uniforms;if(L.useProgram(S.program)&&(C=!0,w=!0,E=!0),r.id!==te&&(te=r.id,w=!0),v.needsLights){let e=dt(x.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,w=!0)}if(C||ne!==e){L.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),O.setValue(I,`projectionMatrix`,e.projectionMatrix),O.setValue(I,`viewMatrix`,e.matrixWorldInverse);let t=O.map.cameraPosition;t!==void 0&&t.setValue(I,_e.setFromMatrixPosition(e.matrixWorld)),we.logarithmicDepthBuffer&&O.setValue(I,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&O.setValue(I,`isOrthographic`,e.isOrthographicCamera===!0),ne!==e&&(ne=e,w=!0,E=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&O.setValue(I,`sunShadowMap`,y.state.sunShadowMap,z),y.state.directionalShadowMap.length>0&&O.setValue(I,`directionalShadowMap`,y.state.directionalShadowMap,z),y.state.spotShadowMap.length>0&&O.setValue(I,`spotShadowMap`,y.state.spotShadowMap,z),y.state.pointShadowMap.length>0&&O.setValue(I,`pointShadowMap`,y.state.pointShadowMap,z)),i.isSkinnedMesh){O.setOptional(I,i,`bindMatrix`),O.setOptional(I,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),O.setValue(I,`boneTexture`,e.boneTexture,z))}i.isBatchedMesh&&(O.setOptional(I,i,`batchingTexture`),O.setValue(I,`batchingTexture`,i._matricesTexture,z),O.setOptional(I,i,`batchingIdTexture`),O.setValue(I,`batchingIdTexture`,i._indirectTexture,z),O.setOptional(I,i,`batchingColorTexture`),i._colorsTexture!==null&&O.setValue(I,`batchingColorTexture`,i._colorsTexture,z));let A=n.morphAttributes;if((A.position!==void 0||A.normal!==void 0||A.color!==void 0)&&Le.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,O.setValue(I,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=If()),w){if(O.setValue(I,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&pt(k,E),a&&r.fog===!0&&je.refreshFogUniforms(k,a),je.refreshMaterialUniforms(k,r,F,se,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}md.upload(I,lt(v),k,z)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(md.upload(I,lt(v),k,z),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&O.setValue(I,`center`,i.center),O.setValue(I,`modelViewMatrix`,i.modelViewMatrix),O.setValue(I,`normalMatrix`,i.normalMatrix),O.setValue(I,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];He.update(n,S),He.bind(n,S)}}return S}function pt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function mt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(e,t,n){let r=R.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),R.get(e.texture).__webglTexture=t,R.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=R.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){M=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=R.get(e);if(o.__useDefaultFramebuffer!==void 0){L.bindFramebuffer(I.FRAMEBUFFER,o.__webglFramebuffer),N.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest,L.viewport(N),L.scissor(re),L.setScissorTest(ie),te=-1;return}if(o.__webglFramebuffer===void 0)z.setupRenderTarget(e);else if(o.__hasExternalTextures)z.rebindTextures(e,R.get(e.texture).__webglTexture,R.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&R.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);z.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=R.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&z.useMultisampledRTT(e)===!1?R.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,N.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest}else N.copy(ue).multiplyScalar(F).floor(),re.copy(de).multiplyScalar(F).floor(),ie=fe;if(n!==0&&(r=O),L.bindFramebuffer(I.FRAMEBUFFER,r)&&L.drawBuffers(e,r),L.viewport(N),L.scissor(re),L.setScissorTest(ie),i){let r=R.get(e.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=R.get(e.textures[t]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=R.get(e.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,t.__webglTexture,n)}te=-1};function ht(e){let t=R.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=we.textureFormatReadable(e.format),t.__typeReadable=we.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){V(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=R.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){L.bindFramebuffer(I.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+s);let u=ht(o);if(u.__formatReadable===!1){V(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){V(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&I.readPixels(t,n,r,i,Be.convert(c),Be.convert(l),a)}finally{let e=M===null?null:R.get(M).__webglFramebuffer;L.bindFramebuffer(I.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=R.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){L.bindFramebuffer(I.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+s);let d=ht(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,f),I.bufferData(I.PIXEL_PACK_BUFFER,a.byteLength,I.STREAM_READ),I.readPixels(t,n,r,i,Be.convert(l),Be.convert(u),0),I.bindBuffer(I.PIXEL_PACK_BUFFER,null);let p=M===null?null:R.get(M).__webglFramebuffer;L.bindFramebuffer(I.FRAMEBUFFER,p);let m=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await ni(I,m,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,f),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,a),I.bindBuffer(I.PIXEL_PACK_BUFFER,null),I.deleteBuffer(f),I.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;z.setTexture2D(e,0),I.copyTexSubImage2D(I.TEXTURE_2D,n,0,0,o,s,i,a),L.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Be.convert(t.format),_=Be.convert(t.type),v;t.isData3DTexture?(z.setTexture3D(t,0),v=I.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(z.setTexture2DArray(t,0),v=I.TEXTURE_2D_ARRAY):(z.setTexture2D(t,0),v=I.TEXTURE_2D),L.activeTexture(I.TEXTURE0),L.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,t.flipY),L.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),L.pixelStorei(I.UNPACK_ALIGNMENT,t.unpackAlignment);let y=L.getParameter(I.UNPACK_ROW_LENGTH),b=L.getParameter(I.UNPACK_IMAGE_HEIGHT),x=L.getParameter(I.UNPACK_SKIP_PIXELS),S=L.getParameter(I.UNPACK_SKIP_ROWS),C=L.getParameter(I.UNPACK_SKIP_IMAGES);L.pixelStorei(I.UNPACK_ROW_LENGTH,h.width),L.pixelStorei(I.UNPACK_IMAGE_HEIGHT,h.height),L.pixelStorei(I.UNPACK_SKIP_PIXELS,l),L.pixelStorei(I.UNPACK_SKIP_ROWS,u),L.pixelStorei(I.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=R.get(e),r=R.get(t),h=R.get(n.__renderTarget),g=R.get(r.__renderTarget);L.bindFramebuffer(I.READ_FRAMEBUFFER,h.__webglFramebuffer),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,R.get(e).__webglTexture,i,d+n),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,R.get(t).__webglTexture,a,m+n)),I.blitFramebuffer(l,u,o,s,f,p,o,s,I.DEPTH_BUFFER_BIT,I.NEAREST);L.bindFramebuffer(I.READ_FRAMEBUFFER,null),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||R.has(e)){let n=R.get(e),r=R.get(t);L.bindFramebuffer(I.READ_FRAMEBUFFER,k),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,n.__webglTexture,i),T?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,r.__webglTexture,a),i===0?T?I.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):I.copyTexSubImage2D(v,a,f,p,l,u,o,s):I.blitFramebuffer(l,u,o,s,f,p,o,s,I.COLOR_BUFFER_BIT,I.NEAREST);L.bindFramebuffer(I.READ_FRAMEBUFFER,null),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?I.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?I.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):I.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):I.texSubImage2D(I.TEXTURE_2D,a,f,p,o,s,g,_,h);L.pixelStorei(I.UNPACK_ROW_LENGTH,y),L.pixelStorei(I.UNPACK_IMAGE_HEIGHT,b),L.pixelStorei(I.UNPACK_SKIP_PIXELS,x),L.pixelStorei(I.UNPACK_SKIP_ROWS,S),L.pixelStorei(I.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&I.generateMipmap(v),L.unbindTexture()},this.initRenderTarget=function(e){R.get(e).__webglFramebuffer===void 0&&z.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?z.setTextureCube(e,0):e.isData3DTexture?z.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?z.setTexture2DArray(e,0):z.setTexture2D(e,0),L.unbindTexture()},this.resetState=function(){j=0,ee=0,M=null,L.reset(),Ve.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return qr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=q._getDrawingBufferColorSpace(e),t.unpackColorSpace=q._getUnpackColorSpace()}},Rf={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},zf=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Bf=new Gc(-1,1,1,-1,0,1),Vf=new class extends ko{constructor(){super(),this.setAttribute(`position`,new _o([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new _o([0,2,0,0,2,0],2))}},Hf=class{constructor(e){this._mesh=new vs(Vf,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Bf)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Uf=class extends zf{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Xs?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=qs.clone(e.uniforms),this.material=new Xs({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Hf(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Wf=class extends zf{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Gf=class extends zf{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Kf=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new W);this._width=n.width,this._height=n.height,t=new Yi(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Pn}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Uf(Rf),this.copyPass.material.blending=0,this.timer=new Qc}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}Wf!==void 0&&(r instanceof Wf?n=!0:r instanceof Gf&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new W);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},qf={type:`change`},Jf={type:`start`},Yf={type:`end`},Xf=new as,Zf=new Io,Qf=Math.cos(70*ki.DEG2RAD),$f=new G,ep=2*Math.PI,Z={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},tp=1e-6,np=class extends _l{constructor(e,t=null){super(e,t),this.state=Z.NONE,this.target=new G,this.cursor=new G,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:gn.ROTATE,MIDDLE:gn.DOLLY,RIGHT:gn.PAN},this.touches={ONE:_n.ROTATE,TWO:_n.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new G,this._lastQuaternion=new Ai,this._lastTargetPosition=new G,this._quat=new Ai().setFromUnitVectors(e.up,new G(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new gl,this._sphericalDelta=new gl,this._scale=1,this._panOffset=new G,this._rotateStart=new W,this._rotateEnd=new W,this._rotateDelta=new W,this._panStart=new W,this._panEnd=new W,this._panDelta=new W,this._dollyStart=new W,this._dollyEnd=new W,this._dollyDelta=new W,this._dollyDirection=new G,this._mouse=new W,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=ip.bind(this),this._onPointerDown=rp.bind(this),this._onPointerUp=ap.bind(this),this._onContextMenu=fp.bind(this),this._onMouseWheel=cp.bind(this),this._onKeyDown=lp.bind(this),this._onTouchStart=up.bind(this),this._onTouchMove=dp.bind(this),this._onMouseDown=op.bind(this),this._onMouseMove=sp.bind(this),this._interceptControlDown=pp.bind(this),this._interceptControlUp=mp.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=Z.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(qf),this.update(),this.state=Z.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;$f.copy(t).sub(this.target),$f.applyQuaternion(this._quat),this._spherical.setFromVector3($f),this.autoRotate&&this.state===Z.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=ep:n>Math.PI&&(n-=ep),r<-Math.PI?r+=ep:r>Math.PI&&(r-=ep),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if($f.setFromSpherical(this._spherical),$f.applyQuaternion(this._quatInverse),t.copy(this.target).add($f),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=$f.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new G(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new G(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=$f.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(Xf.origin.copy(this.object.position),Xf.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Xf.direction))<Qf?this.object.lookAt(this.target):(Zf.setFromNormalAndCoplanarPoint(this.object.up,this.target),Xf.intersectPlane(Zf,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>tp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>tp||this._lastTargetPosition.distanceToSquared(this.target)>tp?(this.dispatchEvent(qf),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?ep/60/60*this.autoRotateSpeed:ep/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){$f.setFromMatrixColumn(t,0),$f.multiplyScalar(-e),this._panOffset.add($f)}_panUp(e,t){this.screenSpacePanning===!0?$f.setFromMatrixColumn(t,1):($f.setFromMatrixColumn(t,0),$f.crossVectors(this.object.up,$f)),$f.multiplyScalar(e),this._panOffset.add($f)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;$f.copy(r).sub(this.target);let i=$f.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ep*this._rotateDelta.x/t.clientHeight),this._rotateUp(ep*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(ep*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-ep*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(ep*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-ep*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ep*this._rotateDelta.x/t.clientHeight),this._rotateUp(ep*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new W,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function rp(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function ip(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function ap(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(Yf),this.state=Z.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function op(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case gn.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=Z.DOLLY;break;case gn.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Z.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Z.ROTATE}break;case gn.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Z.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Z.PAN}break;default:this.state=Z.NONE}this.state!==Z.NONE&&this.dispatchEvent(Jf)}function sp(e){switch(this.state){case Z.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case Z.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case Z.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function cp(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===Z.NONE&&(e.preventDefault(),this.dispatchEvent(Jf),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(Yf))}function lp(e){this.enabled!==!1&&this._handleKeyDown(e)}function up(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case _n.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=Z.TOUCH_ROTATE;break;case _n.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=Z.TOUCH_PAN;break;default:this.state=Z.NONE}break;case 2:switch(this.touches.TWO){case _n.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=Z.TOUCH_DOLLY_PAN;break;case _n.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=Z.TOUCH_DOLLY_ROTATE;break;default:this.state=Z.NONE}break;default:this.state=Z.NONE}this.state!==Z.NONE&&this.dispatchEvent(Jf)}function dp(e){switch(this._trackPointer(e),this.state){case Z.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case Z.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case Z.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case Z.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=Z.NONE}}function fp(e){this.enabled!==!1&&e.preventDefault()}function pp(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function mp(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var hp=class extends zf{constructor(e,t,n,r={}){super(),this.pixelSize=e,this.scene=t,this.camera=n,this.normalEdgeStrength=r.normalEdgeStrength||.3,this.depthEdgeStrength=r.depthEdgeStrength||.4,this.pixelatedMaterial=this._createPixelatedMaterial(),this._resolution=new W,this._renderResolution=new W,this._normalMaterial=new $s,this._beautyRenderTarget=new Yi,this._beautyRenderTarget.texture.minFilter=xn,this._beautyRenderTarget.texture.magFilter=xn,this._beautyRenderTarget.texture.type=Pn,this._beautyRenderTarget.depthTexture=new Ls,this._normalRenderTarget=new Yi,this._normalRenderTarget.texture.minFilter=xn,this._normalRenderTarget.texture.magFilter=xn,this._normalRenderTarget.texture.type=Pn,this._fsQuad=new Hf(this.pixelatedMaterial)}dispose(){this._beautyRenderTarget.dispose(),this._normalRenderTarget.dispose(),this.pixelatedMaterial.dispose(),this._normalMaterial.dispose(),this._fsQuad.dispose()}setSize(e,t){this._resolution.set(e,t),this._renderResolution.set(e/this.pixelSize|0,t/this.pixelSize|0);let{x:n,y:r}=this._renderResolution;this._beautyRenderTarget.setSize(n,r),this._normalRenderTarget.setSize(n,r),this._fsQuad.material.uniforms.resolution.value.set(n,r,1/n,1/r)}setPixelSize(e){this.pixelSize=e,this.setSize(this._resolution.x,this._resolution.y)}render(e,t){let n=this._fsQuad.material.uniforms;n.normalEdgeStrength.value=this.normalEdgeStrength,n.depthEdgeStrength.value=this.depthEdgeStrength,e.setRenderTarget(this._beautyRenderTarget),e.render(this.scene,this.camera);let r=this.scene.overrideMaterial;e.setRenderTarget(this._normalRenderTarget),this.scene.overrideMaterial=this._normalMaterial,e.render(this.scene,this.camera),this.scene.overrideMaterial=r,n.tDiffuse.value=this._beautyRenderTarget.texture,n.tDepth.value=this._beautyRenderTarget.depthTexture,n.tNormal.value=this._normalRenderTarget.texture,this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear()),this._fsQuad.render(e)}_createPixelatedMaterial(){return new Xs({uniforms:{tDiffuse:{value:null},tDepth:{value:null},tNormal:{value:null},resolution:{value:new qi},normalEdgeStrength:{value:0},depthEdgeStrength:{value:0}},vertexShader:`
				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`
				uniform sampler2D tDiffuse;
				uniform sampler2D tDepth;
				uniform sampler2D tNormal;
				uniform vec4 resolution;
				uniform float normalEdgeStrength;
				uniform float depthEdgeStrength;
				varying vec2 vUv;

				float getDepth(int x, int y) {

					return texture2D( tDepth, vUv + vec2(x, y) * resolution.zw ).r;

				}

				vec3 getNormal(int x, int y) {

					return texture2D( tNormal, vUv + vec2(x, y) * resolution.zw ).rgb * 2.0 - 1.0;

				}

				float depthEdgeIndicator(float depth, vec3 normal) {

					float diff = 0.0;
					diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
					diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
					diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
					diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
					return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;

				}

				float neighborNormalEdgeIndicator(int x, int y, float depth, vec3 normal) {

					float depthDiff = getDepth(x, y) - depth;
					vec3 neighborNormal = getNormal(x, y);

					// Edge pixels should yield to faces who's normals are closer to the bias normal.
					vec3 normalEdgeBias = vec3(1., 1., 1.); // This should probably be a parameter.
					float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
					float normalIndicator = clamp(smoothstep(-.01, .01, normalDiff), 0.0, 1.0);

					// Only the shallower pixel should detect the normal edge.
					float depthIndicator = clamp(sign(depthDiff * .25 + .0025), 0.0, 1.0);

					return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;

				}

				float normalEdgeIndicator(float depth, vec3 normal) {

					float indicator = 0.0;

					indicator += neighborNormalEdgeIndicator(0, -1, depth, normal);
					indicator += neighborNormalEdgeIndicator(0, 1, depth, normal);
					indicator += neighborNormalEdgeIndicator(-1, 0, depth, normal);
					indicator += neighborNormalEdgeIndicator(1, 0, depth, normal);

					return step(0.1, indicator);

				}

				void main() {

					vec4 texel = texture2D( tDiffuse, vUv );

					float depth = 0.0;
					vec3 normal = vec3(0.0);

					if (depthEdgeStrength > 0.0 || normalEdgeStrength > 0.0) {

						depth = getDepth(0, 0);
						normal = getNormal(0, 0);

					}

					float dei = 0.0;
					if (depthEdgeStrength > 0.0)
						dei = depthEdgeIndicator(depth, normal);

					float nei = 0.0;
					if (normalEdgeStrength > 0.0)
						nei = normalEdgeIndicator(depth, normal);

					float Strength = dei > 0.0 ? (1.0 - depthEdgeStrength * dei) : (1.0 + normalEdgeStrength * nei);

					gl_FragColor = texel * Strength;

				}
			`})}},gp={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`},_p=class extends zf{constructor(){super(),this.isOutputPass=!0,this.uniforms=qs.clone(gp.uniforms),this.material=new Zs({name:gp.name,uniforms:this.uniforms,vertexShader:gp.vertexShader,fragmentShader:gp.fragmentShader}),this._fsQuad=new Hf(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},q.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};function vp(e,t=!1){let n=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},o={},s=e[0].morphTargetsRelative,c=new ko,l=0;for(let u=0;u<e.length;++u){let d=e[u],f=0;if(n!==(d.index!==null))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`),null;for(let e in d.attributes){if(!r.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`),null;a[e]===void 0&&(a[e]=[]),a[e].push(d.attributes[e]),f++}if(f!==r.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of attributes.`),null;if(s!==d.morphTargetsRelative)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. .morphTargetsRelative must be consistent throughout all geometries.`),null;for(let e in d.morphAttributes){if(!i.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`.  .morphAttributes must be consistent throughout all geometries.`),null;o[e]===void 0&&(o[e]=[]),o[e].push(d.morphAttributes[e])}if(t){let e;if(n)e=d.index.count;else if(d.attributes.position!==void 0)e=d.attributes.position.count;else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. The geometry must have either an index or a position attribute`),null;c.addGroup(l,e,u),l+=e}}if(n){let t=0,n=[];for(let r=0;r<e.length;++r){let i=e[r].index;for(let e=0;e<i.count;++e)n.push(i.getX(e)+t);t+=e[r].attributes.position.count}c.setIndex(n)}for(let e in a){let t=yp(a[e]);if(!t)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` attribute.`),null;c.setAttribute(e,t)}for(let e in o){let t=o[e][0].length;if(t!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[e]=[];for(let n=0;n<t;++n){let t=[];for(let r=0;r<o[e].length;++r)t.push(o[e][r][n]);let r=yp(t);if(!r)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` morphAttribute.`),null;c.morphAttributes[e].push(r)}}}return c}function yp(e){let t,n,r,i=-1,a=0;for(let o=0;o<e.length;++o){let s=e[o];if(t===void 0&&(t=s.array.constructor),t!==s.array.constructor)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`),null;if(n===void 0&&(n=s.itemSize),n!==s.itemSize)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`),null;if(r===void 0&&(r=s.normalized),r!==s.normalized)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`),null;if(i===-1&&(i=s.gpuType),i!==s.gpuType)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`),null;a+=s.count*n}let o=new t(a),s=new mo(o,n,r),c=0;for(let t=0;t<e.length;++t){let r=e[t];if(r.isInterleavedBufferAttribute){let e=c/n;for(let t=0,i=r.count;t<i;t++)for(let i=0;i<n;i++){let n=r.getComponent(t,i);s.setComponent(t+e,i,n)}}else o.set(r.array,c);c+=r.count*n}return i!==void 0&&(s.gpuType=i),s}var bp=.16,xp=[-2,0,-2,4,1,4,`s`],Sp=e=>[-1,1,-1,2,e,2,`m`],Cp=e=>[-1,e,-1,2,2,2,`m`],wp={1:[xp,Sp(3),Cp(4),[2,1,0,1,7,1,`w`],[2,8,0,1,1,1,`i`]],2:[xp,Sp(4),[-1,5,-3,2,2,4,`m`],[-1,7,-3,2,1,2,`m`],[-1,8,-3,1,1,1,`s`],[0,8,-3,1,1,1,`s`],[-1,6,-4,1,1,1,`e`],[0,6,-4,1,1,1,`e`],[2,1,0,1,6,1,`w`],[2,7,0,1,1,1,`i`]],3:[xp,Sp(5),[-1,6,-1,2,2,2,`a`],[0,8,0,1,2,1,`a`],[-1,9,0,3,1,1,`a`]],4:[xp,[-2,1,-2,4,5,4,`m`],[-2,6,-2,1,1,1,`m`],[1,6,-2,1,1,1,`m`],[-2,6,1,1,1,1,`m`],[1,6,1,1,1,1,`m`],[-1,2,-3,2,2,1,`k`]],5:[xp,[-2,1,-2,4,2,4,`m`],Sp(7),[-1,8,-1,2,1,2,`a`],[-1,9,-1,1,1,1,`a`],[0,9,0,1,1,1,`a`],[-1,9,0,1,1,1,`a`],[0,9,-1,1,1,1,`a`],[0,10,0,1,1,1,`e`]],6:[xp,Sp(6),[-2,4,-1,4,2,2,`m`],[-1,7,-1,2,1,2,`a`],[0,8,0,1,3,1,`a`],[-1,9,0,3,1,1,`a`],[-2,1,0,1,3,1,`s`],[1,1,0,1,3,1,`s`]],7:[xp,Sp(4),Cp(5),[-1,6,-1,2,1,2,`s`],[2,1,0,1,6,1,`w`],[3,2,0,1,4,1,`l`],[1,4,-3,1,1,3,`w`]],8:[xp,[-2,1,-1,4,4,2,`m`],Cp(5),[-1,7,-1,2,1,2,`i`],[-4,1,-1,1,4,3,`a`],[-4,2,0,1,2,1,`e`],[3,1,0,1,6,1,`w`],[2,6,-1,3,2,2,`i`]],9:[[-3,0,-3,6,1,6,`s`],[-3,1,-2,6,4,4,`m`],Cp(5),[-3,1,-3,6,5,1,`i`],[-2,6,-2,4,1,4,`i`],[-1,3,-4,2,1,1,`a`]],10:[xp,Sp(3),Cp(4),[-2,6,-2,4,1,4,`a`],[0,7,0,1,1,1,`a`],[2,1,0,1,6,1,`w`],[2,7,0,1,1,1,`g`],[-1,5,-2,2,1,1,`l`]],11:[xp,[-2,1,-2,4,3,3,`m`],[-2,2,-4,4,3,2,`m`],[-2,1,-4,4,1,1,`k`],[-2,2,-5,1,1,1,`l`],[1,2,-5,1,1,1,`l`],[-2,4,-4,1,1,1,`e`],[1,4,-4,1,1,1,`e`],[-1,4,-1,1,1,1,`k`],[0,4,0,1,1,1,`k`],[-1,4,1,1,1,1,`k`]]},Tp={k:2236468,w:9393723,i:10202551,e:14243683,l:16777215,g:10085712},Ep=[{m:15854038,s:13616296,a:16511542},{m:4867666,s:9078424,a:11285042}],Dp=(e,t)=>Ep[t][e]??Tp[e]??16711935,Op={1:`models/pawn.json`,2:`models/knight.json`,3:`models/bishop.json`,4:`models/rook.json`,5:`models/queen.json`,6:`models/king.json`,7:`models/archer.json`,8:`models/paladin.json`,9:`models/guard.json`,10:`models/maester.json`,11:`models/beast.json`},kp={1:.85,2:1.1,3:1.2,4:1.05,5:1.4,6:1.55,7:1.15,8:1.3,9:1.1,10:1.1,11:1.05},Ap=new Map,jp=!0;function Mp(e){jp=e}async function Np(e=`./`){await Promise.all(Object.entries(Op).map(async([t,n])=>{let r=await fetch(e+n).catch(()=>null);r?.ok&&Ap.set(+t,await r.json())}))}var Pp=[[1,0,0,[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[-1,0,0,[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],[0,1,0,[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],[0,-1,0,[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[0,0,1,[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],[0,0,-1,[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]];function Fp(e,t,n){let r=n/e.size[1],i=(e,t,n)=>`${e},${t},${n}`,a=new Set(e.voxels.map(e=>i(...e))),o=1/0,s=-1/0,c=1/0,l=-1/0;for(let[t,,n]of e.voxels)o=Math.min(o,t),s=Math.max(s,t),c=Math.min(c,n),l=Math.max(l,n);let u=-(o+s+1)/2,d=-(c+l+1)/2,f=new J(Ep[t].m),p=new J(Ep[t].s),m=new J,h=[],g=[],_=[],v=[];for(let t=0;t<e.voxels.length;t++){let[n,o,s]=e.voxels[t],c=e.accent?.[t],l=c?m.setRGB(c[0]/255,c[1]/255,c[2]/255,Br):e.shade?m.copy(f).multiplyScalar(.6+.4*e.shade[t]/255):o<2?p:f,y=0,b=0,x=0;for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++)for(let r=-1;r<=1;r++)(e||t||r)&&!a.has(i(n+e,o+t,s+r))&&(y+=e,b+=t,x+=r);let S=Math.hypot(y,b,x);for(let[e,t,c,f]of Pp){if(a.has(i(n+e,o+t,s+c)))continue;let p=h.length/3,[m,C,w]=S>0?[y/S,b/S,x/S]:[e,t,c];for(let[e,t,i]of f)h.push((n+e+u)*r,(o+t)*r,(s+i+d)*r),g.push(m,C,w),_.push(l.r,l.g,l.b);v.push(p,p+1,p+2,p,p+2,p+3)}}let y=new ko;return y.setAttribute(`position`,new _o(h,3)),y.setAttribute(`normal`,new _o(g,3)),y.setAttribute(`color`,new _o(_,3)),y.setIndex(v),y}var Ip=new Map;function Lp(e,t){let n=`${e}:${t}:${jp?`s`:`p`}`,r=Ip.get(n);if(r)return r;let i=jp?Ap.get(e):void 0;if(i){let r=Fp(i,t,kp[e]);return Ip.set(n,r),r}let a=wp[e].map(([e,n,r,i,a,o,s])=>{let c=new Bs(i*bp,a*bp,o*bp);c.translate((e+i/2)*bp,(n+a/2)*bp,(r+o/2)*bp);let l=new J(Dp(s,t)),u=c.attributes.position.count,d=new Float32Array(u*3);for(let e=0;e<u;e++)d.set([l.r,l.g,l.b],e*3);return c.setAttribute(`color`,new mo(d,3)),c}),o=vp(a,!1);if(!o)throw Error(`mergeGeometries failed`);return a.forEach(e=>e.dispose()),Ip.set(n,o),o}var Rp=e=>1-(1-e)**3,zp=e=>e<.5?4*e*e*e:1-(-2*e+2)**3/2,Bp=e=>e,Vp=new Map;function Hp(e,t=.32){let n=Vp.get(e);if(!n){let t=document.createElement(`canvas`);t.width=t.height=32;let r=t.getContext(`2d`);r.fillStyle=`#151515`,r.fillRect(0,0,32,32),r.fillStyle=`#f1e9d6`,r.fillRect(2,2,28,28),r.fillStyle=`#151515`,r.font=`bold 22px monospace`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillText(e,16,17);let i=new Is(t);i.magFilter=i.minFilter=xn,i.colorSpace=Br,n=new zo({map:i}),Vp.set(e,n)}let r=new $o(n);return r.scale.setScalar(t),r}var Up=class{list=[];constructor(){typeof document<`u`&&document.addEventListener(`visibilitychange`,()=>{document.hidden&&this.flush()})}add(e,t,n=zp){return typeof document<`u`&&document.hidden?(t(1),Promise.resolve()):new Promise(r=>this.list.push({t:0,dur:e,ease:n,update:t,resolve:r}))}flush(){let e=this.list;this.list=[];for(let t of e)t.update(1),t.resolve()}wait(e){return this.add(e,()=>{},Bp)}step(e){for(let t of[...this.list]){t.t+=e;let n=Math.min(1,t.t/t.dur);t.update(t.ease(n)),n>=1&&(this.list.splice(this.list.indexOf(t),1),t.resolve())}}},Wp=class{max;mesh;pos;vel;life;cursor=0;m=new Qi;q=new Ai;s=new G;p=new G;constructor(e,t=400){this.max=t,this.mesh=new As(new Bs(.07,.07,.07),new ec,t),this.mesh.instanceMatrix.setUsage(Kr),this.mesh.frustumCulled=!1,this.pos=new Float32Array(t*3),this.vel=new Float32Array(t*3),this.life=new Float32Array(t);for(let e=0;e<t;e++)this.mesh.setMatrixAt(e,this.m.makeScale(0,0,0));this.mesh.setColorAt(0,new J(16777215)),e.add(this.mesh)}burst(e,t,n=28,r=3){let i=new J;for(let a=0;a<n;a++){let n=this.cursor=(this.cursor+1)%this.max;this.pos.set([e.x+(Math.random()-.5)*.3,e.y+Math.random()*.6,e.z+(Math.random()-.5)*.3],n*3);let o=Math.random()*Math.PI*2,s=(.4+Math.random()*.6)*r;this.vel.set([Math.cos(o)*s,2+Math.random()*r,Math.sin(o)*s],n*3),this.life[n]=.6+Math.random()*.5,this.mesh.setColorAt(n,i.setHex(t[a%t.length]))}this.mesh.instanceColor.needsUpdate=!0}step(e){let t=!1;for(let n=0;n<this.max;n++){if(this.life[n]<=0)continue;t=!0;let r=n*3;this.vel[r+1]-=12*e,this.pos[r]+=this.vel[r]*e,this.pos[r+1]+=this.vel[r+1]*e,this.pos[r+2]+=this.vel[r+2]*e,this.pos[r+1]<.035&&(this.pos[r+1]=.035,this.vel[r+1]*=-.35,this.vel[r]*=.6,this.vel[r+2]*=.6),this.life[n]-=e;let i=Math.max(0,Math.min(1,this.life[n]/.3));this.m.compose(this.p.set(this.pos[r],this.pos[r+1],this.pos[r+2]),this.q,this.s.setScalar(i)),this.mesh.setMatrixAt(n,this.m)}t&&(this.mesh.instanceMatrix.needsUpdate=!0)}},Gp=[0,2236468,4532284,6699313,9393723,14643494,14262374,15647642,16511542,10085712,6995504,3642478,4942127,5393188,3292217,4145012,3170434,5992161,6527999,6278628,13360124,16777215,10202551,8683143,6908522,5854802,7750282,11285042,14243683,14121914,9410378,9072432],Kp={db32:Gp,endesga32:[12470831,14120515,15389866,14984818,12087120,7552569,4073265,10626611,14957380,16217634,16690740,16705377,6539085,4098376,2513986,1653822,1199753,39387,2943221,16777215,12635100,9149364,5925256,3818598,2501444,1578021,16711748,6830188,11882632,16151930,15251350,12748137],warm:[1117965,2366744,3812900,5324592,7033919,9071695,11045475,12888184,14468237,15653542,16248008,16775395,2828838,4539452,6315603,8157805,10131591,12105379,13947584,3095074,4609071,6254396,8227917,10267236,5910306,8209449,10706735,13140284,2371651,3820131,5663624,8032685]};function qp(e){let t=new Uint8Array(e.length*4);e.forEach((e,n)=>t.set([e>>16&255,e>>8&255,e&255,255],n*4));let n=new xs(t,e.length,1,Hn);return n.minFilter=n.magFilter=xn,n.colorSpace=Br,n.needsUpdate=!0,n}function Jp(e=Gp,t=2,n=.03){return new Uf({uniforms:{tDiffuse:{value:null},tPalette:{value:qp(e)},paletteSize:{value:e.length},pixelSize:{value:t},ditherAmount:{value:n}},vertexShader:`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
      uniform sampler2D tDiffuse; uniform sampler2D tPalette;
      uniform float paletteSize; uniform float pixelSize; uniform float ditherAmount;
      varying vec2 vUv;
      // 4x4 ordered dither without arrays (GLSL ES 1.00 safe)
      float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
      float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
      void main(){
        vec2 px = floor(gl_FragCoord.xy / pixelSize);
        vec3 col = texture2D(tDiffuse, vUv).rgb;
        col = clamp(col + (bayer4(px) - 0.5) * ditherAmount, 0.0, 1.0);
        float bestD = 1e9; vec3 best = col;
        for (int i = 0; i < 64; i++) {
          if (float(i) >= paletteSize) break;
          vec3 pc = texture2D(tPalette, vec2((float(i) + 0.5) / paletteSize, 0.5)).rgb;
          vec3 d = col - pc; float dd = dot(d, d);
          if (dd < bestD) { bestD = dd; best = pc; }
        }
        gl_FragColor = vec4(best, 1.0);
      }`})}var Yp=new URLSearchParams(location.search),Xp=Yp.get(`army`)||`painted-blue-red`,Zp=1.15*(Number(Yp.get(`spriteScale`))||1),Qp={1:`pawn`,2:`knight`,3:`bishop`,4:`rook`,5:`queen`,6:`king`,7:`archer`,8:`paladin`,9:`guard`,10:`maester`,11:`beast`},$p=new Oc,em=new Map,tm=5;function nm(e,t){let n=tm,r=document.createElement(`canvas`);r.width=e.width+10,r.height=e.height+10;let i=r.getContext(`2d`);for(let t=0;t<8;t++){let r=t*Math.PI/4;i.drawImage(e,n+Math.round(Math.cos(r)*n),n+Math.round(Math.sin(r)*n))}return i.globalCompositeOperation=`source-in`,i.fillStyle=`#${t.toString(16).padStart(6,`0`)}`,i.fillRect(0,0,r.width,r.height),i.globalCompositeOperation=`source-over`,i.drawImage(e,n,n),r}function rm(e,t,n){let r=`${Qp[e]}-${t?`b`:`w`}`,i=n==null?r:`${r}:${n}`,a=em.get(i);return a||(a=$p.loadAsync(`./sprites/${Xp}/${r}.png`).then(e=>{let t=e;return n!=null&&(t=new Is(nm(e.image,n)),e.dispose()),t.magFilter=t.minFilter=xn,t.generateMipmaps=!1,t.colorSpace=Br,t}),em.set(i,a)),a}var im=new Map;function am(e,t){let n=`${e.toFixed(3)}:${t.toFixed(3)}`,r=im.get(n);return r||(r=new Vs(e,t),r.translate(0,t/2,0),im.set(n,r)),r}function om(e,t,n){let r=kp[e]*Zp,i=new os({alphaTest:.5,transparent:!1,side:2,visible:!1}),a=new vs(am(r,r),i);return rm(e,t,n).then(e=>{let t=e.image;a.geometry=am(r*t.width/t.height,r),i.map=e,i.visible=!0,i.needsUpdate=!0}).catch(()=>{}),a}var sm={dungeonVoxel:{label:`Dungeon`,pixelSize:2,palette:!1,dither:.06,normalEdge:.05,depthEdge:.15,shading:`lambert`,pieces:`voxel`,outline:!1,pieceScale:.85,camera:{elev:53,azim:0},tiles:`stone`,lights:`torch`,shadow:!0},cel:{label:`Cel pixel`,pixelSize:1,palette:!1,dither:.03,normalEdge:.05,depthEdge:.15,shading:`toon`,toonBands:4,pieces:`voxel`,outline:!0,pieceScale:.85},hd:{label:`HD pixel`,pixelSize:2,palette:!1,dither:.03,normalEdge:.15,depthEdge:.2,shading:`lambert`,pieces:`voxel`,outline:!0,pieceScale:.85},voxel:{label:`Clean voxel`,pixelSize:1,palette:!1,dither:.03,normalEdge:0,depthEdge:.35,shading:`lambert`,pieces:`voxel`,outline:!1},db32:{label:`16-bit palette`,pixelSize:2,palette:!0,dither:.03,normalEdge:.05,depthEdge:.3,shading:`lambert`,pieces:`voxel`,outline:!1},sprites:{label:`HD-2D sprites`,pixelSize:1,palette:!1,dither:.03,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1},chunkyVoxel:{label:`A1 Chunky voxel`,pixelSize:3,palette:!1,dither:0,normalEdge:.05,depthEdge:.1,shading:`toon`,toonBands:2,pieces:`voxel`,outline:!0,pieceScale:.85,tiles:`edged`,rim:1},chunkySprite:{label:`A2 Chunky sprite`,pixelSize:3,palette:!1,dither:0,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,tiles:`edged`,spriteOutline:!0},chunkyPalette:{label:`A3 Chunky + Endesga`,pixelSize:3,palette:!0,dither:.02,normalEdge:.05,depthEdge:.1,shading:`toon`,toonBands:2,pieces:`voxel`,outline:!0,pieceScale:.85,tiles:`edged`,rim:1,paletteName:`endesga32`},dungeonSprite:{label:`B1 Dungeon sprite`,pixelSize:2,palette:!1,dither:.06,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,camera:{elev:60,azim:0},tiles:`stone`,lights:`torch`,shadow:!0},dungeonBright:{label:`B3 Dungeon (bright)`,pixelSize:2,palette:!1,dither:.06,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,camera:{elev:60,azim:0},tiles:`stone`,lights:`bright`,shadow:!0},isoVoxel:{label:`C1 Iso voxel`,pixelSize:3,palette:!0,dither:.08,normalEdge:.05,depthEdge:.1,shading:`lambert`,pieces:`voxel`,outline:!0,pieceScale:.85,camera:{elev:30,azim:45,zoom:.85},paletteName:`warm`,rim:1,boardSide:.8,shadow:!0},isoSprite:{label:`C2 Iso sprite`,pixelSize:3,palette:!0,dither:.08,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,camera:{elev:30,azim:45,zoom:.85},paletteName:`warm`,spriteOutline:!0,boardSide:.8,shadow:!0},isoClean:{label:`C3 Iso clean`,pixelSize:3,palette:!1,dither:.03,normalEdge:.05,depthEdge:.1,shading:`lambert`,pieces:`voxel`,outline:!0,pieceScale:.85,camera:{elev:30,azim:45,zoom:.85},rim:1,boardSide:.8,shadow:!0}},cm=e=>new G(f(e)-3.5,0,3.5-p(e)),lm=15723491,um=7301989,dm=15328991,fm=1183242,pm=.04,mm=.3,hm={elev:54.2,azim:0},gm=13.5,_m=new G(0,.45,0),vm=(e,t,n)=>e+(t-e)*n;function ym(){let e=document.createElement(`canvas`);e.width=e.height=32;let t=e.getContext(`2d`);t.fillStyle=`#ffffff`,t.fillRect(0,0,32,32),t.fillStyle=`#3a3a3a`,t.fillRect(0,0,32,1),t.fillRect(0,31,32,1),t.fillRect(0,0,1,32),t.fillRect(31,0,1,32);let n=new Is(e);return n.magFilter=n.minFilter=xn,n.generateMipmaps=!1,n.colorSpace=Br,n}var bm=new Map;function xm(e){let t=bm.get(e);if(!t){let n=document.createElement(`canvas`);n.width=n.height=16;let r=n.getContext(`2d`);r.font=`bold 13px monospace`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillStyle=`#1a1611`,r.fillText(e,9,10),r.fillStyle=`#e7dcc2`,r.fillText(e,8,9);let i=new Is(n);i.magFilter=i.minFilter=xn,i.generateMipmaps=!1,i.colorSpace=Br,t=new os({map:i,transparent:!0,alphaTest:.5}),bm.set(e,t)}return t}function Sm(){let e=document.createElement(`canvas`);e.width=e.height=64;let t=e.getContext(`2d`),n=t.createRadialGradient(32,32,0,32,32,32);return n.addColorStop(0,`rgba(0,0,0,0.55)`),n.addColorStop(.6,`rgba(0,0,0,0.28)`),n.addColorStop(1,`rgba(0,0,0,0)`),t.fillStyle=n,t.fillRect(0,0,64,64),new Is(e)}var Cm=class{container;scene=new Pa;camera=new Gc(-1,1,1,-1,.1,100);world=new Ea;onSquareClick=()=>{};onSquareHover=()=>{};renderer;composer;pixelPass;palettePass;tiles=[];pieces=new Map;markers=new Ea;tweens=new Up;debris;lambertMat=new ec({vertexColors:!0});toonMats=new Map;pieceMat=this.lambertMat;style=Object.values(sm)[0];labels=!1;lastPos=null;flipped=!1;markerGeo=new Bs(.22,.12,.22);moveMat=new ec({color:6280031,emissive:2060063});raycaster=new pl;pointer=new W;shake=0;shakeOff=new G;timer=new Qc;controls;outlineMat=new os({color:1381653,side:1});frame3d;coords=new Ea;hemi=new Ac(16773853,2826560,1.6);sun=new qc(16777215,2.2);torches=new Ea;edgeTex=ym();shadowMat=new os({map:Sm(),transparent:!0,depthWrite:!1});shadowGeo=new Vs(1,1).rotateX(-Math.PI/2);stone={};tap=null;hovered=null;highlights={};constructor(e){this.container=e,this.renderer=new Lf({antialias:!1,powerPreference:`high-performance`}),this.renderer.setPixelRatio(1),e.appendChild(this.renderer.domElement),this.scene.background=new J(dm),this.scene.add(this.world),this.camera.position.copy(_m).add(this.camOffset()),this.controls=new np(this.camera,this.renderer.domElement),this.controls.target.copy(_m),this.controls.enableDamping=!0,this.controls.dampingFactor=.12,this.controls.rotateSpeed=.6,this.controls.minPolarAngle=.25,this.controls.maxPolarAngle=1.25,this.controls.minZoom=.7,this.controls.maxZoom=3,this.controls.screenSpacePanning=!1,this.controls.touches={ONE:_n.ROTATE,TWO:_n.DOLLY_PAN},this.controls.update(),this.sun.position.set(-4,10,6),this.scene.add(this.hemi,this.sun,this.torches);for(let[e,t]of[[-4.8,-4.8],[4.8,-4.8],[-4.8,4.8],[4.8,4.8]]){let n=new Wc(16754769,0,16,1.4);n.position.set(e,2.4,t),this.torches.add(n)}this.torches.visible=!1,this.frame3d=new vs(new Bs(8.9,.5,8.9),new ec({color:2828840})),this.frame3d.position.y=-.4,this.world.add(this.frame3d,this.coords);let t=new Vs(.34,.34).rotateX(-Math.PI/2);for(let e=0;e<8;e++){let n=new vs(t,xm(`abcdefgh`[e]));n.position.x=e-3.5,n.userData.axis=`f`;let r=new vs(t,xm(`${e+1}`));r.position.z=3.5-e,r.userData.axis=`r`,this.coords.add(n,r)}this.placeCoords();for(let e=0;e<64;e++){let t=new vs(new Bs(1,mm,1),new ec({color:(f(e)+p(e))%2?lm:um}));t.position.copy(cm(e)).setY(-.3/2),t.userData.sq=e,this.tiles.push(t),this.world.add(t)}this.world.add(this.markers),this.debris=new Wp(this.world),this.composer=new Kf(this.renderer),this.pixelPass=new hp(2,this.scene,this.camera,{normalEdgeStrength:.05,depthEdgeStrength:.3}),this.composer.addPass(this.pixelPass),this.composer.addPass(new _p),this.palettePass=Jp(),this.composer.addPass(this.palettePass),new ResizeObserver(()=>this.resize()).observe(e),this.resize();let n=this.renderer.domElement;n.addEventListener(`pointermove`,e=>this.hover(this.pick(e))),n.addEventListener(`pointerdown`,e=>{this.tap=this.tap?null:e}),n.addEventListener(`pointerup`,e=>this.onUp(e)),n.addEventListener(`pointercancel`,()=>{this.tap=null}),n.addEventListener(`pointerleave`,()=>this.hover(null)),this.timer.connect(document),this.renderer.setAnimationLoop(()=>this.frame())}setPixelSize(e){this.pixelPass.setPixelSize(e),this.palettePass.uniforms.pixelSize.value=e}setPalette(e,t=.08){this.palettePass.enabled=e,this.palettePass.uniforms.ditherAmount.value=t}setEdges(e,t){this.pixelPass.normalEdgeStrength=e,this.pixelPass.depthEdgeStrength=t}setLabels(e){this.labels=e;for(let t of this.pieces.values())t.userData.label.visible=e}setPaletteColors(e){this.palettePass.uniforms.tPalette.value.dispose(),this.palettePass.uniforms.tPalette.value=qp(e),this.palettePass.uniforms.paletteSize.value=e.length}applyStyle(e){let t=e.shading===`toon`?this.toonMat(e.toonBands??4):this.lambertMat,n=this.style,r=t!==this.pieceMat||e.pieces!==n.pieces||e.outline!==n.outline||e.pieceScale!==n.pieceScale||e.spriteOutline!==n.spriteOutline||e.shadow!==n.shadow||e.rim!==n.rim||e.outlineColor!==n.outlineColor||e.pixelSize!==n.pixelSize;this.style=e,this.pieceMat=t,this.outlineMat.color.setHex(e.outlineColor??1381653),this.setPixelSize(e.pixelSize),this.setPalette(e.palette,e.dither),this.setPaletteColors(Kp[e.paletteName??`db32`]),this.setEdges(e.normalEdge,e.depthEdge),this.setCoords(e.coords??!0),this.applyBoard(),this.applyLights(),this.applyCamera(),r&&this.lastPos&&this.rebuild(this.lastPos)}applyBoard(){let e=this.style.tiles??`flat`,t=this.style.lights===`torch`;if(e===`stone`&&!this.stone.light){let e=e=>{let t=new Oc().load(`./textures/${e}`);return t.magFilter=t.minFilter=xn,t.generateMipmaps=!1,t.colorSpace=Br,t};this.stone={light:e(`white_tile_1.jpg`),dark:e(`black_tile_1.jpg`),frame:e(`board_texture1.jpg`)}}let n=this.style.boardSide??mm;for(let r of this.tiles){let i=r.userData.sq,a=(f(i)+p(i))%2==1,o=r.material;o.map=e===`edged`?this.edgeTex:e===`stone`?this.stone[a?`light`:`dark`]:null,o.color.setHex(e===`stone`?t?12760483:16777215:a?lm:um),o.needsUpdate=!0,r.scale.y=n/mm,r.position.y=-n/2}this.frame3d.material.map=e===`stone`?this.stone.frame:null,this.frame3d.material.color.setHex(e===`stone`?t?7301728:9077880:2828840),this.frame3d.material.needsUpdate=!0,this.frame3d.position.y=-n-.1,this.placeCoords()}placeCoords(){let e=this.flipped?-1:1;for(let t of this.coords.children)t.position.y=this.frame3d.position.y+.26,t.userData.axis===`f`?t.position.z=4.22*e:t.position.x=-4.22*e,t.rotation.y=this.flipped?Math.PI:0}setCoords(e){this.coords.visible=e}applyLights(){let e=this.style.lights===`torch`;this.hemi.intensity=e?.58:1.6,this.hemi.color.setHex(e?16767400:16773853),this.hemi.groundColor.setHex(e?3811898:2826560),this.sun.intensity=e?.4:2.2,this.torches.visible=e;for(let t of this.torches.children)t.intensity=e?10:0;this.scene.background.setHex(e?fm:dm)}camOffset(){let e=this.style.camera??hm;return new G().setFromSphericalCoords(gm,ki.degToRad(90-e.elev),ki.degToRad(e.azim))}applyCamera(){let e=this.camOffset();this.flipped&&e.set(-e.x,e.y,-e.z),this.controls.target.copy(_m),this.camera.position.copy(_m).add(e),this.camera.zoom=this.style.camera?.zoom??1,this.camera.updateProjectionMatrix(),this.controls.update()}toonMat(e){let t=this.toonMats.get(e);if(!t){let n=new Uint8Array(e);for(let t=0;t<e;t++)n[t]=Math.round((t+1)/e*255);let r=new xs(n,e,1,Gn);r.minFilter=r.magFilter=xn,r.needsUpdate=!0,t=new Qs({vertexColors:!0,gradientMap:r}),this.toonMats.set(e,t)}return t}flip(e){if(e===this.flipped)return;this.flipped=e,this.placeCoords();let t=this.offset();t.theta+=Math.PI,this.tweenTo(t,this.controls.target.clone(),this.camera.zoom)}resetView(){let e=new gl().setFromVector3(this.camOffset());this.flipped&&(e.theta+=Math.PI),this.tweenTo(e,_m.clone(),this.style.camera?.zoom??1)}screenOf(e){let t=cm(e).project(this.camera),n=this.renderer.domElement.getBoundingClientRect();return{x:n.left+(t.x+1)/2*n.width,y:n.top+(1-t.y)/2*n.height}}offset(){return new gl().setFromVector3(this.camera.position.clone().sub(this.controls.target))}tweenTo(e,t,n,r=.4){let i=this.offset(),a=this.controls.target.clone(),o=this.camera.zoom,s=new G,c=e.theta-i.theta;return e.theta=i.theta+Math.atan2(Math.sin(c),Math.cos(c)),this.tweens.add(r,r=>{s.setFromSphericalCoords(vm(i.radius,e.radius,r),vm(i.phi,e.phi,r),vm(i.theta,e.theta,r)),this.controls.target.lerpVectors(a,t,r),this.camera.position.copy(this.controls.target).add(s),this.camera.zoom=vm(o,n,r),this.camera.updateProjectionMatrix()},Rp)}rebuild(e){for(let e of this.pieces.values())this.world.remove(e);this.pieces.clear(),this.sync(e)}sync(e){this.lastPos=e;for(let t=0;t<64;t++){let n=e.board[t],r=this.pieces.get(t);r&&r.userData.code===n&&r.position.distanceTo(cm(t))<.01||(r&&(this.world.remove(r),this.pieces.delete(t)),n&&this.pieces.set(t,this.spawn(t,u(n),d(n))))}}rimWorld(){if(this.style.rim==null)return pm;let e=this.renderer.domElement.height||900;return this.style.rim*this.style.pixelSize*(this.camera.top-this.camera.bottom)/(e*this.camera.zoom)}spawn(e,t,n){let r=new Ea,i=kp[t]*1.15;if(this.style.pieces===`sprite`)r.add(om(t,n,this.style.spriteOutline?this.style.outlineColor??1381653:void 0)),r.userData.sprite=!0;else{let e=Lp(t,n);e.boundingBox||e.computeBoundingBox();let a=this.style.pieceScale??1;i=e.boundingBox.max.y*a;let o=new vs(e,this.pieceMat);if(o.scale.setScalar(a),r.add(o),this.style.outline){let t=this.rimWorld(),n=e.boundingBox,i=n.getSize(new G).multiplyScalar(.5),o=new vs(e,this.outlineMat);o.scale.set(a+t/i.x,a+t/i.y,a+t/i.z),o.position.y=(n.max.y+n.min.y)/2*(a-o.scale.y),r.add(o)}n===1&&(r.rotation.y=Math.PI)}if(this.style.shadow){let e=new vs(this.shadowGeo,this.shadowMat);e.scale.setScalar(.8),e.position.y=.02,r.add(e)}let o=Hp(a[t]);return o.position.y=i+.25,o.visible=this.labels,r.userData.label=o,r.add(o),r.position.copy(cm(e)),r.userData.code=t|n<<4,this.world.add(r),r}highlight(e){this.highlights=e;for(let e of this.tiles)e.material.emissive.setHex(0);let t=(e,t)=>e?.forEach(e=>this.tiles[e].material.emissive.setHex(t));t(e.last,2768746),t(e.captures,9051935),t(e.swaps,4145050),e.check!=null&&t([e.check],11145232),e.selected!=null&&t([e.selected],8022544),this.hovered!=null&&!this.tiles[this.hovered].material.emissive.getHex()&&t([this.hovered],2763306),this.markers.clear();for(let t of e.moves??[]){let e=new vs(this.markerGeo,this.moveMat);e.position.copy(cm(t)).setY(.06),this.markers.add(e)}}async animateMove(e,t){let n=this.pieces.get(t.from);if(!n)return;let r=u(e.board[t.from]),i=e=>{let t=this.pieces.get(e);if(!t)return;this.pieces.delete(e),this.world.remove(t);let n=Ep[d(t.userData.code)];this.debris.burst(cm(e).setY(.2),[n.m,n.s,n.a]),this.shake=Math.max(this.shake,.12)};if(t.to===t.from)await this.arrow(t.from,t.captures[0]),i(t.captures[0]);else if(t.swap){let e=this.pieces.get(t.to);await Promise.all([this.hop(n,t.from,t.to,.45,.7),this.hop(e,t.to,t.from,.45,.4)]),this.pieces.set(t.to,n),this.pieces.set(t.from,e)}else if(t.captures.length>1){let e=t.from;for(let r of t.captures)await this.hop(n,e,r,.22,.35),i(r),e=r;this.pieces.delete(t.from),this.pieces.set(t.to,n)}else await this.hop(n,t.from,t.to,.35,r===2?1:.35),t.captures.length&&i(t.captures[0]),this.pieces.delete(t.from),this.pieces.set(t.to,n),t.selfRemove&&(await this.tweens.wait(.15),i(t.to),this.shake=.25)}hop(e,t,n,r,i){let a=cm(t),o=cm(n);return this.tweens.add(r,t=>{e.position.lerpVectors(a,o,t),e.position.y=Math.sin(t*Math.PI)*i})}arrow(e,t){let n=cm(e).setY(.5),r=cm(t).setY(.4),i=new vs(new Bs(.06,.06,.5),new ec({color:8014634}));return i.position.copy(n),i.lookAt(r),this.world.add(i),this.tweens.add(.28,e=>{i.position.lerpVectors(n,r,e),i.position.y+=Math.sin(e*Math.PI)*.4,e>=1&&this.world.remove(i)},Bp)}frame(){this.timer.update();let e=Math.min(.05,this.timer.getDelta());this.tweens.step(e),this.debris.step(e),this.controls.update(e);for(let e of this.pieces.values())e.userData.sprite&&e.children[0].quaternion.copy(this.camera.quaternion);this.shakeOff.set(0,0,0),this.shake>.001&&(this.shakeOff.set((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake,0),this.shake*=.85),this.camera.position.add(this.shakeOff),this.composer.render(),this.camera.position.sub(this.shakeOff)}resize(){let e=this.container.clientWidth||1,t=this.container.clientHeight||1,n=e/t,r=9.4,i=n>=1?r*n:r,a=n>=1?r:r/n;this.camera.left=-i/2,this.camera.right=i/2,this.camera.top=a/2,this.camera.bottom=-a/2,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.composer.setSize(e,t)}pick(e){let t=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),this.raycaster.setFromCamera(this.pointer,this.camera);let n=[...this.tiles,...this.pieces.values()];for(let e of this.raycaster.intersectObjects(n,!0)){let t=e.object;for(;t;){if(t.userData.sq!=null)return t.userData.sq;for(let[e,n]of this.pieces)if(n===t)return e;t=t.parent}}return null}onUp(e){let t=this.tap;if(this.tap=null,e.button!==0||t?.pointerId!==e.pointerId||Math.hypot(e.clientX-t.clientX,e.clientY-t.clientY)>6)return;let n=this.pick(e);n!=null&&this.onSquareClick(n)}hover(e){e!==this.hovered&&(this.hovered=e,this.highlight(this.highlights),this.onSquareHover(e))}},wm=new URLSearchParams(location.search),Tm={2017:n,2021:r}[wm.get(`rules`)??``];Tm&&i(Tm);var Q=e=>document.getElementById(e),$=new mn,Em=new hn,Dm=new Cm(Q(`board`));window.view=Dm;var Om=[`human`,`ai`],km=null,Am=[],jm=null,Mm=null,Nm=!1,Pm=0,Fm=null,Im=()=>Mm!=null||$.status!==`playing`,Lm=[[``,``],[`Moves 1 square forward, 2 from its start rank.`,`Takes 1 square diagonally forward. Promotes on the last rank.`],[`Moves in an L (2 + 1) over any piece.`,`Takes by moving onto the enemy.`],[`Moves any distance diagonally.`,`Takes by moving onto the enemy.`],[`Moves any distance orthogonally.`,`Takes by moving onto the enemy.`],[`Moves any distance in a straight line.`,`Takes by moving onto the enemy.`],[`Moves 1 square in any direction.`,`Takes by moving onto the enemy. Only a king can take a guard.`],[`Moves 1 square in any direction.`,`Shoots without moving: an enemy diagonally adjacent, or 2 squares away orthogonally, through blockers.`],[`Moves like a queen and jumps over own pieces.`,`Takes by moving on, but never a king. Removes itself after capturing anything but a pawn.`],[`Moves 1 square in any direction, empty squares only.`,`Cannot capture. Cannot be captured, except by a king.`],[`Moves 1 square in any direction; onto an own piece it swaps places.`,`Takes an adjacent enemy. With its own king on rank 1 it swaps with the king at any distance.`],[`Moves 1 square in any direction, empty squares only.`,`Takes on any adjacent square but straight ahead, and may keep taking from each new square.`]];function Rm(e){let t=e==null?0:$.pos.board[e],n=t?u(t):0;Q(`info`).innerHTML=t?`<b>${d(t)?`Black`:`White`} ${o[n]}</b><br>${Lm[n][0]} ${Lm[n][1]}`+(t&32?` <b>This guard has used its capture.</b>`:``):``}var zm=e=>e.to===e.from?[e.captures[0]]:e.captures.length>1?e.captures:[e.to],Bm=()=>km==null?[]:$.legal.filter(e=>e.from===km&&Am.every((t,n)=>zm(e)[n]===t));function Vm(){let e=Bm(),t=e.map(e=>zm(e)[Am.length]).filter(e=>e!=null),n=e.filter(e=>e.swap).map(e=>e.to),r=$.history.at(-1)?.move;Dm.highlight({selected:km,moves:t.filter(e=>!$.pos.board[e]),captures:t.filter(e=>$.pos.board[e]!==0&&!n.includes(e)),swaps:n,last:r?[r.from,...r.to===r.from?r.captures:[r.to]]:[],check:$.inCheck?ee($.pos.board,$.pos.turn):null}),Q(`stop-chain`).hidden=!(Am.length&&Bm().some(e=>zm(e).length===Am.length));let i=$.pos.turn?`Black`:`White`;Q(`turn`).textContent=Im()?``:`${i} to move${$.inCheck?` — CHECK`:``}`,Q(`status`).textContent=Mm==null?{playing:Nm&&Om[$.pos.turn]===`ai`?`thinking…`:``,checkmate:`Checkmate — ${$.pos.turn?`White`:`Black`} wins`,stalemate:`Stalemate — draw`,draw50:`Draw — 50-move rule`,drawRepetition:`Draw — threefold repetition`,drawMaterial:`Draw — insufficient material`}[$.status]:Xm(),Q(`setup`).textContent=$.backRank||`custom`,Q(`setup`).title=me($.pos);let s=Q(`moves`);s.innerHTML=$.history.map((e,t)=>t%2==0?`<li>${t/2+1}. <b>${e.lan}</b>`:` ${e.lan}</li>`).join(``),s.scrollTop=s.scrollHeight;let c=[[],[]];for(let e of $.history){let t=d(e.pos.board[e.move.from]);for(let n of e.move.captures)c[t].push(e.pos.board[n]);e.move.selfRemove&&c[1-t].push(e.pos.board[e.move.from])}let l=e=>e.map(e=>`<span title="${d(e)?`black`:`white`} ${o[u(e)]}">${d(e)?a[u(e)].toLowerCase():a[u(e)]}</span>`).join(``);Q(`took-w`).innerHTML=l(c[0]),Q(`took-b`).innerHTML=l(c[1]),Rm(km??jm),Q(`undo`).disabled=$.history.length===0,Q(`resign`).disabled=Im(),Q(`copy`).disabled=$.history.length===0}async function Hm(e){let t=Pm;Nm=!0;let n=$.pos;$.play(e),km=null,Am=[],Vm(),await Dm.animateMove(n,e),t===Pm&&(Dm.sync($.pos),Nm=!1,Vm(),eh(),Im()?Zm():Um())}async function Um(){if(Nm||Im()||Om[$.pos.turn]!==`ai`)return;Nm=!0,Vm();let e=Pm,t=await Em.think($.pos,{timeMs:+Q(`think`).value});e===Pm&&(Nm=!1,t.move&&await Hm(t.move))}function Wm(e){let t=Q(`promo`);return t.innerHTML=``,t.hidden=!1,new Promise(n=>{let r=e=>{t.hidden=!0,Fm=null,n(e)};Fm=()=>r(null);for(let n of e){let e=document.createElement(`button`);e.textContent=`${a[n.promo]} ${o[n.promo]}`,e.onclick=()=>r(n),t.appendChild(e)}})}async function Gm(e){if(e.length===1||!e.every(e=>e.promo))return Hm(e[0]);Nm=!0;let t=await Wm(e);if(t)return Nm=!1,Hm(t)}Dm.onSquareClick=e=>{if(Nm||Im()||Om[$.pos.turn]!==`human`)return;let t=$.pos.board[e]!==0&&d($.pos.board[e])===$.pos.turn,n=Bm().filter(t=>zm(t)[Am.length]===e);if(km==null||n.length===0)return km=t&&e!==km?e:null,Am=[],Vm();let r=n.filter(e=>zm(e).length===Am.length+1);if(r.length&&r.length===n.length){Gm(r);return}Am.push(e),Vm()},Dm.onSquareHover=e=>{jm=e,Q(`hover`).textContent=e==null?``:h(e),Rm(km??jm)},Q(`stop-chain`).onclick=()=>{let e=Bm().find(e=>zm(e).length===Am.length);e&&Hm(e)};function Km(){Pm++,Em.cancel(),Fm?.(),Nm=!1,km=null,Am=[]}var qm=()=>Dm.flip(Om[0]===`ai`&&Om[1]===`human`);function Jm(e,t){Km(),Mm=null,Om[0]=Q(`white`).value,Om[1]=Q(`black`).value,t?$.load(he(t)):$.newGame(e),Dm.sync($.pos),qm(),Vm(),eh(),Um()}function Ym(){$.history.length&&(Km(),Mm=null,$.undo(),Om[$.pos.turn]===`ai`&&Om.includes(`human`)&&$.undo(),Dm.sync($.pos),Vm(),eh(),Um())}function Xm(){return Mm==null?{playing:``,checkmate:`${$.pos.turn?`White`:`Black`} wins by checkmate`,stalemate:`Draw by stalemate`,draw50:`Draw by the 50-move rule`,drawRepetition:`Draw by repetition`,drawMaterial:`Draw by insufficient material`}[$.status]:`${Mm?`Black`:`White`} resigns — ${Mm?`White`:`Black`} wins`}function Zm(){let e=Math.ceil($.history.length/2),t=Q(`over`);Q(`over-title`).textContent=Xm(),Q(`over-detail`).textContent=`${e} move${e===1?``:`s`} · setup ${$.backRank||`custom`}`,t.returnValue=``,t.showModal()}Q(`over`).onclose=()=>{let e=Q(`over`).returnValue;if(e===`new`)Jm(fe());else if(e===`rematch`){let[e,t]=[Q(`white`),Q(`black`)];[e.value,t.value]=[t.value,e.value],Jm($.backRank||void 0,$.backRank?null:me($.history[0]?.pos??$.pos))}},Q(`undo`).onclick=Ym,Q(`resign`).onclick=()=>{Im()||confirm(`Resign as ${$.pos.turn?`Black`:`White`}?`)&&(Km(),Mm=$.pos.turn,Vm(),eh(),Zm())},Q(`copy`).onclick=()=>{let e=$.history.map((e,t)=>t%2==0?`${t/2+1}. ${e.lan}`:e.lan).join(` `);navigator.clipboard?.writeText(e).catch(()=>Qm(e))??Qm(e)};function Qm(e){let t=document.createElement(`textarea`);t.value=e,t.style.cssText=`position:fixed;opacity:0`,document.body.appendChild(t),t.select();try{document.execCommand(`copy`)}catch{}t.remove()}var $m=`kingdown.save`;function eh(){try{localStorage.setItem($m,JSON.stringify({back:$.backRank,fen:me($.history[0]?.pos??$.pos),moves:$.history.map(e=>e.lan),white:Om[0],black:Om[1],think:+Q(`think`).value,style:rh.value,coords:oh.checked,resigned:Mm}))}catch{}}function th(){try{let e=localStorage.getItem($m),t=e?JSON.parse(e):null;return t&&Array.isArray(t.moves)?t:null}catch{return null}}Q(`rules-btn`).onclick=()=>Q(`rules`).showModal(),Q(`new-random`).onclick=()=>Jm(fe()),Q(`new-classic`).onclick=()=>Jm(ue),Q(`new-setup`).onclick=()=>{let e=prompt(`Back rank (8 letters, one K; from QLRRBBNNAAGGMMSS):`,$.backRank)?.toUpperCase().trim();if(e)try{Jm(e)}catch(e){alert(e.message)}},Q(`white`).onchange=Q(`black`).onchange=()=>{Om[0]=Q(`white`).value,Om[1]=Q(`black`).value,qm(),eh(),Um()},Q(`think`).onchange=eh,Q(`pixel`).oninput=e=>Dm.setPixelSize(+e.target.value);var nh=()=>Dm.setPalette(Q(`palette`).checked,+Q(`dither`).value);Q(`palette`).onchange=Q(`dither`).oninput=nh,Q(`edges`).oninput=e=>{let t=+e.target.value;Dm.setEdges(t*.3,t)},Q(`sculpts`).onchange=e=>{Mp(e.target.checked),Dm.rebuild($.pos)};var rh=Q(`style`);rh.innerHTML=Object.entries(sm).map(([e,t])=>`<option value="${e}">${t.label}</option>`).join(``);var ih=Object.keys(sm)[0];rh.value=wm.get(`style`)||ih,rh.value||=ih;var ah=Q(`labels`);ah.checked=wm.get(`labels`)===`1`,ah.onchange=()=>Dm.setLabels(ah.checked),Dm.setLabels(ah.checked);var oh=Q(`coords`);oh.onchange=()=>{Dm.setCoords(oh.checked),eh()};var sh=Math.min(6,Math.max(0,Math.round(Number(wm.get(`px`))||0)));function ch(){let e=sm[rh.value];Dm.applyStyle(e);let t=sh||e.pixelSize;Dm.setPixelSize(t),Q(`pixel`).value=String(t),Q(`edges`).value=String(e.depthEdge),Q(`palette`).checked=e.palette,Q(`dither`).value=String(e.dither),Dm.setCoords(oh.checked)}rh.onchange=()=>{ch(),eh()},Q(`reset-view`).onclick=()=>Dm.resetView(),addEventListener(`keydown`,e=>{if(e.key===`Escape`){km=null,Am=[],Vm();return}e.target.closest(`input,select,textarea`)||(e.key===`r`&&Dm.resetView(),e.key===`z`&&Ym())});var lh=wm.has(`fen`)?null:th();lh&&(lh.style&&sm[lh.style]&&(rh.value=lh.style),lh.white&&(Q(`white`).value=lh.white),lh.black&&(Q(`black`).value=lh.black),lh.think&&(Q(`think`).value=String(lh.think)),typeof lh.coords==`boolean`&&(oh.checked=lh.coords),Om[0]=Q(`white`).value,Om[1]=Q(`black`).value),await Np(),ch();var uh=wm.get(`fen`);if(uh)try{$.load(he(uh))}catch(e){alert(`Bad fen: ${e.message}`)}else if(lh)try{lh.back?$.newGame(lh.back):$.load(he(lh.fen)),$.playLan(lh.moves),Mm=lh.resigned??null}catch{$.newGame()}qm(),Dm.sync($.pos),Vm(),uh||eh(),Im()?Zm():Um();