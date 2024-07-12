export function getStrClasses(classes: string): string[] {
  return classes.trim().replace(/ +/g, ' ').split(' ').filter(c => c);
}
