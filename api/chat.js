const Bytez = require('bytez.js');

// Initialize Bytez SDK with your API key from environment
let sdk;
try {
    const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY;
    if (!BYTEZ_API_KEY) {
        throw new Error('BYTEZ_API_KEY not configured');
    }
    sdk = new Bytez(BYTEZ_API_KEY);
    console.log('Bytez SDK initialized successfully');
} catch (error) {
    console.error('Failed to initialize Bytez SDK:', error.message);
}

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

    const { prompt, type, modelId = 'Qwen/Qwen3-4B' } = req.body;

    try {
        if (!sdk) {
            return res.status(500).json({ 
                error: 'Bytez SDK not initialized',
                details: 'API key configuration error'
            });
        }

        let result;

        // Handle different types of requests
        switch (type) {
            case 'image':
                // Image generation
                const imageModel = sdk.model('dreamlike-art/dreamlike-photoreal-2.0');
                const imageResult = await imageModel.run(prompt);
                
                return res.status(200).json({
                    response: "Image generated",
                    imageUrl: imageResult.output,
                    model: 'dreamlike-art/dreamlike-photoreal-2.0'
                });

            case 'caption':
                // Image captioning
                const captionModel = sdk.model('Salesforce/blip-image-captioning-base');
                const captionResult = await captionModel.run({
                    url: prompt // Expecting image URL in prompt
                });
                
                return res.status(200).json({
                    response: captionResult.output,
                    model: 'Salesforce/blip-image-captioning-base'
                });

            case 'translation':
                // Translation
                const translationModel = sdk.model('Helsinki-NLP/opus-mt-en-zh');
                const translationResult = await translationModel.run(prompt);
                
                return res.status(200).json({
                    response: translationResult.output,
                    model: 'Helsinki-NLP/opus-mt-en-zh'
                });

            case 'ner':
                // Named Entity Recognition
                const nerModel = sdk.model('dslim/bert-base-NER');
                const nerResult = await nerModel.run(prompt);
                
                return res.status(200).json({
                    response: JSON.stringify(nerResult.output),
                    model: 'dslim/bert-base-NER'
                });

            case 'audio':
                // Speech recognition
                const audioModel = sdk.model('facebook/data2vec-audio-base-960h');
                const audioResult = await audioModel.run({
                    url: prompt // Expecting audio URL in prompt
                });
                
                return res.status(200).json({
                    response: audioResult.output,
                    model: 'facebook/data2vec-audio-base-960h'
                });

            case 'video':
                // Video generation
                const videoModel = sdk.model('ali-vilab/text-to-video-ms-1.7b');
                const videoResult = await videoModel.run(prompt);
                
                return res.status(200).json({
                    response: "Video generated",
                    videoUrl: videoResult.output,
                    model: 'ali-vilab/text-to-video-ms-1.7b'
                });

            default:
                // Default text chat
                const chatModel = sdk.model(modelId);
                
                // Prepare chat format
                const input = [
                    {
                        role: "system",
                        content: "You are Nexa, a friendly and helpful AI assistant. You respond in a conversational, helpful manner."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ];

                // Optional: Add streaming support
                const stream = req.body.stream || false;
                
                if (stream) {
                    // For streaming responses
                    const readStream = await chatModel.run(input, true);
                    
                    res.setHeader('Content-Type', 'text/plain');
                    let fullText = '';
                    
                    for await (const tokens of readStream) {
                        fullText += tokens;
                        res.write(tokens);
                    }
                    
                    res.end();
                } else {
                    // Regular response
                    const result = await chatModel.run(input, {
                        temperature: 0.7,
                        max_tokens: 500
                    });

                    return res.status(200).json({
                        response: result.output,
                        model: modelId
                    });
                }
        }

    } catch (error) {
        console.error('Bytez API Error:', error.message);
        
        return res.status(500).json({
            error: 'Failed to process request',
            details: error.message,
            type: type || 'chat'
        });
    }
};
