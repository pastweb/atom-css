export function extractClassName(selector:string): { scoped: string, unscoped: string } {
  const classNameMatch = selector.match(/\.([\w-]+)/); // Extract class name from the selector
  const scoped = classNameMatch![0].replace(/^\./, '');
  const unscoped = scoped.replace(/_.*$/, '');

  return { scoped, unscoped };
}
