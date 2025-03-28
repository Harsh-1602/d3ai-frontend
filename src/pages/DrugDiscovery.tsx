import React, { useState, useEffect, Suspense } from 'react';
import {
  Container,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  Checkbox,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import DiseaseSearch, { DiseaseSuggestion, DiseaseSearchProps } from '../components/DiseaseSearch';
import ProteinCard, { Protein, ProteinCardProps } from '../components/ProteinCard';
import MoleculeCard from '../components/MoleculeCard';
import MoleculeVisualization from '../components/MoleculeVisualization';
import MoleculeGenerator from '../components/MoleculeGeneration/MoleculeGenerator';
import NvidiaGenMolGenerator from '../components/MoleculeGeneration/NvidiaGenMolGenerator';
import { proteinApi, moleculeApi, Molecule } from '../utils/api';

// Import or define the DrugMolecule interface
interface DrugMolecule {
  id?: string;
  molecule_id?: string;
  name?: string;
  smiles?: string;
  smile?: string;
  chembl_id?: string;
  molecule_chembl_id?: string;
  molecular_weight?: number;
  molecular_formula?: string;
  activity_value?: number;
  activity_type?: string;
  mechanism_of_action?: string;
  properties?: Record<string, any>;
  // Add other potential properties from the stream API
}

const steps = [
  'Disease Selection',
  'Protein Selection',
  'Molecule Analysis',
  'Results',
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`molecule-generation-tabpanel-${index}`}
      aria-labelledby={`molecule-generation-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `molecule-generation-tab-${index}`,
    'aria-controls': `molecule-generation-tabpanel-${index}`,
  };
}

interface DrugData {
  proteinId: string;
  proteinName: string;
  drugs: DrugMolecule[];
  error?: string;
  timestamp: string;
  status: 'success' | 'error';
  fromCache?: boolean;
}

interface DrugApiResponse {
  results: DrugData[];
  status: string;
  message?: string;
}

// Add a helper function to convert from Molecule to DrugMolecule
const convertToDrugMolecule = (molecule: Molecule): DrugMolecule => {
  return {
    id: molecule.id,
    name: molecule.name || '',
    smiles: molecule.smile || '',
    molecular_formula: molecule.properties?.molecular_formula || '',
    molecular_weight: Number(molecule.properties?.molecular_weight || 0),
    properties: molecule.properties || {},
    // Add any other required fields with defaults
  };
};

const DrugDiscovery = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseSuggestion | null>(null);
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [selectedProteins, setSelectedProteins] = useState<{[id: string]: boolean}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genTabValue, setGenTabValue] = useState<number>(0);
  const [generatedMolecules, setGeneratedMolecules] = useState<Molecule[]>([]);
  const [proteinDrugs, setProteinDrugs] = useState<DrugMolecule[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<{[id: string]: boolean}>({});
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [drugError, setDrugError] = useState<string | null>(null);
  const theme = useTheme();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedDisease(null);
    setProteins([]);
    setSelectedProteins({});
    setGeneratedMolecules([]);
  };

  const onDiseaseSelect = async (disease: DiseaseSuggestion) => {
    setSelectedDisease(disease);
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Selected disease: ${disease.name} (ID: ${disease.id})`);
      
      // Use the API utility to fetch proteins by disease name
      console.log(`Fetching proteins for disease name: ${disease.name}`);
      const proteinsData = await proteinApi.getProteinsByDiseaseName(disease.name);
      
      console.log(`Found ${proteinsData?.length || 0} proteins for disease ${disease.name}:`, proteinsData);
      
      // If we got proteins data, update the state
      if (Array.isArray(proteinsData)) {
        setProteins(proteinsData);
      } else {
        console.warn("Unexpected proteins data format:", proteinsData);
        setProteins([]);
      }
      
      // Clear any previously selected proteins
      setSelectedProteins({});
      
    } catch (error) {
      console.error('Error fetching proteins:', error);
      setError('Failed to fetch proteins for the selected disease.');
      setProteins([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProteinSelectChange = (protein: Protein, isSelected: boolean) => {
    if (!protein || !protein.id) return;
    
    setSelectedProteins(prev => ({
      ...prev,
      [protein.id]: isSelected
    }));
  };
  
  const handleGenTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setGenTabValue(newValue);
  };
  
  const handleMoleculesGenerated = (molecules: Molecule[]) => {
    setGeneratedMolecules(molecules);
    // If we're at the protein selection step, move to results step
    if (activeStep === 1) {
      setActiveStep(3); // Move to results step
    }
  };

  // Function to fetch drugs for selected proteins
  const fetchDrugsForSelectedProteins = async () => {
    // Get selected protein IDs
    const selectedProteinIds = Object.entries(selectedProteins)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => id);
      
    if (selectedProteinIds.length === 0) {
      setDrugError("No proteins selected. Please select at least one protein.");
      return;
    }
    
    setLoadingDrugs(true);
    setDrugError(null);
    
    try {
      // Get selected protein objects
      const selectedProteinObjects = proteins.filter(protein => 
        selectedProteinIds.includes(protein.id)
      );
      
      // Fetch drugs for selected proteins
      let allDrugs: DrugMolecule[] = [];
      const results = await proteinApi.getDrugsForProteins(selectedProteinObjects);
      
      // Combine all drugs from different proteins
      results.forEach(result => {
        if (result.status === 'success' && result.drugs && result.drugs.length > 0) {
          // Map the API response format to our DrugMolecule interface
          const mappedDrugs = result.drugs.map((drug: any) => ({
            id: drug.id || drug.molecule_id || drug.molecule_chembl_id,
            molecule_id: drug.molecule_id,
            molecule_chembl_id: drug.molecule_chembl_id,
            chembl_id: drug.chembl_id,
            name: drug.name || drug.pref_name,
            smiles: drug.smiles || drug.smile || drug.canonical_smiles,
            smile: drug.smile || drug.smiles || drug.canonical_smiles,
            molecular_weight: drug.molecular_weight || drug.properties?.molecular_weight,
            activity_value: drug.activity_value,
            activity_type: drug.activity_type,
            mechanism_of_action: drug.mechanism_of_action
          }));
          allDrugs = [...allDrugs, ...mappedDrugs];
        }
      });
      
      // Remove duplicates based on molecule ID or ChEMBL ID
      const uniqueDrugs = allDrugs.filter((drug, index, self) =>
        index === self.findIndex((d) => (
          (drug.molecule_chembl_id && d.molecule_chembl_id === drug.molecule_chembl_id) || 
          (drug.chembl_id && d.chembl_id === drug.chembl_id) ||
          (drug.id && d.id === drug.id)
        ))
      );
      
      setProteinDrugs(uniqueDrugs);
      
      if (uniqueDrugs.length === 0) {
        setDrugError("No drug molecules found for the selected proteins.");
      }
      
    } catch (error) {
      console.error('Error fetching drugs for proteins:', error);
      setDrugError('Failed to fetch drug molecules for the selected proteins.');
    } finally {
      setLoadingDrugs(false);
    }
  };
  
  // Effect to fetch drugs when going to the molecule generation step
  useEffect(() => {
    if (activeStep === 2) {
      fetchDrugsForSelectedProteins();
    }
  }, [activeStep]);
  
  // Handler for drug molecule selection
  const handleDrugSelect = (drugId: string, isSelected: boolean) => {
    setSelectedDrugs(prev => ({
      ...prev,
      [drugId]: isSelected
    }));
  };
  
  // Function to get selected drug smiles strings for use as seeds
  const getSelectedDrugSmiles = (): string[] => {
    const selectedDrugIds = Object.entries(selectedDrugs)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => id);
      
    return proteinDrugs
      .filter(drug => selectedDrugIds.includes(drug.id || drug.molecule_id || drug.molecule_chembl_id || ''))
      .map(drug => drug.smiles || drug.smile || '')
      .filter(smile => smile !== ''); // Filter out empty strings
  };
  
  // Handler for generating molecules based on selected drugs
  const handleGenerateFromSelectedDrugs = () => {
    const selectedSmiles = getSelectedDrugSmiles();
    // Set active tab to the appropriate generation method
    if (genTabValue === 0) {
      // Standard generation
      // Pass selected drug SMILES to the MoleculeGenerator component
      // This will be handled by the component prop
    } else if (genTabValue === 1) {
      // NVIDIA GenMol
      // Pass the first selected SMILES to NvidiaGenMolGenerator
      // This will be handled by the component prop
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
          <Paper 
          elevation={3} 
            sx={{ 
              p: 4,
                mb: 4,
            borderRadius: 2
              }}
            >
          <Typography variant="h4" gutterBottom>
            Disease-based Drug Discovery
            </Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ my: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

          {/* Step 1: Disease Selection */}
          {activeStep === 0 && (
              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
              <Typography variant="h5" gutterBottom>
                          Select a Disease
                        </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Start by selecting a disease to find associated proteins and potential drug candidates.
                              </Typography>
                              
              <DiseaseSearch onDiseaseSelect={onDiseaseSelect} />

              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={!selectedDisease}
                  sx={{ mr: 1 }}
                >
                  Next
                </Button>
                        </Box>
            </motion.div>
          )}
          
          {/* Step 2: Protein Selection */}
                {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h5" gutterBottom>
                Select Target Proteins
                    </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Select one or more proteins associated with {selectedDisease?.name} to target for drug discovery.
                    </Typography>
                    
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                      </Box>
              ) : error ? (
                <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
              ) : proteins.length === 0 ? (
                <Alert severity="info" sx={{ my: 2 }}>
                  No proteins found for {selectedDisease?.name}. Please select a different disease.
                </Alert>
              ) : (
                <Grid container spacing={3} sx={{ my: 2 }}>
                  {proteins.map((protein) => (
                          <Grid item xs={12} sm={6} md={4} key={protein.id}>
                            <ProteinCard 
                              protein={protein}
                        isSelected={selectedProteins[protein.id]}
                        onSelectChange={(protein, isSelected) => handleProteinSelectChange(protein, isSelected)}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
              
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
                <Button 
                  color="inherit"
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={Object.values(selectedProteins).some(selected => selected) === false}
                  sx={{ mr: 1 }}
                >
                  Next
                </Button>
                  </Box>
            </motion.div>
                )}

          {/* Step 3: Molecule Generation */}
                {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h5" gutterBottom>
                Generate Molecules
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Generate potential drug molecules for the selected proteins.
                      </Typography>
                      
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={genTabValue} 
                  onChange={handleGenTabChange} 
                  aria-label="molecule generation methods"
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="Potential Drugs Found from Bioassays" {...a11yProps(0)} />
                  <Tab label="NVIDIA GenMol (AI)" {...a11yProps(1)} />
                </Tabs>
              </Box>
                    
              {/* Potential Drugs Found from Bioassays */}
              <TabPanel value={genTabValue} index={0}>
                    <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Potential Drug Molecules for Selected Proteins
                      </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Select drug molecules to use as seeds for generating new molecules.
                            </Typography>
                            
                  {loadingDrugs ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : drugError ? (
                    <Alert severity="error" sx={{ my: 2 }}>{drugError}</Alert>
                  ) : proteinDrugs.length === 0 ? (
                    <Alert severity="info" sx={{ my: 2 }}>
                      No drug molecules found for the selected proteins. Try selecting different proteins.
                    </Alert>
                  ) : (
                    <>
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        {proteinDrugs.map((drug) => (
                          <Grid item xs={12} sm={6} md={4} key={drug.id || drug.molecule_id || drug.molecule_chembl_id || ''}>
                            <Card sx={{ 
                              height: '100%', 
                              border: selectedDrugs[drug.id || drug.molecule_id || drug.molecule_chembl_id || ''] 
                                ? '2px solid #6366f1' 
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                transform: 'translateY(-4px)',
                              },
                            }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="h6" component="div">
                                    {drug.name || drug.molecule_id || drug.chembl_id || drug.molecule_chembl_id || 'Unknown'}
                        </Typography>
                                  <Checkbox 
                                    checked={!!selectedDrugs[drug.id || drug.molecule_id || drug.molecule_chembl_id || '']}
                                    onChange={(e) => handleDrugSelect(drug.id || drug.molecule_id || drug.molecule_chembl_id || '', e.target.checked)}
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.6)',
                                      '&.Mui-checked': {
                                        color: '#6366f1',
                                      },
                                    }}
                                  />
                                </Box>
                                {(drug.chembl_id || drug.molecule_chembl_id) && (
                                  <Chip 
                                    label={`ChEMBL: ${drug.chembl_id || drug.molecule_chembl_id}`}
                                    size="small"
                                    sx={{ mb: 1 }}
                                  />
                                )}
                                <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2, overflowX: 'auto' }}>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                    {drug.smiles || drug.smile}
                        </Typography>
                      </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {drug.molecular_weight && (
                                    <Chip size="small" label={`MW: ${Number(drug.molecular_weight).toFixed(2)}`} />
                                  )}
                                  {drug.activity_value && (
                                    <Chip size="small" label={`Activity: ${drug.activity_value} ${drug.activity_type || ''}`} />
                                  )}
                                  {drug.mechanism_of_action && (
                                    <Chip size="small" label={`MOA: ${drug.mechanism_of_action}`} />
                                  )}
                      </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                      
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => {
                            // Set tab to NVIDIA tab
                            if (Object.values(selectedDrugs).some(selected => selected)) {
                              setGenTabValue(1); // Set to NVIDIA GenMol tab 
                            }
                          }}
                          disabled={!Object.values(selectedDrugs).some(selected => selected)}
                        >
                          Use Selected as Seed Molecules
                        </Button>
                      </Box>
                    </>
                )}
            </Box>
              </TabPanel>
              
              {/* NVIDIA GenMol */}
              <TabPanel value={genTabValue} index={1}>
                <NvidiaGenMolGenerator 
                  initialSmiles={getSelectedDrugSmiles()}
                  onMoleculesGenerated={handleMoleculesGenerated}
                />
              </TabPanel>
              
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
                <Button 
                  color="inherit"
                  onClick={handleBack} 
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={generatedMolecules.length === 0}
                  sx={{ mr: 1 }}
                >
                  Next
                </Button>
              </Box>
            </motion.div>
          )}
          
          {/* Step 4: Results */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h5" gutterBottom>
                Results
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Review the generated molecules and their properties.
              </Typography>
              
              {generatedMolecules.length > 0 ? (
                <Grid container spacing={3} sx={{ my: 2 }}>
                  {generatedMolecules.map((molecule) => (
                    <Grid item xs={12} sm={6} md={4} key={molecule.id}>
                      <MoleculeCard 
                        molecule={convertToDrugMolecule(molecule)} 
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info" sx={{ my: 2 }}>
                  No molecules have been generated yet. Please go back to the molecule generation step.
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
                <Button 
                  color="inherit"
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button 
                  variant="contained" 
                  onClick={handleReset}
                  sx={{ mr: 1 }}
                >
                  Start Over
                </Button>
            </Box>
            </motion.div>
          )}
          </Paper>
        </Container>
    </motion.div>
  );
};

export default DrugDiscovery; 