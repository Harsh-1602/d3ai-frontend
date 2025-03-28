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
  Divider
} from '@mui/material';
import { Molecule } from '../../utils/api';
import MoleculeService from '../../services/MoleculeService';
import MoleculeCard from '../MoleculeCard';

interface MoleculeGeneratorProps {
  initialSmiles?: string[];
  diseaseName?: string;
  onMoleculesGenerated?: (molecules: Molecule[]) => void;
}

const MoleculeGenerator: React.FC<MoleculeGeneratorProps> = ({ 
  initialSmiles = [],
  diseaseName,
  onMoleculesGenerated
}) => {
  // State for form inputs
  const [smiles, setSmiles] = useState<string>(initialSmiles.join('\n'));
  const [count, setCount] = useState<number>(10);
  const [diversityFactor, setDiversityFactor] = useState<number>(0.7);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.6);
  
  // State for results
  const [generatedMolecules, setGeneratedMolecules] = useState<Molecule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationMethod, setGenerationMethod] = useState<'smiles' | 'disease'>(
    diseaseName ? 'disease' : 'smiles'
  );

  // Update SMILES when initialSmiles prop changes
  useEffect(() => {
    if (initialSmiles && initialSmiles.length > 0) {
      setSmiles(initialSmiles.join('\n'));
      setGenerationMethod('smiles');
    }
  }, [initialSmiles]);

  const handleGenerationMethodChange = (event: SelectChangeEvent) => {
    setGenerationMethod(event.target.value as 'smiles' | 'disease');
  };

  const handleGenerateMolecules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let molecules: Molecule[] = [];
      const seedSmilesArray = smiles.split('\n').filter(line => line.trim().length > 0);
      
      if (generationMethod === 'smiles' && seedSmilesArray.length > 0) {
        // Call the API to generate molecules from SMILES
        try {
          molecules = await MoleculeService.generateMolecules({
            seed_smiles: seedSmilesArray,
            count: count,
            diversity_factor: diversityFactor,
            similarity_threshold: similarityThreshold
          });
        } catch (err) {
          console.error('Error generating molecules from SMILES:', err);
          setError('Error generating molecules from SMILES. Using dummy data for demonstration.');
          
          // Generate dummy data for demonstration
          for (let i = 0; i < count; i++) {
            molecules.push({
              id: `mol-${i}`,
              smile: seedSmilesArray[0] || `C${i}H${i*2}O${i % 3}`,
              name: `Generated Molecule ${i+1}`,
              description: `Auto-generated test molecule ${i+1}`,
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      } else if (generationMethod === 'disease' && diseaseName) {
        // Call the API to generate molecules for disease
        try {
          molecules = await MoleculeService.generateMoleculesForDisease(
            diseaseName,
            count,
            diversityFactor,
            similarityThreshold
          );
        } catch (err) {
          console.error(`Error generating molecules for disease ${diseaseName}:`, err);
          setError(`Failed to generate molecules for ${diseaseName}. Using dummy data.`);
          
          // Create dummy data for demonstration
          for (let i = 0; i < count; i++) {
            molecules.push({
              id: `mol-disease-${i}`,
              smile: `C${i}H${i*2}N${i % 3}O${i % 2}`,
              name: `${diseaseName} Molecule ${i+1}`,
              description: `Generated for ${diseaseName}`,
              is_valid: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      } else {
        setError('Please enter valid SMILES strings or select a disease.');
        setLoading(false);
        return;
      }
      
      setGeneratedMolecules(molecules);
      
      if (onMoleculesGenerated) {
        onMoleculesGenerated(molecules);
      }
    } catch (err) {
      console.error('Error generating molecules:', err);
      setError('An error occurred while generating molecules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Generate New Drug Molecules
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Generation Method</InputLabel>
                <Select
                  value={generationMethod}
                  label="Generation Method"
                  onChange={handleGenerationMethodChange}
                >
                  <MenuItem value="smiles">From SMILES strings</MenuItem>
                  <MenuItem value="disease" disabled={!diseaseName}>
                    From disease: {diseaseName || "No disease selected"}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {generationMethod === 'smiles' && (
              <Grid item xs={12}>
                <TextField
                  label="Seed SMILES (one per line)"
                  multiline
                  rows={4}
                  value={smiles}
                  onChange={(e) => setSmiles(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter SMILES strings here, one per line"
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Number of molecules to generate</Typography>
              <Slider
                value={count}
                onChange={(_, value) => setCount(value as number)}
                step={5}
                marks
                min={5}
                max={50}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                {count} molecules
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Diversity Factor</Typography>
              <Slider
                value={diversityFactor}
                onChange={(_, value) => setDiversityFactor(value as number)}
                step={0.1}
                min={0.1}
                max={1}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                Higher values create more diverse molecules
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Similarity Threshold</Typography>
              <Slider
                value={similarityThreshold}
                onChange={(_, value) => setSimilarityThreshold(value as number)}
                step={0.1}
                min={0.1}
                max={0.9}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                Minimum similarity to parent molecules (0-1)
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleGenerateMolecules}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Generating...' : 'Generate Molecules'}
              </Button>
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Typography color="error">{error}</Typography>
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

export default MoleculeGenerator; 