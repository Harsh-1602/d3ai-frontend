import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { Molecule } from '../utils/api';

export interface MoleculeGenerationRequest {
  seed_smiles: string[];
  count: number;
  diversity_factor: number;
  similarity_threshold: number;
}

export class MoleculeService {
  async generateMolecules(request: MoleculeGenerationRequest): Promise<Molecule[]> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/molecules/generate`, 
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error generating molecules:', error);
      throw error;
    }
  }

  async generateMoleculesForDisease(
    diseaseName: string,
    count: number = 10,
    diversityFactor: number = 0.7,
    similarityThreshold: number = 0.6
  ): Promise<Molecule[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/molecules/generate/disease/${diseaseName}`, 
        { 
          params: { 
            count, 
            diversity_factor: diversityFactor, 
            similarity_threshold: similarityThreshold 
          } 
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating molecules for disease:', error);
      throw error;
    }
  }

  async validateMolecule(smile: string): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/molecules/validate`, 
        { smile }
      );
      return response.data;
    } catch (error) {
      console.error('Error validating molecule:', error);
      throw error;
    }
  }

  async getMoleculeById(id: string): Promise<Molecule> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/molecules/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching molecule:', error);
      throw error;
    }
  }

  async generateMoleculesWithNvidiaGenMol(data: {
    smiles: string;
    num_molecules?: number;
    temperature?: string;
    noise?: string;
    step_size?: number;
    scoring?: string;
    unique?: boolean;
  }): Promise<Molecule[]> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/molecules/generate/nvidia-genmol`, 
        {
          smiles: data.smiles,
          num_molecules: data.num_molecules || 30,
          temperature: data.temperature || "1",
          noise: data.noise || "1",
          step_size: data.step_size || 1,
          scoring: data.scoring || "QED",
          unique: data.unique || false
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating molecules with NVIDIA GenMol API:', error);
      throw error;
    }
  }
}

export default new MoleculeService(); 