import {core, SfdxCommand, flags} from '@salesforce/command';
import * as xml2js from 'xml2js';
import * as _ from 'lodash';

const FS = require('fs')
const Util = require('util')
const readFile = Util.promisify(FS.readFile)
const readFilePromise = (filePath: string): Promise<any> => (
    readFile(filePath).then(result => result)
)
// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('clean', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    //Steve commented out    name: flags.string({char: 'n', description: messages.getMessage('nameFlagDescription')}),
  };

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    let success = true;
    let profiles = await core.SfdxUtil.readdir('./force-app/main/default/profiles');
    //_.forEach(profiles, (p) =>{
    
    // let profileArrayRead = []
    // let profileArray = profiles.map(p => {
    //     if(p.indexOf('.profile-meta.xml') >= 0) {
    //         profileArrayRead.push(core.SfdxUtil.readFile('./force-app/main/default/profiles/'+p))
    //     }
    // })


    let profileArrayWrite = []

    Promise.all(
        profiles.map(p => {
            if(p.indexOf('.profile-meta.xml') >= 0) {
                return core.SfdxUtil.readFile('./force-app/main/default/profiles/'+p)
            }
        })
    ).then(results => {
        results.map((profile, index) => {
            if(!!profile) {
                let isChanged = false;

                let parser = new xml2js.Parser(),
                xmlBuilder = new xml2js.Builder();

                parser.parseString(profile, function (err, result) {

                    for(let entry in result.Profile){
                        if(entry !== "layoutAssignments"){
                            delete result.Profile[entry];
                            isChanged = true;
                        }
                    }

                    if(isChanged){
                        let xml = xmlBuilder.buildObject(result);
                        let updated = core.SfdxUtil.writeFile('./force-app/main/default/profiles/'+profiles[index], xml);
                    }
                });
            }
        })
    }).catch(errors => {
        success = false;
    })

    // To write
    // Promise.all(profileArrayWrite).then(results => {
    //     console.log(results)
    // }).then(errors => {
    //     console.log(errors)
    // })

    // for(var p of profiles){
    // this.ux.log('steve profile is: ' + p);
    // if(p.indexOf('.profile-meta.xml') >= 0){
    //     var profile = await core.SfdxUtil.readFile('./force-app/main/default/profiles/'+p);

    //     var parser = new xml2js.Parser(),
    //         xmlBuilder = new xml2js.Builder();

    //         console.log('profile => ', profile)
    //         parser.parseString(profile, function (err, result) {

    //         for(var something in result){
    //             console.log(something);

    //             for(var entry in result[something]){
    //                 if(entry !== "layoutAssignments"){
    //                 delete result.Profile[entry];
    //                 }
    //             }
    //         }
    //         var xml = xmlBuilder.buildObject(result);

    //         //fs.writeFile('updated.xml', xml);
    //         var updated = core.SfdxUtil.writeFile('./force-app/main/default/profiles/Updated'+p, xml);
    //         });
    //     };
    // };

    if(success){
        this.ux.log('    /@');
        this.ux.log('    \\ \\');
        this.ux.log('  ___> \\');
        this.ux.log(' (__O)  \\');
        this.ux.log('(____@)  \\');
        this.ux.log('(____@)   \\');
        this.ux.log(' (__o)_    \\');
        this.ux.log('       \\    \\');
        this.ux.log('Success');
        //this.ux.log(goodwork);
    }
    // Return an object to be displayed with --json
    return { };
  }
}