import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { useRollContext } from '../context/RollContext';
import RollCard from '../components/roll/RollCard';
import ImportRollModal from '../components/roll/ImportRollModal';
import { motion } from 'framer-motion';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FilterLabel = styled.span`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--background-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const ViewToggle = styled.div`
  display: flex;
  background-color: var(--background-secondary);
  border-radius: 4px;
  overflow: hidden;
`;

const ViewToggleButton = styled.button`
  background: ${props => props.active ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.active ? 'var(--accent-color)' : 'var(--background-tertiary)'};
  }
`;

const ImportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
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

const RollGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  flex: 1;
`;

const RollList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
`;

const EmptyState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  height: 50vh;
`;

const EmptyStateIcon = styled.div`
  font-size: 60px;
  margin-bottom: 20px;
  color: var(--text-secondary);
`;

const EmptyStateText = styled.h2`
  color: var(--text-primary);
  margin-bottom: 10px;
`;

const EmptyStateSubtext = styled.p`
  color: var(--text-secondary);
  margin-bottom: 30px;
  max-width: 500px;
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  font-size: 1.2rem;
  color: var(--text-secondary);
`;

const Dashboard = () => {
  const { state } = useRollContext();
  const location = useLocation();
  const [viewMode, setViewMode] = useState('grid');
  const [showImportModal, setShowImportModal] = useState(false);
  const [filterFilmStock, setFilterFilmStock] = useState('');
  const [sortBy, setSortBy] = useState('dateImported');
  
  // Extract search query from URL if present
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  
  // Filtered and sorted rolls
  const filteredRolls = state.rolls.filter(roll => {
    if (searchQuery && !roll.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filterFilmStock && roll.film_stock !== filterFilmStock) {
      return false;
    }
    
    return true;
  });
  
  // Sort rolls
  const sortedRolls = [...filteredRolls].sort((a, b) => {
    switch (sortBy) {
      case 'dateImported':
        return new Date(b.date_imported) - new Date(a.date_imported);
      case 'dateTaken':
        if (!a.date_taken) return 1;
        if (!b.date_taken) return -1;
        return new Date(b.date_taken) - new Date(a.date_taken);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'imageCount':
        return b.image_count - a.image_count;
      default:
        return 0;
    }
  });
  
  // Get roll tags (this would normally be fetched from the database)
  const getRollTags = (rollId) => {
    // In a real implementation, we would use the actual tags from the database
    // For now, return an empty array
    return [];
  };
  
  return (
    <DashboardContainer>
      <ControlBar>
        <Controls>
          <FilterContainer>
            <FilterLabel>Film:</FilterLabel>
            <Select 
              value={filterFilmStock}
              onChange={(e) => setFilterFilmStock(e.target.value)}
            >
              <option value="">All</option>
              {state.filmStocks.map(stock => (
                <option key={stock.id} value={stock.id}>
                  {stock.name}
                </option>
              ))}
            </Select>
          </FilterContainer>
          
          <FilterContainer>
            <FilterLabel>Sort:</FilterLabel>
            <Select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="dateImported">Recently Added</option>
              <option value="dateTaken">Date Taken</option>
              <option value="name">Name</option>
              <option value="imageCount">Image Count</option>
            </Select>
          </FilterContainer>
          
          <ViewToggle>
            <ViewToggleButton 
              active={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              □
            </ViewToggleButton>
            <ViewToggleButton 
              active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              ☰
            </ViewToggleButton>
          </ViewToggle>
        </Controls>
        
        <ImportButton onClick={() => setShowImportModal(true)}>
          <span>📥</span>
          Import Roll
        </ImportButton>
      </ControlBar>
      
      {state.loading ? (
        <LoadingIndicator>Loading rolls...</LoadingIndicator>
      ) : sortedRolls.length === 0 ? (
        <EmptyState
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyStateIcon>📷</EmptyStateIcon>
          <EmptyStateText>No rolls found</EmptyStateText>
          <EmptyStateSubtext>
            {searchQuery || filterFilmStock 
              ? "Try adjusting your search or filters"
              : "Import your first film roll to get started"}
          </EmptyStateSubtext>
          <ImportButton onClick={() => setShowImportModal(true)}>
            <span>📥</span>
            Import Roll
          </ImportButton>
        </EmptyState>
      ) : viewMode === 'grid' ? (
        <RollGrid
          layout
          transition={{ duration: 0.3 }}
        >
          {sortedRolls.map(roll => (
            <RollCard 
              key={roll.id} 
              roll={roll} 
              tags={getRollTags(roll.id)} 
            />
          ))}
        </RollGrid>
      ) : (
        <RollList
          layout
          transition={{ duration: 0.3 }}
        >
          {sortedRolls.map(roll => (
            <RollCard 
              key={roll.id} 
              roll={roll} 
              tags={getRollTags(roll.id)} 
            />
          ))}
        </RollList>
      )}
      
      {showImportModal && (
        <ImportRollModal onClose={() => setShowImportModal(false)} />
      )}
    </DashboardContainer>
  );
};

export default Dashboard; 