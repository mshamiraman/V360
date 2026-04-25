import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Security,
  Assessment,
  TrendingUp,
  CloudUpload,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardAPI } from '../services/api';
import { DashboardMetrics, TrendData } from '../types';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ 
      position: 'absolute', 
      top: -20, 
      right: -20, 
      width: 100, 
      height: 100, 
      borderRadius: '50%', 
      bgcolor: `${color}15`,
      zIndex: 0
    }} />
    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, mt: 1, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ 
          bgcolor: `${color}20`, 
          color: color, 
          width: 48, 
          height: 48,
          borderRadius: 2.5
        }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

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
        <CircularProgress thickness={5} size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  const severityColors = {
    Critical: '#EF4444',
    High: '#F59E0B',
    Medium: '#10B981',
    Low: '#6366F1',
  };

  const pieData = metrics ? [
    { name: 'Critical', value: metrics.vulnerabilities.critical, color: severityColors.Critical },
    { name: 'High', value: metrics.vulnerabilities.high, color: severityColors.High },
    { name: 'Medium', value: metrics.vulnerabilities.medium, color: severityColors.Medium },
    { name: 'Low', value: metrics.vulnerabilities.low, color: severityColors.Low },
  ].filter(item => item.value > 0) : [];

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontFamily: '"Outfit", sans-serif' }}>
            System Health
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of your security posture and vulnerability trends.
          </Typography>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Scans" 
            value={metrics?.total_scans || 0} 
            icon={<CloudUpload />} 
            color="#6366F1"
            subtitle="+2 this week"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Vulnerabilities" 
            value={metrics?.vulnerabilities.total || 0} 
            icon={<Security />} 
            color="#EF4444"
            subtitle="Requires Review"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Patch Rate" 
            value={`${metrics?.patch_completion_rate.toFixed(1) || 0}%`} 
            icon={<Assessment />} 
            color="#10B981"
            subtitle="Above target"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Avg CVSS Score" 
            value={metrics?.avg_cvss_score || 0} 
            icon={<TrendingUp />} 
            color="#F59E0B"
            subtitle="Moderately Secure"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                Security Trends (30D)
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trends?.vulnerability_trends || []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    labelFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric'
                      });
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366F1" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                Severity Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Vulnerabilities Alert */}
      {metrics && metrics.vulnerabilities.critical > 0 && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ 
            mt: 4, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
            boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Critical Security Warning
            </Typography>
            <Typography variant="body2">
              Our scanners have identified {metrics.vulnerabilities.critical} critical vulnerabilities that require immediate patching. 
              Review the detailed analysis in the Vulnerabilities section.
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;