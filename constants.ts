
import { ColumnConfig, Condition } from './types';

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'name', label: 'Name', type: 'string', isCustom: false, isHidden: false, canHide: false },
  { id: 'hp', label: 'HP', type: 'number', isCustom: false, isHidden: false, canHide: true },
  { id: 'ac', label: 'AC', type: 'number', isCustom: false, isHidden: false, canHide: true },
  { id: 'initiative', label: 'Initiative', type: 'number', isCustom: false, isHidden: false, canHide: true },
  { id: 'movement', label: 'Movement', type: 'string', isCustom: false, isHidden: false, canHide: true },
  { id: 'savingThrows', label: 'Saving Throws', type: 'string', isCustom: false, isHidden: false, canHide: false },
  { id: 'condition', label: 'Condition', type: 'dropdown', isCustom: false, isHidden: false, canHide: false },
  { id: 'concentration', label: 'Concentration', type: 'boolean', isCustom: false, isHidden: false, canHide: false },
  { id: 'data', label: 'Data', type: 'action', isCustom: false, isHidden: false, canHide: false },
];

export const CONDITIONS = Object.values(Condition);
