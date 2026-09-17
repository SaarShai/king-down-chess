(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=Object.freeze({Frost:[`Freeze`,`IceWall`],Flame:[`Strike`,`Haste`],Stratus:[`Flight`,`Sacrifice`],Mud:[`March`,`Leap`],Spirit:[`HolyLight`,`Mercy`],Shadow:[`DeathTouch`,`Darkness`]}),t=[`HolyLight`,`Mercy`,`DeathTouch`,`Darkness`,`March`,`Leap`];function n(n){let r=n.trim();if(!r||r===`none`||r===`-`)return null;let[i=``,a=``]=r.split(`:`),o=Object.keys(e).find(e=>e.toLowerCase()===i.toLowerCase());if(!o)throw Error(`unknown king "${i}" (${Object.keys(e).join(` | `)} | none)`);let s=e[o].find(e=>e.toLowerCase()===a.toLowerCase());if(!s)throw Error(`king ${o} has no power "${a}" (${e[o].join(` | `)})`);if(!t.includes(s))throw Error(`${o}:${s} is not built yet — tier 1 is ${t.join(` | `)} (docs/KINGS-POWERS-PLAN.md §2)`);return{king:o,power:s}}function r(e){let t=e.split(`,`),r=n(t[0]??``);return[r,t.length>1?n(t[1]):r]}var i=Object.freeze({archerChecks:!0,beastChains:!0,guardImmune:!0,guardCaptures:`none`,guardStep:1,guardDoubleFirst:`off`,guardNoSecondRank:!1,guardCaptureLimit:0,archerMove:`any`,archerShots:`classic`,beastMove:`any`,beastCapture:`adjacent`,beastCaptureForward:!1,maesterLongSwap:!0,maesterKingSwapAnywhere:!1,maesterSwapAny:!1,maesterSwapEnemy:!1,maesterStep:1,paladinKamikaze:`nonPawn`,paladinChecks:!1,paladinReturn:!1,paladinJumpsFriends:!0,paladinBlockedByEnemies:!0,secondPlayerDoubleFirstTurn:!1,ogreMode:`repel`,catapultCapture:`stay`,kings:[null,null],bishopsOppositeColours:!0,promotionSet:`anyNonKingNoGuard`,fiftyMove:!0,threefold:!0,insufficientMaterial:!0}),a={...i},o=Object.freeze({...i,archerMove:`ortho`,beastMove:`forward`,paladinKamikaze:`always`,promotionSet:`anyNonKing`}),s=Object.freeze({...o,archerMove:`fwdBack`,archerShots:`forward3`,beastMove:`diagFwdBack`,beastCapture:`diagForward`});function c(e){return Object.assign(a,i,e),a}var l=` PNBRQKALGMSOC`,u=[``,`pawn`,`knight`,`bishop`,`rook`,`queen`,`king`,`archer`,`paladin`,`guard`,`maester`,`beast`,`ogre`,`catapult`],d=[5,4,3,2,7,8,9,10,11],f={anyNonKing:d,standard:[5,4,3,2],anyNonKingNoFairy:[5,4,3,2],anyNonKingNoGuard:d.filter(e=>e!==9)},p=(e,t)=>e|t<<4,m=e=>e&15,h=e=>e>>4&1,g=e=>e&7,_=e=>e>>3,v=(e,t)=>t<<3|e,y=e=>`abcdefgh`[g(e)]+(_(e)+1),b=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],x=b.slice(0,4),S=b.slice(4),C=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],w=[[1,1],[1,-1],[-1,1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]],T=[-2,-1,0,1,2].flatMap(e=>[-2,-1,0,1,2].filter(t=>Math.max(Math.abs(e),Math.abs(t))===2).map(t=>[e,t])),E={classic:w,plusDiag2:[...w,[2,2],[2,-2],[-2,2],[-2,-2]],ring2:[...S,...T],forward3:[[1,1],[-1,1],[0,2]]},D=E.forward3.map(([e,t])=>[e,-t]),O=e=>a.archerShots===`forward3`&&e===1?D:E[a.archerShots],k=[[0,1],[0,-1]],A=[[[1,1],[-1,1]],[[1,-1],[-1,-1]]];function j(e,t,n){let r=g(e)+t,i=_(e)+n;return r<0||r>7||i<0||i>7?-1:v(r,i)}var ee=e=>e===0?1:-1,M=(e,t)=>!a.guardNoSecondRank||m(e)!==9||_(t)!==(h(e)===0?1:6),te=(e,t)=>Math.max(Math.abs(g(e)-g(t)),Math.abs(_(e)-_(t))),N=e=>a.kings[e]?.power??``;function P(e,t){let n=m(e);return n===9&&(a.guardCaptures===`none`||a.guardCaptures===`pawns`&&t!==1)||n===9&&a.guardCaptureLimit&&e&32?!1:t===9&&a.guardImmune?n===6:n===6&&t!==9&&N(h(e))===`Mercy`||n===1&&t===6&&N(h(e)^1)===`HolyLight`||n===6&&t===1&&N(h(e))===`HolyLight`?!1:t!==6||(n!==8||a.paladinChecks)&&(a.archerChecks||n!==7)}function ne(e,t){return e.indexOf(p(6,t))}function re(e,t,n,r,i,a,o){for(let[s,c]of i){let i=j(t,s,c);if(i<0)continue;let l=e[i];l?h(l)!==n&&P(r,m(l))&&o.push({from:t,to:i,captures:[i]}):a===`all`&&o.push({from:t,to:i,captures:[]})}}function ie(e,t,n,r,i,a,o){let s=N(n)===`Leap`;for(let[c,l]of i)for(let i=j(t,c,l);i>=0;i=j(i,c,l)){let c=e[i];if(!c){a===`all`&&o.push({from:t,to:i,captures:[]});continue}if(!(s&&h(c)===n&&m(c)===1)){h(c)!==n&&P(r,m(c))&&o.push({from:t,to:i,captures:[i]});break}}}function ae(e,t,n,r){let i=e[t],o=h(i);switch(m(i)){case 1:{let s=ee(o),c=o===0?1:6,l=o===0?7:0,u=(e,n)=>{if(_(e)===l)for(let i of f[a.promotionSet])r.push({from:t,to:e,captures:n,promo:i});else r.push({from:t,to:e,captures:n})};if(N(o)===`Darkness`){if(n===`all`)for(let n of[-1,1]){let r=j(t,n,s);r>=0&&!e[r]&&u(r,[])}let r=j(t,0,s);r>=0&&e[r]&&h(e[r])!==o&&P(i,m(e[r]))&&u(r,[r]);return}if(n===`all`){let n=j(t,0,s);if(n>=0&&!e[n]){u(n,[]);let r=j(t,0,2*s);(N(o)===`March`||_(t)===c)&&r>=0&&!e[r]&&u(r,[])}}for(let n of[-1,1]){let r=j(t,n,s);r>=0&&e[r]&&h(e[r])!==o&&P(i,m(e[r]))&&u(r,[r])}return}case 2:return re(e,t,o,i,C,n,r);case 6:if(N(o)===`Mercy`){for(let[a,s]of b){let c=j(t,a,s);if(c<0)continue;let l=e[c];if(l){if(h(l)!==o){P(i,m(l))&&r.push({from:t,to:c,captures:[c]});continue}}else n===`all`&&r.push({from:t,to:c,captures:[]});let u=j(c,a,s);u>=0&&!e[u]&&n===`all`&&r.push({from:t,to:u,captures:[]})}return}if(N(o)===`DeathTouch`){for(let[a,s]of b){let c=j(t,a,s);if(c<0)continue;let l=e[c];l?h(l)!==o&&P(i,m(l))&&r.push({from:t,to:t,captures:[c]}):n===`all`&&r.push({from:t,to:c,captures:[]})}return}return re(e,t,o,i,b,n,r);case 9:{let s=r.length;re(e,t,o,i,b,n,r);let c=a.guardDoubleFirst!==`off`&&_(t)===(o===0?0:7);if((a.guardStep===2||c)&&n===`all`)for(let[n,i]of b){let o=j(t,n,i);if(o<0||e[o]&&!(c&&a.guardDoubleFirst===`leap`))continue;let s=j(o,n,i);s>=0&&!e[s]&&r.push({from:t,to:s,captures:[]})}if(a.guardNoSecondRank)for(let e=r.length-1;e>=s;e--)M(i,r[e].to)||r.splice(e,1);return}case 3:return ie(e,t,o,i,S,n,r);case 4:return ie(e,t,o,i,x,n,r);case 5:return ie(e,t,o,i,b,n,r);case 7:{let i=a.archerMove===`any`?b:a.archerMove===`fwdBack`?k:x;if(n===`all`)for(let[n,a]of i){let i=j(t,n,a);i>=0&&!e[i]&&r.push({from:t,to:i,captures:[]})}for(let[n,i]of O(o)){let a=j(t,n,i);a>=0&&e[a]&&h(e[a])!==o&&P(7,m(e[a]))&&r.push({from:t,to:t,captures:[a]})}return}case 8:for(let[i,s]of b)for(let c=j(t,i,s);c>=0;c=j(c,i,s)){let i=e[c];if(!i){n===`all`&&r.push({from:t,to:c,captures:[]});continue}if(h(i)===o){if(a.paladinJumpsFriends)continue;break}if(P(8,m(i))){if(a.paladinReturn)r.push({from:t,to:t,captures:[c]});else{let e={from:t,to:c,captures:[c]};(a.paladinKamikaze===`always`||a.paladinKamikaze===`nonPawn`&&m(i)!==1)&&(e.selfRemove=!0),r.push(e)}}if(a.paladinBlockedByEnemies)break}return;case 10:{for(let[i,s]of b){let c=j(t,i,s);if(c<0)continue;let l=e[c];l?h(l)===o?n===`all`&&M(l,t)&&r.push({from:t,to:c,captures:[],swap:!0}):(P(10,m(l))&&r.push({from:t,to:c,captures:[c]}),n===`all`&&a.maesterSwapEnemy&&m(l)!==6&&r.push({from:t,to:c,captures:[],swap:!0})):n===`all`&&r.push({from:t,to:c,captures:[]})}if(a.maesterStep===2&&n===`all`)for(let[n,i]of b){let a=j(t,n,i);if(a<0||e[a])continue;let o=j(a,n,i);o>=0&&!e[o]&&r.push({from:t,to:o,captures:[]})}if(n===`all`&&a.maesterSwapAny)for(let n=0;n<64;n++){let i=e[n];i&&h(i)===o&&m(i)!==6&&te(t,n)>1&&M(i,t)&&r.push({from:t,to:n,captures:[],swap:!0})}let i=o===0?0:7,s=e=>a.maesterKingSwapAnywhere||_(e)===i;if(n===`all`&&a.maesterLongSwap&&s(t)){let n=ne(e,o);n>=0&&s(n)&&te(n,t)>1&&r.push({from:t,to:n,captures:[],swap:!0})}return}case 11:{let i=ee(o),s=a.beastMove===`any`?b:a.beastMove===`diagFwdBack`?S:[[0,i]];if(n===`all`)for(let[n,i]of s){let a=j(t,n,i);a>=0&&!e[a]&&r.push({from:t,to:a,captures:[]})}let c=a.beastCapture===`diagForward`?A[o]:b,l=null,u=(s,d)=>{for(let[f,p]of c){if(a.beastCapture===`adjacent`&&f===0&&p===i&&!a.beastCaptureForward)continue;let c=j(s,f,p);if(c<0)continue;let g=(l??e)[c];if(!g||h(g)===o)continue;let _=m(g);if(!P(11,_)||d.length>0&&_===6)continue;let v=[...d,c];r.push({from:t,to:c,captures:v}),n!==`attacks`&&_!==6&&a.beastChains&&(l??=new Uint8Array(e),l[c]=0,u(c,v),l[c]=g)}};u(t,[]);return}case 12:if(re(e,t,o,i,b,n,r),n!==`all`)return;for(let[n,i]of b){let o=j(t,n,i);if(o<0)continue;let s=e[o];if(!s||m(s)===6)continue;let c=j(o,n,i);c<0||e[c]||r.push({from:t,to:a.ogreMode===`push`?o:t,captures:[],shove:{from:o,to:c}})}return;case 13:if(n===`all`)for(let[n,i]of x)for(let a=j(t,n,i);a>=0&&!e[a];a=j(a,n,i))r.push({from:t,to:a,captures:[]});for(let[n,s]of x){let c=j(t,n,s);for(;c>=0&&!e[c];)c=j(c,n,s);if(c<0||h(e[c])===o)continue;let l=j(c,n,s);for(;l>=0&&!e[l];)l=j(l,n,s);if(l<0)continue;let u=e[l];h(u)!==o&&P(i,m(u))&&r.push({from:t,to:a.catapultCapture===`land`?l:t,captures:[l]})}return}}function F(e,t){return t.promo?p(t.promo,h(e)):a.guardCaptureLimit&&t.captures.length>0&&m(e)===9?e|32:e}function oe(e,t){let n=new Uint8Array(e.board),r=n[t.from],i=n[t.to];for(let e of t.captures)n[e]=0;t.shove&&(n[t.shove.to]=n[t.shove.from],n[t.shove.from]=0),n[t.from]=t.swap?i:0,n[t.to]=t.selfRemove?0:F(r,t);let o=t.captures.length>0||m(r)===1;return{board:n,turn:a.secondPlayerDoubleFirstTurn&&e.ply===1?e.turn:e.turn^1,halfmove:o?0:e.halfmove+1,ply:e.ply+1}}function se(e,t,n){return a.beastCapture===`diagForward`?e!==0&&t===-ee(n):a.beastCaptureForward||e!==0||t!==-ee(n)}function ce(e,t,n){let r=e[t]?m(e[t]):0,i=e.includes(p(13,n)),o=(t,i)=>{let a=e[t];return a!==0&&h(a)===n&&m(a)===i&&(r===0||P(a,r))};for(let[e,n]of C){let r=j(t,e,n);if(r>=0&&o(r,2))return!0}for(let[r,i]of b){let s=j(t,r,i);if(!(s<0)&&(o(s,6)||o(s,10)||o(s,12)||a.guardCaptures!==`none`&&o(s,9)&&M(e[s],t)||o(s,11)&&se(r,i,n)))return!0}for(let e of N(n)===`Darkness`?[0]:[-1,1]){let r=j(t,e,-ee(n));if(r>=0&&o(r,1))return!0}for(let[e,r]of O(n)){let n=j(t,-e,-r);if(n>=0&&o(n,7))return!0}for(let s=0;s<8;s++){let[c,l]=b[s],u=s<4?4:3,d=!1,f=!1,p=!0;for(let g=j(t,c,l);g>=0;g=j(g,c,l)){let t=e[g];if(!t)continue;let _=p;if(p=!1,h(t)!==n){if(i&&s<4&&_){for(let t=j(g,c,l);t>=0;t=j(t,c,l))if(e[t]){if(o(t,13))return!0;break}}if(a.paladinBlockedByEnemies)break;d=!0;continue}let v=m(t);if(!d&&(v===u||v===5)&&(r===0||P(t,r))||!f&&v===8&&(r===0||P(t,r)))return!0;(v!==1||N(n)!==`Leap`)&&(d=!0),a.paladinJumpsFriends||(f=!0)}}return!1}function le(e,t=e.turn){let n=ne(e.board,t);return n>=0&&ce(e.board,n,t^1)}function ue(e,t=`all`){let n=[];for(let r=0;r<64;r++)e.board[r]&&h(e.board[r])===e.turn&&ae(e.board,r,t,n);return n}function de(e,t=`all`){let n=a.secondPlayerDoubleFirstTurn&&e.ply===1;return ue(e,t).filter(t=>{let r=oe(e,t);return!le(r,e.turn)&&(!n||!le(r,e.turn^1))})}function fe(e){let t=[0,0];for(let n=0;n<64;n++){let r=e[n];if(!r)continue;let i=m(r);if(i===1||i===4||i===5||i===7||i===10||i===11||i===12||i===13||i===9&&a.guardCaptures===`any`||i===8&&a.paladinChecks)return!1;(i===2||i===3)&&t[h(r)]++}return t[0]<=1&&t[1]<=1}function pe(e){return de(e).length===0?le(e)?`checkmate`:`stalemate`:a.fiftyMove&&e.halfmove>=100?`draw50`:a.insufficientMaterial&&fe(e.board)?`drawMaterial`:`playing`}var me=`QLRRBBNNAAGMMSS`,he=`RNBQKBNR`;function ge(e,t){for(let n=e.length-1;n>0;n--){let r=Math.floor(t()*(n+1));[e[n],e[r]]=[e[r],e[n]]}return e}function _e(e=Math.random){for(;;){let t=ge([...ge(me.split(``),e).slice(0,7),`K`],e),n=t.flatMap((e,t)=>e===`B`?[t]:[]);if(!(a.bishopsOppositeColours&&n.length===2&&(n[0]+n[1])%2==0))return t.join(``)}}function ve(e=_e()){if(!/^[A-Z]{8}$/.test(e)||e.split(`K`).length!==2)throw Error(`bad back rank ${e}`);let t=new Uint8Array(64);for(let n=0;n<8;n++){let r=l.indexOf(e[n]);if(r<=0)throw Error(`bad piece letter ${e[n]}`);t[v(n,0)]=p(r,0),t[v(n,7)]=p(r,1),t[v(n,1)]=p(1,0),t[v(n,6)]=p(1,1)}return{board:t,turn:0,halfmove:0,ply:0}}function ye(e){let t=[];for(let n=7;n>=0;n--){let r=``,i=0;for(let t=0;t<8;t++){let a=e.board[v(t,n)];if(!a){i++;continue}i&&=(r+=i,0);let o=a&32?`H`:l[m(a)];r+=h(a)===0?o:o.toLowerCase()}i&&(r+=i),t.push(r)}return`${t.join(`/`)} ${e.turn===0?`w`:`b`} - - ${e.halfmove} ${Math.floor(e.ply/2)+1}`}function be(e){let[t,n=`w`,,,r=`0`,i=`1`]=e.trim().split(/\s+/),a=new Uint8Array(64),o=t.split(`/`);if(o.length!==8)throw Error(`bad FEN ${e}`);o.forEach((t,n)=>{let r=0;for(let i of t){if(/\d/.test(i)){r+=+i;continue}let t=i.toUpperCase(),o=t===`H`?32:0,s=o?9:l.indexOf(t);if(s<=0||r>7)throw Error(`bad FEN ${e}`);a[v(r++,7-n)]=p(s,i===t?0:1)|o}});let s=n===`w`?0:1;return{board:a,turn:s,halfmove:+r,ply:(i-1)*2+s}}function xe(e,t){let n=m(e.board[t.from]),r=n===1?``:l[n],i;return i=t.shove?`${r}${y(t.from)}>${y(t.shove.from)}-${y(t.shove.to)}`:t.swap?`${r}${y(t.from)}<>${y(t.to)}`:t.to===t.from?`${r}${y(t.from)}*${y(t.captures[0])}`:t.captures.length>1?`${r}${y(t.from)}${t.captures.map(e=>`x`+y(e)).join(``)}`:`${r}${y(t.from)}${t.captures.length?`x`:`-`}${y(t.to)}`,t.promo&&(i+=`=`+l[t.promo]),i}var I=`residual`,Se=`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`,Ce=1408,we=16384,L=4096,Te=new Int16Array(Ce*32),R=new Int16Array(32),z=new Int16Array(64),Ee=0,De=new Int32Array(32),Oe=new Int32Array(32);function ke(e,t){for(let e=0;e<32;e++)De[e]=R[e],Oe[e]=R[e];for(let n=0;n<64;n++){let r=e[n];if(!r)continue;let i=(r&15)-1,a=r>>4&1;if(i>=11)throw Error(`nnueEval: piece type ${i+1} is outside the net's 11 types (retrain, or use the linear evaluator)`);let o=a===t?0:11,s=t===0?n:n^56,c=(o+i<<6|s)*32;for(let e=0;e<32;e++)De[e]+=Te[c+e];c=(11-o+i<<6|s^56)*32;for(let e=0;e<32;e++)Oe[e]+=Te[c+e]}let n=Ee*we;for(let e=0;e<32;e++){let t=De[e]<0?0:De[e]>16384?we:De[e],r=Oe[e]<0?0:Oe[e]>16384?we:Oe[e];n+=t*z[e]+r*z[32+e]}return Math.round(n*400/(we*L))}var Ae=45153;function je(e,t=`full`){let n=atob(e);if(n.length!==90306)throw Error(`net: blob is ${n.length} bytes, expected ${Ae*2}`);let r=new Uint8Array(n.length);for(let e=0;e<n.length;e++)r[e]=n.charCodeAt(e);let i=new Int16Array(r.buffer),a=0;Te.set(i.subarray(a,a+=Ce*32)),R.set(i.subarray(a,a+=32)),z.set(i.subarray(a,a+=64)),Ee=i[a],Me=t,Ne=e}var Me=`full`,Ne=null;je(Se,I);var B=new Int32Array(14);B[1]=100,B[2]=316,B[3]=322,B[4]=449,B[5]=933,B[6]=0,B[7]=337,B[8]=326,B[9]=96,B[10]=320,B[11]=308,B[12]=300,B[13]=400;var Pe={1:100,2:316,3:322,4:449,5:933,6:0,7:337,8:326,9:96,10:320,11:308,12:300,13:400};Object.freeze({P:100,N:316,B:322,R:449,Q:933,K:0,A:337,L:326,G:96,M:320,S:308,O:300,C:400});var Fe=Object.freeze({P:1,N:2,B:3,R:4,Q:5,K:6,A:7,L:8,G:9,M:10,S:11,O:12,C:13}),Ie=0,Le=new Int32Array(12);Le[3]=0,Le[4]=2,Le[5]=-1,Le[8]=1;var Re=10,ze=18,Be=9,Ve=25,He=5,Ue=3,We=[0,8,7],Ge=5681,Ke=e=>{let t=new Int16Array(64);for(let n=0;n<8;n++)for(let r=0;r<8;r++)t[(7-n)*8+r]=e[n*8+r];return t},qe=[];qe[1]=Ke([0,0,0,0,0,0,0,0,108,101,95,95,95,95,101,108,48,53,49,52,52,49,53,48,32,16,14,15,15,14,16,32,24,11,-3,6,6,-3,11,24,26,12,3,-1,-1,3,12,26,20,3,-7,-7,-7,-7,3,20,0,-2,-1,4,4,-1,-2,0]),qe[2]=Ke([-49,-35,-25,-25,-25,-25,-35,-49,-35,-15,1,6,6,1,-15,-35,-24,5,14,21,21,14,5,-24,-21,12,16,23,23,16,12,-21,-27,3,19,24,24,19,3,-27,-22,-3,11,10,10,11,-3,-22,-35,-15,-2,6,6,-2,-15,-35,-46,-33,-21,-10,-10,-21,-33,-46]),qe[3]=Ke([-19,-11,-10,-10,-10,-10,-11,-19,-12,5,-2,0,0,-2,5,-12,-11,8,7,10,10,7,8,-11,-11,-2,7,13,13,7,-2,-11,-8,4,3,11,11,3,4,-8,-12,1,4,16,16,4,1,-12,-11,-4,5,0,0,5,-4,-11,-19,-4,-6,-6,-6,-6,-4,-19]),qe[4]=Ke([-1,-1,0,4,4,0,-1,-1,8,13,15,16,16,15,13,8,2,0,1,3,3,1,0,2,0,1,1,2,2,1,1,0,-4,-2,-1,0,0,-1,-2,-4,-1,1,0,1,1,0,1,-1,-6,-1,0,0,0,0,-1,-6,-2,2,8,12,12,8,2,-2]),qe[5]=Ke([-20,-10,-10,-6,-6,-10,-10,-20,-10,0,1,0,0,1,0,-10,-10,1,6,5,5,6,1,-10,-4,-1,3,6,6,3,-1,-4,-7,-4,5,3,3,5,-4,-7,-11,-3,1,7,7,1,-3,-11,-9,-1,2,2,2,2,-1,-9,-19,-5,-5,-2,-2,-5,-5,-19]),qe[7]=Ke([0,5,10,12,12,10,5,0,5,15,23,26,26,23,15,5,9,23,31,35,35,31,23,9,11,27,29,34,34,29,27,11,9,22,33,31,31,33,22,9,4,20,21,20,20,21,20,4,4,10,9,15,15,9,10,4,-18,-7,0,-1,-1,0,-7,-18]),qe[8]=Ke([-15,-15,-15,-15,-15,-15,-15,-15,-10,-10,-10,-10,-10,-10,-10,-10,-6,-6,-5,-6,-6,-5,-6,-6,0,-1,1,1,1,1,-1,0,2,3,7,5,5,7,3,2,3,11,11,11,11,11,11,3,5,11,12,15,15,12,11,5,7,12,13,14,14,13,12,7]),qe[9]=Ke([-30,-30,-30,-30,-30,-30,-30,-30,-25,-25,-25,-25,-25,-25,-25,-25,-20,-20,-20,-20,-20,-20,-20,-20,-12,-13,-11,-14,-14,-11,-13,-12,-4,-5,-7,-7,-7,-7,-5,-4,-1,-2,5,5,5,5,-2,-1,-3,4,7,3,3,7,4,-3,9,5,11,-2,-2,11,5,9]),qe[10]=Ke([-20,-15,-12,-10,-10,-12,-15,-20,-15,-8,-5,-1,-1,-5,-8,-15,-10,-1,4,7,7,4,-1,-10,-4,5,11,14,14,11,5,-4,1,8,14,21,21,14,8,1,3,10,10,15,15,10,10,3,10,4,3,6,6,3,4,10,0,2,-3,3,3,-3,2,0]),qe[11]=Ke([5,9,12,14,14,12,9,5,13,24,29,33,33,29,24,13,10,25,30,35,35,30,25,10,5,18,27,34,34,27,18,5,4,14,22,30,30,22,14,4,-2,5,16,23,23,16,5,-2,-5,-5,4,4,4,4,-5,-5,-23,-14,-9,-10,-10,-9,-14,-23]),qe[12]=new Int16Array(64),qe[13]=new Int16Array(64);var Je=Ke([-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-40,-35,-35,-35,-35,-35,-35,-35,-35,-30,-30,-30,-30,-30,-30,-30,-30,-25,-25,-25,-26,-26,-25,-25,-25,-12,-16,-18,-22,-22,-18,-16,-12,0,1,-5,-16,-16,-5,1,0,12,13,-1,-5,-5,-1,13,12]),Ye=Ke([-40,-25,-15,-10,-10,-15,-25,-40,-25,-9,0,6,6,0,-9,-25,-14,1,13,21,21,13,1,-14,-9,9,22,21,21,22,9,-9,-10,7,19,17,17,19,7,-10,-14,0,12,17,17,12,0,-14,-24,-11,-1,2,2,-1,-11,-24,-38,-26,-19,-12,-12,-19,-26,-38]),Xe=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],Ze=(e,t,n)=>{let r=(e&7)+t,i=(e>>3)+n;return r<0||r>7||i<0||i>7?-1:i<<3|r};function Qe(e,t,n,r){let i=n===3?4:0,a=n===4?4:8,o=0;for(let s=i;s<a;s++){let[i,a]=Xe[s];for(let s=Ze(t,i,a);s>=0;s=Ze(s,i,a)){let t=e[s];if(!t){o++;continue}if(n===8){if(h(t)===r)continue;o++;break}h(t)!==r&&o++;break}}return o*Le[n]}function $e(e,t,n){let r=n===0?1:-1,i=0;for(let a=0;a<8;a++){let[o,s]=Xe[a];if(o===0&&s===r)continue;let c=Ze(t,o,s);if(c<0)continue;let l=e[c];l&&h(l)!==n&&P(11,m(l))&&i++}return Math.min(i*Re,ze)}function et(e,t,n){let r=n===0?1:-1,i=0;for(let a=-1;a<=1;a++){let o=Ze(t,a,r);if(o<0)continue;let s=e[o];if(!s||h(s)!==n){i-=Ue;continue}let c=m(s);i+=c===9?Ve:c===1?Be:He}return i}var tt=(e,t)=>Math.max(Math.abs((e&7)-(t&7)),Math.abs((e>>3)-(t>>3))),nt=[-1,-1],rt=[];function it(e,t){let n=0,r=0;nt[0]=nt[1]=-1,rt.length=0;for(let t=0;t<64;t++){let i=e[t];if(!i)continue;let a=m(i),o=h(i);if(a===6){nt[o]=t;continue}let s=B[a]+qe[a][o===0?t:t^56];a!==1&&(r+=B[a]),a===3||a===4||a===5||a===8?s+=Qe(e,t,a,o):a===11?s+=$e(e,t,o):a===10&&rt.push(t),n+=o===0?s:-s}let i=Math.min(1,r/Ge);for(let t=0;t<2;t++){let r=t,a=nt[t];if(a<0)continue;let o=r===0?a:a^56,s=Je[o]*i+Ye[o]*(1-i)+et(e,a,r)*i;for(let t=0;t<rt.length;t++){let n=rt[t];if(h(e[n])!==r)continue;let i=tt(n,a);i<=2&&(s+=We[i])}n+=r===0?s:-s}return Math.round(t===0?n:-n)+Ie}var at=`linear`,ot=(e,t)=>{if(at===`nnue`)return ke(e,t);let n=it(e,t);if(at===`linear`)return n;let r=ke(e,t);return n+(r>150?150:r<-150?-150:r)},st=`PNBRQALGMS`;function ct(){let e={},t={};for(let e of Object.keys(Fe))t[e]=B[Fe[e]];for(let t of st)e[t]=[...qe[Fe[t]]];return{values:t,pst:e,kingMg:[...Je],kingEg:[...Ye],mob:{B:Le[3],R:Le[4],Q:Le[5],L:Le[8]},beastTarget:Re,beastTargetMax:ze,shield:{pawn:Be,guard:Ve,other:He,open:Ue},maesterNearKing:[...We],tempo:Ie,phaseMax:Ge,evaluator:at}}ct();var lt=2654435769,ut=()=>(lt^=lt<<13,lt^=lt>>>17,lt^=lt<<5,lt>>>0),dt=14,ft=new Int32Array(3584),pt=new Int32Array(3584),mt=(e,t,n)=>{let r=(e*2+t)*dt+n<<6;for(let e=r;e<r+64;e++)ft[e]=ut()|0,pt[e]=ut()&1048575};for(let e=0;e<2;e++)for(let t=0;t<12;t++)mt(0,e,t);var ht=ut()|0,gt=ut()&1048575;for(let e=0;e<2;e++)for(let t=0;t<12;t++)mt(1,e,t);for(let e=0;e<2;e++)for(let t=0;t<2;t++)for(let n=12;n<dt;n++)mt(e,t,n);var _t=(e,t)=>((e&32?2:0)+h(e))*dt+m(e)<<6|t,vt=(e,t)=>t*4294967296+(e>>>0);function yt(e,t,n){let r=0,i=0;for(let t=0;t<64;t++){let n=e[t];if(!n)continue;let a=_t(n,t);r^=ft[a],i^=pt[a]}t&&(r^=ht,i^=gt),n[0]=r,n[1]=i}var bt=1e5,xt=99e3,St=bt*2,Ct=64,wt=8,Tt=120,V=new Uint8Array(64),Et=0,Dt=0,Ot=0,kt=new Int32Array(2),At=new Int32Array(2048),jt=new Uint8Array(2048),Mt=0,Nt=Array.from({length:74},()=>[]),Pt=Array.from({length:74},()=>new Int32Array(96)),Ft=new Float64Array(74),It=new Int32Array(132),Lt=new Int32Array(4096),Rt=1<<17,zt=131071,Bt=0,Vt=1,Ht=2,Ut=new Float64Array(Rt),Wt=new Int32Array(Rt),Gt=new Int32Array(Rt),Kt=new Int32Array(Rt),qt=0,Jt=!1,Yt=0,Xt=1,Zt=[];function Qt(e,t){let n=V[e];if(At[Mt]=e,jt[Mt]=n,Mt++,n){let t=_t(n,e);Dt^=ft[t],Ot^=pt[t]}if(t){let n=_t(t,e);Dt^=ft[n],Ot^=pt[n]}V[e]=t}function $t(e){let t=Mt,n=V[e.from],r=V[e.to];for(let t=0;t<e.captures.length;t++)Qt(e.captures[t],0);return e.shove&&(Qt(e.shove.to,V[e.shove.from]),Qt(e.shove.from,0)),Qt(e.from,e.swap?r:0),Qt(e.to,e.selfRemove?0:F(n,e)),Dt^=ht,Ot^=gt,t}function en(e){for(;Mt>e;){Mt--;let e=At[Mt],t=jt[Mt],n=V[e];if(n){let t=_t(n,e);Dt^=ft[t],Ot^=pt[t]}if(t){let n=_t(t,e);Dt^=ft[n],Ot^=pt[n]}V[e]=t}Dt^=ht,Ot^=gt}function tn(e){let t=Mt,n=V[e.from],r=V[e.to];for(let t=0;t<e.captures.length;t++)At[Mt]=e.captures[t],jt[Mt]=V[e.captures[t]],Mt++,V[e.captures[t]]=0;return e.shove&&(At[Mt]=e.shove.to,jt[Mt]=V[e.shove.to],Mt++,V[e.shove.to]=V[e.shove.from],At[Mt]=e.shove.from,jt[Mt]=V[e.shove.from],Mt++,V[e.shove.from]=0),At[Mt]=e.from,jt[Mt]=n,Mt++,V[e.from]=e.swap?r:0,At[Mt]=e.to,jt[Mt]=V[e.to],Mt++,V[e.to]=e.selfRemove?0:F(n,e),t}function nn(e){for(;Mt>e;)Mt--,V[At[Mt]]=jt[Mt]}var rn=e=>{let t=V.indexOf(p(6,e));return t>=0&&ce(V,t,e^1)};function an(e,t,n){e.length=0;for(let r=0;r<64;r++){let i=V[r];i&&h(i)===t&&ae(V,r,n,e)}let r=0;for(let n=0;n<e.length;n++){let i=e[n],a=tn(i),o=!rn(t);nn(a),o&&(e[r++]=i)}return e.length=r,e}function on(e){let t=0;for(let n=0;n<e.captures.length;n++)t+=Pe[m(V[e.captures[n]])];return e.promo&&(t+=Pe[e.promo]-Pe[1]),e.selfRemove&&(t-=Pe[m(V[e.from])]),t}var sn=e=>(e.from|e.to<<6|(e.promo??0)<<12|Math.min(e.captures.length,15)<<16)+1;function cn(e,t,n){Pt[t].length<e.length&&(Pt[t]=new Int32Array(e.length*2));let r=Pt[t],i=It[t*2],a=It[t*2+1];for(let t=0;t<e.length;t++){let o=e[t],s=sn(o);s===n?r[t]=1<<28:o.captures.length||o.promo?r[t]=(1<<24)+on(o)*16-Pe[m(V[o.from])]:s===i?r[t]=8388609:s===a?r[t]=1<<23:r[t]=Math.min(Lt[o.from<<6|o.to],(1<<22)-1)}return r}function ln(e,t,n){let r=n;for(let i=n+1;i<e.length;i++)t[i]>t[r]&&(r=i);if(r===n)return;let i=e[n];e[n]=e[r],e[r]=i;let a=t[n];t[n]=t[r],t[r]=a}function un(e,t,n){for(let r=e-2;r>=0&&r>=e-t;r-=2)if(Ft[r]===n)return!0;let r=Zt.length;for(let i=r-1;i>=0&&i>=r-(t-e);i--)if(Zt[i]===n)return!0;return!1}var dn=(e,t)=>e>=xt?e+t:e<=-99e3?e-t:e,fn=(e,t)=>e>=xt?e-t:e<=-99e3?e+t:e;function pn(e,t,n,r,i,a,o){let s=n<<2|i;Ut[t]===e&&Kt[t]>>2>n&&i!==Bt||(Ut[t]=e,Wt[t]=dn(r,o),Kt[t]=s,Gt[t]=a||Gt[t])}var mn=()=>(!(++qt&1023)&&performance.now()>Yt&&(Jt=!0),Jt);function hn(e,t,n,r){let i=Et^n&1;if(mn()||n>=72)return ot(V,i);let a=rn(i),o;if(a)o=-2e5;else{if(o=ot(V,i),o>=t||r===0)return o;o>e&&(e=o)}let s=an(Nt[n],i,a?`all`:`captures`);if(a&&s.length===0)return-1e5+n;let c=cn(s,n,0),l=o;for(let i=0;i<s.length;i++){ln(s,c,i);let u=s[i];if(!a&&l+on(u)+Tt<e)continue;let d=$t(u),f=-hn(-t,-e,n+1,r-1);if(en(d),Jt||(f>o&&(o=f),f>e&&(e=f),e>=t))break}return o}function gn(e,t,n,r,i){let a=Et^r&1;if(mn()||r>=Ct)return ot(V,a);let o=vt(Dt,Ot);if(i>=100||un(r,i,o))return 0;if(Ft[r]=o,t<-1e5+r&&(t=-1e5+r),n>1e5-r-1&&(n=bt-r-1),t>=n)return t;let s=Dt&zt,c=0;if(Ut[s]===o){c=Gt[s];let i=Kt[s];if(i>>2>=e){let e=fn(Wt[s],r),a=i&3;if(a===Bt||a===Vt&&e>=n||a===Ht&&e<=t)return e}}let l=rn(a);if(l&&r<Xt*2&&e++,e<=0)return hn(t,n,r,wt);let u=an(Nt[r],a,`all`);if(u.length===0)return l?-1e5+r:0;let d=cn(u,r,c),f=-2e5,p=0,h=Ht;for(let a=0;a<u.length;a++){ln(u,d,a);let o=u[a],s=o.captures.length===0&&!o.promo,c=o.captures.length||m(V[o.from])===1?0:i+1,l=$t(o),g=-gn(e-1,a===0?-n:-t-1,-t,r+1,c);if(a>0&&g>t&&g<n&&(g=-gn(e-1,-n,-t,r+1,c)),en(l),Jt)return f===-2e5?t:f;if(g>f&&(f=g,p=sn(o)),g>t&&(t=g,h=Bt),t>=n){if(h=Vt,s){let t=sn(o);It[r*2]!==t&&(It[r*2+1]=It[r*2],It[r*2]=t),Lt[o.from<<6|o.to]+=e*e}break}}return pn(o,s,e,f,h,p,r),f}function _n(e,t={}){let n=t.timeMs??(t.maxDepth?1/0:1e3),r=performance.now(),i=Math.min(t.maxDepth??Ct,56);Yt=r+n,V.set(e.board),Et=e.turn,yt(V,e.turn,kt),Dt=kt[0],Ot=kt[1],Mt=0,qt=0,Jt=!1,Xt=1,Zt=t.history?t.history.map(Number):[],It.fill(0);for(let e=0;e<Lt.length;e++)Lt[e]>>=3;Ft[0]=vt(Dt,Ot);let a=t.multiPv===2,o=an(Nt[0],e.turn,`all`),s={move:o[0]??null,score:0,depth:0,nodes:0};if(o.length===0)return s;let c=0;for(let t=1;t<=i;t++){Xt=t;let i=-2e5,l=-2e5,u=-1,d=-2e5;for(let n=0;n<o.length;n++){let r=o[n],s=r.captures.length||m(V[r.from])===1?0:e.halfmove+1,c=$t(r),f=-gn(t-1,a||n===0?-2e5:-d-1,a?St:-d,1,s);if(!a&&n>0&&f>d&&(f=-gn(t-1,-2e5,-d,1,s)),en(c),Jt)break;f>i?(l=i,i=f,u=n):f>l&&(l=f),f>d&&(d=f)}if(u>=0&&(s.move=o[u],s.score=i,s.depth=t,a&&l>-2e5&&(s.second=l),o.unshift(...o.splice(u,1))),Jt||Math.abs(i)>=xt)break;let f=performance.now()-r;if(f+(f-c)*1.4>n||f>n*.75)break;c=f}return s.nodes=qt,s}var vn=class{pos;backRank=``;history=[];status=`playing`;cache=null;seen=new Map;constructor(e){this.newGame(e)}newGame(e=_e()){this.backRank=e,this.pos=ve(e),this.history=[],this.seen.clear(),this.cache=null,this.update()}load(e){this.backRank=``,this.pos=e,this.history=[],this.seen.clear(),this.cache=null,this.update()}key(){return ye(this.pos).split(` `,2).join(` `)}update(){this.seen.set(this.key(),(this.seen.get(this.key())??0)+1),this.setStatus()}setStatus(){let e=pe(this.pos);this.status=e===`playing`&&(this.seen.get(this.key())??1)>=3?`drawRepetition`:e}get legal(){return this.cache??=de(this.pos)}get inCheck(){return le(this.pos)}play(e){this.history.push({pos:this.pos,move:e,lan:xe(this.pos,e)}),this.pos=oe(this.pos,e),this.cache=null,this.update()}undo(){let e=this.history.pop();if(!e)return!1;let t=(this.seen.get(this.key())??1)-1;return t>0?this.seen.set(this.key(),t):this.seen.delete(this.key()),this.pos=e.pos,this.cache=null,this.setStatus(),!0}playLan(e){let t=0;for(let n of e){let e=this.legal.find(e=>xe(this.pos,e)===n);if(!e)break;this.play(e),t++}return t}},yn=class{worker=this.spawn();id=0;spawn(){try{let e=new Worker(new URL(new URL(`worker-C8IVcIyN.js`,import.meta.url).href,``+import.meta.url),{type:`module`});return e.onerror=()=>{this.worker=null},e}catch{return null}}think(e,t){let n=++this.id,r=this.worker,i=()=>n===this.id;return r?new Promise(o=>{let s=e=>{e.data.id===n&&(clearTimeout(c),r.removeEventListener(`message`,s),i()&&o(e.data))},c=setTimeout(()=>{r.removeEventListener(`message`,s),i()&&(this.worker=null,o(_n(e,t)))},(t.timeMs??1e3)+2500);r.addEventListener(`message`,s),r.postMessage({id:n,pos:e,opts:t,rules:{...a}})}):new Promise(n=>setTimeout(()=>{i()&&n(_n(e,t))},30))}cancel(){this.worker?.terminate(),this.worker=this.spawn(),this.id++}},bn={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},xn={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Sn=1e3,Cn=1001,wn=1002,Tn=1003,En=1004,Dn=1005,On=1006,kn=1007,An=1008,jn=1009,Mn=1010,Nn=1011,Pn=1012,Fn=1013,In=1014,Ln=1015,Rn=1016,zn=1017,Bn=1018,Vn=1020,Hn=35902,Un=35899,Wn=1021,Gn=1022,Kn=1023,qn=1026,Jn=1027,Yn=1028,Xn=1029,Zn=1030,Qn=1031,$n=1033,er=33776,tr=33777,nr=33778,rr=33779,ir=35840,ar=35841,or=35842,sr=35843,cr=36196,lr=37492,ur=37496,dr=37488,fr=37489,pr=37490,mr=37491,hr=37808,gr=37809,_r=37810,vr=37811,yr=37812,br=37813,xr=37814,Sr=37815,Cr=37816,wr=37817,Tr=37818,Er=37819,Dr=37820,Or=37821,kr=36492,Ar=36494,jr=36495,Mr=36283,Nr=36284,Pr=36285,Fr=36286,Ir=2300,Lr=2301,Rr=2302,zr=2303,Br=2400,Vr=2401,Hr=2402,Ur=3200,Wr=`srgb`,Gr=`srgb-linear`,Kr=`linear`,qr=`srgb`,Jr=7680,Yr=35044,Xr=35048,Zr=2e3;function Qr(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function $r(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function ei(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function ti(){let e=ei(`canvas`);return e.style.display=`block`,e}var ni={};function ri(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function ii(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function H(...e){e=ii(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function U(...e){e=ii(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function ai(...e){let t=e.join(` `);t in ni||(ni[t]=!0,H(...e))}function oi(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var si={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},ci=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},li=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),ui=1234567,di=Math.PI/180,fi=180/Math.PI;function pi(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(li[e&255]+li[e>>8&255]+li[e>>16&255]+li[e>>24&255]+`-`+li[t&255]+li[t>>8&255]+`-`+li[t>>16&15|64]+li[t>>24&255]+`-`+li[n&63|128]+li[n>>8&255]+`-`+li[n>>16&255]+li[n>>24&255]+li[r&255]+li[r>>8&255]+li[r>>16&255]+li[r>>24&255]).toLowerCase()}function W(e,t,n){return Math.max(t,Math.min(n,e))}function mi(e,t){return(e%t+t)%t}function hi(e,t,n,r,i){return r+(e-t)*(i-r)/(n-t)}function gi(e,t,n){return e===t?0:(n-e)/(t-e)}function _i(e,t,n){return(1-n)*e+n*t}function vi(e,t,n,r){return _i(e,t,1-Math.exp(-n*r))}function yi(e,t=1){return t-Math.abs(mi(e,t*2)-t)}function bi(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function xi(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function Si(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Ci(e,t){return e+Math.random()*(t-e)}function wi(e){return e*(.5-Math.random())}function Ti(e){e!==void 0&&(ui=e);let t=ui+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ei(e){return e*di}function Di(e){return e*fi}function Oi(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function ki(e){return 2**Math.ceil(Math.log(e)/Math.LN2)}function Ai(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function ji(e,t,n,r,i){let a=Math.cos,o=Math.sin,s=a(n/2),c=o(n/2),l=a((t+r)/2),u=o((t+r)/2),d=a((t-r)/2),f=o((t-r)/2),p=a((r-t)/2),m=o((r-t)/2);switch(i){case`XYX`:e.set(s*u,c*d,c*f,s*l);break;case`YZY`:e.set(c*f,s*u,c*d,s*l);break;case`ZXZ`:e.set(c*d,c*f,s*u,s*l);break;case`XZX`:e.set(s*u,c*m,c*p,s*l);break;case`YXY`:e.set(c*p,s*u,c*m,s*l);break;case`ZYZ`:e.set(c*m,c*p,s*u,s*l);break;default:H(`MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: `+i)}}function Mi(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function Ni(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var Pi={DEG2RAD:di,RAD2DEG:fi,generateUUID:pi,clamp:W,euclideanModulo:mi,mapLinear:hi,inverseLerp:gi,lerp:_i,damp:vi,pingpong:yi,smoothstep:bi,smootherstep:xi,randInt:Si,randFloat:Ci,randFloatSpread:wi,seededRandom:Ti,degToRad:Ei,radToDeg:Di,isPowerOfTwo:Oi,ceilPowerOfTwo:ki,floorPowerOfTwo:Ai,setQuaternionFromProperEuler:ji,normalize:Ni,denormalize:Mi},G=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(W(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(W(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Fi=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:H(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(W(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},K=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Li.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Li.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this.z=W(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this.z=W(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(W(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ii.copy(this).projectOnVector(e),this.sub(Ii)}reflect(e){return this.sub(Ii.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(W(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ii=new K,Li=new Fi,q=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return ai(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Ri.makeScale(e,t)),this}rotate(e){return ai(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Ri.makeRotation(-e)),this}translate(e,t){return ai(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Ri.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Ri=new q,zi=new q().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Bi=new q().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Vi(){let e={enabled:!0,workingColorSpace:Gr,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n?e:(this.spaces[t].transfer===`srgb`&&(e.r=Hi(e.r),e.g=Hi(e.g),e.b=Hi(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Ui(e.r),e.g=Ui(e.g),e.b=Ui(e.b)),e)},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?Kr:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return ai(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return ai(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[Gr]:{primaries:t,whitePoint:r,transfer:Kr,toXYZ:zi,fromXYZ:Bi,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Wr},outputColorSpaceConfig:{drawingBufferColorSpace:Wr}},[Wr]:{primaries:t,whitePoint:r,transfer:qr,toXYZ:zi,fromXYZ:Bi,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Wr}}}),e}var J=Vi();function Hi(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Ui(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Wi,Gi=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Wi===void 0&&(Wi=ei(`canvas`)),Wi.width=e.width,Wi.height=e.height;let t=Wi.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Wi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=ei(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Hi(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Hi(t[e]/255)*255):t[e]=Hi(t[e]);return{data:t,width:e.width,height:e.height}}return H(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Ki=0,qi=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Ki++}),this.uuid=pi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Ji(r[t].image)):e.push(Ji(r[t]))}else e=Ji(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Ji(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Gi.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(H(`Texture: Unable to serialize Texture.`),{})}var Yi=0,Xi=new K,Zi=class e extends ci{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=Cn,i=Cn,a=On,o=An,s=Kn,c=jn,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Yi++}),this.uuid=pi(),this.name=``,this.source=new qi(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new G(0,0),this.repeat=new G(1,1),this.center=new G(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new q,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Xi).x}get height(){return this.source.getSize(Xi).y}get depth(){return this.source.getSize(Xi).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){H(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){H(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Sn:e.x-=Math.floor(e.x);break;case Cn:e.x=e.x<0?0:1;break;case wn:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Sn:e.y-=Math.floor(e.y);break;case Cn:e.y=e.y<0?0:1;break;case wn:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Zi.DEFAULT_IMAGE=null,Zi.DEFAULT_MAPPING=300,Zi.DEFAULT_ANISOTROPY=1;var Qi=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this.z=W(this.z,e.z,t.z),this.w=W(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this.z=W(this.z,e,t),this.w=W(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(W(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},$i=class extends ci{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:On,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Qi(0,0,e,t),this.scissorTest=!1,this.viewport=new Qi(0,0,e,t),this.textures=[];let r=new Zi({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:On,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new qi(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},ea=class extends $i{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},ta=class extends Zi{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Tn,this.minFilter=Tn,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},na=class extends Zi{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Tn,this.minFilter=Tn,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},ra=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/ia.setFromMatrixColumn(e,0).length(),i=1/ia.setFromMatrixColumn(e,1).length(),a=1/ia.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(oa,e,sa)}lookAt(e,t,n){let r=this.elements;return ua.subVectors(e,t),ua.lengthSq()===0&&(ua.z=1),ua.normalize(),ca.crossVectors(n,ua),ca.lengthSq()===0&&(Math.abs(n.z)===1?ua.x+=1e-4:ua.z+=1e-4,ua.normalize(),ca.crossVectors(n,ua)),ca.normalize(),la.crossVectors(ua,ca),r[0]=ca.x,r[4]=la.x,r[8]=ua.x,r[1]=ca.y,r[5]=la.y,r[9]=ua.y,r[2]=ca.z,r[6]=la.z,r[10]=ua.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],te=r[7],N=r[11],P=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*te,i[8]=a*C+o*D+s*j+c*N,i[12]=a*w+o*O+s*ee+c*P,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*te,i[9]=l*C+u*D+d*j+f*N,i[13]=l*w+u*O+d*ee+f*P,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*te,i[10]=p*C+m*D+h*j+g*N,i[14]=p*w+m*O+h*ee+g*P,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*te,i[11]=_*C+v*D+y*j+b*N,i[15]=_*w+v*O+y*ee+b*P,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=ia.set(r[0],r[1],r[2]).length(),o=ia.set(r[4],r[5],r[6]).length(),s=ia.set(r[8],r[9],r[10]).length();i<0&&(a=-a),aa.copy(this);let c=1/a,l=1/o,u=1/s;return aa.elements[0]*=c,aa.elements[1]*=c,aa.elements[2]*=c,aa.elements[4]*=l,aa.elements[5]*=l,aa.elements[6]*=l,aa.elements[8]*=u,aa.elements[9]*=u,aa.elements[10]*=u,t.setFromRotationMatrix(aa),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=Zr,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=Zr,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},ia=new K,aa=new ra,oa=new K(0,0,0),sa=new K(1,1,1),ca=new K,la=new K,ua=new K,da=new ra,fa=new Fi,pa=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(W(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-W(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(W(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-W(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(W(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-W(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:H(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return da.makeRotationFromQuaternion(e),this.setFromRotationMatrix(da,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return fa.setFromEuler(this),this.setFromQuaternion(fa,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};pa.DEFAULT_ORDER=`XYZ`;var ma=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&(1<<e|0))}},ha=0,ga=new K,_a=new Fi,va=new ra,ya=new K,ba=new K,xa=new K,Sa=new Fi,Ca=new K(1,0,0),wa=new K(0,1,0),Ta=new K(0,0,1),Ea={type:`added`},Da={type:`removed`},Oa={type:`childadded`,child:null},ka={type:`childremoved`,child:null},Aa=class e extends ci{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ha++}),this.uuid=pi(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new K,n=new pa,r=new Fi,i=new K(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new ra},normalMatrix:{value:new q}}),this.matrix=new ra,this.matrixWorld=new ra,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ma,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return _a.setFromAxisAngle(e,t),this.quaternion.multiply(_a),this}rotateOnWorldAxis(e,t){return _a.setFromAxisAngle(e,t),this.quaternion.premultiply(_a),this}rotateX(e){return this.rotateOnAxis(Ca,e)}rotateY(e){return this.rotateOnAxis(wa,e)}rotateZ(e){return this.rotateOnAxis(Ta,e)}translateOnAxis(e,t){return ga.copy(e).applyQuaternion(this.quaternion),this.position.add(ga.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ca,e)}translateY(e){return this.translateOnAxis(wa,e)}translateZ(e){return this.translateOnAxis(Ta,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(va.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ya.copy(e):ya.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),ba.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?va.lookAt(ba,ya,this.up):va.lookAt(ya,ba,this.up),this.quaternion.setFromRotationMatrix(va),r&&(va.extractRotation(r.matrixWorld),_a.setFromRotationMatrix(va),this.quaternion.premultiply(_a.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(U(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ea),Oa.child=e,this.dispatchEvent(Oa),Oa.child=null):U(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Da),ka.child=e,this.dispatchEvent(ka),ka.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),va.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),va.multiply(e.parent.matrixWorld)),e.applyMatrix4(va),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ea),Oa.child=e,this.dispatchEvent(Oa),Oa.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ba,e,xa),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ba,Sa,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Aa.DEFAULT_UP=new K(0,1,0),Aa.DEFAULT_MATRIX_AUTO_UPDATE=!0,Aa.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ja=class extends Aa{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Ma={type:`move`},Na=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ja,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ja,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new K,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new K),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ja,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new K,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new K,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ma)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new ja;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Pa={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Fa={h:0,s:0,l:0},Ia={h:0,s:0,l:0};function La(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Y=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Wr){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,J.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=J.workingColorSpace){return this.r=e,this.g=t,this.b=n,J.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=J.workingColorSpace){if(e=mi(e,1),t=W(t,0,1),n=W(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=La(i,r,e+1/3),this.g=La(i,r,e),this.b=La(i,r,e-1/3)}return J.colorSpaceToWorking(this,r),this}setStyle(e,t=Wr){function n(t){t!==void 0&&parseFloat(t)<1&&H(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:H(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);H(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Wr){let n=Pa[e.toLowerCase()];return n===void 0?H(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Hi(e.r),this.g=Hi(e.g),this.b=Hi(e.b),this}copyLinearToSRGB(e){return this.r=Ui(e.r),this.g=Ui(e.g),this.b=Ui(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Wr){return J.workingToColorSpace(Ra.copy(this),e),Math.round(W(Ra.r*255,0,255))*65536+Math.round(W(Ra.g*255,0,255))*256+Math.round(W(Ra.b*255,0,255))}getHexString(e=Wr){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=J.workingColorSpace){J.workingToColorSpace(Ra.copy(this),t);let n=Ra.r,r=Ra.g,i=Ra.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=J.workingColorSpace){return J.workingToColorSpace(Ra.copy(this),t),e.r=Ra.r,e.g=Ra.g,e.b=Ra.b,e}getStyle(e=Wr){J.workingToColorSpace(Ra.copy(this),e);let t=Ra.r,n=Ra.g,r=Ra.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(Fa),this.setHSL(Fa.h+e,Fa.s+t,Fa.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Fa),e.getHSL(Ia);let n=_i(Fa.h,Ia.h,t),r=_i(Fa.s,Ia.s,t),i=_i(Fa.l,Ia.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ra=new Y;Y.NAMES=Pa;var za=class extends Aa{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new pa,this.environmentIntensity=1,this.environmentRotation=new pa,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Ba=new K,Va=new K,Ha=new K,Ua=new K,Wa=new K,Ga=new K,Ka=new K,qa=new K,Ja=new K,Ya=new K,Xa=new Qi,Za=new Qi,Qa=new Qi,$a=class e{constructor(e=new K,t=new K,n=new K){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Ba.subVectors(e,t),r.cross(Ba);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Ba.subVectors(r,t),Va.subVectors(n,t),Ha.subVectors(e,t);let a=Ba.dot(Ba),o=Ba.dot(Va),s=Ba.dot(Ha),c=Va.dot(Va),l=Va.dot(Ha),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Ua)!==null&&Ua.x>=0&&Ua.y>=0&&Ua.x+Ua.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Ua)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Ua.x),s.addScaledVector(a,Ua.y),s.addScaledVector(o,Ua.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return Xa.setScalar(0),Za.setScalar(0),Qa.setScalar(0),Xa.fromBufferAttribute(e,t),Za.fromBufferAttribute(e,n),Qa.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Xa,i.x),a.addScaledVector(Za,i.y),a.addScaledVector(Qa,i.z),a}static isFrontFacing(e,t,n,r){return Ba.subVectors(n,t),Va.subVectors(e,t),Ba.cross(Va).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ba.subVectors(this.c,this.b),Va.subVectors(this.a,this.b),Ba.cross(Va).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Wa.subVectors(r,n),Ga.subVectors(i,n),qa.subVectors(e,n);let s=Wa.dot(qa),c=Ga.dot(qa);if(s<=0&&c<=0)return t.copy(n);Ja.subVectors(e,r);let l=Wa.dot(Ja),u=Ga.dot(Ja);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Wa,a);Ya.subVectors(e,i);let f=Wa.dot(Ya),p=Ga.dot(Ya);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Ga,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Ka.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Ka,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Wa,a).addScaledVector(Ga,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},eo=class{constructor(e=new K(1/0,1/0,1/0),t=new K(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(no.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(no.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=no.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,no):no.fromBufferAttribute(r,t),no.applyMatrix4(e.matrixWorld),this.expandByPoint(no);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),ro.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),ro.copy(e.boundingBox)),ro.applyMatrix4(e.matrixWorld),this.union(ro)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,no),no.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(uo),fo.subVectors(this.max,uo),io.subVectors(e.a,uo),ao.subVectors(e.b,uo),oo.subVectors(e.c,uo),so.subVectors(ao,io),co.subVectors(oo,ao),lo.subVectors(io,oo);let t=[0,-so.z,so.y,0,-co.z,co.y,0,-lo.z,lo.y,so.z,0,-so.x,co.z,0,-co.x,lo.z,0,-lo.x,-so.y,so.x,0,-co.y,co.x,0,-lo.y,lo.x,0];return!ho(t,io,ao,oo,fo)||(t=[1,0,0,0,1,0,0,0,1],!ho(t,io,ao,oo,fo))?!1:(po.crossVectors(so,co),t=[po.x,po.y,po.z],ho(t,io,ao,oo,fo))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,no).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(no).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(to[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),to[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),to[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),to[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),to[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),to[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),to[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),to[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(to),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},to=[new K,new K,new K,new K,new K,new K,new K,new K],no=new K,ro=new eo,io=new K,ao=new K,oo=new K,so=new K,co=new K,lo=new K,uo=new K,fo=new K,po=new K,mo=new K;function ho(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){mo.fromArray(e,a);let o=i.x*Math.abs(mo.x)+i.y*Math.abs(mo.y)+i.z*Math.abs(mo.z),s=t.dot(mo),c=n.dot(mo),l=r.dot(mo);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var go=new K,_o=new G,vo=0,yo=class extends ci{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:vo++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Yr,this.updateRanges=[],this.gpuType=Ln,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)_o.fromBufferAttribute(this,t),_o.applyMatrix3(e),this.setXY(t,_o.x,_o.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)go.fromBufferAttribute(this,t),go.applyMatrix3(e),this.setXYZ(t,go.x,go.y,go.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)go.fromBufferAttribute(this,t),go.applyMatrix4(e),this.setXYZ(t,go.x,go.y,go.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)go.fromBufferAttribute(this,t),go.applyNormalMatrix(e),this.setXYZ(t,go.x,go.y,go.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)go.fromBufferAttribute(this,t),go.transformDirection(e),this.setXYZ(t,go.x,go.y,go.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Mi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Ni(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Mi(t,this.array)),t}setX(e,t){return this.normalized&&(t=Ni(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Mi(t,this.array)),t}setY(e,t){return this.normalized&&(t=Ni(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Mi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Ni(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Mi(t,this.array)),t}setW(e,t){return this.normalized&&(t=Ni(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Ni(t,this.array),n=Ni(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Ni(t,this.array),n=Ni(n,this.array),r=Ni(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=Ni(t,this.array),n=Ni(n,this.array),r=Ni(r,this.array),i=Ni(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},bo=class extends yo{constructor(e,t,n){super(new Uint16Array(e),t,n)}},xo=class extends yo{constructor(e,t,n){super(new Uint32Array(e),t,n)}},So=class extends yo{constructor(e,t,n){super(new Float32Array(e),t,n)}},Co=new eo,wo=new K,To=new K,Eo=class{constructor(e=new K,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Co.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;wo.subVectors(e,this.center);let t=wo.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(wo,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(To.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(wo.copy(e.center).add(To)),this.expandByPoint(wo.copy(e.center).sub(To))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Do=0,Oo=new ra,ko=new Aa,Ao=new K,jo=new eo,Mo=new eo,No=new K,Po=class e extends ci{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Do++}),this.uuid=pi(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Qr(e)?xo:bo)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new q().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Oo.makeRotationFromQuaternion(e),this.applyMatrix4(Oo),this}rotateX(e){return Oo.makeRotationX(e),this.applyMatrix4(Oo),this}rotateY(e){return Oo.makeRotationY(e),this.applyMatrix4(Oo),this}rotateZ(e){return Oo.makeRotationZ(e),this.applyMatrix4(Oo),this}translate(e,t,n){return Oo.makeTranslation(e,t,n),this.applyMatrix4(Oo),this}scale(e,t,n){return Oo.makeScale(e,t,n),this.applyMatrix4(Oo),this}lookAt(e){return ko.lookAt(e),ko.updateMatrix(),this.applyMatrix4(ko.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ao).negate(),this.translate(Ao.x,Ao.y,Ao.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new So(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&H(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new eo);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){U(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new K(-1/0,-1/0,-1/0),new K(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];jo.setFromBufferAttribute(n),this.morphTargetsRelative?(No.addVectors(this.boundingBox.min,jo.min),this.boundingBox.expandByPoint(No),No.addVectors(this.boundingBox.max,jo.max),this.boundingBox.expandByPoint(No)):(this.boundingBox.expandByPoint(jo.min),this.boundingBox.expandByPoint(jo.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&U(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Eo);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){U(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new K,1/0);return}if(e){let n=this.boundingSphere.center;if(jo.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Mo.setFromBufferAttribute(n),this.morphTargetsRelative?(No.addVectors(jo.min,Mo.min),jo.expandByPoint(No),No.addVectors(jo.max,Mo.max),jo.expandByPoint(No)):(jo.expandByPoint(Mo.min),jo.expandByPoint(Mo.max))}jo.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)No.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(No));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)No.fromBufferAttribute(a,t),o&&(Ao.fromBufferAttribute(e,t),No.add(Ao)),r=Math.max(r,n.distanceToSquared(No))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&U(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){U(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new yo(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new K,s[e]=new K;let c=new K,l=new K,u=new K,d=new G,f=new G,p=new G,m=new K,h=new K;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new K,y=new K,b=new K,x=new K;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new yo(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new K,i=new K,a=new K,o=new K,s=new K,c=new K,l=new K,u=new K;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)No.fromBufferAttribute(e,t),No.normalize(),e.setXYZ(t,No.x,No.y,No.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new yo(a,r,i)}if(this.index===null)return H(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},Fo=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=Yr,this.updateRanges=[],this.version=0,this.uuid=pi()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=pi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=pi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},Io=new K,Lo=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Io.fromBufferAttribute(this,t),Io.applyMatrix4(e),this.setXYZ(t,Io.x,Io.y,Io.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Io.fromBufferAttribute(this,t),Io.applyNormalMatrix(e),this.setXYZ(t,Io.x,Io.y,Io.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Io.fromBufferAttribute(this,t),Io.transformDirection(e),this.setXYZ(t,Io.x,Io.y,Io.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Mi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Ni(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Ni(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Ni(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Ni(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Ni(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Mi(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Mi(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Mi(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Mi(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Ni(t,this.array),n=Ni(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Ni(t,this.array),n=Ni(n,this.array),r=Ni(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Ni(t,this.array),n=Ni(n,this.array),r=Ni(r,this.array),i=Ni(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){ri(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new yo(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){ri(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Ro=new K,zo=new K,Bo=new q,Vo=class{constructor(e=new K(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Ro.subVectors(n,t).cross(zo.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Ro),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Bo.getNormalMatrix(e),r=this.coplanarPoint(Ro).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Ho=0,Uo=class extends ci{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ho++}),this.uuid=pi(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Y(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Jr,this.stencilZFail=Jr,this.stencilZPass=Jr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){H(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){H(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Y().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Vo().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new G().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new G().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Wo=class extends Uo{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new Y(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Go,Ko=new K,qo=new K,Jo=new K,Yo=new G,Xo=new G,Zo=new ra,Qo=new K,$o=new K,es=new K,ts=new G,ns=new G,rs=new G,is=class extends Aa{constructor(e=new Wo){if(super(),this.isSprite=!0,this.type=`Sprite`,Go===void 0){Go=new Po;let e=new Fo(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);Go.setIndex([0,1,2,0,2,3]),Go.setAttribute(`position`,new Lo(e,3,0,!1)),Go.setAttribute(`uv`,new Lo(e,2,3,!1))}this.geometry=Go,this.material=e,this.center=new G(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&U(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),qo.setFromMatrixScale(this.matrixWorld),Zo.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Jo.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&qo.multiplyScalar(-Jo.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;as(Qo.set(-.5,-.5,0),Jo,a,qo,r,i),as($o.set(.5,-.5,0),Jo,a,qo,r,i),as(es.set(.5,.5,0),Jo,a,qo,r,i),ts.set(0,0),ns.set(1,0),rs.set(1,1);let o=e.ray.intersectTriangle(Qo,$o,es,!1,Ko);if(o===null&&(as($o.set(-.5,.5,0),Jo,a,qo,r,i),ns.set(0,1),o=e.ray.intersectTriangle(Qo,es,$o,!1,Ko),o===null))return;let s=e.ray.origin.distanceTo(Ko);s<e.near||s>e.far||t.push({distance:s,point:Ko.clone(),uv:$a.getInterpolation(Ko,Qo,$o,es,ts,ns,rs,new G),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function as(e,t,n,r,i,a){Yo.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?Xo.copy(Yo):(Xo.x=a*Yo.x-i*Yo.y,Xo.y=i*Yo.x+a*Yo.y),e.copy(t),e.x+=Xo.x,e.y+=Xo.y,e.applyMatrix4(Zo)}var os=new K,ss=new K,cs=new K,ls=new K,us=class{constructor(e=new K,t=new K(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,os)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=os.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(os.copy(this.origin).addScaledVector(this.direction,t),os.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){ss.copy(e).add(t).multiplyScalar(.5),cs.copy(t).sub(e).normalize(),ls.copy(this.origin).sub(ss);let i=e.distanceTo(t)*.5,a=-this.direction.dot(cs),o=ls.dot(this.direction),s=-ls.dot(cs),c=ls.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(ss).addScaledVector(cs,d),f}intersectSphere(e,t){if(e.radius<0)return null;os.subVectors(e.center,this.origin);let n=os.dot(this.direction),r=os.dot(os)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,os)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let te=S/w,N=C/w,P=1/w,ne=T-te*D,re=E-N*D,ie=O-te*A,ae=k-N*A,F=j-te*M,oe=ee-N*M,se=F*ae-oe*ie,ce=ne*oe-re*F,le=ie*re-ae*ne;if(r){if(se<0||ce<0||le<0)return null}else if((se<0||ce<0||le<0)&&(se>0||ce>0||le>0))return null;let ue=se+ce+le;if(ue===0)return null;let de=P*(se*D+ce*A+le*M);return(ue>0?de<0:de>0)?null:this.at(de/ue,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ds=class extends Uo{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new Y(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pa,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},fs=new ra,ps=new us,ms=new Eo,hs=new K,gs=new K,_s=new K,vs=new K,ys=new K,bs=new K,xs=new K,Ss=new K,Cs=class extends Aa{constructor(e=new Po,t=new ds){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){bs.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(ys.fromBufferAttribute(s,e),a?bs.addScaledVector(ys,r):bs.addScaledVector(ys.sub(t),r))}t.add(bs)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ms.copy(n.boundingSphere),ms.applyMatrix4(i),ps.copy(e.ray).recast(e.near),!(ms.containsPoint(ps.origin)===!1&&(ps.intersectSphere(ms,hs)===null||ps.origin.distanceToSquared(hs)>(e.far-e.near)**2))&&(fs.copy(i).invert(),ps.copy(e.ray).applyMatrix4(fs),(n.boundingBox===null||ps.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,ps)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=Ts(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=Ts(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=Ts(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=Ts(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ws(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Ss.copy(s),Ss.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Ss);return l<n.near||l>n.far?null:{distance:l,point:Ss.clone(),object:e}}function Ts(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,gs),e.getVertexPosition(c,_s),e.getVertexPosition(l,vs);let u=ws(e,t,n,r,gs,_s,vs,xs);if(u){let e=new K;$a.getBarycoord(xs,gs,_s,vs,e),i&&(u.uv=$a.getInterpolatedAttribute(i,s,c,l,e,new G)),a&&(u.uv1=$a.getInterpolatedAttribute(a,s,c,l,e,new G)),o&&(u.normal=$a.getInterpolatedAttribute(o,s,c,l,e,new K),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new K,materialIndex:0};$a.getNormal(gs,_s,vs,t.normal),u.face=t,u.barycoord=e}return u}var Es=class extends Zi{constructor(e=null,t=1,n=1,r,i,a,o,s,c=Tn,l=Tn,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ds=class extends yo{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Os=new ra,ks=new ra,As=[],js=new eo,Ms=new ra,Ns=new Cs,Ps=new Eo,Fs=class extends Cs{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ds(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Ms)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new eo),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Os),js.copy(e.boundingBox).applyMatrix4(Os),this.boundingBox.union(js)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Eo),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Os),Ps.copy(e.boundingSphere).applyMatrix4(Os),this.boundingSphere.union(Ps)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Ns.geometry=this.geometry,Ns.material=this.material,Ns.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ps.copy(this.boundingSphere),Ps.applyMatrix4(n),e.ray.intersectsSphere(Ps)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Os),ks.multiplyMatrices(n,Os),Ns.matrixWorld=ks,Ns.raycast(e,As);for(let e=0,n=As.length;e<n;e++){let n=As[e];n.instanceId=i,n.object=this,t.push(n)}As.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Ds(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Es(new Float32Array(r*this.count),r,this.count,Yn,Ln));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Is=new Eo,Ls=new G(.5,.5),Rs=new K,zs=class{constructor(e=new Vo,t=new Vo,n=new Vo,r=new Vo,i=new Vo,a=new Vo){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Zr,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Is.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Is.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Is)}intersectsSprite(e){return Is.center.set(0,0,0),Is.radius=.7071067811865476+Ls.distanceTo(e.center),Is.applyMatrix4(e.matrixWorld),this.intersectsSphere(Is)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Rs.x=r.normal.x>0?e.max.x:e.min.x,Rs.y=r.normal.y>0?e.max.y:e.min.y,Rs.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Rs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Bs=class extends Zi{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Vs=class extends Zi{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Hs=class extends Zi{constructor(e,t,n=In,r,i,a,o=Tn,s=Tn,c,l=qn,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new qi(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Us=class extends Hs{constructor(e,t=In,n=301,r,i,a=Tn,o=Tn,s,c=qn){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Ws=class extends Zi{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Gs=class e extends Po{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new So(c,3)),this.setAttribute(`normal`,new So(l,3)),this.setAttribute(`uv`,new So(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new K;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Ks=class e extends Po{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new So(p,3)),this.setAttribute(`normal`,new So(m,3)),this.setAttribute(`uv`,new So(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};function qs(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Ys(i))i.isRenderTargetTexture?(H(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(Ys(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function Js(e){let t={};for(let n=0;n<e.length;n++){let r=qs(e[n]);for(let e in r)t[e]=r[e]}return t}function Ys(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Xs(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Zs(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:J.workingColorSpace}var Qs={clone:qs,merge:Js},$s=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ec=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,tc=class extends Uo{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=$s,this.fragmentShader=ec,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=qs(e.uniforms),this.uniformsGroups=Xs(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new Y().setHex(r.value);break;case`v2`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Qi().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new q().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new ra().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},nc=class extends tc{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},rc=class extends Uo{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:``},this.type=`MeshToonMaterial`,this.color=new Y(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Y(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new G(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},ic=class extends Uo{constructor(e){super(),this.isMeshNormalMaterial=!0,this.type=`MeshNormalMaterial`,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new G(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}},ac=class extends Uo{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type=`MeshLambertMaterial`,this.color=new Y(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Y(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new G(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pa,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},oc=class extends Uo{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=Ur,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},sc=class extends Uo{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function cc(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function lc(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var uc=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},dc=class extends uc{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Br,endingEnd:Br}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Vr:i=e,o=2*t-n;break;case Hr:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Vr:a=e,s=2*n-t;break;case Hr:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},fc=class extends uc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},pc=class extends uc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},mc=class extends uc{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=_c(n,t,g,y,r);i[p]=hc(x,o,_,b,m)}return i}};function hc(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function gc(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function _c(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=hc(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=gc(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var vc=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=cc(t,this.TimeBufferType),this.values=cc(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:cc(e.times,Array),values:cc(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),lc(e.settings)&&(n.settings={inTangents:cc(e.settings.inTangents,Array),outTangents:cc(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new pc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new fc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new dc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new mc(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ir:t=this.InterpolantFactoryMethodDiscrete;break;case Lr:t=this.InterpolantFactoryMethodLinear;break;case Rr:t=this.InterpolantFactoryMethodSmooth;break;case zr:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return H(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ir;case this.InterpolantFactoryMethodLinear:return Lr;case this.InterpolantFactoryMethodSmooth:return Rr;case this.InterpolantFactoryMethodBezier:return zr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;lc(this.settings)&&(yc(this.settings.inTangents,e),yc(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(U(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(U(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){U(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){U(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&$r(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){U(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Rr,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,lc(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function yc(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}vc.prototype.ValueTypeName=``,vc.prototype.TimeBufferType=Float32Array,vc.prototype.ValueBufferType=Float32Array,vc.prototype.DefaultInterpolation=Lr;var bc=class extends vc{constructor(e,t,n){super(e,t,n)}};bc.prototype.ValueTypeName=`bool`,bc.prototype.ValueBufferType=Array,bc.prototype.DefaultInterpolation=Ir,bc.prototype.InterpolantFactoryMethodLinear=void 0,bc.prototype.InterpolantFactoryMethodSmooth=void 0;var xc=class extends vc{constructor(e,t,n,r){super(e,t,n,r)}};xc.prototype.ValueTypeName=`color`;var Sc=class extends vc{constructor(e,t,n,r){super(e,t,n,r)}};Sc.prototype.ValueTypeName=`number`;var Cc=class extends uc{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Fi.slerpFlat(i,0,a,c-o,a,c,s);return i}},wc=class extends vc{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Cc(this.times,this.values,this.getValueSize(),e)}};wc.prototype.ValueTypeName=`quaternion`,wc.prototype.InterpolantFactoryMethodSmooth=void 0;var Tc=class extends vc{constructor(e,t,n){super(e,t,n)}};Tc.prototype.ValueTypeName=`string`,Tc.prototype.ValueBufferType=Array,Tc.prototype.DefaultInterpolation=Ir,Tc.prototype.InterpolantFactoryMethodLinear=void 0,Tc.prototype.InterpolantFactoryMethodSmooth=void 0;var Ec=class extends vc{constructor(e,t,n,r){super(e,t,n,r)}};Ec.prototype.ValueTypeName=`vector`;var Dc={enabled:!1,files:{},add:function(e,t){this.enabled!==!1&&(Oc(e)||(this.files[e]=t))},get:function(e){if(this.enabled!==!1&&!Oc(e))return this.files[e]},remove:function(e){delete this.files[e]},clear:function(){this.files={}}};function Oc(e){try{let t=e.slice(e.indexOf(`:`)+1);return new URL(t).protocol===`blob:`}catch{return!1}}var kc=new class{constructor(e,t,n){let r=this,i=!1,a=0,o=0,s,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(e){o++,i===!1&&r.onStart!==void 0&&r.onStart(e,a,o),i=!0},this.itemEnd=function(e){a++,r.onProgress!==void 0&&r.onProgress(e,a,o),a===o&&(i=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(e){r.onError!==void 0&&r.onError(e)},this.resolveURL=function(e){return e=e.normalize(`NFC`),s?s(e):e},this.setURLModifier=function(e){return s=e,this},this.addHandler=function(e,t){return c.push(e,t),this},this.removeHandler=function(e){let t=c.indexOf(e);return t!==-1&&c.splice(t,2),this},this.getHandler=function(e){for(let t=0,n=c.length;t<n;t+=2){let n=c[t],r=c[t+1];if(n.global&&(n.lastIndex=0),n.test(e))return r}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||=new AbortController,this._abortController}},Ac=class{constructor(e){this.manager=e===void 0?kc:e,this.crossOrigin=`anonymous`,this.withCredentials=!1,this.path=``,this.resourcePath=``,this.requestHeader={},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,i){n.load(e,r,t,i)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Ac.DEFAULT_MATERIAL_NAME=`__DEFAULT`;var jc=new WeakMap,Mc=class extends Ac{constructor(e){super(e)}load(e,t,n,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let i=this,a=Dc.get(`image:${e}`);if(a!==void 0){if(a.complete===!0)i.manager.itemStart(e),setTimeout(function(){t&&t(a),i.manager.itemEnd(e)},0);else{let e=jc.get(a);e===void 0&&(e=[],jc.set(a,e)),e.push({onLoad:t,onError:r})}return a}let o=ei(`img`);function s(){l(),t&&t(this);let n=jc.get(this)||[];for(let e=0;e<n.length;e++){let t=n[e];t.onLoad&&t.onLoad(this)}jc.delete(this),i.manager.itemEnd(e)}function c(t){l(),r&&r(t),Dc.remove(`image:${e}`);let n=jc.get(this)||[];for(let e=0;e<n.length;e++){let r=n[e];r.onError&&r.onError(t)}jc.delete(this),i.manager.itemError(e),i.manager.itemEnd(e)}function l(){o.removeEventListener(`load`,s,!1),o.removeEventListener(`error`,c,!1)}return o.addEventListener(`load`,s,!1),o.addEventListener(`error`,c,!1),e.slice(0,5)!==`data:`&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),Dc.add(`image:${e}`,o),i.manager.itemStart(e),o.src=e,o}},Nc=class extends Ac{constructor(e){super(e)}load(e,t,n,r){let i=new Zi,a=new Mc(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(e){i.image=e,i.needsUpdate=!0,t!==void 0&&t(i)},n,r),i}},Pc=class extends Aa{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new Y(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Fc=class extends Pc{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Aa.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Y(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Ic=new ra,Lc=new K,Rc=new K,zc=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new G(512,512),this.mapType=jn,this.map=null,this.mapPass=null,this.matrix=new ra,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new zs,this._frameExtents=new G(1,1),this._viewportCount=1,this._viewports=[new Qi(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Lc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Lc),Rc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Rc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){Ic.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Ic,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Ic)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Bc=new K,Vc=new Fi,Hc=new K,Uc=class extends Aa{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new ra,this.projectionMatrix=new ra,this.projectionMatrixInverse=new ra,this.coordinateSystem=Zr,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Bc,Vc,Hc),Hc.x===1&&Hc.y===1&&Hc.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Bc,Vc,Hc.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Bc,Vc,Hc),Hc.x===1&&Hc.y===1&&Hc.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Bc,Vc,Hc.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Wc=new K,Gc=new G,Kc=new G,qc=class extends Uc{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=fi*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(di*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return fi*2*Math.atan(Math.tan(di*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Wc.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Wc.x,Wc.y).multiplyScalar(-e/Wc.z),Wc.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Wc.x,Wc.y).multiplyScalar(-e/Wc.z)}getViewSize(e,t){return this.getViewBounds(e,Gc,Kc),t.subVectors(Kc,Gc)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(di*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Jc=class extends zc{constructor(){super(new qc(90,1,.5,500)),this.isPointLightShadow=!0}},Yc=class extends Pc{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new Jc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Xc=class extends Uc{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Zc=class extends zc{constructor(){super(new Xc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Qc=class extends Pc{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Aa.DEFAULT_UP),this.updateMatrix(),this.target=new Aa,this.shadow=new Zc}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},$c=-90,el=1,tl=class extends Aa{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new qc($c,el,e,t);r.layers=this.layers,this.add(r);let i=new qc($c,el,e,t);i.layers=this.layers,this.add(i);let a=new qc($c,el,e,t);a.layers=this.layers,this.add(a);let o=new qc($c,el,e,t);o.layers=this.layers,this.add(o);let s=new qc($c,el,e,t);s.layers=this.layers,this.add(s);let c=new qc($c,el,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},nl=class extends qc{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},rl=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=il.bind(this),e.addEventListener(`visibilitychange`,this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener(`visibilitychange`,this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e===void 0?performance.now():e)-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function il(){this._document.hidden===!1&&this.reset()}var al=`\\[\\]\\.:\\/`,ol=RegExp(`[\\[\\]\\.:\\/]`,`g`),sl=`[^\\[\\]\\.:\\/]`,cl=`[^`+al.replace(`\\.`,``)+`]`,ll=`((?:WC+[\\/:])*)`.replace(`WC`,sl),ul=`(WCOD+)?`.replace(`WCOD`,cl),dl=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,sl),fl=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,sl),pl=RegExp(`^`+ll+ul+dl+fl+`$`),ml=[`material`,`materials`,`bones`,`map`],hl=class{constructor(e,t,n){let r=n||gl.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},gl=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(ol,``)}static parseTrackName(e){let t=pl.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);ml.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){H(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){U(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){U(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){U(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){U(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){U(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;U(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};gl.Composite=hl,gl.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},gl.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},gl.prototype.GetterByBindingType=[gl.prototype._getValue_direct,gl.prototype._getValue_array,gl.prototype._getValue_arrayElement,gl.prototype._getValue_toArray],gl.prototype.SetterByBindingTypeAndVersioning=[[gl.prototype._setValue_direct,gl.prototype._setValue_direct_setNeedsUpdate,gl.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[gl.prototype._setValue_array,gl.prototype._setValue_array_setNeedsUpdate,gl.prototype._setValue_array_setMatrixWorldNeedsUpdate],[gl.prototype._setValue_arrayElement,gl.prototype._setValue_arrayElement_setNeedsUpdate,gl.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[gl.prototype._setValue_fromArray,gl.prototype._setValue_fromArray_setNeedsUpdate,gl.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var _l=new ra,vl=class{constructor(e,t,n=0,r=1/0){this.ray=new us(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new ma,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):U(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return _l.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(_l),this}intersectObject(e,t=!0,n=[]){return bl(e,this,n,t),n.sort(yl),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)bl(e[r],this,n,t);return n.sort(yl),n}};function yl(e,t){return e.distance-t.distance}function bl(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)bl(r[e],t,n,!0)}}var xl=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){let e=1e-6;return this.phi=W(this.phi,e,Math.PI-e),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(W(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};(class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});var Sl=class extends ci{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Cl(e,t,n,r){let i=wl(r);switch(n){case Wn:return e*t;case Yn:return e*t/i.components*i.byteLength;case Xn:return e*t/i.components*i.byteLength;case Zn:return e*t*2/i.components*i.byteLength;case Qn:return e*t*2/i.components*i.byteLength;case Gn:return e*t*3/i.components*i.byteLength;case Kn:return e*t*4/i.components*i.byteLength;case $n:return e*t*4/i.components*i.byteLength;case er:case tr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case nr:case rr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ar:case sr:return Math.max(e,16)*Math.max(t,8)/4;case ir:case or:return Math.max(e,8)*Math.max(t,8)/2;case cr:case lr:case dr:case fr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ur:case pr:case mr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case hr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case gr:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case _r:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case vr:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case yr:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case br:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case xr:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Sr:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Cr:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case wr:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Tr:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Er:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Dr:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Or:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case kr:case Ar:case jr:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Mr:case Nr:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Pr:case Fr:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function wl(e){switch(e){case jn:case Mn:return{byteLength:1,components:1};case Pn:case Nn:case Rn:return{byteLength:2,components:1};case zn:case Bn:return{byteLength:2,components:4};case In:case Fn:case Ln:return{byteLength:4,components:1};case Hn:case Un:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?H(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function Tl(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function El(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var X={alphahash_fragment:`#ifdef USE_ALPHAHASH
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
}`},Z={common:{diffuse:{value:new Y(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new q}},envmap:{envMap:{value:null},envMapRotation:{value:new q},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new q}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new q}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new q},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new q},normalScale:{value:new G(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new q},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new q}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new q}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new q}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Y(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new K},probesMax:{value:new K},probesResolution:{value:new K}},points:{diffuse:{value:new Y(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0},uvTransform:{value:new q}},sprite:{diffuse:{value:new Y(16777215)},opacity:{value:1},center:{value:new G(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}}},Dl={basic:{uniforms:Js([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.fog]),vertexShader:X.meshbasic_vert,fragmentShader:X.meshbasic_frag},lambert:{uniforms:Js([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},envMapIntensity:{value:1}}]),vertexShader:X.meshlambert_vert,fragmentShader:X.meshlambert_frag},phong:{uniforms:Js([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},specular:{value:new Y(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:X.meshphong_vert,fragmentShader:X.meshphong_frag},standard:{uniforms:Js([Z.common,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.roughnessmap,Z.metalnessmap,Z.fog,Z.lights,{emissive:{value:new Y(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag},toon:{uniforms:Js([Z.common,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.gradientmap,Z.fog,Z.lights,{emissive:{value:new Y(0)}}]),vertexShader:X.meshtoon_vert,fragmentShader:X.meshtoon_frag},matcap:{uniforms:Js([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,{matcap:{value:null}}]),vertexShader:X.meshmatcap_vert,fragmentShader:X.meshmatcap_frag},points:{uniforms:Js([Z.points,Z.fog]),vertexShader:X.points_vert,fragmentShader:X.points_frag},dashed:{uniforms:Js([Z.common,Z.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:X.linedashed_vert,fragmentShader:X.linedashed_frag},depth:{uniforms:Js([Z.common,Z.displacementmap]),vertexShader:X.depth_vert,fragmentShader:X.depth_frag},normal:{uniforms:Js([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,{opacity:{value:1}}]),vertexShader:X.meshnormal_vert,fragmentShader:X.meshnormal_frag},sprite:{uniforms:Js([Z.sprite,Z.fog]),vertexShader:X.sprite_vert,fragmentShader:X.sprite_frag},background:{uniforms:{uvTransform:{value:new q},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:X.background_vert,fragmentShader:X.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new q}},vertexShader:X.backgroundCube_vert,fragmentShader:X.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:X.cube_vert,fragmentShader:X.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:X.equirect_vert,fragmentShader:X.equirect_frag},distance:{uniforms:Js([Z.common,Z.displacementmap,{referencePosition:{value:new K},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:X.distance_vert,fragmentShader:X.distance_frag},shadow:{uniforms:Js([Z.lights,Z.fog,{color:{value:new Y(0)},opacity:{value:1}}]),vertexShader:X.shadow_vert,fragmentShader:X.shadow_frag}};Dl.physical={uniforms:Js([Dl.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new q},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new q},clearcoatNormalScale:{value:new G(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new q},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new q},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new q},sheen:{value:0},sheenColor:{value:new Y(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new q},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new q},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new q},transmissionSamplerSize:{value:new G},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new q},attenuationDistance:{value:0},attenuationColor:{value:new Y(0)},specularColor:{value:new Y(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new q},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new q},anisotropyVector:{value:new G},anisotropyMap:{value:null},anisotropyMapTransform:{value:new q}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag};var Ol={r:0,b:0,g:0},kl=new ra,Al=new q;Al.set(-1,0,0,0,1,0,0,0,1);function jl(e,t,n,r,i,a){let o=new Y(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new Cs(new Gs(1,1,1),new tc({name:`BackgroundCubeMaterial`,uniforms:qs(Dl.backgroundCube.uniforms),vertexShader:Dl.backgroundCube.vertexShader,fragmentShader:Dl.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(kl.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Al),l.material.toneMapped=J.getTransfer(i.colorSpace)!==qr,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Cs(new Ks(2,2),new tc({name:`BackgroundMaterial`,uniforms:qs(Dl.background.uniforms),vertexShader:Dl.background.vertexShader,fragmentShader:Dl.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=J.getTransfer(i.colorSpace)!==qr,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(Ol,Zs(e)),n.buffers.color.setClear(Ol.r,Ol.g,Ol.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Ml(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Nl(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Pl(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(H(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&H(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Fl(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Vo,s=new q,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Il=4,Ll=6,Rl=20,zl=256,Bl=new Xc,Vl=new Y,Hl=null,Ul=0,Wl=0,Gl=!1,Kl=new K,ql=new K,Jl=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Kl}=i;Hl=this._renderer.getRenderTarget(),Ul=this._renderer.getActiveCubeFace(),Wl=this._renderer.getActiveMipmapLevel(),Gl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=tu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=eu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Hl,Ul,Wl),this._renderer.xr.enabled=Gl,e.scissorTest=!1,Zl(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Hl=this._renderer.getRenderTarget(),Ul=this._renderer.getActiveCubeFace(),Wl=this._renderer.getActiveMipmapLevel(),Gl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:On,minFilter:On,generateMipmaps:!1,type:Rn,format:Kn,colorSpace:Gr,depthBuffer:!1},r=Xl(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Xl(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Yl(r)),this._blurMaterial=$l(r,e,t),this._ggxMaterial=Ql(r,e,t)}return r}_compileMaterial(e){let t=new Cs(new Po,e);this._renderer.compile(t,Bl)}_sceneToCubeUV(e,t,n,r,i){let a=new qc(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(Vl),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Cs(new Gs,new ds({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(Vl),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;Zl(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=tu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=eu());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Zl(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,Bl)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-Il?n-d+Il:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,Zl(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,Bl),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,Zl(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,Bl)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];Zl(t,3*l*(r>this._lodMax-Il?r-this._lodMax+Il:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,Bl)}};function Yl(e){let t=[],n=[],r=e,i=e-Il+1+Ll;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?ql.set(1,r,n):e===1?ql.set(-n,1,-r):e===2?ql.set(-n,r,1):e===3?ql.set(-1,r,-n):e===4?ql.set(-n,-1,r):ql.set(n,r,-1),ql.toArray(l,(e*6+t)*3)}}let u=new Po;u.setAttribute(`position`,new yo(c,3)),u.setAttribute(`outputDirection`,new yo(l,3)),n.push(new Cs(u,null)),r>Il&&r--}return{lodMeshes:n,sizeLods:t}}function Xl(e,t,n){let r=new ea(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Zl(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Ql(e,t,n){return new tc({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:zl,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:nu(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function $l(e,t,n){return new tc({name:`SphericalGaussianBlur`,defines:{SAMPLES:Rl,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:nu(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function eu(){return new tc({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:nu(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function tu(){return new tc({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:nu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function nu(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var ru=class extends ea{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Bs(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Gs(5,5,5),i=new tc({name:`CubemapFromEquirect`,uniforms:qs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Cs(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=On),new tl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function iu(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new ru(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Jl(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Jl(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function au(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&ai(`WebGLRenderer: `+e+` extension not supported.`),t}}}function ou(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0?t:(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++,t)}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?xo:bo)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function su(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function cu(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:U(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function lu(e,t,n){let r=new WeakMap,i=new Qi;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new ta(h,p,m,u);g.type=Ln,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new G(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function uu(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var du={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function fu(e,t,n,r,i,a){let o=new ea(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new Po;l.setAttribute(`position`,new So([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new So([0,2,0,0,2,0],2));let u=new nc({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),d=new Cs(l,u),f=new Xc(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new ea(t,n,{type:Rn,depthBuffer:!1,stencilBuffer:!1}),c=new ea(t,n,{type:Rn,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},J.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=du[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var pu=new Zi,mu=new Hs(1,1),hu=new ta,gu=new na,_u=new Bs,vu=[],yu=[],bu=new Float32Array(16),xu=new Float32Array(9),Su=new Float32Array(4);function Cu(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=vu[i];if(a===void 0&&(a=new Float32Array(i),vu[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function wu(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function Tu(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Eu(e,t){let n=yu[t];n===void 0&&(n=new Int32Array(t),yu[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Du(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Ou(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(wu(n,t))return;e.uniform2fv(this.addr,t),Tu(n,t)}}function ku(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(wu(n,t))return;e.uniform3fv(this.addr,t),Tu(n,t)}}function Au(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(wu(n,t))return;e.uniform4fv(this.addr,t),Tu(n,t)}}function ju(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(wu(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),Tu(n,t)}else{if(wu(n,r))return;Su.set(r),e.uniformMatrix2fv(this.addr,!1,Su),Tu(n,r)}}function Mu(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(wu(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),Tu(n,t)}else{if(wu(n,r))return;xu.set(r),e.uniformMatrix3fv(this.addr,!1,xu),Tu(n,r)}}function Nu(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(wu(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),Tu(n,t)}else{if(wu(n,r))return;bu.set(r),e.uniformMatrix4fv(this.addr,!1,bu),Tu(n,r)}}function Pu(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Fu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(wu(n,t))return;e.uniform2iv(this.addr,t),Tu(n,t)}}function Iu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(wu(n,t))return;e.uniform3iv(this.addr,t),Tu(n,t)}}function Lu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(wu(n,t))return;e.uniform4iv(this.addr,t),Tu(n,t)}}function Ru(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function zu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(wu(n,t))return;e.uniform2uiv(this.addr,t),Tu(n,t)}}function Bu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(wu(n,t))return;e.uniform3uiv(this.addr,t),Tu(n,t)}}function Vu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(wu(n,t))return;e.uniform4uiv(this.addr,t),Tu(n,t)}}function Hu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(mu.compareFunction=n.isReversedDepthBuffer()?518:515,a=mu):a=pu,n.setTexture2D(t||a,i)}function Uu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||gu,i)}function Wu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||_u,i)}function Gu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||hu,i)}function Ku(e){switch(e){case 5126:return Du;case 35664:return Ou;case 35665:return ku;case 35666:return Au;case 35674:return ju;case 35675:return Mu;case 35676:return Nu;case 5124:case 35670:return Pu;case 35667:case 35671:return Fu;case 35668:case 35672:return Iu;case 35669:case 35673:return Lu;case 5125:return Ru;case 36294:return zu;case 36295:return Bu;case 36296:return Vu;case 35678:case 36198:case 36298:case 36306:case 35682:return Hu;case 35679:case 36299:case 36307:return Uu;case 35680:case 36300:case 36308:case 36293:return Wu;case 36289:case 36303:case 36311:case 36292:return Gu}}function qu(e,t){e.uniform1fv(this.addr,t)}function Ju(e,t){let n=Cu(t,this.size,2);e.uniform2fv(this.addr,n)}function Yu(e,t){let n=Cu(t,this.size,3);e.uniform3fv(this.addr,n)}function Xu(e,t){let n=Cu(t,this.size,4);e.uniform4fv(this.addr,n)}function Zu(e,t){let n=Cu(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Qu(e,t){let n=Cu(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function $u(e,t){let n=Cu(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function ed(e,t){e.uniform1iv(this.addr,t)}function td(e,t){e.uniform2iv(this.addr,t)}function nd(e,t){e.uniform3iv(this.addr,t)}function rd(e,t){e.uniform4iv(this.addr,t)}function id(e,t){e.uniform1uiv(this.addr,t)}function ad(e,t){e.uniform2uiv(this.addr,t)}function od(e,t){e.uniform3uiv(this.addr,t)}function sd(e,t){e.uniform4uiv(this.addr,t)}function cd(e,t,n){let r=this.cache,i=t.length,a=Eu(n,i);wu(r,a)||(e.uniform1iv(this.addr,a),Tu(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?mu:pu;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function ld(e,t,n){let r=this.cache,i=t.length,a=Eu(n,i);wu(r,a)||(e.uniform1iv(this.addr,a),Tu(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||gu,a[e])}function ud(e,t,n){let r=this.cache,i=t.length,a=Eu(n,i);wu(r,a)||(e.uniform1iv(this.addr,a),Tu(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||_u,a[e])}function dd(e,t,n){let r=this.cache,i=t.length,a=Eu(n,i);wu(r,a)||(e.uniform1iv(this.addr,a),Tu(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||hu,a[e])}function fd(e){switch(e){case 5126:return qu;case 35664:return Ju;case 35665:return Yu;case 35666:return Xu;case 35674:return Zu;case 35675:return Qu;case 35676:return $u;case 5124:case 35670:return ed;case 35667:case 35671:return td;case 35668:case 35672:return nd;case 35669:case 35673:return rd;case 5125:return id;case 36294:return ad;case 36295:return od;case 36296:return sd;case 35678:case 36198:case 36298:case 36306:case 35682:return cd;case 35679:case 36299:case 36307:return ld;case 35680:case 36300:case 36308:case 36293:return ud;case 36289:case 36303:case 36311:case 36292:return dd}}var pd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Ku(t.type)}},md=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=fd(t.type)}},hd=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},gd=/(\w+)(\])?(\[|\.)?/g;function _d(e,t){e.seq.push(t),e.map[t.id]=t}function vd(e,t,n){let r=e.name,i=r.length;for(gd.lastIndex=0;;){let a=gd.exec(r),o=gd.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){_d(n,l===void 0?new pd(s,e,t):new md(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new hd(s),_d(n,e)),n=e}}}var yd=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);vd(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function bd(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var xd=37297,Sd=0;function Cd(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var wd=new q;function Td(e){J._getMatrix(wd,J.workingColorSpace,e);let t=`mat3( ${wd.elements.map(e=>e.toFixed(4))} )`;switch(J.getTransfer(e)){case Kr:return[t,`LinearTransferOETF`];case qr:return[t,`sRGBTransferOETF`];default:return H(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function Ed(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Cd(e.getShaderSource(t),r)}return i}function Dd(e,t){let n=Td(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var Od={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function kd(e,t){let n=Od[t];return n===void 0?(H(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Ad=new K;function jd(){return J.getLuminanceCoefficients(Ad),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Ad.x.toFixed(4)}, ${Ad.y.toFixed(4)}, ${Ad.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Md(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Fd).join(`
`)}function Nd(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Pd(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Fd(e){return e!==``}function Id(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ld(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Rd=/^[ \t]*#include +<([\w\d./]+)>/gm;function zd(e){return e.replace(Rd,Vd)}var Bd=new Map;function Vd(e,t){let n=X[t];if(n===void 0){let e=Bd.get(t);if(e!==void 0)n=X[e],H(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return zd(n)}var Hd=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ud(e){return e.replace(Hd,Wd)}function Wd(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Gd(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}var Kd={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function qd(e){return Kd[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Jd={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Yd(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Jd[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var Xd={302:`ENVMAP_MODE_REFRACTION`};function Zd(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Xd[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Qd={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function $d(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Qd[e.combine]||`ENVMAP_BLENDING_NONE`}function ef(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function tf(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=qd(n),l=Yd(n),u=Zd(n),d=$d(n),f=ef(n),p=Md(n),m=Nd(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Fd).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(Fd).join(`
`),_.length>0&&(_+=`
`)):(g=[Gd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Fd).join(`
`),_=[Gd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:X.tonemapping_pars_fragment,n.toneMapping===0?``:kd(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,X.colorspace_pars_fragment,Dd(`linearToOutputTexel`,n.outputColorSpace),jd(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Fd).join(`
`)),o=zd(o),o=Id(o,n),o=Ld(o,n),s=zd(s),s=Id(s,n),s=Ld(s,n),o=Ud(o),s=Ud(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=bd(i,i.VERTEX_SHADER,y),S=bd(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=Ed(i,x,`vertex`),n=Ed(i,S,`fragment`);U(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):H(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new yd(i,h),T=Pd(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,xd)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Sd++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var nf=0,rf=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new af(e),t.set(e,n)),n}},af=class{constructor(e){this.id=nf++,this.code=e,this.usedTimes=0}};function of(e){return e===1030||e===37490||e===36285}function sf(e,t,n,r,i,a){let o=new ma,s=new rf,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&H(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=Dl[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),ee=e.state.buffers.depth.getReversed(),M=h.isInstancedMesh===!0,te=h.isBatchedMesh===!0,N=!!i.map,P=!!i.matcap,ne=!!x,re=!!i.aoMap,ie=!!i.lightMap,ae=!!i.bumpMap&&i.wireframe===!1,F=!!i.normalMap,oe=!!i.displacementMap,se=!!i.emissiveMap,ce=!!i.metalnessMap,le=!!i.roughnessMap,ue=i.anisotropy>0,de=i.clearcoat>0,fe=i.dispersion>0,pe=i.retroreflectivity>0,me=i.iridescence>0,he=i.sheen>0,ge=i.transmission>0,_e=ue&&!!i.anisotropyMap,ve=de&&!!i.clearcoatMap,ye=de&&!!i.clearcoatNormalMap,be=de&&!!i.clearcoatRoughnessMap,xe=me&&!!i.iridescenceMap,I=me&&!!i.iridescenceThicknessMap,Se=he&&!!i.sheenColorMap,Ce=he&&!!i.sheenRoughnessMap,we=!!i.specularMap,L=!!i.specularColorMap,Te=!!i.specularIntensityMap,R=ge&&!!i.transmissionMap,z=ge&&!!i.thicknessMap,Ee=!!i.gradientMap,De=!!i.alphaMap,Oe=i.alphaTest>0,ke=!!i.alphaHash,Ae=!!i.extensions,je=0;i.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(je=e.toneMapping);let Me={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:te,batchingColor:te&&h._colorsTexture!==null,instancing:M,instancingColor:M&&h.instanceColor!==null,instancingMorph:M&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:J.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:N,matcap:P,envMap:ne,envMapMode:ne&&x.mapping,envMapCubeUVHeight:S,aoMap:re,lightMap:ie,bumpMap:ae,normalMap:F,displacementMap:oe,emissiveMap:se,normalMapObjectSpace:F&&i.normalMapType===1,normalMapTangentSpace:F&&i.normalMapType===0,packedNormalMap:F&&i.normalMapType===0&&of(i.normalMap.format),metalnessMap:ce,roughnessMap:le,anisotropy:ue,anisotropyMap:_e,clearcoat:de,clearcoatMap:ve,clearcoatNormalMap:ye,clearcoatRoughnessMap:be,dispersion:fe,retroreflection:pe,iridescence:me,iridescenceMap:xe,iridescenceThicknessMap:I,sheen:he,sheenColorMap:Se,sheenRoughnessMap:Ce,specularMap:we,specularColorMap:L,specularIntensityMap:Te,transmission:ge,transmissionMap:R,thicknessMap:z,gradientMap:Ee,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:De,alphaTest:Oe,alphaHash:ke,combine:i.combine,mapUv:N&&m(i.map.channel),aoMapUv:re&&m(i.aoMap.channel),lightMapUv:ie&&m(i.lightMap.channel),bumpMapUv:ae&&m(i.bumpMap.channel),normalMapUv:F&&m(i.normalMap.channel),displacementMapUv:oe&&m(i.displacementMap.channel),emissiveMapUv:se&&m(i.emissiveMap.channel),metalnessMapUv:ce&&m(i.metalnessMap.channel),roughnessMapUv:le&&m(i.roughnessMap.channel),anisotropyMapUv:_e&&m(i.anisotropyMap.channel),clearcoatMapUv:ve&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:ye&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:xe&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:I&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:Se&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:Ce&&m(i.sheenRoughnessMap.channel),specularMapUv:we&&m(i.specularMap.channel),specularColorMapUv:L&&m(i.specularColorMap.channel),specularIntensityMapUv:Te&&m(i.specularIntensityMap.channel),transmissionMapUv:R&&m(i.transmissionMap.channel),thicknessMapUv:z&&m(i.thicknessMap.channel),alphaMapUv:De&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(F||ue),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(N||De),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&F===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ee,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:je,decodeVideoTexture:N&&i.map.isVideoTexture===!0&&J.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:se&&i.emissiveMap.isVideoTexture===!0&&J.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Ae&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Ae&&i.extensions.multiDraw===!0||te)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Me.vertexUv1s=c.has(1),Me.vertexUv2s=c.has(2),Me.vertexUv3s=c.has(3),c.clear(),Me}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=Dl[t];n=Qs.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new tf(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function cf(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function lf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function uf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function df(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||lf),r.length>1&&r.sort(t||uf),i.length>1&&i.sort(t||uf)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function ff(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new df,e.set(t,[i])):n>=r.length?(i=new df,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function pf(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new K,color:new Y};break;case`SpotLight`:n={position:new K,direction:new K,color:new Y,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new K,color:new Y,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new K,skyColor:new Y,groundColor:new Y};break;case`RectAreaLight`:n={color:new Y,position:new K,halfWidth:new K,halfHeight:new K}}return e[t.id]=n,n}}}function mf(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var hf=0;function gf(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function _f(e){let t=new pf,n=mf(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new K);let i=new K,a=new ra,o=new ra;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(gf);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Z.LTC_FLOAT_1,r.rectAreaLTC2=Z.LTC_FLOAT_2):(r.rectAreaLTC1=Z.LTC_HALF_1,r.rectAreaLTC2=Z.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=hf++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function vf(e){let t=new _f(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function yf(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new vf(e),t.set(n,[a])):r>=i.length?(a=new vf(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var bf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,xf=`uniform sampler2D shadow_pass;
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
}`,Sf=[new K(1,0,0),new K(-1,0,0),new K(0,1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1)],Cf=[new K(0,-1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1),new K(0,-1,0),new K(0,-1,0)],wf=new ra,Tf=new K,Ef=new K;function Df(e,t,n){let r=new zs,i=new G,a=new G,o=new Qi,s=new oc,c=new sc,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new tc({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new G},radius:{value:4}},vertexShader:bf,fragmentShader:xf}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Po;m.setAttribute(`position`,new yo(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new Cs(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(H(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){H(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){H(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new ea(i.x,i.y,{format:Zn,type:Rn,minFilter:On,magFilter:On,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Hs(i.x,i.y,Ln),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=qn,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=Tn,d.map.depthTexture.magFilter=Tn}else l.isPointLight?(d.map=new ru(i.x),d.map.depthTexture=new Us(i.x,In)):(d.map=new ea(i.x,i.y),d.map.depthTexture=new Hs(i.x,i.y,In)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=qn,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=On,d.map.depthTexture.magFilter=On):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=Tn,d.map.depthTexture.magFilter=Tn);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),Tf.setFromMatrixPosition(l.matrixWorld),e.position.copy(Tf),Ef.copy(e.position),Ef.add(Sf[t]),e.up.copy(Cf[t]),e.lookAt(Ef),e.updateMatrixWorld(),n.makeTranslation(-Tf.x,-Tf.y,-Tf.z),wf.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(wf,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new ea(i.x,i.y,{format:Zn,type:Rn}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Of(e,t){function n(){let t=!1,n=new Qi,r=null,i=new Qi(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?ce(e.DEPTH_TEST):le(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=si[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?ce(e.STENCIL_TEST):le(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Y(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,te=0,N=e.getParameter(e.VERSION);N.indexOf(`WebGL`)===-1?N.indexOf(`OpenGL ES`)!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),M=te>=2):(te=parseFloat(/^WebGL (\d)/.exec(N)[1]),M=te>=1);let P=null,ne={},re=e.getParameter(e.SCISSOR_BOX),ie=e.getParameter(e.VIEWPORT),ae=new Qi().fromArray(re),F=new Qi().fromArray(ie);function oe(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let se={};se[e.TEXTURE_2D]=oe(e.TEXTURE_2D,e.TEXTURE_2D,1),se[e.TEXTURE_CUBE_MAP]=oe(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),se[e.TEXTURE_2D_ARRAY]=oe(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),se[e.TEXTURE_3D]=oe(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),ce(e.DEPTH_TEST),o.setFunc(3),_e(!1),ve(1),ce(e.CULL_FACE),he(0);function ce(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function le(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ue(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function de(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function fe(t){return h!==t&&(e.useProgram(t),h=t,!0)}let pe={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};pe[103]=e.MIN,pe[104]=e.MAX;let me={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function he(t,n,r,i,a,o,s,c,l,u){if(t===0){g===!0&&(le(e.BLEND),g=!1);return}if(g===!1&&(ce(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:U(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:U(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:U(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:U(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}return}a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(pe[n],pe[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(me[r],me[i],me[o],me[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function ge(t,n){t.side===2?le(e.CULL_FACE):ce(e.CULL_FACE);let r=t.side===1;n&&(r=!r),_e(r),t.blending===1&&t.transparent===!1?he(0):he(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),be(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?ce(e.SAMPLE_ALPHA_TO_COVERAGE):le(e.SAMPLE_ALPHA_TO_COVERAGE)}function _e(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ve(t){t===0?le(e.CULL_FACE):(ce(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function ye(t){t!==k&&(M&&e.lineWidth(t),k=t)}function be(t,n,r){t?(ce(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):le(e.POLYGON_OFFSET_FILL)}function xe(t){t?ce(e.SCISSOR_TEST):le(e.SCISSOR_TEST)}function I(t){t===void 0&&(t=e.TEXTURE0+ee-1),P!==t&&(e.activeTexture(t),P=t)}function Se(t,n,r){r===void 0&&(r=P===null?e.TEXTURE0+ee-1:P);let i=ne[r];i===void 0&&(i={type:void 0,texture:void 0},ne[r]=i),(i.type!==t||i.texture!==n)&&(P!==r&&(e.activeTexture(r),P=r),e.bindTexture(t,n||se[t]),i.type=t,i.texture=n)}function Ce(){let t=ne[P];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function we(){try{e.compressedTexImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function L(){try{e.compressedTexImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Te(){try{e.texSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function R(){try{e.texSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function z(){try{e.compressedTexSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ee(){try{e.compressedTexSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function De(){try{e.texStorage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Oe(){try{e.texStorage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function ke(){try{e.texImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ae(){try{e.texImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function je(t){return d[t]===void 0?e.getParameter(t):d[t]}function Me(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Ne(t){ae.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ae.copy(t))}function B(t){F.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),F.copy(t))}function Pe(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function Fe(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Ie(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},P=null,ne={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Y(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ae.set(0,0,e.canvas.width,e.canvas.height),F.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:ce,disable:le,bindFramebuffer:ue,drawBuffers:de,useProgram:fe,setBlending:he,setMaterial:ge,setFlipSided:_e,setCullFace:ve,setLineWidth:ye,setPolygonOffset:be,setScissorTest:xe,activeTexture:I,bindTexture:Se,unbindTexture:Ce,compressedTexImage2D:we,compressedTexImage3D:L,texImage2D:ke,texImage3D:Ae,pixelStorei:Me,getParameter:je,updateUBOMapping:Pe,uniformBlockBinding:Fe,texStorage2D:De,texStorage3D:Oe,texSubImage2D:Te,texSubImage3D:R,compressedTexSubImage2D:z,compressedTexSubImage3D:Ee,scissor:Ne,viewport:B,reset:Ie}}function kf(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new G,u=new WeakMap,d=new Set,f,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function h(e,t){return m?new OffscreenCanvas(e,t):ei(`canvas`)}function g(e,t,n){let r=1,i=we(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=h(n,a));let o=t?h(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),H(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&H(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function _(e){return e.generateMipmaps}function v(t){e.generateMipmap(t)}function y(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function b(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];H(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||H(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?Kr:J.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function x(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,H(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function S(e,t){return _(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function C(e){let t=e.target;t.removeEventListener(`dispose`,C),T(t),t.isVideoTexture&&u.delete(t),t.isHTMLTexture&&d.delete(t)}function w(e){let t=e.target;t.removeEventListener(`dispose`,w),D(t)}function T(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&E(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function E(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function D(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let O=0;function k(){O=0}function A(){return O}function j(e){O=e}function ee(){let e=O;return e>=i.maxTextures&&H(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),O+=1,e}function M(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function te(t,i){let a=r.get(t);if(t.isVideoTexture&&Se(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)H(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)H(`WebGLRenderer: Texture marked for update but image is incomplete`);else{le(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function N(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){le(a,t,i);return}t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i)}function P(t,i){let a=r.get(t);if(t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){le(a,t,i);return}n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function ne(t,i){let a=r.get(t);if(t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version){ue(a,t,i);return}n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let re={[Sn]:e.REPEAT,[Cn]:e.CLAMP_TO_EDGE,[wn]:e.MIRRORED_REPEAT},ie={[Tn]:e.NEAREST,[En]:e.NEAREST_MIPMAP_NEAREST,[Dn]:e.NEAREST_MIPMAP_LINEAR,[On]:e.LINEAR,[kn]:e.LINEAR_MIPMAP_NEAREST,[An]:e.LINEAR_MIPMAP_LINEAR},ae={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function F(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&H(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,re[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,re[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,re[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ie[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ie[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,ae[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function oe(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,C));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=M(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&E(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function se(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ce(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=se(n.start,r.width,4),c=se(t.start,r.width,4);n.start<=i+1&&a===c&&se(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function le(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=oe(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=J.getPrimaries(J.workingColorSpace),r=o.colorSpace===``?null:J.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=g(o.image,!1,i.maxTextureSize);t=Ce(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=b(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);F(c,o);let h,y=o.mipmaps,C=o.isVideoTexture!==!0,w=f.__version===void 0||l===!0,T=u.dataReady,E=S(o,t);if(o.isDepthTexture)m=x(o.format===Jn,o.type),w&&(C?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(y.length>0){C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else C?(w&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&ce(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){C&&w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,y[0].width,y[0].height,t.depth);for(let i=0,a=y.length;i<a;i++)if(h=y[i],o.format!==1023){if(r!==null){if(C){if(T){if(o.layerUpdates.size>0){let t=Cl(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else C?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(C){if(w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=Cl(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)C?(w&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(w){if(C)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(y.length>0){if(C&&w){let t=we(y[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(C){if(w){let r=we(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);_(o)&&v(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ue(t,o,s){if(o.image.length!==6)return;let c=oe(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=J.getPrimaries(J.workingColorSpace),r=o.colorSpace===``?null:J.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=g(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Ce(o,m[e]);let h=m[0],y=a.convert(o.format,o.colorSpace),x=a.convert(o.type),C=b(o.internalFormat,y,x,o.normalized,o.colorSpace),w=o.isVideoTexture!==!0,T=u.__version===void 0||c===!0,E=l.dataReady,D=S(o,h);F(e.TEXTURE_CUBE_MAP,o);let O;if(f){w&&T&&n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,h.width,h.height);for(let t=0;t<6;t++){O=m[t].mipmaps;for(let r=0;r<O.length;r++){let i=O[r];o.format===1023?w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,y,x,i.data):y===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):w?E&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,i.data)}}}else{if(O=o.mipmaps,w&&T){O.length>0&&D++;let t=we(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,t.width,t.height)}for(let t=0;t<6;t++)if(p){w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,y,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,m[t].width,m[t].height,0,y,x,m[t].data);for(let r=0;r<O.length;r++){let i=O[r].image[t].image;w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,i.width,i.height,0,y,x,i.data)}}else{w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,y,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,y,x,m[t]);for(let r=0;r<O.length;r++){let i=O[r];w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,y,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,y,x,i.image[t])}}}_(o)&&v(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function de(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=b(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),I(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,xe(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function fe(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=x(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;I(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,xe(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,xe(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=b(o.internalFormat,c,l,o.normalized,o.colorSpace);I(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,xe(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,xe(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function pe(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,(!l.__webglTexture||i.depthTexture.image.width!==i.width||i.depthTexture.image.height!==i.height)&&(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,C)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),F(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else te(i.depthTexture,0);let u=l.__webglTexture,d=xe(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)I(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)I(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function me(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)pe(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?pe(i.__webglFramebuffer[0],t,0):pe(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),fe(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),fe(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function he(t,n,i){let a=r.get(t);n!==void 0&&de(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&me(t)}function ge(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,w);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&I(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=b(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=xe(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),fe(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),F(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)de(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else de(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);_(i)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),F(c,a),de(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),_(a)&&v(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),F(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)de(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else de(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);_(i)&&v(r),n.unbindTexture()}t.depthBuffer&&me(t)}function _e(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(_(a)){let t=y(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),v(t),n.unbindTexture()}}}let ve=[],ye=[];function be(t){if(t.samples>0){if(I(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(ve.length=0,ye.length=0,ve.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(ve.push(l),ye.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,ye)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,ve))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function xe(e){return Math.min(i.maxSamples,e.samples)}function I(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Se(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function Ce(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(J.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&H(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):U(`WebGLTextures: Unsupported texture color space:`,n)),t}function we(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=ee,this.resetTextureUnits=k,this.getTextureUnits=A,this.setTextureUnits=j,this.setTexture2D=te,this.setTexture2DArray=N,this.setTexture3D=P,this.setTextureCube=ne,this.rebindTextures=he,this.setupRenderTarget=ge,this.updateRenderTargetMipmap=_e,this.updateMultisampleRenderTarget=be,this.setupDepthRenderbuffer=me,this.setupFrameBufferTexture=de,this.useMultisampledRTT=I,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function Af(e,t){function n(n,r=``){let i,a=J.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var jf=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Mf=`
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

}`,Nf=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Ws(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new tc({vertexShader:jf,fragmentShader:Mf,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Cs(new Ks(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Pf=class extends ci{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new Nf,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new G,C=null,w=null,T=new qc;T.viewport=new Qi;let E=new qc;E.viewport=new Qi;let D=[T,E],O=new nl,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Na,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Na,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Na,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,F.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?Jn:qn,a=_.stencil?Vn:In);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new ea(d.textureWidth,d.textureHeight,{format:Kn,type:jn,depthTexture:new Hs(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new ea(f.framebufferWidth,f.framebufferHeight,{format:Kn,type:jn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),F.setContext(r),F.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}let te=new K,N=new K;function P(e,t,n){te.setFromMatrixPosition(t.matrixWorld),N.setFromMatrixPosition(n.matrixWorld);let r=te.distanceTo(N),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function ne(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;ne(O,i);for(let e=0;e<a.length;e++)ne(a[e],i);a.length===2?P(O,T,E):O.projectionMatrix.copy(T.projectionMatrix),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),re(e,O,i)};function re(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=fi*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ie=null;function ae(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new qc,o.layers.enable(n),o.viewport=new Qi,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new Ws,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ie&&ie(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let F=new Tl;F.setAnimationLoop(ae),this.setAnimationLoop=function(e){ie=e},this.dispose=function(){}}},Ff=new ra,If=new q;If.set(-1,0,0,0,1,0,0,0,1);function Lf(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Zs(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Ff.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(If),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Rf(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return U(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?H(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):H(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var zf=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Bf=null;function Vf(){return Bf===null&&(Bf=new Es(zf,16,16,Zn,Rn),Bf.name=`DFG_LUT`,Bf.minFilter=On,Bf.magFilter=On,Bf.wrapS=Cn,Bf.wrapT=Cn,Bf.generateMipmaps=!1,Bf.needsUpdate=!0),Bf}var Hf=class{constructor(e={}){let{canvas:t=ti(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=jn}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([$n,Qn,Xn]),g=new Set([jn,In,Pn,Vn,zn,Bn]),_=new Uint32Array(4),v=new Int32Array(4),y=new K,b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=Wr;let j=0,ee=0,M=null,te=-1,N=null,P=new Qi,ne=new Qi,re=null,ie=new Y(0),ae=0,F=t.width,oe=t.height,se=1,ce=null,le=null,ue=new Qi(0,0,F,oe),de=new Qi(0,0,F,oe),fe=!1,pe=new zs,me=!1,he=!1,ge=new ra,_e=new K,ve=new Qi,ye={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},be=!1;function xe(){return M===null?se:1}let I=n;function Se(e,n){return t.getContext(e,n)}let Ce,we,L,Te,R,z,Ee,De,Oe,ke,Ae,je,Me,Ne,B,Pe,Fe,Ie,Le,Re,ze,Be,Ve;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,We,!1),t.addEventListener(`webglcontextrestored`,Ge,!1),t.addEventListener(`webglcontextcreationerror`,Ke,!1),I===null){let t=`webgl2`;if(I=Se(t,e),I===null)throw Se(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}He()}catch(e){throw t.removeEventListener(`webglcontextlost`,We,!1),t.removeEventListener(`webglcontextrestored`,Ge,!1),t.removeEventListener(`webglcontextcreationerror`,Ke,!1),U(`WebGLRenderer: `+e.message),e}function He(){Ce=new au(I),Ce.init(),ze=new Af(I,Ce),we=new Pl(I,Ce,e,ze),L=new Of(I,Ce),we.reversedDepthBuffer&&d&&L.buffers.depth.setReversed(!0),O=I.createFramebuffer(),k=I.createFramebuffer(),A=I.createFramebuffer(),Te=new cu(I),R=new cf,z=new kf(I,Ce,L,R,we,ze,Te),Ee=new iu(T),De=new El(I),Be=new Ml(I,De),Oe=new ou(I,De,Te,Be),ke=new uu(I,Oe,De,Be,Te),Ie=new lu(I,we,z),B=new Fl(R),Ae=new sf(T,Ee,Ce,we,Be,B),je=new Lf(T,R),Me=new ff,Ne=new yf(Ce),Fe=new jl(T,Ee,L,ke,p,s),Pe=new Df(T,ke,we),Ve=new Rf(I,Te,we,L),Le=new Nl(I,Ce,Te),Re=new su(I,Ce,Te),Te.programs=Ae.programs,T.capabilities=we,T.extensions=Ce,T.properties=R,T.renderLists=Me,T.shadowMap=Pe,T.state=L,T.info=Te}m!==1009&&(w=new fu(m,t.width,t.height,o,r,i));let Ue=new Pf(T,I);this.xr=Ue,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){let e=Ce.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=Ce.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return se},this.setPixelRatio=function(e){e!==void 0&&(se=e,this.setSize(F,oe,!1))},this.getSize=function(e){return e.set(F,oe)},this.setSize=function(e,n,r=!0){if(Ue.isPresenting){H(`WebGLRenderer: Can't change size while VR device is presenting.`);return}F=e,oe=n,t.width=Math.floor(e*se),t.height=Math.floor(n*se),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n)},this.getDrawingBufferSize=function(e){return e.set(F*se,oe*se).floor()},this.setDrawingBufferSize=function(e,n,r){F=e,oe=n,se=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009){U(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);return}if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){H(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])},this.getCurrentViewport=function(e){return e.copy(P)},this.getViewport=function(e){return e.copy(ue)},this.setViewport=function(e,t,n,r){e.isVector4?ue.set(e.x,e.y,e.z,e.w):ue.set(e,t,n,r),L.viewport(P.copy(ue).multiplyScalar(se).round())},this.getScissor=function(e){return e.copy(de)},this.setScissor=function(e,t,n,r){e.isVector4?de.set(e.x,e.y,e.z,e.w):de.set(e,t,n,r),L.scissor(ne.copy(de).multiplyScalar(se).round())},this.getScissorTest=function(){return fe},this.setScissorTest=function(e){L.setScissorTest(fe=e)},this.setOpaqueSort=function(e){ce=e},this.setTransparentSort=function(e){le=e},this.getClearColor=function(e){return e.copy(Fe.getClearColor())},this.setClearColor=function(){Fe.setClearColor(...arguments)},this.getClearAlpha=function(){return Fe.getClearAlpha()},this.setClearAlpha=function(){Fe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(M!==null){let t=M.texture.format;e=h.has(t)}if(e){let e=M.texture.type,t=g.has(e),n=Fe.getClearColor(),r=Fe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,I.clearBufferuiv(I.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,I.clearBufferiv(I.COLOR,0,v))}else r|=I.COLOR_BUFFER_BIT}t&&(r|=I.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&I.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,We,!1),t.removeEventListener(`webglcontextrestored`,Ge,!1),t.removeEventListener(`webglcontextcreationerror`,Ke,!1),Fe.dispose(),Me.dispose(),Ne.dispose(),R.dispose(),Ee.dispose(),ke.dispose(),Be.dispose(),Ve.dispose(),Ae.dispose(),Ue.dispose(),Ue.removeEventListener(`sessionstart`,$e),Ue.removeEventListener(`sessionend`,et),tt.stop()};function We(e){e.preventDefault(),ri(`WebGLRenderer: Context Lost.`),E=!0}function Ge(){ri(`WebGLRenderer: Context Restored.`),E=!1;let e=Te.autoReset,t=Pe.enabled,n=Pe.autoUpdate,r=Pe.needsUpdate,i=Pe.type;He(),Te.autoReset=e,Pe.enabled=t,Pe.autoUpdate=n,Pe.needsUpdate=r,Pe.type=i}function Ke(e){U(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function qe(e){let t=e.target;t.removeEventListener(`dispose`,qe),Je(t)}function Je(e){Ye(e),R.remove(e)}function Ye(e){let t=R.get(e).programs;t!==void 0&&(t.forEach(function(e){Ae.releaseProgram(e)}),e.isShaderMaterial&&Ae.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ye);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=dt(e,t,n,r,i);L.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Oe.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Be.setup(i,r,s,n,c);let h,g=Le;if(c!==null&&(h=De.get(c),g=Re,g.setIndex(h)),i.isMesh)r.wireframe===!0?(L.setLineWidth(r.wireframeLinewidth*xe()),g.setMode(I.LINES)):g.setMode(I.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),L.setLineWidth(e*xe()),i.isLineSegments?g.setMode(I.LINES):i.isLineLoop?g.setMode(I.LINE_LOOP):g.setMode(I.LINE_STRIP)}else i.isPoints?g.setMode(I.POINTS):i.isSprite&&g.setMode(I.TRIANGLES);if(i.isBatchedMesh){if(Ce.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?De.get(c).bytesPerElement:1,o=R.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(I,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function Xe(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),me===!0&&B.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,st(e,t,r),e.side=0,e.needsUpdate=!0,st(e,t,r),e.side=2):st(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Ne.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),he=this.localClippingEnabled,me=B.init(this.clippingPlanes,he),me===!0&&B.setGlobalState(this.clippingPlanes,t),D!==null&&Pe.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];Xe(o,n,t,e),r.add(o)}else Xe(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){if(r.forEach(function(e){let t=R.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0){t(e);return}setTimeout(n,10)}Ce.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Ze=null;function Qe(e){Ze&&Ze(e)}function $e(){tt.stop()}function et(){tt.start()}let tt=new Tl;tt.setAnimationLoop(Qe),typeof self<`u`&&tt.setContext(self),this.setAnimationLoop=function(e){Ze=e,Ue.setAnimationLoop(e),e===null?tt.stop():tt.start()},Ue.addEventListener(`sessionstart`,$e),Ue.addEventListener(`sessionend`,et),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){U(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=Ue.enabled===!0&&Ue.isPresenting===!0,r=w!==null&&(M===null||n)&&w.begin(T,M);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Ue.enabled===!0&&Ue.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Ue.cameraAutoUpdate===!0&&Ue.updateCamera(t),t=Ue.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,M),x=Ne.get(e,C.length),x.init(t),x.state.textureUnits=z.getTextureUnits(),C.push(x),ge.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),pe.setFromProjectionMatrix(ge,Zr,t.reversedDepth),he=this.localClippingEnabled,me=B.init(this.clippingPlanes,he),b=Me.get(e,S.length),b.init(),S.push(b),Ue.enabled===!0&&Ue.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&nt(e,t,-1/0,T.sortObjects)}nt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(ce,le),be=Ue.enabled===!1||Ue.isPresenting===!1||Ue.hasDepthSensing()===!1,be&&Fe.addToRenderList(b,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),me===!0&&B.beginShadows();let i=x.state.shadowsArray;if(Pe.render(i,e,t),me===!0&&B.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];it(n,r,e,a)}be&&Fe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];rt(b,e,n,n.viewport)}}else r.length>0&&it(n,r,e,t),be&&Fe.render(e),rt(b,e,t)}M!==null&&ee===0&&(z.updateMultisampleRenderTarget(M),z.updateRenderTargetMipmap(M)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Be.resetDefaultState(),te=-1,N=null,C.pop(),C.length>0?(x=C[C.length-1],z.setTextureUnits(x.state.textureUnits),me===!0&&B.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function nt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)x.pushLightProbeGrid(e);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(pe)){r&&ve.setFromMatrixPosition(e.matrixWorld).applyMatrix4(ge);let i=ke.update(e),a=e.material;a.visible&&b.push(e,i,a,n,ve.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(pe))){let i=ke.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),ve.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),ve.copy(e.boundingSphere.center)),ve.applyMatrix4(e.matrixWorld).applyMatrix4(ge)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,ve.z,s,t)}}else a.visible&&b.push(e,i,a,n,ve.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)nt(i[e],t,n,r)}function rt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),me===!0&&B.setGlobalState(T.clippingPlanes,n),r&&L.viewport(P.copy(r)),i.length>0&&at(i,t,n),a.length>0&&at(a,t,n),o.length>0&&at(o,t,n),L.buffers.depth.setTest(!0),L.buffers.depth.setMask(!0),L.buffers.color.setMask(!0),L.setPolygonOffset(!1)}function it(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=Ce.has(`EXT_color_buffer_half_float`)||Ce.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new ea(1,1,{generateMipmaps:!0,type:e?Rn:jn,minFilter:An,samples:Math.max(4,we.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:J.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||P;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(ie),ae=T.getClearAlpha(),ae<1&&T.setClearColor(16777215,.5),T.clear(),be&&Fe.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),me===!0&&B.setGlobalState(T.clippingPlanes,r),at(e,n,r),z.updateMultisampleRenderTarget(a),z.updateRenderTargetMipmap(a),Ce.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,ot(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(z.updateMultisampleRenderTarget(a),z.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(ie,ae),d!==void 0&&(r.viewport=d),T.toneMapping=u}function at(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&ot(o,t,n,s,l,c)}}function ot(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function st(e,t,n){t.isScene!==!0&&(t=ye);let r=R.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Ae.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Ae.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Ee.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,qe),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return lt(e,s),d}else s.uniforms=Ae.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Ae.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=B.uniform),lt(e,s),r.needsLights=pt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=x.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function ct(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=yd.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function lt(e,t){let n=R.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function ut(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];y.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(y))return n}return null}function dt(e,t,n,r,i){t.isScene!==!0&&(t=ye),z.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=M===null?T.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:J.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Ee.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=R.get(r),y=x.state.lights;if(me===!0&&(he===!0||e!==N)){let t=e===N&&r.id===te;B.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==B.numPlanes||v.numIntersection!==B.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=x.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;b===!0&&(S=st(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,S,v));let C=!1,w=!1,E=!1,O=S.getUniforms(),k=v.uniforms;if(L.useProgram(S.program)&&(C=!0,w=!0,E=!0),r.id!==te&&(te=r.id,w=!0),v.needsLights){let e=ut(x.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,w=!0)}if(C||N!==e){L.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),O.setValue(I,`projectionMatrix`,e.projectionMatrix),O.setValue(I,`viewMatrix`,e.matrixWorldInverse);let t=O.map.cameraPosition;t!==void 0&&t.setValue(I,_e.setFromMatrixPosition(e.matrixWorld)),we.logarithmicDepthBuffer&&O.setValue(I,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&O.setValue(I,`isOrthographic`,e.isOrthographicCamera===!0),N!==e&&(N=e,w=!0,E=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&O.setValue(I,`sunShadowMap`,y.state.sunShadowMap,z),y.state.directionalShadowMap.length>0&&O.setValue(I,`directionalShadowMap`,y.state.directionalShadowMap,z),y.state.spotShadowMap.length>0&&O.setValue(I,`spotShadowMap`,y.state.spotShadowMap,z),y.state.pointShadowMap.length>0&&O.setValue(I,`pointShadowMap`,y.state.pointShadowMap,z)),i.isSkinnedMesh){O.setOptional(I,i,`bindMatrix`),O.setOptional(I,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),O.setValue(I,`boneTexture`,e.boneTexture,z))}i.isBatchedMesh&&(O.setOptional(I,i,`batchingTexture`),O.setValue(I,`batchingTexture`,i._matricesTexture,z),O.setOptional(I,i,`batchingIdTexture`),O.setValue(I,`batchingIdTexture`,i._indirectTexture,z),O.setOptional(I,i,`batchingColorTexture`),i._colorsTexture!==null&&O.setValue(I,`batchingColorTexture`,i._colorsTexture,z));let A=n.morphAttributes;if((A.position!==void 0||A.normal!==void 0||A.color!==void 0)&&Ie.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,O.setValue(I,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=Vf()),w){if(O.setValue(I,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&ft(k,E),a&&r.fog===!0&&je.refreshFogUniforms(k,a),je.refreshMaterialUniforms(k,r,se,oe,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}yd.upload(I,ct(v),k,z)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(yd.upload(I,ct(v),k,z),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&O.setValue(I,`center`,i.center),O.setValue(I,`modelViewMatrix`,i.modelViewMatrix),O.setValue(I,`normalMatrix`,i.normalMatrix),O.setValue(I,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Ve.update(n,S),Ve.bind(n,S)}}return S}function ft(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function pt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(e,t,n){let r=R.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),R.get(e.texture).__webglTexture=t,R.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=R.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){M=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=R.get(e);if(o.__useDefaultFramebuffer!==void 0){L.bindFramebuffer(I.FRAMEBUFFER,o.__webglFramebuffer),P.copy(e.viewport),ne.copy(e.scissor),re=e.scissorTest,L.viewport(P),L.scissor(ne),L.setScissorTest(re),te=-1;return}if(o.__webglFramebuffer===void 0)z.setupRenderTarget(e);else if(o.__hasExternalTextures)z.rebindTextures(e,R.get(e.texture).__webglTexture,R.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&R.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);z.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=R.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&z.useMultisampledRTT(e)===!1?R.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,P.copy(e.viewport),ne.copy(e.scissor),re=e.scissorTest}else P.copy(ue).multiplyScalar(se).floor(),ne.copy(de).multiplyScalar(se).floor(),re=fe;if(n!==0&&(r=O),L.bindFramebuffer(I.FRAMEBUFFER,r)&&L.drawBuffers(e,r),L.viewport(P),L.scissor(ne),L.setScissorTest(re),i){let r=R.get(e.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=R.get(e.textures[t]);I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=R.get(e.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,t.__webglTexture,n)}te=-1};function mt(e){let t=R.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=we.textureFormatReadable(e.format),t.__typeReadable=we.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=R.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){L.bindFramebuffer(I.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+s);let u=mt(o);if(u.__formatReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&I.readPixels(t,n,r,i,ze.convert(c),ze.convert(l),a)}finally{let e=M===null?null:R.get(M).__webglFramebuffer;L.bindFramebuffer(I.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=R.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){L.bindFramebuffer(I.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&I.readBuffer(I.COLOR_ATTACHMENT0+s);let d=mt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,f),I.bufferData(I.PIXEL_PACK_BUFFER,a.byteLength,I.STREAM_READ),I.readPixels(t,n,r,i,ze.convert(l),ze.convert(u),0),I.bindBuffer(I.PIXEL_PACK_BUFFER,null);let p=M===null?null:R.get(M).__webglFramebuffer;L.bindFramebuffer(I.FRAMEBUFFER,p);let m=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await oi(I,m,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,f),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,a),I.bindBuffer(I.PIXEL_PACK_BUFFER,null),I.deleteBuffer(f),I.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;z.setTexture2D(e,0),I.copyTexSubImage2D(I.TEXTURE_2D,n,0,0,o,s,i,a),L.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=ze.convert(t.format),_=ze.convert(t.type),v;t.isData3DTexture?(z.setTexture3D(t,0),v=I.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(z.setTexture2DArray(t,0),v=I.TEXTURE_2D_ARRAY):(z.setTexture2D(t,0),v=I.TEXTURE_2D),L.activeTexture(I.TEXTURE0),L.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,t.flipY),L.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),L.pixelStorei(I.UNPACK_ALIGNMENT,t.unpackAlignment);let y=L.getParameter(I.UNPACK_ROW_LENGTH),b=L.getParameter(I.UNPACK_IMAGE_HEIGHT),x=L.getParameter(I.UNPACK_SKIP_PIXELS),S=L.getParameter(I.UNPACK_SKIP_ROWS),C=L.getParameter(I.UNPACK_SKIP_IMAGES);L.pixelStorei(I.UNPACK_ROW_LENGTH,h.width),L.pixelStorei(I.UNPACK_IMAGE_HEIGHT,h.height),L.pixelStorei(I.UNPACK_SKIP_PIXELS,l),L.pixelStorei(I.UNPACK_SKIP_ROWS,u),L.pixelStorei(I.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=R.get(e),r=R.get(t),h=R.get(n.__renderTarget),g=R.get(r.__renderTarget);L.bindFramebuffer(I.READ_FRAMEBUFFER,h.__webglFramebuffer),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,R.get(e).__webglTexture,i,d+n),I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,R.get(t).__webglTexture,a,m+n)),I.blitFramebuffer(l,u,o,s,f,p,o,s,I.DEPTH_BUFFER_BIT,I.NEAREST);L.bindFramebuffer(I.READ_FRAMEBUFFER,null),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||R.has(e)){let n=R.get(e),r=R.get(t);L.bindFramebuffer(I.READ_FRAMEBUFFER,k),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):I.framebufferTexture2D(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,n.__webglTexture,i),T?I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):I.framebufferTexture2D(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_2D,r.__webglTexture,a),i===0?T?I.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):I.copyTexSubImage2D(v,a,f,p,l,u,o,s):I.blitFramebuffer(l,u,o,s,f,p,o,s,I.COLOR_BUFFER_BIT,I.NEAREST);L.bindFramebuffer(I.READ_FRAMEBUFFER,null),L.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?I.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?I.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):I.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):I.texSubImage2D(I.TEXTURE_2D,a,f,p,o,s,g,_,h);L.pixelStorei(I.UNPACK_ROW_LENGTH,y),L.pixelStorei(I.UNPACK_IMAGE_HEIGHT,b),L.pixelStorei(I.UNPACK_SKIP_PIXELS,x),L.pixelStorei(I.UNPACK_SKIP_ROWS,S),L.pixelStorei(I.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&I.generateMipmap(v),L.unbindTexture()},this.initRenderTarget=function(e){R.get(e).__webglFramebuffer===void 0&&z.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?z.setTextureCube(e,0):e.isData3DTexture?z.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?z.setTexture2DArray(e,0):z.setTexture2D(e,0),L.unbindTexture()},this.resetState=function(){j=0,ee=0,M=null,L.reset(),Be.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return Zr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=J._getDrawingBufferColorSpace(e),t.unpackColorSpace=J._getUnpackColorSpace()}},Uf={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`},Wf=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Gf=new Xc(-1,1,1,-1,0,1),Kf=new class extends Po{constructor(){super(),this.setAttribute(`position`,new So([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new So([0,2,0,0,2,0],2))}},qf=class{constructor(e){this._mesh=new Cs(Kf,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Gf)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Jf=class extends Wf{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof tc?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Qs.clone(e.uniforms),this.material=new tc({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new qf(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Yf=class extends Wf{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Xf=class extends Wf{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},Zf=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new G);this._width=n.width,this._height=n.height,t=new ea(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Rn}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Jf(Uf),this.copyPass.material.blending=0,this.timer=new rl}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}Yf!==void 0&&(r instanceof Yf?n=!0:r instanceof Xf&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new G);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Qf={type:`change`},$f={type:`start`},ep={type:`end`},tp=new us,np=new Vo,rp=Math.cos(70*Pi.DEG2RAD),ip=new K,ap=2*Math.PI,op={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},sp=1e-6,cp=class extends Sl{constructor(e,t=null){super(e,t),this.state=op.NONE,this.target=new K,this.cursor=new K,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`},this.mouseButtons={LEFT:bn.ROTATE,MIDDLE:bn.DOLLY,RIGHT:bn.PAN},this.touches={ONE:xn.ROTATE,TWO:xn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle=`auto`,this._domElementKeyEvents=null,this._lastPosition=new K,this._lastQuaternion=new Fi,this._lastTargetPosition=new K,this._quat=new Fi().setFromUnitVectors(e.up,new K(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new xl,this._sphericalDelta=new xl,this._scale=1,this._panOffset=new K,this._rotateStart=new G,this._rotateEnd=new G,this._rotateDelta=new G,this._panStart=new G,this._panEnd=new G,this._panDelta=new G,this._dollyStart=new G,this._dollyEnd=new G,this._dollyDelta=new G,this._dollyDirection=new K,this._mouse=new G,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=up.bind(this),this._onPointerDown=lp.bind(this),this._onPointerUp=dp.bind(this),this._onContextMenu=vp.bind(this),this._onMouseWheel=mp.bind(this),this._onKeyDown=hp.bind(this),this._onTouchStart=gp.bind(this),this._onTouchMove=_p.bind(this),this._onMouseDown=fp.bind(this),this._onMouseMove=pp.bind(this),this._interceptControlDown=yp.bind(this),this._interceptControlUp=bp.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e===`grab`?this.domElement.style.cursor=`grab`:this.domElement.style.cursor=`auto`}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener(`pointerdown`,this._onPointerDown),this.domElement.addEventListener(`pointercancel`,this._onPointerUp),this.domElement.addEventListener(`contextmenu`,this._onContextMenu),this.domElement.addEventListener(`wheel`,this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener(`keydown`,this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction=`none`}disconnect(){this.state=op.NONE,this.domElement.removeEventListener(`pointerdown`,this._onPointerDown),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.domElement.removeEventListener(`pointercancel`,this._onPointerUp),this.domElement.removeEventListener(`wheel`,this._onMouseWheel),this.domElement.removeEventListener(`contextmenu`,this._onContextMenu),this.stopListenToKeyEvents();let e=this.domElement.getRootNode();e.removeEventListener(`keydown`,this._interceptControlDown,{capture:!0}),e.removeEventListener(`keyup`,this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction=``,this.domElement.style.cursor=`auto`}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener(`keydown`,this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Qf),this.update(),this.state=op.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;ip.copy(t).sub(this.target),ip.applyQuaternion(this._quat),this._spherical.setFromVector3(ip),this.autoRotate&&this.state===op.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=ap:n>Math.PI&&(n-=ap),r<-Math.PI?r+=ap:r>Math.PI&&(r-=ap),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let i=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let e=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),i=e!=this._spherical.radius}if(ip.setFromSpherical(this._spherical),ip.applyQuaternion(this._quatInverse),t.copy(this.target).add(ip),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let e=null;if(this.object.isPerspectiveCamera){let t=ip.length();e=this._clampDistance(t*this._scale);let n=t-e;this.object.position.addScaledVector(this._dollyDirection,n),this.object.updateMatrixWorld(),i=!!n}else if(this.object.isOrthographicCamera){let t=new K(this._mouse.x,this._mouse.y,0);t.unproject(this.object);let n=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),i=n!==this.object.zoom;let r=new K(this._mouse.x,this._mouse.y,0);r.unproject(this.object),this.object.position.sub(r).add(t),this.object.updateMatrixWorld(),e=ip.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),this.zoomToCursor=!1;e!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(e).add(this.object.position):(tp.origin.copy(this.object.position),tp.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(tp.direction))<rp?this.object.lookAt(this.target):(np.setFromNormalAndCoplanarPoint(this.object.up,this.target),tp.intersectPlane(np,this.target))))}else if(this.object.isOrthographicCamera){let e=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),e!==this.object.zoom&&(this.object.updateProjectionMatrix(),i=!0)}return this._scale=1,this._performCursorZoom=!1,i||this._lastPosition.distanceToSquared(this.object.position)>sp||8*(1-this._lastQuaternion.dot(this.object.quaternion))>sp||this._lastTargetPosition.distanceToSquared(this.target)>sp?(this.dispatchEvent(Qf),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e===null?ap/60/60*this.autoRotateSpeed:ap/60*this.autoRotateSpeed*e}_getZoomScale(e){let t=Math.abs(e*.01);return .95**(this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){ip.setFromMatrixColumn(t,0),ip.multiplyScalar(-e),this._panOffset.add(ip)}_panUp(e,t){this.screenSpacePanning===!0?ip.setFromMatrixColumn(t,1):(ip.setFromMatrixColumn(t,0),ip.crossVectors(this.object.up,ip)),ip.multiplyScalar(e),this._panOffset.add(ip)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;ip.copy(r).sub(this.target);let i=ip.length();i*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*i/n.clientHeight,this.object.matrix),this._panUp(2*t*i/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,i=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(i/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ap*this._rotateDelta.x/t.clientHeight),this._rotateUp(ap*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(ap*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-ap*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(ap*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-ap*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyStart.set(0,i)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateEnd.set(n,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(ap*this._rotateDelta.x/t.clientHeight),this._rotateUp(ap*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,i=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,i),this._dollyDelta.set(0,(this._dollyEnd.y/this._dollyStart.y)**+this.zoomSpeed),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new G,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function lp(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.addEventListener(`pointerup`,this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType===`touch`?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grabbing`)))}function up(e){this.enabled!==!1&&(e.pointerType===`touch`?this._onTouchMove(e):this._onMouseMove(e))}function dp(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener(`pointermove`,this._onPointerMove),this.domElement.ownerDocument.removeEventListener(`pointerup`,this._onPointerUp),this.dispatchEvent(ep),this.state=op.NONE,this._cursorStyle===`grab`&&(this.domElement.style.cursor=`grab`);break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y})}}function fp(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case bn.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=op.DOLLY;break;case bn.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=op.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=op.ROTATE}break;case bn.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=op.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=op.PAN}break;default:this.state=op.NONE}this.state!==op.NONE&&this.dispatchEvent($f)}function pp(e){switch(this.state){case op.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case op.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case op.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e)}}function mp(e){this.enabled!==!1&&this.enableZoom!==!1&&this.state===op.NONE&&(e.preventDefault(),this.dispatchEvent($f),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(ep))}function hp(e){this.enabled!==!1&&this._handleKeyDown(e)}function gp(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case xn.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=op.TOUCH_ROTATE;break;case xn.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=op.TOUCH_PAN;break;default:this.state=op.NONE}break;case 2:switch(this.touches.TWO){case xn.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=op.TOUCH_DOLLY_PAN;break;case xn.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=op.TOUCH_DOLLY_ROTATE;break;default:this.state=op.NONE}break;default:this.state=op.NONE}this.state!==op.NONE&&this.dispatchEvent($f)}function _p(e){switch(this._trackPointer(e),this.state){case op.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case op.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case op.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case op.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=op.NONE}}function vp(e){this.enabled!==!1&&e.preventDefault()}function yp(e){e.key===`Control`&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}function bp(e){e.key===`Control`&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener(`keyup`,this._interceptControlUp,{passive:!0,capture:!0}))}var xp=class extends Wf{constructor(e,t,n,r={}){super(),this.pixelSize=e,this.scene=t,this.camera=n,this.normalEdgeStrength=r.normalEdgeStrength||.3,this.depthEdgeStrength=r.depthEdgeStrength||.4,this.pixelatedMaterial=this._createPixelatedMaterial(),this._resolution=new G,this._renderResolution=new G,this._normalMaterial=new ic,this._beautyRenderTarget=new ea,this._beautyRenderTarget.texture.minFilter=Tn,this._beautyRenderTarget.texture.magFilter=Tn,this._beautyRenderTarget.texture.type=Rn,this._beautyRenderTarget.depthTexture=new Hs,this._normalRenderTarget=new ea,this._normalRenderTarget.texture.minFilter=Tn,this._normalRenderTarget.texture.magFilter=Tn,this._normalRenderTarget.texture.type=Rn,this._fsQuad=new qf(this.pixelatedMaterial)}dispose(){this._beautyRenderTarget.dispose(),this._normalRenderTarget.dispose(),this.pixelatedMaterial.dispose(),this._normalMaterial.dispose(),this._fsQuad.dispose()}setSize(e,t){this._resolution.set(e,t),this._renderResolution.set(e/this.pixelSize|0,t/this.pixelSize|0);let{x:n,y:r}=this._renderResolution;this._beautyRenderTarget.setSize(n,r),this._normalRenderTarget.setSize(n,r),this._fsQuad.material.uniforms.resolution.value.set(n,r,1/n,1/r)}setPixelSize(e){this.pixelSize=e,this.setSize(this._resolution.x,this._resolution.y)}render(e,t){let n=this._fsQuad.material.uniforms;n.normalEdgeStrength.value=this.normalEdgeStrength,n.depthEdgeStrength.value=this.depthEdgeStrength,e.setRenderTarget(this._beautyRenderTarget),e.render(this.scene,this.camera);let r=this.scene.overrideMaterial;e.setRenderTarget(this._normalRenderTarget),this.scene.overrideMaterial=this._normalMaterial,e.render(this.scene,this.camera),this.scene.overrideMaterial=r,n.tDiffuse.value=this._beautyRenderTarget.texture,n.tDepth.value=this._beautyRenderTarget.depthTexture,n.tNormal.value=this._normalRenderTarget.texture,this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear()),this._fsQuad.render(e)}_createPixelatedMaterial(){return new tc({uniforms:{tDiffuse:{value:null},tDepth:{value:null},tNormal:{value:null},resolution:{value:new Qi},normalEdgeStrength:{value:0},depthEdgeStrength:{value:0}},vertexShader:`
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
			`})}},Sp={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
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

		}`},Cp=class extends Wf{constructor(){super(),this.isOutputPass=!0,this.uniforms=Qs.clone(Sp.uniforms),this.material=new nc({name:Sp.name,uniforms:this.uniforms,vertexShader:Sp.vertexShader,fragmentShader:Sp.fragmentShader}),this._fsQuad=new qf(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},J.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}};function wp(e,t=!1){let n=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},o={},s=e[0].morphTargetsRelative,c=new Po,l=0;for(let u=0;u<e.length;++u){let d=e[u],f=0;if(n!==(d.index!==null))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`),null;for(let e in d.attributes){if(!r.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`),null;a[e]===void 0&&(a[e]=[]),a[e].push(d.attributes[e]),f++}if(f!==r.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of attributes.`),null;if(s!==d.morphTargetsRelative)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. .morphTargetsRelative must be consistent throughout all geometries.`),null;for(let e in d.morphAttributes){if(!i.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`.  .morphAttributes must be consistent throughout all geometries.`),null;o[e]===void 0&&(o[e]=[]),o[e].push(d.morphAttributes[e])}if(t){let e;if(n)e=d.index.count;else if(d.attributes.position!==void 0)e=d.attributes.position.count;else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. The geometry must have either an index or a position attribute`),null;c.addGroup(l,e,u),l+=e}}if(n){let t=0,n=[];for(let r=0;r<e.length;++r){let i=e[r].index;for(let e=0;e<i.count;++e)n.push(i.getX(e)+t);t+=e[r].attributes.position.count}c.setIndex(n)}for(let e in a){let t=Tp(a[e]);if(!t)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` attribute.`),null;c.setAttribute(e,t)}for(let e in o){let t=o[e][0].length;if(t!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[e]=[];for(let n=0;n<t;++n){let t=[];for(let r=0;r<o[e].length;++r)t.push(o[e][r][n]);let r=Tp(t);if(!r)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` morphAttribute.`),null;c.morphAttributes[e].push(r)}}}return c}function Tp(e){let t,n,r,i=-1,a=0;for(let o=0;o<e.length;++o){let s=e[o];if(t===void 0&&(t=s.array.constructor),t!==s.array.constructor)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`),null;if(n===void 0&&(n=s.itemSize),n!==s.itemSize)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`),null;if(r===void 0&&(r=s.normalized),r!==s.normalized)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`),null;if(i===-1&&(i=s.gpuType),i!==s.gpuType)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`),null;a+=s.count*n}let o=new t(a),s=new yo(o,n,r),c=0;for(let t=0;t<e.length;++t){let r=e[t];if(r.isInterleavedBufferAttribute){let e=c/n;for(let t=0,i=r.count;t<i;t++)for(let i=0;i<n;i++){let n=r.getComponent(t,i);s.setComponent(t+e,i,n)}}else o.set(r.array,c);c+=r.count*n}return i!==void 0&&(s.gpuType=i),s}var Ep=.16,Dp=[-2,0,-2,4,1,4,`s`],Op=e=>[-1,1,-1,2,e,2,`m`],kp=e=>[-1,e,-1,2,2,2,`m`],Ap={1:[Dp,Op(3),kp(4),[2,1,0,1,7,1,`w`],[2,8,0,1,1,1,`i`]],2:[Dp,Op(4),[-1,5,-3,2,2,4,`m`],[-1,7,-3,2,1,2,`m`],[-1,8,-3,1,1,1,`s`],[0,8,-3,1,1,1,`s`],[-1,6,-4,1,1,1,`e`],[0,6,-4,1,1,1,`e`],[2,1,0,1,6,1,`w`],[2,7,0,1,1,1,`i`]],3:[Dp,Op(5),[-1,6,-1,2,2,2,`a`],[0,8,0,1,2,1,`a`],[-1,9,0,3,1,1,`a`]],4:[Dp,[-2,1,-2,4,5,4,`m`],[-2,6,-2,1,1,1,`m`],[1,6,-2,1,1,1,`m`],[-2,6,1,1,1,1,`m`],[1,6,1,1,1,1,`m`],[-1,2,-3,2,2,1,`k`]],5:[Dp,[-2,1,-2,4,2,4,`m`],Op(7),[-1,8,-1,2,1,2,`a`],[-1,9,-1,1,1,1,`a`],[0,9,0,1,1,1,`a`],[-1,9,0,1,1,1,`a`],[0,9,-1,1,1,1,`a`],[0,10,0,1,1,1,`e`]],6:[Dp,Op(6),[-2,4,-1,4,2,2,`m`],[-1,7,-1,2,1,2,`a`],[0,8,0,1,3,1,`a`],[-1,9,0,3,1,1,`a`],[-2,1,0,1,3,1,`s`],[1,1,0,1,3,1,`s`]],7:[Dp,Op(4),kp(5),[-1,6,-1,2,1,2,`s`],[2,1,0,1,6,1,`w`],[3,2,0,1,4,1,`l`],[1,4,-3,1,1,3,`w`]],8:[Dp,[-2,1,-1,4,4,2,`m`],kp(5),[-1,7,-1,2,1,2,`i`],[-4,1,-1,1,4,3,`a`],[-4,2,0,1,2,1,`e`],[3,1,0,1,6,1,`w`],[2,6,-1,3,2,2,`i`]],9:[[-3,0,-3,6,1,6,`s`],[-3,1,-2,6,4,4,`m`],kp(5),[-3,1,-3,6,5,1,`i`],[-2,6,-2,4,1,4,`i`],[-1,3,-4,2,1,1,`a`]],10:[Dp,Op(3),kp(4),[-2,6,-2,4,1,4,`a`],[0,7,0,1,1,1,`a`],[2,1,0,1,6,1,`w`],[2,7,0,1,1,1,`g`],[-1,5,-2,2,1,1,`l`]],11:[Dp,[-2,1,-2,4,3,3,`m`],[-2,2,-4,4,3,2,`m`],[-2,1,-4,4,1,1,`k`],[-2,2,-5,1,1,1,`l`],[1,2,-5,1,1,1,`l`],[-2,4,-4,1,1,1,`e`],[1,4,-4,1,1,1,`e`],[-1,4,-1,1,1,1,`k`],[0,4,0,1,1,1,`k`],[-1,4,1,1,1,1,`k`]]},jp={k:2236468,w:9393723,i:10202551,e:14243683,l:16777215,g:10085712},Mp=[{m:15854038,s:13616296,a:16511542},{m:4867666,s:9078424,a:11285042}],Np=(e,t)=>Mp[t][e]??jp[e]??16711935,Pp={1:`models/pawn.json`,2:`models/knight.json`,3:`models/bishop.json`,4:`models/rook.json`,5:`models/queen.json`,6:`models/king.json`,7:`models/archer.json`,8:`models/paladin.json`,9:`models/guard.json`,10:`models/maester.json`,11:`models/beast.json`},Fp={1:.85,2:1.1,3:1.2,4:1.05,5:1.4,6:1.55,7:1.15,8:1.3,9:1.1,10:1.1,11:1.05,12:1.1,13:1.1},Ip=new Map,Lp=!0;function Rp(e){Lp=e}async function zp(e=`./`){await Promise.all(Object.entries(Pp).map(async([t,n])=>{let r=await fetch(e+n).catch(()=>null);r?.ok&&Ip.set(+t,await r.json())}))}var Bp=[[1,0,0,[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[-1,0,0,[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]],[0,1,0,[[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],[0,-1,0,[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[0,0,1,[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]],[0,0,-1,[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]];function Vp(e,t,n){let r=n/e.size[1],i=(e,t,n)=>`${e},${t},${n}`,a=new Set(e.voxels.map(e=>i(...e))),o=1/0,s=-1/0,c=1/0,l=-1/0;for(let[t,,n]of e.voxels)o=Math.min(o,t),s=Math.max(s,t),c=Math.min(c,n),l=Math.max(l,n);let u=-(o+s+1)/2,d=-(c+l+1)/2,f=new Y(Mp[t].m),p=new Y(Mp[t].s),m=new Y,h=[],g=[],_=[],v=[];for(let t=0;t<e.voxels.length;t++){let[n,o,s]=e.voxels[t],c=e.accent?.[t],l=c?m.setRGB(c[0]/255,c[1]/255,c[2]/255,Wr):e.shade?m.copy(f).multiplyScalar(.6+.4*e.shade[t]/255):o<2?p:f,y=0,b=0,x=0;for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++)for(let r=-1;r<=1;r++)(e||t||r)&&!a.has(i(n+e,o+t,s+r))&&(y+=e,b+=t,x+=r);let S=Math.hypot(y,b,x);for(let[e,t,c,f]of Bp){if(a.has(i(n+e,o+t,s+c)))continue;let p=h.length/3,[m,C,w]=S>0?[y/S,b/S,x/S]:[e,t,c];for(let[e,t,i]of f)h.push((n+e+u)*r,(o+t)*r,(s+i+d)*r),g.push(m,C,w),_.push(l.r,l.g,l.b);v.push(p,p+1,p+2,p,p+2,p+3)}}let y=new Po;return y.setAttribute(`position`,new So(h,3)),y.setAttribute(`normal`,new So(g,3)),y.setAttribute(`color`,new So(_,3)),y.setIndex(v),y}var Hp=new Map;function Up(e,t){let n=`${e}:${t}:${Lp?`s`:`p`}`,r=Hp.get(n);if(r)return r;let i=Lp?Ip.get(e):void 0;if(i){let r=Vp(i,t,Fp[e]);return Hp.set(n,r),r}let a=(Ap[e]??[Dp,Op(3),kp(4)]).map(([e,n,r,i,a,o,s])=>{let c=new Gs(i*Ep,a*Ep,o*Ep);c.translate((e+i/2)*Ep,(n+a/2)*Ep,(r+o/2)*Ep);let l=new Y(Np(s,t)),u=c.attributes.position.count,d=new Float32Array(u*3);for(let e=0;e<u;e++)d.set([l.r,l.g,l.b],e*3);return c.setAttribute(`color`,new yo(d,3)),c}),o=wp(a,!1);if(!o)throw Error(`mergeGeometries failed`);return a.forEach(e=>e.dispose()),Hp.set(n,o),o}var Wp=e=>1-(1-e)**3,Gp=e=>e<.5?4*e*e*e:1-(-2*e+2)**3/2,Kp=e=>e,qp=new Map;function Jp(e,t=.32){let n=qp.get(e);if(!n){let t=document.createElement(`canvas`);t.width=t.height=32;let r=t.getContext(`2d`);r.fillStyle=`#151515`,r.fillRect(0,0,32,32),r.fillStyle=`#f1e9d6`,r.fillRect(2,2,28,28),r.fillStyle=`#151515`,r.font=`bold 22px monospace`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillText(e,16,17);let i=new Vs(t);i.magFilter=i.minFilter=Tn,i.colorSpace=Wr,n=new Wo({map:i}),qp.set(e,n)}let r=new is(n);return r.scale.setScalar(t),r}var Yp=class{list=[];constructor(){typeof document<`u`&&document.addEventListener(`visibilitychange`,()=>{document.hidden&&this.flush()})}add(e,t,n=Gp){return typeof document<`u`&&document.hidden?(t(1),Promise.resolve()):new Promise(r=>this.list.push({t:0,dur:e,ease:n,update:t,resolve:r}))}flush(){let e=this.list;this.list=[];for(let t of e)t.update(1),t.resolve()}wait(e){return this.add(e,()=>{},Kp)}step(e){for(let t of[...this.list]){t.t+=e;let n=Math.min(1,t.t/t.dur);t.update(t.ease(n)),n>=1&&(this.list.splice(this.list.indexOf(t),1),t.resolve())}}},Xp=class{max;mesh;pos;vel;life;cursor=0;m=new ra;q=new Fi;s=new K;p=new K;constructor(e,t=400){this.max=t,this.mesh=new Fs(new Gs(.07,.07,.07),new ac,t),this.mesh.instanceMatrix.setUsage(Xr),this.mesh.frustumCulled=!1,this.pos=new Float32Array(t*3),this.vel=new Float32Array(t*3),this.life=new Float32Array(t);for(let e=0;e<t;e++)this.mesh.setMatrixAt(e,this.m.makeScale(0,0,0));this.mesh.setColorAt(0,new Y(16777215)),e.add(this.mesh)}burst(e,t,n=28,r=3){let i=new Y;for(let a=0;a<n;a++){let n=this.cursor=(this.cursor+1)%this.max;this.pos.set([e.x+(Math.random()-.5)*.3,e.y+Math.random()*.6,e.z+(Math.random()-.5)*.3],n*3);let o=Math.random()*Math.PI*2,s=(.4+Math.random()*.6)*r;this.vel.set([Math.cos(o)*s,2+Math.random()*r,Math.sin(o)*s],n*3),this.life[n]=.6+Math.random()*.5,this.mesh.setColorAt(n,i.setHex(t[a%t.length]))}this.mesh.instanceColor.needsUpdate=!0}step(e){let t=!1;for(let n=0;n<this.max;n++){if(this.life[n]<=0)continue;t=!0;let r=n*3;this.vel[r+1]-=12*e,this.pos[r]+=this.vel[r]*e,this.pos[r+1]+=this.vel[r+1]*e,this.pos[r+2]+=this.vel[r+2]*e,this.pos[r+1]<.035&&(this.pos[r+1]=.035,this.vel[r+1]*=-.35,this.vel[r]*=.6,this.vel[r+2]*=.6),this.life[n]-=e;let i=Math.max(0,Math.min(1,this.life[n]/.3));this.m.compose(this.p.set(this.pos[r],this.pos[r+1],this.pos[r+2]),this.q,this.s.setScalar(i)),this.mesh.setMatrixAt(n,this.m)}t&&(this.mesh.instanceMatrix.needsUpdate=!0)}},Zp=[0,2236468,4532284,6699313,9393723,14643494,14262374,15647642,16511542,10085712,6995504,3642478,4942127,5393188,3292217,4145012,3170434,5992161,6527999,6278628,13360124,16777215,10202551,8683143,6908522,5854802,7750282,11285042,14243683,14121914,9410378,9072432],Qp={db32:Zp,endesga32:[12470831,14120515,15389866,14984818,12087120,7552569,4073265,10626611,14957380,16217634,16690740,16705377,6539085,4098376,2513986,1653822,1199753,39387,2943221,16777215,12635100,9149364,5925256,3818598,2501444,1578021,16711748,6830188,11882632,16151930,15251350,12748137],warm:[1117965,2366744,3812900,5324592,7033919,9071695,11045475,12888184,14468237,15653542,16248008,16775395,2828838,4539452,6315603,8157805,10131591,12105379,13947584,3095074,4609071,6254396,8227917,10267236,5910306,8209449,10706735,13140284,2371651,3820131,5663624,8032685]};function $p(e){let t=new Uint8Array(e.length*4);e.forEach((e,n)=>t.set([e>>16&255,e>>8&255,e&255,255],n*4));let n=new Es(t,e.length,1,Kn);return n.minFilter=n.magFilter=Tn,n.colorSpace=Wr,n.needsUpdate=!0,n}function em(e=Zp,t=2,n=.03){return new Jf({uniforms:{tDiffuse:{value:null},tPalette:{value:$p(e)},paletteSize:{value:e.length},pixelSize:{value:t},ditherAmount:{value:n}},vertexShader:`
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
      }`})}var tm=new URLSearchParams(location.search),nm=tm.get(`army`)||`painted-blue-red`,rm=1.15*(Number(tm.get(`spriteScale`))||1),im={1:`pawn`,2:`knight`,3:`bishop`,4:`rook`,5:`queen`,6:`king`,7:`archer`,8:`paladin`,9:`guard`,10:`maester`,11:`beast`},am=e=>im[e]!==void 0,om=new Nc,sm=new Map,cm=5;function lm(e,t){let n=cm,r=document.createElement(`canvas`);r.width=e.width+10,r.height=e.height+10;let i=r.getContext(`2d`);for(let t=0;t<8;t++){let r=t*Math.PI/4;i.drawImage(e,n+Math.round(Math.cos(r)*n),n+Math.round(Math.sin(r)*n))}return i.globalCompositeOperation=`source-in`,i.fillStyle=`#${t.toString(16).padStart(6,`0`)}`,i.fillRect(0,0,r.width,r.height),i.globalCompositeOperation=`source-over`,i.drawImage(e,n,n),r}function um(e,t,n){let r=`${im[e]}-${t?`b`:`w`}`,i=n==null?r:`${r}:${n}`,a=sm.get(i);return a||(a=om.loadAsync(`./sprites/${nm}/${r}.png`).then(e=>{let t=e;return n!=null&&(t=new Vs(lm(e.image,n)),e.dispose()),t.magFilter=t.minFilter=Tn,t.generateMipmaps=!1,t.colorSpace=Wr,t}),sm.set(i,a)),a}var dm=new Map;function fm(e,t){let n=`${e.toFixed(3)}:${t.toFixed(3)}`,r=dm.get(n);return r||(r=new Ks(e,t),r.translate(0,t/2,0),dm.set(n,r)),r}function pm(e,t,n){let r=Fp[e]*rm,i=new ds({alphaTest:.5,transparent:!1,side:2,visible:!1}),a=new Cs(fm(r,r),i);return um(e,t,n).then(e=>{let t=e.image;a.geometry=fm(r*t.width/t.height,r),i.map=e,i.visible=!0,i.needsUpdate=!0}).catch(()=>{}),a}var mm={dungeonVoxel:{label:`Dungeon`,pixelSize:2,palette:!1,dither:.06,normalEdge:.05,depthEdge:.15,shading:`lambert`,pieces:`voxel`,outline:!1,pieceScale:.85,camera:{elev:53,azim:0},tiles:`stone`,lights:`torch`,shadow:!0},cel:{label:`Cel pixel`,pixelSize:1,palette:!1,dither:.03,normalEdge:.05,depthEdge:.15,shading:`toon`,toonBands:4,pieces:`voxel`,outline:!0,pieceScale:.85},hd:{label:`HD pixel`,pixelSize:2,palette:!1,dither:.03,normalEdge:.15,depthEdge:.2,shading:`lambert`,pieces:`voxel`,outline:!0,pieceScale:.85},voxel:{label:`Clean voxel`,pixelSize:1,palette:!1,dither:.03,normalEdge:0,depthEdge:.35,shading:`lambert`,pieces:`voxel`,outline:!1},db32:{label:`16-bit palette`,pixelSize:2,palette:!0,dither:.03,normalEdge:.05,depthEdge:.3,shading:`lambert`,pieces:`voxel`,outline:!1},sprites:{label:`HD-2D sprites`,pixelSize:1,palette:!1,dither:.03,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1},chunkyVoxel:{label:`A1 Chunky voxel`,pixelSize:3,palette:!1,dither:0,normalEdge:.05,depthEdge:.1,shading:`toon`,toonBands:2,pieces:`voxel`,outline:!0,pieceScale:.85,tiles:`edged`,rim:1},chunkySprite:{label:`A2 Chunky sprite`,pixelSize:3,palette:!1,dither:0,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,tiles:`edged`,spriteOutline:!0},chunkyPalette:{label:`A3 Chunky + Endesga`,pixelSize:3,palette:!0,dither:.02,normalEdge:.05,depthEdge:.1,shading:`toon`,toonBands:2,pieces:`voxel`,outline:!0,pieceScale:.85,tiles:`edged`,rim:1,paletteName:`endesga32`},dungeonSprite:{label:`B1 Dungeon sprite`,pixelSize:2,palette:!1,dither:.06,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,camera:{elev:60,azim:0},tiles:`stone`,lights:`torch`,shadow:!0},dungeonBright:{label:`B3 Dungeon (bright)`,pixelSize:2,palette:!1,dither:.06,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,camera:{elev:60,azim:0},tiles:`stone`,lights:`bright`,shadow:!0},isoVoxel:{label:`C1 Iso voxel`,pixelSize:3,palette:!0,dither:.08,normalEdge:.05,depthEdge:.1,shading:`lambert`,pieces:`voxel`,outline:!0,pieceScale:.85,camera:{elev:30,azim:45,zoom:.85},paletteName:`warm`,rim:1,boardSide:.8,shadow:!0},isoSprite:{label:`C2 Iso sprite`,pixelSize:3,palette:!0,dither:.08,normalEdge:0,depthEdge:0,shading:`lambert`,pieces:`sprite`,outline:!1,camera:{elev:30,azim:45,zoom:.85},paletteName:`warm`,spriteOutline:!0,boardSide:.8,shadow:!0},isoClean:{label:`C3 Iso clean`,pixelSize:3,palette:!1,dither:.03,normalEdge:.05,depthEdge:.1,shading:`lambert`,pieces:`voxel`,outline:!0,pieceScale:.85,camera:{elev:30,azim:45,zoom:.85},rim:1,boardSide:.8,shadow:!0}};mm.dungeonProc={...mm.dungeonVoxel,label:`B4 Dungeon (proc stone)`,tiles:`stoneProc`};var hm=e=>new K(g(e)-3.5,0,3.5-_(e)),gm=15723491,_m=7301989,vm=15328991,ym=1183242,bm=.04,xm=.3,Sm={elev:54.2,azim:0},Cm=13.5,wm=new K(0,.45,0),Tm=(e,t,n)=>e+(t-e)*n;function Em(){let e=document.createElement(`canvas`);e.width=e.height=32;let t=e.getContext(`2d`);t.fillStyle=`#ffffff`,t.fillRect(0,0,32,32),t.fillStyle=`#3a3a3a`,t.fillRect(0,0,32,1),t.fillRect(0,31,32,1),t.fillRect(0,0,1,32),t.fillRect(31,0,1,32);let n=new Vs(e);return n.magFilter=n.minFilter=Tn,n.generateMipmaps=!1,n.colorSpace=Wr,n}var Dm={light:[147,186,221,230,240],dark:[30,41,53,60,69],frame:[72,102,132,145,161]};function Om(e,t){let n=document.createElement(`canvas`);n.width=n.height=64;let r=n.getContext(`2d`),i=t=>{r.fillStyle=`rgb(${e[t]},${e[t]},${e[t]})`},a=()=>(t=Math.imul(t,1664525)+1013904223>>>0)/4294967296;i(0),r.fillRect(0,0,64,64),i(2),r.fillRect(2,2,60,60);for(let e=2;e<62;e+=4)for(let t=2;t<62;t+=4){let n=a();n>.72?(i(3),r.fillRect(t,e,4,4)):n<.13&&(i(1),r.fillRect(t,e,4,4))}i(0);for(let e=0;e<9;e++)r.fillRect(4+Math.floor(a()*54),4+Math.floor(a()*54),1,1);for(let e=0;e<2;e++){let t=10+Math.floor(a()*44),n=e?60:3;for(let i=0;i<24;i++)r.fillRect(t,n,1,1),t+=Math.round(a()*2-1),n+=e?-1:1}i(4),r.fillRect(2,2,60,1),r.fillRect(61,2,1,60),i(1),r.fillRect(2,60,60,2),r.fillRect(2,2,2,60);let o=new Vs(n);return o.magFilter=o.minFilter=Tn,o.generateMipmaps=!1,o.colorSpace=Wr,o}var km=new Map;function Am(e){let t=km.get(e);if(!t){let n=document.createElement(`canvas`);n.width=n.height=16;let r=n.getContext(`2d`);r.font=`bold 13px monospace`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillStyle=`#1a1611`,r.fillText(e,9,10),r.fillStyle=`#e7dcc2`,r.fillText(e,8,9);let i=new Vs(n);i.magFilter=i.minFilter=Tn,i.generateMipmaps=!1,i.colorSpace=Wr,t=new ds({map:i,transparent:!0,alphaTest:.5}),km.set(e,t)}return t}function jm(){let e=document.createElement(`canvas`);e.width=e.height=64;let t=e.getContext(`2d`),n=t.createRadialGradient(32,32,0,32,32,32);return n.addColorStop(0,`rgba(0,0,0,0.55)`),n.addColorStop(.6,`rgba(0,0,0,0.28)`),n.addColorStop(1,`rgba(0,0,0,0)`),t.fillStyle=n,t.fillRect(0,0,64,64),new Vs(e)}var Mm=class{container;scene=new za;camera=new Xc(-1,1,1,-1,.1,100);world=new ja;onSquareClick=()=>{};onSquareHover=()=>{};renderer;composer;pixelPass;palettePass;tiles=[];pieces=new Map;markers=new ja;tweens=new Yp;debris;lambertMat=new ac({vertexColors:!0});toonMats=new Map;pieceMat=this.lambertMat;style=Object.values(mm)[0];labels=!1;lastPos=null;flipped=!1;markerGeo=new Gs(.22,.12,.22);moveMat=new ac({color:6280031,emissive:2060063});raycaster=new vl;pointer=new G;shake=0;shakeOff=new K;timer=new rl;controls;outlineMat=new ds({color:1381653,side:1});frame3d;coords=new ja;hemi=new Fc(16773853,2826560,1.6);sun=new Qc(16777215,2.2);torches=new ja;edgeTex=Em();shadowMat=new ds({map:jm(),transparent:!0,depthWrite:!1});shadowGeo=new Ks(1,1).rotateX(-Math.PI/2);stone={};proc={};tap=null;hovered=null;highlights={};constructor(e){this.container=e,this.renderer=new Hf({antialias:!1,powerPreference:`high-performance`}),this.renderer.setPixelRatio(1),e.appendChild(this.renderer.domElement),this.scene.background=new Y(vm),this.scene.add(this.world),this.camera.position.copy(wm).add(this.camOffset()),this.controls=new cp(this.camera,this.renderer.domElement),this.controls.target.copy(wm),this.controls.enableDamping=!0,this.controls.dampingFactor=.12,this.controls.rotateSpeed=.6,this.controls.minPolarAngle=.25,this.controls.maxPolarAngle=1.25,this.controls.minZoom=.7,this.controls.maxZoom=3,this.controls.screenSpacePanning=!1,this.controls.touches={ONE:xn.ROTATE,TWO:xn.DOLLY_PAN},this.controls.update(),this.sun.position.set(-4,10,6),this.scene.add(this.hemi,this.sun,this.torches);for(let[e,t]of[[-4.8,-4.8],[4.8,-4.8],[-4.8,4.8],[4.8,4.8]]){let n=new Yc(16754769,0,16,1.4);n.position.set(e,2.4,t),this.torches.add(n)}this.torches.visible=!1,this.frame3d=new Cs(new Gs(8.9,.5,8.9),new ac({color:2828840})),this.frame3d.position.y=-.4,this.world.add(this.frame3d,this.coords);let t=new Ks(.34,.34).rotateX(-Math.PI/2);for(let e=0;e<8;e++){let n=new Cs(t,Am(`abcdefgh`[e]));n.position.x=e-3.5,n.userData.axis=`f`;let r=new Cs(t,Am(`${e+1}`));r.position.z=3.5-e,r.userData.axis=`r`,this.coords.add(n,r)}this.placeCoords();for(let e=0;e<64;e++){let t=new Cs(new Gs(1,xm,1),new ac({color:(g(e)+_(e))%2?gm:_m}));t.position.copy(hm(e)).setY(-.3/2),t.userData.sq=e,this.tiles.push(t),this.world.add(t)}this.world.add(this.markers),this.debris=new Xp(this.world),this.composer=new Zf(this.renderer),this.pixelPass=new xp(2,this.scene,this.camera,{normalEdgeStrength:.05,depthEdgeStrength:.3}),this.composer.addPass(this.pixelPass),this.composer.addPass(new Cp),this.palettePass=em(),this.composer.addPass(this.palettePass),new ResizeObserver(()=>this.resize()).observe(e),this.resize();let n=this.renderer.domElement;n.addEventListener(`pointermove`,e=>this.hover(this.pick(e))),n.addEventListener(`pointerdown`,e=>{this.tap=this.tap?null:e}),n.addEventListener(`pointerup`,e=>this.onUp(e)),n.addEventListener(`pointercancel`,()=>{this.tap=null}),n.addEventListener(`pointerleave`,()=>this.hover(null)),this.timer.connect(document),this.renderer.setAnimationLoop(()=>this.frame())}setPixelSize(e){this.pixelPass.setPixelSize(e),this.palettePass.uniforms.pixelSize.value=e}setPalette(e,t=.08){this.palettePass.enabled=e,this.palettePass.uniforms.ditherAmount.value=t}setEdges(e,t){this.pixelPass.normalEdgeStrength=e,this.pixelPass.depthEdgeStrength=t}setLabels(e){this.labels=e;for(let t of this.pieces.values())t.userData.label.visible=e}setPaletteColors(e){this.palettePass.uniforms.tPalette.value.dispose(),this.palettePass.uniforms.tPalette.value=$p(e),this.palettePass.uniforms.paletteSize.value=e.length}applyStyle(e){let t=e.shading===`toon`?this.toonMat(e.toonBands??4):this.lambertMat,n=this.style,r=t!==this.pieceMat||e.pieces!==n.pieces||e.outline!==n.outline||e.pieceScale!==n.pieceScale||e.spriteOutline!==n.spriteOutline||e.shadow!==n.shadow||e.rim!==n.rim||e.outlineColor!==n.outlineColor||e.pixelSize!==n.pixelSize;this.style=e,this.pieceMat=t,this.outlineMat.color.setHex(e.outlineColor??1381653),this.setPixelSize(e.pixelSize),this.setPalette(e.palette,e.dither),this.setPaletteColors(Qp[e.paletteName??`db32`]),this.setEdges(e.normalEdge,e.depthEdge),this.setCoords(e.coords??!0),this.applyBoard(),this.applyLights(),this.applyCamera(),r&&this.lastPos&&this.rebuild(this.lastPos)}applyBoard(){let e=this.style.tiles??`flat`,t=this.style.lights===`torch`;if(e===`stone`&&!this.stone.light){let e=e=>{let t=new Nc().load(`./textures/${e}`);return t.magFilter=t.minFilter=Tn,t.generateMipmaps=!1,t.colorSpace=Wr,t};this.stone={light:e(`white_tile_1.jpg`),dark:e(`black_tile_1.jpg`),frame:e(`board_texture1.jpg`)}}e===`stoneProc`&&!this.proc.light&&(this.proc={light:Om(Dm.light,7),dark:Om(Dm.dark,11),frame:Om(Dm.frame,3)});let n=e===`stone`?this.stone:e===`stoneProc`?this.proc:null,r=this.style.boardSide??xm;for(let i of this.tiles){let a=i.userData.sq,o=(g(a)+_(a))%2==1,s=i.material;s.map=e===`edged`?this.edgeTex:n?n[o?`light`:`dark`]:null,s.color.setHex(n?t?12760483:16777215:o?gm:_m),s.needsUpdate=!0,i.scale.y=r/xm,i.position.y=-r/2}this.frame3d.material.map=n?n.frame:null,this.frame3d.material.color.setHex(n?t?7301728:9077880:2828840),this.frame3d.material.needsUpdate=!0,this.frame3d.position.y=-r-.1,this.placeCoords()}placeCoords(){let e=this.flipped?-1:1;for(let t of this.coords.children)t.position.y=this.frame3d.position.y+.26,t.userData.axis===`f`?t.position.z=4.22*e:t.position.x=-4.22*e,t.rotation.y=this.flipped?Math.PI:0}setCoords(e){this.coords.visible=e}applyLights(){let e=this.style.lights===`torch`;this.hemi.intensity=e?.58:1.6,this.hemi.color.setHex(e?16767400:16773853),this.hemi.groundColor.setHex(e?3811898:2826560),this.sun.intensity=e?.4:2.2,this.torches.visible=e;for(let t of this.torches.children)t.intensity=e?10:0;this.scene.background.setHex(e?ym:vm)}camOffset(){let e=this.style.camera??Sm;return new K().setFromSphericalCoords(Cm,Pi.degToRad(90-e.elev),Pi.degToRad(e.azim))}applyCamera(){let e=this.camOffset();this.flipped&&e.set(-e.x,e.y,-e.z),this.controls.target.copy(wm),this.camera.position.copy(wm).add(e),this.camera.zoom=this.style.camera?.zoom??1,this.camera.updateProjectionMatrix(),this.controls.update()}toonMat(e){let t=this.toonMats.get(e);if(!t){let n=new Uint8Array(e);for(let t=0;t<e;t++)n[t]=Math.round((t+1)/e*255);let r=new Es(n,e,1,Yn);r.minFilter=r.magFilter=Tn,r.needsUpdate=!0,t=new rc({vertexColors:!0,gradientMap:r}),this.toonMats.set(e,t)}return t}flip(e){if(e===this.flipped)return;this.flipped=e,this.placeCoords();let t=this.offset();t.theta+=Math.PI,this.tweenTo(t,this.controls.target.clone(),this.camera.zoom)}resetView(){let e=new xl().setFromVector3(this.camOffset());this.flipped&&(e.theta+=Math.PI),this.tweenTo(e,wm.clone(),this.style.camera?.zoom??1)}screenOf(e){let t=hm(e).project(this.camera),n=this.renderer.domElement.getBoundingClientRect();return{x:n.left+(t.x+1)/2*n.width,y:n.top+(1-t.y)/2*n.height}}offset(){return new xl().setFromVector3(this.camera.position.clone().sub(this.controls.target))}tweenTo(e,t,n,r=.4){let i=this.offset(),a=this.controls.target.clone(),o=this.camera.zoom,s=new K,c=e.theta-i.theta;return e.theta=i.theta+Math.atan2(Math.sin(c),Math.cos(c)),this.tweens.add(r,r=>{s.setFromSphericalCoords(Tm(i.radius,e.radius,r),Tm(i.phi,e.phi,r),Tm(i.theta,e.theta,r)),this.controls.target.lerpVectors(a,t,r),this.camera.position.copy(this.controls.target).add(s),this.camera.zoom=Tm(o,n,r),this.camera.updateProjectionMatrix()},Wp)}rebuild(e){for(let e of this.pieces.values())this.world.remove(e);this.pieces.clear(),this.sync(e)}sync(e){this.lastPos=e;for(let t=0;t<64;t++){let n=e.board[t],r=this.pieces.get(t);r&&r.userData.code===n&&r.position.distanceTo(hm(t))<.01||(r&&(this.world.remove(r),this.pieces.delete(t)),n&&this.pieces.set(t,this.spawn(t,m(n),h(n))))}}rimWorld(){if(this.style.rim==null)return bm;let e=this.renderer.domElement.height||900;return this.style.rim*this.style.pixelSize*(this.camera.top-this.camera.bottom)/(e*this.camera.zoom)}spawn(e,t,n){let r=new ja,i=Fp[t]*1.15;if(this.style.pieces===`sprite`&&am(t))r.add(pm(t,n,this.style.spriteOutline?this.style.outlineColor??1381653:void 0)),r.userData.sprite=!0;else{let e=Up(t,n);e.boundingBox||e.computeBoundingBox();let a=this.style.pieceScale??1;i=e.boundingBox.max.y*a;let o=new Cs(e,this.pieceMat);if(o.scale.setScalar(a),r.add(o),this.style.outline){let t=this.rimWorld(),n=e.boundingBox,i=n.getSize(new K).multiplyScalar(.5),o=new Cs(e,this.outlineMat);o.scale.set(a+t/i.x,a+t/i.y,a+t/i.z),o.position.y=(n.max.y+n.min.y)/2*(a-o.scale.y),r.add(o)}n===1&&(r.rotation.y=Math.PI)}if(this.style.shadow){let e=new Cs(this.shadowGeo,this.shadowMat);e.scale.setScalar(.8),e.position.y=.02,r.add(e)}let a=Jp(l[t]);return a.position.y=i+.25,a.visible=this.labels,r.userData.label=a,r.add(a),r.position.copy(hm(e)),r.userData.code=t|n<<4,this.world.add(r),r}highlight(e){this.highlights=e;for(let e of this.tiles)e.material.emissive.setHex(0);let t=(e,t)=>e?.forEach(e=>this.tiles[e].material.emissive.setHex(t));t(e.last,2768746),t(e.captures,9051935),t(e.swaps,4145050),t(e.shoves,9067024),e.check!=null&&t([e.check],11145232),e.selected!=null&&t([e.selected],8022544),this.hovered!=null&&!this.tiles[this.hovered].material.emissive.getHex()&&t([this.hovered],2763306),this.markers.clear();for(let t of e.moves??[]){let e=new Cs(this.markerGeo,this.moveMat);e.position.copy(hm(t)).setY(.06),this.markers.add(e)}}async animateMove(e,t){let n=this.pieces.get(t.from);if(!n)return;let r=m(e.board[t.from]),i=e=>{let t=this.pieces.get(e);if(!t)return;this.pieces.delete(e),this.world.remove(t);let n=Mp[h(t.userData.code)];this.debris.burst(hm(e).setY(.2),[n.m,n.s,n.a]),this.shake=Math.max(this.shake,.12)};if(t.shove){let e=this.pieces.get(t.shove.from);e&&(await this.hop(e,t.shove.from,t.shove.to,.28,.25),this.pieces.delete(t.shove.from),this.pieces.set(t.shove.to,e)),t.to!==t.from&&(await this.hop(n,t.from,t.to,.28,.2),this.pieces.delete(t.from),this.pieces.set(t.to,n))}else if(t.to===t.from)await this.arrow(t.from,t.captures[0]),i(t.captures[0]);else if(t.swap){let e=this.pieces.get(t.to);await Promise.all([this.hop(n,t.from,t.to,.45,.7),this.hop(e,t.to,t.from,.45,.4)]),this.pieces.set(t.to,n),this.pieces.set(t.from,e)}else if(t.captures.length>1){let e=t.from;for(let r of t.captures)await this.hop(n,e,r,.22,.35),i(r),e=r;this.pieces.delete(t.from),this.pieces.set(t.to,n)}else await this.hop(n,t.from,t.to,.35,r===2?1:.35),t.captures.length&&i(t.captures[0]),this.pieces.delete(t.from),this.pieces.set(t.to,n),t.selfRemove&&(await this.tweens.wait(.15),i(t.to),this.shake=.25)}hop(e,t,n,r,i){let a=hm(t),o=hm(n);return this.tweens.add(r,t=>{e.position.lerpVectors(a,o,t),e.position.y=Math.sin(t*Math.PI)*i})}arrow(e,t){let n=hm(e).setY(.5),r=hm(t).setY(.4),i=new Cs(new Gs(.06,.06,.5),new ac({color:8014634}));return i.position.copy(n),i.lookAt(r),this.world.add(i),this.tweens.add(.28,e=>{i.position.lerpVectors(n,r,e),i.position.y+=Math.sin(e*Math.PI)*.4,e>=1&&this.world.remove(i)},Kp)}frame(){this.timer.update();let e=Math.min(.05,this.timer.getDelta());this.tweens.step(e),this.debris.step(e),this.controls.update(e);for(let e of this.pieces.values())e.userData.sprite&&e.children[0].quaternion.copy(this.camera.quaternion);this.shakeOff.set(0,0,0),this.shake>.001&&(this.shakeOff.set((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake,0),this.shake*=.85),this.camera.position.add(this.shakeOff),this.composer.render(),this.camera.position.sub(this.shakeOff)}resize(){let e=this.container.clientWidth||1,t=this.container.clientHeight||1,n=e/t,r=9.4,i=n>=1?r*n:r,a=n>=1?r:r/n;this.camera.left=-i/2,this.camera.right=i/2,this.camera.top=a/2,this.camera.bottom=-a/2,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.composer.setSize(e,t)}pick(e){let t=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),this.raycaster.setFromCamera(this.pointer,this.camera);let n=[...this.tiles,...this.pieces.values()];for(let e of this.raycaster.intersectObjects(n,!0)){let t=e.object;for(;t;){if(t.userData.sq!=null)return t.userData.sq;for(let[e,n]of this.pieces)if(n===t)return e;t=t.parent}}return null}onUp(e){let t=this.tap;if(this.tap=null,e.button!==0||t?.pointerId!==e.pointerId||Math.hypot(e.clientX-t.clientX,e.clientY-t.clientY)>6)return;let n=this.pick(e);n!=null&&this.onSquareClick(n,e.shiftKey)}hover(e){e!==this.hovered&&(this.hovered=e,this.highlight(this.highlights),this.onSquareHover(e))}},Nm=new URLSearchParams(location.search),Pm={2017:o,2021:s}[Nm.get(`rules`)??``],Fm=Nm.get(`kings`);(Pm||Fm)&&c({...Pm,...Fm?{kings:r(Fm)}:{}});var Im={HolyLight:`enemy pawns cannot take this king, and it cannot take pawns`,Mercy:`the king steps 1–2, jumps friends and takes only a guard`,DeathTouch:`the king takes an adjacent enemy without moving — it can only take this way`,Darkness:`pawns step diagonally and take straight ahead, with no double step`,March:`pawns step two squares from any rank`,Leap:`rooks, bishops and the queen pass over their own pawns`},Lm=e=>e?`${e.king}:${e.power} — ${Im[e.power]??`a lab power`}`:`plain king`,Rm=()=>{let[e,t]=a.kings;return!e&&!t?``:e&&t&&e.king===t.king&&e.power===t.power?`<div>Kings — both ${Lm(e)}</div>`:`<div>Kings — White ${Lm(e)} · Black ${Lm(t)}</div>`},Q=e=>document.getElementById(e),$=new vn,zm=new yn,Bm=new Mm(Q(`board`));window.view=Bm;var Vm=[`human`,`ai`],Hm=null,Um=[],Wm=null,Gm=null,Km=!1,qm=0,Jm=null,Ym=()=>Gm!=null||$.status!==`playing`,Xm=[[``,``],[`Moves 1 square forward, 2 from its start rank.`,`Takes 1 square diagonally forward. Promotes on the last rank.`],[`Moves in an L (2 + 1) over any piece.`,`Takes by moving onto the enemy.`],[`Moves any distance diagonally.`,`Takes by moving onto the enemy.`],[`Moves any distance orthogonally.`,`Takes by moving onto the enemy.`],[`Moves any distance in a straight line.`,`Takes by moving onto the enemy.`],[`Moves 1 square in any direction.`,`Takes by moving onto the enemy. Only a king can take a guard.`],[`Moves 1 square in any direction.`,`Shoots without moving: an enemy diagonally adjacent, or 2 squares away orthogonally, through blockers.`],[`Moves like a queen and jumps over own pieces.`,`Takes by moving on, but never a king. Removes itself after capturing anything but a pawn.`],[`Moves 1 square in any direction, empty squares only.`,`Cannot capture. Cannot be captured, except by a king.`],[`Moves 1 square in any direction; onto an own piece it swaps places.`,`Takes an adjacent enemy. With its own king on rank 1 it swaps with the king at any distance.`],[`Moves 1 square in any direction, empty squares only.`,`Takes on any adjacent square but straight ahead, and may keep taking from each new square.`],[`Moves 1 square in any direction. Instead it may shove an adjacent piece 1 square away — shift-click a neighbour.`,`Takes by moving onto the enemy, a guard excepted. A shove is not a capture and never moves a king.`],[`Moves like a rook and never takes by moving.`,`Lobs along a rank or file over one enemy screen and takes the first piece beyond it.`]];function Zm(e){let t=e==null?0:$.pos.board[e],n=t?m(t):0;Q(`info`).innerHTML=(t?`<b>${h(t)?`Black`:`White`} ${u[n]}</b><br>${Xm[n][0]} ${Xm[n][1]}`+(t&32?` <b>This guard has used its capture.</b>`:``):``)+Rm()}var Qm=e=>e.shove?[e.shove.from]:e.to===e.from?[e.captures[0]]:e.captures.length>1?e.captures:[e.to],$m=()=>Hm==null?[]:$.legal.filter(e=>e.from===Hm&&Um.every((t,n)=>Qm(e)[n]===t));function eh(){let e=$m(),t=e.map(e=>Qm(e)[Um.length]).filter(e=>e!=null),n=e.filter(e=>e.swap).map(e=>e.to),r=e.filter(e=>e.shove).map(e=>e.shove.from),i=$.history.at(-1)?.move;Bm.highlight({selected:Hm,moves:t.filter(e=>!$.pos.board[e]),captures:t.filter(e=>$.pos.board[e]!==0&&!n.includes(e)&&!r.includes(e)),swaps:n,shoves:r,last:i?[i.from,...i.shove?[i.shove.from,i.shove.to]:i.to===i.from?i.captures:[i.to]]:[],check:$.inCheck?ne($.pos.board,$.pos.turn):null}),Q(`stop-chain`).hidden=!(Um.length&&$m().some(e=>Qm(e).length===Um.length));let a=$.pos.turn?`Black`:`White`;Q(`turn`).textContent=Ym()?``:`${a} to move${$.inCheck?` — CHECK`:``}`,Q(`status`).textContent=Gm==null?{playing:Km&&Vm[$.pos.turn]===`ai`?`thinking…`:``,checkmate:`Checkmate — ${$.pos.turn?`White`:`Black`} wins`,stalemate:`Stalemate — draw`,draw50:`Draw — 50-move rule`,drawRepetition:`Draw — threefold repetition`,drawMaterial:`Draw — insufficient material`}[$.status]:lh(),Q(`setup`).textContent=$.backRank||`custom`,Q(`setup`).title=ye($.pos);let o=Q(`moves`);o.innerHTML=$.history.map((e,t)=>t%2==0?`<li>${t/2+1}. <b>${e.lan}</b>`:` ${e.lan}</li>`).join(``),o.scrollTop=o.scrollHeight;let s=[[],[]];for(let e of $.history){let t=h(e.pos.board[e.move.from]);for(let n of e.move.captures)s[t].push(e.pos.board[n]);e.move.selfRemove&&s[1-t].push(e.pos.board[e.move.from])}let c=e=>e.map(e=>`<span title="${h(e)?`black`:`white`} ${u[m(e)]}">${h(e)?l[m(e)].toLowerCase():l[m(e)]}</span>`).join(``);Q(`took-w`).innerHTML=c(s[0]),Q(`took-b`).innerHTML=c(s[1]),Zm(Hm??Wm),Q(`undo`).disabled=$.history.length===0,Q(`resign`).disabled=Ym(),Q(`copy`).disabled=$.history.length===0}async function th(e){let t=qm;Km=!0;let n=$.pos;$.play(e),Hm=null,Um=[],eh(),await Bm.animateMove(n,e),t===qm&&(Bm.sync($.pos),Km=!1,eh(),ph(),Ym()?uh():nh())}async function nh(){if(Km||Ym()||Vm[$.pos.turn]!==`ai`)return;Km=!0,eh();let e=qm,t=await zm.think($.pos,{timeMs:+Q(`think`).value});e===qm&&(Km=!1,t.move&&await th(t.move))}function rh(e){let t=Q(`promo`);return t.innerHTML=``,t.hidden=!1,new Promise(n=>{let r=e=>{t.hidden=!0,Jm=null,n(e)};Jm=()=>r(null);for(let n of e){let e=document.createElement(`button`);e.textContent=`${l[n.promo]} ${u[n.promo]}`,e.onclick=()=>r(n),t.appendChild(e)}})}async function ih(e){if(e.length===1||!e.every(e=>e.promo))return th(e[0]);Km=!0;let t=await rh(e);if(t)return Km=!1,th(t)}Bm.onSquareClick=(e,t=!1)=>{if(Km||Ym()||Vm[$.pos.turn]!==`human`)return;let n=$.pos.board[e]!==0&&h($.pos.board[e])===$.pos.turn,r=$m().filter(t=>Qm(t)[Um.length]===e);if(Hm==null||r.length===0)return Hm=n&&e!==Hm?e:null,Um=[],eh();let i=r.filter(e=>Qm(e).length===Um.length+1);if(i.length&&i.length===r.length){if(i.length>1){let e=i.filter(e=>!!e.shove===t);if(e.length){ih(e);return}}ih(i);return}Um.push(e),eh()},Bm.onSquareHover=e=>{Wm=e,Q(`hover`).textContent=e==null?``:y(e),Zm(Hm??Wm)},Q(`stop-chain`).onclick=()=>{let e=$m().find(e=>Qm(e).length===Um.length);e&&th(e)};function ah(){qm++,zm.cancel(),Jm?.(),Km=!1,Hm=null,Um=[]}var oh=()=>Bm.flip(Vm[0]===`ai`&&Vm[1]===`human`);function sh(e,t){ah(),Gm=null,Vm[0]=Q(`white`).value,Vm[1]=Q(`black`).value,t?$.load(be(t)):$.newGame(e),Bm.sync($.pos),oh(),eh(),ph(),nh()}function ch(){$.history.length&&(ah(),Gm=null,$.undo(),Vm[$.pos.turn]===`ai`&&Vm.includes(`human`)&&$.undo(),Bm.sync($.pos),eh(),ph(),nh())}function lh(){return Gm==null?{playing:``,checkmate:`${$.pos.turn?`White`:`Black`} wins by checkmate`,stalemate:`Draw by stalemate`,draw50:`Draw by the 50-move rule`,drawRepetition:`Draw by repetition`,drawMaterial:`Draw by insufficient material`}[$.status]:`${Gm?`Black`:`White`} resigns — ${Gm?`White`:`Black`} wins`}function uh(){let e=Math.ceil($.history.length/2),t=Q(`over`);Q(`over-title`).textContent=lh(),Q(`over-detail`).textContent=`${e} move${e===1?``:`s`} · setup ${$.backRank||`custom`}`,t.returnValue=``,t.showModal()}Q(`over`).onclose=()=>{let e=Q(`over`).returnValue;if(e===`new`)sh(_e());else if(e===`rematch`){let[e,t]=[Q(`white`),Q(`black`)];[e.value,t.value]=[t.value,e.value],sh($.backRank||void 0,$.backRank?null:ye($.history[0]?.pos??$.pos))}},Q(`undo`).onclick=ch,Q(`resign`).onclick=()=>{Ym()||confirm(`Resign as ${$.pos.turn?`Black`:`White`}?`)&&(ah(),Gm=$.pos.turn,eh(),ph(),uh())},Q(`copy`).onclick=()=>{let e=$.history.map((e,t)=>t%2==0?`${t/2+1}. ${e.lan}`:e.lan).join(` `);navigator.clipboard?.writeText(e).catch(()=>dh(e))??dh(e)};function dh(e){let t=document.createElement(`textarea`);t.value=e,t.style.cssText=`position:fixed;opacity:0`,document.body.appendChild(t),t.select();try{document.execCommand(`copy`)}catch{}t.remove()}var fh=`kingdown.save`;function ph(){try{localStorage.setItem(fh,JSON.stringify({back:$.backRank,fen:ye($.history[0]?.pos??$.pos),moves:$.history.map(e=>e.lan),white:Vm[0],black:Vm[1],think:+Q(`think`).value,style:gh.value,coords:yh.checked,resigned:Gm,rules:{...a}}))}catch{}}function mh(){try{let e=localStorage.getItem(fh),t=e?JSON.parse(e):null;return t&&Array.isArray(t.moves)?t:null}catch{return null}}Q(`rules-btn`).onclick=()=>Q(`rules`).showModal(),Q(`new-random`).onclick=()=>sh(_e()),Q(`new-classic`).onclick=()=>sh(he),Q(`new-setup`).onclick=()=>{let e=prompt(`Back rank (8 letters, one K; from QLRRBBNNAAGGMMSS):`,$.backRank)?.toUpperCase().trim();if(e)try{sh(e)}catch(e){alert(e.message)}},Q(`white`).onchange=Q(`black`).onchange=()=>{Vm[0]=Q(`white`).value,Vm[1]=Q(`black`).value,oh(),ph(),nh()},Q(`think`).onchange=ph,Q(`pixel`).oninput=e=>Bm.setPixelSize(+e.target.value);var hh=()=>Bm.setPalette(Q(`palette`).checked,+Q(`dither`).value);Q(`palette`).onchange=Q(`dither`).oninput=hh,Q(`edges`).oninput=e=>{let t=+e.target.value;Bm.setEdges(t*.3,t)},Q(`sculpts`).onchange=e=>{Rp(e.target.checked),Bm.rebuild($.pos)};var gh=Q(`style`);gh.innerHTML=Object.entries(mm).map(([e,t])=>`<option value="${e}">${t.label}</option>`).join(``);var _h=Object.keys(mm)[0];gh.value=Nm.get(`style`)||_h,gh.value||=_h;var vh=Q(`labels`);vh.checked=Nm.get(`labels`)===`1`,vh.onchange=()=>Bm.setLabels(vh.checked),Bm.setLabels(vh.checked);var yh=Q(`coords`);yh.onchange=()=>{Bm.setCoords(yh.checked),ph()};var bh=Math.min(6,Math.max(0,Math.round(Number(Nm.get(`px`))||0)));function xh(){let e=mm[gh.value];Bm.applyStyle(e);let t=bh||e.pixelSize;Bm.setPixelSize(t),Q(`pixel`).value=String(t),Q(`edges`).value=String(e.depthEdge),Q(`palette`).checked=e.palette,Q(`dither`).value=String(e.dither),Bm.setCoords(yh.checked)}gh.onchange=()=>{xh(),ph()},Q(`reset-view`).onclick=()=>Bm.resetView(),addEventListener(`keydown`,e=>{if(e.key===`Escape`){Hm=null,Um=[],eh();return}e.target.closest(`input,select,textarea`)||(e.key===`r`&&Bm.resetView(),e.key===`z`&&ch())});var Sh=Nm.has(`fen`)?null:mh();Sh&&(Sh.style&&mm[Sh.style]&&(gh.value=Sh.style),Sh.white&&(Q(`white`).value=Sh.white),Sh.black&&(Q(`black`).value=Sh.black),Sh.think&&(Q(`think`).value=String(Sh.think)),typeof Sh.coords==`boolean`&&(yh.checked=Sh.coords),Vm[0]=Q(`white`).value,Vm[1]=Q(`black`).value),await zp(),xh();var Ch=Nm.get(`fen`);if(Ch)try{$.load(be(Ch))}catch(e){alert(`Bad fen: ${e.message}`)}else if(Sh){let e=Sh.rules;if((Pm||Fm)&&e&&JSON.stringify(e)!==JSON.stringify({...a}))console.warn(`kingdown: the autosave played different rules than the URL asks for; starting fresh`);else try{e&&c(e),Sh.back?$.newGame(Sh.back):$.load(be(Sh.fen)),$.playLan(Sh.moves),Gm=Sh.resigned??null}catch{$.newGame()}}oh(),Bm.sync($.pos),eh(),Ch||ph(),Ym()?uh():nh();