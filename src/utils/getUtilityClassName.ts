import { generateHash } from './generateHash';

export function getUtilityClassName(mode: string, prop: string, value: string): string {
  let className = '';

  switch(mode) {
    case 'readable':
      className = `${prop}${`[_${value.replace(/( +(,|\.|[()])?)|((,|\.|[()])? +)/g, '_')}]`}`;
    break;
    case 'semireadable':
      className = `${prop}[_${generateHash(8, value)}]`;
    break;
    case 'coded':
      className = `_${generateHash(8, prop, value)}`;
    break;
  }

  return className;
}
