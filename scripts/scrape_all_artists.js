const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const folders = [
    { name: "A Day with Rui", gdrive: "1crgVRzjOIedbtf1RrgFCRzQaYMIciCv5" },
    { name: "Alen", gdrive: "1Pf6Fp6LF63nuBTB0wv3qH9EQzPS4AUWF" },
    { name: "Alterlife", gdrive: "18XtQbCY1pyYVANRqf2OX4-ODi4rJXr9k" },
    { name: "AnnaLubbingeArt", gdrive: "1pgpFcKB5Jv9fb8R3iFE5IOpV-uyou5gz" },
    { name: "C Riz", gdrive: "1gntd-LvGXMN3jOsiifqPzdfCVGKhsGzs" },
    { name: "Circle D Flow Clips", gdrive: "186A9Wuqq9-DfADfWQtLp4Cih2FEWWGmY" },
    { name: "Diasmarcall", gdrive: "1TBAiImBCui1VHSft2JAodvcXoqCAKoYO" },
    { name: "DJ Qter", gdrive: "17vW_TYS4wthvPQJkzcfBbC7MmDz7FSF-" },
    { name: "Enock", gdrive: "1kGdpPY1uulIgkN9q8gI0VhYHeamjrWZo" },
    { name: "Felipe Saxophone", gdrive: "1oqp9ZjJ851X8KzWEtsb3md5JM4dIuNqd" },
    { name: "GemsbyKimbo", gdrive: "1tqqsLvCDCqTopZZXCI5Sz_EA_IOucZQ_" },
    { name: "Ingrid", gdrive: "1sqF3XgJsgIeimREnm5eblsKC_tRwsq0S" },
    { name: "Irene 25 Birthday", gdrive: "10AReatvo2twiQrfJm_MQ9LaDTiBlNpH_" },
    { name: "KreativlonArt", gdrive: "1IJccVePiniN1YP0znpH_XT0i0eqyASk-" },
    { name: "Naru the Token", gdrive: "11Wr8HkAXSHewNxfsoclMCrOQHgANuQ-l" },
    { name: "Natalia", gdrive: "1PQX3fASvyMeeaqZX1SZovluFRRTqRyYw" },
    { name: "NewDart", gdrive: "1XKU7lVBpozSlWsT3JAMUP6VS2vnUYVZH" },
    { name: "Odis", gdrive: "1zZMuDk_yi0J6GDHXID7bhT4GQiKhdqGR" },
    { name: "OG Flow", gdrive: "1i06xuswoy75Hhqgg2BhNmLyD0jKT6YKH" },
    { name: "Rayan", gdrive: "1zQirr9syKBRZRz7pOB4Bk2V6M5VddkmH" },
    { name: "Rebelroots", gdrive: "1gry2WEiLBXWFOMxFyS3CuqFv2UvJas45" },
    { name: "Ricky Secret Garden LX", gdrive: "1xvfdDsUA8s8C_J0iHiPfuaPfvUqt5UlJ" },
    { name: "Sandu", gdrive: "1iLgoxnGgjy3VAkU1DD1gVZcpPwFLGzWB" },
    { name: "soqhiejewels", gdrive: "1noZs793lQIPZk540TkwY47fGcyrA8-Ly" },
    { name: "Tiago Silver", gdrive: "1h3rkbrzvz_bMdNknX3rfxo1ElRP870eg" }
];

(async () => {
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    
    let akademieData = [];

    for (let folder of folders) {
        const page = await browser.newPage();
        const url = `https://drive.google.com/drive/folders/${folder.gdrive}?usp=drive_link`;
        console.log(`Navigating to ${folder.name} (${folder.gdrive})...`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2' });
            
            // Scroll down a bit to load items
            await page.evaluate(() => {
                window.scrollBy(0, document.body.scrollHeight);
            });
            await new Promise(r => setTimeout(r, 2000));
            
            const fileIds = await page.evaluate(() => {
                // Find all elements that look like files in the list view or grid view
                const els = document.querySelectorAll('div[data-id]');
                const ids = new Set();
                els.forEach(el => {
                    const id = el.getAttribute('data-id');
                    if (id && id.length > 20) {
                        ids.add(id);
                    }
                });
                return Array.from(ids);
            });
            
            // Filter out the folder ID itself if it was caught
            const filteredIds = fileIds.filter(id => id !== folder.gdrive);
            const selectedIds = filteredIds.slice(0, 11);
            
            console.log(`Found ${filteredIds.length} files for ${folder.name}. Selected ${selectedIds.length}.`);
            
            akademieData.push({
                name: folder.name,
                id: folder.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                gdriveFolder: folder.gdrive,
                files: selectedIds
            });
        } catch (e) {
            console.error(`Error scraping ${folder.name}:`, e);
            akademieData.push({
                name: folder.name,
                id: folder.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                gdriveFolder: folder.gdrive,
                files: []
            });
        }
        await page.close();
    }
    
    await browser.close();

    const outputContent = `const AkademieData = ${JSON.stringify(akademieData, null, 4)};\n\nwindow.AkademieData = AkademieData;`;
    const outputPath = path.join(__dirname, '../js/data/akademie_data.js');
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    console.log("Successfully generated akademie_data.js with file IDs!");
})();
