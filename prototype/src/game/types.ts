export type Lane = -1 | 0 | 1;
export type GateAction = 'multiply' | 'add' | 'subtract' | 'divide' | 'attack' | 'rapid' | 'shield';
export interface GateChoice { lane: Lane; action: GateAction; value: number; }
export interface BaseEvent { id: string; at: number; }
export interface GateRow extends BaseEvent { type:'gate_row'; title?: string; choices: GateChoice[]; }
export interface ObstacleEvent extends BaseEvent { type:'obstacle'; lane:Lane; kind: 'membrane'|'spike'|'mucus'|'rotor'|'pulsing'|'current'; damage:number; width:number; }
export interface EnemyEvent extends BaseEvent { type:'enemy'; lane:Lane; enemy:string; hp:number; strength:number; }
export interface BossEvent extends BaseEvent { type:'boss'; lane:Lane; boss:string; hp:number; strength:number; }
export type StageEvent = GateRow | ObstacleEvent | EnemyEvent | BossEvent;
export interface StageDefinition {
  id: number; title:string; subtitle:string; length:number; speed:number;
  colors: { tissue:string; shadow:string; accent:string }; gimmick:string; events:StageEvent[];
}
export interface StageBundle { schemaVersion:number; displayTitle:string; stages:StageDefinition[]; }
export type GameStatus = 'menu'|'running'|'paused'|'win'|'lost';
export interface HudSnapshot {
  stage: number; title:string; progress:number; distance:number; troops:bigint;
  attack:number; rapid:number; shields:number;
  boss?: {name:string; hp:number; maxHp:number}; status: GameStatus;
}
export interface GameResult { won:boolean; stage:number; troops:bigint; seconds:number; reason:string; }
export type Quality = 'low'|'normal'|'high';
export type SkinId = 'teal'|'pearl'|'violet'|'gold';
export interface PlayerSave {
  version:1; unlockedStage:number; cleared:number[]; bestTimes:Record<string,number>;
  equippedSkin:SkinId; sound:boolean; quality:Quality; reducedMotion:boolean;
}
