import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  IconButton,
  Stack,
} from '@mui/material';
import {
  LinkedIn,
  Twitter,
  Email,
  GitHub,
} from '@mui/icons-material';

const teamMembers = [
  {
    name: 'Harsh Gupta',
    role: 'AI Engineer',
    expertise: 'Full Stack & AI Development',
    image: '/images/team/harsh-gupta.jpeg',
    bio: 'Expert in AI/ML and drug discovery technologies with a focus on developing innovative solutions.',
    social: {
      linkedin: 'https://www.linkedin.com/in/harsh-gupta-462866205/',
      twitter: '#',
      email: 'guptaharsh0216@gmail.com',
      github: 'https://github.com/Harsh-1602',
    },
  },
  {
    name: 'Chanchal Kuntal',
    role: 'Full Stack Developer',
    expertise: 'Full Stack & AI Development',
    image: '/images/team/chanchal-kuntal.png',
    bio: 'Specialized in Developing Full stack Application and AI-driven drug discovery processes.',
    social: {
      linkedin: 'https://www.linkedin.com/in/chanchal-kuntal-6b5506251/',
      twitter: '#',
      email: 'chanchalkuntal398@gmail.com',
      github: 'https://github.com/Chanchal-D',
    },
  },
];

const Team = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(45deg, #818cf8, #e879f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Our Team
        </Typography>
        <Typography 
          variant="h5" 
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6,
            fontSize: { xs: '1rem', md: '1.2rem' }
          }}
        >
          Meet the experts behind D3AI's innovative drug discovery platform
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        {teamMembers.map((member, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(17, 24, 39, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                pt: 4,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(99, 102, 241, 0.2)',
                },
              }}
            >
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid',
                  borderImage: 'linear-gradient(45deg, #818cf8, #e879f9) 1',
                  mb: 2,
                }}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #818cf8, #e879f9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  {member.name}
                </Typography>
                <Typography
                  gutterBottom
                  variant="subtitle1"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {member.role}
                </Typography>
                <Typography
                  gutterBottom
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 1,
                  }}
                >
                  {member.expertise}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 2,
                    lineHeight: 1.6,
                  }}
                >
                  {member.bio}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  sx={{ mt: 2 }}
                >
                  <IconButton
                    href={member.social.linkedin}
                    target="_blank"
                    size="medium"
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        color: '#e879f9',
                      },
                    }}
                  >
                    <LinkedIn />
                  </IconButton>
                  <IconButton
                    href={member.social.github}
                    target="_blank"
                    size="medium"
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        color: '#e879f9',
                      },
                    }}
                  >
                    <GitHub />
                  </IconButton>
                  <IconButton
                    href={`mailto:${member.social.email}`}
                    size="medium"
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        color: '#e879f9',
                      },
                    }}
                  >
                    <Email />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Team; 