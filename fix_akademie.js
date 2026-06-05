const fs = require('fs');
let html = fs.readFileSync('pages/akademie.html', 'utf8');

const oldGrouping = `                    const grouped = {};
                    data.Artist.forEach(item => {
                        if (!grouped[item.professional_name]) {
                            grouped[item.professional_name] = {
                                id: item.professional_name.toLowerCase().replace(/\\s+/g, '_'),
                                name: item.professional_name,
                                is_gdrive: true,
                                data: { files: [] }
                            };
                            allAreas.push(grouped[item.professional_name]);
                        }
                        // Add file to artist's files array
                        grouped[item.professional_name].data.files.push({
                            id: item.url.split('id=')[1] || item.url.split('/d/')[1].split('/preview')[0],
                            type: item.name.toLowerCase().endsWith('.mp4') ? 'video' : 'image',
                            name: item.name
                        });
                    });`;

const newGrouping = `                    const grouped = {};
                    data.Artist.forEach(item => {
                        if (!grouped[item.professional_name]) {
                            grouped[item.professional_name] = {
                                id: item.professional_name.toLowerCase().replace(/\\s+/g, '_'),
                                name: item.professional_name,
                                is_gdrive: true,
                                data: { chapters: [] }
                            };
                            allAreas.push(grouped[item.professional_name]);
                        }
                        
                        let chapter = grouped[item.professional_name].data.chapters.find(c => c.title === (item.chapter_name || 'Full Portfolio'));
                        if (!chapter) {
                             chapter = { title: item.chapter_name || 'Full Portfolio', files: [] };
                             grouped[item.professional_name].data.chapters.push(chapter);
                        }

                        chapter.files.push({
                            id: item.url.split('id=')[1] || item.url.split('/d/')[1]?.split('/preview')[0],
                            type: item.name.toLowerCase().endsWith('.mp4') || item.type === 'video' ? 'video' : 'image',
                            name: item.name
                        });
                    });`;

if(html.includes('data: { files: [] }')) {
    html = html.replace(oldGrouping, newGrouping);
    fs.writeFileSync('pages/akademie.html', html);
    console.log('Fixed akademie grouping');
} else {
    console.log('Already fixed or different structure');
}
