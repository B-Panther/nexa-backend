const axios = require('axios');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, type } = req.body;

    try {
        let response;
        
        if (type === 'image') {
            // DALL-E 3 API
            response = await axios.post('https://api.openai.com/v1/images/generations', {
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return res.status(200).json({ 
                imageUrl: response.data.data[0].url 
            });
            
        } else {
            // Using GPT-4.1 Mini as requested
            response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4.1-mini",  // Updated to GPT-4.1 Mini
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return res.status(200).json({ 
                response: response.data.choices[0].message.content 
            });
        }
        
    } catch (error) {
        console.error('OpenAI API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 429) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded. Please try again later.' 
            });
        }
        
        return res.status(error.response?.status || 500).json({ 
            error: 'Failed to process request' 
        });
    }
}
