import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  MenuItem,
  InputAdornment,
  Paper,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Drafts,
  ArrowBack,
  Search,
  InfoOutlined,
  Email,
  Check,
  Save,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { scanAPI } from '../services/api';
import { ScanTemplate, SCAN_TEMPLATES } from '../constants/scanTemplates';

export type { ScanTemplate };

const TEMPLATES: ScanTemplate[] = SCAN_TEMPLATES;

const NewScan: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<ScanTemplate | null>(TEMPLATES[0]);
  const [activeStep, setActiveStep] = useState<'templates' | 'configure'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Configuration Form State
  const [scanName, setScanName] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('My Scans');
  const [schedule, setSchedule] = useState('Now');
  const [targets, setTargets] = useState('192.168.1.0/24\nexample.com\n10.0.0.5');
  const [emailNotification, setEmailNotification] = useState(true);

  // Execution state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTemplate = (template: ScanTemplate) => {
    setSelectedTemplate(template);
    setScanName(`${template.name} - ${new Date().toLocaleDateString()}`);
    setActiveStep('configure');
    setError(null);
  };

  const handleSaveScan = async () => {
    if (!targets.trim()) {
      setError('Please enter at least one target domain, host, or IP range.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const scanData = {
        template_id: selectedTemplate?.id || 'basic_network',
        name: scanName || selectedTemplate?.name || 'Live Target Scan',
        description,
        targets,
        folder,
        schedule,
        email_notification: emailNotification,
      };

      await scanAPI.saveScan(scanData);
      navigate('/scan/history');
    } catch (err: any) {
      console.error('Failed to save scan:', err);
      setError(err.response?.data?.detail || 'Failed to save scan. Please check target syntax and try again.');
      setIsSaving(false);
    }
  };

  const filteredTemplates = TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 2, px: { xs: 1, sm: 3 } }}>
      {/* VIEW 1: TEMPLATES GRID */}
      {activeStep === 'templates' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: 'text.primary', mb: 0.5 }}>
                Scan Templates
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Choose a template to launch a Quamrah vulnerability assessment.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                size="small"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 220 }}
              />
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => handleSelectTemplate(TEMPLATES[0])}
                sx={{
                  bgcolor: '#6366F1',
                  '&:hover': { bgcolor: '#4F46E5' },
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                }}
              >
                Scan Now - Host Discovery
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              All templates
            </Typography>
            <Chip label={`${filteredTemplates.length} available`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>

          <Grid container spacing={2.5}>
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <Grid item xs={12} sm={6} md={6} key={template.id}>
                  <Card
                    onClick={() => handleSelectTemplate(template)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '16px',
                      border: '1.5px solid',
                      borderColor: isSelected ? '#6366F1' : 'divider',
                      bgcolor: 'background.paper',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      boxShadow: isSelected ? '0 8px 24px rgba(99, 102, 241, 0.15)' : 'none',
                      '&:hover': {
                        borderColor: '#6366F1',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.06)',
                      },
                    }}
                  >
                    {isSelected && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: '#6366F1',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check sx={{ fontSize: 14 }} />
                      </Box>
                    )}
                    {template.tag && (
                      <Chip
                        label={template.tag}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 14,
                          right: isSelected ? 44 : 14,
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: 'action.hover',
                        }}
                      />
                    )}
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '14px',
                          bgcolor: 'rgba(99, 102, 241, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        {template.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.875rem' }}>
                        {template.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* VIEW 2: TARGET & LAUNCHER CONFIGURATION */}
      {activeStep === 'configure' && selectedTemplate && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => setActiveStep('templates')}
              sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', mb: 1 }}
            >
              Back to Scan Templates
            </Button>
          </Box>

          {/* Selected Template Header Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '16px',
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {selectedTemplate.icon}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                {selectedTemplate.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTemplate.description}
              </Typography>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          {/* Configuration Form Sections */}
          <Grid container spacing={3}>
            {/* Basic Settings */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
                  Basic settings
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Scan name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={scanName}
                      onChange={(e) => setScanName(e.target.value)}
                      placeholder="e.g. Production Network Vulnerability Scan"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Description
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional context for your team"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Folder
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                    >
                      <MenuItem value="My Scans">My Scans</MenuItem>
                      <MenuItem value="Production Assets">Production Assets</MenuItem>
                      <MenuItem value="External Domains">External Domains</MenuItem>
                      <MenuItem value="Staging Environment">Staging Environment</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Schedule
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                    >
                      <MenuItem value="Now">Launch Immediately (Now)</MenuItem>
                      <MenuItem value="Daily">Daily Recurring</MenuItem>
                      <MenuItem value="Weekly">Weekly Automated Scan</MenuItem>
                      <MenuItem value="Monthly">Monthly Security Assessment</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Targets Section */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Targets
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                  Hosts, IP ranges or CIDR blocks
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  value={targets}
                  onChange={(e) => setTargets(e.target.value)}
                  placeholder={`192.168.1.0/24\nexample.com\nsubdomain.example.com\n10.0.0.5`}
                  sx={{
                    fontFamily: 'monospace',
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  One target per line, or comma separated. Enter domain names, subdomains, IP addresses or CIDR network blocks.
                </Typography>
              </Paper>
            </Grid>

            {/* Notifications */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Notifications
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Email me when the scan completes
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Results are also pushed to Aman V360 AI analysis automatically.
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Action Buttons Footer */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Drafts />}
              onClick={() => navigate('/scan/history')}
              disabled={isSaving}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'divider',
                color: 'text.primary',
                px: 3,
                py: 1,
              }}
            >
              Save as draft
            </Button>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveScan}
              disabled={isSaving}
              sx={{
                bgcolor: '#6366F1',
                '&:hover': { bgcolor: '#4F46E5' },
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3.5,
                py: 1,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NewScan;
