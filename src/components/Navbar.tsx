import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useScrollTrigger,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import MenuIcon from '@mui/icons-material/Menu';

interface Props {
  window?: () => Window;
}

const Navbar = (props: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { text: 'Drug Discovery', path: '/drug-discovery' },
    { text: 'Disease Chat', path: '/disease-chat' },
    { text: 'About', path: '/about' },
    { text: 'Team', path: '/team' },
    { text: 'Contact', path: '/contact' },
  ];

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        height: '100%',
      }}
    >
      <Box
        sx={{
          py: 3,
          background: 'linear-gradient(45deg, #6366f1, #ec4899)',
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white' }}>
          D3AI
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.text}
            component={RouterLink}
            to={item.path}
            sx={{
              color: location.pathname === item.path ? 'primary.main' : 'text.primary',
              textDecoration: 'none',
              mb: 1,
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
              },
            }}
          >
            <ListItemText
              primary={item.text}
              sx={{
                textAlign: 'center',
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === item.path ? 600 : 400,
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AppBar
          position="fixed"
          sx={{
            background: trigger
              ? 'rgba(255, 255, 255, 0.9)'
              : 'linear-gradient(to right, rgba(99, 102, 241, 0.8), rgba(236, 72, 153, 0.8))',
            backdropFilter: 'blur(10px)',
            boxShadow: trigger
              ? '0 4px 20px rgba(0, 0, 0, 0.05)'
              : '0 4px 20px rgba(99, 102, 241, 0.2)',
            color: trigger ? 'text.primary' : 'white',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar
              disableGutters
              sx={{
                justifyContent: 'space-between',
                minHeight: { xs: '70px', md: '80px' },
              }}
            >
              <Box 
                component={RouterLink} 
                to="/"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <ScienceIcon
                    sx={{
                      fontSize: '2rem',
                      color: trigger ? '#6366f1' : 'white',
                      mr: 2,
                      transition: 'color 0.3s ease-in-out',
                    }}
                  />
                </motion.div>
                
                <Typography
                  variant="h5"
                  noWrap
                  sx={{
                    fontFamily: 'Poppins',
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: trigger ? '#6366f1' : 'white',
                    transition: 'color 0.3s ease-in-out',
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                  }}
                >
                  D3AI
                </Typography>
              </Box>

              {isMobile ? (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{
                    ml: 2,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 3,
                    alignItems: 'center',
                  }}
                >
                  {navItems.map((item) => (
                    <motion.div
                      key={item.text}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                    >
                      <Button
                        component={RouterLink}
                        to={item.path}
                        sx={{
                          color: 'inherit',
                          fontSize: '1rem',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            width: location.pathname === item.path ? '100%' : '0%',
                            height: '2px',
                            bottom: -2,
                            left: 0,
                            backgroundColor: 'currentColor',
                            transition: 'width 0.3s ease-in-out',
                          },
                          '&:hover::after': {
                            width: '100%',
                          },
                        }}
                      >
                        {item.text}
                      </Button>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Toolbar>
          </Container>
        </AppBar>
      </motion.div>

      <Box component="nav">
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: {
              width: 280,
              background: 'transparent',
              boxShadow: 'none',
            },
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Toolbar sx={{ minHeight: { xs: '70px', md: '80px' } }} />
    </>
  );
};

export default Navbar; 