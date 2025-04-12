import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRollContext } from '../context/RollContext';
import ImageViewer from '../components/viewer/ImageViewer';

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

const RollViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, setCurrentRoll, deleteRoll } = useRollContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [fileAccessDiagnosis, setFileAccessDiagnosis] = useState(null);
  
  // Function to test direct file access
  const testDirectFileAccess = async (imagePath) => {
    if (!imagePath) return false;
    
    try {
      console.log('Running direct file access test on:', imagePath);
      const result = await window.electron.testImageFile(imagePath);
      console.log('Direct file access test result:', result);
      setFileAccessDiagnosis(result);
      return result.exists;
    } catch (error) {
      console.error('Error in direct file access test:', error);
      setFileAccessDiagnosis({ exists: false, error: error.message });
      return false;
    }
  };
  
  // Fetch roll data when the component mounts or the ID changes
  useEffect(() => {
    const fetchRoll = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching roll with ID: ${id}`);
        const roll = await setCurrentRoll(id);
        
        if (!roll) {
          console.error('Roll not found in database');
          throw new Error('Roll not found');
        }
        
        console.log('Roll data:', roll);
        console.log('Directory exists:', roll.directory_exists);
        
        // Fetch the roll's images directly from the filesystem via our electron API
        console.log(`Fetching images for roll: ${id}`);
        const rollImages = await window.electron.getImagesByRollId(id);
        console.log(`Received ${rollImages.length} images for roll ${id}`);
        
        if (rollImages.length === 0 && roll.directory_exists) {
          // Directory exists but no images were found
          setError('No images found in the directory');
        } else {
          setImages(rollImages);
        }
        
        // Fetch the roll's tags
        const rollTags = await window.electron.getRollTags(id);
        console.log(`Received ${rollTags.length} tags`);
        setTags(rollTags);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching roll:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchRoll();
  }, [id, setCurrentRoll]);
  
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
    return <LoadingContainer>Loading roll and scanning for images...</LoadingContainer>;
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
  
  // Check if the roll's directory exists
  if (!currentRoll.directory_exists) {
    return (
      <ErrorContainer>
        <ErrorTitle>Directory Not Found</ErrorTitle>
        <ErrorMessage>
          The directory for this roll ({currentRoll.path}) no longer exists on your filesystem.
          The files may have been moved, deleted, or the storage device may be disconnected.
        </ErrorMessage>
        <BackButton onClick={() => navigate('/')}>Back to Dashboard</BackButton>
      </ErrorContainer>
    );
  }
  
  // Show empty state if no images were found
  if (images.length === 0) {
    // If we haven't run a file access test yet and we have a roll path, test it
    if (!fileAccessDiagnosis && currentRoll.path) {
      testDirectFileAccess(currentRoll.path);
    }
    
    return (
      <ErrorContainer>
        <ErrorTitle>No Images Found</ErrorTitle>
        <ErrorMessage>
          No images were found in the directory. The image files may have been moved or deleted.
          {fileAccessDiagnosis && !fileAccessDiagnosis.exists && (
            <>
              <br /><br />
              <strong>Diagnosis:</strong> There appears to be a problem accessing files from the directory.
              <br />
              {fileAccessDiagnosis.error && (
                <code style={{display: 'block', marginTop: '10px', padding: '10px', background: '#f3f3f3', borderRadius: '4px'}}>
                  {fileAccessDiagnosis.error}
                </code>
              )}
            </>
          )}
        </ErrorMessage>
        
        <BackButton onClick={() => navigate('/')}>Back to Dashboard</BackButton>
      </ErrorContainer>
    );
  }
  
  return (
    <RollViewerContainer>
      <ViewerColumn>
        <ImageViewer images={images} />
      </ViewerColumn>
      
      <SidebarColumn>
        <SidebarHeader>
          <SidebarTitle>Roll Details</SidebarTitle>
        </SidebarHeader>
        
        <SidebarContent>
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
        </SidebarContent>
        
        <ActionsContainer>
          <PrimaryButton>
            <span>✏️</span> Edit Roll Info
          </PrimaryButton>
          <SecondaryButton>
            <span>💾</span> Export Images
          </SecondaryButton>
          <DangerButton onClick={handleDelete}>
            <span>🗑️</span> Delete Roll
          </DangerButton>
        </ActionsContainer>
      </SidebarColumn>
    </RollViewerContainer>
  );
};

export default RollViewer; 