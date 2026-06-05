const fs = require('fs');

let html = fs.readFileSync('pages/marketplace-upload.html', 'utf8');

if (!html.includes('swiper-bundle.min.css')) {
    html = html.replace('</head>', '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />\n</head>');
}
if (!html.includes('swiper-bundle.min.js')) {
    html = html.replace('</body>', '    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>\n    <script>\n        if(window.innerWidth < 768) {\n            new Swiper(".uploadSwiper", {\n                slidesPerView: 1,\n                spaceBetween: 30,\n                pagination: { el: ".swiper-pagination", clickable: true }\n            });\n        }\n    </script>\n</body>');
}

// Wrap the whole parchment content in a form so all inputs are submitted
// Current: <div class="parchment-scroll..."><div class="LEFT"></div><form class="CENTER+RIGHT">...</form></div>
// Change to: <form id="upload-form" class="parchment-scroll swiper uploadSwiper..."><div class="swiper-wrapper flex md:flex-row..."><div class="swiper-slide LEFT"></div><div class="swiper-slide CENTER"></div><div class="swiper-slide RIGHT"></div></div><div class="swiper-pagination md:hidden"></div></form>

if (!html.includes('uploadSwiper')) {
    // 1. Replace parchment scroll div with form
    html = html.replace('<div class="parchment-scroll w-full max-w-7xl h-full max-h-[85vh] p-8 flex flex-col md:flex-row gap-8 overflow-y-auto md:overflow-hidden">', 
                        '<form id="upload-form" class="parchment-scroll swiper uploadSwiper w-full max-w-7xl h-full max-h-[85vh] p-8 pb-12 overflow-hidden">\n            <div class="swiper-wrapper flex md:flex-row h-full md:h-auto md:gap-8">');

    // 2. Add swiper-slide to Left column
    html = html.replace('<div class="w-full md:w-1/4 flex flex-col border-b md:border-b-0 md:border-r border-[#8B4513]/20 pb-6 md:pb-0 md:pr-6 shrink-0">',
                        '<div class="swiper-slide w-full md:w-1/4 flex flex-col border-b md:border-b-0 md:border-r border-[#8B4513]/20 pb-6 md:pb-0 md:pr-6 shrink-0 h-auto overflow-y-auto hide-scrollbar">');

    // 3. Remove the old form wrapper for Center & Right
    html = html.replace('<form id="upload-form" class="w-full md:w-3/4 flex flex-col md:flex-row gap-8">',
                        '<!-- Form wrapper removed, center and right are siblings to left -->');
    html = html.replace('</form>\n        </div>', '</div><div class="swiper-pagination md:hidden !bottom-2"></div>\n        </form>');

    // 4. Add swiper-slide to Center column
    html = html.replace('<div class="w-full md:w-1/2 h-64 md:h-full relative flex flex-col shrink-0">',
                        '<div class="swiper-slide w-full md:w-[37.5%] h-64 md:h-full relative flex flex-col shrink-0 h-auto">');

    // 5. Add swiper-slide to Right column
    html = html.replace('<div class="w-full md:w-1/2 flex flex-col h-full space-y-5">',
                        '<div class="swiper-slide w-full md:w-[37.5%] flex flex-col h-full space-y-5 h-auto overflow-y-auto hide-scrollbar">');
}

fs.writeFileSync('pages/marketplace-upload.html', html);
console.log('Fixed marketplace-upload.html');
