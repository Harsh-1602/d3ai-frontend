import React from 'react';
import { Box } from '@mui/material';

const DiseaseChat = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        // Hide the navbar for this page
        '& ~ header': {
          display: 'none',
        },
      }}
    >
      <iframe
        src="https://voice-assistant-ivory.vercel.app/"
        title="Disease Diagnosis Assistant"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="microphone"
      />
    </Box>
  );
};

export default DiseaseChat; 