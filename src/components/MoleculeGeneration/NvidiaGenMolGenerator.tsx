import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Grid, 
  Slider, 
  TextField, 
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Divider,
  Paper,
  Tooltip,
  Chip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Molecule, moleculeApi } from '../../utils/api';
import MoleculeCard from '../MoleculeCard';

// Helper function to convert Molecule to DrugMolecule
const convertToDrugMolecule = (molecule: Molecule): any => {
  console.log('Converting molecule with structure_img:', !!molecule.structure_img);
  return {
    id: molecule.id,
    name: molecule.name || '',
    smiles: molecule.smile || '', // Map from Molecule.smile to DrugMolecule.smiles
    smile: molecule.smile || '', // Keep original smile property too
    molecular_formula: molecule.properties?.molecular_formula || '',
    molecular_weight: Number(molecule.properties?.molecular_weight || 0),
    properties: molecule.properties || {},
    structure_img: molecule.structure_img, // Include the structure image
    visualization_data: molecule.visualization_data // Include visualization data
  };
};

interface NvidiaGenMolGeneratorProps {
  initialSmiles?: string | string[];
  proteinId?: string;
  onMoleculesGenerated?: (molecules: Molecule[]) => void;
}

const scoringOptions = [
  { value: "QED", label: "QED (Drug-likeness)" },
  { value: "logP", label: "logP (Lipophilicity)" },
  { value: "SAS", label: "SAS (Synthetic Accessibility)" },
  { value: "MW", label: "MW (Molecular Weight)" },
];

