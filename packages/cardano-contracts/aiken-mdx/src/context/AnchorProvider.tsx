import React, { createContext } from 'react';

export const AnchorContext = createContext('');

const AnchorProvider = (props: { children: React.ReactNode; anchor: string }) => {
  return <AnchorContext.Provider value={props.anchor}>{props.children}</AnchorContext.Provider>;
};

export default AnchorProvider;
