const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const FormData = require('form-data');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced logging utility
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = data 
      ? `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(data, null, 2)}`
      : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    console.log(logEntry);
  }

  static info(message, data) { this.log('info', message, data); }
  static error(message, data) { this.log('error', message, data); }
  static warn(message, data) { this.log('warn', message, data); }
  static debug(message, data) { 
    if (NODE_ENV === 'development') this.log('debug', message, data); 
  }
}

// Configuration object
const CONFIG = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_CONTENT_LENGTH: 50000,
  MAX_FLASHCARDS: 25,
  AI_TIMEOUT: 30000,
  WHISPER_TIMEOUT: 60000, // 60 seconds for audio transcription
  WEB_SEARCH_TIMEOUT: 5000, // 5 seconds for web search
  ALLOWED_AUDIO_TYPES: [
    'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 
    'audio/m4a', 'audio/webm', 'audio/ogg', 'audio/x-wav', 'audio/x-mpeg'
  ],
  ALLOWED_PDF_TYPES: ['application/pdf'],
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
    'https://flashcard-generator-flame.vercel.app'
  ]
};

// Enhanced middleware setup
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (CONFIG.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, also allow localhost
    if (origin && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    console.log('Allowed origins:', CONFIG.CORS_ORIGINS);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 50 : 100, // requests per window
  message: {
    error: 'Too many requests',
    message: 'Please wait before making more requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/generate-flashcards', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 100)
    });
  });
  next();
});

// Enhanced directory management
class FileManager {
  static async ensureUploadsDir() {
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
      Logger.info('Created uploads directory', { path: uploadsDir });
    }
    return uploadsDir;
  }

  static async cleanupOldFiles(directory, maxAgeHours = 1) {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          Logger.debug('Cleaned up old file', { file });
        }
      }
    } catch (error) {
      Logger.error('Cleanup failed', { error: error.message });
    }
  }

  static async deleteFile(filePath) {
    try {
      if (filePath && fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
        Logger.debug('Deleted file', { path: path.basename(filePath) });
      }
    } catch (error) {
      Logger.warn('Failed to delete file', { path: filePath, error: error.message });
    }
  }
}

// Enhanced multer configuration
const createMulterConfig = async () => {
  const uploadsDir = await FileManager.ensureUploadsDir();
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const extension = path.extname(file.originalname);
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedName}${extension}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: CONFIG.MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
      Logger.debug('File upload attempt', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      const allowedTypes = [
        ...CONFIG.ALLOWED_PDF_TYPES,
        ...CONFIG.ALLOWED_AUDIO_TYPES
      ];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error = new Error(
          `File type ${file.mimetype} not supported. ` +
          'Only PDF and audio files (WAV, MP3, M4A, OGG, WebM) are allowed.'
        );
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
      }
    }
  });
};

// NEW: Web Search Service for finding related links
class WebSearchService {
  constructor() {
    this.searchEngines = [
      {
        name: 'DuckDuckGo',
        url: 'https://api.duckduckgo.com/',
        enabled: true
      },
      {
        name: 'SerpAPI',
        url: 'https://serpapi.com/search',
        enabled: !!process.env.SERPAPI_KEY
      }
    ];
  }

  async searchForTopic(query, maxResults = 3) {
    try {
      Logger.debug('Searching for topic', { query, maxResults });

      // Try DuckDuckGo first (free API)
      const results = await this.searchDuckDuckGo(query, maxResults);
      
      if (results.length > 0) {
        return results;
      }

      // Fallback to SerpAPI if available
      if (process.env.SERPAPI_KEY) {
        return await this.searchSerpAPI(query, maxResults);
      }

      // If no API available, return educational domain links
      return this.generateEducationalLinks(query);

    } catch (error) {
      Logger.warn('Web search failed', { query, error: error.message });
      return this.generateEducationalLinks(query);
    }
  }

