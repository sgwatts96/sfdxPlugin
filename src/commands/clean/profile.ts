import {core, SfdxCommand, flags} from '@salesforce/command';
import * as xml2js from 'xml2js';
import { SfdxUtil } from '@salesforce/core';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('clean', 'clean');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static requiresProject = true;

  public async run(): Promise<any> {
    let success = true;
    let isChanged = false;

    //read the sfdx project json
    const sfdxProjectJSON = await this.project.resolveProjectConfig();

    //get the default package directory
    let defaultProfileDirectory;
    for(let [key, value] of  Object.entries(sfdxProjectJSON)){
        if(key === 'packageDirectories'){
            value.map(val => {
                if(val.default){
                    defaultProfileDirectory = './' + val.path + '/main/default/profiles';
                }
            })
        }
    }

    //read profile
    let profiles = await core.SfdxUtil.readdir(defaultProfileDirectory);

    Promise.all(
        profiles.map(p => {
            if(p.indexOf('.profile-meta.xml') >= 0) {
                return core.SfdxUtil.readFile(defaultProfileDirectory + '/' + p)
            }
        })
    ).then(results => {
        results.map((profile, index) => {
            if(!!profile) {

                let parser = new xml2js.Parser(),
                xmlBuilder = new xml2js.Builder();

                parser.parseString(profile, function (err, result) {
                    if(profiles[index] != "Officer - registration.profile-meta.xml"){
                        for(let entry in result.Profile){
                            if(entry !== "layoutAssignments"){
                                delete result.Profile[entry];
                                isChanged = true;
                            }
                        }
                    } else{
                        for(let entry in result.Profile){
                            if(entry !== "layoutAssignments" && entry !== "userPermissions"){
                                delete result.Profile[entry];
                                isChanged = true;
                            } else if(entry == "userPermissions"){
                                for(let i = 0; i < result.Profile.userPermissions.length; i++){
                                    if(!result.Profile.userPermissions[i].name || result.Profile.userPermissions[i].name != 'ChatterEditOwnPost'){
                                        delete result.Profile.userPermissions[i];
                                        isChanged = true;                                    
                                    }
                                }
                            }
                        }
                    }

                    if(isChanged){
                        let xml = xmlBuilder.buildObject(result);
                        let updated = core.SfdxUtil.writeFile(defaultProfileDirectory + '/' + profiles[index], xml);
                    }
                });
            }
        })
    }).then(results => {
        if(success){
            this.ux.log('    /@');
            this.ux.log('    \\ \\');
            this.ux.log('  ___> \\');
            this.ux.log(' (__O)  \\');

            if(isChanged){
                this.ux.log('(____@)  \\       SUCCESS!');
            } else {
                this.ux.log('(____@)  \\       No Profiles Needed Cleaning');
            }
            
            this.ux.log('(____@)   \\');
            this.ux.log(' (__o)_    \\');
            this.ux.log('       \\    \\');
        }
    }).catch(errors => {
        success = false;
        this.ux.log(errors);
    })

    // Return an object to be displayed with --json
    return {
        'Profiles Needed Cleaning' : isChanged,
        'Success' : success
    };
  }
}