import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
    },
    hasImage: {
        type: Boolean,
        default: false
    },
    imageUrl: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Message', messageSchema);
