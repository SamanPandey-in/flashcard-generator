# 📚 Flashcard Generator (Fullstack AI-powered)

An AI-powered mobile-friendly Flashcard Generator built with **React.js (Frontend)** and **Node.js + Express (Backend)**.

### Features:

* 📝 Text, 📄 PDF, 🎤 Voice Input (Whisper Transcription)
* GPT-based Flashcard Generation (OpenAI API)
* Export, Shuffle, Edit, Delete flashcards

---

## 🏗️ Project Structure

```
flashcard-generator/
├── client/             # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── MobileFlashcardGenerator.js
│   ├── public/
│   ├── package.json
│   └── .env.sample
├── server/             # Node.js backend
│   ├── server.js
│   ├── package.json
│   ├── uploads/
│   └── .env.sample
└── README.md           # This file
```

---

## ⚙️ Backend Setup (Express + OpenAI API)

### 1. Install dependencies:

```bash
cd server
npm install
```

### 2. Create `.env` in `/server`:

```
OPENAI_API_KEY=your-real-openai-key
```

### 3. Run server locally:

```bash
node server.js
```

Backend runs at: `http://localhost:5000`

---

## ⚛️ Frontend Setup (React)

### 1. Install dependencies:

```bash
cd client
npm install
```

### 2. Create `.env` in `/client`:

```
REACT_APP_API_URL=http://localhost:5000
```

### 3. Run client locally:

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🚀 Deploy Guide (FREE)

### 🔹 Deploy Backend on [Render](https://render.com) (FREE):

1. Push repo to GitHub.
2. Create **New Web Service** → **Deploy from GitHub**.
3. Root Directory: `/server`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add Env Var: `OPENAI_API_KEY=your-openai-key`

Backend URL example: `https://flashcard-api.onrender.com`

---

### 🔹 Deploy Frontend on [Netlify](https://netlify.com) (FREE):

1. Create New Site → Import from GitHub.
2. Root Directory: `/client`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `client/build`
5. Env Var: `REACT_APP_API_URL=https://flashcard-api.onrender.com`

Frontend URL example: `https://flashcard-app.netlify.app`

---

## 🧪 Testing Live

1. Visit **Netlify Frontend URL**
2. Upload Text/PDF/Voice
3. Enjoy AI-generated flashcards 🎉

---

## 💡 Notes

* Whisper voice transcription by OpenAI Whisper model
* PDF parsing via `pdf-parse`
* GPT-4o flashcard generation

---

## 📃 License

MIT License

---

## 👨‍💻 Author

Built by Saman Pandey with ❤️ and OpenAI APIs.

---

## ✨ Want help deploying? DM or raise an issue!
