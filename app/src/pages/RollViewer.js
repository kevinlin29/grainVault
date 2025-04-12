import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRollContext } from '../context/RollContext';
import ImageViewer from '../components/viewer/ImageViewer';
import { motion, AnimatePresence } from 'framer-motion';

const RollViewerContainer = styled.div`
  display: flex;
  height: 100%;
  gap: 20px;
`;

const ViewerColumn = styled.div`
  flex: 1;
  min-width: 0; /* Fix for flex child overflow */
`;

const SidebarColumn = styled.div`
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  background-color: var(--background-primary);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
`;

const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 5px 0;
  color: var(--text-primary);
`;

const SidebarContent = styled.div`
  padding: 15px;
  overflow-y: auto;
  flex: 1;
`;

const MetadataSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin: 0 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border-color);
`;

const MetadataItem = styled.div`
  margin-bottom: 10px;
`;

const MetadataLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-bottom: 2px;
`;

const MetadataValue = styled.div`
  font-size: 0.9rem;
  color: var(--text-primary);
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
`;

const Tag = styled.span`
  font-size: 0.8rem;
  background-color: var(--background-secondary);
  color: var(--text-secondary);
  padding: 3px 10px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
`;

const NotesSection = styled.div`
  white-space: pre-wrap;
  margin-top: 10px;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.4;
`;

const ActionsContainer = styled.div`
  padding: 15px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const PrimaryButton = styled(ActionButton)`
  background-color: var(--accent-color);
  color: white;
  border: none;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

const SecondaryButton = styled(ActionButton)`
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  
  &:hover {
    background-color: var(--background-secondary);
  }
