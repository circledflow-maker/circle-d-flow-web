module.exports = async function handler(req, res) {
    try {
        const client_id = process.env.GDRIVE_CLIENT_ID;
        const client_secret = process.env.GDRIVE_CLIENT_SECRET;
        const refresh_token = process.env.GDRIVE_REFRESH_TOKEN;

        // Fallback for local development if env vars are missing (optional)
        if (!client_id || !client_secret || !refresh_token) {
            return res.status(500).json({ 
                error: "Google Drive Credentials missing.",
                details: "Please add GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, and GDRIVE_REFRESH_TOKEN to Vercel Environment Variables." 
            });
        }

        // 1. Get Access Token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id,
                client_secret,
                refresh_token,
                grant_type: "refresh_token"
            })
        });
        
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
        }
        
        const accessToken = tokenData.access_token;

        // Helper function for Drive API
        const driveFetch = async (url) => {
            const resp = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!resp.ok) throw new Error(`Drive API Error: ${resp.statusText}`);
            return await resp.json();
        };

        // 2. Find "Akademie" folder
        const qFolder = encodeURIComponent("name='Akademie' and mimeType='application/vnd.google-apps.folder' and trashed=false");
        const folderResponse = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${qFolder}&fields=files(id,name)&spaces=drive`);

        if (!folderResponse.files || folderResponse.files.length === 0) {
            return res.status(404).json({ error: "Akademie folder not found in Google Drive." });
        }

        const akademieFolderId = folderResponse.files[0].id;

        // 3. Find all artist subfolders
        const qSubfolders = encodeURIComponent(`'${akademieFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
        const subfoldersResponse = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${qSubfolders}&fields=files(id,name)&spaces=drive`);

        const artists = subfoldersResponse.files || [];
        const result = {
            "Artist": []
        };

        let idCounter = 0;

        for (const artist of artists) {
            // Find everything directly under this Artist folder
            const qContents = encodeURIComponent(`'${artist.id}' in parents and trashed=false`);
            const contentsResponse = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${qContents}&fields=files(id,name,mimeType)&spaces=drive`);
            const contents = contentsResponse.files || [];

            const directFiles = contents.filter(f => f.mimeType.includes('image/') || f.mimeType.includes('video/'));
            const chapterFolders = contents.filter(f => f.mimeType === 'application/vnd.google-apps.folder');

            // 1. Add direct files as "Full Portfolio" chapter
            for (const file of directFiles) {
                const directUrl = `https://drive.google.com/uc?id=${file.id}`;
                result["Artist"].push({
                    id: `gdrive_artist_${idCounter++}`,
                    name: file.name,
                    professional_name: artist.name,
                    chapter_name: "Full Portfolio",
                    url: directUrl,
                    tags: [artist.name.toLowerCase().replace(/\s+/g, '_'), "artist", "akademie"]
                });
            }

            // 2. Add files from subfolders as their specific chapters
            for (const chapterFolder of chapterFolders) {
                const qChapterFiles = encodeURIComponent(`'${chapterFolder.id}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed=false`);
                const chapterFilesResponse = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${qChapterFiles}&fields=files(id,name,mimeType)&spaces=drive`);
                const chapterFiles = chapterFilesResponse.files || [];
                
                for (const file of chapterFiles) {
                    const directUrl = `https://drive.google.com/uc?id=${file.id}`;
                    result["Artist"].push({
                        id: `gdrive_artist_${idCounter++}`,
                        name: file.name,
                        professional_name: artist.name,
                        chapter_name: chapterFolder.name,
                        url: directUrl,
                        tags: [artist.name.toLowerCase().replace(/\s+/g, '_'), "artist", "akademie"]
                    });
                }
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
