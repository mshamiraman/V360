import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Grid,
  Avatar,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  History,
  Delete,
  Edit,
  MoreVert,
  Add,
  Archive,
} from '@mui/icons-material';
import { aiAPI, conversationAPI } from '../services/api';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  conversation_id?: string;
}

interface Conversation {
  conversation_id: string;
  title?: string;
  context_type: string;
  message_count: number;
  is_active: boolean;
  created_at: string;
  last_activity_at: string;
}

// Custom formatter for AI responses
const formatAIResponse = (content: string) => {
  // Helper function to format text with bold patterns
  const formatText = (text: string, lineIndex: number) => {
    const parts = [];
    let lastIndex = 0;
    let keyIndex = 0;
    
    // Find all bold patterns **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    // Reset regex state
    boldRegex.lastIndex = 0;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add any text before this match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(
            <span key={`text-${lineIndex}-${keyIndex++}`}>{beforeText}</span>
          );
        }
      }
      
      // Add the bold text
      parts.push(
        <strong key={`bold-${lineIndex}-${keyIndex++}`} style={{ color: '#1976d2', fontWeight: 'bold' }}>
          {match[1]}
        </strong>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text after the last match
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(
          <span key={`text-${lineIndex}-${keyIndex++}`}>{remainingText}</span>
        );
      }
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Split content by lines and format each line
  return content.split('\n').map((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return <br key={index} />;
    
    // Handle headers (### or ## or patterns like **Header:**)
    if (trimmedLine.startsWith('###')) {
      return (
        <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
          {trimmedLine.replace(/^#+\s*/, '')}
        </Typography>
      );
    }
    
    if (trimmedLine.startsWith('##')) {
      return (
        <Typography key={index} variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
          {trimmedLine.replace(/^#+\s*/, '')}
        </Typography>
      );
    }
    
    // Handle bold headers like **Header:** or **Section Name**
    if (/^\*\*([^\*]+)\*\*\s*:?\s*$/.test(trimmedLine)) {
      const headerText = trimmedLine.replace(/^\*\*([^\*]+)\*\*\s*:?\s*$/, '$1');
      return (
        <Typography key={index} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
          {headerText}
        </Typography>
      );
    }
    
    // Handle bullet points
    if (trimmedLine.match(/^[\*\-]\s/)) {
      const content = trimmedLine.replace(/^[\*\-]\s/, '');
      const formattedContent = formatText(content, index);
      return (
        <Typography key={index} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
          <span style={{ marginRight: '8px', color: '#1976d2', fontWeight: 'bold' }}>•</span>
          <span>{formattedContent}</span>
        </Typography>
      );
    }
    
    // Handle numbered lists
    if (trimmedLine.match(/^\d+\./)) {
      return (
        <Typography key={index} variant="body2" sx={{ mb: 0.5, ml: 1 }}>
          {trimmedLine}
        </Typography>
      );
    }
    
    // Check if line has any formatting (bold text)
    if (/\*\*.*?\*\*/.test(trimmedLine)) {
      return (
        <Typography key={index} variant="body1" sx={{ mb: 1 }}>
          {formatText(trimmedLine, index)}
        </Typography>
      );
    }
    
    // Regular text
    return (
      <Typography key={index} variant="body1" sx={{ mb: 1 }}>
        {trimmedLine}
      </Typography>
    );
  });
};

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; conversationId: string } | null>(null);

  const suggestedQuestions = [
    'What are my most critical vulnerabilities?',
    'How can I improve my security posture?',
    'What services should I patch first?',
    'Show me vulnerabilities by severity',
    'What is my overall risk score?',
  ];

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation messages when current conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    } else {
      // Show welcome message for new conversation
      setMessages([{
        id: '1',
        type: 'ai',
        content: 'Hello! I\'m your AI security assistant. I can help you understand your vulnerability scan results, provide recommendations, and answer questions about your security posture. What would you like to know?',
        timestamp: new Date(),
      }]);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await conversationAPI.getConversations();
      console.log('Loaded conversations:', data); // Debug log
      setConversations(data);
      
      // Don't auto-select any conversation - always start with a new chat
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(`Failed to load conversations: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const data = await conversationAPI.getConversationMessages(conversationId);
      console.log('Loaded conversation messages:', data); // Debug log
      
      const formattedMessages: Message[] = data.map((msg: any) => ({
        id: msg.id.toString(),
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        conversation_id: conversationId,
      }));
      
      setMessages(formattedMessages);
    } catch (err: any) {
      console.error('Failed to load conversation messages:', err);
      setError(`Failed to load conversation history: ${err.response?.data?.detail || err.message}`);
      // Set empty messages on error to avoid showing stale data
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([{
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI security assistant. I can help you understand your vulnerability scan results, provide recommendations, and answer questions about your security posture. What would you like to know?',
      timestamp: new Date(),
    }]);
  };

  const handleConversationSelect = (conversationId: string) => {
    console.log('Selecting conversation:', conversationId); // Debug log
    setCurrentConversationId(conversationId);
    setError(''); // Clear any previous errors
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await conversationAPI.deleteConversation(conversationId);
      await loadConversations();
      
      // If deleted conversation was selected, create new conversation
      if (currentConversationId === conversationId) {
        createNewConversation();
      }
    } catch (err: any) {
      setError('Failed to delete conversation');
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await conversationAPI.archiveConversation(conversationId);
      await loadConversations();
    } catch (err: any) {
      setError('Failed to archive conversation');
    }
  };

  const handleEditTitle = async (conversationId: string, title: string) => {
    try {
      await conversationAPI.updateConversationTitle(conversationId, title);
      await loadConversations();
      setEditingTitle(null);
      setNewTitle('');
    } catch (err: any) {
      setError('Failed to update conversation title');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversationId: string) => {
    setMenuAnchor({ element: event.currentTarget, conversationId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleSendMessage = async () => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
      conversation_id: currentConversationId || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    setError('');

    try {
      const requestData: any = { query };
      if (currentConversationId) {
        requestData.conversation_id = currentConversationId;
      }
      
      const response = await aiAPI.query(requestData);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response,
        timestamp: new Date(),
        conversation_id: response.conversation_id,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // If this was a new conversation, update the current conversation ID and reload conversations
      if (!currentConversationId && response.conversation_id) {
        setCurrentConversationId(response.conversation_id);
        await loadConversations();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setQuery(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', mb: 0.5 }}>
            AI Security Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Intelligent analysis of your security posture and remediation steps.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={createNewConversation}
          sx={{ borderRadius: 3, px: 3 }}
        >
          New Chat
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Conversation History Sidebar */}
        <Grid item xs={12} md={3} sx={{ height: '100%', display: { xs: 'none', md: 'block' } }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History fontSize="small" color="primary" />
                History
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              {loadingConversations ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  {conversations.map((conversation) => (
                    <ListItem
                      key={conversation.conversation_id}
                      disablePadding
                      sx={{ mb: 0.5 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => handleMenuOpen(e, conversation.conversation_id)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemButton
                        selected={currentConversationId === conversation.conversation_id}
                        onClick={() => handleConversationSelect(conversation.conversation_id)}
                        sx={{ 
                          borderRadius: 2,
                          '&.Mui-selected': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                          }
                        }}
                      >
                        <ListItemText
                          primary={conversation.title || 'Untitled Chat'}
                          secondary={new Date(conversation.last_activity_at).toLocaleDateString()}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: currentConversationId === conversation.conversation_id ? 700 : 500,
                            noWrap: true
                          }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0,
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'transparent'
          }}>
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  <Box sx={{ maxWidth: '85%' }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: message.type === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: message.type === 'user' 
                        ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' 
                        : (theme) => theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                      color: message.type === 'user' ? 'white' : 'text.primary',
                      boxShadow: message.type === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                    }}>
                      <Box display="flex" alignItems="center" mb={1} sx={{ opacity: 0.8 }}>
                        {message.type === 'ai' ? <SmartToy sx={{ mr: 1, fontSize: 16 }} /> : <Person sx={{ mr: 1, fontSize: 16 }} />}
                        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          {message.type === 'ai' ? 'Assistant' : 'Analyst'}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        '& p': { mb: 1.5 }, 
                        '& p:last-child': { mb: 0 },
                        '& strong': { color: message.type === 'user' ? 'white' : 'primary.main' }
                      }}>
                        {message.type === 'ai' ? formatAIResponse(message.content) : (
                          <Typography variant="body1">{message.content}</Typography>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 0.5, px: 1, display: 'block', opacity: 0.5, textAlign: message.type === 'user' ? 'right' : 'left' }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              {loading && (
                <Box display="flex" justifyContent="flex-start">
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: '20px 20px 20px 4px',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <CircularProgress size={16} thickness={6} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>AI is analyzing security data...</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                bgcolor: 'background.paper', 
                p: 1, 
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Ask about vulnerabilities, patches, or risk scores..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  sx={{ 
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiOutlinedInput-root': { px: 2 }
                  }}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={loading || !query.trim()}
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                  }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>
        {/* Suggestions Sidebar */}
        <Grid item xs={12} md={3} sx={{ height: '100%', display: { xs: 'none', md: 'block' } }}>
          <Card sx={{ height: '100%', p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Suggested Queries
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handleSuggestedQuestion(question)}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textAlign: 'left',
                    borderRadius: 2,
                    borderColor: 'divider',
                    color: 'text.secondary',
                    fontSize: '0.8rem',
                    py: 1,
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.main', color: 'white' }
                  }}
                >
                  {question}
                </Button>
              ))}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Quick Insight
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Latest Scan" onClick={() => setQuery('Analyze my latest scan')} sx={{ cursor: 'pointer' }} />
              <Chip label="Critical Fixes" color="error" onClick={() => setQuery('Show critical fixes')} sx={{ cursor: 'pointer' }} />
              <Chip label="Risk Level" color="warning" onClick={() => setQuery('What is my risk level?')} sx={{ cursor: 'pointer' }} />
            </Box>
            
            <Box sx={{ mt: 'auto', pt: 3 }}>
              <Alert severity="info" icon={false} sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  💡 PRO TIP:
                </Typography>
                <Typography variant="caption" display="block">
                  Ask for OS-specific patching commands to get copy-pasteable terminal code.
                </Typography>
              </Alert>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Menus */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 2, mt: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
      >
        <MenuItem onClick={() => { if(menuAnchor) setEditingTitle(menuAnchor.conversationId); handleMenuClose(); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={() => { if(menuAnchor) handleArchiveConversation(menuAnchor.conversationId); handleMenuClose(); }}>
          <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
          Archive
        </MenuItem>
        <MenuItem onClick={() => { if(menuAnchor) handleDeleteConversation(menuAnchor.conversationId); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AIAssistant;