  async searchDuckDuckGo(query, maxResults) {
    try {
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: '1',
          skip_disambig: '1'
        },
        timeout: CONFIG.WEB_SEARCH_TIMEOUT
      });

      const results = [];
      
      // Extract results from DuckDuckGo response
      if (response.data.RelatedTopics) {
        for (const topic of response.data.RelatedTopics.slice(0, maxResults)) {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Information',
              url: topic.FirstURL,
              description: topic.Text.substring(0, 150) + '...'
            });
          }
        }
      }

      // If no related topics, try abstract
      if (results.length === 0 && response.data.AbstractURL) {
        results.push({
          title: response.data.AbstractSource || 'Learn More',
          url: response.data.AbstractURL,
          description: response.data.Abstract || 'Additional information about this topic'
        });
      }

      return results;
    } catch (error) {
      Logger.debug('DuckDuckGo search failed', { error: error.message });
      return [];
    }
  }

  async searchSerpAPI(query, maxResults) {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: process.env.SERPAPI_KEY,
          engine: 'google',
          num: maxResults
        },
        timeout: CONFIG.WEB_SEARCH_TIMEOUT
      });

      const results = [];
      
      if (response.data.organic_results) {
        for (const result of response.data.organic_results.slice(0, maxResults)) {
          results.push({
            title: result.title,
            url: result.link,
            description: result.snippet || 'Learn more about this topic'
          });
        }
      }

      return results;
    } catch (error) {
      Logger.debug('SerpAPI search failed', { error: error.message });
      return [];
    }
  }

  generateEducationalLinks(query) {
    // Generate educational links based on query keywords
    const educationalSites = [
      { domain: 'wikipedia.org', name: 'Wikipedia' },
      { domain: 'khanacademy.org', name: 'Khan Academy' },
      { domain: 'coursera.org', name: 'Coursera' },
      { domain: 'edx.org', name: 'edX' },
      { domain: 'britannica.com', name: 'Britannica' }
    ];

    const sanitizedQuery = encodeURIComponent(query.replace(/[^\w\s]/g, ''));
    
    return educationalSites.slice(0, 3).map(site => ({
      title: `${query} - ${site.name}`,
      url: `https://${site.domain}/search?q=${sanitizedQuery}`,
      description: `Learn more about ${query} on ${site.name}`
    }));
  }

  formatLinksForAnswer(links) {
    if (!links || links.length === 0) {
      return '';
    }

    const linkSection = '\n\n📚 **Related Links:**\n' + 
      links.map(link => `• [${link.title}](${link.url})`).join('\n');
    
    return linkSection;
  }
}

// Enhanced Groq AI service class (CORRECTED FOR GROQ AI) Modified
class GroqAIService {
  constructor() {
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.apiKey = process.env.GROQ_API_KEY;
    this.webSearch = new WebSearchService(); // Initialize web search

    if (!this.apiKey) {
      Logger.error('GROQ_API_KEY environment variable is required');
      throw new Error('Missing API key configuration');
    }
  }

  async generateFlashcards(content, sourceType = 'text') {
    try {
      // Sanitize content
      content = content.replace(/[^ -~\n\r\t]/g, '').slice(0, CONFIG.MAX_CONTENT_LENGTH);

      Logger.info(`Generating flashcards from ${sourceType}`, {
        contentLength: content.length,
        sourceType
      });

      const systemPrompt = this.createSystemPrompt();
      const response = await this.makeAPIRequest(content, sourceType, systemPrompt);

      const flashcards = await this.processAIResponse(response, sourceType);
      
      // NEW: Add web links to flashcards
      const flashcardsWithLinks = await this.addWebLinksToFlashcards(flashcards);
      
      return flashcardsWithLinks;
    } catch (error) {
      Logger.error('AI service error', {
        error: error.message,
        response: error.response?.data,
        sourceType,
        contentLength: content.length
      });
      throw this.handleAIError(error);
    }
  }

    // NEW: Method to add web links to flashcards
  async addWebLinksToFlashcards(flashcards) {
    try {
      Logger.info('Adding web links to flashcards', { count: flashcards.length });

      const flashcardsWithLinks = [];

      for (const card of flashcards) {
        try {
          // Extract key terms from the question for search
          const searchQuery = this.extractSearchTerms(card.question);
          
          // Search for related links
          const relatedLinks = await this.webSearch.searchForTopic(searchQuery, 2);
          
          // Format and add links to the answer
          const linksSection = this.webSearch.formatLinksForAnswer(relatedLinks);
          
          flashcardsWithLinks.push({
            ...card,
            answer: card.answer + linksSection,
            relatedLinks: relatedLinks // Also store links separately for potential frontend use
          });

          // Add small delay to avoid overwhelming search APIs
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          Logger.warn('Failed to add links to flashcard', { 
            cardId: card.id, 
            error: error.message 
          });
          
          // Return card without links if search fails
          flashcardsWithLinks.push(card);
        }
      }

      Logger.info('Successfully added web links', { 
        processed: flashcardsWithLinks.length,
        withLinks: flashcardsWithLinks.filter(card => card.relatedLinks?.length > 0).length
      });

      return flashcardsWithLinks;
    } catch (error) {
      Logger.error('Failed to add web links to flashcards', { error: error.message });
      return flashcards; // Return original flashcards if web search fails
    }
  }

