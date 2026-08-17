import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  CircularProgress,
  Alert,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Visibility,
  OpenInNew,
  Delete,
  Refresh,
  ExpandMore,
  Search,
  FilterList,
  ChevronRight,
} from '@mui/icons-material';
import { vulnerabilityAPI } from '../services/api';
import { Vulnerability } from '../types';
import CommandBlock from '../components/CommandBlock';

// Function to format text with bold patterns
const formatTextWithBold = (text: string, lineIndex: number) => {
  if (!text.includes('**')) {
    return text;
  }

  const parts = [];
  let lastIndex = 0;
  let keyIndex = 0;
  
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push(
          <span key={`text-${lineIndex}-${keyIndex++}`}>{beforeText}</span>
        );
      }
    }
    
    // Add bold text
    parts.push(
      <strong key={`bold-${lineIndex}-${keyIndex++}`} style={{ color: '#6366F1', fontWeight: 'bold' }}>
        {match[1]}
      </strong>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <span key={`text-${lineIndex}-${keyIndex++}`}>{remainingText}</span>
      );
    }
  }
  
  return parts.length > 0 ? parts : text;
};

const Vulnerabilities: React.FC = () => {
  const [scanGroups, setScanGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [vulnToDelete, setVulnToDelete] = useState<Vulnerability | null>(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      const data = await vulnerabilityAPI.getVulnerabilitiesByScans();
      setScanGroups(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load vulnerabilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
  }, [severityFilter, statusFilter]);

  const handleStatusUpdate = async (vulnId: number, newStatus: string) => {
    try {
      await vulnerabilityAPI.updateStatus(vulnId, newStatus);
      setScanGroups(groups =>
        groups.map(group => ({
          ...group,
          vulnerabilities: group.vulnerabilities.map((v: Vulnerability) =>
            v.id === vulnId ? { ...v, status: newStatus as any } : v
          )
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedVuln || !feedbackRating) return;

    try {
      await vulnerabilityAPI.addFeedback(selectedVuln.id, {
        rating: feedbackRating,
        comment: feedbackComment,
        feedback_type: 'recommendation',
      });
      setFeedbackDialog(false);
      setFeedbackRating(null);
      setFeedbackComment('');
      setSelectedVuln(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit feedback');
    }
  };

  const handleDeleteVulnerability = async () => {
    if (!vulnToDelete) return;

    try {
      await vulnerabilityAPI.deleteVulnerability(vulnToDelete.id);
      setScanGroups(groups =>
        groups.map(group => ({
          ...group,
          vulnerabilities: group.vulnerabilities.filter((v: Vulnerability) => v.id !== vulnToDelete.id)
        })).filter(group => group.vulnerabilities.length > 0)
      );
      setDeleteDialog(false);
      setVulnToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete vulnerability');
    }
  };

  const handleRefreshCVE = async (vulnId: number) => {
    try {
      const updatedVuln = await vulnerabilityAPI.refreshCVEData(vulnId);
      setScanGroups(groups =>
        groups.map(group => ({
          ...group,
          vulnerabilities: group.vulnerabilities.map((v: Vulnerability) =>
            v.id === vulnId ? updatedVuln : v
          )
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to refresh CVE data');
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'patched':
        return 'success';
      case 'ignored':
        return 'default';
      case 'false_positive':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress thickness={5} size={48} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  const filteredScanGroups = scanGroups.map(group => ({
    ...group,
    vulnerabilities: group.vulnerabilities.filter((vuln: Vulnerability) => {
      const severityMatch = !severityFilter || vuln.severity === severityFilter;
      const statusMatch = !statusFilter || vuln.status === statusFilter;
      const searchMatch = !searchFilter ||
        vuln.service_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        vuln.description?.toLowerCase().includes(searchFilter.toLowerCase());
      return severityMatch && statusMatch && searchMatch;
    })
  })).filter(group => group.vulnerabilities.length > 0);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', mb: 1 }}>
          Vulnerabilities
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track security findings from your scans.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ 
        mb: 4, 
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4
      }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterList fontSize="small" /> Severity
                </InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity"
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="patched">Patched</MenuItem>
                  <MenuItem value="ignored">Ignored</MenuItem>
                  <MenuItem value="false_positive">False Positive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Search service or description"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                InputProps={{
                  startAdornment: <Search fontSize="small" color="action" sx={{ mr: 1 }} />,
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vulnerabilities Table */}
      {filteredScanGroups.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="h6" color="text.secondary">No vulnerabilities found matching filters</Typography>
          <Button variant="text" color="primary" onClick={() => { setSeverityFilter(''); setStatusFilter(''); setSearchFilter(''); }} sx={{ mt: 1 }}>
            Clear all filters
          </Button>
        </Card>
      ) : (
        filteredScanGroups.map((scanGroup, groupIndex) => (
          <Accordion 
            key={scanGroup.scan.id} 
            defaultExpanded={groupIndex === 0}
            sx={{ 
              mb: 2, 
              borderRadius: '16px !important',
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore />} 
              sx={{ 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                px: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                  {scanGroup.scan.original_filename || scanGroup.scan.filename}
                </Typography>
                <Chip 
                  label={`${scanGroup.vulnerabilities.length} Found`} 
                  size="small" 
                  color="primary" 
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', mr: 2 }}>
                  {new Date(scanGroup.scan.upload_time).toLocaleDateString()}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 2 }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>CVE / Score</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', pr: 3 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scanGroup.vulnerabilities.map((vuln: Vulnerability) => (
                      <TableRow key={vuln.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ 
                              width: 32, height: 32, borderRadius: 1.5, 
                              bgcolor: 'primary.main', opacity: 0.1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <ChevronRight sx={{ color: 'primary.main' }} fontSize="small" />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{vuln.service_name}</Typography>
                              <Typography variant="caption" color="text.secondary">Port {vuln.port} • v{vuln.service_version || '?'}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={vuln.severity || 'Unknown'}
                            size="small"
                            color={getSeverityColor(vuln.severity) as any}
                            sx={{ fontWeight: 700, minWidth: 80, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{vuln.cve_id || 'N/A'}</Typography>
                              {vuln.cve_id && (
                                <Link href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`} target="_blank" color="primary">
                                  <OpenInNew sx={{ fontSize: 14 }} />
                                </Link>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(vuln.cvss_score || 0) * 10} 
                                sx={{ width: 60, height: 4, borderRadius: 2, bgcolor: 'divider' }}
                                color={getSeverityColor(vuln.severity) as any}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {vuln.cvss_score ? vuln.cvss_score.toFixed(1) : '0.0'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={vuln.status}
                            size="small"
                            onChange={(e) => handleStatusUpdate(vuln.id, e.target.value)}
                            sx={{ 
                              borderRadius: 2, fontSize: '0.8rem', 
                              height: 32, minWidth: 110,
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                            }}
                          >
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="patched">Patched</MenuItem>
                            <MenuItem value="ignored">Ignored</MenuItem>
                            <MenuItem value="false_positive">False Positive</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setSelectedVuln(vuln)} color="primary"><Visibility fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Refresh CVE">
                            <IconButton size="small" onClick={() => handleRefreshCVE(vuln.id)} color="info"><Refresh fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setVulnToDelete(vuln); setDeleteDialog(true); }} color="error"><Delete fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Vulnerability Details Dialog */}
      <Dialog
        open={!!selectedVuln && !feedbackDialog}
        onClose={() => setSelectedVuln(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, bgcolor: 'background.paper' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
              Finding Analysis
            </Typography>
            {selectedVuln && (
              <Chip 
                label={selectedVuln.severity} 
                color={getSeverityColor(selectedVuln.severity) as any}
                sx={{ fontWeight: 800, borderRadius: 2 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedVuln && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={5}>
                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>TARGET INFORMATION</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{selectedVuln.service_name}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Port</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedVuln.port} / {selectedVuln.protocol}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Version</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedVuln.service_version || 'Unknown'}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Status</Typography><Typography variant="body2" sx={{ fontWeight: 700, color: getStatusColor(selectedVuln.status) + '.main' }}>{selectedVuln.status.toUpperCase()}</Typography></Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>CVE IDENTIFIER</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedVuln.cve_id || 'NO CVE DATA'}</Typography>
                    {selectedVuln.cve_id && <IconButton size="small" component={Link} href={`https://nvd.nist.gov/vuln/detail/${selectedVuln.cve_id}`} target="_blank"><OpenInNew fontSize="inherit" /></IconButton>}
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">CVSS VECTOR SCORE</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: getSeverityColor(selectedVuln.severity) + '.main' }}>{selectedVuln.cvss_score?.toFixed(1) || '0.0'}</Typography>
                      <LinearProgress variant="determinate" value={(selectedVuln.cvss_score || 0) * 10} sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} color={getSeverityColor(selectedVuln.severity) as any} />
                    </Box>
                  </Box>
                </Box>
              
              </Grid>
              
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility fontSize="small" /> VULNERABILITY DESCRIPTION
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, lineHeight: 1.7 }}>
                  {formatTextWithBold(selectedVuln.description || 'No description available.', 0)}
                </Typography>
                
                <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
                  MITIGATION STRATEGY
                </Typography>
                <Box sx={{ pl: 0 }}>
                  {selectedVuln.recommendation ? selectedVuln.recommendation.split(/\n/).map((line, idx) => {
                    const clean = line.trim();
                    if (!clean) return null;
                    if (clean.startsWith('##') || clean.match(/^\*\*.*\*\*$/)) {
                      return <Typography key={idx} variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 800 }}>{clean.replace(/[#*]/g, '')}</Typography>;
                    }
                    return (
                      <Typography key={idx} variant="body2" sx={{ mb: 1, display: 'flex', gap: 1 }}>
                        <Box sx={{ color: 'primary.main', mt: 0.2 }}>•</Box>
                        {formatTextWithBold(clean.replace(/^[*-\d.]+\s*/, ''), idx)}
                      </Typography>
                    );
                  }) : <Typography variant="body2" color="text.secondary italic">No recommendation generated.</Typography>}
                </Box>

                {selectedVuln.remediation_commands && selectedVuln.remediation_commands.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" color="secondary" gutterBottom sx={{ fontWeight: 700 }}>
                      REMEDIATION WORKFLOW
                    </Typography>
                    {selectedVuln.remediation_commands.map((cmd, i) => <CommandBlock key={i} command={cmd} index={i} />)}
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setSelectedVuln(null)} variant="contained" sx={{ borderRadius: 2, px: 4 }}>Close Analysis</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog}
        onClose={() => setFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Recommendation Quality Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>Help us improve by rating the AI-generated remediation steps.</Typography>
            <Rating
              value={feedbackRating}
              onChange={(_, val) => setFeedbackRating(val)}
              size="large"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth multiline rows={4} label="Technical Feedback"
              value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="e.g. commands were correct but for a different OS version..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
          <Button onClick={handleFeedbackSubmit} variant="contained" disabled={!feedbackRating} sx={{ borderRadius: 2 }}>Submit Review</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">This finding will be permanently removed from the scan report database.</Typography>
          {vulnToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', opacity: 0.1, borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>{vulnToDelete.service_name}</Typography>
              <Typography variant="caption" sx={{ color: 'error.main' }}>{vulnToDelete.cve_id || 'CVE Unknown'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteVulnerability} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete Finding</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vulnerabilities;