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
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float } from '@react-three/drei';
import DiseaseSearch, { DiseaseSuggestion, DiseaseSearchProps } from '../components/DiseaseSearch';
import ProteinCard, { Protein as BaseProtein, ProteinCardProps } from '../components/ProteinCard';
import MoleculeCard from '../components/MoleculeCard';
import MoleculeVisualization from '../components/MoleculeVisualization';
import MoleculeGenerator from '../components/MoleculeGeneration/MoleculeGenerator';
import NvidiaGenMolGenerator from '../components/MoleculeGeneration/NvidiaGenMolGenerator';
import DockingVisualization from '../components/DockingVisualization';
import { proteinApi, moleculeApi, dockingApi, Molecule } from '../utils/api';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

// Extend the Protein interface to include gene_name property
interface Protein extends BaseProtein {
  gene_name?: string;
}

// Import or define the DrugMolecule interface
interface DrugMolecule {
  id?: string;
  molecule_id?: string;
  name?: string;
  pref_name?: string;
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
  
  // New state for docking
  const [selectedDockingProtein, setSelectedDockingProtein] = useState<string | null>(null);
  const [selectedDockingMolecule, setSelectedDockingMolecule] = useState<string | null>(null);
  const [isDockingLoading, setIsDockingLoading] = useState(false);
  const [dockingError, setDockingError] = useState<string | null>(null);
  const [dockingResult, setDockingResult] = useState<{
    ligand_positions: string[],
    position_confidence: number[],
    status: string,
    message?: string
  } | null>(null);
  const [dockingVisualization, setDockingVisualization] = useState<string | null>(null);
  const [dockingModalOpen, setDockingModalOpen] = useState(false);
  
  // Add this state to track proteins with their PDB IDs
  const [proteinPdbMap, setProteinPdbMap] = useState<{[id: string]: string}>({});
  
  // Add this state for managing the success message visibility
  const [showDockingSuccess, setShowDockingSuccess] = useState<boolean>(true);
  
  // Add this state near other docking states (around line 103):
  const [isDockingVisualizationVisible, setIsDockingVisualizationVisible] = useState<boolean>(true);
  
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

  // New handler for protein selection for docking
  const handleDockingProteinSelect = (proteinId: string) => {
    setSelectedDockingProtein(proteinId === selectedDockingProtein ? null : proteinId);
  };

  // New handler for molecule selection for docking
  const handleDockingMoleculeSelect = (moleculeId: string) => {
    setSelectedDockingMolecule(moleculeId === selectedDockingMolecule ? null : moleculeId);
  };

  // Function to get the selected protein object
  const getSelectedProtein = (): Protein | null => {
    if (!selectedDockingProtein) return null;
    const protein = proteins.find(protein => protein.id === selectedDockingProtein) || null;
    
    if (protein && !protein.pdb_id && proteinPdbMap[protein.id]) {
      // Create a new protein object with the PDB ID from our map
      return {
        ...protein,
        pdb_id: proteinPdbMap[protein.id]
      };
    }
    
    return protein;
  };

  // Function to get the selected molecule object (either from generated molecules or protein drugs)
  const getSelectedMolecule = (): Molecule | DrugMolecule | null => {
    if (!selectedDockingMolecule) return null;
    
    // Check in generated molecules
    const genMolecule = generatedMolecules.find(mol => mol.id === selectedDockingMolecule);
    if (genMolecule) return genMolecule;
    
    // Check in protein drugs
    return proteinDrugs.find(drug => 
      drug.id === selectedDockingMolecule || 
      drug.molecule_id === selectedDockingMolecule || 
      drug.molecule_chembl_id === selectedDockingMolecule
    ) || null;
  };

