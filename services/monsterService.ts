import * as XLSX from 'xlsx';
import { MonsterData } from '../types';

export interface MonsterImportData {
  name: string;
  ac: number;
  hp: number;
  movement: string;
  savingThrows: string;
  abilities: string;
  actions: string;
  resistances: string;
  immunities: string;
  spells: string;
  legendaryActions: string;
  reactions: string;
  vulnerabilities: string;
  bonusActions: string;
}

export async function parseMonsterXlsx(file: File): Promise<MonsterImportData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 'A' }) as any[];

        // Mapping:
        // Column A (0) -> Name
        // Column D (3) -> AC
        // Column E (4) -> HP
        // Column F (5) -> Movement
        // Column M (12) -> Saving Throws
        // Column N (13) -> Abilities
        // Column O (14) -> Actions
        // Column P (15) -> Resistances
        // Column Q (16) -> Immunities
        // Column R (17) -> Spells
        // Column S (18) -> Legendary Actions
        // Column T (19) -> Reactions
        // Column U (20) -> Vulnerabilities
        // Column V (21) -> Bonus Actions

        const monsters: MonsterImportData[] = json.slice(1).map((row: any) => ({
          name: String(row.A || ''),
          ac: Number(row.D || 0),
          hp: Number(row.E || 0),
          movement: String(row.F || ''),
          savingThrows: String(row.M || ''),
          abilities: String(row.N || ''),
          actions: String(row.O || ''),
          resistances: String(row.P || ''),
          immunities: String(row.Q || ''),
          spells: String(row.R || ''),
          legendaryActions: String(row.S || ''),
          reactions: String(row.T || ''),
          vulnerabilities: String(row.U || ''),
          bonusActions: String(row.V || ''),
        })).filter(m => m.name);

        resolve(monsters);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
