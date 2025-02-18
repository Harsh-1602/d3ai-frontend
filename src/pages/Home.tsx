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
} from '@mui/icons-material';
import MoleculeVisualization from '../components/MoleculeVisualization';
import AnimatedBackground from '../components/AnimatedBackground';

const features = [
  {
    title: 'Disease Analysis',
    description: 'Advanced disease prediction through symptom analysis and AI-powered diagnostics',
    icon: <Science fontSize="large" />,
    gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  },
  {
    title: 'Drug Candidate Search',
    description: 'Comprehensive search through research papers and chemical databases',
    icon: <Search fontSize="large" />,
    gradient: 'linear-gradient(135deg, #e879f9 0%, #d946ef 100%)',
  },
  {
    title: 'Property Prediction',
    description: 'Accurate prediction of ADMET properties and molecular characteristics',
    icon: <Analytics fontSize="large" />,
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
  },
  {
    title: 'Molecule Generation',
    description: 'AI-powered generation of novel drug candidates using state-of-the-art models',
    icon: <Biotech fontSize="large" />,
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
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
                <Grid item key={index} xs={12} sm={6} md={3}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        background: 'rgba(17, 24, 39, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        overflow: 'hidden',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: feature.gradient,
                        },
                        transform: 'perspective(1000px) rotateX(0deg)',
                        transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                        '&:hover': {
                          transform: 'perspective(1000px) rotateX(10deg)',
                          boxShadow: `0 20px 40px ${feature.gradient.split(' ')[2].slice(0, -2)}15)`,
                          '& .icon-container': {
                            transform: 'translateY(-10px)',
                          },
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <motion.div
                          className="icon-container"
                          whileHover={{ scale: 1.2, rotate: 5 }}
                          transition={{ duration: 0.3 }}
                          style={{ transition: 'transform 0.5s ease' }}
                        >
                          <Box
                            sx={{
                              mb: 3,
                              display: 'flex',
                              justifyContent: 'center',
                              '& > svg': {
                                fontSize: '3rem',
                                background: feature.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              },
                            }}
                          >
                            {feature.icon}
                          </Box>
                        </motion.div>
                        <Typography
                          variant="h5"
                          component="h3"
                          align="center"
                          gutterBottom
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            background: feature.gradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          align="center"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.95rem',
                            lineHeight: 1.7,
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </CardContent>
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