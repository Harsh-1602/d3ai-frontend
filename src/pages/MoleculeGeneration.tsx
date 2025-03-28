import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Divider,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import NvidiaGenMolGenerator from '../components/MoleculeGeneration/NvidiaGenMolGenerator';
import { Molecule } from '../utils/api';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const MoleculeGenerationPage: React.FC = () => {
  const [generatedMolecules, setGeneratedMolecules] = useState<Molecule[]>([]);
  const theme = useTheme();
  
  const handleMoleculesGenerated = (molecules: Molecule[]) => {
    setGeneratedMolecules(molecules);
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8f9fa',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Drug Molecule Generation
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Generate novel drug molecules using AI-powered approaches. Our platform uses NVIDIA GenMol
            to help you discover new potential drug candidates.
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <NvidiaGenMolGenerator onMoleculesGenerated={handleMoleculesGenerated} />
          </Box>
        </Paper>
      </Container>
    </motion.div>
  );
};

export default MoleculeGenerationPage; 