  // NEW: Extract search terms from flashcard question
  extractSearchTerms(question) {
    // Remove common question words and extract key terms
    const stopWords = ['what', 'who', 'when', 'where', 'why', 'how', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'define', 'explain', 'describe'];
    
    const words = question.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Take the most important terms (first 3-4 words)
    return words.slice(0, 4).join(' ');
  }

  createSystemPrompt() {
    return `You are an expert educational flashcard generator. Create high-quality flashcards from the provided content.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array
- No additional text, explanations, or markdown formatting
- Each flashcard must have: id, question, answer, difficulty

Response format:
[
  {
    "id": "card-1",
    "question": "Clear, specific question here",
    "answer": "Concise but complete answer (1-3 sentences)",
    "difficulty": "Easy|Medium|Hard"
  }
]

Guidelines:
- Generate 8-20 flashcards based on content richness
- Focus on key concepts, definitions, facts, and relationships
- Make questions specific and unambiguous
- Vary difficulty levels appropriately
- Ensure questions test understanding, not just memorization
- Keep answers informative but concise`;
  }

  async makeAPIRequest(content, sourceType, systemPrompt) {
    const requestData = {
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Generate flashcards from this ${sourceType} content:\n\n${content}`
        }
      ],
      // CORRECTED: Using Groq AI supported models
      model: "llama-3.3-70b-versatile", // You can also use: mixtral-8x7b-32768, llama-3.1-70b-versatile
      temperature: 0.7,
      max_tokens: 3000
    };

    return await axios.post(this.apiUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.AI_TIMEOUT
    });
  }

  processAIResponse(response, sourceType) {
    const aiResponse = response.data.choices[0].message.content.trim();
    Logger.debug('AI response preview', {
      preview: aiResponse.substring(0, 200),
      sourceType
    });

    try {
      return this.validateAndNormalizeFlashcards(this.parseJSONResponse(aiResponse));
    } catch (parseError) {
      Logger.warn('Invalid JSON from Groq, fallback triggered', {
        error: parseError.message,
        raw: aiResponse.substring(0, 300)
      });
      return this.validateAndNormalizeFlashcards(this.extractFlashcardsFromText(aiResponse, sourceType));
    }

    const validatedFlashcards = this.validateAndNormalizeFlashcards(flashcards);
    
    Logger.info(`Generated flashcards successfully`, {
      count: validatedFlashcards.length,
      sourceType
    });

    return validatedFlashcards;
  }

  parseJSONResponse(response) {
    // Remove markdown formatting
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Extract JSON array
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;
    
    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    return parsed;
  }

  extractFlashcardsFromText(text, sourceType) {
    Logger.debug('Using fallback text extraction', { sourceType });
    
    const flashcards = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentCard = {};
    let cardCount = 0;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      
      if (lowerLine.includes('question') && line.includes(':')) {
        if (currentCard.question && currentCard.answer) {
          flashcards.push(this.createCardObject(currentCard, cardCount++));
        }
        currentCard = { question: line.split(':').slice(1).join(':').trim() };
      } else if (lowerLine.includes('answer') && line.includes(':')) {
        currentCard.answer = line.split(':').slice(1).join(':').trim();
      } else if (lowerLine.includes('difficulty') && line.includes(':')) {
        const diffText = line.split(':').slice(1).join(':').trim();
        currentCard.difficulty = this.extractDifficulty(diffText);
      }
    }
    
    // Add the last card
    if (currentCard.question && currentCard.answer) {
      flashcards.push(this.createCardObject(currentCard, cardCount));
    }
    
    // Fallback if no cards found
    if (flashcards.length === 0) {
      flashcards.push(this.createFallbackCard(text, sourceType));
    }
    
    return flashcards;
  }

  createCardObject(card, index) {
    return {
      id: `card-${Date.now()}-${index}`,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || 'Medium'
    };
  }

  createFallbackCard(text, sourceType) {
    const preview = text.substring(0, 200);
    return {
      id: `card-${Date.now()}`,
      question: `What is the main topic discussed in this ${sourceType}?`,
      answer: `The content discusses: ${preview}... (Note: AI parsing encountered issues - please try rephrasing your content)`,
      difficulty: 'Medium'
    };
  }

  extractDifficulty(text) {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    return difficulties.find(d => 
      text.toLowerCase().includes(d.toLowerCase())
    ) || 'Medium';
  }

  validateAndNormalizeFlashcards(flashcards) {
    return flashcards
      .filter(card => card && (card.question || card.answer))
      .map((card, index) => ({
        id: card.id || `card-${Date.now()}-${index}`,
        question: (card.question || '').toString().trim() || `Question ${index + 1}`,
        answer: (card.answer || '').toString().trim() || `Answer ${index + 1}`,
        difficulty: ['Easy', 'Medium', 'Hard'].includes(card.difficulty) 
          ? card.difficulty 
          : 'Medium'
      }))
      .slice(0, CONFIG.MAX_FLASHCARDS);
  }

  handleAIError(error) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout - please try again with shorter content');
    }
    
    if (error.response?.status === 429) {
      return new Error('Rate limit exceeded - please try again later');
    }
    
    if (error.response?.status === 401) {
      return new Error('Invalid API key - please check configuration');
    }
    
    return new Error(`AI service error: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Enhanced PDF processing
class PDFProcessor {
  static async extractText(filePath, originalName) {
    try {
      Logger.info('Processing PDF', { file: originalName });
      
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      const extractedText = pdfData.text;

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF. The file may contain only images or be corrupted.');
      }

      if (extractedText.length > CONFIG.MAX_CONTENT_LENGTH) {
        throw new Error(`PDF content too long (${extractedText.length} characters). Maximum allowed is ${CONFIG.MAX_CONTENT_LENGTH} characters.`);
      }

      Logger.info('PDF text extraction successful', {
        file: originalName,
        pages: pdfData.numpages,
        textLength: extractedText.length
      });

      return {
        text: extractedText,
        metadata: {
          pages: pdfData.numpages,
          textLength: extractedText.length
        }
      };
    } catch (error) {
      Logger.error('PDF processing failed', {
        file: originalName,
        error: error.message
      });
      
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file. Please upload a valid PDF document.');
      }
      if (error.message.includes('encrypted')) {
        throw new Error('PDF is password protected. Please upload an unprotected PDF.');
      }
      
      throw error;
    }
  }
}

// Audio transcription service with Whisper API integration
class AudioTranscriptionService {
  constructor() {
    this.whisperApiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions'; // Using Groq's Whisper endpoint
    this.openaiApiUrl = 'https://api.openai.com/v1/audio/transcriptions'; // Original OpenAI endpoint
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    
    // Rate limiting state
    this.lastOpenAIRequest = 0;
    this.lastGroqRequest = 0;
    this.openaiRequestCount = 0;
    this.groqRequestCount = 0;
    this.rateLimitWindow = 60000; // 1 minute window
    this.maxRequestsPerMinute = 50; // Conservative limit
    
    if (!this.groqApiKey && !this.openaiApiKey) {
      Logger.warn('No API keys found for audio transcription - will use fallback');
    }
  }

