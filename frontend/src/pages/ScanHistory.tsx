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
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Grid,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Refresh,
  FilePresent,
  Storage,
} from '@mui/icons-material';
import { scanAPI } from '../services/api';
import { Scan } from '../types';

const ScanHistory: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<Scan | null>(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const data = await scanAPI.getHistory();
      setScans(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleViewScan = async (scan: Scan) => {
    try {
      const detailedScan = await scanAPI.getScan(scan.id);
      setSelectedScan(detailedScan);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scan details');
    }
  };

  const handleDeleteScan = async () => {
    if (!scanToDelete) return;

    try {
      await scanAPI.deleteScan(scanToDelete.id);
      setScans(scans.filter(scan => scan.id !== scanToDelete.id));
      setDeleteDialogOpen(false);
      setScanToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete scan');
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
            Historical Archives
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your previous network scanning activities.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchScans}
          sx={{ borderRadius: 2, px: 3, fontWeight: 700, textTransform: 'none' }}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
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
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Resource Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Analysis Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ingestion Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data Size</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        width: 40, height: 40, borderRadius: 2, 
                        bgcolor: 'primary.main', opacity: 0.1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FilePresent sx={{ color: 'primary.main' }} fontSize="small" />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{scan.filename}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={scan.status.toUpperCase()}
                      color={getStatusColor(scan.status) as any}
                      size="small"
                      sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(scan.upload_time).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatFileSize(scan.file_size)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>
                    <Tooltip title="View Archives">
                      <IconButton onClick={() => handleViewScan(scan)} color="primary"><Visibility fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Purge Record">
                      <IconButton onClick={() => { setScanToDelete(scan); setDeleteDialogOpen(true); }} color="error"><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {scans.length === 0 && (
          <Box textAlign="center" py={8}>
            <Storage sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No scanning history found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start by uploading your first Nmap XML report.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Scan Details Dialog */}
      <Dialog
        open={!!selectedScan}
        onClose={() => setSelectedScan(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', pt: 3 }}>Archive Inspection</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedScan && (
            <Box>
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>METADATA</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{selectedScan.filename}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography variant="caption" display="block" color="text.secondary">STATUS</Typography><Chip label={selectedScan.status.toUpperCase()} size="small" color={getStatusColor(selectedScan.status) as any} sx={{ mt: 0.5, fontWeight: 700 }} /></Grid>
                  <Grid item xs={6}><Typography variant="caption" display="block" color="text.secondary">DATA SIZE</Typography><Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{formatFileSize(selectedScan.file_size)}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" display="block" color="text.secondary">INGESTED</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{new Date(selectedScan.upload_time).toLocaleString()}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" display="block" color="text.secondary">PROCESSED</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{selectedScan.processed_at ? new Date(selectedScan.processed_at).toLocaleString() : 'Pending'}</Typography></Grid>
                </Grid>
              </Box>

              {selectedScan.error_message && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{selectedScan.error_message}</Alert>
              )}

              {selectedScan.parsed_data && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>AI ANALYSIS SUMMARY</Typography>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>{selectedScan.parsed_data.total_hosts || 0}</Typography><Typography variant="caption" color="text.secondary">Hosts Scanned</Typography></Box>
                    <Divider orientation="vertical" flexItem />
                    <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>{selectedScan.parsed_data.total_services || 0}</Typography><Typography variant="caption" color="text.secondary">Services Identified</Typography></Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSelectedScan(null)} variant="outlined" fullWidth sx={{ borderRadius: 2 }}>Close Archive</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Purge Archive Record</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to permanently delete the archive for <strong>{scanToDelete?.filename}</strong>? 
            This action will also remove all associated AI vulnerability findings.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteScan} variant="contained" color="error" sx={{ borderRadius: 2 }}>Confirm Purge</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanHistory;