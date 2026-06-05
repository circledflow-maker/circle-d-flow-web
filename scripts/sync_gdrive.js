const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Read credentials from Environment Variable
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

async function sync() {
  console.log("Starting Google Drive Sync...");
  try {
    // 1. Find all top-level folders shared with the bot
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and sharedWithMe=true",
      fields: 'files(id, name)',
    });

    let sharedFolders = res.data.files;
    let artists = [];

    const akademieFolder = sharedFolders.find(f => f.name.toLowerCase() === 'akademie');
    if (akademieFolder) {
      console.log("Found 'Akademie' root folder. Fetching artists inside it...");
      const subRes = await drive.files.list({
        q: `'${akademieFolder.id}' in parents and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        orderBy: 'name'
      });
      artists = subRes.data.files;
    } else {
      artists = sharedFolders;
    }

    console.log(`Found ${artists.length} Artist folders.`);

    let akademieData = [];

    // 2. For each Artist, find Chapters (subfolders)
    for (const artist of artists) {
      console.log(`Processing Artist: ${artist.name}`);
      
      const artistEntry = {
        name: artist.name,
        id: artist.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        gdriveFolder: artist.id,
        chapters: []
      };

      // Get subfolders (Chapters)
      const subRes = await drive.files.list({
        q: `'${artist.id}' in parents and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        orderBy: 'name'
      });

      const chapters = subRes.data.files;

      if (chapters && chapters.length > 0) {
        for (const chapter of chapters) {
          const filesRes = await drive.files.list({
            q: `'${chapter.id}' in parents and mimeType!='application/vnd.google-apps.folder'`,
            fields: 'files(id, name, mimeType)',
            orderBy: 'name'
          });

          const files = filesRes.data.files.map(f => ({
            id: f.id,
            type: f.mimeType.includes('video') ? 'video' : 'image'
          }));

          artistEntry.chapters.push({
            title: chapter.name,
            files: files
          });
        }
      } else {
        // No chapters, just files in the root of the artist folder
        const filesRes = await drive.files.list({
          q: `'${artist.id}' in parents and mimeType!='application/vnd.google-apps.folder'`,
          fields: 'files(id, name, mimeType)',
          orderBy: 'name'
        });

        artistEntry.files = filesRes.data.files.map(f => ({
          id: f.id,
          type: f.mimeType.includes('video') ? 'video' : 'image'
        }));
      }

      akademieData.push(artistEntry);
    }

    // 3. Write back to akademie_data.js
    const outputPath = path.join(__dirname, '../js/data/akademie_data.js');
    const fileContent = `const AkademieData = ${JSON.stringify(akademieData, null, 4)};`;
    
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log("akademie_data.js successfully updated!");

  } catch (err) {
    console.error("API Error:", err.message);
    process.exit(1);
  }
}

sync();
