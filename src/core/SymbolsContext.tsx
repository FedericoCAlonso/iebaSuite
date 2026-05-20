import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getDefaultSymbolsSync,
  getDefaultCategoriesSync,
  loadCustomSymbolsFromStorage,
  saveSymbols,
  type SymbolCategory,
  type DefinicionSimbolo
} from '../lib/symbols';
import { saveCustomSymbolsRemote, loadCustomSymbolsRemote } from '../firebase/symbolService';
import { useAuth } from './AuthContext';

interface SymbolsContextType {
  symbolsLib: DefinicionSimbolo[];
  categoriesLib: SymbolCategory[];
  setSymbolsLib: (newLibrary: DefinicionSimbolo[]) => void;
}

const SymbolsContext = createContext<SymbolsContextType | undefined>(undefined);

export const SymbolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Inicialización síncrona: símbolos estándar del bundle + custom locales
  const [symbolsLib, setSymbolsLibState] = useState<DefinicionSimbolo[]>(() => {
    const defaults = getDefaultSymbolsSync();
    const custom = loadCustomSymbolsFromStorage();
    return [...defaults, ...custom];
  });

  const [categoriesLib] = useState<SymbolCategory[]>(() => getDefaultCategoriesSync());

  // Sincronización con la nube cuando el usuario se autentica — en segundo plano, sin bloquear
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    let cancelled = false;

    async function syncSymbols() {
      try {
        const customSymbols = await loadCustomSymbolsRemote(uid);
        if (cancelled) return;

        const defaultIds = new Set(getDefaultSymbolsSync().map(s => s.id));
        const merged = [
          ...getDefaultSymbolsSync(),
          ...customSymbols.filter(s => !defaultIds.has(s.id))
        ];

        setSymbolsLibState(merged);
        saveSymbols(merged);
      } catch (error) {
        console.error("Error al sincronizar símbolos con la nube:", error);
      }
    }

    syncSymbols();

    return () => { cancelled = true; };
  }, [user]);

  const updateSymbols = useCallback((newLibrary: DefinicionSimbolo[]) => {
    setSymbolsLibState(newLibrary);
    saveSymbols(newLibrary);

    const uid = user?.uid;
    if (uid) {
      const customOnly = newLibrary.filter(s => s.id.startsWith('sym-custom-'));
      saveCustomSymbolsRemote(uid, customOnly).catch(console.error);
    }
  }, [user]);

  return (
    <SymbolsContext.Provider value={{
      symbolsLib,
      categoriesLib,
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
