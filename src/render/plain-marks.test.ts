import { expect, it, vi } from 'vitest';
import { drawPlainMarks, PLAIN } from './plain-marks';
function draw(tile=75,flipped=false) {
  const strokes: {color:string;width:number}[]=[], ellipses:number[][]=[], curves:number[][]=[], lines:number[][]=[], arcs:number[][]=[];
  const ctx=new Proxy({strokeStyle:'',lineWidth:0,arc:(...a:number[])=>arcs.push(a),ellipse:(...a:number[])=>ellipses.push(a),quadraticCurveTo:(...a:number[])=>curves.push(a),lineTo:(...a:number[])=>lines.push(a),stroke(){strokes.push({color:String(this.strokeStyle),width:Number(this.lineWidth)});},setLineDash:vi.fn(),fillText:vi.fn()} as Record<string,unknown>,{get:(o,k:string)=>o[k]??(()=>{})});
  drawPlainMarks(ctx as unknown as CanvasRenderingContext2D,{PAD:0,TILE:tile,cell:sq=>({col:flipped?7-sq%8:sq%8,row:flipped?sq>>3:7-(sq>>3)})},{rings:[{square:0,color:PLAIN.actor,width:1.1,size:1.12,role:'actor',dash:[4,5]}],paths:[{squares:[0,8],color:PLAIN.move,arc:true,dash:[2,7]}],steps:[{square:8,number:2}]});
  return {ctx,strokes,ellipses,curves,lines,arcs};
}
it('draws each dark edge before the Quiet colour, with exact scaled geometry',()=>{
  const d=draw();expect(d.strokes[0]).toEqual({color:'#16231ecc',width:75*.027*.8+75*.035});expect(d.strokes[1]).toEqual({color:PLAIN.move,width:75*.027*.8});
  expect(d.ellipses[0].slice(0,4)).toEqual([37.5,(7.5+.29)*75,.4*75*1.12,.18*75*1.12]);expect(d.ctx.setLineDash).toHaveBeenCalledWith([4,5]);expect(d.ctx.fillText).toHaveBeenCalledWith('2',61.5,(6.5-.32)*75);
  expect(d.curves[0][0]).toBe(37.5);expect(d.curves[0][1]).toBeCloseTo((6.5+.27-.64)*75);expect(d.curves[0][2]).toBe(37.5);expect(d.curves[0][3]).toBeCloseTo((6.5+.27)*75);expect(d.lines.length).toBeGreaterThan(2);
  expect(d.ctx.font).toBe('700 12px Avenir Next,Avenir,sans-serif');expect(d.arcs[0]).toEqual([61.5,463.5,8.25,0,Math.PI*2]);
  expect(d.strokes[4]).toEqual({color:'#16231ecc',width:75*.027*1.1+75*.035});expect(d.strokes[5]).toEqual({color:PLAIN.actor,width:75*.027*1.1});
  expect(d.lines[1][0]).toBeCloseTo(37.5-Math.cos(Math.PI/2+.5)*(75*.027+75*.12));expect(d.lines[1][1]).toBeCloseTo(507.75-Math.sin(Math.PI/2+.5)*(75*.027+75*.12));
});
it('scales all geometry, strokes and dashes with the square',()=>{
  const a=draw(),b=draw(150);expect(b.ellipses[0].slice(0,4)).toEqual(a.ellipses[0].slice(0,4).map(n=>n*2));expect(b.strokes[0].width).toBe(a.strokes[0].width*2);expect(b.ctx.setLineDash).toHaveBeenCalledWith([8,10]);
});
it('uses the scene orientation for rings, paths and numbers',()=>{
  const d=draw(75,true);expect(d.ellipses[0][0]).toBe(7.5*75);expect(d.ellipses[0][1]).toBe((.5+.29)*75);expect(d.ctx.fillText).toHaveBeenCalledWith('2',(7.5+.32)*75,(1.5-.32)*75);
});
