import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Clock } from "lucide-react";

// Mock data for quick queries (Chat Assistant is currently skipped from implementation)
const quickQueries = [
  "What are the top phishing domains this week?",
  "Show me critical CVEs from last 24h",
  "Analyze recent malware trends"
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
      content: "Hello! I'm your Cyber Threat Intelligence Assistant. I can help you analyze threats, search IOCs, and provide insights about your security data. What would you like to know?",
      timestamp: "10:30 AM"
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        sender: "bot",
        content: `Based on our threat feed analysis, here are the top phishing domains detected this week:\n\n🔴 malicious-banking-site.com - 47 detections\n🔴 fake-crypto-exchange.org - 32 detections\n🟡 phish-paypal.net - 28 detections\n🟡 evil-amazon.co - 23 detections\n🟢 scam-microsoft.org - 19 detections\n\n**Trend Analysis:** Phishing attacks targeting financial services increased by 34% compared to last week. Most campaigns are using typosquatting techniques.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleQuickQuery = (query: string) => {
    setInputValue(query);
    setTimeout(() => handleSend(), 100);
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
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Sessions
            </h3>
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <button
                  key={session.id}
                  className="w-full text-left p-3 rounded-md hover-elevate border border-border"
                  data-testid={`button-session-${session.id}`}
                >
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{session.time}</p>
                </button>
              ))}
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
                <p className="text-xs text-muted-foreground">Online</p>
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
                      className={`p-4 rounded-lg whitespace-pre-line ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.content}
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
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  data-testid="input-chat-message"
                />
                <Button onClick={handleSend} data-testid="button-send-message">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
