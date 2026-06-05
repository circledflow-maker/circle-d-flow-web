const fs = require('fs');

// 1. Fix Flowee chat window (Sprechblase) going off-screen
let floweePath = 'js/agents/flowee_2026.js';
if (fs.existsSync(floweePath)) {
    let flowee = fs.readFileSync(floweePath, 'utf8');
    // Replace the fixed width and right position with responsive classes
    flowee = flowee.replace(
        "chat.className = 'fixed bottom-24 right-6 w-80 h-[500px] max-h-[80vh] bg-black/95",
        "chat.className = 'fixed bottom-24 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-80 h-[500px] max-h-[75vh] bg-black/95"
    );
    fs.writeFileSync(floweePath, flowee);
    console.log("Fixed flowee_2026.js responsiveness");
}

// 2. Add switch function to marketplace-stall.html
let stallPath = 'pages/marketplace-stall.html';
if (fs.existsSync(stallPath)) {
    let stall = fs.readFileSync(stallPath, 'utf8');
    
    // Add the Next/Prev buttons below the stats
    const buttonsHTML = `
                <!-- Switch Stalls -->
                <div class="mt-6 flex justify-center md:justify-start gap-4">
                    <button onclick="switchStall(-1)" class="px-4 py-2 border border-[#FFAE42]/30 text-[#FFAE42] text-xs font-bold uppercase tracking-widest hover:bg-[#FFAE42] hover:text-black transition-colors rounded">
                        <span class="material-symbols-outlined text-sm align-middle mr-1">chevron_left</span> Prev Stall
                    </button>
                    <button onclick="switchStall(1)" class="px-4 py-2 border border-[#FFAE42]/30 text-[#FFAE42] text-xs font-bold uppercase tracking-widest hover:bg-[#FFAE42] hover:text-black transition-colors rounded">
                        Next Stall <span class="material-symbols-outlined text-sm align-middle ml-1">chevron_right</span>
                    </button>
                </div>
    `;
    
    // Insert after the stats grid
    if (!stall.includes('switchStall(-1)')) {
        stall = stall.replace('</div>\r\n            </div>\r\n            \r\n            <!-- STATS BLOCK (Desktop) -->', buttonsHTML + '\r\n            </div>\r\n            </div>\r\n            \r\n            <!-- STATS BLOCK (Desktop) -->');
        // Handle alternative line endings
        stall = stall.replace('</div>\n            </div>\n            \n            <!-- STATS BLOCK (Desktop) -->', buttonsHTML + '\n            </div>\n            </div>\n            \n            <!-- STATS BLOCK (Desktop) -->');
        
        // Add JS function
        const jsFunc = `
        async function switchStall(direction) {
            try {
                // Get unique vendors from market_items
                const { data, error } = await window.supabaseClient.from('market_items').select('vendor_id');
                if (error) throw error;
                
                const uniqueVendors = [...new Set(data.map(i => i.vendor_id))];
                if (uniqueVendors.length <= 1) return alert("No other stalls found.");
                
                const urlParams = new URLSearchParams(window.location.search);
                const currentVendor = urlParams.get('vendor');
                
                let idx = uniqueVendors.indexOf(currentVendor);
                if (idx === -1) idx = 0;
                
                idx += direction;
                if (idx < 0) idx = uniqueVendors.length - 1;
                if (idx >= uniqueVendors.length) idx = 0;
                
                window.location.href = 'marketplace-stall.html?vendor=' + uniqueVendors[idx];
            } catch(e) {
                console.error("Error switching stall:", e);
            }
        }
        
        window.onload = loadVendorStall;
        `;
        stall = stall.replace('window.onload = loadVendorStall;', jsFunc);
        
        fs.writeFileSync(stallPath, stall);
        console.log("Added stall switcher to marketplace-stall.html");
    }
}
