import { createHash } from 'node:crypto';

export function generateHash(length: number = 8, ...args: (string | number)[]): string {
  const hash = createHash('sha256');
  args.forEach(arg => hash.update(`${arg}`));
  return hash.digest('hex').substring(0, length);
}