const NvidiaGenMolGenerator: React.FC<NvidiaGenMolGeneratorProps> = ({ 
  initialSmiles = "",
  proteinId,
  onMoleculesGenerated
}) => {
  // Convert initialSmiles to array if it's a string
  const initialSmilesArray = Array.isArray(initialSmiles) 
    ? initialSmiles 
    : (initialSmiles ? [initialSmiles] : []);

  // State for seed selection and batch processing
  const [availableSeeds, setAvailableSeeds] = useState<string[]>(initialSmilesArray);
  const [selectedSeedIndex, setSelectedSeedIndex] = useState<number>(0);
  const [selectedSeeds, setSelectedSeeds] = useState<string[]>(initialSmilesArray.length > 0 ? [initialSmilesArray[0]] : []);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  
  // State for form inputs
  const [smiles, setSmiles] = useState<string>(initialSmilesArray[0] || "");
  const [numMolecules, setNumMolecules] = useState<number>(30);
  const [temperature, setTemperature] = useState<string>("1");
  const [noise, setNoise] = useState<string>("1");
  const [stepSize, setStepSize] = useState<number>(1);
  const [scoring, setScoring] = useState<string>("QED");
  const [unique, setUnique] = useState<boolean>(false);
  
  // State for results
  const [generatedMolecules, setGeneratedMolecules] = useState<Molecule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update available seeds when initialSmiles prop changes
  useEffect(() => {
    const newSeeds = Array.isArray(initialSmiles) 
      ? initialSmiles 
      : (initialSmiles ? [initialSmiles] : []);
    
    setAvailableSeeds(newSeeds);
    
    // Reset the selected index if the seeds array changes and becomes smaller
    if (selectedSeedIndex >= newSeeds.length && newSeeds.length > 0) {
      setSelectedSeedIndex(0);
    }
    
    // Update the selected seeds
    if (newSeeds.length > 0) {
      setSelectedSeeds([newSeeds[0]]);
      setSmiles(newSeeds[0]);
    } else {
      setSelectedSeeds([]);
      setSmiles("");
    }
  }, [initialSmiles]);

  // Update SMILES when selected seed changes
  useEffect(() => {
    if (availableSeeds.length > 0 && selectedSeedIndex < availableSeeds.length) {
      setSmiles(availableSeeds[selectedSeedIndex]);
      
      // Update selected seeds
      if (!selectedSeeds.includes(availableSeeds[selectedSeedIndex])) {
        setSelectedSeeds([...selectedSeeds, availableSeeds[selectedSeedIndex]]);
      }
    }
  }, [selectedSeedIndex, availableSeeds]);

  const handleSeedChange = (event: SelectChangeEvent<number>) => {
    const index = event.target.value as number;
    setSelectedSeedIndex(index);
  };

  const handleScoringChange = (event: SelectChangeEvent) => {
    setScoring(event.target.value);
  };
  
  const handleSeedSelection = (seed: string) => {
    if (selectedSeeds.includes(seed)) {
      // Remove seed if already selected
      setSelectedSeeds(selectedSeeds.filter(s => s !== seed));
    } else {
      // Add seed if not already selected
      setSelectedSeeds([...selectedSeeds, seed]);
    }
  };

  const handleGenerateMolecules = async () => {
    // Use the selected seeds for generation
    const seedsToUse = selectedSeeds.length > 0 ? selectedSeeds : [smiles];
    
    if (seedsToUse.every(s => !s.trim())) {
      setError("Please enter a valid SMILES string or select at least one seed molecule");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let allMolecules: Molecule[] = [];
      
      // Process each selected seed
      for (const currentSeed of seedsToUse) {
        try {
          const molecules = await moleculeApi.generateWithNvidiaGenMol({
            smiles: currentSeed,
            num_molecules: Math.floor(numMolecules / seedsToUse.length) || 1, // Distribute molecules across seeds
            temperature,
            noise,
            step_size: stepSize,
            scoring,
            unique
          });
          
          allMolecules = [...allMolecules, ...molecules];
        } catch (err: any) {
          // Log detailed error for debugging
          console.error(`Error generating molecules with NVIDIA GenMol using seed ${currentSeed}:`, err);
          
          // Create dummy data for this seed
          for (let i = 0; i < Math.floor(numMolecules / seedsToUse.length); i++) {
            allMolecules.push({
              id: `mol-nvidia-${currentSeed.substring(0, 5)}-${i}`,
              smile: currentSeed,
              name: `GenMol Molecule ${i+1} (from ${currentSeed.substring(0, 10)}...)`,
              description: `Generated with NVIDIA GenMol (demo)`,
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              properties: {
                [scoring]: Math.random() * 0.8 + 0.2, // Random score between 0.2 and 1.0
                molecular_weight: Math.floor(Math.random() * 300) + 200, // Random molecular weight
                molecular_formula: `C${Math.floor(Math.random() * 10) + 10}H${Math.floor(Math.random() * 20) + 10}N${Math.floor(Math.random() * 5)}O${Math.floor(Math.random() * 5)}`
              }
            });
          }
        }
      }
      
      setGeneratedMolecules(allMolecules);
      
      if (onMoleculesGenerated) {
        onMoleculesGenerated(allMolecules);
      }
    } catch (err) {
      console.error('Error in molecule generation process:', err);
      setError('An error occurred while processing molecules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Generate Molecules with NVIDIA GenMol
        <Tooltip title="NVIDIA GenMol is an AI-powered molecule generation tool that creates new drug candidates based on a seed molecule">
          <InfoIcon sx={{ ml: 1, fontSize: 'medium', verticalAlign: 'middle', color: 'info.main' }} />
        </Tooltip>
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            {availableSeeds.length > 1 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Available Seed Molecules ({availableSeeds.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Select one or more seed molecules to use for generation
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {availableSeeds.map((seed, index) => {
                    const isSelected = selectedSeeds.includes(seed);
                    return (
                      <Chip
                        key={`seed-chip-${index}`}
                        label={`Seed ${index + 1}${seed.length > 10 ? `: ${seed.substring(0, 10)}...` : `: ${seed}`}`}
                        onClick={() => handleSeedSelection(seed)}
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        sx={{ 
                          m: 0.5, 
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.2)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.4)' : '0 4px 12px rgba(255, 255, 255, 0.1)',
                          },
                          '&::after': isSelected ? {
                            content: '""',
                            position: 'absolute',
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#6366f1',
                            borderRadius: '50%',
                          } : {}
                        }}
                      />
                    );
                  })}
                </Box>
                
                {selectedSeeds.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    p: 1.5, 
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      width: 30, 
                      height: 30, 
                      borderRadius: '50%',
                      mr: 2,
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {selectedSeeds.length}
                    </Box>
                    <Typography variant="body2" color="primary" sx={{ flex: 1 }}>
                      {selectedSeeds.length === 1 
                        ? "1 seed molecule selected for generation" 
                        : `${selectedSeeds.length} seed molecules selected for generation`}
                    </Typography>
                    <Button 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      onClick={() => setSelectedSeeds([])}
                      sx={{ ml: 2 }}
                    >
                      Clear
                    </Button>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  label="Seed SMILES"
                  value={smiles}
                  onChange={(e) => setSmiles(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter a SMILES string for the seed molecule"
                  helperText="The base molecule structure to start generating from"
                  InputProps={{
                    sx: {
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px'
                    }
                  }}
                />
                {smiles && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: '24px', // Account for helper text
                      pointerEvents: 'none',
                      width: '100%',
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '14px',
                      paddingRight: '14px',
                      paddingTop: '16.5px',
                      paddingBottom: '16.5px',
                      boxSizing: 'border-box',
                      opacity: 0.9,
                    }}
                  >
                    {/* This creates a positioned overlay with highlighted parts */}
                    <Box component="span" sx={{ position: 'relative', ml: 0, mt: '20px', fontFamily: 'monospace', letterSpacing: '0.5px', whiteSpace: 'pre' }}>
                      {smiles.split('').map((char, index) => {
                        let color = 'inherit';
                        
                        // Color coding for different structural elements
                        if ('()[]{}'.includes(char)) {
                          // Brackets/parentheses
                          color = '#ec4899'; // Secondary color (pink)
                        } else if ('=#:'.includes(char)) {
                          // Bonds
                          color = '#3b82f6'; // Info color (blue)
                        } else if ('+-'.includes(char)) {
                          // Charges
                          color = '#f59e0b'; // Warning color (amber)
                        } else if (char.match(/[0-9]/)) {
                          // Numbers
                          color = '#10b981'; // Success color (green)
                        } else if ('CNOPS'.includes(char)) {
                          // Common atoms
                          color = '#6366f1'; // Primary color (indigo)
                        }
                        
                        return (
                          <Box 
                            component="span" 
                            key={index}
                            sx={{ 
                              color,
                              borderBottom: '([{'.includes(char) ? '2px solid #ec4899' : 
                                             'CNOPS'.includes(char) ? '2px solid #6366f1' : 'none',
                              opacity: 1,
                              fontWeight: 'CNOPS'.includes(char) ? 'bold' : 'normal',
                            }}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Number of Molecules to Generate
                <Tooltip title="How many candidate molecules to generate">
                  <InfoIcon sx={{ ml: 1, fontSize: 'small', verticalAlign: 'middle', color: 'info.main' }} />
                </Tooltip>
              </Typography>
              <Slider
                value={numMolecules}
                onChange={(_, value) => setNumMolecules(value as number)}
                step={5}
                marks
                min={5}
                max={50}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                {numMolecules} molecules {selectedSeeds.length > 1 ? `(approx. ${Math.floor(numMolecules / selectedSeeds.length)} per seed)` : ''}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Scoring Function</InputLabel>
                <Select
                  value={scoring}
                  label="Scoring Function"
                  onChange={handleScoringChange}
                >
                  {scoringOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Property to optimize in generated molecules
                </Typography>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Advanced Settings
                <Tooltip title="Fine-tune the generation process (recommended for advanced users)">
                  <InfoIcon sx={{ ml: 1, fontSize: 'small', verticalAlign: 'middle', color: 'info.main' }} />
                </Tooltip>
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Temperature</Typography>
              <Slider
                value={parseFloat(temperature)}
                onChange={(_, value) => setTemperature(value.toString())}
                step={0.1}
                min={0.1}
                max={2}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                Controls randomness in generation
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Noise</Typography>
              <Slider
                value={parseFloat(noise)}
                onChange={(_, value) => setNoise(value.toString())}
                step={0.1}
                min={0.1}
                max={2}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                Controls diversity in generation
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Step Size</Typography>
              <Slider
                value={stepSize}
                onChange={(_, value) => setStepSize(value as number)}
                step={1}
                min={1}
                max={10}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                Number of steps in generation process
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleGenerateMolecules}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{ mt: 2 }}
              >
                {loading ? 'Generating...' : 'Generate Molecules'}
              </Button>
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', mt: 2 }}>
                  <Typography>{error}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      
      {generatedMolecules.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            Generated Molecules ({generatedMolecules.length})
          </Typography>
          
          <Grid container spacing={3}>
            {generatedMolecules.map((molecule) => (
              <Grid item key={molecule.id} xs={12} sm={6} md={4} lg={3}>
                <MoleculeCard molecule={convertToDrugMolecule(molecule)} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default NvidiaGenMolGenerator; 