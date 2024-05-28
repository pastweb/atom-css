import { generateHash } from './generateHash';

export function getUtilityClassName(mode: string, prop: string, value: string): string {
  let className = '';

  switch(mode) {
    case 'readable':
      className = `${prop}${value.split(' ').map(val => `[${val}]`).join('')}`;
    break;
    case 'semireadable':
      className = `${prop}[${generateHash(8, value)}]`;
    break;
    case 'coded':
      className = `_${generateHash(8, prop, value)}`;
    break;
  }

  return className;
}
