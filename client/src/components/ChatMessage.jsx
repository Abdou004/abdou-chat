import React from 'react';

const ChatMessage = ({ message }) => {
    const isBot = message.sender === 'bot';

    return (
        <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
            <div
                className={`max-w-[80%] rounded-lg p-4 ${isBot
                    ? 'bg-gray-800 text-white rounded-tl-none'
                    : 'bg-blue-600 text-white rounded-tr-none'
                    }`}
            >
                {/* Display image from URL (persistent) or preview (before upload) */}
                {message.imageUrl && (
                    <img
                        src={message.imageUrl}
                        alt="Uploaded image"
                        className="max-w-full h-auto rounded-lg mb-2"
                    />
                )}
                {message.image && !message.imageUrl && (
                    <img
                        src={URL.createObjectURL(message.image)}
                        alt="User upload preview"
                        className="max-w-full h-auto rounded-lg mb-2"
                    />
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
        </div>
    );
};

export default ChatMessage;
