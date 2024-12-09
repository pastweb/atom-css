import { parse, type Program, type Options } from 'acorn';
import { ACORN_OPTIONS } from './constants';

export function parseJs(code: string): Program {
  return parse(code, ACORN_OPTIONS);
}
