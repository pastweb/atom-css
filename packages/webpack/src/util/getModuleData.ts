import { ModuleData, ImporterData } from "../types";

export function getModuleData(dataModules: ModuleData[], importers: Record<string, ImporterData>, fileName: string): ModuleData | null {
  let moduleData: ModuleData | null = null;

  for (const data of dataModules) {
    const { isEntry, importedCss, importer } = data;
    
    if (
    (isEntry && (importedCss && importedCss.has(fileName))) ||
    (!isEntry && importer && importers[importer].isEntry)
    ) {
    moduleData = data;
    break;
    }
  }

  return moduleData;
}
