const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching Puppeteer to debug the door objects...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Relay console logs
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    await page.goto('http://localhost:3000/Index.html');
    await page.waitForTimeout(2000);

    // Call skip intro
    await page.evaluate(() => {
        if(window.OrbitEngine) window.OrbitEngine.skipIntro();
    });
    console.log("Skipped Intro. Waiting for orbit to settle...");
    await page.waitForTimeout(3000);

    // Click visionary leaf
    await page.evaluate(() => {
        const leaf = window.OrbitEngine.leaves.find(l => l.userData.id === 'visionary');
        if(leaf) {
            console.log("Found Visionary Leaf. Diving...");
            window.OrbitEngine.transitionToLuvo(leaf);
        }
    });

    console.log("Transition triggered. Waiting 5s for animation to finish...");
    await page.waitForTimeout(5000);

    // Dump door objects
    const doorState = await page.evaluate(() => {
        const engine = window.OrbitEngine;
        if (!engine) return "OrbitEngine not found";
        
        const returnPivot = engine.doors.find(p => p.userData.doorType === 'return');
        if (!returnPivot) return "Doors not found in engine.doors array";
        
        const group = returnPivot.parent;
        const groupScale = { x: group.scale.x, y: group.scale.y, z: group.scale.z };
        const groupPos = { x: group.position.x, y: group.position.y, z: group.position.z };
        
        let doorMesh = null;
        let frameMesh = null;

        group.children.forEach(child => {
            if (child.isMesh && child.geometry.type === 'BoxGeometry') frameMesh = child;
        });
        
        returnPivot.children.forEach(child => {
            if (child.isMesh) doorMesh = child;
        });

        const camPos = { x: engine.camera.position.x, y: engine.camera.position.y, z: engine.camera.position.z };

        return {
            cameraPosition: camPos,
            groupScale,
            groupPos,
            doorScale: doorMesh ? {x: doorMesh.scale.x, y: doorMesh.scale.y, z: doorMesh.scale.z} : null,
            frameScale: frameMesh ? {x: frameMesh.scale.x, y: frameMesh.scale.y, z: frameMesh.scale.z} : null,
            doorGeoParams: doorMesh && doorMesh.geometry ? doorMesh.geometry.parameters : null,
            frameGeoParams: frameMesh && frameMesh.geometry ? frameMesh.geometry.parameters : null,
            doorMaterial: doorMesh ? {
                type: doorMesh.material.type,
                color: doorMesh.material.color.getHexString(),
                opacity: doorMesh.material.opacity,
                transparent: doorMesh.material.transparent
            } : null
        };
    });

    console.log("\n====== DOOR STATE IN BROWSER ======");
    console.log(JSON.stringify(doorState, null, 2));
    
    await browser.close();
})();
