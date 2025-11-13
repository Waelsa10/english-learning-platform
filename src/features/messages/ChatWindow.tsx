import React, { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, Mic, Image as ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  getConversationMessages,
  sendMessage,
  markMessageAsRead,
  getDocument,
} from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { Spinner } from '@/components/common/Spinner';
import { formatDate } from '@/utils/formatters';
import { uploadFile } from '@/lib/cloudinary';
import toast from 'react-hot-toast';
import type { Message, Conversation } from '@/types';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [conversationData, messagesData] = await Promise.all([
          getDocument<Conversation>('conversations', conversationId),
          getConversationMessages(conversationId),
        ]);

        setConversation(conversationData);
        setMessages(messagesData);

        // Mark unread messages as read
        const unreadMessages = messagesData.filter(
          (m) => m.receiverId === user?.uid && m.status !== 'read'
        );
        await Promise.all(
          unreadMessages.map((m) => markMessageAsRead(m.id, user!.uid))
        );
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener (simplified - in production use onSnapshot)
    const interval = setInterval(async () => {
      const messagesData = await getConversationMessages(conversationId);
      setMessages(messagesData);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user || !conversation) return;

    setIsSending(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile);
        fileUrl = uploadResult.secure_url;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      }

      const receiverId = conversation.participants.find((p) => p !== user.uid);
      if (!receiverId) throw new Error('Receiver not found');

      await sendMessage({
        conversationId,
        senderId: user.uid,
        senderName: user.profile.fullName,
        senderRole: user.role,
        receiverId,
        type: selectedFile ? 'file' : 'text',
        content: newMessage,
        fileUrl,
        fileName,
        fileSize,
        status: 'sent',
        isDeleted: false,
      });

      setNewMessage('');
      setSelectedFile(null);

      // Refresh messages
      const messagesData = await getConversationMessages(conversationId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </Card>
    );
  }

  const otherParticipantId = conversation.participants.find((p) => p !== user?.uid);
  const otherParticipant = otherParticipantId
    ? conversation.participantDetails[otherParticipantId]
    : null;

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b p-4">
        {otherParticipant && (
          <div className="flex items-center gap-3">
            <Avatar
              src={otherParticipant.profilePicture}
              fallback={otherParticipant.name.charAt(0)}
              size="md"
            />
            <div>
              <h3 className="font-semibold">{otherParticipant.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {otherParticipant.role}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === user?.uid;
            const showDate =
              index === 0 ||
              formatDate(messages[index - 1].timestamp.toDate(), 'PP') !==
                formatDate(message.timestamp.toDate(), 'PP');

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatDate(message.timestamp.toDate(), 'PP')}
                    </span>
                  </div>
                )}
                <MessageBubble message={message} isOwnMessage={isOwnMessage} />
              </React.Fragment>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="border-t p-4">
        {selectedFile && (
          <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-background rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1"
          />

          <Button
            onClick={handleSendMessage}
            isLoading={isSending}
            disabled={!newMessage.trim() && !selectedFile}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const MessageBubble: React.FC<{
  message: Message;
  isOwnMessage: boolean;
}> = ({ message, isOwnMessage }) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwnMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {!isOwnMessage && (
          <p className="text-xs font-semibold mb-1">{message.senderName}</p>
        )}

        {message.type === 'file' && message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mb-2 underline"
          >
            <Paperclip className="h-4 w-4" />
            <span className="text-sm">{message.fileName}</span>
          </a>
        )}

        {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}

        <div className="flex items-center justify-end gap-2 mt-1">
          <span className="text-xs opacity-70">
            {formatDate(message.timestamp.toDate(), 'p')}
          </span>
          {isOwnMessage && (
            <span className="text-xs opacity-70">
              {message.status === 'read' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};