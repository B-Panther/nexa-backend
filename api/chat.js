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
        // Gemini API key from environment variable
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        if (type === 'image') {
            // For images, we'll use a placeholder since Gemini doesn't generate images
            // You could integrate with another image API here
            return res.status(200).json({
                imageUrl: "https://via.placeholder.com/1024x1024?text=Gemini+Text+Generation",
                note: "Gemini doesn't generate images. Using placeholder."
            });
            
        } else {
            // Gemini text generation
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

            // Extract the response text
            const geminiResponse = response.data.candidates[0].content.parts[0].text;

            return res.status(200).json({
                response: geminiResponse
            });
        }

    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        
        return res.status(error.response?.status || 500).json({
            error: error.response?.data || "Failed to process request"
        });
    }
};
