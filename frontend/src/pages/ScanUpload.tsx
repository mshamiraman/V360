import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Divider,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Schedule,
  ContentCopy,
  Info,
  ExpandMore,
  Terminal,
  FilePresent,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { scanAPI } from '../services/api';
import { Scan } from '../types';

const ScanUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedScans, setUploadedScans] = useState<Scan[]>([]);
  const [error, setError] = useState<string>('');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setError('');
    
    for (const file of acceptedFiles) {
      if (!file.name.endsWith('.xml')) {
        setError('Only XML files are allowed');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('File size must be less than 10MB');
        continue;
      }

      setUploading(true);
      try {
        const scan = await scanAPI.upload(file);
        setUploadedScans(prev => [scan, ...prev]);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Upload failed');
      } finally {
        setUploading(false);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
    },
    multiple: true,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'processing':
        return <Schedule color="warning" />;
      default:
        return <Schedule />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', mb: 1 }}>
          Scan Ingestion
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload your Nmap XML reports to trigger AI vulnerability analysis.
        </Typography>
      </Box>

      <Paper
        {...getRootProps()}
        sx={{
          p: 6,
          mb: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: (theme) => theme.palette.mode === 'dark' 
            ? (isDragActive ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.4)')
            : (isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.6)'),
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 6,
          transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ 
          width: 80, height: 80, borderRadius: '50%', 
          bgcolor: 'primary.main', opacity: 0.1, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <CloudUpload sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontFamily: '"Outfit", sans-serif' }}>
          {isDragActive ? 'Release to initiate upload' : 'Secure Data Ingestion'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Drag & drop Nmap XML files here, or click to browse files
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ borderRadius: 2.5, px: 4, py: 1.2, fontWeight: 700, textTransform: 'none' }}
          disabled={uploading}
        >
          {uploading ? 'Ingesting Data...' : 'Select Files'}
        </Button>
      </Paper>

      {uploading && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Analyzing Nmap XML...</Typography>
            <Typography variant="body2" color="text.secondary">In Progress</Typography>
          </Box>
          <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
      )}

      {uploadedScans.length > 0 && (
        <Card sx={{ mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'transparent', boxShadow: 'none' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Activities</Typography>
          </Box>
          <List disablePadding>
            {uploadedScans.map((scan, idx) => (
              <ListItem key={scan.id} divider={idx !== uploadedScans.length - 1} sx={{ px: 3, py: 2 }}>
                <ListItemIcon sx={{ minWidth: 48 }}>{getStatusIcon(scan.status)}</ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>{scan.filename}</Typography>}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {new Date(scan.upload_time).toLocaleString()} • {scan.file_size ? (scan.file_size / 1024).toFixed(1) : '0.0'} KB
                    </Typography>
                  }
                />
                <Chip
                  label={scan.status.toUpperCase()}
                  color={getStatusColor(scan.status) as any}
                  size="small"
                  sx={{ borderRadius: 1.5, fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                />
              </ListItem>
            ))}
          </List>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <Info color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Ingestion Protocols</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  'Upload Nmap XML results for vulnerability analysis',
                  'AI-driven parsing for CVE identification',
                  'Remediation steps generated via Gemini Pro',
                  'Secure processing within localized environment'
                ].map((text, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <CheckCircle sx={{ color: 'primary.main', fontSize: 18, mt: 0.3 }} />
                    <Typography variant="body2">{text}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Accordion 
            sx={{ 
              borderRadius: '16px !important', 
              border: '1px solid', 
              borderColor: 'divider', 
              bgcolor: 'background.paper',
              boxShadow: 'none',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1 }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Terminal color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Scan Generation Guide</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate compatible XML files using the following network orchestration commands.
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase' }}>Unix-based (Linux/macOS)</Typography>
                <Box sx={{ 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', 
                  p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '1px solid', borderColor: 'divider'
                }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    sudo nmap -sV -sC -oX scan.xml [target]
                  </Typography>
                  <Tooltip title="Copy command">
                    <IconButton size="small" onClick={() => copyToClipboard('sudo nmap -sV -sC -oX scan.xml <target_ip>')}>
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Note: Ensure service version detection (-sV) is enabled for optimal AI analysis results.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScanUpload;