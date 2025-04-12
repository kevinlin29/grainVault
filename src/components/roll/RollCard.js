import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Card = styled(motion.div)`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--background-primary);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }
`;

const ThumbnailContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 aspect ratio */
  overflow: hidden;
  background-color: var(--background-secondary);
`;

const ThumbnailImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const MissingIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(229, 57, 53, 0.8);
  color: white;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: bold;
  z-index: 2;
`;

const RollIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  color: var(--text-secondary);
`;

const CardContent = styled.div`
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const RollName = styled.h3`
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FilmStock = styled.p`
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ImageCount = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-tertiary);
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
`;

const Tag = styled.span`
  font-size: 0.75rem;
  background-color: var(--background-secondary);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
`;

const DateLabel = styled.span`
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: auto;
  padding-top: 10px;
`;

const RollCard = ({ roll, tags = [] }) => {
  const navigate = useNavigate();
  
  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return null;
    }
  };
  
  const formattedDate = formatDate(roll.date_taken) || formatDate(roll.date_imported);
  
  const handleClick = () => {
    navigate(`/roll/${roll.id}`);
  };
  
  return (
    <Card 
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ThumbnailContainer>
        {!roll.directory_exists && (
          <MissingIndicator>Missing</MissingIndicator>
        )}
        {roll.thumbnail_path ? (
          <ThumbnailImage src={`file://${roll.thumbnail_path}`} alt={roll.name} />
        ) : (
          <RollIcon>🎞️</RollIcon>
        )}
      </ThumbnailContainer>
      <CardContent>
        <RollName>{roll.name}</RollName>
        <FilmStock>{roll.film_stock}</FilmStock>
        <ImageCount>
          {roll.image_count} {roll.image_count === 1 ? 'image' : 'images'}
          {!roll.directory_exists && ' (files missing)'}
        </ImageCount>
        
        {tags.length > 0 && (
          <TagContainer>
            {tags.slice(0, 3).map(tag => (
              <Tag key={tag.id}>{tag.name}</Tag>
            ))}
            {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
          </TagContainer>
        )}
        
        {formattedDate && <DateLabel>{formattedDate}</DateLabel>}
      </CardContent>
    </Card>
  );
};

export default RollCard; 