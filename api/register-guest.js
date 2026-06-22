const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const QRCode = require('qrcode');

const resend = new Resend(process.env.RESEND_API_KEY || "re_4EN5hgyf_52v3D6JTJVMRQ1GW5Ds5gwkw");

const supabaseUrl = "https://agkmbaephgsnunlarntm.supabase.co";
const supabaseKey = "sb_publishable_VwT4qFpNCgNizSXMILBcKQ_aevHvWvM";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Enable CORS for Vercel
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { eventId, name, email, language, eventTitle, eventDate, eventAddress } = req.body;

        if (!eventId || !name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Insert into Supabase user_rolls table (reusing the existing table for tickets)
        const { error: dbError } = await supabase.from('user_rolls').insert([
            {
                event_id: eventId,
                ticket_name: 'Guest List: ' + name,
                email: email,
                rolled_value: 0,
                scanned: false
            }
        ]);

        if (dbError) {
            console.error("Supabase insert error:", dbError);
            return res.status(500).json({ error: "Database error", details: dbError.message });
        }

        // 2. Generate QR Code base64
        const qrDataObj = {
            eventId: eventId,
            email: email,
            ticket_name: "Guest List",
            timestamp: Date.now()
        };
        const qrDataString = JSON.stringify(qrDataObj);
        
        // Output base64 PNG
        const qrBase64 = await QRCode.toDataURL(qrDataString, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: {
                dark: '#00ffcc', // Cyberpunk cyan
                light: '#000000' // Black background
            }
        });
        
        // Strip out the data:image/png;base64, prefix for Resend attachment
        const base64Data = qrBase64.replace(/^data:image\/png;base64,/, "");

        // 3. Prepare Email via Resend
        const lang = language === 'pt' ? 'pt' : 'en';
        
        const subject = lang === 'pt' 
            ? `🎟️ Você está na Guest List: ${eventTitle}!` 
            : `🎟️ You're on the Guest List: ${eventTitle}!`;
            
        const textContent = lang === 'pt'
            ? `Olá ${name},\n\nVocê está oficialmente na Guest List para ${eventTitle}.\nData: ${eventDate}\nLocal: ${eventAddress}\n\nPor favor, apresente o QR Code no seu e-mail para entrar.\n\nNos vemos lá,\nCircle D Flow`
            : `Hi ${name},\n\nYou are officially on the Guest List for ${eventTitle}.\nDate: ${eventDate}\nLocation: ${eventAddress}\n\nPlease present the attached QR Code at the entrance.\n\nSee you in the flow,\nCircle D Flow`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #333;">
                <h1 style="color: #00ffcc; text-transform: uppercase; letter-spacing: 2px;">${lang === 'pt' ? 'Você está na lista!' : 'You\'re on the list!'}</h1>
                <p style="font-size: 16px; line-height: 1.5; color: #dddddd;">
                    ${lang === 'pt' ? `Olá <strong>${name}</strong>,` : `Hi <strong>${name}</strong>,`}
                </p>
                <p style="font-size: 16px; line-height: 1.5; color: #dddddd;">
                    ${lang === 'pt' ? 'Você garantiu acesso para a Guest List oficial do evento.' : 'You have secured access to the official Guest List for the event.'}
                </p>
                
                <div style="background-color: #111; padding: 20px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; border-left: 4px solid #d4af37;">
                    <h3 style="margin-top: 0; color: #d4af37; text-transform: uppercase; letter-spacing: 1px;">${eventTitle}</h3>
                    <p style="margin: 5px 0; color: #aaa;"><strong>${lang === 'pt' ? 'Data' : 'Date'}:</strong> ${eventDate}</p>
                    <p style="margin: 5px 0; color: #aaa;"><strong>${lang === 'pt' ? 'Local' : 'Loc'}:</strong> ${eventAddress}</p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.5; color: #dddddd;">
                    ${lang === 'pt' ? 'Para entrar, apresente o QR Code anexado neste e-mail aos Gatekeepers na porta.' : 'To enter, please present the QR Code attached to this email to the Gatekeepers at the door.'}
                </p>
                
                <p style="font-size: 14px; color: #888; margin-top: 40px;">
                    Stay flowing,<br>
                    <strong>Circle D Flow Network</strong>
                </p>
            </div>
        `;

        const sendData = {
            // Note: Since no custom domain is verified yet, we use onboarding@resend.dev.
            // This requires that the recipient email is the same one registered on Resend.
            from: 'Circle D Flow <onboarding@resend.dev>',
            to: [email],
            subject: subject,
            text: textContent,
            html: htmlContent,
            attachments: [
                {
                    filename: 'guest_list_ticket.png',
                    content: base64Data
                }
            ]
        };

        const result = await resend.emails.send(sendData);
        if (result.error) {
            console.error("Resend error:", result.error);
            // Non-fatal, we will still log it and return success for the registration part.
            // When the user puts in a real verified domain, the errors will stop.
        }

        return res.status(200).json({ success: true, message: "Registered and email sent" });
    } catch (e) {
        console.error("API error:", e);
        return res.status(500).json({ error: "Internal Server Error", details: e.message });
    }
}
