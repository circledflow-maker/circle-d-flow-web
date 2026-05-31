const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

export default async function handler(req, res) {
    try {
        const credentialsPath = path.join(process.cwd(), 'credentials.json');
        const tokenPath = path.join(process.cwd(), 'token.json');

        if (!fs.existsSync(credentialsPath) || !fs.existsSync(tokenPath)) {
            return res.status(500).json({ error: "Google Drive Credentials not found." });
        }

        const credentials = JSON.parse(fs.readFileSync(credentialsPath));
        const token = JSON.parse(fs.readFileSync(tokenPath));

        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token);

        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        // Find "Akademie" folder
        const folderResponse = await drive.files.list({
            q: "name='Akademie' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        if (folderResponse.data.files.length === 0) {
            return res.status(404).json({ error: "Akademie folder not found in Google Drive." });
        }

        const akademieFolderId = folderResponse.data.files[0].id;

        // Find all artist subfolders
        const subfoldersResponse = await drive.files.list({
            q: `'${akademieFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });

        const artists = subfoldersResponse.data.files;
        const result = {
            "Artist": []
        };

        // For each artist, find images
        // To avoid Vercel timeouts, we'll run these in parallel with Promise.all
        const fetchPromises = artists.map(async (artist) => {
            const imagesResponse = await drive.files.list({
                q: `'${artist.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed=false`,
                fields: 'files(id, name, mimeType, webContentLink, webViewLink)',
                spaces: 'drive'
            });

            return {
                artistName: artist.name,
                files: imagesResponse.data.files
            };
        });

        const artistFolders = await Promise.all(fetchPromises);

        // Map to Portfolio format
        let idCounter = 0;
        for (const folder of artistFolders) {
            for (const file of folder.files) {
                // webContentLink allows direct download, but to view without proxy, we can use uc?id=
                const directUrl = `https://drive.google.com/uc?id=${file.id}`;
                
                result["Artist"].push({
                    id: `gdrive_artist_${idCounter++}`,
                    name: file.name,
                    professional_name: folder.artistName,
                    url: directUrl,
                    tags: [folder.artistName.toLowerCase().replace(/\s+/g, '_'), "artist", "akademie"]
                });
            }
        }

        // Cache control to speed up subsequent requests (Vercel Edge Cache)
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error connecting to Google Drive:", error);
        return res.status(500).json({ error: "Error fetching data from Google Drive.", details: error.message });
    }
}
