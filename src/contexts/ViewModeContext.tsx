import React, { createContext, useContext } from 'react';

export type ViewMode = 'byUrl' | 'byType' | 'bySnippet' | 'byOccurrence';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{
  children: React.ReactNode;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}> = ({ children, viewMode, setViewMode }) => {
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};