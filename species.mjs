export const FISH_SPECIES=Object.freeze([
  Object.freeze({id:'tai',aspect:1752/897,mouthX:0.99,mouthY:0.565,name:'タイ',label:'真鯛',image:'assets/fish/tai.png?v=20261111.4-gh',color:'#ee826e'}),
  Object.freeze({id:'buri',aspect:1774/887,mouthX:0.985,mouthY:0.525,name:'ブリ',label:'ブリ',image:'assets/fish/buri.png?v=20261111.4-gh',color:'#74bdaa'}),
  Object.freeze({id:'shark',aspect:1774/887,mouthX:0.92,mouthY:0.63,name:'サメ',label:'サメ',image:'assets/fish/shark.png?v=20261111.4-gh',color:'#7daed1'}),
  Object.freeze({id:'seabass',aspect:1920/819,mouthX:0.99,mouthY:0.57,name:'シーバス',label:'シーバス（スズキ）',image:'assets/fish/seabass.png?v=20261111.4-gh',color:'#8faa83'}),
  Object.freeze({id:'yellowfin',aspect:1774/887,mouthX:.974,mouthY:.514,name:'キハダマグロ',label:'キハダマグロ',image:'assets/fish/yellowfin.png?v=20261111.4-gh',color:'#e8bf53'}),
  Object.freeze({id:'tachiuo',aspect:2172/724,mouthX:0.99,mouthY:0.5,name:'タチウオ',label:'タチウオ',image:'assets/fish/tachiuo.png?v=20261111.4-gh',color:'#a3b8e6'})
]);
export function chooseFish(random=Math.random){const n=random();const index=Number.isFinite(n)?Math.max(0,Math.min(FISH_SPECIES.length-1,Math.floor(n*FISH_SPECIES.length))):0;return FISH_SPECIES[index];}
