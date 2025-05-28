import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Paper, Alert } from '@mui/material';
import * as NGL from 'ngl';

interface DockingVisualizationProps {
  viewerHtml?: string | null;
  isLoading?: boolean;
  error?: string | null;
  width?: string | number;
  height?: string | number;
}

const DockingVisualization: React.FC<DockingVisualizationProps> = ({
  viewerHtml,
  isLoading = false,
  error = null,
  width = '100%',
  height = '600px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  // Function to create a sandbox iframe with the viewer HTML
  const createVisualizationIframe = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.onload = () => setIframeLoaded(true);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    
    // Create a blob from the HTML and set as the iframe source
    const blob = new Blob([html], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
    
    return iframe;
  };

  // Use effect to handle the iframe creation/update
  useEffect(() => {
    if (!containerRef.current || !viewerHtml) return;
    
    // Clear any existing content
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Set loading state
    setIframeLoaded(false);
    
    // Create and add the iframe
    const iframe = createVisualizationIframe(viewerHtml);
    containerRef.current.appendChild(iframe);
    
    // Cleanup function
    return () => {
      if (iframe.src) {
        URL.revokeObjectURL(iframe.src);
      }
    };
  }, [viewerHtml]);

  return (
    <Paper
      elevation={3}
      sx={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="subtitle1" sx={{ mt: 2, color: 'white' }}>
            Loading docking visualization...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ width: '80%', m: 3 }}>
          {error}
        </Alert>
      )}

      {(!viewerHtml && !isLoading && !error) && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No docking visualization available. Please perform docking first.
          </Typography>
        </Box>
      )}

      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          visibility: iframeLoaded && !isLoading ? 'visible' : 'hidden' 
        }}
      />
    </Paper>
  );
};

export default DockingVisualization; 