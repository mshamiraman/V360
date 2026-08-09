import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Security,
  Assessment,
  TrendingUp,
  CloudUpload,
  InfoOutlined,
  TimelineOutlined,
  MoreHoriz,
} from '@mui/icons-material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { DashboardMetrics, TrendData } from '../types';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ 
    position: 'relative', 
    overflow: 'hidden',
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none',
    bgcolor: 'background.paper'
  }}>
    <Box sx={{ 
      position: 'absolute', 
      top: -20, 
      right: -20, 
      width: 100, 
      height: 100, 
      borderRadius: '50%', 
      bgcolor: `${color}10`,
      zIndex: 0
    }} />
    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', letterSpacing: '-1px' }}>
            {value}
          </Typography>
          {subtitle && (
            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
              <Typography variant="caption" sx={{ color: color, fontWeight: 700 }}>
                {subtitle}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ 
          bgcolor: `${color}15`, 
          color: color, 
          width: 44, 
          height: 44,
          borderRadius: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid',
          borderColor: `${color}30`
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ 
          bgcolor: '#111827', 
          px: 2,
          py: 1.5,
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          minWidth: 100,
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #111827',
          }
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
            {new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', fontSize: '1.25rem' }}>
            {payload[0].value}
          </Typography>
        </Box>
      </Box>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, trendsData] = await Promise.all([
          dashboardAPI.getMetrics(),
          dashboardAPI.getTrends(30),
        ]);
        setMetrics(metricsData);
        setTrends(trendsData);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress thickness={5} size={50} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
        {error}
      </Alert>
    );
  }

  const severityColors = {
    Critical: '#F43F5E',
    High: '#FB923C',
    Medium: '#FBBF24',
    Low: '#38BDF8',
  };

  const pieData = metrics ? [
    { name: 'Critical', value: metrics.vulnerabilities.critical, color: severityColors.Critical },
    { name: 'High', value: metrics.vulnerabilities.high, color: severityColors.High },
    { name: 'Medium', value: metrics.vulnerabilities.medium, color: severityColors.Medium },
    { name: 'Low', value: metrics.vulnerabilities.low, color: severityColors.Low },
  ].filter(item => item.value > 0) : [];

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: '"Outfit", sans-serif', letterSpacing: '-1.5px' }}>
            Qumarah Intelligence
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Real-time security orchestration and vulnerability life-cycle monitoring.
            <Chip label="LIVE" size="small" color="success" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900, borderRadius: 1 }} />
          </Typography>
        </Box>
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Audits" value={metrics?.total_scans || 0} icon={<CloudUpload />} color="#6366F1" subtitle="Active Infrastructures" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Security Findings" value={metrics?.vulnerabilities.total || 0} icon={<Security />} color="#F43F5E" subtitle="Pending Triage" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Remediation Velocity" value={`${metrics?.patch_completion_rate.toFixed(0) || 0}%`} icon={<Assessment />} color="#10B981" subtitle="Efficiency Metric" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Threat Surface" value={metrics?.avg_cvss_score || 0} icon={<TrendingUp />} color="#F59E0B" subtitle="Aggregate Risk Score" />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Modern Area Chart for Trends */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 6, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ 
                    width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(20, 184, 166, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <TimelineOutlined sx={{ color: '#14B8A6' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
                    Risk Trajectory (30D)
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreHoriz />
                </IconButton>
              </Box>
              
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trends?.vulnerability_trends || []} margin={{ top: 10, right: 20, left: -20, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 500 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                    interval={5}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ stroke: '#14B8A6', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#14B8A6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ 
                      r: 8, 
                      fill: '#fff', 
                      stroke: '#14B8A6', 
                      strokeWidth: 3,
                    }}
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Modern Donut Chart for Severity */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, fontFamily: '"Outfit", sans-serif' }}>
                Severity Distribution
              </Typography>
              
              <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={115}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationDuration={1500}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 700 }} />
                  </PieChart>
                </ResponsiveContainer>
                
                <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: 'text.primary', lineHeight: 1 }}>
                    {metrics?.vulnerabilities.total || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Total Findings
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                {pieData.map((item) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {item.name} ({item.value})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Alert with Rich Design */}
      {metrics && metrics.vulnerabilities.critical > 0 && (
        <Card sx={{ 
          mt: 5, 
          borderRadius: 4, 
          border: '1px solid', 
          borderColor: 'error.main', 
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(244, 63, 94, 0.05)' : 'rgba(244, 63, 94, 0.02)',
          boxShadow: 'none'
        }}>
          <CardContent sx={{ py: 3, px: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ 
              width: 56, height: 56, borderRadius: '50%', bgcolor: 'error.main', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(244, 63, 94, 0.4)'
            }}>
              <InfoOutlined sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'error.main', mb: 0.5 }}>
                Critical Threat Vectors Identified
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Aman Intelligence detected **{metrics.vulnerabilities.critical}** high-risk vulnerabilities requiring immediate containment. 
                Deploy remediation orchestration from the Vulnerabilities dashboard.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;