  static async transcribe(filePath, originalName) {
    const service = new AudioTranscriptionService();
    return await service.transcribeFile(filePath, originalName);
  }

  async transcribeFile(filePath, originalName) {
    try {
      Logger.info('Processing audio file for transcription', { file: originalName });
      
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / 1024 / 1024;
      
      Logger.info('Audio file stats', {
        file: originalName,
        size: `${fileSizeMB.toFixed(2)} MB`
      });

      // Check file size limit
      if (stats.size > 25 * 1024 * 1024) {
        throw new Error('Audio file too large. Maximum size is 25MB for transcription.');
      }

      // Try transcription services in order of preference
      const transcriptionResult = await this.tryTranscriptionServices(filePath, originalName, stats);
      
      return transcriptionResult;

    } catch (error) {
      Logger.error('Audio transcription failed', {
        file: originalName,
        error: error.message
      });
      
      // Return enhanced fallback with instructions
      return await this.createEnhancedFallback(filePath, originalName, stats, error);
    }
  }

  async tryTranscriptionServices(filePath, originalName, stats) {
    const services = [
      { name: 'Groq Whisper', method: 'transcribeWithGroq' },
      { name: 'OpenAI Whisper', method: 'transcribeWithOpenAI' },
      { name: 'Local Processing', method: 'transcribeWithLocalFallback' }
    ];

    let lastError = null;

    for (const service of services) {
      try {
        Logger.info(`Attempting transcription with ${service.name}`, { file: originalName });
        
        const result = await this[service.method](filePath, originalName, stats);
        
        Logger.info(`Transcription successful with ${service.name}`, {
          file: originalName,
          textLength: result.text.length
        });
        
        return result;
        
      } catch (error) {
        Logger.warn(`${service.name} transcription failed`, {
          file: originalName,
          error: error.message
        });
        
        lastError = error;
        
        // If rate limited, wait and try next service
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          Logger.info(`Rate limited on ${service.name}, trying next service`);
          continue;
        }
        
        // If API key invalid, skip to next
        if (error.message.includes('401') || error.message.includes('Invalid API key')) {
          continue;
        }
        
        // For other errors, still try next service
        continue;
      }
    }

