import React, { createContext } from 'react';

export const IsLocalContext = createContext(false);

const IsLocalProvider = (props: {
  children: React.ReactNode;
  isLocal: boolean;
}): React.ReactNode => {
  return <IsLocalContext.Provider value={props.isLocal}>{props.children}</IsLocalContext.Provider>;
};

export default IsLocalProvider;
