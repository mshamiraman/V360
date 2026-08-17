import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Delete,
  Refresh,
  FilePresent,
  Storage,
  Radar,
  PlayArrow,
  Cancel as CancelIcon,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { scanAPI } from '../services/api';
import { Scan } from '../types';
import { getTemplateName } from '../constants/scanTemplates';

const ScanHistory: React.FC = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<Scan | null>(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const data = await scanAPI.getHistory();
      setScans(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleLaunchScan = async (scan: Scan) => {
    if (!scan.template_id) return;
    try {
      const launched = await scanAPI.launch({
        template_id: scan.template_id,
        name: scan.filename,
        targets: scan.targets || '',
        folder: scan.folder,
        schedule: scan.schedule,
      });
      setScans(prev => [launched, ...prev]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to launch scan');
    }
  };

  const handleCancelScan = async (scan: Scan) => {
    try {
      const updated = await scanAPI.cancelScan(scan.id);
      setScans(prev => prev.map(s => (s.id === scan.id ? updated : s)));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel scan');
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
      case 'created':
        return 'info';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => (status === 'created' ? 'SAVED' : status.toUpperCase());

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress thickness={5} size={48} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', mb: 1 }}>
            All Scans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Launch, monitor, and review your vulnerability scans.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchScans}
            sx={{ borderRadius: '10px', px: 2.5, fontWeight: 700, textTransform: 'none', borderColor: 'divider' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Radar />}
            onClick={() => navigate('/scan/new')}
            sx={{ borderRadius: '10px', px: 2.5, fontWeight: 700, textTransform: 'none', bgcolor: '#6366F1' }}
          >
            New Scan
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>
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
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Scan Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Schedule</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Scanned</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map((scan) => (
                <TableRow
                  key={scan.id}
                  hover
                  onClick={() => navigate(`/scan/${scan.id}`)}
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: 2,
                        bgcolor: 'primary.main', opacity: 0.1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FilePresent sx={{ color: 'primary.main' }} fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{scan.filename}</Typography>
                        <Chip
                          label={getStatusLabel(scan.status)}
                          color={getStatusColor(scan.status) as any}
                          size="small"
                          sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.6rem', height: 18, mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {getTemplateName(scan.template_id)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {scan.schedule || 'One-time'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {scan.processed_at ? (
                      <Typography variant="body2" color="text.secondary">
                        {new Date(scan.processed_at).toLocaleString()}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                        <CalendarToday sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>
                    <Tooltip title={!scan.template_id ? 'Not available for uploaded reports' : scan.status === 'created' ? 'Launch' : 'Launch Again'}>
                      <span>
                        <IconButton
                          disabled={!scan.template_id}
                          color="primary"
                          onClick={(e) => { e.stopPropagation(); handleLaunchScan(scan); }}
                        >
                          <PlayArrow fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    {scan.status === 'processing' && (
                      <Tooltip title="Cancel Scan">
                        <IconButton
                          color="warning"
                          onClick={(e) => { e.stopPropagation(); handleCancelScan(scan); }}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={(e) => { e.stopPropagation(); setScanToDelete(scan); setDeleteDialogOpen(true); }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
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
            <Typography variant="h6" color="text.secondary">No scans found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Launch a new scan or upload an Nmap XML report to get started.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Delete Scan</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to permanently delete <strong>{scanToDelete?.filename}</strong>?
            This action will also remove all associated vulnerability findings.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteScan} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanHistory;
