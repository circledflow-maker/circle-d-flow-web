// js/order_modal.js
const orderModalHTML = `
<div id="order-modal-backdrop" class="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[200] flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-300">
    <div class="bg-[#1a1a1a] border border-[#d4af37]/50 shadow-[0_0_20px_rgba(212,175,55,0.3)] rounded-xl p-6 w-11/12 max-w-sm relative transform scale-95 transition-transform duration-300" id="order-modal-content">
        <button onclick="closeOrderModal()" class="absolute top-3 right-3 text-white/50 hover:text-[#d4af37] transition-colors">
            <span class="material-symbols-outlined">close</span>
        </button>
        <h3 class="text-xl font-cinzel text-[#d4af37] mb-4 text-center tracking-widest">Handshake Protocol</h3>
        
        <div id="order-item-details" class="flex items-center gap-4 mb-6 bg-black/40 p-3 rounded-lg border border-white/10">
            <img id="order-item-img" src="" class="w-16 h-16 object-cover rounded-md border border-[#d4af37]/30">
            <div>
                <h4 id="order-item-title" class="text-white font-bold text-sm"></h4>
                <p id="order-item-price" class="text-[#d4af37] text-xs mt-1"></p>
            </div>
        </div>

        <div id="order-loading" class="text-center py-4 hidden">
            <span class="material-symbols-outlined animate-spin text-[#d4af37] text-3xl">sync</span>
            <p class="text-xs text-white/50 mt-2 font-mono uppercase tracking-widest">Locating Merchant...</p>
        </div>

        <div id="order-actions" class="space-y-3 hidden">
            <p class="text-xs text-white/70 text-center mb-4">The merchant prefers to connect directly via <span id="merchant-pref" class="text-[#d4af37] font-bold"></span>.</p>
            <a id="order-btn-wa" href="#" target="_blank" class="hidden w-full bg-[#25D366]/20 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-black py-3 rounded text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2">
                Connect on WhatsApp
            </a>
            <a id="order-btn-ig" href="#" target="_blank" class="hidden w-full bg-[#E1306C]/20 border border-[#E1306C] text-[#E1306C] hover:bg-[#E1306C] hover:text-white py-3 rounded text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2">
                Connect on Instagram
            </a>
            <p id="order-btn-ig-hint" class="hidden text-[10px] text-white/50 text-center mt-1">Please mention the artifact name in your DM.</p>
            
            <div id="order-fallback" class="hidden text-center">
                <p class="text-xs text-red-400 border border-red-500/30 bg-red-500/10 p-3 rounded">Merchant contact details unavailable.</p>
            </div>
        </div>
    </div>
</div>
`;

document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', orderModalHTML);
});

async function openOrderModal(itemStr) {
    let item;
    try {
        item = JSON.parse(decodeURIComponent(itemStr));
    } catch(e) {
        console.error("Failed to parse item data", e);
        return;
    }

    const backdrop = document.getElementById('order-modal-backdrop');
    const content = document.getElementById('order-modal-content');
    
    document.getElementById('order-item-img').src = item.image_url || '../Assets/images/default_artifact.png';
    document.getElementById('order-item-title').textContent = item.title || item.name || 'Unknown Artifact';
    document.getElementById('order-item-price').textContent = `${item.price_credits || item.price_fc || 0} FC`;

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    content.classList.remove('scale-95');
    
    document.getElementById('order-actions').classList.add('hidden');
    document.getElementById('order-loading').classList.remove('hidden');

    // Default msg
    const msg = `Hey! I am reaching out from the Circle D Flow Bazaar. Is the artifact [${item.title || item.name}] still available?`;
    const encodedMsg = encodeURIComponent(msg);

    let method = 'whatsapp'; // Default fallback
    let detail = '';

    // If item has seller_id, fetch profile
    if (item.seller_id && item.seller_id !== 'undefined') {
        try {
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('preferred_contact_method, contact_details')
                .eq('id', item.seller_id)
                .single();
                
            if (data) {
                method = (data.preferred_contact_method || 'whatsapp').toLowerCase();
                detail = data.contact_details || '';
            }
        } catch(e) {}
    }

    // Optional: Log order intent
    logOrderIntent(item);

    document.getElementById('order-loading').classList.add('hidden');
    document.getElementById('order-actions').classList.remove('hidden');
    
    document.getElementById('merchant-pref').textContent = method.toUpperCase();
    
    const waBtn = document.getElementById('order-btn-wa');
    const igBtn = document.getElementById('order-btn-ig');
    const igHint = document.getElementById('order-btn-ig-hint');
    const fallback = document.getElementById('order-fallback');

    waBtn.classList.add('hidden');
    igBtn.classList.add('hidden');
    igHint.classList.add('hidden');
    fallback.classList.add('hidden');

    if (!detail) {
        // Mock fallback if db has no details but we want to show it works
        detail = method === 'instagram' ? 'circle.d.flow' : '351912345678';
    }

    if (method === 'whatsapp' || method === 'wa') {
        waBtn.href = `https://wa.me/${detail.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
        waBtn.classList.remove('hidden');
    } else if (method === 'instagram' || method === 'ig') {
        igBtn.href = `https://ig.me/m/${detail.replace('@', '')}`;
        igBtn.classList.remove('hidden');
        igHint.classList.remove('hidden');
    } else {
        fallback.classList.remove('hidden');
    }
}

function closeOrderModal() {
    const backdrop = document.getElementById('order-modal-backdrop');
    const content = document.getElementById('order-modal-content');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    content.classList.add('scale-95');
}

async function logOrderIntent(item) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            await window.supabaseClient.from('order_intents').insert({
                product_id: item.id,
                buyer_id: user.id,
                product_title: item.title || item.name,
                created_at: new Date().toISOString()
            });
        }
    } catch(e) {
        console.log("Analytics logging skipped/failed", e);
    }
}
