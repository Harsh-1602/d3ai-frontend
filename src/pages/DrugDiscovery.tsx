import React, { useState, Suspense } from 'react';
import {
  Container,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  Chip,
  Grid,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import MoleculeVisualization from '../components/MoleculeVisualization';

const steps = [
  'Disease Identification',
  'Drug Candidate Search',
  'Property Analysis',
  'Results',
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const DrugDiscovery = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleNext = () => {
    setLoading(true);
    // TODO: Add API calls for each step
    setTimeout(() => {
      setActiveStep((prevStep) => prevStep + 1);
      setLoading(false);
    }, 2000);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddSymptom = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && currentSymptom.trim()) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom('');
    }
  };

  const handleDeleteSymptom = (symptomToDelete: string) => {
    setSymptoms(symptoms.filter((symptom) => symptom !== symptomToDelete));
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        background: '#111827',
        minHeight: '100vh',
        pt: 4,
        pb: 4,
      }}>
        <Container maxWidth="lg">
          <Paper 
            sx={{ 
              p: 4,
              background: 'rgba(17, 24, 39, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
          >
            <Typography 
              component="h1" 
              variant="h4" 
              align="center" 
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                mb: 4,
              }}
            >
              Drug Discovery Process
            </Typography>
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                pt: 3, 
                pb: 5,
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#818cf8',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#e879f9',
                },
                '& .MuiStepLabel-label': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiStepConnector-line': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ position: 'relative', minHeight: 400 }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                key={activeStep}
              >
                {activeStep === 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={6}>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            color: '#e879f9',
                            fontWeight: 600,
                          }}
                        >
                          Enter Symptoms
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={currentSymptom}
                          onChange={(e) => setCurrentSymptom(e.target.value)}
                          onKeyPress={handleAddSymptom}
                          placeholder="Type a symptom and press Enter"
                          sx={{ 
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#e879f9',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: 'rgba(255, 255, 255, 0.9)',
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {symptoms.map((symptom, index) => (
                            <motion.div
                              key={index}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Chip
                                label={symptom}
                                onDelete={() => handleDeleteSymptom(symptom)}
                                sx={{
                                  background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                                  color: 'white',
                                  '& .MuiChip-deleteIcon': {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': {
                                      color: 'white',
                                    },
                                  },
                                }}
                              />
                            </motion.div>
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ height: 300 }}>
                          <Canvas>
                            <Suspense fallback={null}>
                              <ambientLight intensity={0.5} />
                              <pointLight position={[10, 10, 10]} />
                              <Float
                                speed={4}
                                rotationIntensity={1}
                                floatIntensity={2}
                              >
                                <MoleculeVisualization />
                              </Float>
                              <OrbitControls enableZoom={false} autoRotate />
                            </Suspense>
                          </Canvas>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {activeStep === 1 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Searching Drug Candidates
                    </Typography>
                    <Box sx={{ height: 400 }}>
                      <Canvas>
                        <Suspense fallback={null}>
                          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                          <ambientLight intensity={0.5} />
                          <pointLight position={[10, 10, 10]} />
                          <Float
                            speed={4}
                            rotationIntensity={1}
                            floatIntensity={2}
                          >
                            <MoleculeVisualization />
                          </Float>
                          <OrbitControls enableZoom={false} autoRotate />
                        </Suspense>
                      </Canvas>
                    </Box>
                  </Box>
                )}

                {activeStep === 2 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Analyzing Properties
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        {/* Property analysis charts */}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ height: 400 }}>
                          <Canvas>
                            <Suspense fallback={null}>
                              <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                              <ambientLight intensity={0.5} />
                              <pointLight position={[10, 10, 10]} />
                              <Float
                                speed={4}
                                rotationIntensity={1}
                                floatIntensity={2}
                              >
                                <MoleculeVisualization />
                              </Float>
                              <OrbitControls enableZoom={false} autoRotate />
                            </Suspense>
                          </Canvas>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {activeStep === 3 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Results
                    </Typography>
                    {/* Display final results */}
                  </Box>
                )}
              </motion.div>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              {activeStep !== 0 && (
                <Button 
                  onClick={handleBack} 
                  sx={{ 
                    mr: 1,
                    color: '#818cf8',
                    borderColor: '#818cf8',
                    '&:hover': {
                      borderColor: '#e879f9',
                      background: 'rgba(232, 121, 249, 0.1)',
                    },
                  }}
                >
                  Back
                </Button>
              )}
              {activeStep !== steps.length - 1 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading || (activeStep === 0 && symptoms.length === 0)}
                  sx={{
                    background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #6366f1, #d946ef)',
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Next'}
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </motion.div>
  );
};

export default DrugDiscovery; 