
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
  abilities: string;
  actions: string;
  resistances: string;
  immunities: string;
  spells: string;
  legendaryActions: string;
  reactions: string;
  vulnerabilities: string;
  bonusActions: string;
  damageInfo: string;
}

export interface Combatant {
  id: string;
  name: string;
  hp: number | "";
  ac: number | "";
  initiative: number | "";
  movement: string;
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

