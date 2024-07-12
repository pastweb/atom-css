import { UsedClasses } from "./types";

export function getIdentifiers(classes: UsedClasses): Record<string, string[]> {
  return Object.values(classes)
    .reduce((acc, { identifiers, classes }) => ({
      ...acc,
      ...Array.from(identifiers).reduce((acc, identifier) => ({
        ...acc,
        [ identifier ]: classes,
      }), {}),
    }), {});
}