  // Function to perform molecular docking
  const performDocking = async (): Promise<void> => {
    const protein = getSelectedProtein();
    const molecule = getSelectedMolecule();
    
    if (!protein || !molecule) {
      setDockingError('Please select both a protein and a molecule for docking.');
      return;
    }
    
    // Check if the protein has a valid PDB ID (either directly or from external references)
    const effectivePdbId = protein.pdb_id || proteinPdbMap[protein.id];
    if (!effectivePdbId) {
      setDockingError('The selected protein does not have a PDB ID. Please select a different protein with a valid PDB ID.');
      return;
    }
    
    // Get the SMILES string for the selected molecule
    const smiles = 'smile' in molecule 
      ? molecule.smile
      : molecule.smiles || null;
    
    if (!smiles) {
      setDockingError('Selected molecule does not have a valid SMILES string.');
      return;
    }
    
    setIsDockingLoading(true);
    setDockingError(null);
    setDockingResult(null);
    setDockingVisualization(null);
    setDockingModalOpen(false);
    setIsDockingVisualizationVisible(true);
    
    try {
      // Get protein PDB data using the protein's PDB ID
      const proteinPDB = await fetchProteinPDB(protein);
      
      if (!proteinPDB) {
        throw new Error(`Failed to fetch protein PDB data for ${protein.name} (PDB ID: ${effectivePdbId}).`);
      }
      
      console.log(`Docking request - Protein: ${protein.name} (PDB ID: ${effectivePdbId})`);
      console.log('Docking request - Protein data length:', proteinPDB.length);
      console.log('Docking request - SMILES:', smiles);
      
      // Call docking API - the backend will convert SMILES to SDF
      const result = await dockingApi.dock({
        protein: proteinPDB,
        ligand: smiles,
        ligand_file_type: 'smiles', // Backend will convert this to SDF
        num_poses: 2,
        time_divisions: 20,
        steps: 18,
        save_trajectory: false
      });
      
      console.log('Docking result:', result);
      setDockingResult(result);
      
      // Get visualization HTML
      if (result.ligand_positions && result.ligand_positions.length > 0) {
        try {
          const visualization = await dockingApi.getDockingVisualization({
            protein: proteinPDB,
            ligand_poses: result.ligand_positions,
            confidence_scores: result.position_confidence
          });
          
          setDockingVisualization(visualization.viewer_html);
          // Open modal to show results
          setDockingModalOpen(true);
        } catch (vizError) {
          console.error('Error getting visualization:', vizError);
          setDockingError('Docking completed, but visualization failed to load.');
        }
      }
    } catch (error) {
      console.error('Docking error:', error);
      setDockingError('Error performing molecular docking. Please try again.');
    } finally {
      setIsDockingLoading(false);
    }
  };
  
  // Helper function to fetch protein PDB without processing it
  const fetchProteinPDB = async (protein: Protein): Promise<string> => {
    try {
      // Get the PDB ID - either directly from the protein or from our external references map
      const pdbId = protein.pdb_id || proteinPdbMap[protein.id];
      
      // Validate that we have a PDB ID
      if (!pdbId) {
        // If protein has a UniProt ID but we don't have a PDB ID yet, try fetching it on-demand
        if (protein.uniprot_id && Object.keys(proteinPdbMap).length === 0) {
          console.log(`Attempting to fetch external references for ${protein.uniprot_id} on demand`);
          try {
            const externalRefs = await proteinApi.getProteinExternalLinks(protein.uniprot_id);
            if (externalRefs && externalRefs.PDB) {
              // Update our map with the new PDB ID
              setProteinPdbMap(prev => ({
                ...prev,
                [protein.id]: externalRefs.PDB
              }));
              console.log(`Found PDB ID on demand: ${externalRefs.PDB}`);
              
              // Use this PDB ID
              return fetchProteinPDBById(externalRefs.PDB);
            }
          } catch (error) {
            console.error(`Error fetching external references on demand:`, error);
          }
        }
        
        throw new Error('No PDB ID available for this protein');
      }
      
      return fetchProteinPDBById(pdbId);
    } catch (error) {
      console.error('Error fetching protein PDB:', error);
      throw error;
    }
  };
  