    // If all services failed, throw the last error
    throw lastError || new Error('All transcription services failed');
  }

  async transcribeWithGroq(filePath, originalName, stats) {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not available');
    }

    // Check rate limiting for Groq
    await this.checkRateLimit('groq');

    try {
      Logger.info('Using Groq Whisper API for transcription', { file: originalName });

      const formData = new FormData();
      formData.append('file', fsSync.createReadStream(filePath), {
        filename: originalName,
        contentType: this.getContentType(originalName)
      });
      formData.append('model', 'whisper-large-v3'); // Groq's Whisper model
      formData.append('response_format', 'json');
      formData.append('temperature', '0.2');

      const response = await axios.post(this.whisperApiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          ...formData.getHeaders()
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return this.processTranscriptionResponse(response.data.text, originalName, stats, 'Groq Whisper');

    } catch (error) {
      this.handleTranscriptionError(error, 'Groq Whisper', originalName);
      throw error;
    }
  }

  async transcribeWithOpenAI(filePath, originalName, stats) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not available');
    }

    // Check rate limiting for OpenAI
    await this.checkRateLimit('openai');

    try {
      Logger.info('Using OpenAI Whisper API for transcription', { file: originalName });

      const formData = new FormData();
      formData.append('file', fsSync.createReadStream(filePath), {
        filename: originalName,
        contentType: this.getContentType(originalName)
      });
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');
      formData.append('temperature', '0.2');

      const response = await axios.post(this.openaiApiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          ...formData.getHeaders()
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return this.processTranscriptionResponse(response.data.text, originalName, stats, 'OpenAI Whisper');

    } catch (error) {
      this.handleTranscriptionError(error, 'OpenAI Whisper', originalName);
      throw error;
    }
  }

  async transcribeWithLocalFallback(filePath, originalName, stats) {
    Logger.info('Using local fallback transcription', { file: originalName });
    
    // This could be enhanced with local speech recognition libraries
    // For now, return a more helpful placeholder
    const placeholderText = this.generateIntelligentPlaceholder(originalName, stats);
    
    return {
      text: placeholderText,
      metadata: {
        originalFile: originalName,
        fileSize: stats.size,
        transcriptionEngine: 'Local Fallback',
        isPlaceholder: true,
        textLength: placeholderText.length,
        processingTime: new Date().toISOString(),
        instructions: 'Manual transcription required - copy audio content to text input'
      }
    };
  }

  async checkRateLimit(service) {
    const now = Date.now();
    
    if (service === 'openai') {
      // Reset counter if window has passed
      if (now - this.lastOpenAIRequest > this.rateLimitWindow) {
        this.openaiRequestCount = 0;
      }
      
      if (this.openaiRequestCount >= this.maxRequestsPerMinute) {
        const waitTime = this.rateLimitWindow - (now - this.lastOpenAIRequest);
        Logger.warn(`OpenAI rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.openaiRequestCount++;
      this.lastOpenAIRequest = now;
      
    } else if (service === 'groq') {
      // Reset counter if window has passed
      if (now - this.lastGroqRequest > this.rateLimitWindow) {
        this.groqRequestCount = 0;
      }
      
      if (this.groqRequestCount >= this.maxRequestsPerMinute) {
        const waitTime = this.rateLimitWindow - (now - this.lastGroqRequest);
        Logger.warn(`Groq rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.groqRequestCount++;
      this.lastGroqRequest = now;
    }
  }

  processTranscriptionResponse(transcriptionText, originalName, stats, engine) {
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      throw new Error('No speech detected in the audio file. Please ensure the audio contains clear speech.');
    }

    if (transcriptionText.length > CONFIG.MAX_CONTENT_LENGTH) {
      Logger.warn('Transcription too long, truncating', {
        originalLength: transcriptionText.length,
        maxLength: CONFIG.MAX_CONTENT_LENGTH
      });
    }

    const finalText = transcriptionText.length > CONFIG.MAX_CONTENT_LENGTH 
      ? transcriptionText.substring(0, CONFIG.MAX_CONTENT_LENGTH) + '...[truncated]'
      : transcriptionText;

    return {
      text: finalText,
      metadata: {
        originalFile: originalName,
        fileSize: stats.size,
        transcriptionEngine: engine,
        textLength: finalText.length,
        wasTruncated: transcriptionText.length > CONFIG.MAX_CONTENT_LENGTH,
        confidence: 'high',
        processingTime: new Date().toISOString()
      }
    };
  }

  handleTranscriptionError(error, engine, originalName) {
    Logger.error(`${engine} transcription failed`, {
      file: originalName,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });

    // Handle specific API errors
    if (error.response?.status === 400) {
      throw new Error('Invalid audio file format. Please use WAV, MP3, M4A, OGG, or WebM files.');
    }
    if (error.response?.status === 401) {
      throw new Error(`Invalid ${engine} API key. Please check your configuration.`);
    }
    if (error.response?.status === 429) {
      throw new Error(`${engine} API rate limit exceeded. Trying alternative service...`);
    }
    if (error.response?.status === 413) {
      throw new Error('Audio file too large. Maximum size is 25MB.');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Transcription timeout. Please try with a shorter audio file.');
    }
  }

  generateIntelligentPlaceholder(originalName, stats) {
    const duration = this.estimateAudioDuration(stats.size);
    
    return `🎵 Audio Transcription Required

📁 File: ${originalName}
📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB
⏱️ Est. Duration: ~${duration} minutes

🚨 TRANSCRIPTION UNAVAILABLE
Current API services are rate-limited or unavailable.

📝 MANUAL STEPS:
1. Play your audio file: "${originalName}"
2. Listen and transcribe the speech content
3. Copy the transcribed text
4. Paste it into the main text input field
5. Click "Generate Flashcards" to create your study cards

💡 TIPS FOR BETTER RESULTS:
• Include key terms, definitions, and concepts
• Organize content into clear topics
• Add examples and explanations where helpful

⚙️ TECHNICAL INFO:
• Processed: ${new Date().toLocaleString()}
• Status: Fallback mode (API rate limited)
• Next attempt: Try again in 5-10 minutes

🔧 TO ENABLE AUTO-TRANSCRIPTION:
1. Ensure GROQ_API_KEY or OPENAI_API_KEY is configured
2. Wait for rate limits to reset
3. Upload smaller audio files if possible`;
  }

  estimateAudioDuration(fileSizeBytes) {
    // Rough estimate: MP3 at 128kbps ≈ 1MB per minute
    const estimatedMinutes = Math.ceil(fileSizeBytes / (1024 * 1024));
    return estimatedMinutes;
  }

  async createEnhancedFallback(filePath, originalName, stats, originalError) {
    const placeholderText = this.generateIntelligentPlaceholder(originalName, stats);
    
    return {
      text: placeholderText,
      metadata: {
        originalFile: originalName,
        fileSize: stats.size,
        transcriptionEngine: 'Enhanced Fallback',
        isPlaceholder: true,
        textLength: placeholderText.length,
        processingTime: new Date().toISOString(),
        error: originalError.message,
        instructions: 'Manual transcription required due to API limitations',
        estimatedDuration: this.estimateAudioDuration(stats.size),
        retryAdvice: 'Wait 5-10 minutes for rate limits to reset, then try again'
      }
    };
  }

  getContentType(filename) {
    const extension = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/m4a',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm'
    };
    return contentTypes[extension] || 'audio/mpeg';
  }

  // Enhanced utility methods
  static isTranscriptionAvailable() {
    return !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY);
  }

  static getTranscriptionStatus() {
    const groqStatus = process.env.GROQ_API_KEY ? '✅ Available' : '❌ Missing';
    const openaiStatus = process.env.OPENAI_API_KEY ? '✅ Available' : '❌ Missing';
    
    return {
      groq: groqStatus,
      openai: openaiStatus,
      fallback: '✅ Always available',
      recommended: 'Set GROQ_API_KEY for best results'
    };
  }

  static getSupportedFormats() {
    return {
      formats: ['WAV', 'MP3', 'M4A', 'OGG', 'WebM'],
      maxSize: '25MB',
      engines: ['Groq Whisper', 'OpenAI Whisper', 'Local Fallback'],
      status: AudioTranscriptionService.getTranscriptionStatus()
    };
  }
}

