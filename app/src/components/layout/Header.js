import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useRollContext } from '../../context/RollContext';
import ImportRollModal from '../roll/ImportRollModal';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 20px;
  background-color: var(--background-primary);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-primary);

  h1 {
    font-size: 1.5rem;
    margin: 0;
    margin-left: 10px;
  }
`;

const LogoIcon = styled.div`
  font-size: 24px;
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  margin-left: 15px;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--accent-color);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--background-secondary);
  border-radius: 20px;
  padding: 5px 15px;
  margin-left: 20px;
  
  svg {
    color: var(--text-secondary);
    margin-right: 8px;
  }
`;

const SearchInput = styled.input`
  background: none;
  border: none;
  color: var(--text-primary);
  padding: 5px;
  outline: none;
  width: 200px;
  
  &:focus {
    border-color: transparent;
  }
`;

const BreadcrumbPath = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
  
  span {
    margin: 0 5px;
  }
`;

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { state } = useRollContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check if we're on a roll page to show breadcrumbs
  const isRollPage = location.pathname.startsWith('/roll/');
  
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <HeaderContainer>
      <Logo to="/">
        <LogoIcon>📷</LogoIcon>
        <h1>GrainVault</h1>
        
        {isRollPage && state.currentRoll && (
          <BreadcrumbPath>
            <span>&gt;</span>
            {state.currentRoll.name}
          </BreadcrumbPath>
        )}
      </Logo>
      
      <Navigation>
        <SearchContainer>
          <span>🔍</span>
          <SearchInput 
            type="text" 
            placeholder="Search rolls..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearch}
          />
        </SearchContainer>
        
        <IconButton onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          {theme === 'light' ? '🌙' : '☀️'}
        </IconButton>
        
        <IconButton onClick={() => navigate('/settings')} title="Settings">
          ⚙️
        </IconButton>
        
        <IconButton onClick={() => setShowImportModal(true)} title="Import Roll">
          📥
        </IconButton>
      </Navigation>
      
      {showImportModal && (
        <ImportRollModal onClose={() => setShowImportModal(false)} />
      )}
    </HeaderContainer>
  );
};

export default Header; 