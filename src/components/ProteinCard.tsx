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
  ThreeDRotation as ThreeDRotationIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { proteinApi } from '../utils/api';
import ProteinVisualization from './ProteinVisualization';

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
  const [visualizationDialogOpen, setVisualizationDialogOpen] = useState(false);
  const [externalLinks, setExternalLinks] = useState<Record<string, string> | null>(null);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [pdbIdForVisualization, setPdbIdForVisualization] = useState<string | null>(null);
  const [loadingVisualization, setLoadingVisualization] = useState(false);

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

  const handleVisualizeProtein = async () => {
    // If we already have a PDB ID, use it directly
    if (protein.pdb_id) {
      setPdbIdForVisualization(protein.pdb_id);
      setVisualizationDialogOpen(true);
      return;
    }
    
    // Otherwise, try to get PDB ID from external links if we have a UniProt ID
    if (protein.uniprot_id) {
      try {
        setLoadingVisualization(true);
        console.log(`Fetching PDB ID for UniProt ID: ${protein.uniprot_id}`);
        
        const links = await proteinApi.getProteinExternalLinks(protein.uniprot_id);
        console.log('External links for visualization:', links);
        
        // Check for PDB ID in the links
        if (links && links['PDB']) {
          console.log(`Found PDB ID: ${links['PDB']}`);
          setPdbIdForVisualization(links['PDB']);
          setVisualizationDialogOpen(true);
        } else {
          console.error('No PDB ID found in external links');
          alert('No PDB structure available for this protein');
        }
      } catch (error) {
        console.error('Error fetching PDB ID:', error);
        alert('Failed to fetch protein structure data');
      } finally {
        setLoadingVisualization(false);
      }
    }
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Determine if visualization is possible for this protein
  const canVisualize = protein.pdb_id || protein.uniprot_id;

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
      {(loadingChemblId || loadingVisualization) && (
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
                aria-label="external references" 
                size="small" 
                onClick={handleViewExternalLinks}
                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {canVisualize && (
            <Tooltip title="Visualize Protein Structure">
              <IconButton 
                aria-label="visualize protein structure" 
                size="small" 
                onClick={handleVisualizeProtein}
                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                disabled={loadingVisualization}
              >
                <ThreeDRotationIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {canVisualize && (
          <Button
            variant="contained"
            size="small"
            startIcon={<ThreeDRotationIcon />}
            onClick={handleVisualizeProtein}
            disabled={loadingVisualization}
            sx={{
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '0.75rem',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #4f46e5, #7c3aed)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              },
              '&.Mui-disabled': {
                opacity: 0.6,
                background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                color: 'rgba(255, 255, 255, 0.7)',
              }
            }}
          >
            {loadingVisualization ? 'Loading...' : 'Visualize'}
          </Button>
        )}
      </CardActions>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {protein.sequence && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Amino Acid Sequence:
              </Typography>
              <Box
                sx={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: 2,
                  borderRadius: '4px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                {protein.sequence}
              </Box>
            </Box>
          )}
          
          {protein.binding_site && Object.keys(protein.binding_site).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                Binding Site Information:
              </Typography>
              <Box
                sx={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: 2,
                  borderRadius: '4px',
                }}
              >
                {protein.binding_site.residues && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                      Key Residues:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {protein.binding_site.residues.map((residue: string, index: number) => (
                        <Chip
                          key={index}
                          label={residue}
                          size="small"
                          sx={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.7rem',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Collapse>

      {/* External Links Dialog */}
      <Dialog
        open={linksDialogOpen}
        onClose={() => setLinksDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(23, 25, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          External References for {protein.name}
        </DialogTitle>
        <DialogContent>
          {loadingLinks && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress size={40} />
            </Box>
          )}

          {linksError && (
            <Alert severity="error" sx={{ my: 2 }}>
              {linksError}
            </Alert>
          )}

          {!loadingLinks && !linksError && externalLinks && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries(externalLinks).map(([database, id]) => (
                <Grid item xs={12} sm={6} key={database}>
                  <Box
                    sx={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      padding: 2,
                      height: '100%',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: 'white' }}>
                      {database}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#e879f9',
                        wordBreak: 'break-all',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
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
                        } else {
                          url = `https://www.ebi.ac.uk/ena/browser/view/${id}`;
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

              {Object.keys(externalLinks).length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', my: 3 }}>
                    No external references found.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinksDialogOpen(false)} sx={{ color: 'white' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Protein Visualization Dialog */}
      <Dialog
        open={visualizationDialogOpen}
        onClose={() => {
          setVisualizationDialogOpen(false);
          setPdbIdForVisualization(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(23, 25, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            height: '90vh',
            maxHeight: '900px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 24px'
        }}>
          <Typography variant="h6">
            3D Structure of {protein.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            PDB ID: {pdbIdForVisualization || protein.pdb_id}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ 
          height: 'calc(100% - 130px)', 
          padding: 0,
          overflow: 'hidden' 
        }}>
          {pdbIdForVisualization && (
            <Box sx={{ height: '100%', width: '100%' }}>
              <ProteinVisualization pdbId={pdbIdForVisualization} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '16px 24px'
        }}>
          <Button 
            onClick={() => {
              setVisualizationDialogOpen(false);
              setPdbIdForVisualization(null);
            }} 
            sx={{ color: 'white' }}
          >
            Close
          </Button>
          {pdbIdForVisualization && (
            <Button 
              variant="contained" 
              component="a" 
              href={`https://www.rcsb.org/3d-view/${pdbIdForVisualization}/1`}
              target="_blank"
              rel="noopener"
              sx={{
                background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #4f46e5, #7c3aed)',
                }
              }}
            >
              View on RCSB PDB
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ProteinCard; 