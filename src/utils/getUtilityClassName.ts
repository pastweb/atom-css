import { generateHash } from './generateHash';
import type { AtRule } from 'postcss';

const DOT_PREFIX_RE = / +\.[\d]+/g;

export function getUtilityClassName(
  mode: string,
  prop: string,
  value: string,
  atRule?: AtRule,
): string {
  const isAtRule = !!atRule;
  let className = '';
  let _name = '';
  let _params = '';

  if (isAtRule) {
    _name = atRule.name;
    _params = `${atRule.params}`;
  }
  
  switch(mode) {
    case 'readable':
      const _value = value.replace(DOT_PREFIX_RE, '0-').replace(/( +(,|[()])?)|((,|[()])? +)/g, '_');
      if (isAtRule) {
        className = `${_name}${_params ? `[_${
          _params.replace(DOT_PREFIX_RE, '0_')
            .replace(/,/g, '_')
            .replace(/:? +/g, '-')
            .replace(/[()]/g, '')
        }]` : ''}[${prop}][_${_value}]`;
      } else {
        className = `${prop}${`[_${_value}]`}`;
      }
    break;
    case 'semireadable':
      if (isAtRule) className = `${_name}[_${generateHash(8, _params, prop, value)}]`;
      else className = `${prop}[_${generateHash(8, value)}]`;
    break;
    case 'coded':
      if (isAtRule) className = `_${generateHash(8, _name, _params, prop, value)}`;
      else className = `_${generateHash(8, prop, value)}`;
    break;
  }

  return className;
}
