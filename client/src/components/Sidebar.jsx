import React, { useState } from 'react';

const Sidebar = ({ conversations, currentId, onSelect, onNewChat, onDelete, onRename }) => {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const startEdit = (conv, e) => {
        e.stopPropagation();
        setEditingId(conv.id);
        setEditValue(conv.title || 'New Chat');
    };

    const saveEdit = async (id) => {
        if (editValue.trim()) {
            await onRename(id, editValue.trim());
        }
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 flex items-center justify-center space-x-2 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>New Chat</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`group w-full text-left p-3 hover:bg-gray-800 transition-colors border-b border-gray-800 flex justify-between items-center cursor-pointer ${currentId === conv.id ? 'bg-gray-800 border-l-4 border-l-blue-500' : 'text-gray-400'
                            }`}
                        onClick={() => onSelect(conv.id)}
                    >
                        <div className="overflow-hidden flex-1">
                            {editingId === conv.id ? (
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit(conv.id);
                                        if (e.key === 'Escape') cancelEdit();
                                    }}
                                    onBlur={() => saveEdit(conv.id)}
                                    autoFocus
                                    className="w-full bg-gray-700 text-gray-200 text-sm px-2 py-1 rounded border border-blue-500 focus:outline-none"
                                />
                            ) : (
                                <>
                                    <h3 className="text-sm font-medium text-gray-200 truncate">
                                        {conv.title || 'New Chat'}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                        {conv.lastMessage ? conv.lastMessage.text : 'No messages yet'}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => startEdit(conv, e)}
                                className="text-gray-500 hover:text-blue-500 p-1"
                                title="Rename Chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(conv.id);
                                }}
                                className="text-gray-500 hover:text-red-500 p-1"
                                title="Delete Chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
