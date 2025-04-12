import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 25px;
  color: var(--text-primary);
`;

const Section = styled.section`
  margin-bottom: 30px;
  background-color: var(--background-primary);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 15px 20px;
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0;
  color: var(--text-primary);
`;

const SectionContent = styled.div`
  padding: 20px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  font-size: 1rem;
  color: var(--text-primary);
`;

const SettingDescription = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 5px;
`;

const SettingControl = styled.div`
  display: flex;
  align-items: center;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--background-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--background-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  width: 80px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
  
  &[type="range"] {
    width: 150px;
    padding: 0;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  background-color: var(--accent-color);
  color: white;
  border: none;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  
  &:hover {
    background-color: var(--background-secondary);
  }
`;

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    theme: theme,
    defaultView: 'grid',
    thumbnailsSize: 200,
    cacheLimit: 500
  });
  const [defaultSettings, setDefaultSettings] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const appSettings = await window.electron.getSettings();
        const newSettings = {
          theme: theme, // Use theme from context
          defaultView: appSettings.default_view,
          thumbnailsSize: appSettings.thumbnails_size,
          cacheLimit: appSettings.cache_limit_mb
        };
        
        setSettings(newSettings);
        setDefaultSettings(newSettings); // Save initial settings
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    
    fetchSettings();
  }, [theme]);
  
  // Handle setting changes
  const handleChange = (name, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [name]: value };
      // Check if there are unsaved changes
      setUnsavedChanges(
        JSON.stringify(newSettings) !== JSON.stringify(defaultSettings)
      );
      return newSettings;
    });
    
    // Update theme immediately if changed
    if (name === 'theme' && value !== theme) {
      toggleTheme();
    }
  };
  
  // Save settings
  const handleSave = async () => {
    try {
      await window.electron.updateSettings({
        theme: settings.theme,
        defaultView: settings.defaultView,
        thumbnailsSize: settings.thumbnailsSize,
        cacheLimitMb: settings.cacheLimit
      });
      
      setDefaultSettings(settings);
      setUnsavedChanges(false);
      
      // Show success message (in a real app)
    } catch (error) {
      console.error('Error saving settings:', error);
      // Show error message (in a real app)
    }
  };
  
  // Cancel changes
  const handleCancel = () => {
    setSettings(defaultSettings);
    
    // Reset theme if it was changed
    if (settings.theme !== defaultSettings.theme) {
      toggleTheme();
    }
    
    setUnsavedChanges(false);
  };
  
  return (
    <SettingsContainer>
      <PageTitle>Settings</PageTitle>
      
      <Section>
        <SectionHeader>
          <SectionTitle>Appearance</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <SettingRow>
            <div>
              <SettingLabel>Theme</SettingLabel>
              <SettingDescription>Choose between light and dark theme</SettingDescription>
            </div>
            <SettingControl>
              <Select 
                value={settings.theme} 
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </SettingControl>
          </SettingRow>
          
          <SettingRow>
            <div>
              <SettingLabel>Default View</SettingLabel>
              <SettingDescription>Set default view for roll library</SettingDescription>
            </div>
            <SettingControl>
              <Select 
                value={settings.defaultView} 
                onChange={(e) => handleChange('defaultView', e.target.value)}
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </Select>
            </SettingControl>
          </SettingRow>
          
          <SettingRow>
            <div>
              <SettingLabel>Thumbnail Size</SettingLabel>
              <SettingDescription>Set the size of thumbnails in grid view</SettingDescription>
            </div>
            <SettingControl>
              <Input 
                type="range" 
                min="150" 
                max="300" 
                step="10" 
                value={settings.thumbnailsSize} 
                onChange={(e) => handleChange('thumbnailsSize', parseInt(e.target.value))}
              />
              <span style={{ marginLeft: '10px' }}>{settings.thumbnailsSize}px</span>
            </SettingControl>
          </SettingRow>
        </SectionContent>
      </Section>
      
      <Section>
        <SectionHeader>
          <SectionTitle>Performance</SectionTitle>
        </SectionHeader>
        <SectionContent>
          <SettingRow>
            <div>
              <SettingLabel>Cache Limit</SettingLabel>
              <SettingDescription>Maximum disk space used for image cache</SettingDescription>
            </div>
            <SettingControl>
              <Input 
                type="number" 
                min="100" 
                max="2000" 
                step="100" 
                value={settings.cacheLimit} 
                onChange={(e) => handleChange('cacheLimit', parseInt(e.target.value))}
              />
              <span style={{ marginLeft: '10px' }}>MB</span>
            </SettingControl>
          </SettingRow>
        </SectionContent>
      </Section>
      
      {unsavedChanges && (
        <ButtonGroup>
          <CancelButton onClick={handleCancel}>Cancel</CancelButton>
          <Button onClick={handleSave}>Save Changes</Button>
        </ButtonGroup>
      )}
    </SettingsContainer>
  );
};

export default Settings; 