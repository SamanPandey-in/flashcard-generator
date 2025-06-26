// /api/generate-flashcards-pdf.js
import axios from 'axios';
import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import fs from 'fs';

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
    // Parse the uploaded file
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(file.filepath);
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    console.log(`Extracted ${extractedText.length} characters from PDF`);

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ error: 'PDF contains insufficient text content' });
    }

    // Truncate text if too long (AI APIs have token limits)
    const maxLength = 8000;
    const contentToProcess = extractedText.length > maxLength 
      ? extractedText.substring(0, maxLength) + '...'
      : extractedText;

    // Generate flashcards using AI
    const prompt = `Generate exactly 5-8 flashcards from this PDF content. Return ONLY a valid JSON array with no extra text.
Each flashcard should have this exact format: {"question": "...", "answer": "...", "difficulty": "Easy"}
Choose difficulty as Easy, Medium, or Hard based on concept complexity.
Focus on the most important concepts and facts.
PDF Content: ${contentToProcess}`;

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

    console.log("Generated flashcards from PDF:", validatedFlashcards);
    
    return res.status(200).json({ 
      flashcards: validatedFlashcards,
      success: true,
      count: validatedFlashcards.length,
      source: 'PDF',
      extractedLength: extractedText.length
    });

  } catch (error) {
    console.error("Error in PDF processing:", error);
    return res.status(500).json({ 
      error: 'Failed to process PDF and generate flashcards',
      details: error.message 
    });
  }
}
