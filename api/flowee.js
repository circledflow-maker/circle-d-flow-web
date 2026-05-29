// Vercel Serverless Function to securely proxy Gemini API for Flowee
// Deploy this to Vercel (folder: api/flowee.js)

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const body = await req.json();
        const { messages, domState, currentUrl, userSession } = body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Gemini API Key missing in backend' }), { status: 500 });
        }

        // System Prompt providing Context Awareness and Agentic capabilities
        const systemPrompt = `Du bist Flowee, ein State-of-the-Art AI Agent aus dem Jahr 2026 für die "Circle D Flow" Plattform.
Deine Aufgaben:
1. Tiefes Kontext-Bewusstsein: Der User befindet sich gerade auf URL: ${currentUrl}.
2. DOM Status: ${JSON.stringify(domState)}
3. User Session: ${JSON.stringify(userSession)}

Dein Ziel ist es nicht nur zu antworten, sondern dem User UI-Aktionen anzubieten. 
Wenn der User z.B. fragt "Wie erstelle ich ein Event?", antworte nicht nur mit Text, sondern antworte mit JSON-Befehlen, um das UI zu steuern!
Du kannst folgende Aktionen in deiner Antwort einbetten:
- [[HIGHLIGHT:#element-id]] -> Markiert ein Element auf der Website
- [[SCROLLTO:#element-id]] -> Scrollt zu einem Element
- [[ACTION:CREATE_EVENT]] -> Löst die Event-Erstellung aus
- [[WIDGET:EVENT_LIST]] -> Zeigt ein dynamisches Widget im Chat an

Antworte freundlich, auf den Punkt und nutze Aktionen, wenn sie hilfreich sind.`;

        // Format for Gemini API (v1beta)
        const geminiMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Insert System prompt as first instruction if supported, or prepend to first message
        geminiMessages.unshift({
            role: 'user',
            parts: [{ text: "SYSTEM PROMPT: " + systemPrompt }]
        });
        geminiMessages.unshift({
            role: 'model',
            parts: [{ text: "Verstanden. Ich bin Flowee." }]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: geminiMessages })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gemini Error');

        const replyText = data.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ reply: replyText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Flowee Backend Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
