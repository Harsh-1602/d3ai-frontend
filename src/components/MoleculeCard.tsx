import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { moleculeApi } from '../utils/api';

interface DrugMolecule {
  id?: string;
  molecule_id?: string;
  chembl_id?: string;
  name?: string;
  smiles: string;
  molecular_formula?: string;
  molecular_weight?: number;
  inchi_key?: string;
  properties?: Record<string, any>;
  target_id?: string;
  target_name?: string;
  activity_value?: number;
  activity_type?: string;
  _metadata?: Record<string, any>;
}

interface MoleculeCardProps {
  molecule: DrugMolecule;
  loading?: boolean;
}

const ExpandButton = styled(IconButton)(({ theme }) => ({
  transform: 'rotate(0deg)',
  transition: 'transform 0.2s',
  '&.expanded': {
    transform: 'rotate(180deg)',
  },
}));

const MoleculeCard: React.FC<MoleculeCardProps> = ({
  molecule,
  loading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    
    // Load the image when expanding for the first time
    if (!expanded && !image && !imageError) {
      fetchMoleculeImage();
    }
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Function to fetch and display a 2D visualization of the molecule
  const fetchMoleculeImage = async () => {
    if (!molecule?.smiles) {
      setImageError(true);
      setImageLoading(false);
      return;
    }
    
    try {
      setImageLoading(true);
      
      const data = await moleculeApi.visualize2D(molecule.smiles);
      
      if (data && data.image) {
        setImage(`data:image/png;base64,${data.image}`);
      } else {
        throw new Error('Invalid image data received');
      }
    } catch (error) {
      console.error('Error fetching molecule visualization:', error);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };
  
  // Load the image when the component mounts
  useEffect(() => {
    // Only pre-load images if they have short SMILES strings
    // (complex molecules can slow down the page if loaded all at once)
    if (molecule?.smiles && molecule.smiles.length < 100) {
      fetchMoleculeImage();
    }
  }, []);

  // Format property values for display
  const formatPropertyValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      // Handle different number ranges
      if (Math.abs(value) < 0.01 || Math.abs(value) > 10000) {
        return value.toExponential(2);
      }
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Format property name for display
  const formatPropertyName = (name: string): string => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <Card 
      sx={{ 
        background: 'rgba(23, 25, 35, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transform: 'translateY(-4px)',
          borderColor: 'rgba(129, 140, 248, 0.5)',
        },
      }}
    >
      {loading && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '3px',
            background: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(45deg, #818cf8, #e879f9)',
            }
          }} 
        />
      )}

      <CardContent sx={{ flex: '1 0 auto', pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              color: 'white',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <ScienceIcon sx={{ color: '#818cf8' }} />
            {molecule.name || 'Unknown Compound'}
          </Typography>
        </Box>
        
        {/* Molecule image preview */}
        <Box 
          sx={{ 
            height: 120, 
            width: '100%', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            mb: 2,
            overflow: 'hidden'
          }}
        >
          {imageLoading ? (
            <LinearProgress 
              sx={{ 
                width: '80%',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                }
              }} 
            />
          ) : imageError ? (
            <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">
              Structure unavailable
            </Typography>
          ) : image ? (
            <img 
              src={image} 
              alt={molecule.name || 'Molecule structure'} 
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          ) : (
            <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">
              Click for visualization
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {molecule.chembl_id && (
            <Tooltip title="ChEMBL ID">
              <Chip 
                label={molecule.chembl_id} 
                size="small" 
                sx={{ 
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                }} 
              />
            </Tooltip>
          )}
          
          {molecule.molecular_weight && (
            <Tooltip title="Molecular Weight">
              <Chip 
                label={`MW: ${formatPropertyValue(molecule.molecular_weight)}`} 
                size="small"
                sx={{ 
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                }} 
              />
            </Tooltip>
          )}
          
          {molecule.activity_type && molecule.activity_value && (
            <Tooltip title={`${molecule.activity_type} Activity Value`}>
              <Chip 
                label={`${molecule.activity_type}: ${formatPropertyValue(molecule.activity_value)}`} 
                size="small"
                sx={{ 
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                }} 
              />
            </Tooltip>
          )}
        </Box>
        
        <Typography 
          variant="body2" 
          color="rgba(255, 255, 255, 0.7)"
          sx={{ mb: 1 }}
        >
          <Tooltip title={molecule.smiles}>
            <span>SMILES: {truncateText(molecule.smiles, 30)}</span>
          </Tooltip>
        </Typography>
        
        {molecule.molecular_formula && (
          <Typography 
            variant="body2" 
            color="rgba(255, 255, 255, 0.7)"
            sx={{ mb: 1 }}
          >
            Formula: {molecule.molecular_formula}
          </Typography>
        )}
        
        {molecule.target_name && (
          <Typography 
            variant="body2" 
            color="rgba(255, 255, 255, 0.7)"
            sx={{ mb: 1 }}
          >
            Target: {molecule.target_name}
          </Typography>
        )}
      </CardContent>
      
      <CardActions disableSpacing sx={{ justifyContent: 'space-between', mt: 'auto' }}>
        <Tooltip title="View Details">
          <ExpandButton
            onClick={handleExpandClick}
            className={expanded ? 'expanded' : ''}
            aria-expanded={expanded}
            aria-label="show more"
            size="small"
            sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <ExpandMoreIcon />
          </ExpandButton>
        </Tooltip>
      </CardActions>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography variant="subtitle2" color="#818cf8" sx={{ mb: 1 }}>
            Molecule Properties
          </Typography>
          
          <Paper 
            elevation={0}
            sx={{ 
              p: 1, 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '4px',
              maxHeight: '150px',
              overflowY: 'auto',
              mb: 2
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5 }}>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  ChEMBL ID:
                </Typography>
                <Typography variant="body2" color="white">
                  {molecule.chembl_id || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5 }}>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Molecular Weight:
                </Typography>
                <Typography variant="body2" color="white">
                  {formatPropertyValue(molecule.molecular_weight)}
                </Typography>
              </Box>
              {molecule.properties && Object.entries(molecule.properties).map(([key, value]) => (
                <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 0.5 }}>
                  <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                    {formatPropertyName(key)}:
                  </Typography>
                  <Typography variant="body2" color="white">
                    {formatPropertyValue(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
              ID: {molecule.id || molecule.molecule_id || molecule.chembl_id || 'N/A'}
            </Typography>
            {molecule.inchi_key && (
              <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                InChI Key: {molecule.inchi_key}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default MoleculeCard; 