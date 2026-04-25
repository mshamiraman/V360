import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CloudUpload,
  History,
  Security,
  Assessment,
  SmartToy,
  AccountCircle,
  Logout,
  Search,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  // Check if user is admin (temporarily allow all users for demo)
  const isAdmin = true; // user?.email?.endsWith('@admin.com') || user?.role === 'admin';

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Upload Scan', icon: <CloudUpload />, path: '/scan/upload' },
    { text: 'Scan History', icon: <History />, path: '/scan/history' },
    { text: 'Search', icon: <Search />, path: '/search' },
    { text: 'Vulnerabilities', icon: <Security />, path: '/vulnerabilities' },
    { text: 'Reports', icon: <Assessment />, path: '/reports' },
    { text: 'AI Assistant', icon: <SmartToy />, path: '/ai-assistant' },
  ];

  // Add admin menu item if user is admin
  if (isAdmin) {
    menuItems.push({ text: 'Admin Dashboard', icon: <AdminPanelSettings />, path: '/admin' });
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Security sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography 
          variant="h5" 
          sx={{ 
            fontFamily: '"Outfit", sans-serif', 
            fontWeight: 700,
            letterSpacing: '-0.5px',
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #FFF 0%, #94A3B8 100%)'
              : 'linear-gradient(135deg, #0F172A 0%, #64748B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          VulnPatch AI
        </Typography>
      </Box>
      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'rgba(99, 102, 241, 0.08)',
                    '&:hover': {
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(99, 102, 241, 0.18)'
                        : 'rgba(99, 102, 241, 0.12)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                      transform: 'scale(1.1)',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 600,
                      color: 'primary.main',
                    },
                  },
                  '&:hover': {
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, transition: 'all 0.2s' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 500
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ 
          p: 2, 
          borderRadius: 3, 
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'primary.main',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}
          >
            {user?.email?.[0].toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {user?.email?.split('@')[0]}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Security Analyst
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              sx={{ 
                fontWeight: 700, 
                fontFamily: '"Outfit", sans-serif',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeToggle />
            <IconButton
              size="large"
              onClick={handleProfileMenuOpen}
              sx={{ 
                p: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px'
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                }}
              >
                {user?.email?.[0].toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
          
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 180,
                borderRadius: 3,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.email}</Typography>
              <Typography variant="caption" color="text.secondary">Administrator</Typography>
            </Box>
            <ListItem disablePadding>
              <ListItemButton onClick={handleProfileMenuClose}>
                <ListItemIcon sx={{ minWidth: 36 }}><AccountCircle fontSize="small" /></ListItemIcon>
                <ListItemText primary="My Profile" primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}><Logout fontSize="small" /></ListItemIcon>
                <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;