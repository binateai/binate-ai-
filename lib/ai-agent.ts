import { apiRequest } from "./queryClient";

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: number;
  chatId?: number;
  timestamp?: Date;
}

export interface AIChat {
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
}

export interface AIResponse {
  text: string;
  messages: AIMessage[];
}

// Function to generate an email reply
export async function generateEmailReply(emailContent: string, preferences: any): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/draft-email', {
      emailContent,
      preferences
    });
    
    const data = await response.json();
    return data.body;
  } catch (error) {
    console.error('Error generating email reply:', error);
    throw new Error('Failed to generate email reply');
  }
}

// Function to summarize an email
export async function summarizeEmail(emailContent: string): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/ai/summarize-email', {
      body: emailContent
    });
    
    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error('Error summarizing email:', error);
    throw new Error('Failed to summarize email');
  }
}

// Function to generate meeting preparation notes
export async function generateMeetingPrep(eventId: number): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/ai/meeting-prep', {
      eventId
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating meeting prep:', error);
    throw new Error('Failed to generate meeting preparation');
  }
}

// Function to generate a task based on an email or calendar event
export async function generateTask(context: { source: 'email' | 'event', content: any }): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-task', {
      ...context
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating task:', error);
    throw new Error('Failed to generate task');
  }
}

// Function to generate invoice from template
export async function generateInvoice(invoiceData: any): Promise<any> {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-invoice', {
      ...invoiceData
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw new Error('Failed to generate invoice');
  }
}

// Chat management functions
export async function getChats(): Promise<AIChat[]> {
  try {
    const response = await apiRequest('GET', '/api/ai/chats');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw new Error('Failed to fetch chat history');
  }
}

export async function createChat(title: string): Promise<AIChat> {
  try {
    const response = await apiRequest('POST', '/api/ai/chats', { 
      title,
      pinned: false
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw new Error('Failed to create new chat');
  }
}

export async function updateChat(chatId: number, updates: Partial<AIChat>): Promise<AIChat> {
  try {
    const response = await apiRequest('PATCH', `/api/ai/chats/${chatId}`, updates);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating chat:', error);
    throw new Error('Failed to update chat');
  }
}

export async function deleteChat(chatId: number): Promise<void> {
  try {
    await apiRequest('DELETE', `/api/ai/chats/${chatId}`);
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw new Error('Failed to delete chat');
  }
}

export async function getChatMessages(chatId: number): Promise<AIMessage[]> {
  try {
    const response = await apiRequest('GET', `/api/ai/chats/${chatId}/messages`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw new Error('Failed to fetch messages');
  }
}

export async function sendMessage(chatId: number, content: string): Promise<{userMessage: AIMessage, aiResponse: AIMessage}> {
  try {
    const response = await apiRequest('POST', `/api/ai/chats/${chatId}/messages`, {
      role: 'user',
      content
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

// Legacy function to handle general AI assistant queries (without persistence)
export async function queryAssistant(query: string, history: AIMessage[] = []): Promise<AIResponse> {
  try {
    const response = await apiRequest('POST', '/api/ai/query', {
      query,
      history
    });
    
    const data = await response.json();
    return {
      text: data.response,
      messages: [...history, { role: 'user', content: query }, { role: 'assistant', content: data.response }]
    };
  } catch (error) {
    console.error('Error querying AI assistant:', error);
    throw new Error('Failed to get a response from the AI assistant');
  }
}
