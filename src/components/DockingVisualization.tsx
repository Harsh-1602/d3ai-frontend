import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Paper, Alert, IconButton, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as NGL from 'ngl';

interface DockingVisualizationProps {
  viewerHtml?: string | null;
  isLoading?: boolean;
  error?: string | null;
  width?: string | number;
  height?: string | number;
  controlsPosition?: 'left' | 'right';
  onClose?: () => void;
}

const DockingVisualization: React.FC<DockingVisualizationProps> = ({
  viewerHtml,
  isLoading = false,
  error = null,
  width = '100%',
  height = '600px',
  controlsPosition = 'left',
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Function to create a sandbox iframe with the viewer HTML
  const createVisualizationIframe = (html: string) => {
    // Modify HTML to adjust controls position if needed
    let modifiedHtml = html;
    if (controlsPosition === 'right') {
      modifiedHtml = html.replace(
        '#controls { position: absolute; top: 10px; left: 10px;',
        '#controls { position: absolute; top: 10px; right: 10px; left: auto;'
      );
    }
    
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.onload = () => setIframeLoaded(true);
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    
    // Create a blob from the HTML and set as the iframe source
    const blob = new Blob([modifiedHtml], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
    
    return iframe;
  };

  // Use effect to handle the iframe creation/update
  useEffect(() => {
    if (!containerRef.current || !viewerHtml || !isVisible) return;
    
    // Don't recreate iframe when just collapsing/expanding
    if (containerRef.current.firstChild && isCollapsed) return;
    
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
  }, [viewerHtml, controlsPosition, isVisible, isCollapsed]);

  const handleClose = () => {
    setIsVisible(false);
    // Call the onClose callback if provided
    if (onClose) {
      onClose();
    }
  };
  
  const handleExpand = () => {
    setIsVisible(true);
  };
  
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!isVisible) {
    return (
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 1000 
        }}
      >
        <IconButton
          onClick={handleExpand}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            boxShadow: 3
          }}
          size="large"
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width,
        height: isCollapsed ? '40px' : height,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'flex-start' : 'center',
        bgcolor: 'background.paper',
        transition: 'height 0.3s ease',
      }}
    >
      {/* Header with title and control buttons */}
      <Box 
        sx={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          px: 2,
          py: 0.5,
          zIndex: 2
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          DiffDock Results
        </Typography>
        <Box>
          <IconButton 
            size="small" 
            onClick={handleToggleCollapse} 
            sx={{ color: 'white', mr: 1 }}
          >
            <ExpandMoreIcon 
              sx={{ 
                transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }} 
            />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={handleClose} 
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Loading spinner */}
      {isLoading && !isCollapsed && (
        <Box
          sx={{
            position: 'absolute',
            top: 40, // Below the header
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 90
          }}
        >
          <CircularProgress />
          <Typography variant="subtitle1" sx={{ mt: 2, color: 'white' }}>
            Loading docking visualization...
          </Typography>
        </Box>
      )}

      {/* Error message */}
      {error && !isCollapsed && (
        <Alert severity="error" sx={{ width: '80%', m: 3 }}>
          {error}
        </Alert>
      )}

      {/* Empty state message */}
      {(!viewerHtml && !isLoading && !error && !isCollapsed) && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No docking visualization available. Please perform docking first.
          </Typography>
        </Box>
      )}

      {/* Actual visualization container */}
      <Fade in={!isCollapsed} timeout={300}>
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%', 
            height: isCollapsed ? '0' : 'calc(100% - 40px)', // Collapse to zero height
            border: 'none',
            borderRadius: '0 0 8px 8px',
            visibility: iframeLoaded && !isLoading && !isCollapsed ? 'visible' : 'hidden',
            overflow: 'hidden', // Prevent content from showing when collapsed
            transition: 'height 0.3s ease'
          }}
        />
      </Fade>
    </Paper>
  );
};

export default DockingVisualization; 