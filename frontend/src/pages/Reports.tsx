import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add,
  Download,
  Visibility,
  Assessment,
  Delete,
  FilePresent,
  CheckCircle,
  TrendingUp,
} from '@mui/icons-material';
import { reportAPI, scanAPI } from '../services/api';
import { Report, Scan } from '../types';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generateDialog, setGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [selectedScanId, setSelectedScanId] = useState<number | ''>('');
  const reportType = 'detailed';
  const [reportFormat, setReportFormat] = useState<'html' | 'pdf'>('html');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [reportsData, scansData] = await Promise.all([
        reportAPI.getReports(),
        scanAPI.getHistory(),
      ]);
      setReports(reportsData);
      setScans(scansData.filter(scan => scan.status === 'completed'));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedScanId) return;

    try {
      setGenerating(true);
      const report = await reportAPI.generate({
        scan_id: selectedScanId as number,
        report_type: reportType,
        format: reportFormat,
      });
      setReports(prev => [report, ...prev]);
      setGenerateDialog(false);
      setSelectedScanId('');
      setSuccess(`Report "${report.title}" generated successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      const report = reports.find(r => r.id === reportId);
      const blob = await reportAPI.downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = report?.format || 'html';
      a.download = `${report?.title?.replace(/[^a-zA-Z0-9]/g, '_') || `report_${reportId}`}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download report');
    }
  };

  const handleViewReport = async (reportId: number) => {
    try {
      const report = await reportAPI.getReport(reportId);
      setSelectedReport(report);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load report');
    }
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    try {
      setDeleting(true);
      await reportAPI.deleteReport(reportToDelete.id);
      setReports(prev => prev.filter(r => r.id !== reportToDelete.id));
      setDeleteDialog(false);
      setReportToDelete(null);
      setSuccess(`Report "${reportToDelete.title}" deleted successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const getReportTypeColor = (type: string) => {
    return 'primary';
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return '📄';
      case 'html':
        return '🌐';
      case 'json':
        return '📊';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress thickness={5} size={48} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', mb: 1 }}>
            Assessments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generated vulnerability reports and executive security summaries.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setGenerateDialog(true)}
          disabled={scans.length === 0}
          sx={{ borderRadius: 2, px: 3, fontWeight: 700, textTransform: 'none' }}
        >
          New Assessment
        </Button>
      </Box>

      {scans.length === 0 && (
        <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
          No completed scans available for report generation. Ingest data first.
        </Alert>
      )}

      <Card sx={{ 
        borderRadius: 4, 
        border: '1px solid', 
        borderColor: 'divider', 
        bgcolor: 'transparent', 
        boxShadow: 'none',
        overflow: 'hidden'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Assessment Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Format</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Generated At</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        width: 40, height: 40, borderRadius: 2, 
                        bgcolor: 'primary.main', opacity: 0.1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Assessment sx={{ color: 'primary.main' }} fontSize="small" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {report.title || `Assessment ${report.id}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.report_type.toUpperCase()}
                      color={getReportTypeColor(report.report_type) as any}
                      size="small"
                      sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>{getFormatIcon(report.format)}</Typography>
                      <Chip
                        label={report.format.toUpperCase()}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(report.generated_at).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>
                    <Tooltip title="Preview Content">
                      <IconButton onClick={() => handleViewReport(report.id)} color="primary"><Visibility fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Download File">
                      <IconButton onClick={() => handleDownloadReport(report.id)} color="secondary"><Download fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Purge Record">
                      <IconButton onClick={() => handleDeleteClick(report)} color="error"><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {reports.length === 0 && (
          <Box textAlign="center" py={8}>
            <FilePresent sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No assessments generated</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start by generating your first technical security assessment.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Generate Report Dialog */}
      <Dialog
        open={generateDialog}
        onClose={() => setGenerateDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', pt: 3 }}>
          Initialize New Assessment
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Select a completed scan orchestration to generate a comprehensive AI-powered vulnerability analysis.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Source Infrastructure Scan</InputLabel>
                <Select
                  value={selectedScanId}
                  label="Source Infrastructure Scan"
                  onChange={(e) => setSelectedScanId(e.target.value as number)}
                  sx={{ borderRadius: 2 }}
                >
                  {scans.map((scan) => (
                    <MenuItem key={scan.id} value={scan.id}>
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{scan.filename}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Processed: {new Date(scan.upload_time).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Delivery Format</InputLabel>
                <Select
                  value={reportFormat}
                  label="Delivery Format"
                  onChange={(e) => setReportFormat(e.target.value as 'html' | 'pdf')}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="html">HTML Dynamic Web Interface</MenuItem>
                  <MenuItem value="pdf">PDF Professional Print Document</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {selectedScanId && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: 'primary.main', opacity: 0.05, border: '1px solid', borderColor: 'primary.main' }}>
              <Box display="flex" gap={1.5} alignItems="flex-start">
                <TrendingUp sx={{ color: 'primary.main', fontSize: 20, mt: 0.2 }} />
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                  Advanced analysis will include executive summary, technical debt evaluation, and LLM-driven remediation workflows.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setGenerateDialog(false)} variant="text" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={!selectedScanId || generating}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            {generating ? 'Processing AI Models...' : 'Start Assessment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Content Dialog */}
      <Dialog
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh', borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 4, py: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>{selectedReport?.title}</Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip
                  label={selectedReport?.report_type.toUpperCase()}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 800, borderRadius: 1, fontSize: '0.6rem' }}
                />
                <Chip
                  label={`${getFormatIcon(selectedReport?.format || '')} ${selectedReport?.format?.toUpperCase()}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 800, borderRadius: 1, fontSize: '0.6rem' }}
                />
              </Box>
            </Box>
            <IconButton onClick={() => setSelectedReport(null)}><Add sx={{ transform: 'rotate(45deg)' }} /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 4 }}>
          {selectedReport?.format === 'pdf' ? (
            <Box textAlign="center" py={10} sx={{ bgcolor: 'background.default', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
              <FilePresent sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.2, mb: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Portable Document Format (PDF)</Typography>
              <Typography variant="body2" color="text.secondary" mb={4}>
                Professional PDF assessments are optimized for distribution and printing.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => selectedReport && handleDownloadReport(selectedReport.id)}
                size="large"
                sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}
              >
                Download Assessment
              </Button>
            </Box>
          ) : selectedReport?.content ? (
            <Box
              sx={{
                '& h1, & h2, & h3': { 
                  fontFamily: '"Outfit", sans-serif',
                  color: 'primary.main', 
                  mt: 4, 
                  mb: 2,
                  fontWeight: 800
                },
                '& h1': { fontSize: '2.25rem', borderBottom: '2px solid', borderColor: 'divider', pb: 2, mb: 4 },
                '& h2': { fontSize: '1.75rem', mt: 5 },
                '& h3': { fontSize: '1.25rem' },
                '& p': { mb: 2.5, lineHeight: 1.8, color: 'text.secondary', fontSize: '1rem' },
                '& ul, & ol': { pl: 3, mb: 3, color: 'text.secondary' },
                '& li': { mb: 1.5 },
                '& strong': { color: 'text.primary', fontWeight: 700 },
                '& code': { 
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  padding: '2px 6px',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                },
                '& pre': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                  p: 3,
                  borderRadius: 3,
                  overflow: 'auto',
                  fontSize: '0.9rem',
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 4
                },
                fontFamily: '"Inter", sans-serif'
              }}
              dangerouslySetInnerHTML={{ __html: selectedReport.content }}
            />
          ) : (
            <Box textAlign="center" py={10}>
              <Typography variant="body1" color="text.secondary">
                Intelligence data unavailable for preview.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setSelectedReport(null)} variant="text" sx={{ fontWeight: 700 }}>Dismiss</Button>
          <Button
            onClick={() => selectedReport && handleDownloadReport(selectedReport.id)}
            variant="contained"
            startIcon={<Download />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            Export as {selectedReport?.format?.toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Report Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
          Purge Assessment Record
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to permanently delete <strong>"{reportToDelete?.title}"</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            This will remove the generated file from secure storage. This action cannot be reversed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDialog(false)} variant="text">Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {deleting ? 'Purging...' : 'Confirm Purge'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
        <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 600 }}>{success}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 600 }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports;