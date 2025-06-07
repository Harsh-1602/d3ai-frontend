import React, { useEffect, Suspense } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
  useTheme,
} from '@mui/material';
import {
  Science,
  Search,
  Analytics,
  Biotech,
  Chat,
} from '@mui/icons-material';
import MoleculeVisualization from '../components/MoleculeVisualization';
import AnimatedBackground from '../components/AnimatedBackground';

const features = [
  {
    title: 'Disease Diagnosis Chat',
    description: 'Interactive AI-powered chat assistant for disease diagnosis and health advice',
    icon: <Chat fontSize="large" />,
    gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
    link: '/disease-chat'
  },
  {
    title: 'Disease Analysis',
    description: 'Advanced disease prediction through symptom analysis and AI-powered diagnostics',
    icon: <Science fontSize="large" />,
    gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    link: '/drug-discovery'
  },
  {
    title: 'Drug Candidate Search',
    description: 'Comprehensive search through research papers and chemical databases',
    icon: <Search fontSize="large" />,
    gradient: 'linear-gradient(135deg, #e879f9 0%, #d946ef 100%)',
    link: '/drug-discovery'
  },
  {
    title: 'Property Prediction',
    description: 'Accurate prediction of ADMET properties and molecular characteristics',
    icon: <Analytics fontSize="large" />,
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    link: '/drug-discovery'
  },
  {
    title: 'Molecule Generation',
    description: 'AI-powered generation of novel drug candidates using state-of-the-art models',
    icon: <Biotech fontSize="large" />,
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    link: '/drug-discovery'
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const Home = () => {
  const theme = useTheme();

  return (
    <Box sx={{ overflow: 'hidden', position: 'relative' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          color: 'white',
          pt: { xs: 12, md: 16 },
          pb: { xs: 12, md: 16 },
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(236, 72, 153, 0.8) 100%)',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 120%, rgba(99, 102, 241, 0.4) 0%, rgba(236, 72, 153, 0.1) 100%)',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.4,
          }}
        >
          <Canvas>
            <Suspense fallback={null}>
              <AnimatedBackground />
            </Suspense>
          </Canvas>
        </Box>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative' }}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <Typography
                    component="h1"
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      mb: 3,
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    Revolutionizing
                    <br />
                    Drug Discovery with AI
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      opacity: 0.9,
                      fontWeight: 300,
                      lineHeight: 1.6,
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                    }}
                  >
                    Accelerating pharmaceutical research through cutting-edge
                    artificial intelligence and machine learning technologies.
                  </Typography>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      component={RouterLink}
                      to="/drug-discovery"
                      variant="contained"
                      size="large"
                      sx={{
                        py: 2,
                        px: 6,
                        fontSize: '1.2rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      Start Discovery
                    </Button>
                  </motion.div>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 400 }}>
                  <Canvas>
                    <Suspense fallback={null}>
                      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                      <ambientLight intensity={0.5} />
                      <pointLight position={[10, 10, 10]} intensity={1} />
                      <spotLight position={[-10, -10, -10]} intensity={0.5} />
                      <MoleculeVisualization />
                      <OrbitControls enableZoom={false} autoRotate />
                    </Suspense>
                  </Canvas>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </motion.div>
      </Box>

      {/* Features Section */}
      <Box 
        sx={{ 
          background: '#111827',
          py: { xs: 8, md: 12 },
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Typography
              component="h2"
              variant="h3"
              align="center"
              gutterBottom
              sx={{
                mb: { xs: 6, md: 10 },
                fontWeight: 700,
                background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Powerful Features
            </Typography>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <motion.div variants={itemVariants}>
                    <Card
                      elevation={4}
                      sx={{
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: theme.palette.mode === 'dark' ? 'transparent' : 'white',
                        border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: feature.gradient,
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: '12px',
                            background: feature.gradient,
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {feature.icon}
                        </Box>
                        <Typography variant="h5" component="h3">
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 3, flexGrow: 1 }}>
                        {feature.description}
                      </Typography>
                      <Button
                        component={RouterLink}
                        to={feature.link}
                        variant="outlined"
                        color="primary"
                        sx={{
                          alignSelf: 'flex-start',
                          borderRadius: '20px',
                          px: 3,
                          '&:hover': {
                            background: feature.gradient,
                            color: 'white',
                            borderColor: 'transparent',
                          },
                        }}
                      >
                        Explore
                      </Button>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 