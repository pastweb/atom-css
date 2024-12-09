import { ImporterData, ModuleData } from "../types";

export function appendUtilities(dataModules: ModuleData[], moduleData: ModuleData, importers: Record<string, ImporterData>, chunk: any) {
  const { isEntry, importer } = moduleData;

  if (isEntry || (importer && importers[importer] && importers[importer].isEntry)) {
    let code = chunk.source;
    
    dataModules.forEach(({ utilities }) => {
      if (!utilities) return;
      
      Object.values(utilities).forEach(util => {
        code = `${code}\n${util}`;
      });
    });

    chunk.source = code;
  }
}