require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const axios = require('axios');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const generateFlashcards = async (content) => {
  const prompt = `Summarize and generate 5 flashcards from this content.
Each flashcard format: { "question": "...", "answer": "...", "difficulty": "Easy/Medium/Hard" }
Content: ${content}`;

  const response = await axios.post(
    'https://api.together.xyz/v1/chat/completions',
    {
      model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const rawText = response.data.choices[0].message.content;
  const jsonStart = rawText.indexOf('[');
  const jsonEnd = rawText.lastIndexOf(']') + 1;
  const jsonString = rawText.substring(jsonStart, jsonEnd);

  return JSON.parse(jsonString);
};

app.post('/generate-flashcards', async (req, res) => {
  try {
    const { type, content } = req.body;
    if (type !== 'text') return res.status(400).json({ error: 'Invalid type' });

    const flashcards = await generateFlashcards(content);
    res.json({ flashcards });
  } catch (error) {
    console.error('Error generating from text:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

app.post('/generate-flashcards/pdf', upload.single('file'), async (req, res) => {
  try {
    const data = await pdfParse(fs.readFileSync(req.file.path));
    const flashcards = await generateFlashcards(data.text.slice(0, 3000));
    fs.unlinkSync(req.file.path);
    res.json({ flashcards });
  } catch (error) {
    console.error('Error generating from PDF:', error);
    res.status(500).json({ error: 'Failed to generate flashcards from PDF' });
  }
});

app.post('/generate-flashcards/voice', upload.single('file'), async (req, res) => {
  try {
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1"
    });

    const flashcards = await generateFlashcards(transcript.text);
    fs.unlinkSync(req.file.path);
    res.json({ flashcards });
  } catch (error) {
    console.error('Error generating from voice:', error);
    res.status(500).json({ error: 'Failed to generate flashcards from voice' });
  }
});

app.get('/', (req, res) => {
  res.send("Flashcard Generator Backend is Running 🚀");
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
