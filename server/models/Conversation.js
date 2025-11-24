import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'New Chat'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Conversation', conversationSchema);
