import React, { useState } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { debounce } from 'lodash';
import { diseaseApi } from '../utils/api';

export interface DiseaseSuggestion {
  id: string;
  name: string;
  aliases?: string[];
}

export interface DiseaseSearchProps {
  onDiseaseSelect: (disease: DiseaseSuggestion) => void;
  label?: string;
  placeholder?: string;
}

const DiseaseSearch: React.FC<DiseaseSearchProps> = ({
  onDiseaseSelect,
  label = 'Search Disease',
  placeholder = 'Enter disease name...',
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<DiseaseSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounced fetch function to avoid too many API calls
  const fetchSuggestions = React.useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setOptions([]);
        setLoading(false);
        return;
      }
      
      setError(null);
      setLoading(true);
      
      try {
        console.log(`Fetching disease suggestions for query: "${query}"`);
        const suggestions = await diseaseApi.suggestDiseases(query);
        console.log('Disease suggestions:', suggestions);
        setOptions(suggestions || []);
      } catch (error) {
        console.error('Error fetching disease suggestions:', error);
        setError('Failed to fetch disease suggestions. Please try again.');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );
  
  return (
    <>
      <Autocomplete
        id="disease-search"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={(_, value) => value && onDiseaseSelect(value)}
        onInputChange={(_, value) => {
          setInputValue(value);
          fetchSuggestions(value);
        }}
        options={options}
        getOptionLabel={(option) => option.name}
        loading={loading}
        filterOptions={(x) => x} // Disable client-side filtering
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </>
  );
}

export default DiseaseSearch; 