# 📚 Flashcard Generator (Fullstack AI-powered)

An AI-powered mobile and web-friendly Flashcard Generator built with **React.js (Frontend)** and **Node.js + Express (Backend)**.

## Features

- 🤖 **AI-Powered Generation**: Uses Groq AI to create intelligent flashcards
- 📄 **PDF Support**: Extract text from PDF files and generate flashcards
- 🎵 **Audio Transcription**: Convert audio recordings to flashcards (Using OpenAI's Whisper API)
- 🔗 **Additional Weblinks**: Provides additional weblinks with answer for better understanding.
- 🔒 **Security**: Rate limiting, CORS protection, and input validation
- 📊 **Enhanced Logging**: Comprehensive logging with different levels
- 🧹 **Auto Cleanup**: Automatic cleanup of temporary files
- ⚡ **Performance**: Compression, caching headers, and optimized processing
---

## 🏗️ Project Structure

```
flashcard-generator/
├──client/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.svg
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── MobileFlashcardGenerator.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .gitignore
├──server/
│   ├── server.js             # Main server file
│   ├── package.json          # Dependencies and scripts
│   ├── .env.example          # Environment template
│   ├── .eslintrc.js          # Code style rules
│   ├── .gitignore            # Git ignore rules
│   ├── README.md             # This file
│   └── uploads/              # Temporary file storage (auto-created)

```

---

## ⚙️ Backend Setup (Express + OpenAI API):

## Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Groq AI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flashcard-generator.git
   cd flashcard-generator/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   GROQ_API_KEY=your_groq_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```
Backend runs at: `http://localhost:5000` or at the deployed web-link

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `GROQ_API_KEY` | - | **Required** Groq AI API key |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |

### Limits

- **File Size**: 25MB maximum
- **Content Length**: 50,000 characters maximum
- **Flashcards**: 25 cards maximum per request
- **Rate Limit**: 50 requests per 15 minutes
- **File Cleanup**: Files older than 1 hour are automatically removed

## Supported File Types

### PDF Files
- `.pdf` files with extractable text
- Non-encrypted PDFs only
- Maximum 25MB file size

### Audio Files
- `.wav`, `.mp3`, `.m4a`, `.ogg`, `.webm`
- Maximum 25MB file size
- Currently uses placeholder transcription (see Audio Transcription Setup)

---

## ⚛️ Frontend Setup (React.js):

## Installation

1. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   REACT_APP_API_URL=http://localhost:5000 //or backend link
   ```

3. **Run client locally**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```
Frontend runs at: `http://localhost:3000` or at the deployed web-link

---

### Adding New Features

1. **New Endpoints**: Add routes before error handling middleware
2. **File Processing**: Extend `FileManager` class
3. **AI Services**: Extend `GroqAIService` class or create new service classes
4. **Validation**: Add validation middleware for new endpoints

## Error Handling

The server includes comprehensive error handling:

- **Validation Errors**: 400 status with detailed messages
- **File Errors**: Specific messages for file type, size, and processing issues
- **AI Service Errors**: Timeout, rate limit, and API key errors
- **Server Errors**: 500 status with optional details in development

## Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable allowed origins
- **Helmet Security**: Security headers
- **Input Validation**: File type and size validation
- **Error Sanitization**: No sensitive data in production errors

## Monitoring and Logging

The server includes structured logging:

- **Request Logging**: All API requests with timing
- **Error Logging**: Detailed error information
- **Performance Metrics**: Processing times and file sizes
- **Debug Logging**: Detailed information in development mode
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

### 🔹 Deploy Frontend on [Vercel](https://vercel.com) (FREE):

1. Create New Site → Import from GitHub.
2. Root Directory: `/client`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `client/build`
5. Env Var: `REACT_APP_API_URL=https://flashcard-api.onrender.com`

Frontend URL example: `https://flashcard-app.netlify.app`

---

## 🧪 Testing Live

1. Visit **Vercel Frontend URL**
2. Upload Text/PDF/Voice
3. Enjoy AI-generated flashcards 🎉

---
## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add tests for new features
5. Submit a pull request
---

## 👨‍💻 Author

Built by Saman Pandey and Ruturaj Rajwade with Groq API and OpenAI APIs.

---

## ✨ Want help deploying? DM or raise an issue!
