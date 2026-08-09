import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../types';
import logo from '../static/assests/logo.png';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 100%)'
          : 'radial-gradient(circle at 50% 50%, #f1f5f9 0%, #cbd5e1 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Abstract Background Shapes */}
      <Box sx={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)',
        filter: 'blur(80px)',
        top: '-100px',
        right: '-100px',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        filter: 'blur(60px)',
        bottom: '-50px',
        left: '-50px',
        zIndex: 0
      }} />

      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            width: '100%', 
            borderRadius: 4,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              component="img"
              src={logo}
              alt="Qumarah Logo"
              sx={{
                height: 85,
                maxWidth: 260,
                objectFit: 'contain',
                mb: 1.5,
                filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none'
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
              ENTERPRISE SECURITY CONSOLE
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2.5 }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2.5 }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 4, 
                mb: 2, 
                py: 1.5, 
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '1rem'
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Authenticate'}
            </Button>
          </Box>

          <Box sx={{ 
            mt: 4, 
            p: 2.5, 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)', 
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Quick Demo Access
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Email: <Box component="span" sx={{ color: 'primary.main' }}>demo@amanv360.ai</Box>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Password: <Box component="span" sx={{ color: 'primary.main' }}>demo123</Box>
            </Typography>
          </Box>
        </Paper>
        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 4, fontWeight: 500 }}>
          © 2026 Qumarah. Advanced Security Analytics Platform.
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;