import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { chatAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { ChatSession, ChatMessage as SchemaChatMessage } from "@shared/schema";

const quickQueries = [
  "What are the top phishing domains detected recently?",
  "Show me critical CVEs from the last few days",
  "Analyze recent malware trends in the threat feeds"
];

interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp: string;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      content: "Hello! I'm your Cyber Threat Intelligence Assistant powered by AI. I can help you analyze threats, search IOCs, and provide insights about your security data. What would you like to know?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await chatAPI.getSessions();
      if (response.data.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await chatAPI.createSession("New Conversation");
      if (response.data.success) {
        const newSession = response.data.session;
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setMessages([{
          id: 1,
          sender: "bot",
          content: "Hello! I'm your Cyber Threat Intelligence Assistant powered by AI. I can help you analyze threats, search IOCs, and provide insights about your security data. What would you like to know?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const response = await chatAPI.getSession(sessionId);
      if (response.data.success && response.data.session) {
        const session = response.data.session;
        setCurrentSessionId(session.id);
        
        if (session.messages && session.messages.length > 0) {
          const loadedMessages: Message[] = session.messages.map((msg: SchemaChatMessage, idx: number) => ({
            id: idx + 1,
            sender: msg.role === 'user' ? 'user' : 'bot',
            content: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(loadedMessages);
        } else {
          setMessages([{
            id: 1,
            sender: "bot",
            content: "Hello! I'm your Cyber Threat Intelligence Assistant powered by AI. I can help you analyze threats, search IOCs, and provide insights about your security data. What would you like to know?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([{
          id: 1,
          sender: "bot",
          content: "Hello! I'm your Cyber Threat Intelligence Assistant powered by AI. I can help you analyze threats, search IOCs, and provide insights about your security data. What would you like to know?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
      toast({
        title: "Session Deleted",
        description: "Chat session has been removed.",
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const saveSessionMessages = async (newMessages: Message[], title?: string) => {
    if (!currentSessionId || !isAuthenticated) return;
    
    try {
      const chatMessages: SchemaChatMessage[] = newMessages
        .filter(m => m.sender === 'user' || m.sender === 'bot')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
          timestamp: new Date().toISOString(),
        }));
      
      await chatAPI.updateSession(currentSessionId, chatMessages, title);
      fetchSessions();
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare conversation history - only last 4 messages for context (memory optimization)
      const recentMessages = messages.slice(-4);
      const conversationHistory = recentMessages.map(msg => ({
        sender: msg.sender,
        content: msg.content
      }));

      const response = await chatAPI.sendMessage(inputValue, conversationHistory);

      const botMessage: Message = {
        id: messages.length + 2,
        sender: "bot",
        content: response.data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      
      // Auto-generate title from first user message if new session
      const isFirstUserMessage = updatedMessages.filter(m => m.sender === 'user').length === 1;
      const title = isFirstUserMessage ? inputValue.slice(0, 50) + (inputValue.length > 50 ? '...' : '') : undefined;
      
      if (isAuthenticated && currentSessionId) {
        saveSessionMessages(finalMessages, title);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        id: messages.length + 2,
        sender: "bot",
        content: "I apologize, but I encountered an error processing your request. Please make sure the OpenAI API is configured correctly and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Chat Error",
        description: error.response?.data?.error || "Failed to get response from AI assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = (query: string) => {
    setInputValue(query);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Chat Assistant</h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          AI-powered threat intelligence analysis and querying
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Sessions
              </h3>
              {isAuthenticated && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={createNewSession}
                  data-testid="button-new-session"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {!isAuthenticated ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Sign in to save your chat sessions
                </p>
              ) : loadingSessions ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No sessions yet. Start a new conversation!
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`w-full text-left p-3 rounded-md hover-elevate border border-border cursor-pointer group relative ${
                      currentSessionId === session.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => loadSession(session.id)}
                    data-testid={`button-session-${session.id}`}
                  >
                    <p className="text-sm font-medium truncate pr-6">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(session.updatedAt)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => deleteSession(session.id, e)}
                      data-testid={`button-delete-session-${session.id}`}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[600px]">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold" data-testid="text-assistant-title">CTI Assistant</h3>
                <p className="text-xs text-muted-foreground">Online - Real-time threat analysis</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${message.id}`}
                >
                  {message.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[70%] ${message.sender === "user" ? "order-first" : ""}`}>
                    <div
                      className={`p-4 rounded-lg ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.sender === "bot" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <span className="whitespace-pre-line">{message.content}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">{message.timestamp}</p>
                  </div>
                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="max-w-[70%]">
                    <div className="p-4 rounded-lg bg-muted text-foreground flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing threat data...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Quick queries:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQueries.map((query, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleQuickQuery(query)}
                      data-testid={`button-quick-query-${idx}`}
                    >
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about threats, IOCs, CVEs..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                  disabled={isLoading}
                  data-testid="input-chat-message"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !inputValue.trim()}
                  data-testid="button-send-message"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
