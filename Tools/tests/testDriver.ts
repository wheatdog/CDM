import * as cdm from "../cdm-types/cdm-types"
import * as loc from "../local-corpus/local-corpus";
import { writeFileSync, mkdirSync, existsSync } from "fs";


class Startup {
    public static main(): number {

        let cdmCorpus : cdm.Corpus;
        let pathToDocRoot = "../../schemaDocumentsTest";
        //let pathToDocRoot = "../../test";
        //pathToDocRoot = "/cdsa schemas/credandcollect";

        let version = "";
        //let version = "0.7"; // explicitly use the explicit version docs to get versioned schema refs too

        cdmCorpus = new cdm.Corpus(pathToDocRoot);
        cdmCorpus.setResolutionCallback(loc.consoleStatusReport, cdm.cdmStatusLevel.progress, cdm.cdmStatusLevel.error);
        console.log('reading source files');
        loc.loadCorpusFolder(cdmCorpus, cdmCorpus.addFolder("core"), ["analyticalCommon"], version); 

        loc.resolveLocalCorpus(cdmCorpus, cdm.cdmValidationStep.finished).then((r:boolean) =>{
            
            console.log('list all resolved');
            this.listAllResolved(cdmCorpus);
            console.log('done');

        }).catch();
        
        return 0;
    }

    public static listAllResolved(cdmCorpus : cdm.Corpus) {
        let seen = new Set<string>();
        let spew = new cdm.stringSpewCatcher();

        let seekEntities = (folder : cdm.ICdmFolderDef) => {
            if (folder.getName() != "" && folder.getDocuments() && folder.getDocuments().length)
            {
                spew.spewLine(folder.getRelativePath());
                folder.getDocuments().sort((l, r) => l.getName().localeCompare(r.getName())).forEach(doc => {
                    if (doc.getDefinitions() && doc.getDefinitions().length)
                        doc.getDefinitions().forEach(def => {
                            if (def.getObjectType() == cdm.cdmObjectType.entityDef) {
                                let ent = (def as cdm.ICdmEntityDef).getResolvedEntity(doc);
                                ent.spew(doc, spew, " ", true);
                            }
                        });
                });
            }
            if (folder.getSubFolders()) {
                folder.getSubFolders().sort((l, r) => l.getName().localeCompare(r.getName())).forEach(f => {
                    seekEntities(f);
                });
            }
        }
    
        seekEntities(cdmCorpus);
        writeFileSync("allResolved.txt", spew.getContent(), "utf8");

    }
}

Startup.main(); 