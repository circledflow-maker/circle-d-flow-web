const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Go to the Akademie GDrive public link
    const url = "https://drive.google.com/drive/folders/1dvi9DrFVVqfT8wBA13e4u8D1V-0TtdUo?usp=drive_link";
    console.log("Navigating to", url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for the main content
    await new Promise(r => setTimeout(r, 5000));
    
    const elements = await page.evaluate(() => {
        // Find all folder elements
        const divs = Array.from(document.querySelectorAll('div[role="row"]'));
        return divs.map(d => d.innerText.split('\n')[0]).filter(t => t && t.trim().length > 0);
    });
    
    console.log("Found folders:", elements);
    await browser.close();
})();
