
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

const generateFlashcards = async (content) => {
  const prompt = \`Summarize and generate 5 flashcards from this content. 
  Each flashcard format: { "question": "...", "answer": "...", "difficulty": "Easy/Medium/Hard" }\nContent: \${content}\`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  const rawText = completion.data.choices[0].message.content;
  const jsonStart = rawText.indexOf('[');
  const jsonEnd = rawText.lastIndexOf(']') + 1;
  return JSON.parse(rawText.substring(jsonStart, jsonEnd));
};

app.post('/generate-flashcards', async (req, res) => {
  const { type, content } = req.body;
  if (type !== 'text') return res.status(400).json({ error: 'Invalid type' });
  const flashcards = await generateFlashcards(content);
  res.json({ flashcards });
});

app.post('/generate-flashcards/pdf', upload.single('file'), async (req, res) => {
  const data = await pdfParse(fs.readFileSync(req.file.path));
  const flashcards = await generateFlashcards(data.text.slice(0, 3000));
  fs.unlinkSync(req.file.path);
  res.json({ flashcards });
});

app.post('/generate-flashcards/voice', upload.single('file'), async (req, res) => {
  const transcript = await openai.createTranscription(
    fs.createReadStream(req.file.path),
    "whisper-1"
  );
  const flashcards = await generateFlashcards(transcript.data.text);
  fs.unlinkSync(req.file.path);
  res.json({ flashcards });
});

app.listen(port, () => console.log(\`Server running on port \${port}\`));
