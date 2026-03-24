'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    CheckCircle,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    action?: {
        type: string;
        action: string;
        data: any;
        reason: string;
        status: 'proposed' | 'approved' | 'executed' | 'rejected';
    };
}

export default function AIAssistantPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your AI Store Manager. I can help you analyze sales, manage inventory, or execute actions. How can I assist you today?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.content })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to get response');

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.data.answer || 'I processed that information.',
                timestamp: new Date(),
                action: data.data.suggestedAction ? {
                    ...data.data.suggestedAction,
                    status: 'proposed'
                } : undefined
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            logger.error({ message: 'Chat error', error });
            toast.error('AI is offline. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const executeAction = async (messageId: string, action: any) => {
        try {
            const toastId = toast.loading('Executing action...');

            const response = await fetch('/api/ai/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action.action,
                    payload: action.data,
                    reason: `Approved by user from chat: ${action.reason}`
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            toast.success('Action executed successfully!', { id: toastId });

            setMessages(prev => prev.map(m =>
                m.id === messageId && m.action
                    ? { ...m, action: { ...m.action, status: 'executed' }, content: m.content + '\n\n✅ Action Executed Successfully.' }
                    : m
            ));

        } catch (error) {
            toast.error('Failed to execute action');
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-full">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Store Manager</h1>
                    <p className="text-sm text-gray-500">Autonomous Retail Operations Assistant</p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-indigo-100 shadow-lg">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-4 max-w-[80%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                msg.role === 'user' ? "bg-indigo-600 text-white" : "glass-dark text-indigo-600 border border-indigo-100"
                            )}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                            </div>

                            <div className="space-y-2">
                                <div className={cn(
                                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "glass-dark text-gray-800 border border-indigo-50 rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>

                                {/* AI Action Card */}
                                {msg.action && (
                                    <div className="mt-2 text-sm glass-dark p-4 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-white">Suggested Action</h4>
                                                <p className="text-slate-400 mt-1">{msg.action.reason}</p>

                                                <div className="mt-3 bg-white/5 p-2 rounded text-xs font-mono text-slate-400">
                                                    {msg.action.action}
                                                </div>

                                                {msg.action.status === 'proposed' && (
                                                    <div className="mt-3 flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => executeAction(msg.id, msg.action)}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                                        >
                                                            Approve & Execute <ArrowRight className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-slate-400">
                                                            Dismiss
                                                        </Button>
                                                    </div>
                                                )}

                                                {msg.action.status === 'executed' && (
                                                    <div className="mt-3 flex items-center gap-2 text-green-600 font-medium text-xs">
                                                        <CheckCircle className="w-4 h-4" /> Executed successfully
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={cn(
                                    "text-xs text-gray-400 mt-1",
                                    msg.role === 'user' ? "text-right" : ""
                                )}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 glass-dark border-t border-indigo-50">
                    <div className="flex gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask AI to analyze sales, check stock, or suggest prices..."
                            className="flex-1 min-h-[50px] max-h-[150px] p-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm resize-none"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="h-[50px] w-[50px] rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center shrink-0"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-400">
                        AI can make mistakes. Please verify critical actions.
                    </div>
                </div>
            </Card>
        </div>
    );
}
