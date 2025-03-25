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
} from '@mui/material';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import DiseaseSearch from '../components/DiseaseSearch';
import ProteinCard from '../components/ProteinCard';
import MoleculeCard from '../components/MoleculeCard';
import MoleculeVisualization from '../components/MoleculeVisualization';
import { proteinApi, moleculeApi } from '../utils/api';

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

interface DiseaseSuggestion {
  id: string;
  name: string;
  aliases?: string[];
}

interface Protein {
  id: string;
  name: string;
  pdb_id?: string;
  uniprot_id?: string;
  sequence?: string;
  description?: string;
  disease_id?: string;
  disease_name?: string;
  binding_site?: any;
  created_at?: string;
  updated_at?: string;
}

interface DrugMolecule {
  id?: string;
  molecule_id?: string;
  chembl_id?: string;
  molecule_chembl_id?: string;
  name?: string;
  smiles: string;
  molecular_formula?: string;
  molecular_weight?: number;
  inchi_key?: string;
  properties?: Record<string, any>;
  target_id?: string;
  target_chembl_id?: string;
  target_name?: string;
  activity_value?: number;
  activity_type?: string;
  mechanism_of_action?: string;
  _metadata?: Record<string, any>;
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

const DrugDiscovery = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Disease selection state
  const [selectedDisease, setSelectedDisease] = useState<DiseaseSuggestion | null>(null);
  
  // Protein selection state
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [selectedProteins, setSelectedProteins] = useState<{[id: string]: boolean}>({});
  
  // Drug molecules state
  const [drugMolecules, setDrugMolecules] = useState<DrugMolecule[]>([]);
  const [loadingChemblIds, setLoadingChemblIds] = useState<{[id: string]: boolean}>({});
  const [drugDataByProtein, setDrugDataByProtein] = useState<Record<string, DrugData>>({});
  
