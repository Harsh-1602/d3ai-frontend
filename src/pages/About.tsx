import React, { Suspense } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search,
  Science,
  Analytics,
  Biotech,
  Psychology,
  CheckCircle,
  Chat,
  ArrowRight,
  LinkedIn,
  GitHub,
  Email,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import {
  DiseaseAnalysis,
  CandidateSearch,
  MoleculeGen,
  PropertyAnalysis,
  Optimization,
  Results,
} from '../components/ProcessVisualizations';
import AnimatedBackground from '../components/AnimatedBackground';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const sections = [
  {
    title: 'AI-Powered Analysis',
    description: 'Advanced disease prediction and drug candidate screening using state-of-the-art AI models',
    details: [
      'Symptom-based disease prediction',
      'Research paper analysis',
      'Drug-protein interaction prediction',
      'Property optimization'
    ],
    gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    icon: <Science fontSize="large" />
  },
  {
    title: 'Molecular Docking',
    description: 'Visualize and analyze protein-ligand interactions for effective drug discovery',
    details: [
      'Protein-ligand binding visualization',
      'Binding site identification',
      'Energy calculations and scoring',
      'Structure-based drug design'
    ],
    gradient: 'linear-gradient(135deg, #e879f9 0%, #d946ef 100%)',
    icon: <Biotech fontSize="large" />
  },
  {
    title: 'Intelligent Chatbot',
    description: 'AI-powered assistant for disease analysis and drug discovery guidance',
    details: [
      'Symptom-based disease identification',
      'Similar disease pattern matching',
      'Novel molecule generation suggestions',
      'Treatment pathway recommendations'
    ],
    gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    icon: <Chat fontSize="large" />
  }
];

interface Section {
  title: string;
  description: string;
  details: string[];
  gradient: string;
  icon: React.ReactNode;
}

interface ProcessStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  position: string;
  color: string;
  visualization: () => JSX.Element;
  details: string[];
}

const processSteps: ProcessStep[] = [
  { 
    icon: <Search />, 
    title: 'Disease Analysis', 
    description: 'Identify disease characteristics and requirements',
    position: 'left',
    color: '#6366f1',
    visualization: DiseaseAnalysis,
    details: [
      'Symptom analysis',
      'Disease prediction',
      'Target identification',
      'Pathway analysis'
    ]
  },
  { 
    icon: <Science />, 
    title: 'Candidate Search', 
    description: 'Search through databases and research papers',
    position: 'right',
    color: '#ec4899',
    visualization: CandidateSearch,
    details: [
      'Database integration',
      'Literature mining',
      'Similarity search',
      'Structure matching'
    ]
  },
  { 
    icon: <Biotech />, 
    title: 'Molecule Generation', 
    description: 'Generate novel molecules using AI models',
    position: 'left',
    color: '#10b981',
    visualization: MoleculeGen,
    details: [
      'AI-based generation',
      'Structure validation',
      'Diversity analysis',
      'Scaffold hopping'
    ]
  },
  { 
    icon: <Analytics />, 
    title: 'Property Analysis', 
    description: 'Predict and analyze molecular properties',
    position: 'right',
    color: '#3b82f6',
    visualization: PropertyAnalysis,
    details: [
      'ADMET prediction',
      'Binding affinity',
      'Toxicity analysis',
      'Bioavailability'
    ]
  },
  { 
    icon: <Psychology />, 
    title: 'Optimization', 
    description: 'Optimize candidates based on desired properties',
    position: 'left',
    color: '#f59e0b',
    visualization: Optimization,
    details: [
      'Multi-objective optimization',
      'Structure refinement',
      'Property balancing',
      'Constraint satisfaction'
    ]
  },
  { 
    icon: <CheckCircle />, 
    title: 'Results', 
    description: 'Final selection of promising drug candidates',
    position: 'right',
    color: '#ef4444',
    visualization: Results,
    details: [
      'Candidate ranking',
      'Detailed analysis',
      'Report generation',
      'Next steps guidance'
    ]
  },
];

const technologies = [
  {
    category: 'Backend & APIs',
    items: [
      'FastAPI for High-Performance API',
      'Python for Core Processing',
      'ChEMBL Database Integration',
      'ZINC Database Access',
      'RESTful API Architecture'
    ],
  },
  {
    category: 'Frontend & Visualization',
    items: [
      'React with TypeScript',
      'Three.js for 3D Visualization',
      'Material-UI Components',
      'Framer Motion Animations',
      'WebGL Rendering'
    ],
  },
  {
    category: 'ML/AI Models',
    items: [
      'PyTorch Deep Learning',
      'RDKit for Molecular Analysis',
      'Transformers for NLP',
      'MegaMolBERT for Generation',
      'QSAR Models',
      'Molecular Docking Tools'
    ],
  },
  {
    category: 'Database & Storage',
    items: [
      'ChromaDB for Vector Search',
      'MongoDB for Data Storage',
      'Redis for Caching',
      'Vector Embeddings',
      'Secure Data Management'
    ],
  },
  {
    category: 'Molecular Tools',
    items: [
      'Protein-Ligand Docking',
      'Binding Site Analysis',
      'Structure Visualization',
      'Energy Calculations',
      'Conformer Generation'
    ],
  },
  {
    category: 'AI Chatbot',
    items: [
      'Symptom Analysis',
      'Disease Prediction',
      'Research Paper Analysis',
      'Similar Disease Matching',
      'Treatment Suggestions'
    ],
  }
];

