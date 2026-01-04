# 📚 Flashcard Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An AI-powered flashcard generator that transforms text, PDF documents, and audio recordings into interactive study flashcards. Built with React for the frontend and Node.js/Express for the backend, featuring a Study Buddy for enhanced learning.

## 📋 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

## ✨ Features

### AI-Powered Generation

- Leverages Grok AI to create intelligent, context-aware flashcards from any input
- Customizable settings: tone (e.g., Professional, Casual), quantity (up to 25 cards), and difficulty level (Beginner to Expert)

### Multiple Input Types

- **Text Input**: Paste or type study material directly
- **PDF Support**: Upload and extract text from PDF documents automatically
- **Audio Transcription**: Record or upload audio files, transcribed using advanced speech-to-text services

### Study Buddy

- **Interactive Chat**: Ask questions and get explanations about flashcard content
- **Quiz Mode**: Test your knowledge with generated quizzes based on the material
- **Summary View**: Get concise summaries and key points from your study content
- **Sidebar Interface**: Easily accessible study tools alongside your flashcards

### User Experience

- **Mobile-Friendly**: Fully responsive design optimized for smartphones and tablets
- **Real-time Feedback**: Live connection status, loading indicators, and error handling
- **Intuitive Interface**: Tab-based navigation for different input types, drag-and-drop file uploads

### Security & Performance

- **Rate Limiting**: Prevents abuse with configurable request limits
- **CORS Protection**: Secure cross-origin resource sharing
- **Input Validation**: Comprehensive validation for all user inputs
- **Compression & Caching**: Optimized for fast loading and efficient data transfer

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16.0.0 or higher)
- npm (version 8.0.0 or higher)
- Git

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd flashcard-generator
   ```

2. **Install backend dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**

   - Copy `.env.example` to `.env`
   - Add required API keys (Grok AI, transcription service)

4. **Install frontend dependencies**

   ```bash
   cd ../client
   npm install
   ```

5. **Start the application**
   - Backend: `cd server && npm start` (runs on http://localhost:3001)
   - Frontend: `cd client && npm start` (opens at http://localhost:3000)

### Usage

1. Open the app in your browser
2. Choose an input type: Text, PDF, or Audio
3. Enter or upload your content
4. Adjust generation settings as needed
5. Click "Generate" to create flashcards
6. Use Study Buddy for interactive learning

## Configuration

### Environment Variables

| Variable       | Default                     | Description                  |
| -------------- | --------------------------- | ---------------------------- |
| `PORT`         | `3001`                      | Server port                  |
| `NODE_ENV`     | `development`               | Environment mode             |
| `GROQ_API_KEY` | -                           | **Required** Groq AI API key |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins         |

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

## 📖 API Documentation

For detailed API documentation, see [API Docs](docs/API.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Setting up a development environment
- Code style and standards
- Submitting pull requests
- Reporting issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Powered by [Grok AI](https://grok.ai)
- Built with [React](https://reactjs.org) and [Express](https://expressjs.com)
- Icons by [Lucide React](https://lucide.dev)

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Groq AI API key

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add tests for new features
5. Submit a pull request

---

## 👨‍💻 Author

Built by Saman Pandey and Ruturaj Rajwade for Summer Internship-2025 Project.

---