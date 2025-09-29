'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Settings, 
  Send,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Phone,
  Mail,
  Bot,
  Zap,
  BarChart3
} from 'lucide-react';

interface WhatsAppIntegration {
  id: string;
  phoneNumber: string;
  businessName: string;
  isActive: boolean;
  webhookUrl: string;
  apiKey: string;
  lastSync: string;
  settings: {
    autoReply: boolean;
    businessHours: string;
    timezone: string;
    welcomeMessage: string;
    awayMessage: string;
  };
  stats: {
    totalMessages: number;
    messagesToday: number;
    activeConversations: number;
    responseRate: number;
  };
}

interface Conversation {
  id: string;
  customerName: string;
  phoneNumber: string;
  lastMessage: string;
  lastMessageTime: string;
  status: string;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  status: string;
}

export default function WhatsAppIntegrationPage() {
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    fetchWhatsAppData();
  }, []);

  const fetchWhatsAppData = async () => {
    try {
      setLoading(true);
      
      // Fetch WhatsApp integration status
      const integrationResponse = await fetch('/api/integrations/whatsapp');
      if (integrationResponse.ok) {
        const integrationData = await integrationResponse.json();
        
        if (integrationData.success) {
          setIntegration(integrationData.data);
        }
      } else {
        // Mock data for development
        setIntegration({
          id: '1',
          phoneNumber: '+1234567890',
          businessName: 'SmartStore Business',
          isActive: true,
          webhookUrl: 'https://api.smartstore.com/webhooks/whatsapp',
          apiKey: 'wa_****_secret',
          lastSync: '2024-01-18T10:30:00Z',
          settings: {
            autoReply: true,
            businessHours: '09:00-17:00',
            timezone: 'Asia/Colombo',
            welcomeMessage: 'Hello! Welcome to SmartStore. How can I help you today?',
            awayMessage: 'Thank you for contacting us. We are currently offline and will respond during business hours.'
          },
          stats: {
            totalMessages: 1250,
            messagesToday: 45,
            activeConversations: 12,
            responseRate: 95.5
          }
        });
      }

      // Fetch conversations
      const conversationsResponse = await fetch('/api/integrations/whatsapp/messages');
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        
        if (conversationsData.success) {
          setConversations(conversationsData.data || []);
        }
      } else {
        // Mock data for development
        setConversations([
          {
            id: '1',
            customerName: 'John Doe',
            phoneNumber: '+1234567891',
            lastMessage: 'Hi, I want to track my order',
            lastMessageTime: '2024-01-18T14:30:00Z',
            status: 'active',
            unreadCount: 2
          },
          {
            id: '2',
            customerName: 'Jane Smith',
            phoneNumber: '+1234567892',
            lastMessage: 'Thank you for the quick response!',
            lastMessageTime: '2024-01-18T13:45:00Z',
            status: 'resolved',
            unreadCount: 0
          },
          {
            id: '3',
            customerName: 'Bob Johnson',
            phoneNumber: '+1234567893',
            lastMessage: 'What are your business hours?',
            lastMessageTime: '2024-01-18T12:15:00Z',
            status: 'pending',
            unreadCount: 1
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, message: string) => {
    try {
      const response = await fetch('/api/integrations/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message,
          type: 'text'
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchWhatsAppData();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      sendMessage(selectedConversation, newMessage.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Integration</h1>
          <p className="text-gray-600">Manage your WhatsApp Business API integration</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchWhatsAppData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowSettingsModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Integration Status */}
      {integration && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  WhatsApp Business API
                </CardTitle>
                <CardDescription>
                  Connected to {integration.businessName} ({integration.phoneNumber})
                </CardDescription>
              </div>
              <Badge variant={integration.isActive ? "default" : "secondary"}>
                {integration.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-2xl font-bold">{integration.stats.totalMessages}</div>
                <p className="text-sm text-gray-500">Total Messages</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{integration.stats.messagesToday}</div>
                <p className="text-sm text-gray-500">Messages Today</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{integration.stats.activeConversations}</div>
                <p className="text-sm text-gray-500">Active Conversations</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{integration.stats.responseRate}%</div>
                <p className="text-sm text-gray-500">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Recent customer conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {conversation.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{conversation.customerName}</p>
                            <p className="text-xs text-gray-500">{conversation.phoneNumber}</p>
                          </div>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{conversation.lastMessage}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                {selectedConversationData ? (
                  <div>
                    <CardTitle className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                        {selectedConversationData.customerName.charAt(0)}
                      </div>
                      {selectedConversationData.customerName}
                    </CardTitle>
                    <CardDescription>{selectedConversationData.phoneNumber}</CardDescription>
                  </div>
                ) : (
                  <div>
                    <CardTitle>Select a conversation</CardTitle>
                    <CardDescription>Choose a conversation from the list to start chatting</CardDescription>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {selectedConversationData ? (
                  <div className="space-y-4">
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
                      {/* Mock messages */}
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                          <p className="text-sm">Hello! How can I help you today?</p>
                          <p className="text-xs opacity-75 mt-1">14:30</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                          <p className="text-sm">Hi, I want to track my order</p>
                          <p className="text-xs text-gray-500 mt-1">14:32</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                          <p className="text-sm">Sure! Please provide your order number.</p>
                          <p className="text-xs opacity-75 mt-1">14:33</p>
                        </div>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                    <p className="text-gray-500">Select a conversation from the list to start chatting with your customers.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.5 min</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8/5</div>
                <p className="text-xs text-muted-foreground">
                  Average rating
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Auto-Reply Rate</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">
                  Messages handled automatically
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message Trends</CardTitle>
              <CardDescription>Daily message volume over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Message analytics chart will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {integration && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Settings</CardTitle>
                  <CardDescription>Configure your WhatsApp Business API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={integration.phoneNumber} disabled />
                  </div>
                  <div>
                    <Label>Business Name</Label>
                    <Input value={integration.businessName} disabled />
                  </div>
                  <div>
                    <Label>Webhook URL</Label>
                    <Input value={integration.webhookUrl} disabled />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input value={integration.apiKey} type="password" disabled />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automation Settings</CardTitle>
                  <CardDescription>Configure automated responses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-Reply</Label>
                      <p className="text-sm text-gray-500">Enable automatic responses</p>
                    </div>
                    <Badge variant={integration.settings.autoReply ? "default" : "secondary"}>
                      {integration.settings.autoReply ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div>
                    <Label>Business Hours</Label>
                    <Input value={integration.settings.businessHours} disabled />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Input value={integration.settings.timezone} disabled />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>WhatsApp Settings</CardTitle>
              <CardDescription>Configure your WhatsApp integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Welcome Message</Label>
                <Input
                  value={integration?.settings.welcomeMessage || ''}
                  placeholder="Enter welcome message"
                />
              </div>
              <div>
                <Label>Away Message</Label>
                <Input
                  value={integration?.settings.awayMessage || ''}
                  placeholder="Enter away message"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowSettingsModal(false)}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
