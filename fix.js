const fs = require('fs');

const files = ['pages/live_lab.html', 'pages/outbreak_tunes.html'];

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        
        content = content.replace(
            /alert\(`Welcome to the Bracket, \$\{name\}!\\n\\nDJ Qter has received your data.`\);/g,
            "alert(`Welcome to the Bracket, ${name}!\\n\\nDJ Qter has received your data.`);\n                window.location.href = '../index.html';"
        );
        
        content = content.replace(
            /alert\(`Welcome to the Bracket, \$\{name\}!\\n\\nPrepare your tracks. DJ Qter will summon you soon.`\);/g,
            "alert(`Welcome to the Bracket, ${name}!\\n\\nPrepare your tracks. DJ Qter will summon you soon.`);\n                window.location.href = '../index.html';"
        );
        
        fs.writeFileSync(file, content, 'utf8');
        console.log("Updated " + file);
    } catch (e) {
        console.error("Error updating " + file, e);
    }
});
