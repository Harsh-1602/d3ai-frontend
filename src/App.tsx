import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/700.css';
import '@fontsource/roboto-mono';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DrugDiscovery from './pages/DrugDiscovery';
import About from './pages/About';
import Team from './pages/Team';
import Contact from './pages/Contact';
import DiseaseChat from './pages/DiseaseChat';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#111827',
      paper: '#1f2937',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#d1d5db',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      backgroundImage: 'linear-gradient(45deg, #6366f1, #ec4899)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontFamily: '"Roboto Mono", monospace',
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 26px',
          transition: 'all 0.3s ease-in-out',
          background: 'linear-gradient(45deg, #6366f1, #ec4899)',
          color: 'white',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          transition: 'all 0.4s ease-in-out',
          background: 'rgba(31, 41, 55, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            transform: 'translateY(-5px) scale(1.02)',
            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(31, 41, 55, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
        },
      },
    },
  },
});

const globalStyles = {
  '*::-webkit-scrollbar': {
    width: '10px',
    height: '10px',
  },
  '*::-webkit-scrollbar-track': {
    background: '#1f2937',
    borderRadius: '5px',
  },
  '*::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(45deg, #6366f1, #ec4899)',
    borderRadius: '5px',
    '&:hover': {
      background: 'linear-gradient(45deg, #4f46e5, #db2777)',
    },
  },
  'body': {
    background: '#111827',
    minHeight: '100vh',
    backgroundAttachment: 'fixed',
  },
  '.gradient-text': {
    background: 'linear-gradient(45deg, #6366f1, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  '.glass-effect': {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  '.page-transition-enter': {
    opacity: 0,
    transform: 'translateY(20px)',
  },
  '.page-transition-enter-active': {
    opacity: 1,
    transform: 'translateY(0)',
    transition: 'all 0.5s ease-out',
  },
  '.page-transition-exit': {
    opacity: 1,
    transform: 'scale(1)',
  },
  '.page-transition-exit-active': {
    opacity: 0,
    transform: 'scale(0.95)',
    transition: 'all 0.3s ease-in',
  },
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/drug-discovery" element={<DrugDiscovery />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/disease-chat" element={<DiseaseChat />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
