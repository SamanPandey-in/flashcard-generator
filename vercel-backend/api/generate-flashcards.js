import axios from 'axios';

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

  const { type, content } = req.body;
  
  if (!content || type !== 'text') {
    return res.status(400).json({ error: 'Invalid input or unsupported type' });
  }

  try {
    const prompt = `Generate exactly 5 flashcards from this content. Return ONLY a valid JSON array with no extra text.
Each flashcard should have this exact format: {"question": "...", "answer": "...", "difficulty": "Easy"}
Choose difficulty as Easy, Medium, or Hard based on concept complexity.
Content: ${content}`;

    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
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

    console.log("Generated flashcards:", validatedFlashcards);
    
    return res.status(200).json({ 
      flashcards: validatedFlashcards,
      success: true,
      count: validatedFlashcards.length 
    });

  } catch (error) {
    console.error("Error in API:", error);
    return res.status(500).json({ 
      error: 'Failed to generate flashcards',
      details: error.message 
    });
  }
}
