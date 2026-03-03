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
        let response;

        if (type === 'image') {

            response = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    model: "gpt-image-1",
                    prompt: prompt,
                    size: "1024x1024"
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return res.status(200).json({
                imageUrl: response.data.data[0].url
            });

        } else {

            response = await axios.post(
                'https://api.openai.com/v1/responses',
                {
                    model: "gpt-4.1-mini",
                    input: prompt
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return res.status(200).json({
                response: response.data.output[0].content[0].text
            });
        }

    } catch (error) {
        console.error(error.response?.data || error.message);

        return res.status(error.response?.status || 500).json({
            error: error.response?.data || "Failed to process request"
        });
    }
};