const teamMembers = [
  {
    name: 'Harsh Gupta',
    role: 'Lead Developer',
    expertise: 'Full Stack & AI Development',
    image: '/images/team/harsh-gupta.jpg',
    bio: 'Expert in AI/ML and drug discovery technologies with a focus on developing innovative solutions.',
    social: {
      linkedin: '#',
      github: '#',
      email: 'harsh@d3ai.com'
    }
  },
  {
    name: 'Chanchal Kuntal',
    role: 'Research Lead',
    expertise: 'Drug Discovery & ML',
    image: '/images/team/chanchal-kuntal.jpg',
    bio: 'Specialized in molecular modeling and AI-driven drug discovery processes.',
    social: {
      linkedin: '#',
      github: '#',
      email: 'chanchal@d3ai.com'
    }
  }
];

const About = () => {
  return (
    <Box sx={{ 
      background: '#111827',
      minHeight: '100vh',
      color: 'white',
      pb: 8,
    }}>
      {/* Background Animation */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.15,
          zIndex: 0,
        }}
      >
        <Canvas>
          <Suspense fallback={null}>
            <AnimatedBackground count={3000} />
          </Suspense>
        </Canvas>
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography 
            variant="h2" 
            component="h1"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(45deg, #818cf8, #e879f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            About D3AI
          </Typography>
          <Typography 
            variant="h5"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.8,
            }}
          >
            Revolutionizing drug discovery through artificial intelligence and advanced molecular modeling
          </Typography>
        </Box>

        {/* Main Features */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {(sections as Section[]).map((section, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                sx={{
                  p: 4,
                  height: '100%',
                  background: 'rgba(17, 24, 39, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: section.gradient,
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: section.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      background: section.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {section.title}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 3,
                    lineHeight: 1.7,
                  }}
                >
                  {section.description}
                </Typography>
                <List>
                  {section.details.map((detail: string, idx: number) => (
                    <ListItem key={idx} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ArrowRight sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={detail}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.9rem',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Process Steps */}
        <Typography
          variant="h3"
          align="center"
          sx={{
            mb: 6,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #818cf8, #e879f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Drug Discovery Process
        </Typography>
        
        {(processSteps as ProcessStep[]).map((step, index) => (
          <Box key={index} sx={{ mb: 6 }}>
            <Grid 
              container 
              spacing={4} 
              sx={{ 
                flexDirection: step.position === 'left' ? 'row' : 'row-reverse'
              }}
            >
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 4,
                    background: 'rgba(17, 24, 39, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(45deg, ${step.color}, ${processSteps[(index + 1) % processSteps.length].color})`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: step.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        mr: 2,
                        '&::before': {
                          content: `"${index + 1}"`,
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(17, 24, 39, 0.9)',
                          border: `2px solid ${step.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: 'white',
                        },
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        background: `linear-gradient(45deg, ${step.color}, ${processSteps[(index + 1) % processSteps.length].color})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {step.title}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      mb: 3,
                      lineHeight: 1.7,
                    }}
                  >
                    {step.description}
                  </Typography>
                  <List>
                    {step.details.map((detail: string, idx: number) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <ArrowRight sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={detail}
                          sx={{
                            '& .MuiListItemText-primary': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.9rem',
                            },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 400 }}>
                  <Canvas>
                    <Suspense fallback={null}>
                      <ambientLight intensity={0.5} />
                      <pointLight position={[10, 10, 10]} intensity={1} />
                      <Float
                        speed={2}
                        rotationIntensity={1}
                        floatIntensity={1}
                      >
                        {React.createElement(step.visualization)}
                      </Float>
                    </Suspense>
                  </Canvas>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ))}

        {/* Technology Stack */}
        <Typography
          variant="h3"
          align="center"
          sx={{
            mb: 6,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #818cf8, #e879f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Technology Stack
        </Typography>

        <Grid container spacing={4}>
          {technologies.map((tech, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <Paper
                sx={{
                  p: 4,
                  height: '100%',
                  background: 'rgba(17, 24, 39, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {tech.category}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tech.items.map((item, idx) => (
                    <Chip
                      key={idx}
                      label={item}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.15)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Team Section */}
        <Typography
          variant="h3"
          align="center"
          sx={{
            mt: 10,
            mb: 6,
            fontWeight: 700,
            background: 'linear-gradient(45deg, #818cf8, #e879f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Our Team
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 4,
                  height: '100%',
                  background: 'rgba(17, 24, 39, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 20px',
                    border: '3px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  align="center"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {member.name}
                </Typography>
                <Typography
                  variant="subtitle1"
                  align="center"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  {member.role}
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 2,
                  }}
                >
                  {member.expertise}
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 3,
                    lineHeight: 1.6,
                  }}
                >
                  {member.bio}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <IconButton
                    href={member.social.linkedin}
                    target="_blank"
                    sx={{ color: 'primary.main' }}
                  >
                    <LinkedIn />
                  </IconButton>
                  <IconButton
                    href={member.social.github}
                    target="_blank"
                    sx={{ color: 'primary.main' }}
                  >
                    <GitHub />
                  </IconButton>
                  <IconButton
                    href={`mailto:${member.social.email}`}
                    sx={{ color: 'primary.main' }}
                  >
                    <Email />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default About; 