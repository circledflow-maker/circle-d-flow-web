const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PARENT_FOLDER_ID = '1dvi9DrFVVqfT8wBA13e4u8D1V-0TtdUo';
const OUTPUT_FILE = path.join(__dirname, '..', 'js', 'data', 'akademie_data.js');

async function syncDrive() {
    console.log("Starting Google Drive Sync...");
    
    const credentialsStr = process.env.GDRIVE_SERVICE_ACCOUNT_KEY;
    if (!credentialsStr) {
      console.error("Missing GDRIVE_SERVICE_ACCOUNT_KEY");
      process.exit(1);
    }
    const credentials = JSON.parse(credentialsStr);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    try {
        const foldersRes = await drive.files.list({
            q: `'${PARENT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            orderBy: 'name'
        });
        
        const folders = foldersRes.data.files;
        if (!folders || folders.length === 0) return;
        
        let artists = [...folders];
        let akademieData = [];

        // Inject manual overrides from the user
        const manualArtists = [
          { name: 'Alen', id: '1Bh0px3AfJC9QbYJUUdA3gSsVhahnHAIv' },
          { name: 'C Riz', id: '15uz3yZYpc_ZrcWweedLGtZA1dECCjrgQ' },
          { name: 'Naru the Token', id: '1V3okQhtQgswdLz5zXtteC_qMo4wSH0Jc' },
          { name: 'KreativlonArt', id: '1e-CgH7ws3KPa9YzyBDyBTdVqi-3RAqJL' }
        ];

        for (const ma of manualArtists) {
          const existingIdx = artists.findIndex(a => a.name.toLowerCase() === ma.name.toLowerCase() || a.name.toLowerCase() === 'alan');
          if (existingIdx >= 0) {
            artists[existingIdx] = ma;
          } else {
            artists.push(ma);
          }
        }
        
        for (const folder of artists) {
            console.log(`Scanning Artist: ${folder.name}...`);
            let chapters = [];
            
            // 1. Check for files directly in the artist folder (treat as Chapter 1)
            const directFilesRes = await drive.files.list({
                q: `'${folder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed=false`,
                fields: 'files(id, name, mimeType)',
                orderBy: 'name'
            });
            const directFiles = directFilesRes.data.files || [];
            if (directFiles.length > 0) {
                chapters.push({
                    title: "Main Portfolio",
                    files: directFiles.map(f => ({
                        id: f.id,
                        type: f.mimeType.startsWith('video/') ? 'video' : 'image'
                    }))
                });
            }
            
            // 2. Check for subfolders (each subfolder is a chapter)
            const subfoldersRes = await drive.files.list({
                q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                orderBy: 'name'
            });
            const subfolders = subfoldersRes.data.files || [];
            
            for (const subfolder of subfolders) {
                const subFilesRes = await drive.files.list({
                    q: `'${subfolder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed=false`,
                    fields: 'files(id, name, mimeType)',
                    orderBy: 'name'
                });
                const subFiles = subFilesRes.data.files || [];
                if (subFiles.length > 0) {
                    chapters.push({
                        title: subfolder.name,
                        files: subFiles.map(f => ({
                            id: f.id,
                            type: f.mimeType.startsWith('video/') ? 'video' : 'image'
                        }))
                    });
                }
            }
            
            if (chapters.length > 0) {
                akademieData.push({
                    name: folder.name,
                    id: folder.id,
                    chapters: chapters
                });
                console.log(` -> Found ${chapters.length} chapters for ${folder.name}`);
            } else {
                console.log(` -> Folder ${folder.name} is completely empty! Skipping.`);
            }
        }
        
        const jsContent = `const AkademieData = ${JSON.stringify(akademieData, null, 4)};\n`;
        fs.writeFileSync(OUTPUT_FILE, jsContent);
        
        console.log("Successfully generated akademie_data.js");
        
    } catch (err) {
        console.error("Error during sync:", err.message);
    }
}

syncDrive();