  // Helper function to fetch PDB structure by ID
  const fetchProteinPDBById = async (pdbId: string): Promise<string> => {
    const pdbUrl = `https://files.rcsb.org/download/${pdbId}.pdb`;
    console.log(`Fetching PDB from: ${pdbUrl}`);
    
    const response = await fetch(pdbUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDB for ${pdbId}: ${response.statusText}`);
    }
    
    // Return the raw PDB text without filtering
    return await response.text();
  };

  // Add this function to fetch PDB IDs for proteins with UniProt IDs
  const fetchProteinPdbIds = async (proteins: Protein[]) => {
    const proteinsWithUniprotIds = proteins.filter(p => p.uniprot_id);
    
    if (proteinsWithUniprotIds.length === 0) {
      console.log('No proteins with UniProt IDs found');
      return;
    }
    
    console.log(`Fetching external references for ${proteinsWithUniprotIds.length} proteins`);
    
    // Fetch PDB IDs for each protein with a UniProt ID
    const pdbMap: {[id: string]: string} = {};
    
    await Promise.all(
      proteinsWithUniprotIds.map(async (protein) => {
        try {
          console.log(`Fetching external references for UniProt ID: ${protein.uniprot_id}`);
          const externalRefs = await proteinApi.getProteinExternalLinks(protein.uniprot_id || '');
          
          // Check if there's a PDB ID in the external references
          if (externalRefs && externalRefs.PDB) {
            console.log(`Found PDB ID for ${protein.name}: ${externalRefs.PDB}`);
            pdbMap[protein.id] = externalRefs.PDB;
          }
        } catch (error) {
          console.error(`Error fetching external references for ${protein.uniprot_id}:`, error);
        }
      })
    );
    
    setProteinPdbMap(pdbMap);
  };
  
  // Call this function when proteins are loaded
  useEffect(() => {
    if (proteins.length > 0) {
      fetchProteinPdbIds(proteins);
    }
  }, [proteins]);

  // Add this effect to reset the success message visibility when docking completes
  useEffect(() => {
    if (dockingResult) {
      setShowDockingSuccess(true);
      setIsDockingVisualizationVisible(true);
    }
  }, [dockingResult]);

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
          
          {/* Step 4: Results and Docking */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h5" gutterBottom>
                Results and Docking
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Select one protein and one molecule, then click "Dock" to perform molecular docking and view the results.
              </Typography>
              
              <Grid container spacing={4}>
                {/* Left column: Protein selection */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, mb: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Select Target Protein
                    </Typography>
                    
                    {/* Loading indicator while fetching PDB IDs */}
                    {proteins.filter(p => selectedProteins[p.id]).length > 0 && 
                     Object.keys(proteinPdbMap).length === 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Fetching PDB IDs from UniProt external references...
                        </Typography>
                      </Box>
                    )}
                    
                    <RadioGroup 
                      value={selectedDockingProtein || ''}
                      onChange={(e) => handleDockingProteinSelect(e.target.value)}
                    >
                      {proteins.filter(p => selectedProteins[p.id]).map((protein) => {
                        // Check if we have a PDB ID in our map
                        const hasPdbFromApi = !!proteinPdbMap[protein.id];
                        const pdbId = protein.pdb_id || (hasPdbFromApi ? proteinPdbMap[protein.id] : null);
                        const canBeUsedForDocking = !!pdbId;
                        
                        return (
                          <FormControlLabel
                            key={protein.id}
                            value={protein.id}
                            control={<Radio disabled={!canBeUsedForDocking} />}
                            label={
                              <Box>
                                <Typography variant="body1">
                                  {protein.name || protein.gene_name || protein.id}
                                </Typography>
                                {protein.uniprot_id && (
                                  <Typography variant="body2" color="text.secondary">
                                    UniProt: {protein.uniprot_id}
                                  </Typography>
                                )}
                                {pdbId ? (
                                  <Typography variant="body2" color="text.secondary">
                                    PDB ID: {pdbId} {hasPdbFromApi && "(from UniProt references)"}
                                  </Typography>
                                ) : protein.uniprot_id && Object.keys(proteinPdbMap).length === 0 ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CircularProgress size={14} sx={{ mr: 1 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      Checking for PDB ID...
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="error">
                                    No PDB ID available (cannot be used for docking)
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{
                              p: 1, 
                              my: 1, 
                              border: '1px solid',
                              borderColor: selectedDockingProtein === protein.id ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              width: '100%',
                              bgcolor: selectedDockingProtein === protein.id ? 'action.selected' : 'transparent',
                              opacity: !canBeUsedForDocking ? 0.6 : 1
                            }}
                          />
                        );
                      })}
                    </RadioGroup>
                    
                    {proteins.filter(p => selectedProteins[p.id]).length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No proteins selected. Please go back to the protein selection step.
                      </Alert>
                    )}
                    
                    {proteins.filter(p => selectedProteins[p.id]).length > 0 && 
                     Object.keys(proteinPdbMap).length > 0 &&
                     proteins.filter(p => selectedProteins[p.id] && (p.pdb_id || proteinPdbMap[p.id])).length === 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        None of the selected proteins have a PDB ID available, which is required for docking.
                        Please go back and select proteins with UniProt IDs that have associated PDB structures.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
                
                {/* Right column: Molecule selection */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, mb: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Select Molecule
                    </Typography>
                    
                    {/* Tab for switching between generated molecules and seed molecules */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs value={genTabValue} onChange={handleGenTabChange}>
                        <Tab label="Generated Molecules" {...a11yProps(0)} />
                        <Tab label="Seed Molecules" {...a11yProps(1)} />
                      </Tabs>
                    </Box>
                    
                    {/* Generated molecules tab */}
                    <TabPanel value={genTabValue} index={0}>
                      <RadioGroup 
                        value={selectedDockingMolecule || ''}
                        onChange={(e) => handleDockingMoleculeSelect(e.target.value)}
                      >
                  {generatedMolecules.map((molecule) => (
                          <FormControlLabel
                            key={molecule.id}
                            value={molecule.id}
                            control={<Radio />}
                            label={
                              <Box>
                                <Typography variant="body1">
                                  {molecule.name || `Molecule ${molecule.id}`}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.8rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%'
                                  }}
                                >
                                  {molecule.smile}
                                </Typography>
                              </Box>
                            }
                            sx={{
                              p: 1, 
                              my: 1, 
                              border: '1px solid',
                              borderColor: selectedDockingMolecule === molecule.id ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              width: '100%',
                              bgcolor: selectedDockingMolecule === molecule.id ? 'action.selected' : 'transparent'
                            }}
                          />
                        ))}
                      </RadioGroup>
                      
                      {generatedMolecules.length === 0 && (
                        <Alert severity="info">
                          No generated molecules available. Please go back to generate molecules.
                        </Alert>
                      )}
                    </TabPanel>
                    
                    {/* Seed molecules tab */}
                    <TabPanel value={genTabValue} index={1}>
                      <RadioGroup 
                        value={selectedDockingMolecule || ''}
                        onChange={(e) => handleDockingMoleculeSelect(e.target.value)}
                      >
                        {/* Filter to only show selected molecules from previous stage */}
                        {proteinDrugs
                          .filter(drug => {
                            const drugId = drug.id || drug.molecule_id || drug.molecule_chembl_id || '';
                            return selectedDrugs[drugId];
                          })
                          .map((drug) => {
                            const drugId = drug.id || drug.molecule_id || drug.molecule_chembl_id || '';
                            return (
                              <FormControlLabel
                                key={drugId}
                                value={drugId}
                                control={<Radio />}
                                label={
                                  <Box>
                                    <Typography variant="body1" fontWeight={500}>
                                      {drug.name || 
                                       (drug as any).pref_name || 
                                       (drug.molecule_chembl_id ? `ChEMBL: ${drug.molecule_chembl_id}` : 'Unknown')}
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.8rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%'
                                      }}
                                    >
                                      {drug.smiles || drug.smile || ''}
                                    </Typography>
                                  </Box>
                                }
                                sx={{
                                  p: 1, 
                                  my: 1, 
                                  border: '1px solid',
                                  borderColor: selectedDockingMolecule === drugId ? 'primary.main' : 'divider',
                                  borderRadius: 1,
                                  width: '100%',
                                  bgcolor: selectedDockingMolecule === drugId ? 'action.selected' : 'transparent'
                                }}
                              />
                            );
                          })}
                      </RadioGroup>
                      
                      {proteinDrugs.filter(drug => {
                        const drugId = drug.id || drug.molecule_id || drug.molecule_chembl_id || '';
                        return selectedDrugs[drugId];
                      }).length === 0 && (
                        <Alert severity="info">
                          No molecules were selected in the previous step. Please go back to select seed molecules.
                        </Alert>
                      )}
                    </TabPanel>
                  </Paper>
                  
                  {/* Docking button */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: 3,
                    mb: 5,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={performDocking}
                      disabled={!selectedDockingProtein || !selectedDockingMolecule || isDockingLoading}
                      startIcon={isDockingLoading ? <CircularProgress size={24} color="inherit" /> : null}
                      sx={{ 
                        py: 1.8, 
                        px: 5, 
                        borderRadius: 2,
                        fontSize: '1.05rem',
                        background: dockingResult && !isDockingLoading ? 
                          'linear-gradient(45deg, #6366f1, #8b5cf6)' : undefined,
                        boxShadow: theme.shadows[5],
                        minWidth: '280px'
                      }}
                    >
                      {isDockingLoading ? 'Docking...' : dockingResult ? 'Dock Again' : 'Dock Selected Molecules'}
                    </Button>
                  </Box>
                    </Grid>
              </Grid>
              
              {/* Docking results modal */}
              {dockingResult && (
                <Dialog
                  open={dockingModalOpen}
                  onClose={() => setDockingModalOpen(false)}
                  maxWidth="lg"
                  fullWidth
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      height: '90vh',
                      maxHeight: '90vh'
                    }
                  }}
                >
                  <DialogTitle sx={{ 
                    m: 0, 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                    color: 'white'
                  }}>
                    <Box>
                      <Typography variant="h6" component="div">
                        Docking Results
                      </Typography>
                      {getSelectedProtein() && (
                        <Typography variant="subtitle2" component="div">
                          {getSelectedProtein()?.name} (PDB ID: {getSelectedProtein()?.pdb_id})
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      aria-label="close"
                      onClick={() => setDockingModalOpen(false)}
                      sx={{ color: 'white' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent dividers sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Box sx={{ position: 'relative', width: '100%', borderRadius: 2, overflow: 'hidden' }}>
                          <DockingVisualization
                            viewerHtml={dockingVisualization}
                            isLoading={isDockingLoading}
                            error={dockingError}
                            height="550px"
                            controlsPosition="right"
                            onClose={() => setIsDockingVisualizationVisible(false)}
                          />
                          
                          {/* Confidence score legend */}
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 16, 
                            right: 16, 
                            p: 1.5, 
                            backgroundColor: 'rgba(0,0,0,0.7)', 
                            borderRadius: 1,
                            color: 'white'
                          }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Confidence Scores:</Typography>
                            {dockingResult.position_confidence.map((confidence, index) => (
                              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  mr: 1,
                                  bgcolor: index === 0 ? '#4CAF50' : '#FFC107'
                                }} />
                                <Typography variant="caption">
                                  Pose {index + 1}: {confidence.toFixed(2)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                </Grid>
                      
                      {dockingResult.ligand_positions && dockingResult.ligand_positions.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Docking Poses
                          </Typography>
                          
                          <Grid container spacing={2}>
                            {dockingResult.position_confidence.map((confidence, index) => (
                              <Grid item key={index} xs={12} sm={6} md={4}>
                                <Paper 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: index === 0 ? '#4CAF50' : '#FFC107',
                                    borderLeft: '4px solid',
                                    borderLeftColor: index === 0 ? '#4CAF50' : '#FFC107',
                                  }}
                                >
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    Pose {index + 1}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Confidence Score: {confidence.toFixed(2)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {index === 0 ? 'Best binding pose (highest confidence)' : 'Alternative binding pose'}
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Grid>
                      )}
                    </Grid>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Docking error display outside modal */}
              {dockingError && !dockingModalOpen && (
                <Alert severity="error" sx={{ mt: 4 }}>
                  {dockingError}
                </Alert>
              )}
              
              {/* Success message when docking results are available but modal is closed */}
              {dockingResult && !dockingModalOpen && !dockingError && showDockingSuccess && (
                <Box
                  sx={{
                    position: 'relative',
                    mt: 4,
                    mb: 3,
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'visible',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {/* Background glow effect */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '110%',
                      top: '-5%',
                      left: '0',
                      background: 'linear-gradient(90deg, rgba(20, 24, 33, 0.5), rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.2))',
                      filter: 'blur(15px)',
                      borderRadius: '16px',
                      zIndex: 1,
                      opacity: 1,
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Button glow effect */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '20%',
                      height: '180%',
                      top: '-40%',
                      right: '0',
                      background: 'radial-gradient(circle, rgba(139, 92, 246, 0.6), rgba(99, 102, 241, 0.2), transparent 70%)',
                      filter: 'blur(20px)',
                      zIndex: 2,
                      opacity: 0.8,
                      pointerEvents: 'none'
                    }}
                  />
                  
                  <Alert 
                    severity="success" 
                    sx={{ 
                      p: 2.5,
                      py: 3,
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      borderRadius: 2,
                      backgroundColor: 'rgba(18, 25, 33, 0.9)', // Dark background with high opacity
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(46, 125, 50, 0.4)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                      pr: 6 // Add padding to the right for the close button
                    }}
                    icon={<Box component="span" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: '#66bb6a',
                      '& svg': { fontSize: 30 },
                      mr: 2
                    }}><CheckCircleIcon /></Box>}
                    action={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button 
                          color="success" 
                          variant="contained"
                          size="medium"
                          onClick={() => {
                            setDockingModalOpen(true);
                            setIsDockingVisualizationVisible(true);
                          }}
                          sx={{ 
                            borderRadius: 28,
                            py: 1.2,
                            px: 3.5,
                            ml: 2,
                            background: 'linear-gradient(45deg, #2e7d32, #66bb6a)',
                            boxShadow: '0 2px 8px rgba(46, 125, 50, 0.5), 0 0 20px rgba(46, 125, 50, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #1b5e20, #4caf50)',
                              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.6), 0 0 25px rgba(46, 125, 50, 0.4)',
                            },
                            zIndex: 3,
                            position: 'relative'
                          }}
                        >
                          View Results
                        </Button>
                        <IconButton
                          aria-label="close"
                          color="inherit"
                          size="small"
                          onClick={() => setShowDockingSuccess(false)}
                          sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'rgba(255, 255, 255, 0.7)',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '50%',
                            width: 30,
                            height: 30,
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.4)',
                              color: 'rgba(255, 255, 255, 1)',
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#66bb6a', fontSize: '1.1rem', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                      Docking completed successfully!
                    </Typography>
                  </Alert>
                </Box>
              )}
              
              {/* Add a "Show Visualization" button when the visualization is hidden, right after the DockingVisualization component */}
              {!isDockingVisualizationVisible && dockingVisualization && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '550px', 
                  border: '2px dashed rgba(0, 0, 0, 0.1)', 
                  borderRadius: 2 
                }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<OpenInFullIcon />}
                    onClick={() => setIsDockingVisualizationVisible(true)}
                    sx={{ py: 1.5, px: 3 }}
                  >
                    Show Docking Visualization
                  </Button>
                </Box>
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