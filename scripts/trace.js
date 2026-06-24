const fs = require('fs');
const code = fs.readFileSync('D:/circle-d-flow-web/scripts/check2.js', 'utf8');
let depth = 0;
const lines = code.split('\n');
for(let i=0; i<lines.length; i++) {
    let l = lines[i];
    // basic string replacement to not count braces inside strings
    l = l.replace(/`[^`]*`/g, '``').replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''").replace(/\/\/.*/g, '');
    let op = (l.match(/\{/g) || []).length;
    let cl = (l.match(/\}/g) || []).length;
    depth += op - cl;
    console.log(String(i+1).padStart(4), String(depth).padStart(2), lines[i].trim().substring(0, 50));
}
