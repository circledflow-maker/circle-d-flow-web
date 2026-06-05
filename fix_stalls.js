const fs = require('fs');
const path = require('path');

const files = [
    'sound_stall.html',
    'skills_stall.html',
    'healing_stall.html',
    'services_stall.html',
    'product_stall.html'
];

const pagesDir = path.join('D:', 'circle-d-flow-web', 'pages');

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}, not found.`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Fix CSS
    const oldCss = `.shop-container {\r?\n\\s*display: grid;\r?\n\\s*grid-template-columns: 450px 1fr;\r?\n\\s*height: 100vh;\r?\n\\s*padding-top: 64px;\r?\n\\s*}`;
    const newCss = `.shop-container {
            display: grid;
            grid-template-columns: 450px 1fr;
            height: 100vh;
            padding-top: 64px;
            overflow: hidden;
        }

        @media (max-width: 768px) {
            .shop-container {
                grid-template-columns: 1fr;
                grid-template-rows: auto 1fr;
                overflow-y: auto;
            }
            .merchant-side {
                height: 50vh;
                min-height: 400px;
                border-right: none;
                border-bottom: 1px solid rgba(255, 174, 66, 0.2);
            }
            .inventory-side {
                padding: 20px;
                overflow-y: visible;
            }
            body {
                overflow-y: auto;
            }
        }`;
    content = content.replace(new RegExp(oldCss, 'g'), newCss);

    // 2. Fix Header HTML
    content = content.replace('<div class="fixed top-6 left-6 z-[100]">', '<div class="fixed top-4 left-4 lg:top-6 lg:left-6 z-[101]">');
    content = content.replace(/<header class="fixed top-0 w-full z-\[100\] h-16 grid grid-cols-\[1fr_2fr_1fr\] items-center px-8 bg-black\/90(.*?)"/g, '<header class="fixed top-0 w-full z-[100] h-16 flex lg:grid lg:grid-cols-[1fr_2fr_1fr] items-center px-4 lg:px-8 bg-black/90$1 justify-between lg:justify-start"');
    content = content.replace('<div class="flex justify-start">', '<div class="hidden lg:flex justify-start">');
    content = content.replace(/<span class="material-symbols-outlined">arrow_back<\/span>(\s*)<span class="text-\[10px\] font-bold uppercase tracking-widest">Back to Village<\/span>/g, '<span class="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>$1<span class="text-[10px] font-bold uppercase tracking-widest">Back</span>');
    content = content.replace('<div class="flex justify-center">', '<div class="flex justify-center ml-12 lg:ml-0">');
    content = content.replace(/<h1 class="font-cinzel font-bold text-lg/g, '<h1 class="font-cinzel font-bold text-base lg:text-lg');
    content = content.replace('<div class="flex justify-end gap-6 items-center">', '<div class="flex justify-end gap-2 lg:gap-6 items-center">');
    content = content.replace('<div class="text-right">', '<div class="text-right hidden sm:block">');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
