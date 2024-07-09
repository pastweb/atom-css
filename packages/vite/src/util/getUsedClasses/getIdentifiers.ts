import { UsedClasses } from "./types";

export function getIdentifiers(classes: UsedClasses): Record<string, string[]> {
  return Object.values(classes).reduce((acc, { identifier, classes }) => ({ ...acc, ...identifier ? { [identifier]: classes} : {}}), {});
}
