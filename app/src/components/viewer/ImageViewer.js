import React, { useState, useEffect, useCallback, memo } from 'react';
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

const ImagePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
`;

const Spinner = styled.div`
  width: 30px;
  height: 30px;
  border: 3px solid var(--background-primary);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spinner 1s ease-in-out infinite;
  margin-bottom: 10px;
  
  @keyframes spinner {
    to { transform: rotate(360deg); }
  }
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

// Memoized image component to prevent unnecessary re-renders
const ImageComponent = memo(({ src, alt, onClick, isZoomed, isDragging, zoomLevel, dragPosition, onLoad, onDragStart, onDragEnd, onDragComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };
  
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error(`Failed to load image: ${src}`);
  };
  
  // Don't render anything if there was an error
  if (hasError) {
    return (
      <ImagePlaceholder>
        <div>Failed to load image</div>
        <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>The image file may be missing or corrupted</div>
      </ImagePlaceholder>
    );
  }
  
  return (
    <MainImage
      key={src}
      src={src}
      alt={alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      onMouseDown={onDragStart}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
      onLoad={handleImageLoad}
      onError={handleImageError}
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
      onDragEnd={onDragComplete}
      zoomed={isZoomed}
    />
  );
});

const ImageViewer = ({ images = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Reset the index when images change completely (like when viewing a new roll)
  useEffect(() => {
    if (images.length > 0 && currentIndex >= images.length) {
      // If the current index is out of bounds with the new images array
      setCurrentIndex(0);
    }
  }, [images, currentIndex]);
  
  const currentImage = images.length > 0 ? images[currentIndex] : null;
  const isZoomed = zoomLevel > 1;
  
  // Reset zoom and position when changing images
  useEffect(() => {
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
    setIsImageLoaded(false);
  }, [currentIndex]);
  
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);
  
  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, images.length]);
  
  const handleThumbnailClick = useCallback((index) => {
    setCurrentIndex(index);
  }, []);
  
  const handleImageClick = useCallback(() => {
    if (!isZoomed) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
    }
  }, [isZoomed]);
  
  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  }, []);
  
  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  }, []);
  
  const handleZoomReset = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
  }, []);
  
  const handleDragStart = useCallback(() => {
    if (isZoomed) {
      setIsDragging(true);
    }
  }, [isZoomed]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleDragComplete = useCallback((e, info) => {
    setDragPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  }, []);
  
  const handleImageLoaded = useCallback(() => {
    setIsImageLoaded(true);
  }, []);
  
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
  }, [handlePrevious, handleNext, isZoomed]);
  
  // Preload adjacent images to make transitions smoother
  useEffect(() => {
    if (images.length > 0) {
      // We want to preload images, but using new Image() causes errors in Electron
      // The images will be loaded when needed through standard browser caching
      console.log(`Current image index: ${currentIndex}, total images: ${images.length}`);
      
      // Log next/prev image paths for debugging
      if (currentIndex < images.length - 1) {
        console.log(`Next image path: ${images[currentIndex + 1].path}`);
      }
      
      if (currentIndex > 0) {
        console.log(`Previous image path: ${images[currentIndex - 1].path}`);
      }
    }
  }, [currentIndex, images]);
  
  return (
    <ViewerContainer>
      <MainImageContainer>
        {currentImage ? (
          <ImageComponent 
            src={`file://${currentImage.path}`} 
            alt={currentImage.filename}
            onClick={handleImageClick}
            isZoomed={isZoomed}
            isDragging={isDragging}
            zoomLevel={zoomLevel}
            dragPosition={dragPosition}
            onLoad={handleImageLoaded}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragComplete={handleDragComplete}
          />
        ) : (
          <ImagePlaceholder>No images available</ImagePlaceholder>
        )}
        
        {!isZoomed && isImageLoaded && (
          <>
            <LeftNav onClick={handlePrevious} disabled={currentIndex === 0}>
              <NavArrow>◀</NavArrow>
            </LeftNav>
            <RightNav onClick={handleNext} disabled={currentIndex === images.length - 1}>
              <NavArrow>▶</NavArrow>
            </RightNav>
          </>
        )}
        
        {isImageLoaded && (
          <ZoomControls>
            <ZoomButton onClick={handleZoomOut} disabled={zoomLevel <= 1}>−</ZoomButton>
            <ZoomButton onClick={handleZoomReset}>↺</ZoomButton>
            <ZoomButton onClick={handleZoomIn} disabled={zoomLevel >= 4}>+</ZoomButton>
          </ZoomControls>
        )}
      </MainImageContainer>
      
      <ThumbnailsContainer>
        {images.map((image, index) => (
          <ThumbnailWrapper
            key={image.id || index}
            selected={index === currentIndex}
            onClick={() => handleThumbnailClick(index)}
          >
            <Thumbnail src={`file://${image.path}`} alt={image.filename} />
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