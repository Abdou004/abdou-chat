import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Configure Multer for disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/api/conversations', async (req, res) => {
    try {
        const conversations = await Conversation.find().sort({ timestamp: -1 });

        // Fetch last message for each conversation to display in sidebar
        const list = await Promise.all(conversations.map(async (conv) => {
            const lastMessage = await Message.findOne({ conversationId: conv._id }).sort({ timestamp: -1 });
            return {
                id: conv._id,
                title: conv.title,
                lastMessage: lastMessage,
                timestamp: conv.timestamp
            };
        }));

        res.json(list);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

app.post('/api/conversations', async (req, res) => {
    try {
        const conversation = new Conversation({ title: 'New Chat' });
        await conversation.save();
        res.json({ id: conversation._id });
    } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Failed to create conversation" });
    }
});

app.delete('/api/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Message.deleteMany({ conversationId: id });
        await Conversation.findByIdAndDelete(id);
        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        res.status(500).json({ error: "Failed to delete conversation" });
    }
});

app.patch('/api/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const conversation = await Conversation.findByIdAndUpdate(
            id,
            { title: title.trim() },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({ message: 'Conversation renamed successfully', conversation });
    } catch (error) {
        console.error("Error renaming conversation:", error);
        res.status(500).json({ error: "Failed to rename conversation" });
    }
});

app.get('/api/conversations/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        const messages = await Message.find({ conversationId: req.params.id }).sort({ timestamp: 1 });
        res.json({ ...conversation.toObject(), messages });
    } catch (error) {
        console.error("Error fetching conversation details:", error);
        res.status(500).json({ error: "Failed to fetch conversation details" });
    }
});

app.post('/api/chat', upload.single('image'), async (req, res) => {
    try {
        const { message, conversationId, model: selectedModel } = req.body;
        const imageFile = req.file;

        if (!conversationId) {
            return res.status(400).json({ error: 'Valid conversationId is required' });
        }

        // Use selected model or default to gemini-2.5-flash
        const modelName = selectedModel || 'gemini-2.5-flash';

        // Save user message
        const userMsgData = {
            conversationId,
            text: message,
            sender: 'user',
            hasImage: !!imageFile
        };

        if (imageFile) {
            // Construct full URL for the image
            userMsgData.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${imageFile.filename}`;
        }

        const userMsg = new Message(userMsgData);
        await userMsg.save();

        // Update conversation timestamp and title if needed
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
            const messageCount = await Message.countDocuments({ conversationId });
            if (messageCount === 1) {
                conversation.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            }
            conversation.timestamp = Date.now();
            await conversation.save();
        }

        // Determine which provider to use based on model name
        const isGroqModel = modelName.includes('llama') || modelName.includes('mixtral') || modelName.includes('gemma');
        let text;

        if (isGroqModel) {
            // === GROQ PROVIDER ===
            // Fetch all previous messages for context
            const previousMessages = await Message.find({ conversationId }).sort({ timestamp: 1 });

            // Build chat history for Groq
            const messages = [];
            for (const msg of previousMessages) {
                if (msg._id.toString() === userMsg._id.toString()) continue;

                if (msg.sender === 'user') {
                    messages.push({
                        role: 'user',
                        content: msg.text || 'Image uploaded'
                    });
                } else if (msg.sender === 'bot') {
                    messages.push({
                        role: 'assistant',
                        content: msg.text
                    });
                }
            }

            // Add current message
            messages.push({
                role: 'user',
                content: message || 'Hello'
            });

            // Note: Groq doesn't support images in all models
            // llama-3.2-11b-vision-preview and llama-3.2-90b-vision-preview support images
            if (imageFile && !modelName.includes('vision')) {
                text = "This model doesn't support images. Please select a vision model like llama-3.2-11b-vision-preview.";
            } else {
                const completion = await groq.chat.completions.create({
                    model: modelName,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024
                });

                text = completion.choices[0]?.message?.content || 'No response';
            }

        } else {
            // === GEMINI PROVIDER ===
            const model = genAI.getGenerativeModel({ model: modelName });

            // Fetch all previous messages in this conversation for context
            const previousMessages = await Message.find({ conversationId }).sort({ timestamp: 1 });

            // Build chat history for Gemini (excluding the current user message we just saved)
            const history = [];
            for (const msg of previousMessages) {
                if (msg._id.toString() === userMsg._id.toString()) continue; // Skip the message we just added

                if (msg.sender === 'user') {
                    history.push({
                        role: 'user',
                        parts: [{ text: msg.text || 'Image uploaded' }]
                    });
                } else if (msg.sender === 'bot') {
                    history.push({
                        role: 'model',
                        parts: [{ text: msg.text }]
                    });
                }
            }

            // Start a chat session with history
            const chat = model.startChat({
                history: history
            });

            // Prepare the current message
            let currentMessageParts = [];

            if (imageFile) {
                // Read file from disk for Gemini API
                const fileData = fs.readFileSync(imageFile.path);
                currentMessageParts.push({
                    inlineData: {
                        data: fileData.toString('base64'),
                        mimeType: imageFile.mimetype,
                    }
                });
            }

            currentMessageParts.push({ text: message || "Describe this image." });

            // Send message with context
            const result = await chat.sendMessage(currentMessageParts);
            const response = await result.response;
            text = response.text();
        }

        // Save bot message
        const botMsg = new Message({
            conversationId,
            text,
            sender: 'bot'
        });
        await botMsg.save();

        // Update conversation timestamp again
        if (conversation) {
            conversation.timestamp = Date.now();
            await conversation.save();
        }

        res.json({ text });
    } catch (error) {
        console.error("Error generating content:");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error:", error);
        res.status(500).json({ error: "Failed to generate content", details: error.message });
    }
});

// Diagnostic endpoint to list available models
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error listing models:", error);
        res.status(500).json({ error: "Failed to list models" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
