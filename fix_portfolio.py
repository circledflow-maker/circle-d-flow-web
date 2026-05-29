import re

file_path = r'D:\circle-d-flow-web\pages\portfolio_anime_reality.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the About Us link in the mobile menu
content = content.replace('<a href="#about" onclick="document.getElementById(\\\'burger-btn\\\').click();"', '<a href="about.html"')
content = content.replace('<a href="#about" onclick="document.getElementById(\'burger-btn\').click();"', '<a href="about.html"')

# 2. Fix the assets reference error. 
# The problematic code is:
#             updateWeeklyFlowBanner(); renderGrid();
# 
#             // Update Page Meta Info
#             const pageCaption = document.querySelector('.pt-\\[40px\\] p');
# ...
#             if (!assets || assets.length === 0) {
# ...
#                 return;
#             }

error_block_pattern = r"updateWeeklyFlowBanner\(\);\s*renderGrid\(\);\s*// Update Page Meta Info\s*const pageCaption.*?return;\s*\}"

def replace_error_block(match):
    # We just completely remove this block because it's duplicating logic that should be in renderGrid,
    # and it causes a ReferenceError.
    return "updateWeeklyFlowBanner(); renderGrid();"

content = re.sub(error_block_pattern, replace_error_block, content, flags=re.DOTALL)

# And now inject the pageCaption update logic INSIDE renderGrid, right before `if (topVideos.length > 0) {`
inject_target = "if (topVideos.length > 0) {"

correct_caption_logic = """
    // Update Page Meta Info
    const pageCaption = document.querySelector('.pt-\\\\[40px\\\\] p');
    if (pageCaption) {
        pageCaption.innerHTML = `
            A real-time reflection of the 3D Master Node.<br>
            Category: ${activeCategory} | Payload: ${assets.length} Traces.
        `;
    }
    
    if (assets.length === 0) {
        grid.innerHTML = `
            <div class="swiper-slide !w-full !max-w-2xl text-center py-20 px-8 bg-transparent border-none shadow-none flex justify-center items-center">
                <div>
                    <div class="mono opacity-50 mb-6 font-bold text-lg">NEURAL CALIBRATION IN PROGRESS</div>
                    <p class="mono opacity-40 text-xs mb-8">Segment [${activeCategory}] yielded 0 traces.</p>
                </div>
            </div>
        `;
        // Even if empty, start the auto-gatekeeper timer
        triggerNexusGatekeeper("Noch keine Schätze in dieser Kategorie? <br>Lass uns gemeinsam etwas neues erschaffen.");
        document.getElementById('video-carousel').style.display = 'none';
        return;
    }

    if (topVideos.length > 0) {"""

content = content.replace(inject_target, correct_caption_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed portfolio_anime_reality.html")
