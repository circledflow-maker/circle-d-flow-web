const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Go to the GDrive public link
    const url = "https://drive.google.com/drive/folders/15uz3yZYpc_ZrcWweedLGtZA1dECCjrgQ?usp=drive_link";
    console.log("Navigating to", url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Scroll down a bit to load items
    await page.evaluate(() => {
        window.scrollBy(0, 1000);
    });
    
    // Wait for the drive file items to appear
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Evaluating page...");
    // Extract file IDs from elements with data-id or similar attributes
    const files = await page.evaluate(() => {
        // GDrive usually puts the file ID in a data-id attribute on c-wiz or div elements
        const elements = document.querySelectorAll('[data-id]');
        const ids = new Set();
        elements.forEach(el => {
            const id = el.getAttribute('data-id');
            if (id && id.length > 25 && id.length < 40) {
                ids.add(id);
            }
        });
        return Array.from(ids);
    });
    
    console.log(`Found ${files.length} file IDs.`);
    
    if (files.length > 0) {
        // Pick up to 13 files
        const selected = files.slice(0, 13);
        console.log("Selected 13 IDs:", selected);
        
        // Update portfolio_data.js directly!
        const dataFile = 'D:/circle-d-flow-web/js/data/portfolio_data.js';
        let content = fs.readFileSync(dataFile, 'utf8');
        
        // We will regex replace the "Artist" array
        // We need to build the new Artist array string
        const artistItems = selected.map((id, index) => {
            return {
                id: `gdrive_criz_${index}`,
                name: `C-Riz Image ${index+1}`,
                professional_name: 'C-Riz',
                url: `https://drive.google.com/uc?export=view&id=${id}`,
                tags: ["artist", "flow"]
            };
        });
        
        // Parse the existing JS by stripping "window.PortfolioData = "
        const jsonStr = content.replace('window.PortfolioData = ', '').replace(/;$/, '');
        const data = JSON.parse(jsonStr);
        
        // Replace Artist category
        data['Artist'] = artistItems;
        
        const newContent = `window.PortfolioData = ${JSON.stringify(data, null, 4)};`;
        fs.writeFileSync(dataFile, newContent, 'utf8');
        console.log("Successfully updated portfolio_data.js with GDrive IDs!");
    } else {
        console.log("No file IDs found. The DOM structure might be different or it requires login.");
    }
    
    await browser.close();
})();
