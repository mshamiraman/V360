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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Cancel as CancelIcon,
  Search,
  FilterList,
  Close,
  Storage,
  CheckCircle,
  RadioButtonChecked,
  HighlightOff,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { scanAPI, vulnerabilityAPI } from '../services/api';
import { Scan, ScanHost, Vulnerability } from '../types';
import { getTemplateName } from '../constants/scanTemplates';

const tableHeaderSx = {
  bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
};

const cardSx = {
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'transparent',
  boxShadow: 'none',
  overflow: 'hidden',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'failed': return 'error';
    case 'processing': return 'warning';
    case 'created': return 'info';
    case 'cancelled': return 'default';
    default: return 'default';
  }
};

const getStatusLabel = (status: string) => (status === 'created' ? 'SAVED' : status.toUpperCase());

const getSeverityColor = (severity?: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'default';
  }
};

const ScanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<Scan | null>(null);
  const [hosts, setHosts] = useState<ScanHost[]>([]);
  const [hiddenHosts, setHiddenHosts] = useState<Set<string>>(new Set());
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [hostSearch, setHostSearch] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const scanId = parseInt(id, 10);
      const [scanData, hostsData, vulnData] = await Promise.all([
        scanAPI.getScan(scanId),
        scanAPI.getScanHosts(scanId),
        vulnerabilityAPI.getVulnerabilities({ scan_id: scanId }),
      ]);
      setScan(scanData);
      setHosts(hostsData);
      setVulnerabilities(vulnData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLaunchScan = async () => {
    if (!scan?.template_id) return;
    try {
      const launched = await scanAPI.launch({
        template_id: scan.template_id,
        name: scan.filename,
        targets: scan.targets || '',
        folder: scan.folder,
        schedule: scan.schedule,
      });
      navigate(`/scan/${launched.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to launch scan');
    }
  };

  const handleCancelScan = async () => {
    if (!scan) return;
    try {
      const updated = await scanAPI.cancelScan(scan.id);
      setScan(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel scan');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress thickness={5} size={48} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (!scan) {
    return (
      <Box>
        <Alert severity="error" sx={{ borderRadius: 3 }}>{error || 'Scan not found'}</Alert>
      </Box>
    );
  }

  const visibleHosts = hosts.filter(h =>
    !hiddenHosts.has(h.host) &&
    (h.host.toLowerCase().includes(hostSearch.toLowerCase()) ||
      (h.fqdn || '').toLowerCase().includes(hostSearch.toLowerCase()))
  );

  const badgeSx = {
    ml: 1,
    minWidth: 22,
    height: 20,
    borderRadius: '10px',
    px: 0.75,
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.12)',
    color: 'primary.main',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/scan/history')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
                {scan.filename}
              </Typography>
              <Chip
                label={getStatusLabel(scan.status)}
                color={getStatusColor(scan.status) as any}
                size="small"
                sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {getTemplateName(scan.template_id)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title={!scan.template_id ? 'Not available for uploaded reports' : scan.status === 'created' ? 'Launch' : 'Launch Again'}>
            <span>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                disabled={!scan.template_id}
                onClick={handleLaunchScan}
                sx={{ borderRadius: '10px', px: 2.5, fontWeight: 700, textTransform: 'none', bgcolor: '#6366F1' }}
              >
                Launch
              </Button>
            </span>
          </Tooltip>
          {scan.status === 'processing' && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<CancelIcon />}
              onClick={handleCancelScan}
              sx={{ borderRadius: '10px', px: 2.5, fontWeight: 700, textTransform: 'none' }}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 48 },
        }}
      >
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center' }}>Hosts<Box component="span" sx={badgeSx}>{hosts.length}</Box></Box>} />
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center' }}>Vulnerabilities<Box component="span" sx={badgeSx}>{vulnerabilities.length}</Box></Box>} />
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center' }}>History<Box component="span" sx={badgeSx}>1</Box></Box>} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              disabled
              sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', borderColor: 'divider' }}
            >
              Filter
            </Button>
            <TextField
              size="small"
              placeholder="Search Hosts"
              value={hostSearch}
              onChange={(e) => setHostSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {visibleHosts.length} Hosts
            </Typography>
          </Box>

          <Card sx={cardSx}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={tableHeaderSx}>
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Host</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>FQDN</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ports</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleHosts.map((host) => (
                    <TableRow key={host.host} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 2, fontWeight: 600 }}>{host.host}</TableCell>
                      <TableCell>{host.fqdn || ''}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 480 }}>
                          {host.ports.join(', ')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setHiddenHosts(prev => new Set(prev).add(host.host))}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {visibleHosts.length === 0 && (
              <Box textAlign="center" py={8}>
                <Storage sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.2, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No hosts found</Typography>
              </Box>
            )}
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Card sx={cardSx}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={tableHeaderSx}>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Port</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>CVE</TableCell>
                  <TableCell sx={{ fontWeight: 700, pr: 3 }}>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vulnerabilities.map((vuln) => (
                  <TableRow key={vuln.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ py: 2, fontWeight: 600 }}>{vuln.service_name}</TableCell>
                    <TableCell>{vuln.port ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={vuln.severity || 'Unknown'}
                        color={getSeverityColor(vuln.severity) as any}
                        size="small"
                        sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell>{vuln.cve_id || '—'}</TableCell>
                    <TableCell sx={{ pr: 3 }}>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 420 }}>
                        {vuln.description}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {vulnerabilities.length === 0 && (
            <Box textAlign="center" py={8}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', opacity: 0.4, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No vulnerabilities found</Typography>
            </Box>
          )}
        </Card>
      )}

      {activeTab === 2 && (
        <Card sx={{ ...cardSx, p: 3 }}>
          {scan.error_message && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{scan.error_message}</Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ color: 'success.main' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Created</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(scan.upload_time).toLocaleString()}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {scan.status === 'created' && <RadioButtonChecked sx={{ color: 'text.disabled' }} />}
              {scan.status === 'processing' && <RadioButtonChecked sx={{ color: 'warning.main' }} />}
              {scan.status !== 'created' && scan.status !== 'processing' && <CheckCircle sx={{ color: 'success.main' }} />}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Started</Typography>
                <Typography variant="caption" color="text.secondary">
                  {scan.status === 'created' ? 'Not started yet' : new Date(scan.upload_time).toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {scan.status === 'completed' && <CheckCircle sx={{ color: 'success.main' }} />}
              {scan.status === 'failed' && <HighlightOff sx={{ color: 'error.main' }} />}
              {scan.status === 'cancelled' && <HighlightOff sx={{ color: 'text.disabled' }} />}
              {(scan.status === 'processing' || scan.status === 'created') && <RadioButtonChecked sx={{ color: 'text.disabled' }} />}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {scan.status === 'processing' ? 'In Progress' : scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {scan.processed_at ? new Date(scan.processed_at).toLocaleString() : scan.status === 'created' ? 'Awaiting launch' : 'Pending'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default ScanDetail;