  // Handle disease selection
  const handleDiseaseSelect = async (disease: DiseaseSuggestion) => {
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
      setDrugMolecules([]);
      
    } catch (error) {
      console.error('Error fetching proteins:', error);
      setError('Failed to fetch proteins for the selected disease.');
      setProteins([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle protein selection
  const handleProteinSelect = (protein: Protein, isSelected: boolean) => {
    if (!protein || !protein.id) return;
    
    setSelectedProteins(prev => ({
      ...prev,
      [protein.id]: isSelected
    }));
  };
  
  // Get selected proteins array
  const getSelectedProteinsArray = (): Protein[] => {
    if (!proteins) return [];
    return proteins.filter(protein => protein && protein.id && selectedProteins[protein.id]);
  };
  
  // Handle next step button click
  const handleNext = async () => {
    try {
      if (activeStep === 0) {
        // Moving from Disease Selection to Protein Selection
        setActiveStep(1);
      } 
      else if (activeStep === 1) {
        // Move to Molecule Analysis step immediately
        setActiveStep(2);
        setLoading(true);
        setError(null);
        
        const selectedProteinsArr = getSelectedProteinsArray();
        
        if (selectedProteinsArr.length === 0) {
          throw new Error('Please select at least one protein to continue.');
        }
        
        console.log(`Starting drug fetch for ${selectedProteinsArr.length} proteins:`, selectedProteinsArr);
        
        // Clear previous drug data
        setDrugDataByProtein({});
        setDrugMolecules([]);
        
        try {
          // Subscribe to protein drug updates
          const unsubscribe = proteinApi.subscribeToProteinDrugUpdates((data: DrugData) => {
            console.log('Received drug update:', data);
            
            setDrugDataByProtein(prev => ({
              ...prev,
              [data.proteinId]: data
            }));
            
            // Update drugMolecules with the new data
            if (data.status === 'success' && Array.isArray(data.drugs)) {
              console.log(`Processing ${data.drugs.length} drugs from update for protein ${data.proteinName}`);
              console.log('First drug in update:', data.drugs[0]); // Debug log
              
              // Process all drugs first
              const newDrugs = data.drugs.map(drug => {
                if (!drug) {
                  console.log('Found null/undefined drug entry');
                  return null;
                }
                
                // Debug log for drug properties
                console.log('Processing drug:', drug);
                
                // Map the properties from the API response to our interface
                const mappedDrug = {
                  chembl_id: drug.molecule_chembl_id,
                  name: drug.name || drug.molecule_chembl_id,
                  smiles: drug.smiles,
                  target_id: drug.target_chembl_id,
                  target_name: data.proteinName,
                  activity_type: drug.mechanism_of_action,
                  properties: {
                    mechanism_of_action: drug.mechanism_of_action
                  }
                };
                
                // Log the mapped drug
                console.log('Mapped drug:', mappedDrug);
                
                // Check for valid key
                const key = mappedDrug.chembl_id || mappedDrug.smiles;
                if (!key) {
                  console.log('Drug has no valid key identifiers');
                  return null;
                }
                
                // Processed drug
                const processedDrug = {
                  ...mappedDrug,
                  id: key
                };
                console.log('Processed drug:', processedDrug);
                return processedDrug;
              }).filter(Boolean) as DrugMolecule[];
              
              console.log(`Processed ${newDrugs.length} valid drugs for ${data.proteinName}`);
              
              setDrugMolecules(prev => {
                // Create a map of existing drugs
                const existingDrugs = new Map(prev.map(drug => [
                  drug.chembl_id || drug.molecule_id || drug.id || drug.smiles,
                  drug
                ]));
                
                // Add new drugs to the map
                let addedCount = 0;
                newDrugs.forEach(drug => {
                  const key = drug.chembl_id || drug.molecule_id || drug.id || drug.smiles;
                  if (!existingDrugs.has(key)) {
                    existingDrugs.set(key, drug);
                    addedCount++;
                    console.log(`Added drug with key ${key} for protein ${data.proteinName}`);
                  }
                });
                
                const updatedDrugs = Array.from(existingDrugs.values());
                console.log(`Drug state update summary:`, {
                  previousCount: prev.length,
                  newDrugsProcessed: newDrugs.length,
                  newDrugsAdded: addedCount,
                  totalAfterUpdate: updatedDrugs.length
                });
                return updatedDrugs;
              });
            }
          });
          
          // Start fetching drugs for all selected proteins
          console.log('Calling getDrugsForProteins with:', selectedProteinsArr);
          const apiResponse = await proteinApi.getDrugsForProteins(
            selectedProteinsArr.map(protein => ({
              id: protein.id,
              name: protein.name,
              uniprot_id: protein.uniprot_id || protein.pdb_id
            }))
          );
          
          // Stop loading after ensuring we have some data
          setTimeout(() => {
            setLoading(false);
            
            // Log final drug count
            console.log('Final drug molecules count:', drugMolecules.length);
            
            // Cleanup subscription after a delay to ensure we got all updates
            setTimeout(() => {
              unsubscribe();
              console.log('Unsubscribed from drug updates');
            }, 5000);
          }, 1000);
          
        } catch (error: any) {
          console.error('Error fetching drugs:', error);
          setError(error.message || 'Failed to fetch drug data');
          setLoading(false);
        }
        
      } else if (activeStep === 2) {
        // Moving from Molecule Analysis to Results
        setActiveStep(3);
      }
    } catch (error: any) {
      console.error('Error during step transition:', error);
      setError(error.message || 'An error occurred while processing your request.');
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  
  const canProceed = () => {
    if (activeStep === 0) {
      return !!selectedDisease;
    } else if (activeStep === 1) {
      return Object.values(selectedProteins).some(selected => selected);
    }
    return true;
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

            {error && (
              <Alert 
                severity="error" 
                onClose={() => setError(null)} 
                sx={{ mb: 3, background: 'rgba(239, 68, 68, 0.2)', color: 'white' }}
              >
                {error}
              </Alert>
            )}

            <Box sx={{ position: 'relative', minHeight: 400 }}>
              {loading && activeStep === 0 && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 10,
                    borderRadius: 1
                  }}
                >
                  <CircularProgress size={60} sx={{ color: '#e879f9' }} />
                </Box>
              )}
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                key={activeStep}
              >
                {/* Disease Selection Step */}
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
                          Select a Disease
                        </Typography>
                        
                        <DiseaseSearch 
                          onDiseaseSelect={handleDiseaseSelect} 
                          label="Search for a disease"
                          placeholder="Type disease name (e.g., Diabetes, Cancer, Alzheimer's)"
                        />
                        
                        {selectedDisease && (
                          <Box mt={3}>
                            <Typography variant="subtitle1" color="white" fontWeight={600}>
                              Selected Disease:
                            </Typography>
                            <Paper 
                              sx={{ 
                                p: 2, 
                                mt: 1, 
                                background: 'rgba(129, 140, 248, 0.1)',
                                borderLeft: '4px solid #818cf8'
                              }}
                            >
                              <Typography variant="body1" color="white">
                                {selectedDisease.name}
                              </Typography>
                              
                              {selectedDisease.aliases && selectedDisease.aliases.length > 0 && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}
                                >
                                  Also known as: {selectedDisease.aliases.join(', ')}
                                </Typography>
                              )}
                            </Paper>
                        </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

                {/* Protein Selection Step */}
                {activeStep === 1 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ 
                        color: '#e879f9',
                        fontWeight: 600,
                        mb: 3
                      }}
                    >
                      Select Proteins for {selectedDisease?.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="rgba(255, 255, 255, 0.7)"
                      sx={{ mb: 3 }}
                    >
                      Select one or more proteins to find drug molecules that target these proteins.
                    </Typography>
                    
                    {proteins.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
                          No proteins found for this disease. Please go back and select another disease.
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={3}>
                        {proteins.map(protein => (
                          <Grid item xs={12} sm={6} md={4} key={protein.id}>
                            <ProteinCard 
                              protein={protein}
                              isSelected={!!selectedProteins[protein.id]}
                              onSelectChange={handleProteinSelect}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Molecule Analysis Step */}
                {activeStep === 2 && (
                  <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#e879f9',
                          fontWeight: 600,
                        }}
                      >
                        Drug Molecules
                      </Typography>
                      
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Found {drugMolecules.length} molecules for {getSelectedProteinsArray().length} selected proteins
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 4 }}>
                      <Typography 
                        variant="subtitle2" 
                        color="rgba(255, 255, 255, 0.9)"
                        sx={{ mb: 1 }}
                      >
                        Selected Proteins:
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {getSelectedProteinsArray().map(protein => (
                          <Paper 
                            key={protein.id}
                            sx={{ 
                              p: 1, 
                              background: 'rgba(129, 140, 248, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Typography variant="body2" color="white">
                              {protein.name}
                            </Typography>
                            
                            {loadingChemblIds[protein.id] && (
                              <CircularProgress size={16} sx={{ color: '#e879f9' }} />
                            )}
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    {loading ? (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <CircularProgress size={60} sx={{ color: '#e879f9', mb: 3 }} />
                        <Typography variant="h6" color="rgba(255, 255, 255, 0.9)">
                          Retrieving drug molecules...
                        </Typography>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.6)" sx={{ mt: 1 }}>
                          This may take a moment as we search multiple databases
                        </Typography>
                      </Box>
                    ) : drugMolecules.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
                          No drug molecules found for the selected proteins.
                        </Typography>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" sx={{ mt: 1 }}>
                          Try selecting different proteins or a different disease.
                        </Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={3}>
                        {drugMolecules.map((molecule, index) => (
                          <Grid item xs={12} sm={6} md={4} key={molecule.chembl_id || molecule.molecule_id || molecule.id || index}>
                            <MoleculeCard 
                              molecule={molecule}
                              loading={false}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Results Step */}
                {activeStep === 3 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Results
                    </Typography>
                    <Typography variant="body1" paragraph>
                      Your drug discovery analysis is complete. Below are the most promising drug candidates
                      based on their binding affinity, drug-likeness, and other properties.
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
              </motion.div>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3 }}>
                <Button 
                disabled={activeStep === 0}
                  onClick={handleBack} 
                variant="outlined"
                  sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                disabled={loading || !canProceed()}
                  sx={{
                    background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                  color: 'white',
                    '&:hover': {
                    background: 'linear-gradient(45deg, #6366f1, #db2777)',
                    },
                    '&.Mui-disabled': {
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  activeStep === steps.length - 1 ? 'Finish' : 'Next'
                )}
                </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </motion.div>
  );
};

export default DrugDiscovery; 