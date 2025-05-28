import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, ButtonGroup, CircularProgress } from '@mui/material';
import { SettingsSuggestOutlined as SettingsIcon, ViewInAr as ViewIcon } from '@mui/icons-material';

interface ProteinVisualizationProps {
  pdbId: string;
}

const ProteinVisualization: React.FC<ProteinVisualizationProps> = ({ pdbId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState("RCSB Direct");
  const [loadRetries, setLoadRetries] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Loading protein structure...");
  
  // Function to load the structure in the iframe
  const loadStructure = (sourceIndex = 0) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    setIsLoading(true);
    setError(null);
    
    const message = {
      type: 'loadStructure',
      pdbId,
      sourceIndex
    };
    
    iframeRef.current.contentWindow.postMessage(message, '*');
    console.log(`Sent loadStructure message with PDB ID: ${pdbId} and source index: ${sourceIndex}`);
  };
  
  // Function to change the data source
  const changeDataSource = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    setLoadRetries(prev => prev + 1);
    setIsLoading(true);
    setError(null);
    iframeRef.current.contentWindow.postMessage({ type: 'changeDataSource' }, '*');
  };
  
  // Function to change the visualization style
  const changeStyle = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    iframeRef.current.contentWindow.postMessage({ type: 'changeStyle' }, '*');
  };

  useEffect(() => {
    // Setup message listener
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'viewerReady') {
          console.log('NGL Viewer is ready');
          setIsIframeLoaded(true);
          // Load with RCSB Direct by default (index 0 in our updated list)
          loadStructure(0);
        } 
        else if (event.data.type === 'error') {
          setError(event.data.message);
          setIsLoading(false);
        }
        else if (event.data.type === 'loadingComplete') {
          setIsLoading(false);
          setError(null);
        }
        else if (event.data.type === 'loadingStarted') {
          setIsLoading(true);
          setError(null);
          // Update loading message if provided
          if (event.data.message) {
            setLoadingMessage(event.data.message);
          }
        }
        else if (event.data.type === 'sourceChanged' && event.data.sourceName) {
          setDataSource(event.data.sourceName);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Try to load the structure if iframe is already ready
    if (isIframeLoaded) {
      loadStructure(0); // Use RCSB Direct (index 0)
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [pdbId, isIframeLoaded]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px', bgcolor: '#141824' }}>
      {/* Controls for the visualization */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 100,
          display: 'flex',
          gap: 1
        }}
      >
        <ButtonGroup variant="contained" size="small">
          <Button
            onClick={changeDataSource}
            startIcon={<SettingsIcon />}
            disabled={isLoading}
            sx={{
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #4f46e5, #7c3aed)',
              },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(99, 102, 241, 0.3)',
              }
            }}
          >
            Change Source
          </Button>
          <Button
            onClick={changeStyle}
            startIcon={<ViewIcon />}
            disabled={isLoading}
            sx={{
              background: 'linear-gradient(45deg, #8b5cf6, #d946ef)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #7c3aed, #c026d3)',
              },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(139, 92, 246, 0.3)',
              }
            }}
          >
            Change Style
          </Button>
        </ButtonGroup>
      </Box>

      {/* Loading overlay */}
      {isLoading && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(20, 24, 36, 0.7)',
            zIndex: 90
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#e879f9' }} />
            <Typography variant="body1" color="white" sx={{ mt: 2 }}>
              {loadingMessage}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
              PDB ID: {pdbId} • Source: {dataSource}
            </Typography>
            {loadRetries > 0 && (
              <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mt: 0.5, display: 'block' }}>
                Retry attempt: {loadRetries}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Embed the HTML viewer in an iframe */}
      <iframe
        ref={iframeRef}
        src="/ngl-viewer.html"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          border: 'none',
          borderRadius: '8px',
          backgroundColor: '#141824'
        }}
        title="Protein Structure Viewer"
        onLoad={() => {
          console.log('iframe loaded');
        }}
      />
      
      {error && !isLoading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 10, 
            left: '50%', 
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(244, 67, 54, 0.9)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '0.875rem',
            maxWidth: '80%',
            textAlign: 'center',
            zIndex: 100
          }}
        >
          <Typography variant="body2">{error}</Typography>
          <Button 
            size="small" 
            onClick={changeDataSource}
            sx={{ 
              color: 'white', 
              mt: 1, 
              border: '1px solid white',
              fontSize: '0.75rem'
            }}
          >
            Try Another Data Source
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProteinVisualization; 