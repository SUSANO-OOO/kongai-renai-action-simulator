import type {PlayerSave} from './types';
const KEY='kongai-action-save-v1';
export const SKIN_COLORS = {
  teal: '#65e1ce', pearl:'#e8f7f0', violet:'#ae91fa',gold:'#ffd187',
} as const;

export const defaultSave=():PlayerSave=>({
  version:1,unlockedStage:1,cleared:[],bestTimes:{},equippedSkin:'teal',
  sound:true,quality:'normal',reducedMotion:false,
});

export function loadSave():PlayerSave {
  try {
    const raw=localStorage.getItem(KEY);
    if(!raw) return defaultSave();
    const data=JSON.parse(raw) as Partial<PlayerSave>;
    const base=defaultSave();
    return {
      ...base,
      unlockedStage:Math.min(10,Math.max(1,Number.isFinite(data.unlockedStage)? Number(data.unlockedStage):1)),
      cleared:Array.isArray(data.cleared)?data.cleared.filter(n=>Number.isInteger(n)&&n>=1&&n<=10):[],
      bestTimes: data.bestTimes && typeof data.bestTimes==='object'?data.bestTimes:{},
      equippedSkin:data.equippedSkin && Object.hasOwn(SKIN_COLORS,data.equippedSkin)?data.equippedSkin:'teal',
      sound: typeof data.sound==='boolean'?data.sound:true,
      quality: ['low','normal','high'].includes(data.quality??'')?data.quality!:'normal',
      reducedMotion: typeof data.reducedMotion==='boolean'?data.reducedMotion:false,
    };
  } catch { return defaultSave(); }
}
export function writeSave(data:PlayerSave) { try { localStorage.setItem(KEY,JSON.stringify(data)); } catch { /* unavailable storage: session-only */ } }
