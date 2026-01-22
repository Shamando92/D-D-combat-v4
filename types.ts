
export enum Condition {
  None = "None",
  Blinded = "Blinded",
  Charmed = "Charmed",
  Deafened = "Deafened",
  Frightened = "Frightened",
  Grappled = "Grappled",
  Incapacitated = "Incapacitated",
  Invisible = "Invisible",
  Paralyzed = "Paralyzed",
  Petrified = "Petrified",
  Poisoned = "Poisoned",
  Prone = "Prone",
  Restrained = "Restrained",
  Stunned = "Stunned",
  Unconscious = "Unconscious",
  Exhaustion = "Exhaustion"
}

export interface MonsterData {
  actions: string[];
  reactions: string[];
  legendaryActions: string[];
  resistances: string[];
  immunities: string[];
  damageInfo: string;
}

export interface Combatant {
  id: string;
  name: string;
  hp: number | "";
  ac: number | "";
  initiative: number | "";
  str: number | "";
  dex: number | "";
  con: number | "";
  int: number | "";
  wis: number | "";
  cha: number | "";
  savingThrows: string;
  condition: Condition;
  concentration: boolean;
  data: MonsterData;
  customColumns: Record<string, string | number>;
}

export interface ColumnConfig {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'dropdown' | 'action';
  isCustom: boolean;
  isHidden: boolean;
  canHide: boolean;
}

export interface Session {
  name: string;
  date: string;
  data: Combatant[];
  columns: ColumnConfig[];
}
