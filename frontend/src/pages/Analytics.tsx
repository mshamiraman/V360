import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Warning,
  Security,
  Assessment,
  BugReport,
  Shield,
  AnalyticsOutlined,
  AutoGraph,
} from '@mui/icons-material';
import { dashboardAPI } from '../services/api';
import { DashboardMetrics, TrendData } from '../types';

// Mock data for predictive analytics (would come from backend)
const mockPredictiveData = {
  riskTrend: {
    current: 7.2,
    predicted: 5.8,
    change: -1.4,
    confidence: 0.85,
  },
  vulnerabilityForecast: [
    { month: 'Jan', predicted: 45, actual: 42 },
    { month: 'Feb', predicted: 38, actual: 41 },
    { month: 'Mar', predicted: 42, actual: 39 },
    { month: 'Apr', predicted: 35, actual: null },
    { month: 'May', predicted: 32, actual: null },
    { month: 'Jun', predicted: 29, actual: null },
  ],
  patchingEfficiency: {
    current: 78,
    target: 85,
    trend: 'improving',
    timeToTarget: '3 months',
  },
  topRisks: [
    { service: 'Apache HTTP Server', riskScore: 9.1, trend: 'increasing' },
    { service: 'OpenSSL', riskScore: 8.7, trend: 'stable' },
    { service: 'MySQL', riskScore: 7.9, trend: 'decreasing' },
    { service: 'PHP', riskScore: 7.3, trend: 'increasing' },
  ],
  complianceScore: {
    overall: 82,
    breakdown: {
      'SOC 2': 85,
      'PCI DSS': 78,
      'ISO 27001': 84,
      'NIST': 80,
    },
  },
};

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsData, trendsData] = await Promise.all([
          dashboardAPI.getMetrics(),
          dashboardAPI.getTrends(parseInt(timeRange)),
        ]);
        setMetrics(metricsData);
        setTrends(trendsData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'error';
    if (score >= 6) return 'warning';
    if (score >= 4) return 'info';
    return 'success';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp color="error" />;
      case 'decreasing':
        return <TrendingDown color="success" />;
      default:
        return <Timeline color="action" />;
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
            Security Intelligence
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Predictive modeling and deep-dive risk analytics.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Analytical Period</InputLabel>
          <Select
            value={timeRange}
            label="Analytical Period"
            onChange={(e) => setTimeRange(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
            <MenuItem value="365">Fiscal Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Risk Prediction Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%', borderRadius: 5, border: '1px solid', borderColor: 'divider',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3} gap={1.5}>
                <AutoGraph color="warning" />
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Predictive Risk Vector</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={4}>
                <Box>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'warning.main', lineHeight: 1 }}>
                    {mockPredictiveData.riskTrend.predicted}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Projected Score (T+30)
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.secondary', opacity: 0.5 }}>
                    {mockPredictiveData.riskTrend.current}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Current Baseline
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.05)', display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <TrendingDown sx={{ color: 'success.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {Math.abs(mockPredictiveData.riskTrend.change)} Point decline in risk trajectory anticipated.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>AI CONFIDENCE LEVEL</Typography>
                <Chip label={`${(mockPredictiveData.riskTrend.confidence * 100).toFixed(0)}% HIGH`} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'primary.main', color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Patching Efficiency */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3} gap={1.5}>
                <Shield color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Remediation Throughput</Typography>
              </Box>

              <Box mb={4}>
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Current Efficiency</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {mockPredictiveData.patchingEfficiency.current}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={mockPredictiveData.patchingEfficiency.current}
                  sx={{ height: 10, borderRadius: 5, bgcolor: 'divider' }}
                />
              </Box>

              <Box mb={4}>
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Institutional Target</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>
                    {mockPredictiveData.patchingEfficiency.target}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={mockPredictiveData.patchingEfficiency.target}
                  color="success"
                  sx={{ height: 6, borderRadius: 3, opacity: 0.5 }}
                />
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, border: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Estimated completion window</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{mockPredictiveData.patchingEfficiency.timeToTarget}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vulnerability Forecast Chart */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={4} gap={1.5}>
                <BugReport color="error" />
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Findings Volume Forecast</Typography>
              </Box>

              <Box sx={{ height: 240, display: 'flex', alignItems: 'end', gap: 3, px: 2 }}>
                {mockPredictiveData.vulnerabilityForecast.map((item, index) => (
                  <Box key={item.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'end', width: '100%', height: 180, gap: 1 }}>
                      {item.actual && (
                        <Box
                          sx={{
                            width: '45%',
                            height: `${(item.actual / 50) * 100}%`,
                            background: 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)',
                            borderRadius: '6px 6px 0 0',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          width: item.actual ? '45%' : '90%',
                          height: `${(item.predicted / 50) * 100}%`,
                          backgroundColor: item.actual ? 'rgba(245, 158, 11, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                          borderRadius: '6px 6px 0 0',
                          border: '2px dashed',
                          borderColor: item.actual ? 'warning.main' : 'info.main',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ mt: 2, fontWeight: 700, color: 'text.secondary' }}>
                      {item.month.toUpperCase()}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box display="flex" justifyContent="center" gap={4} mt={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>IDENTIFIED</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '2px', border: '2px dashed', borderColor: 'warning.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>AI PROJECTION</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Risk Services */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
            <Box sx={{ px: 4, py: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Security color="error" />
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>High-Risk Infrastructure Components</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                    <TableCell sx={{ fontWeight: 700, pl: 4 }}>System Service</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Risk Rating</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Velocity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, pr: 4 }}>Priority</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPredictiveData.topRisks.map((risk, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ pl: 4, py: 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{risk.service}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={risk.riskScore}
                          color={getRiskColor(risk.riskScore) as any}
                          size="small"
                          sx={{ fontWeight: 800, borderRadius: 1.5, minWidth: 40 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTrendIcon(risk.trend)}
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{risk.trend}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 4 }}>
                        <Chip
                          label={risk.riskScore >= 8 ? 'CRITICAL' : 'ELEVATED'}
                          color={risk.riskScore >= 8 ? 'error' : 'warning'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 900, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Compliance Score */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={4} gap={1.5}>
                <Assessment color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>Governance Posture</Typography>
              </Box>

              <Box textAlign="center" mb={5}>
                <Typography variant="h1" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5 }}>
                  {mockPredictiveData.complianceScore.overall}%
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>Aggregate Compliance Index</Typography>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.entries(mockPredictiveData.complianceScore.breakdown).map(([framework, score]) => (
                  <Box key={framework}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{framework}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{score}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={score}
                      color={score >= 80 ? 'success' : score >= 70 ? 'warning' : 'error'}
                      sx={{ height: 6, borderRadius: 3, opacity: 0.8 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;