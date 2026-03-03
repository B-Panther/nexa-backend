const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, type } = req.body;

    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        if (type === 'image') {
            return res.status(200).json({
                imageUrl: "https://via.placeholder.com/1024x1024?text=Gemini+Text+Generation",
                note: "Gemini doesn't generate images. Using placeholder."
            });
            
        } else {
            // CORRECT ENDPOINT: using v1 instead of v1beta
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const geminiResponse = response.data.candidates[0].content.parts[0].text;

            return res.status(200).json({
                response: geminiResponse
            });
        }

    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        
        // If model not found, suggest alternatives
        if (error.response?.status === 404) {
            return res.status(500).json({
                error: "Model not found. Try: gemini-1.5-pro, gemini-1.5-flash, or gemini-2.0-flash-exp"
            });
        }
        
        return res.status(error.response?.status || 500).json({
            error: error.response?.data || "Failed to process request"
        });
    }
};
