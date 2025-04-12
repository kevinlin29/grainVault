import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Light theme variables */
    --background-primary: #ffffff;
    --background-secondary: #f5f5f5;
    --text-primary: #333333;
    --text-secondary: #666666;
    --accent-color: #7b68ee;
    --border-color: #e0e0e0;
    --error-color: #e53935;
    --success-color: #43a047;
    --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    --header-height: 60px;
    --sidebar-width: 250px;
  }

  body.dark {
    /* Dark theme variables */
    --background-primary: #121212;
    --background-secondary: #1e1e1e;
    --text-primary: #f5f5f5;
    --text-secondary: #aaaaaa;
    --accent-color: #9c8dfc;
    --border-color: #333333;
    --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--background-primary);
    color: var(--text-primary);
    transition: background-color 0.3s, color 0.3s;
    line-height: 1.6;
    font-size: 16px;
    overflow: hidden;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  a {
    color: var(--accent-color);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  button, input, select, textarea {
    font-family: inherit;
    font-size: inherit;
  }

  button {
    cursor: pointer;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 500;
    
    &:hover {
      filter: brightness(1.1);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  input, select, textarea {
    background-color: var(--background-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px 12px;
    
    &:focus {
      outline: none;
      border-color: var(--accent-color);
    }
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 0.5em;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--background-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--text-secondary);
    border-radius: 4px;
    
    &:hover {
      background: var(--accent-color);
    }
  }
`; 