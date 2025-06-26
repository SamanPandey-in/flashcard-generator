import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, content } = req.body;

  if (type !== 'text' || !content) {
    return res.status(400).json({ error: 'Invalid input type or content' });
  }

  try {
    const prompt = `Summarize and generate 5 flashcards from this content.
Each flashcard format: { "question": "...", "answer": "...", "difficulty": "Easy/Medium/Hard" }
Content: ${content}`;

    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const rawText = response.data.choices[0].message.content;
    const jsonStart = rawText.indexOf('[');
    const jsonEnd = rawText.lastIndexOf(']') + 1;
    const jsonString = rawText.substring(jsonStart, jsonEnd);
    const flashcards = JSON.parse(jsonString);

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error('❌ API error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
}