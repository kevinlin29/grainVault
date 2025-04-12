import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  rolls: [],
  currentRoll: null,
  currentImage: null,
  loading: false,
  error: null,
  filmStocks: [],
  cameras: [],
  lenses: [],
  tags: []
};

// Action types
const ActionTypes = {
  FETCH_ROLLS_START: 'FETCH_ROLLS_START',
  FETCH_ROLLS_SUCCESS: 'FETCH_ROLLS_SUCCESS',
  FETCH_ROLLS_ERROR: 'FETCH_ROLLS_ERROR',
  SET_CURRENT_ROLL: 'SET_CURRENT_ROLL',
  SET_CURRENT_IMAGE: 'SET_CURRENT_IMAGE',
  ADD_ROLL_SUCCESS: 'ADD_ROLL_SUCCESS',
  UPDATE_ROLL_SUCCESS: 'UPDATE_ROLL_SUCCESS',
  DELETE_ROLL_SUCCESS: 'DELETE_ROLL_SUCCESS',
  SET_REFERENCE_DATA: 'SET_REFERENCE_DATA',
  ADD_FILM_STOCK_SUCCESS: 'ADD_FILM_STOCK_SUCCESS',
  FETCH_TAGS_SUCCESS: 'FETCH_TAGS_SUCCESS',
  ADD_TAG_SUCCESS: 'ADD_TAG_SUCCESS'
};

// Reducer function
const rollReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.FETCH_ROLLS_START:
      return { ...state, loading: true, error: null };
      
    case ActionTypes.FETCH_ROLLS_SUCCESS:
      return { ...state, rolls: action.payload, loading: false };
      
    case ActionTypes.FETCH_ROLLS_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case ActionTypes.SET_CURRENT_ROLL:
      return { ...state, currentRoll: action.payload, currentImage: null };
      
    case ActionTypes.SET_CURRENT_IMAGE:
      return { ...state, currentImage: action.payload };
      
    case ActionTypes.ADD_ROLL_SUCCESS:
      return { ...state, rolls: [action.payload, ...state.rolls] };
      
    case ActionTypes.UPDATE_ROLL_SUCCESS:
      return { 
        ...state, 
        rolls: state.rolls.map(roll => roll.id === action.payload.id ? action.payload : roll),
        currentRoll: state.currentRoll?.id === action.payload.id ? action.payload : state.currentRoll
      };
      
    case ActionTypes.DELETE_ROLL_SUCCESS:
      return { 
        ...state, 
        rolls: state.rolls.filter(roll => roll.id !== action.payload),
        currentRoll: state.currentRoll?.id === action.payload ? null : state.currentRoll
      };
      
    case ActionTypes.SET_REFERENCE_DATA:
      return { 
        ...state, 
        filmStocks: action.payload.filmStocks || state.filmStocks,
        cameras: action.payload.cameras || state.cameras,
        lenses: action.payload.lenses || state.lenses
      };
      
    case ActionTypes.ADD_FILM_STOCK_SUCCESS:
      return { ...state, filmStocks: [...state.filmStocks, action.payload] };
      
    case ActionTypes.FETCH_TAGS_SUCCESS:
      return { ...state, tags: action.payload };
      
    case ActionTypes.ADD_TAG_SUCCESS:
      return { ...state, tags: [...state.tags, action.payload] };
      
    default:
      return state;
  }
};

// Create context
const RollContext = createContext();

