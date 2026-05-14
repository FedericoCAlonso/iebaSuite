import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  loadSymbolsAsync, 
  saveSymbols, 
  fetchSymbolsFile, 
  type SymbolCategory, 
  type DefinicionSimbolo 
} from '../lib/symbols';
import { saveCustomSymbolsRemote, loadCustomSymbolsRemote } from '../firebase/symbolService';
import { useAuth } from './AuthContext';

interface SymbolsContextType {
  symbolsLib: DefinicionSimbolo[];
  categoriesLib: SymbolCategory[];
  isLoadingSymbols: boolean;
  setSymbolsLib: (newLibrary: DefinicionSimbolo[]) => void;
}

const SymbolsContext = createContext<SymbolsContextType | undefined>(undefined);

export const SymbolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [symbolsLib, setSymbolsLibState] = useState<DefinicionSimbolo[]>([]);
  const [categoriesLib, setCategoriesLib] = useState<SymbolCategory[]>([]);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);

  // Carga inicial (Offline / Fallback)
  useEffect(() => {
    async function initLoad() {
      try {
        const [localSymbols, symbolsFileData] = await Promise.all([
          loadSymbolsAsync(),
          fetchSymbolsFile()
        ]);
        setSymbolsLibState(localSymbols);
        setCategoriesLib(symbolsFileData.categories);
      } catch (error) {
        console.error("Error en carga inicial de símbolos:", error);
      } finally {
        if (!user) setIsLoadingSymbols(false);
      }
    }
    initLoad();
  }, [user]);

  // Sincronización con la nube cuando el usuario se autentica
  useEffect(() => {
    if (!user) return;

    async function syncSymbols() {
      setIsLoadingSymbols(true);
      try {
        const [customSymbols, symbolsFileData] = await Promise.all([
          loadCustomSymbolsRemote(user.uid),
          fetchSymbolsFile()
        ]);

        const defaultSymbols = symbolsFileData.symbols;
        setCategoriesLib(symbolsFileData.categories);

        // Mezclar símbolos por defecto con los personalizados de la nube
        const mergedSymbols = [...defaultSymbols, ...customSymbols];
        setSymbolsLibState(mergedSymbols);
        
        // Backup local
        saveSymbols(mergedSymbols);
      } catch (error) {
        console.error("Error al sincronizar símbolos con la nube:", error);
      } finally {
        setIsLoadingSymbols(false);
      }
    }

    syncSymbols();
  }, [user]);

  const updateSymbols = useCallback((newLibrary: DefinicionSimbolo[]) => {
    setSymbolsLibState(newLibrary);
    saveSymbols(newLibrary);

    if (user) {
      const customOnly = newLibrary.filter(s => s.id.startsWith('sym-custom-'));
      saveCustomSymbolsRemote(user.uid, customOnly).catch(console.error);
    }
  }, [user]);

  return (
    <SymbolsContext.Provider value={{ 
      symbolsLib, 
      categoriesLib, 
      isLoadingSymbols, 
      setSymbolsLib: updateSymbols 
    }}>
      {children}
    </SymbolsContext.Provider>
  );
};

export const useSymbols = () => {
  const context = useContext(SymbolsContext);
  if (context === undefined) {
    throw new Error('useSymbols must be used within a SymbolsProvider');
  }
  return context;
};