`;

const DangerButton = styled(ActionButton)`
  background-color: transparent;
  color: var(--error-color);
  border: 1px solid var(--error-color);
  
  &:hover {
    background-color: rgba(229, 57, 53, 0.1);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2rem;
  color: var(--text-secondary);
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  text-align: center;
`;

const ErrorTitle = styled.h2`
  color: var(--error-color);
  margin-bottom: 10px;
`;

const ErrorMessage = styled.p`
  color: var(--text-secondary);
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FormLabel = styled.label`
  font-size: 0.8rem;
  color: var(--text-tertiary);
`;

const FormInput = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--background-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const FormTextarea = styled.textarea`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--background-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const RollViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, setCurrentRoll, deleteRoll, updateRoll } = useRollContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const isInitialLoad = useRef(true);
  const currentRollId = useRef(id);
  
  // Fetch roll data when the component mounts or the ID changes
  useEffect(() => {
    if (id !== currentRollId.current) {
      // Only update loading state on ID change, not on first mount/render
      setLoading(true);
      currentRollId.current = id;
    }
    
    let isMounted = true;
    
    const fetchRoll = async () => {
      try {
        if (!isInitialLoad.current) {
          // Don't show loading spinner for quick navigation between rolls
          setLoading(true);
        }
        
        setError(null);
        
        // If we already have this roll in the state, don't fetch it again
        if (state.currentRoll && state.currentRoll.id === id) {
          console.log('Roll already loaded, skipping fetch');
          // Just fetch images and tags
          const [rollImages, rollTags] = await Promise.all([
            window.electron.getImagesByRollId(id),
            window.electron.getRollTags(id)
          ]);
          
          if (!isMounted) return;
          
          setImages(rollImages);
          setTags(rollTags);
          setLoading(false);
          isInitialLoad.current = false;
          return;
        }
        
        // Fetch the roll data
        const roll = await setCurrentRoll(id);
        
        if (!isMounted) return;
        
        if (!roll) {
          throw new Error('Roll not found');
        }
        
        // Fetch images and tags concurrently for better performance
        const [rollImages, rollTags] = await Promise.all([
          window.electron.getImagesByRollId(id),
          window.electron.getRollTags(id)
        ]);
        
        if (!isMounted) return;
        
        // Batch state updates to reduce re-renders
        setImages(rollImages);
        setTags(rollTags);
        setLoading(false);
        isInitialLoad.current = false;
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error fetching roll:', error);
        setError(error.message || 'Failed to load roll');
        setLoading(false);
        isInitialLoad.current = false;
      }
    };
    
    // Add a small delay to avoid immediate loading state for quick navigations
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchRoll();
      }
    }, 50);
    
    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
    };
  }, [id, setCurrentRoll, state.currentRoll]);
  
  // Initialize edit form data when roll data changes
  useEffect(() => {
    if (state.currentRoll) {
      setEditFormData({
        name: state.currentRoll.name || '',
        film_stock: state.currentRoll.film_stock || '',
        camera: state.currentRoll.camera || '',
        lens: state.currentRoll.lens || '',
        iso: state.currentRoll.iso || '',
        date_taken: state.currentRoll.date_taken || '',
        notes: state.currentRoll.notes || ''
      });
    }
  }, [state.currentRoll]);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this roll? This cannot be undone.')) {
      try {
        const success = await deleteRoll(id);
        
        if (success) {
          navigate('/');
        } else {
          setError('Failed to delete roll');
        }
      } catch (error) {
        console.error('Error deleting roll:', error);
        setError('Error deleting roll: ' + error.message);
      }
    }
  };
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const success = await updateRoll(id, editFormData);
      
      if (success) {
        setIsEditing(false);
        await setCurrentRoll(id); // Refresh roll data
      } else {
        setError('Failed to update roll');
      }
    } catch (error) {
      console.error('Error updating roll:', error);
      setError('Error updating roll: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    // Reset form data to current roll data
    if (state.currentRoll) {
      setEditFormData({
        name: state.currentRoll.name || '',
        film_stock: state.currentRoll.film_stock || '',
        camera: state.currentRoll.camera || '',
        lens: state.currentRoll.lens || '',
        iso: state.currentRoll.iso || '',
        date_taken: state.currentRoll.date_taken || '',
        notes: state.currentRoll.notes || ''
      });
    }
    setIsEditing(false);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <LoadingContainer>
        <div>Loading roll...</div>
      </LoadingContainer>
    );
  }
  
  if (error || !state.currentRoll) {
    return (
      <ErrorContainer>
        <ErrorTitle>Error</ErrorTitle>
        <ErrorMessage>{error || 'Roll not found'}</ErrorMessage>
        <BackButton onClick={() => navigate('/')}>Back to Dashboard</BackButton>
      </ErrorContainer>
    );
  }
  
  const { currentRoll } = state;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ height: '100%' }}
      >
        <RollViewerContainer>
          <ViewerColumn>
            <ImageViewer images={images} />
          </ViewerColumn>
          
          <SidebarColumn>
            <SidebarHeader>
              <SidebarTitle>Roll Details</SidebarTitle>
            </SidebarHeader>
            
            <SidebarContent>
              {!isEditing ? (
                // Read-only view
                <>
                  <MetadataSection>
                    <MetadataItem>
                      <MetadataLabel>Name</MetadataLabel>
                      <MetadataValue>{currentRoll.name}</MetadataValue>
                    </MetadataItem>
                    
                    <MetadataItem>
                      <MetadataLabel>Film Stock</MetadataLabel>
                      <MetadataValue>
                        {currentRoll.film_stock || 'Not specified'}
                      </MetadataValue>
                    </MetadataItem>
                    
                    {currentRoll.camera && (
                      <MetadataItem>
                        <MetadataLabel>Camera</MetadataLabel>
                        <MetadataValue>{currentRoll.camera}</MetadataValue>
                      </MetadataItem>
                    )}
                    
                    {currentRoll.lens && (
                      <MetadataItem>
                        <MetadataLabel>Lens</MetadataLabel>
                        <MetadataValue>{currentRoll.lens}</MetadataValue>
                      </MetadataItem>
                    )}
                    
                    {currentRoll.iso && (
                      <MetadataItem>
                        <MetadataLabel>ISO</MetadataLabel>
                        <MetadataValue>{currentRoll.iso}</MetadataValue>
                      </MetadataItem>
                    )}
                    
                    {currentRoll.date_taken && (
                      <MetadataItem>
                        <MetadataLabel>Date Taken</MetadataLabel>
                        <MetadataValue>{formatDate(currentRoll.date_taken)}</MetadataValue>
                      </MetadataItem>
                    )}
                    
                    <MetadataItem>
                      <MetadataLabel>Date Imported</MetadataLabel>
                      <MetadataValue>{formatDate(currentRoll.date_imported)}</MetadataValue>
                    </MetadataItem>
                    
                    <MetadataItem>
                      <MetadataLabel>Images</MetadataLabel>
                      <MetadataValue>{currentRoll.image_count}</MetadataValue>
                    </MetadataItem>
                  </MetadataSection>
                  
                  {tags.length > 0 && (
                    <MetadataSection>
                      <SectionTitle>Tags</SectionTitle>
                      <TagsContainer>
                        {tags.map(tag => (
                          <Tag key={tag.id}>{tag.name}</Tag>
                        ))}
                      </TagsContainer>
                    </MetadataSection>
                  )}
                  
                  {currentRoll.notes && (
                    <MetadataSection>
                      <SectionTitle>Notes</SectionTitle>
                      <NotesSection>{currentRoll.notes}</NotesSection>
                    </MetadataSection>
                  )}
                </>
              ) : (
                // Edit form
                <EditForm>
                  <FormGroup>
                    <FormLabel>Name</FormLabel>
                    <FormInput 
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Film Stock</FormLabel>
                    <FormInput 
                      type="text"
                      name="film_stock"
                      value={editFormData.film_stock}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Camera</FormLabel>
                    <FormInput 
                      type="text"
                      name="camera"
                      value={editFormData.camera}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Lens</FormLabel>
                    <FormInput 
                      type="text"
                      name="lens"
                      value={editFormData.lens}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>ISO</FormLabel>
                    <FormInput 
                      type="text"
                      name="iso"
                      value={editFormData.iso}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Date Taken</FormLabel>
                    <FormInput 
                      type="date"
                      name="date_taken"
                      value={editFormData.date_taken ? new Date(editFormData.date_taken).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Notes</FormLabel>
                    <FormTextarea 
                      name="notes"
                      value={editFormData.notes}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </FormGroup>
                </EditForm>
              )}
            </SidebarContent>
            
            <ActionsContainer>
              {!isEditing ? (
                // Normal action buttons
                <>
                  <PrimaryButton onClick={handleEditToggle}>
                    <span>✏️</span> Edit Roll Info
                  </PrimaryButton>
                  <SecondaryButton>
                    <span>💾</span> Export Images
                  </SecondaryButton>
                  <DangerButton onClick={handleDelete}>
                    <span>🗑️</span> Delete Roll
                  </DangerButton>
                </>
              ) : (
                // Edit mode action buttons
                <>
                  <PrimaryButton onClick={handleSaveChanges}>
                    <span>💾</span> Save Changes
                  </PrimaryButton>
                  <SecondaryButton onClick={handleCancelEdit}>
                    <span>✖️</span> Cancel
                  </SecondaryButton>
                </>
              )}
            </ActionsContainer>
          </SidebarColumn>
        </RollViewerContainer>
      </motion.div>
    </AnimatePresence>
  );
};

export default RollViewer; 