// Provider component
export const RollProvider = ({ children }) => {
  const [state, dispatch] = useReducer(rollReducer, initialState);
  
  // Load rolls on initial render
  useEffect(() => {
    const fetchRolls = async () => {
      dispatch({ type: ActionTypes.FETCH_ROLLS_START });
      try {
        const rolls = await window.electron.getRolls();
        dispatch({ type: ActionTypes.FETCH_ROLLS_SUCCESS, payload: rolls });
      } catch (error) {
        dispatch({ type: ActionTypes.FETCH_ROLLS_ERROR, payload: error.message });
      }
    };
    
    fetchRolls();
  }, []);
  
  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [filmStocks, cameras, lenses, tags] = await Promise.all([
          window.electron.getFilmStocks(),
          window.electron.getCameras(),
          window.electron.getLenses(),
          window.electron.getTags()
        ]);
        
        dispatch({ 
          type: ActionTypes.SET_REFERENCE_DATA, 
          payload: { filmStocks, cameras, lenses } 
        });
        
        dispatch({
          type: ActionTypes.FETCH_TAGS_SUCCESS,
          payload: tags
        });
      } catch (error) {
        console.error('Error loading reference data:', error);
      }
    };
    
    loadReferenceData();
  }, []);
  
  // Action creators
  const setCurrentRoll = async (rollId) => {
    try {
      const roll = await window.electron.getRollById(rollId);
      dispatch({ type: ActionTypes.SET_CURRENT_ROLL, payload: roll });
      return roll;
    } catch (error) {
      console.error('Error setting current roll:', error);
      return null;
    }
  };
  
  const setCurrentImage = (imageId) => {
    dispatch({ type: ActionTypes.SET_CURRENT_IMAGE, payload: imageId });
  };
  
  const addRoll = async (rollData) => {
    try {
      const id = await window.electron.addRoll(rollData);
      
      // Create a properly structured roll object that matches what the database would return
      const newRoll = { 
        id, 
        name: rollData.name,
        path: rollData.path,
        film_stock: rollData.filmStock,
        camera: rollData.camera,
        lens: rollData.lens,
        iso: rollData.iso,
        date_taken: rollData.dateTaken,
        date_imported: new Date().toISOString(),
        notes: rollData.notes,
        thumbnail_path: rollData.thumbnailPath,
        image_count: rollData.imageCount
      };
      
      dispatch({ type: ActionTypes.ADD_ROLL_SUCCESS, payload: newRoll });
      
      // Also set this as the current roll to avoid loading delays
      dispatch({ type: ActionTypes.SET_CURRENT_ROLL, payload: newRoll });
      
      return newRoll;
    } catch (error) {
      console.error('Error adding roll:', error);
      return null;
    }
  };
  
  const updateRoll = async (id, rollData) => {
    try {
      await window.electron.updateRoll(id, rollData);
      const updatedRoll = { id, ...rollData };
      dispatch({ type: ActionTypes.UPDATE_ROLL_SUCCESS, payload: updatedRoll });
      return updatedRoll;
    } catch (error) {
      console.error('Error updating roll:', error);
      return null;
    }
  };
  
  const deleteRoll = async (id) => {
    try {
      await window.electron.deleteRoll(id);
      dispatch({ type: ActionTypes.DELETE_ROLL_SUCCESS, payload: id });
      return true;
    } catch (error) {
      console.error('Error deleting roll:', error);
      return false;
    }
  };
  
  const addFilmStock = async (name, isColor, iso) => {
    try {
      const id = await window.electron.addFilmStock(name, isColor, iso);
      const newFilmStock = { id, name, is_color: isColor ? 1 : 0, iso };
      dispatch({ type: ActionTypes.ADD_FILM_STOCK_SUCCESS, payload: newFilmStock });
      return newFilmStock;
    } catch (error) {
      console.error('Error adding film stock:', error);
      return null;
    }
  };
  
  const addTag = async (name) => {
    try {
      const id = await window.electron.addTag(name);
      const newTag = { id, name };
      dispatch({ type: ActionTypes.ADD_TAG_SUCCESS, payload: newTag });
      return newTag;
    } catch (error) {
      console.error('Error adding tag:', error);
      return null;
    }
  };
  
  return (
    <RollContext.Provider 
      value={{ 
        state, 
        setCurrentRoll,
        setCurrentImage,
        addRoll,
        updateRoll,
        deleteRoll,
        addFilmStock,
        addTag
      }}
    >
      {children}
    </RollContext.Provider>
  );
};

// Custom hook for using the context
export const useRollContext = () => {
  const context = useContext(RollContext);
  if (context === undefined) {
    throw new Error('useRollContext must be used within a RollProvider');
  }
  return context;
}; 