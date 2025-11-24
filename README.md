# ABDOU'S Chat V 1.0

A modern AI-powered chatbot with multi-model support, image analysis, and conversation management.

## Features

- 🤖 **Multi-Model Support**: Switch between Gemini and Groq AI models
- 🖼️ **Image Analysis**: Upload and analyze images
- 💬 **Conversation Management**: Create, rename, and delete conversations
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 💾 **Persistent Storage**: MongoDB database for conversation history
- ⚡ **Fast & Free**: Free AI models with generous limits

## Tech Stack

**Frontend:**
- React + Vite
- Tailwind CSS
- Responsive design

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Multer for file uploads

**AI Models:**
- Google Gemini 2.5 Flash
- Groq Llama 3.3 70B
- Groq Llama 3.1 8B Instant

## Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Gemini API key
- Groq API key (optional)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd galactic-telescope
```

2. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. Configure environment variables
```bash
cd server
cp .env.example .env
# Edit .env with your API keys
```

4. Run the application
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

Visit `http://localhost:5173`

## Deployment

See [`deployment_guide.md`](./deployment_guide.md) for detailed deployment instructions.

## License

MIT

## Author

Created by Abdou
