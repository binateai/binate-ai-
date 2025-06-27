import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SendIcon, Loader2, Plus, Trash2, Pin, Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  AIMessage, 
  AIChat,
  createChat, 
  getChats, 
  getChatMessages, 
  sendMessage, 
  deleteChat,
  updateChat,
  queryAssistant
} from '@/lib/ai-agent';

export default function AiChat() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [chats, setChats] = useState<AIChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const { toast } = useToast();

  // Fetch chat history on component mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const fetchedChats = await getChats();
        setChats(fetchedChats);
        
        // If there are chats, select the most recent one
        if (fetchedChats.length > 0) {
          // Sort by updatedAt in descending order and take the first
          const mostRecentChat = [...fetchedChats].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          
          setSelectedChatId(mostRecentChat.id);
          loadChatMessages(mostRecentChat.id);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your chat history',
          variant: 'destructive',
        });
      }
    };
    
    fetchChats();
  }, []);
  
  // Function to load messages for a selected chat
  const loadChatMessages = async (chatId: number) => {
    setLoading(true);
    try {
      const chatMessages = await getChatMessages(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages for this chat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to create a new chat
  const handleCreateNewChat = async () => {
    setCreatingChat(true);
    try {
      // Create a new chat with a default title
      const defaultTitle = `New Chat ${new Date().toLocaleString()}`;
      const newChat = await createChat(defaultTitle);
      
      // Add to chats list and select it
      setChats(prev => [newChat, ...prev]);
      setSelectedChatId(newChat.id);
      setMessages([]);
      
      toast({
        title: 'Chat Created',
        description: 'Started a new conversation',
      });
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create a new chat',
        variant: 'destructive',
      });
    } finally {
      setCreatingChat(false);
    }
  };
  
  // Function to handle chat selection change
  const handleChatChange = (chatId: string) => {
    const id = parseInt(chatId);
    setSelectedChatId(id);
    loadChatMessages(id);
  };
  
  // Function to delete a chat
  const handleDeleteChat = async () => {
    if (!selectedChatId) return;
    
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteChat(selectedChatId);
        
        // Remove from the chats list
        setChats(prev => prev.filter(chat => chat.id !== selectedChatId));
        
        // If there are other chats, select the most recent one
        if (chats.length > 1) {
          const remainingChats = chats.filter(chat => chat.id !== selectedChatId);
          const nextChat = [...remainingChats].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          
          setSelectedChatId(nextChat.id);
          loadChatMessages(nextChat.id);
        } else {
          // No more chats
          setSelectedChatId(null);
          setMessages([]);
        }
        
        toast({
          title: 'Chat Deleted',
          description: 'The conversation has been removed',
        });
      } catch (error) {
        console.error('Error deleting chat:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete the chat',
          variant: 'destructive',
        });
      }
    }
  };

  // Function to toggle chat pinning
  const handleTogglePinChat = async () => {
    if (!selectedChatId) return;
    
    const chatToUpdate = chats.find(chat => chat.id === selectedChatId);
    if (!chatToUpdate) return;
    
    try {
      const updatedChat = await updateChat(selectedChatId, { pinned: !chatToUpdate.pinned });
      
      // Update the chat in the list
      setChats(prev => {
        const updated = prev.map(chat => 
          chat.id === selectedChatId ? updatedChat : chat
        );
        
        // Sort: pinned chats first, then by updatedAt
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
      
      toast({
        title: updatedChat.pinned ? 'Chat Pinned' : 'Chat Unpinned',
        description: updatedChat.pinned ? 'This chat will stay at the top of your list' : 'This chat has been unpinned',
      });
    } catch (error) {
      console.error('Error updating chat pin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update chat pin status',
        variant: 'destructive',
      });
    }
  };
  
  // Function to export chat transcript
  const handleExportChat = () => {
    if (!selectedChatId || messages.length === 0) return;
    
    try {
      // Find the chat title
      const chat = chats.find(c => c.id === selectedChatId);
      const chatTitle = chat?.title || 'Chat Transcript';
      
      // Format messages as text
      const transcript = messages.map(msg => {
        const role = msg.role === 'user' ? 'You' : 'Binate AI';
        return `${role}: ${msg.content}`;
      }).join('\n\n');
      
      // Create a download link
      const element = document.createElement('a');
      const file = new Blob([transcript], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
      
      // Simulate click to download
      document.body.appendChild(element);
      element.click();
      
      // Cleanup
      document.body.removeChild(element);
      
      toast({
        title: 'Transcript Exported',
        description: 'Your chat transcript has been downloaded',
      });
    } catch (error) {
      console.error('Error exporting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to export the chat transcript',
        variant: 'destructive',
      });
    }
  };
  
  // Function to handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // If no chat is selected, create one
    if (!selectedChatId) {
      try {
        const defaultTitle = `Chat about ${query.substring(0, 20)}...`;
        const newChat = await createChat(defaultTitle);
        setChats(prev => [newChat, ...prev]);
        setSelectedChatId(newChat.id);
        
        // Now proceed with sending the message
        await sendMessageToSelectedChat(query, newChat.id);
      } catch (error) {
        console.error('Error creating chat for message:', error);
        toast({
          title: 'Error',
          description: 'Failed to create a new chat',
          variant: 'destructive',
        });
      }
    } else {
      // Send to existing chat
      await sendMessageToSelectedChat(query, selectedChatId);
    }
  };
  
  // Function to send a message to the selected chat
  const sendMessageToSelectedChat = async (messageContent: string, chatId: number) => {
    // Add the message locally for immediate feedback
    const optimisticUserMessage: AIMessage = { 
      role: 'user', 
      content: messageContent,
      chatId 
    };
    
    setMessages(prev => [...prev, optimisticUserMessage]);
    setQuery('');
    setLoading(true);
    
    try {
      // Send message through API and get AI response
      const { userMessage, aiResponse } = await sendMessage(chatId, messageContent);
      
      // Update messages with the official versions from the server
      setMessages(prev => {
        // Remove the optimistic message
        const filtered = prev.filter(m => 
          !(m.role === 'user' && m.content === messageContent && !m.id));
        
        // Add the official messages
        return [...filtered, userMessage, aiResponse];
      });
      
      // Update the chat title if this is the first message
      if (messages.length === 0) {
        // Generate a title based on the first message
        const title = messageContent.length > 30 
          ? `${messageContent.substring(0, 30)}...` 
          : messageContent;
          
        const updatedChat = await updateChat(chatId, { title });
        
        // Update the chat in the list
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? updatedChat : chat
        ));
      }
    } catch (error: any) {
      // Check if this is an API key error
      const errorMsg = error.message || 'Failed to get a response from the assistant';
      const isApiKeyError = errorMsg.includes('credit balance') || 
                           errorMsg.includes('API key') || 
                           errorMsg.includes('invalid_request_error');
      
      if (isApiKeyError) {
        toast({
          title: 'API Key Error',
          description: 'There is an issue with the Anthropic API key. Please contact your administrator.',
          variant: 'destructive',
        });
        
        // Add a system message explaining the situation
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: "I'm sorry, but I can't respond right now due to an API configuration issue. " +
                    "The Anthropic API key needs to be updated with sufficient credits. " +
                    "Please contact your administrator to resolve this issue."
          }
        ]);
      } else {
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // We'll need to track messages for all chats for search
  const [allChatMessages, setAllChatMessages] = useState<{[chatId: number]: AIMessage[]}>({});
  
  // Load all chat messages when search is activated
  useEffect(() => {
    const loadMessages = async () => {
      if (isSearching) {
        // Load messages for all chats when search is activated
        for (const chat of chats) {
          try {
            console.log(`Loading messages for chat ${chat.id} for search`);
            const chatMessages = await getChatMessages(chat.id);
            
            setAllChatMessages(prev => ({
              ...prev,
              [chat.id]: chatMessages
            }));
            
            console.log(`Loaded ${chatMessages.length} messages for chat ${chat.id}`);
          } catch (error) {
            console.error(`Error loading messages for chat ${chat.id}:`, error);
          }
        }
      }
    };
    
    loadMessages();
  }, [isSearching, chats]);
  
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    const searchTermLower = searchQuery.toLowerCase();
    
    return chats.filter(chat => {
      // Check if title contains search term
      if (chat.title.toLowerCase().includes(searchTermLower)) {
        return true;
      }
      
      // Check if any messages contain search term
      const chatMessages = allChatMessages[chat.id];
      if (chatMessages) {
        return chatMessages.some(msg => 
          msg.content.toLowerCase().includes(searchTermLower)
        );
      }
      
      return false;
    });
  }, [chats, searchQuery, allChatMessages]);
  
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Binate AI Assistant</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline" 
              size="sm" 
              onClick={handleCreateNewChat}
              disabled={creatingChat}
            >
              {creatingChat ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              New Chat
            </Button>
            {selectedChatId && (
              <>
                <Button
                  variant="outline" 
                  size="sm" 
                  onClick={handleTogglePinChat}
                  disabled={loading}
                  title={chats.find(c => c.id === selectedChatId)?.pinned ? "Unpin chat" : "Pin chat"}
                >
                  <Pin className={`h-4 w-4 ${chats.find(c => c.id === selectedChatId)?.pinned ? "fill-current" : ""}`} />
                  <span className="sr-only">{chats.find(c => c.id === selectedChatId)?.pinned ? "Unpin" : "Pin"}</span>
                </Button>
                
                <Button
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportChat}
                  disabled={loading || messages.length === 0}
                  title="Export chat transcript"
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Export</span>
                </Button>
                
                <Button
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteChat}
                  disabled={loading}
                  title="Delete chat"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>
        
        {chats.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              {isSearching && (
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSearching(!isSearching);
                  if (isSearching) setSearchQuery('');
                }}
                title={isSearching ? "Close search" : "Search chats"}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
            
            <Select
              value={selectedChatId?.toString() || ""}
              onValueChange={handleChatChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a conversation" />
              </SelectTrigger>
              <SelectContent>
                {filteredChats.map((chat: AIChat) => {
                  // Add a badge to show match type if we're searching
                  const chatMessages = allChatMessages[chat.id] || [];
                  const searchTermLower = searchQuery.toLowerCase();
                  const titleMatch = searchQuery && chat.title.toLowerCase().includes(searchTermLower);
                  const contentMatch = searchQuery && chatMessages.some(msg => 
                    msg.content.toLowerCase().includes(searchTermLower)
                  );
                  
                  return (
                    <SelectItem key={chat.id} value={chat.id.toString()}>
                      {chat.pinned && <Pin className="h-3 w-3 inline mr-1 fill-muted-foreground" />}
                      <span className="flex-1">{chat.title}</span>
                      {searchQuery && titleMatch && (
                        <span className="ml-1 px-1 text-xs bg-blue-100 dark:bg-blue-900 rounded">title</span>
                      )}
                      {searchQuery && contentMatch && (
                        <span className="ml-1 px-1 text-xs bg-green-100 dark:bg-green-900 rounded">content</span>
                      )}
                    </SelectItem>
                  );
                })}
                {filteredChats.length === 0 && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No chats found matching "{searchQuery}"
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <CardDescription className="mt-1">
          {selectedChatId 
            ? 'Continue your conversation with the assistant' 
            : 'Start a new conversation with the assistant'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto flex flex-col pt-2">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Ask me anything about your tasks, emails, or meetings!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted mr-auto'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !query.trim()}>
            <SendIcon className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}