import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  IconButton,
  CardActions,
  CircularProgress,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { Molecule, fetchMoleculeImage } from '../../utils/api';

interface MoleculeCardProps {
  molecule: Molecule;
  onSave?: (molecule: Molecule) => void;
}

const MoleculeCard: React.FC<MoleculeCardProps> = ({ molecule, onSave }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<boolean>(false);
  
  // Helper function to ensure proper base64 image format
  const formatBase64Image = (base64Data: string): string => {
    // If it already starts with data:image/, return as is
    if (base64Data.startsWith('data:image/')) {
      return base64Data;
    }
    // Otherwise add the prefix
    return `data:image/png;base64,${base64Data}`;
  };
  
  // Debug molecule data on every render
  console.log('MoleculeCard rendering with molecule:', {
    id: molecule?.id,
    smile: molecule?.smile,
    hasStructureImg: !!molecule?.structure_img,
    hasPropertiesImage: !!molecule?.properties?.image,
    hasVisualizationData: !!molecule?.visualization_data?.image
  });
  
  // Load molecule image when component mounts
  useEffect(() => {
    // Early exit if no molecule data
    if (!molecule) {
      console.error('No molecule data provided to MoleculeCard');
      setError(true);
      setLoading(false);
      return;
    }
    
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        // First check if we have direct structure_img
        if (molecule.structure_img) {
          console.log('Using structure_img directly');
          setImageUrl(formatBase64Image(molecule.structure_img));
          setLoading(false);
          return;
        }
        
        // Then check for properties.image
        if (molecule.properties?.image) {
          console.log('Using properties.image');
          setImageUrl(formatBase64Image(molecule.properties.image));
          setLoading(false);
          return;
        }
        
        // Then check visualization_data
        if (molecule.visualization_data?.image) {
          console.log('Using visualization_data.image');
          setImageUrl(formatBase64Image(molecule.visualization_data.image));
          setLoading(false);
          return;
        }
        
        // Only if no images are found and we have a smile, try to fetch
        if (molecule.smile) {
          console.log('No embedded images found, fetching from API with smile:', molecule.smile);
          try {
            // Extra validation to ensure smile is not empty or whitespace
            if (!molecule.smile.trim()) {
              console.error('Smile string is empty or whitespace, skipping API call');
              setError(true);
              return;
            }
            
            console.log('Making API call with smile:', molecule.smile);
            const url = await fetchMoleculeImage(molecule.smile);
            
            if (!url) {
              console.error('API returned null or empty URL');
              setError(true);
              return;
            }
            
            console.log('Successfully fetched image URL:', url);
            setImageUrl(url);
          } catch (fetchErr) {
            console.error('Error fetching molecule image:', fetchErr);
            setError(true);
          }
        } else {
          console.error('No image data or smile available');
          setError(true);
        }
      } catch (err) {
        console.error('Error in molecule image loading process:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadImage();
  }, [molecule]);
  
  // Function to render the molecule visualization
  const renderMoleculeVisualization = () => {
    if (loading) {
      return (
        <Box 
          sx={{ 
            height: 200, 
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 1,
            mb: 2
          }}
        >
          <CircularProgress size={40} />
        </Box>
      );
    }
    
    if (imageUrl) {
      // Fix for duplicated data:image/png;base64 prefix
      let fixedImageUrl = imageUrl;
      if (imageUrl.startsWith('data:image/png;base64,data:image/png;base64,')) {
        // Remove the duplicated prefix
        fixedImageUrl = imageUrl.replace('data:image/png;base64,data:image/png;base64,', 'data:image/png;base64,');
      }
      
      return (
        <Box 
          sx={{ 
            height: 200, 
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2
          }}
        >
          <img 
            src={fixedImageUrl}
            alt={`Structure of ${molecule.name || 'molecule'}`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={(e) => {
              console.error("Failed to load molecule image:", imageUrl);
              e.currentTarget.src = "/placeholder-molecule.png"; // Fallback image
              setError(true);
            }}
          />
        </Box>
      );
    }
    
    // Fallback if no visualization data
    return (
      <Box 
        sx={{ 
          height: 200, 
          bgcolor: 'grey.100',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 1,
          mb: 2
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {error ? "Failed to load structure" : "No visualization available"}
        </Typography>
      </Box>
    );
  };
  
  // Function to format a property value based on its type
  const formatPropertyValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value?.toString() || 'N/A';
  };
  
  // Get key properties to display - filter out image to avoid huge JSON in UI
  const keyProperties = [
    { name: 'QED', value: molecule.properties?.QED || molecule.properties?.qed },
    { name: 'LogP', value: molecule.properties?.logP || molecule.properties?.logp },
    { name: 'MW', value: molecule.properties?.molecular_weight },
    { name: 'Similarity', value: molecule.similarity_to_parent }
  ].filter(prop => prop.value !== undefined);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={molecule.name || `Molecule ${molecule.id?.substring(0, 8) || 'Unknown'}`}
        subheader={molecule.created_at ? `Generated on ${new Date(molecule.created_at).toLocaleDateString()}` : 'Recently generated'}
        titleTypographyProps={{ variant: 'subtitle1', noWrap: true }}
        sx={{ pb: 0 }}
      />
      
      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
        {renderMoleculeVisualization()}
        
        <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
          {molecule.smile}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {keyProperties.map((prop) => (
            <Chip 
              key={prop.name}
              label={`${prop.name}: ${formatPropertyValue(prop.value)}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
        
        {molecule.description && (
          <Typography variant="body2" color="text.secondary">
            {molecule.description}
          </Typography>
        )}
      </CardContent>
      
      <CardActions>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton aria-label="add to favorites" size="small">
          <FavoriteIcon fontSize="small" />
        </IconButton>
        <IconButton aria-label="share" size="small">
          <ShareIcon fontSize="small" />
        </IconButton>
        <IconButton 
          aria-label="save" 
          size="small" 
          onClick={() => onSave && onSave(molecule)}
        >
          <SaveIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default MoleculeCard; 