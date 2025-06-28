# Flashcard Generator Server

A robust Node.js server that generates educational flashcards from text, PDF files, and audio recordings using AI technology (Grok AI).

## Features

- 🤖 **AI-Powered Generation**: Uses Grok AI to create intelligent flashcards
- 📄 **PDF Support**: Extract text from PDF files and generate flashcards
- 🎵 **Audio Transcription**: Convert audio recordings to flashcards (placeholder implementation)
- 🔒 **Security**: Rate limiting, CORS protection, and input validation
- 📊 **Enhanced Logging**: Comprehensive logging with different levels
- 🧹 **Auto Cleanup**: Automatic cleanup of temporary files
- ⚡ **Performance**: Compression, caching headers, and optimized processing

## Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Grok AI API key

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
   GROK_API_KEY=your_grok_api_key_here
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### GET /
Returns API information and health status.

**Response:**
```json
{
  "message": "🚀 Flashcard Generator API v2.0",
  "status": "healthy",
  "endpoints": {...},
  "features": [...],
  "limits": {...}
}
```

### POST /generate-flashcards
Generate flashcards from text content.

**Request Body:**
```json
{
  "content": "Your educational content here..."
}
```

**Response:**
```json
{
  "success": true,
  "flashcards": [
    {
      "id": "card-1",
      "question": "What is photosynthesis?",
      "answer": "The process by which plants convert light energy into chemical energy.",
      "difficulty": "Easy"
    }
  ],
  "count": 1,
  "source": "text",
  "metadata": {...}
}
```

### POST /generate-flashcards/pdf
Generate flashcards from PDF file.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (PDF file)

**Response:** Same format as text endpoint with PDF metadata.

### POST /generate-flashcards/voice
Generate flashcards from audio recording.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (Audio file: WAV, MP3, M4A, OGG, WebM)

**Response:** Same format as text endpoint with audio metadata.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `GROK_API_KEY` | - | **Required** Grok AI API key |
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

## Audio Transcription Setup

The server includes placeholder audio transcription. To enable real transcription, integrate one of these services:

### OpenAI Whisper API (Recommended)
```bash
npm install openai
```

Add to `.env`:
```env
OPENAI_API_KEY=your_openai_api_key
```

### Google Cloud Speech-to-Text
```bash
npm install @google-cloud/speech
```

### Azure Speech Services
```bash
npm install microsoft-cognitiveservices-speech-sdk
```

### AssemblyAI
```bash
npm install assemblyai
```

See commented examples in `server.js` for implementation details.

## Development

### Scripts
```bash
npm run dev      # Start with nodemon (auto-restart)
npm start        # Start production server
npm test         # Run tests
npm run lint     # Check code style
npm run lint:fix # Fix code style issues
```

### Project Structure
```
server/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment template
├── .eslintrc.js          # Code style rules
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── uploads/              # Temporary file storage (auto-created)
```

### Adding New Features

1. **New Endpoints**: Add routes before error handling middleware
2. **File Processing**: Extend `FileManager` class
3. **AI Services**: Extend `GrokAIService` class or create new service classes
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

## Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production CORS origins
3. Set up proper logging and monitoring
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates

### Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### PM2 Process Manager
```bash
npm install -g pm2
pm2 start server.js --name flashcard-api
pm2 startup
pm2 save
```

## Troubleshooting

### Common Issues

1. **"Missing API key"**: Set `GROK_API_KEY` in `.env`
2. **File upload fails**: Check file size and type restrictions
3. **CORS errors**: Add your frontend URL to `CORS_ORIGINS`
4. **Rate limit exceeded**: Wait 15 minutes or increase limits

### Logs Location
- Console output in development
- Configure log files for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add tests for new features
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/flashcard-generator/issues)
- **Documentation**: This README and inline code comments
- **API Reference**: GET / endpoint for live API documentation