// Initialize services
const groqAI = new GroqAIService(); // CORRECTED: Variable name
let upload;

// Initialize multer after ensuring directory exists
(async () => {
  upload = await createMulterConfig();
})();

// Enhanced route handlers
const createSuccessResponse = (flashcards, source, metadata = {}) => ({
  success: true,
  flashcards,
  count: flashcards.length,
  source,
  metadata: {
    ...metadata,
    processingTime: new Date().toISOString(),
    version: '2.0.0'
  }
});

const createErrorResponse = (error, message, details = null, debugInfo = {}) => ({
  error,
  message,
  ...(details && { details }),
  ...(NODE_ENV !== 'production' && debugInfo && { debugInfo }),
  timestamp: new Date().toISOString()
});

// Routes
app.get('/', (req, res) => {
  const whisperStatus = AudioTranscriptionService.isWhisperAvailable();
  const supportedFormats = AudioTranscriptionService.getSupportedFormats();
  
  res.json({
    message: '🚀 Flashcard Generator API v2.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    aiProvider: 'Groq AI',
    endpoints: {
      'POST /generate-flashcards': 'Generate flashcards from text',
      'POST /generate-flashcards/pdf': 'Generate flashcards from PDF file',
      'POST /generate-flashcards/voice': 'Generate flashcards from audio recording'
    },
    features: [
      'AI-powered flashcard generation (Groq AI)',
      'PDF text extraction with validation',
      `Audio transcription (${whisperStatus ? 'OpenAI Whisper' : 'Placeholder'})`,
      'Multiple difficulty levels',
      'Rate limiting and security',
      'Enhanced error handling',
      'Automatic file cleanup',
      'Web search for related links'
    ],
    services: {
      groqAI: !!process.env.GROQ_API_KEY,
      whisperAPI: whisperStatus,
      webSearch: true
    },
    audioTranscription: {
      enabled: whisperStatus,
      engine: supportedFormats.engine,
      supportedFormats: supportedFormats.formats,
      maxFileSize: supportedFormats.maxSize
    },
    limits: {
      maxFileSize: `${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
      maxContentLength: CONFIG.MAX_CONTENT_LENGTH,
      maxFlashcards: CONFIG.MAX_FLASHCARDS,
      rateLimit: '50 requests per 15 minutes'
    }
  });
});

// Generate flashcards from text
app.post('/generate-flashcards', async (req, res) => {
  try {
    let { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json(createErrorResponse(
        'Content is required',
        'Please provide text content to generate flashcards from'
      ));
    }

    if (content.length > CONFIG.MAX_CONTENT_LENGTH) {
      return res.status(400).json(createErrorResponse(
        'Content too long',
        `Please limit content to ${CONFIG.MAX_CONTENT_LENGTH} characters or less`,
        `Current length: ${content.length} characters`
      ));
    }

    const flashcards = await groqAI.generateFlashcards(content, 'text');

    res.json(createSuccessResponse(flashcards, 'text', {
      contentLength: content.length
    }));

  } catch (error) {
    Logger.error('Text flashcard generation failed', { error: error.message });
    res.status(500).json(createErrorResponse(
      'Failed to generate flashcards from text',
      error.message,
      'Please try again with shorter or simpler content',
      { fullStack: error.stack }
    ));
  }
});

// DEBUG: Print API Key status
Logger.info('GROQ API Key status', { loaded: !!process.env.GROQ_API_KEY });

// Generate flashcards from PDF
app.post('/generate-flashcards/pdf', async (req, res) => {
  let filePath = null;
  
  try {
    // Ensure upload middleware is initialized
    if (!upload) {
      upload = await createMulterConfig();
    }
    
    upload.single('file')(req, res, async (err) => {
      if (err) {
        Logger.error('PDF upload error', { error: err.message });
        return res.status(400).json(createErrorResponse(
          'File upload failed',
          err.message
        ));
      }

      try {
        if (!req.file) {
          return res.status(400).json(createErrorResponse(
            'PDF file is required',
            'Please upload a PDF file'
          ));
        }

        filePath = req.file.path;
        
        const { text, metadata: pdfMetadata } = await PDFProcessor.extractText(
          filePath, 
          req.file.originalname
        );
        
        const flashcards = await groqAI.generateFlashcards(text, 'PDF'); // CORRECTED

        res.json(createSuccessResponse(flashcards, 'pdf', {
          originalFile: req.file.originalname,
          fileSize: req.file.size,
          ...pdfMetadata
        }));

      } catch (error) {
        Logger.error('PDF processing error', { 
          file: req.file?.originalname,
          error: error.message 
        });
        
        res.status(500).json(createErrorResponse(
          'Failed to process PDF file',
          error.message,
          'Please try a different PDF file or convert it to text first'
        ));
      } finally {
        await FileManager.deleteFile(filePath);
      }
    });

  } catch (error) {
    Logger.error('PDF endpoint error', { error: error.message });
    res.status(500).json(createErrorResponse(
      'PDF processing failed',
      error.message
    ));
  }
});

// Generate flashcards from voice recording
// Updated route for voice flashcard generation with better error handling
app.post('/generate-flashcards/voice', async (req, res) => {
  let filePath = null;
  
  try {
    if (!upload) {
      upload = await createMulterConfig();
    }
    
    upload.single('file')(req, res, async (err) => {
      if (err) {
        Logger.error('Audio upload error', { error: err.message });
        return res.status(400).json(createErrorResponse(
          'File upload failed',
          err.message
        ));
      }

      try {
        if (!req.file) {
          return res.status(400).json(createErrorResponse(
            'Audio file is required',
            'Please upload an audio file (WAV, MP3, M4A, OGG, WebM)'
          ));
        }

        filePath = req.file.path;
        
        Logger.info('Starting audio transcription', {
          file: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        
        const { text, metadata: audioMetadata } = await AudioTranscriptionService.transcribe(
          filePath, 
          req.file.originalname
        );
        
        Logger.info('Audio transcription completed', {
          file: req.file.originalname,
          textLength: text.length,
          isPlaceholder: audioMetadata.isPlaceholder
        });
        
        const flashcards = await groqAI.generateFlashcards(text, 'voice recording');

        res.json(createSuccessResponse(flashcards, 'voice', {
          originalFile: req.file.originalname,
          fileSize: req.file.size,
          transcriptionEngine: audioMetadata.transcriptionEngine,
          transcriptionLength: text.length,
          transcriptionPreview: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          ...audioMetadata
        }));

      } catch (error) {
        Logger.error('Voice processing error', { 
          file: req.file?.originalname,
          error: error.message,
          stack: error.stack
        });
        
        res.status(500).json(createErrorResponse(
          'Failed to generate flashcards from voice recording',
          error.message,
          AudioTranscriptionService.isWhisperAvailable() 
            ? 'Please try recording again with clear audio'
            : 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
        ));
      } finally {
        await FileManager.deleteFile(filePath);
      }
    });

  } catch (error) {
    Logger.error('Voice endpoint error', { error: error.message });
    res.status(500).json(createErrorResponse(
      'Voice processing failed',
      error.message
    ));
  }
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  Logger.error('Unhandled error', { 
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(createErrorResponse(
        'File too large',
        `Maximum file size is ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        'Please upload a smaller file'
      ));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json(createErrorResponse(
        'Unexpected file',
        'Only one file upload is allowed at a time'
      ));
    }
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json(createErrorResponse(
      'Invalid file type',
      error.message,
      'Allowed types: PDF files, Audio files (WAV, MP3, M4A, OGG, WebM)'
    ));
  }
  
  res.status(500).json(createErrorResponse(
    'Internal server error',
    'Something went wrong on our end. Please try again.',
    NODE_ENV === 'development' ? error.message : undefined
  ));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(createErrorResponse(
    'Endpoint not found',
    `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    {
      availableEndpoints: {
        'GET /': 'API information',
        'POST /generate-flashcards': 'Generate from text',
        'POST /generate-flashcards/pdf': 'Generate from PDF',
        'POST /generate-flashcards/voice': 'Generate from audio'
      }
    }
  ));
});

// Scheduled cleanup task
const startCleanupTask = async () => {
  const uploadsDir = await FileManager.ensureUploadsDir();
  
  setInterval(async () => {
    await FileManager.cleanupOldFiles(uploadsDir, 1); // Clean files older than 1 hour
  }, 30 * 60 * 1000); // Run every 30 minutes
  
  Logger.info('Cleanup task started', { interval: '30 minutes', maxAge: '1 hour' });
};

// Start server
const startServer = async () => {
  try {
    await FileManager.ensureUploadsDir();
    await startCleanupTask();
    
    // Validate API keys
    const groqStatus = process.env.GROQ_API_KEY ? '✅ Connected' : '❌ Missing';
    const whisperStatus = process.env.OPENAI_API_KEY ? '✅ Connected' : '⚠️  Missing (using fallback)';
    
    app.listen(PORT, () => {
      Logger.info('🚀 Flashcard Generator API v2.0 Started Successfully!');
      Logger.info('Server configuration', {
        port: PORT,
        environment: NODE_ENV,
        groqAPI: groqStatus,
        whisperAPI: whisperStatus,
        corsOrigins: CONFIG.CORS_ORIGINS,
        maxFileSize: `${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        maxContentLength: CONFIG.MAX_CONTENT_LENGTH,
        maxFlashcards: CONFIG.MAX_FLASHCARDS
      });
      
      if (!process.env.OPENAI_API_KEY) {
        Logger.warn('⚠️  OpenAI API key not found. Audio transcription will use placeholder text.');
        Logger.warn('   To enable Whisper transcription, set OPENAI_API_KEY environment variable.');
      }
    });
  } catch (error) {
    Logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  Logger.info('Shutting down server gracefully...');
  
  try {
    const uploadsDir = await FileManager.ensureUploadsDir();
    await FileManager.cleanupOldFiles(uploadsDir, 0); // Clean all files
    Logger.info('Cleaned up temporary files');
  } catch (error) {
    Logger.warn('Could not clean up files', { error: error.message });
  }
  
  Logger.info('Server stopped');
  process.exit(0);
};

// Process event handlers
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;