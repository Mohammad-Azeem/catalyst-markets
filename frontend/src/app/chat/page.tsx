'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your investment assistant. Ask me about stocks, IPOs, or investment strategies!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${base}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: 6 }}>
            AI Assistant
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)' }}>Investment Chat</h1>
          <p style={{ color: 'var(--txt-2)', fontSize: 14, marginTop: 8 }}>
            Ask about stocks, IPOs, valuations, or investment strategies
          </p>
        </div>

        {/* Chat Container */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: 500 }}>
          
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                marginBottom: 20, 
                display: 'flex', 
                gap: 12,
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: msg.role === 'user' ? 'var(--violet)' : 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message */}
                <div style={{
                  background: msg.role === 'user' ? 'var(--violet-lo)' : 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  maxWidth: '75%',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Bot size={16} />
                </div>
                <div style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 16px',
                }}>
                  <div className="skeleton" style={{ width: 100, height: 16 }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ 
            borderTop: '1px solid var(--border)', 
            padding: 20,
            background: 'var(--bg-2)',
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything about investing..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: 'var(--txt)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="btn btn-primary"
                style={{ padding: '12px 20px' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}