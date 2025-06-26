// /api/generate-flashcards-voice.js
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    // Parse the uploaded audio file
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB limit for audio
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    // Validate file type (common audio formats)
    const allowedTypes = [
      'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 
      'audio/webm', 'audio/ogg', 'audio/m4a'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Unsupported audio format. Please use WAV, MP3, or WebM files.' 
      });
    }

    console.log(`Processing audio file: ${file.originalFilename}, size: ${file.size} bytes`);

    // Transcribe audio using OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.filepath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // You can make this configurable
    formData.append('response_format', 'text');

    const transcriptionResponse = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const transcribedText = transcriptionResponse.data;
    console.log(`Transcribed text (${transcribedText.length} characters):`, transcribedText.substring(0, 200));

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    if (!transcribedText || transcribedText.trim().length < 20) {
      return res.status(400).json({ error: 'Audio contains insufficient content for flashcard generation' });
    }

    // Generate flashcards using AI
    const prompt = `Generate exactly 5-7 flashcards from this transcribed audio content. Return ONLY a valid JSON array with no extra text.
Each flashcard should have this exact format: {"question": "...", "answer": "...", "difficulty": "Easy"}
Choose difficulty as Easy, Medium, or Hard based on concept complexity.
Focus on the key points, concepts, and facts mentioned.
Transcribed Content: ${transcribedText}`;

    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let flashcards = [];
    const rawText = response.data.choices[0].message.content;
    console.log("Raw AI response:", rawText);

    try {
      // Try to parse as direct JSON first
      flashcards = JSON.parse(rawText);
    } catch (parseError) {
      // If that fails, try to extract JSON from the text
      const jsonStart = rawText.indexOf('[');
      const jsonEnd = rawText.lastIndexOf(']') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonString = rawText.substring(jsonStart, jsonEnd);
        flashcards = JSON.parse(jsonString);
      } else {
        throw new Error('Could not extract valid JSON from AI response');
      }
    }

    // Add unique IDs and validate structure
    const validatedFlashcards = flashcards.map((card, index) => ({
      id: Date.now() + index,
      question: card.question || 'Question not provided',
      answer: card.answer || 'Answer not provided',
      difficulty: ['Easy', 'Medium', 'Hard'].includes(card.difficulty) ? card.difficulty : 'Medium'
    }));

    console.log("Generated flashcards from voice:", validatedFlashcards);
    
    return res.status(200).json({ 
      flashcards: validatedFlashcards,
      success: true,
      count: validatedFlashcards.length,
      source: 'Voice',
      transcribedLength: transcribedText.length,
      transcription: transcribedText.substring(0, 500) + (transcribedText.length > 500 ? '...' : '')
    });

  } catch (error) {
    console.error("Error in voice processing:", error);
    
    // More specific error handling
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        error: 'OpenAI API key is invalid or missing',
        details: 'Please check your OPENAI_API_KEY environment variable'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to process audio and generate flashcards',
      details: error.message 
    });
  }
}
