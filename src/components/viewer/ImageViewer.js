import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--background-primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
`;

const MainImageContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  overflow: hidden;
`;

const MainImage = styled(motion.img)`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: ${props => (props.zoomed ? 'grab' : 'zoom-in')};
  user-select: none;
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 10px;
  background-color: var(--background-primary);
  border-top: 1px solid var(--border-color);
  height: 90px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--background-primary);
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 6px;
  }
`;

const ThumbnailWrapper = styled.div`
  flex: 0 0 auto;
  width: 70px;
  height: 70px;
  margin-right: 8px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${props => props.selected ? 'var(--accent-color)' : 'transparent'};
  transition: border-color 0.2s;
  position: relative;
  
  &:hover {
    border-color: ${props => props.selected ? 'var(--accent-color)' : 'var(--border-color)'};
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: var(--background-primary);
  border-top: 1px solid var(--border-color);
`;

const NavButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  padding: 5px 10px;
  cursor: pointer;
  color: var(--text-primary);
  
  &:disabled {
    color: var(--text-tertiary);
    cursor: default;
  }
  
  &:hover:not(:disabled) {
    color: var(--accent-color);
  }
`;

const ImageCounter = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const ZoomControls = styled.div`
  position: absolute;
  bottom: 15px;
  right: 15px;
  display: flex;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  padding: 5px;
`;

const ZoomButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  color: white;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
`;

const NavigationOverlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 15%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const LeftNav = styled(NavigationOverlay)`
  left: 0;
`;

const RightNav = styled(NavigationOverlay)`
  right: 0;
`;

const NavArrow = styled.span`
  font-size: 24px;
  color: white;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${NavigationOverlay}:hover & {
    opacity: 1;
  }
`;

const ImageViewer = ({ images = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [imageErrors, setImageErrors] = useState({});
  const [imageDetails, setImageDetails] = useState({});
  
  const currentImage = images[currentIndex] || null;
  const isZoomed = zoomLevel > 1;
  
  // Debug logging for images
  useEffect(() => {
    console.log(`ImageViewer received ${images.length} images:`, images);
    
    // Test image files
    const testImages = async () => {
      const details = {};
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          console.log(`Testing image at index ${i}:`, image.path);
          const result = await window.electron.testImageFile(image.path);
          console.log(`Image test result for index ${i}:`, result);
          details[i] = result;
          
          if (!result.exists) {
            setImageErrors(prev => ({ ...prev, [i]: true }));
          }
        } catch (error) {
          console.error(`Error testing image at index ${i}:`, error);
          details[i] = { exists: false, error: error.message };
          setImageErrors(prev => ({ ...prev, [i]: true }));
        }
      }
      
      setImageDetails(details);
    };
    
    if (images.length > 0) {
      testImages();
    }
  }, [images]);
  
  // Reset zoom and position when changing images
  useEffect(() => {
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
  }, [currentIndex]);
  
  const handleImageError = (index) => {
    console.error(`Failed to load image at index ${index}:`, images[index]?.path);
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };
  
  const handleImageClick = () => {
    if (!isZoomed) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
    }
  };
  
  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomLevel(Math.min(zoomLevel + 0.5, 4));
  };
  
  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomLevel(Math.max(zoomLevel - 0.5, 1));
  };
  
  const handleZoomReset = (e) => {
    e.stopPropagation();
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
  };
  
  const handleDragStart = () => {
    if (isZoomed) {
      setIsDragging(true);
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape' && isZoomed) {
        setZoomLevel(1);
        setDragPosition({ x: 0, y: 0 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, isZoomed]);
  
  // No need for Image preloading in Electron - it causes errors
  // Instead we'll rely on browser caching
  
  return (
    <ViewerContainer>
      <MainImageContainer>
        {currentImage && (
          <AnimatePresence initial={false}>
            <MainImage
              key={currentImage.id || currentIndex}
              src={`file://${currentImage.path}`}
              alt={currentImage.filename}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleImageClick}
              onMouseDown={handleDragStart}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onError={() => handleImageError(currentIndex)}
              style={{
                scale: zoomLevel,
                x: dragPosition.x,
                y: dragPosition.y,
                cursor: isDragging ? 'grabbing' : isZoomed ? 'grab' : 'zoom-in'
              }}
              drag={isZoomed}
              dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
              dragElastic={0.1}
              dragMomentum={false}
              onDragEnd={(e, info) => {
                setDragPosition({
                  x: dragPosition.x + info.offset.x,
                  y: dragPosition.y + info.offset.y
                });
              }}
              zoomed={isZoomed}
            />
          </AnimatePresence>
        )}
        
        {!isZoomed && (
          <>
            <LeftNav onClick={handlePrevious} disabled={currentIndex === 0}>
              <NavArrow>◀</NavArrow>
            </LeftNav>
            <RightNav onClick={handleNext} disabled={currentIndex === images.length - 1}>
              <NavArrow>▶</NavArrow>
            </RightNav>
          </>
        )}
        
        <ZoomControls>
          <ZoomButton onClick={handleZoomOut} disabled={zoomLevel <= 1}>−</ZoomButton>
          <ZoomButton onClick={handleZoomReset}>↺</ZoomButton>
          <ZoomButton onClick={handleZoomIn} disabled={zoomLevel >= 4}>+</ZoomButton>
        </ZoomControls>
      </MainImageContainer>
      
      <ThumbnailsContainer>
        {images.map((image, index) => (
          <ThumbnailWrapper
            key={image.id || index}
            selected={index === currentIndex}
            onClick={() => handleThumbnailClick(index)}
          >
            <Thumbnail 
              src={`file://${image.path}`} 
              alt={image.filename} 
              onError={() => handleImageError(index)}
              style={{ opacity: imageErrors[index] ? 0.3 : 1 }}
            />
            {imageErrors[index] && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                fontSize: '16px'
              }}>❌</div>
            )}
          </ThumbnailWrapper>
        ))}
      </ThumbnailsContainer>
      
      <NavigationControls>
        <NavButton onClick={handlePrevious} disabled={currentIndex === 0}>
          ◀
        </NavButton>
        <ImageCounter>
          {currentIndex + 1} of {images.length}
        </ImageCounter>
        <NavButton onClick={handleNext} disabled={currentIndex === images.length - 1}>
          ▶
        </NavButton>
      </NavigationControls>
    </ViewerContainer>
  );
};

export default ImageViewer; 