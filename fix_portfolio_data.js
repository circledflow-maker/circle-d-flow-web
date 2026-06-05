const fs = require('fs');
let html = fs.readFileSync('pages/portfolio_anime_reality.html', 'utf8');

// Add the script import
if (!html.includes('akademie_data.js')) {
    html = html.replace('<script src="../js/data/portfolio_data.js?v=flow_matrix_v3"></script>', '<script src="../js/data/akademie_data.js"></script>\n    <script src="../js/data/portfolio_data.js?v=flow_matrix_v3"></script>');
    html = html.replace('<script src="../js/data/portfolio_data.js"></script>', '<script src="../js/data/akademie_data.js"></script>\n    <script src="../js/data/portfolio_data.js"></script>');
}

// Remove the fetch entirely and keep only the local fallback
const fetchBlockStart = html.indexOf('// Load fallback AkademieData first');
if (fetchBlockStart !== -1) {
    const fetchOverrideStart = html.indexOf('// Fetch dynamic GDrive content for Artists to override fallback');
    if (fetchOverrideStart !== -1) {
        const catchIndex = html.indexOf("catch(err => console.error('Error fetching dynamic Akademie data, using fallback:', err));", fetchOverrideStart);
        if (catchIndex !== -1) {
            const endIndex = catchIndex + "catch(err => console.error('Error fetching dynamic Akademie data, using fallback:', err));".length;
            html = html.slice(0, fetchOverrideStart) + html.slice(endIndex);
        }
    }
}

fs.writeFileSync('pages/portfolio_anime_reality.html', html);
console.log('Fixed portfolio_anime_reality.html');
