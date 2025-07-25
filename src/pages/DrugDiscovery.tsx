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
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  AppBar,
  Toolbar,
  useMediaQuery,
  Badge
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
import MenuIcon from '@mui/icons-material/Menu';
import HistoryIcon from '@mui/icons-material/History';
import ScienceIcon from '@mui/icons-material/Science';
import MedicationIcon from '@mui/icons-material/Medication';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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

// Define a history session interface
interface HistorySession {
  id: string;
  timestamp: Date;
  name: string; // Session name (e.g. "Alzheimer's Research Session")
  disease: DiseaseSuggestion | null;
  selectedProteins: Protein[];
  generatedMolecules: Molecule[];
  selectedDrugs: DrugMolecule[];
  dockingResult?: any;
  dockingVisualization?: string | null;
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
  
  // Replace history state with sessions state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [currentSessionName, setCurrentSessionName] = useState<string>('');
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null);
  const [saveSessionDialogOpen, setSaveSessionDialogOpen] = useState(false);
  
  // Add current session ID to track ongoing work
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const theme = useTheme();
  // Check if screen is mobile-sized
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Load saved sidebar state and sessions from localStorage on component mount
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('drugDiscoverySidebarOpen');
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === 'true');
    } else {
      // Default to open on desktop, closed on mobile
      setSidebarOpen(!isMobile);
    }

    const savedSessions = localStorage.getItem('drugDiscoverySessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        // Convert string timestamp back to Date objects
        const sessionsWithDates = parsedSessions.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp)
        }));
        setSessions(sessionsWithDates);
      } catch (e) {
        console.error('Error parsing saved sessions:', e);
      }
    }
  }, [isMobile]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('drugDiscoverySidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Save sessions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('drugDiscoverySessions', JSON.stringify(sessions));
  }, [sessions]);

  // Create or update the current working session whenever relevant state changes
  useEffect(() => {
    // Only start tracking once a disease is selected
    if (selectedDisease) {
      updateOrCreateWorkingSession();
    }
  }, [selectedDisease, selectedProteins, generatedMolecules, proteinDrugs, selectedDrugs, dockingResult]);

  // Function to create or update the current working session
  const updateOrCreateWorkingSession = () => {
    if (!selectedDisease) return;

    const selectedProteinsList = proteins.filter(protein => selectedProteins[protein.id]);
    const selectedDrugsList = proteinDrugs.filter(drug => {
      const drugId = drug.id || drug.molecule_id || drug.molecule_chembl_id || '';
      return selectedDrugs[drugId];
    });

    const sessionName = currentSessionName || `${selectedDisease.name} Session`;
    
    // Create new session data
    const sessionData: HistorySession = {
      id: currentSessionId || Date.now().toString(),
      timestamp: new Date(),
      name: sessionName,
      disease: selectedDisease,
      selectedProteins: selectedProteinsList,
      generatedMolecules,
      selectedDrugs: selectedDrugsList,
      dockingResult,
      dockingVisualization
    };

    // If we don't have a current session ID, this is a new session
    if (!currentSessionId) {
      setCurrentSessionId(sessionData.id);
      setSessions(prev => [sessionData, ...prev]);
    } else {
      // Otherwise update the existing session
      setSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId ? sessionData : session
        )
      );
    }
  };

  // Function to save current session with a specific name
  const saveCurrentSession = (name: string) => {
    if (!name.trim() || !selectedDisease) return;
    
    // Update session name
    setCurrentSessionName(name);
    
    // Force update with new name
    setTimeout(() => updateOrCreateWorkingSession(), 0);
    
    setSaveSessionDialogOpen(false);
  };

  // Function to restore state from a session
  const restoreFromSession = (session: HistorySession) => {
    if (!session || !session.disease) return;
    
    setSelectedDisease(session.disease);
    
    // Restore proteins and selected proteins
    if (session.disease && session.selectedProteins) {
      setProteins(session.selectedProteins);
      
      // Reconstruct selectedProteins state object
      const proteinSelections: {[id: string]: boolean} = {};
      session.selectedProteins.forEach(protein => {
        proteinSelections[protein.id] = true;
      });
      setSelectedProteins(proteinSelections);
    }
    
    // Restore generated molecules
    if (session.generatedMolecules && session.generatedMolecules.length > 0) {
      setGeneratedMolecules(session.generatedMolecules);
    }
    
    // Restore drug molecules and selection state
    if (session.selectedDrugs) {
      setProteinDrugs(session.selectedDrugs);
      
      // Reconstruct selectedDrugs state object
      const drugSelections: {[id: string]: boolean} = {};
      session.selectedDrugs.forEach(drug => {
        const drugId = drug.id || drug.molecule_id || drug.molecule_chembl_id || '';
        drugSelections[drugId] = true;
      });
      setSelectedDrugs(drugSelections);
    }
    
    // Restore docking results if available
    if (session.dockingResult) {
      setDockingResult(session.dockingResult);
    }
    
    if (session.dockingVisualization) {
      setDockingVisualization(session.dockingVisualization);
    }
    
    // Set to the final step to show the complete workflow results
    setActiveStep(3);
    
    // Close dialogs
    setSidebarOpen(false);
    setSessionDetailsOpen(false);
    setSelectedSession(null);
  };

  // Function to delete a session
  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const handleNext = () => {
    // If moving from disease selection to protein selection, make sure we have a session
    if (activeStep === 0 && selectedDisease) {
      updateOrCreateWorkingSession();
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    // If we have a session in progress, prompt to save it
    if (selectedDisease) {
      setSaveSessionDialogOpen(true);
    } else {
      resetWorkflow();
    }
  };

  const resetWorkflow = () => {
    // Clear all state to start fresh
    setActiveStep(0);
    setSelectedDisease(null);
    setProteins([]);
    setSelectedProteins({});
    setGeneratedMolecules([]);
    setProteinDrugs([]);
    setSelectedDrugs({});
    setDockingResult(null);
    setDockingVisualization(null);
    
    // Important: Clear the current session ID and name to ensure a new session will be created
    setCurrentSessionName('');
    setCurrentSessionId(null);
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
      
      // Set a default session name and create an initial session
      setCurrentSessionName(`${disease.name} Research`);
      
      // We'll create the session in the effect when selectedDisease changes
      
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
          
          // Make sure session is updated with docking results
          updateOrCreateWorkingSession();
          
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

  // Format date for display in history list
  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get disease step completion status
  const getDiseaseStepCompletion = (session: HistorySession): boolean => {
    return !!session.disease;
  };

  // Get protein step completion status
  const getProteinStepCompletion = (session: HistorySession): boolean => {
    return session.selectedProteins && session.selectedProteins.length > 0;
  };

  // Get molecule step completion status
  const getMoleculeStepCompletion = (session: HistorySession): boolean => {
    return (session.generatedMolecules && session.generatedMolecules.length > 0) || 
           (session.selectedDrugs && session.selectedDrugs.length > 0);
  };

  // Get docking step completion status
  const getDockingStepCompletion = (session: HistorySession): boolean => {
    return !!session.dockingResult;
  };

  // Function to save current session explicitly with a name and prepare for a new session
  const saveSessionAndReset = (name: string) => {
    if (!name.trim() || !selectedDisease) {
      resetWorkflow();
      return;
    }
    
    // Save current session with the provided name
    const sessionToSave = {
      id: currentSessionId || Date.now().toString(),
      timestamp: new Date(),
      name: name,
      disease: selectedDisease,
      selectedProteins: proteins.filter(protein => selectedProteins[protein.id]),
      generatedMolecules,
      selectedDrugs: proteinDrugs.filter(drug => {
        const drugId = drug.id || drug.molecule_id || drug.molecule_chembl_id || '';
        return selectedDrugs[drugId];
      }),
      dockingResult,
      dockingVisualization
    };
    
    // Add as a new session or update the current one
    if (!currentSessionId) {
      setSessions(prev => [sessionToSave, ...prev]);
    } else {
      setSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId ? sessionToSave : session
        )
      );
    }
    
    // Reset for a new workflow
    resetWorkflow();
    setSaveSessionDialogOpen(false);
  };

  // Calculate the width for the main content based on sidebar state
  const getMainContentWidth = () => {
    // If sidebar is closed or on mobile, use full width
    if (!sidebarOpen || isMobile) {
      return '100%';
    }
    // If sidebar is open on desktop, adjust width
    return 'calc(100% - 280px)';
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}
    >
      {/* Persistent sidebar replacing the drawer */}
      <Box
        sx={{
          width: sidebarOpen ? 280 : 0,
          flexShrink: 0,
          height: '100%',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          bgcolor: 'background.paper',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'absolute' : 'relative',
          zIndex: 1200,
        }}
      >
        {/* Sidebar header with close button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Sessions</Typography>
            {currentSessionId && (
              <Badge 
                color="success" 
                variant="dot" 
                sx={{ ml: 1 }}
                title="Current active session"
              />
            )}
          </Box>
          <IconButton onClick={() => setSidebarOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        
        {/* Sidebar content */}
        <Box
          sx={{
            overflow: 'auto',
            flexGrow: 1,
            p: 1,
          }}
        >
          {sessions.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No saved sessions yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete the workflow and save to create a session
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {sessions.map((session) => (
                <ListItem
                  key={session.id}
                  disablePadding
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    onClick={() => {
                      setSelectedSession(session);
                      setSessionDetailsOpen(true);
                    }}
                    selected={session.id === currentSessionId}
                    sx={{
                      borderLeft: session.id === currentSessionId ? 
                        `3px solid ${theme.palette.primary.main}` : 'none',
                      bgcolor: session.id === currentSessionId ? 
                        'rgba(99, 102, 241, 0.08)' : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      {session.id === currentSessionId ? 
                        <Badge color="success" variant="dot"><ScienceIcon /></Badge> : 
                        <ScienceIcon />
                      }
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography 
                          variant="body1" 
                          noWrap
                          sx={{ 
                            fontWeight: session.id === currentSessionId ? 600 : 400,
                            maxWidth: '160px'
                          }}
                        >
                          {session.name}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" noWrap>
                            {session.disease?.name}
                          </Typography>
                          <br />
                          {formatDate(session.timestamp)}
                        </React.Fragment>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        
        {/* Add session actions at bottom */}
        <Box sx={{ 
          p: 1, 
          borderTop: '1px solid rgba(0, 0, 0, 0.12)', 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center' 
        }}>
          <Button 
            size="small"
            startIcon={<RestoreIcon />}
            disabled={sessions.length === 0}
            onClick={() => {
              // Find the most recent session that isn't the current one
              const recentSession = sessions.find(s => s.id !== currentSessionId);
              if (recentSession) {
                setSelectedSession(recentSession);
                setSessionDetailsOpen(true);
              }
            }}
          >
            Latest Session
          </Button>
          {currentSessionId && (
            <Button 
              size="small" 
              color="primary" 
              variant="outlined" 
              onClick={() => setSaveSessionDialogOpen(true)}
            >
              Save
            </Button>
          )}
        </Box>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          width: getMainContentWidth(),
          height: '100%',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Collapsible sidebar toggle button */}
        {!sidebarOpen && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setSidebarOpen(true)}
            sx={{
              position: 'fixed',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: '32px',
              width: '32px',
              height: '100px',
              borderRadius: '0 4px 4px 0',
              zIndex: 1100,
              p: 0,
              boxShadow: 3
            }}
            aria-label="Open session history"
          >
            <ChevronRightIcon />
          </Button>
        )}
    
        {/* App content */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
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
      </Box>
      
      {/* Session Details Dialog */}
      <Dialog
        open={sessionDetailsOpen}
        onClose={() => setSessionDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSession && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              color: 'white'
            }}>
              <Box>
                <Typography variant="h6">{selectedSession.name}</Typography>
                <Typography variant="subtitle2">
                  {formatDate(selectedSession.timestamp)}
                </Typography>
              </Box>
              <IconButton
                aria-label="close"
                onClick={() => setSessionDetailsOpen(false)}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Disease Section */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CoronavirusIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Disease Selection
                      </Typography>
                      {getDiseaseStepCompletion(selectedSession) && (
                        <Chip 
                          label="Completed" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    {selectedSession.disease ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {selectedSession.disease.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {selectedSession.disease.id}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No disease selected
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                {/* Proteins Section */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Selected Proteins
                      </Typography>
                      {getProteinStepCompletion(selectedSession) && (
                        <Chip 
                          label="Completed" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    {selectedSession.selectedProteins && selectedSession.selectedProteins.length > 0 ? (
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {selectedSession.selectedProteins.map(protein => (
                          <Grid item xs={12} sm={6} md={4} key={protein.id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {protein.name || protein.gene_name || protein.id}
                                </Typography>
                                {protein.uniprot_id && (
                                  <Typography variant="body2" color="text.secondary">
                                    UniProt: {protein.uniprot_id}
                                  </Typography>
                                )}
                                {protein.pdb_id && (
                                  <Typography variant="body2" color="text.secondary">
                                    PDB ID: {protein.pdb_id}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No proteins selected
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                {/* Molecules Section */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MedicationIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Molecule Analysis
                      </Typography>
                      {getMoleculeStepCompletion(selectedSession) && (
                        <Chip 
                          label="Completed" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    
                    {/* Generated molecules */}
                    {selectedSession.generatedMolecules && selectedSession.generatedMolecules.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Generated Molecules ({selectedSession.generatedMolecules.length})
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {selectedSession.generatedMolecules.slice(0, 3).map(molecule => (
                            <Grid item xs={12} sm={4} key={molecule.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="subtitle2">
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
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {molecule.smile}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                          {selectedSession.generatedMolecules.length > 3 && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary" align="center">
                                +{selectedSession.generatedMolecules.length - 3} more molecules
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                    
                    {/* Selected drug molecules */}
                    {selectedSession.selectedDrugs && selectedSession.selectedDrugs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Selected Drug Molecules ({selectedSession.selectedDrugs.length})
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {selectedSession.selectedDrugs.slice(0, 3).map(drug => (
                            <Grid item xs={12} sm={4} key={drug.id || drug.molecule_id || drug.molecule_chembl_id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="subtitle2">
                                    {drug.name || drug.molecule_id || drug.chembl_id || 'Unknown'}
                                  </Typography>
                                  {(drug.smiles || drug.smile) && (
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.8rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {drug.smiles || drug.smile}
                                    </Typography>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                          {selectedSession.selectedDrugs.length > 3 && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary" align="center">
                                +{selectedSession.selectedDrugs.length - 3} more drugs
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                    
                    {!getMoleculeStepCompletion(selectedSession) && (
                      <Typography variant="body2" color="text.secondary">
                        No molecules generated or selected
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                {/* Docking Results Section */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Docking Results
                      </Typography>
                      {getDockingStepCompletion(selectedSession) && (
                        <Chip 
                          label="Completed" 
                          color="success" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    
                    {selectedSession.dockingResult ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle1">
                          Docking completed successfully
                        </Typography>
                        {selectedSession.dockingResult.position_confidence && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Docking poses found: {selectedSession.dockingResult.ligand_positions?.length || 0}
                            </Typography>
                            <Typography variant="body2">
                              Best confidence score: {
                                Math.max(...(selectedSession.dockingResult.position_confidence || [0])).toFixed(2)
                              }
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No docking results available
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Button 
                onClick={() => setSessionDetailsOpen(false)} 
                sx={{ mr: 1 }}
              >
                Close
              </Button>
              <Button 
                variant="contained" 
                startIcon={<RestoreIcon />}
                onClick={() => restoreFromSession(selectedSession)}
              >
                Restore Session
              </Button>
            </Box>
          </>
        )}
      </Dialog>
      
      {/* Save Session Dialog */}
      <Dialog
        open={saveSessionDialogOpen}
        onClose={() => setSaveSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save Current Session</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Would you like to save your current research session before starting over?
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Session Name
            </Typography>
            <input
              type="text"
              value={currentSessionName}
              onChange={(e) => setCurrentSessionName(e.target.value)}
              placeholder={`${selectedDisease?.name || 'Drug Discovery'} Session`}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '8px',
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.23)',
                fontSize: '16px'
              }}
            />
          </FormControl>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button 
            onClick={() => {
              setSaveSessionDialogOpen(false);
              resetWorkflow();
            }} 
            sx={{ mr: 1 }}
          >
            Don't Save
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              // Use disease name as default if no name provided
              const sessionName = currentSessionName || `${selectedDisease?.name || 'Drug Discovery'} Session`;
              saveSessionAndReset(sessionName);
            }}
            disabled={!selectedDisease}
          >
            Save Session
          </Button>
        </Box>
      </Dialog>
    </motion.div>
  );
};

export default DrugDiscovery; 