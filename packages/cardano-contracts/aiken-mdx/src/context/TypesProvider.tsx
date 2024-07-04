import React, { createContext, useState } from 'react';
import type { LineList } from '../components/utils/OutlineBlock.js';

// Create a context with an empty array as the default value
export const TypeContext = createContext({
  types: [] as LineList[],
  addType: (_type: LineList) => {},
});

const TypesProvider = (props: { children: React.ReactNode }) => {
  const [types, setTypes] = useState<LineList[]>([]);

  const addType = (type: LineList): void => {
    setTypes((prevTypes: LineList[]) => [...prevTypes, type]);
  };

  return <TypeContext.Provider value={{ types, addType }}>{props.children}</TypeContext.Provider>;
};

export default TypesProvider;
