import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Checkbox,
  FormControlLabel,
  Box,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Biotech as BiotechIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { proteinApi } from '../utils/api';

export interface Protein {
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

export interface ProteinCardProps {
  protein: Protein;
  isSelected: boolean;
  onSelectChange: (protein: Protein, isSelected: boolean) => void;
  loadingChemblId?: boolean;
}

const ExpandButton = styled(IconButton)(({ theme }) => ({
  transform: 'rotate(0deg)',
  transition: 'transform 0.2s',
  '&.expanded': {
    transform: 'rotate(180deg)',
  },
}));

const ProteinCard: React.FC<ProteinCardProps> = ({
  protein,
  isSelected,
  onSelectChange,
  loadingChemblId = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const [externalLinks, setExternalLinks] = useState<Record<string, string> | null>(null);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelectChange(protein, event.target.checked);
  };

  const handleViewExternalLinks = async () => {
    if (!protein.uniprot_id) return;
    
    console.log(`Getting external links for UniProt ID: ${protein.uniprot_id}`);
    setLinksDialogOpen(true);
    setLoadingLinks(true);
    setLinksError(null);
    
    try {
      console.log(`Calling API: proteins/external-links/${protein.uniprot_id}`);
      const links = await proteinApi.getProteinExternalLinks(protein.uniprot_id);
      console.log('External links API response:', links);
      
      if (links && Object.keys(links).length > 0) {
        console.log(`Found ${Object.keys(links).length} external references`);
        if ('ChEMBL' in links) {
          console.log(`ChEMBL ID: ${links['ChEMBL']}`);
        } else {
          console.log('No ChEMBL ID found in the response');
        }
      } else {
        console.log('External links API returned empty response');
      }
      
      setExternalLinks(links);
    } catch (error: any) {
      console.error('Error fetching external links:', error);
      setLinksError(error.message || 'Failed to fetch external links');
      setExternalLinks(null);
    } finally {
      setLoadingLinks(false);
    }
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card 
      sx={{ 
        background: 'rgba(23, 25, 35, 0.8)',
        backdropFilter: 'blur(8px)',
        border: isSelected ? '1px solid #e879f9' : '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transform: 'translateY(-4px)',
          borderColor: 'rgba(232, 121, 249, 0.5)',
        },
      }}
    >
      {loadingChemblId && (
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

      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
            <BiotechIcon sx={{ color: '#e879f9' }} />
            {protein.name}
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox 
                checked={isSelected}
                onChange={handleCheckboxChange}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&.Mui-checked': {
                    color: '#e879f9',
                  },
                }}
              />
            }
            label=""
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {protein.uniprot_id && (
            <Tooltip title="UniProt ID">
              <Chip 
                label={`UniProt: ${protein.uniprot_id}`} 
                size="small" 
                sx={{ 
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                }} 
              />
            </Tooltip>
          )}
          
          {protein.pdb_id && (
            <Tooltip title="PDB ID">
              <Chip 
                label={`PDB: ${protein.pdb_id}`} 
                size="small"
                sx={{ 
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px',
                }} 
              />
            </Tooltip>
          )}
          
          {protein.disease_name && (
            <Tooltip title="Associated Disease">
              <Chip 
                label={protein.disease_name} 
                size="small"
                sx={{ 
                  background: 'rgba(232, 121, 249, 0.2)',
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
          {truncateText(protein.description, 120) || 'No description available.'}
        </Typography>
      </CardContent>
      
      <CardActions disableSpacing sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          
          {protein.uniprot_id && (
            <Tooltip title="View External References">
              <IconButton
                onClick={handleViewExternalLinks}
                size="small"
                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {protein.binding_site && (
          <Tooltip title="Has binding site information">
            <InfoIcon fontSize="small" sx={{ color: '#10b981' }} />
          </Tooltip>
        )}
      </CardActions>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {protein.sequence && (
            <>
              <Typography variant="subtitle2" color="#e879f9">Protein Sequence:</Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  my: 1, 
                  p: 1, 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap'
                }}
              >
                {protein.sequence.length > 100 
                  ? `${protein.sequence.substring(0, 100)}...` 
                  : protein.sequence}
              </Typography>
            </>
          )}
          
          {protein.binding_site && (
            <>
              <Typography variant="subtitle2" color="#e879f9" sx={{ mt: 2 }}>Binding Site Information:</Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                {JSON.stringify(protein.binding_site, null, 2)}
              </Typography>
            </>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
              ID: {protein.id}
            </Typography>
            {protein.created_at && (
              <Typography variant="caption" color="rgba(255, 255, 255, 0.5)">
                Added: {new Date(protein.created_at).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Collapse>
      
      {/* External Links Dialog */}
      <Dialog 
        open={linksDialogOpen} 
        onClose={() => setLinksDialogOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            background: 'rgba(23, 25, 35, 0.95)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#e879f9' }}>
          External References for {protein.name}
        </DialogTitle>
        <DialogContent>
          {loadingLinks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={40} sx={{ color: '#e879f9' }} />
            </Box>
          ) : linksError ? (
            <Alert severity="error" sx={{ mb: 2, background: 'rgba(239, 68, 68, 0.2)', color: 'white' }}>
              {linksError}
            </Alert>
          ) : externalLinks ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries(externalLinks).map(([database, id]) => (
                <Grid item xs={12} sm={6} key={database}>
                  <Box sx={{ 
                    p: 2, 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {database}:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#818cf8',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' } 
                      }}
                      onClick={() => {
                        let url = '';
                        // Add URLs for common databases
                        if (database === 'ChEMBL') {
                          url = `https://www.ebi.ac.uk/chembl/target_report_card/${id}/`;
                        } else if (database === 'PDB') {
                          url = `https://www.rcsb.org/structure/${id}`;
                        } else if (database === 'UniProt') {
                          url = `https://www.uniprot.org/uniprotkb/${id}/entry`;
                        } else if (database === 'Pfam') {
                          url = `https://www.ebi.ac.uk/interpro/entry/pfam/${id}/`;
                        } else if (database === 'GO') {
                          url = `http://amigo.geneontology.org/amigo/term/${id}`;
                        }
                        
                        if (url) {
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      {id}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
              No external references found for this protein.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setLinksDialogOpen(false)}
            sx={{ 
              color: 'white',
              '&:hover': { background: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ProteinCard; 