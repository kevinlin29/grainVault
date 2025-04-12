import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { RollProvider } from './context/RollContext';
import { GlobalStyle } from './styles/GlobalStyle';
import { lightTheme, darkTheme } from './styles/themes';
import { useTheme } from './context/ThemeContext';

import Dashboard from './pages/Dashboard';
import RollViewer from './pages/RollViewer';
import Settings from './pages/Settings';
import Header from './components/layout/Header';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ContentContainer = styled.main`
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: var(--background-primary);
`;

const App = () => {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  
  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <RollProvider>
        <Router>
          <AppContainer>
            <Header />
            <ContentContainer>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/roll/:id" element={<RollViewer />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </ContentContainer>
          </AppContainer>
        </Router>
      </RollProvider>
    </ThemeProvider>
  );
};

export default App; 