import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getUserConversations } from '@/lib/firebase/firestore';
import { Card, CardContent } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { formatRelativeTime } from '@/utils/formatters';
import { ChatWindow } from './ChatWindow';
import type { Conversation } from '@/types';

export const MessagesList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Add early return if no user
  useEffect(() => {
    const fetchConversations = async () => {
      // ✅ Guard clause - exit if no user
      if (!user || !user.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getUserConversations(user.uid);
        setConversations(data);

        // Auto-select conversation from URL params
        const conversationId = searchParams.get('conversation');
        if (conversationId) {
          setSelectedConversation(conversationId);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user?.uid, searchParams]); // ✅ Use optional chaining in dependency

  // ✅ Filter only if user exists
  const filteredConversations = conversations.filter((conv) => {
    if (!user?.uid) return false; // ✅ Safety check
    
    const otherParticipant = conv.participants.find((p) => p !== user.uid);
    if (!otherParticipant) return false;

    const participantName = conv.participantDetails?.[otherParticipant]?.name || '';
    return participantName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ✅ No user state
  if (!user || !user.uid) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load messages</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your conversations.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Sign In
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* Conversations List */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold mb-4">Messages</h2>
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      userId={user.uid}
                      isSelected={selectedConversation === conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  {!searchTerm && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Start a conversation with your teacher or students
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          {selectedConversation ? (
            <ChatWindow conversationId={selectedConversation} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center p-6">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const ConversationItem: React.FC<{
  conversation: Conversation;
  userId: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ conversation, userId, isSelected, onClick }) => {
  const otherParticipantId = conversation.participants.find((p) => p !== userId);
  const otherParticipant = otherParticipantId
    ? conversation.participantDetails?.[otherParticipantId] // ✅ Added optional chaining
    : null;

  if (!otherParticipant) return null;

  const unreadCount = conversation.unreadCount?.[userId] || 0; // ✅ Added optional chaining

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left hover:bg-accent transition-colors ${
        isSelected ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar
            src={otherParticipant.profilePicture}
            fallback={otherParticipant.name?.charAt(0) || '?'} // ✅ Added optional chaining and fallback
            size="md"
          />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold truncate">{otherParticipant.name || 'Unknown User'}</p>
            {conversation.lastMessageAt && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(
                  conversation.lastMessageAt.toDate 
                    ? conversation.lastMessageAt.toDate() 
                    : new Date(conversation.lastMessageAt)
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {conversation.lastMessage || 'No messages yet'}
          </p>
        </div>
      </div>
    </button>
  );
};