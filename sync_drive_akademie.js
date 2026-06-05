const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PARENT_FOLDER_ID = '1dvi9DrFVVqfT8wBA13e4u8D1V-0TtdUo';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const OUTPUT_FILE = path.join(__dirname, 'js', 'data', 'akademie_data.js');

async function syncDrive() {
    console.log("Starting Google Drive Sync...");
    
    const credentials = {
      "type": "service_account",
      "project_id": "gen-lang-client-0386601292",
      "private_key_id": "0763b46620f592e323f2153f3a94a21d2e63551c",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcNsVfasOnoLEU\nkOb5iOkrzgPeZkrUd2AxrDs+dFivlnehBsR06HBC0gy8i/CVKdTm4K4vvloNOajF\n8UpzWxgspwEPZ5tfHqzmeZnEoIwYu0QoQLTiHFwbO+K/oFplkH5jqIN3/4cEM0s/\nXq+FNMyR2bxNgraujkU0Qep0hU6AVUKCohT4771fSuafBfIgiY9nWeRHyffupJ9C\noeqjL6faCDFg0Dc08d4ocE8zcb+/UAZqOD+laVED8cKk+aRIWMg3pOD+uWL6m9q9\nJrlBUn3XO/1hJd/Z+REtSy1lVMzRErnSyH8NBTbg2CUaGLolqPUSIUs/rgCRftl2\nKfyU6xK9AgMBAAECggEAF90fmm15cmrpha8GOLhrfEHBDZLMPSYKmJdvfB8jlTOb\nFyoilAC0Wallk/EeSyvTVIm4lpfsLk63SWwSg1m1zvDyHnc90RsD5Z372eEEDZIN\nmscYUwB7wr/EnLuF0EfOSoJybMiWGxBr8RwTrT3BhXSxAT1PCq+ENFuISsQ/c4yW\nQ1Qp6CHP7bq5w6B/I9XEem8lMtp9E1/1Phb/TripD4+wSf5JorivkaMLWeahoIzS\nH4rxuqRhq3GHrIrpv2JrP8eFyHru8ZPubwwPvS+b7fYB4+qwXdYDWijkTH8lq2s2\nqgp73HUofeBOnn1jX6tdMsSWJsZpEvCqm+64QHv1QQKBgQD0Tm49DkW0NpvPNSdQ\nTvFjdZMAK9q+bhYxIiLdMXKrLEnP5Zs2JDsuApULdfGvGVuxvbOGWGgDi4R8z3ns\nkjTAjiY6eR+GSbGssyckQhB8boINOdSwy6r3y0Pfnzj26DW7nIwreq2RVa2LlRzf\ndrwnAjDhknNl1wcQBTVsGi15BQKBgQDmwSCxxOXeyP5pTDr0bLRZNg/cnI773j07\nX0e1EbZcxRMYPzSVwWaCykbvW6vqCUgT6/5MPW3cy93XPd4TeW7WxryFgOOiIjZh\njMGN4xfdBJego3B2MS8g8kbM94MQ3FwES2OxQf6mhAAeksDQxL4Oy+REpOsFFooK\n4Se+SWwAWQKBgQC+l9F44IGQrmmvpZAeHvhC157vK0dj+Q5nFnKMjd8fm1WaU05b\nVri0lF8iqcj7CZV3fL9pt96tpVKe7F36KbXt4vf/9i6Z3TQ3vyxyJPgnmy7qkotT\nwhCHcJRrCRSvy0jgLKlN4k82atkRZCs6Sq9O326zDEXq1W41GVssEuAW4QKBgA1s\nBl7QuR4wSrwNNxCokgTuZBXM9XQpBR7C+ATMNvNGc0nhw0lCqpfI9D9P8bv3Nj4S\naAQ/PnitUwYGDzjKw2uyu5x4VsVDgC5EZa2/G9A7SCaL2yrEyZz8+qlJbFI6vw9w\n4yeYUxuUaf1dQ+Hgz71Els53WUQ+f2EKn6kt1B5hAoGAKTz98NIo2T8lqJYEtq7O\nzytCAHV1+FL89Z+8ehkf92XTm+ymznYrN0EOFfZg2Spa52AmBQmHG0O52I+U/c9M\n3+dVIccDgbCoAz6yOu4TELeI+NalGjxQqi44WBgM9UyRXgAxH6yIekNDdkGv6wnI\nvY2grl6Imqjs6oahWlfObr4=\n-----END PRIVATE KEY-----\n",
      "client_email": "drive-sync-bot@gen-lang-client-0386601292.iam.gserviceaccount.com",
      "client_id": "104605514427070743760"
    };

    // Authenticate
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    try {
        // 1. Get subfolders in the parent folder
        const foldersRes = await drive.files.list({
            q: `'${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            orderBy: 'name'
        });
        
        const folders = foldersRes.data.files;
        if (!folders || folders.length === 0) {
            console.log("No subfolders found in the target directory.");
            return;
        }
        
        console.log(`Found ${folders.length} subfolders.`);
        const akademieData = [];
        
        // 2. Iterate each folder and get files
        for (const folder of folders) {
            console.log(`Scanning folder: ${folder.name}...`);
            
            // Only images and videos
            const filesRes = await drive.files.list({
                q: `'${folder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed=false`,
                fields: 'files(id, name, mimeType)',
                orderBy: 'name' // or createdTime
            });
            
            const files = filesRes.data.files || [];
            
            const mappedFiles = files.map(f => {
                let type = 'unknown';
                if (f.mimeType.startsWith('image/')) type = 'image';
                if (f.mimeType.startsWith('video/')) type = 'video';
                return {
                    id: f.id,
                    type: type
                };
            });
            
            // Create a chapter inside the folder object
            // The structure is: { name: "Folder Name", id: "folder_id", chapters: [{ title: "Main", files: [] }] }
            // Wait, looking at the previous structure, it was:
            // { name: "...", id: "...", files: [ ... ] } OR { name: "...", id: "...", chapters: [ { title: "...", files: [...] } ] }
            // Since it's a folder, we can map it as an area.
            
            akademieData.push({
                name: folder.name,
                id: folder.id,
                chapters: [
                    {
                        title: folder.name + " - Volume 1",
                        files: mappedFiles
                    }
                ]
            });
            console.log(` -> Found ${mappedFiles.length} files.`);
        }
        
        // 3. Write to akademie_data.js
        const jsContent = `const AkademieData = ${JSON.stringify(akademieData, null, 4)};\n`;
        fs.writeFileSync(OUTPUT_FILE, jsContent);
        
        console.log("✅ Successfully generated akademie_data.js");
        
    } catch (err) {
        console.error("Error during sync:", err.message);
    }
}

syncDrive();
