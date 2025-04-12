import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from '../common/Modal';
import { useRollContext } from '../../context/RollContext';
import { useNavigate } from 'react-router-dom';

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-primary);
  color: var(--text-primary);
  
  &:focus {
    border-color: var(--accent-color);
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-primary);
  color: var(--text-primary);
  
  &:focus {
    border-color: var(--accent-color);
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-primary);
  color: var(--text-primary);
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    border-color: var(--accent-color);
    outline: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  
  &:hover:not(:disabled) {
    background-color: var(--background-tertiary);
  }
`;

const PrimaryButton = styled(Button)`
  background-color: var(--accent-color);
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
`;

const InlineButton = styled.button`
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 5px;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const FlexContainer = styled.div`
  display: flex;
  gap: 15px;
  
  & > * {
    flex: 1;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  margin-top: 5px;
  font-size: 14px;
`;

const ImportRollModal = ({ onClose }) => {
  const { state, addRoll, addFilmStock } = useRollContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddFilmStock, setShowAddFilmStock] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    folderPath: '',
    filmStock: '',
    camera: '',
    lens: '',
    iso: '',
    dateTaken: '',
    tags: '',
    notes: '',
  });
  
  // New film stock state
  const [newFilmStock, setNewFilmStock] = useState({
    name: '',
    isColor: true,
    iso: ''
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNewFilmStockChange = (e) => {
    const { name, value } = e.target;
    setNewFilmStock(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectFolder = async () => {
    try {
      const selectedPath = await window.electron.selectDirectory();
      if (selectedPath) {
        // Extract folder name to use as default roll name
        const folderName = selectedPath.split('/').pop();
        setFormData(prev => ({ 
          ...prev, 
          folderPath: selectedPath,
          name: prev.name || folderName // Only update name if it's empty
        }));
      }
    } catch (error) {
      setError('Error selecting folder: ' + error.message);
    }
  };
  
  const handleAddFilmStock = async () => {
    if (!newFilmStock.name) {
      setError('Film stock name is required');
      return;
    }
    
    try {
      const filmStock = await addFilmStock(
        newFilmStock.name, 
        newFilmStock.isColor, 
        parseInt(newFilmStock.iso) || 0
      );
      
      if (filmStock) {
        setFormData(prev => ({ ...prev, filmStock: filmStock.id }));
        setShowAddFilmStock(false);
        setNewFilmStock({ name: '', isColor: true, iso: '' });
      }
    } catch (error) {
      setError('Error adding film stock: ' + error.message);
    }
  };
  
  const handleSubmit = async () => {
    if (!formData.folderPath) {
      setError('Please select a folder');
      return;
    }
    
    if (!formData.name) {
      setError('Roll name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Read the folder to get image files
      const images = await window.electron.readDirectory(formData.folderPath);
      
      if (images.length === 0) {
        setError('No supported image files found in the selected folder');
        setLoading(false);
        return;
      }
      
      // Generate a thumbnail from the first image
      let thumbnailPath = '';
      try {
        console.log('Generating thumbnail for roll...');
        thumbnailPath = await window.electron.generateThumbnail(
          images[0].path, // Use the first image for the thumbnail
          300 // Size in pixels
        );
        console.log('Thumbnail generated:', thumbnailPath);
      } catch (thumbnailError) {
        console.error('Error generating thumbnail:', thumbnailError);
        // Continue without a thumbnail - we'll use a fallback icon
      }
      
      // Prepare tags array from comma-separated string
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      // Add the roll
      const rollData = {
        name: formData.name,
        path: formData.folderPath,
        filmStock: formData.filmStock,
        camera: formData.camera,
        lens: formData.lens,
        iso: formData.iso ? parseInt(formData.iso) : null,
        dateTaken: formData.dateTaken,
        notes: formData.notes,
        tags: tagsArray,
        thumbnailPath,
        imageCount: images.length
      };
      
      const newRoll = await addRoll(rollData);
      setLoading(false);
      
      if (newRoll) {
        onClose();
        navigate(`/roll/${newRoll.id}`);
      }
    } catch (error) {
      console.error('Error importing roll:', error);
      setError(`Error importing roll: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Render modal footer with action buttons
  const renderFooter = () => (
    <ButtonGroup>
      <CancelButton onClick={onClose}>Cancel</CancelButton>
      <PrimaryButton onClick={handleSubmit} disabled={loading}>
        {loading ? 'Importing...' : 'Import Roll'}
      </PrimaryButton>
    </ButtonGroup>
  );
  
  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title="Import New Roll" 
      footer={renderFooter()}
    >
      <FormGroup>
        <Label>Folder</Label>
        <FlexContainer>
          <Input 
            type="text" 
            name="folderPath" 
            value={formData.folderPath} 
            readOnly 
            placeholder="Select a folder containing images" 
          />
          <Button onClick={handleSelectFolder}>Browse</Button>
        </FlexContainer>
      </FormGroup>
      
      <FormGroup>
        <Label>Roll Name</Label>
        <Input 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleInputChange} 
          placeholder="Enter a name for this roll" 
        />
      </FormGroup>
      
      {showAddFilmStock ? (
        <FormGroup>
          <Label>New Film Stock</Label>
          <Input 
            type="text" 
            name="name" 
            value={newFilmStock.name} 
            onChange={handleNewFilmStockChange} 
            placeholder="Film stock name" 
          />
          <FlexContainer style={{ marginTop: '10px' }}>
            <FormGroup>
              <Label>Type</Label>
              <Select 
                name="isColor" 
                value={newFilmStock.isColor.toString()} 
                onChange={(e) => setNewFilmStock(prev => ({ 
                  ...prev, 
                  isColor: e.target.value === 'true' 
                }))}
              >
                <option value="true">Color</option>
                <option value="false">Black & White</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>ISO</Label>
              <Input 
                type="number" 
                name="iso" 
                value={newFilmStock.iso} 
                onChange={handleNewFilmStockChange} 
                placeholder="Film ISO" 
              />
            </FormGroup>
          </FlexContainer>
          <ButtonGroup style={{ marginTop: '10px' }}>
            <CancelButton onClick={() => setShowAddFilmStock(false)}>Cancel</CancelButton>
            <PrimaryButton onClick={handleAddFilmStock}>Add Film Stock</PrimaryButton>
          </ButtonGroup>
        </FormGroup>
      ) : (
        <FormGroup>
          <Label>Film Stock</Label>
          <FlexContainer>
            <Select 
              name="filmStock" 
              value={formData.filmStock} 
              onChange={handleInputChange}
            >
              <option value="">Select film stock</option>
              {state.filmStocks.map(stock => (
                <option key={stock.id} value={stock.id}>
                  {stock.name} {stock.iso && `(ISO ${stock.iso})`}
                </option>
              ))}
            </Select>
            <InlineButton onClick={() => setShowAddFilmStock(true)}>
              + Add New Film Stock
            </InlineButton>
          </FlexContainer>
        </FormGroup>
      )}
      
      <FlexContainer>
        <FormGroup>
          <Label>Camera (optional)</Label>
          <Input 
            type="text" 
            name="camera" 
            value={formData.camera} 
            onChange={handleInputChange} 
            placeholder="Camera model" 
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Lens (optional)</Label>
          <Input 
            type="text" 
            name="lens" 
            value={formData.lens} 
            onChange={handleInputChange} 
            placeholder="Lens model" 
          />
        </FormGroup>
      </FlexContainer>
      
      <FlexContainer>
        <FormGroup>
          <Label>ISO (optional)</Label>
          <Input 
            type="number" 
            name="iso" 
            value={formData.iso} 
            onChange={handleInputChange} 
            placeholder="Film ISO" 
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Date Taken (optional)</Label>
          <Input 
            type="date" 
            name="dateTaken" 
            value={formData.dateTaken} 
            onChange={handleInputChange} 
          />
        </FormGroup>
      </FlexContainer>
      
      <FormGroup>
        <Label>Tags (optional, comma-separated)</Label>
        <Input 
          type="text" 
          name="tags" 
          value={formData.tags} 
          onChange={handleInputChange} 
          placeholder="travel, street, nature" 
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Notes (optional)</Label>
        <TextArea 
          name="notes" 
          value={formData.notes} 
          onChange={handleInputChange} 
          placeholder="Add any notes about this roll" 
        />
      </FormGroup>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Modal>
  );
};

export default ImportRollModal; 