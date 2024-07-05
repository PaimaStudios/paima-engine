import React, { useContext } from 'react';
import { TypeContext, default as TypesProvider } from '../../context/TypesProvider.js';
import OutlineBlock from '../utils/OutlineBlock.js';

const AikenDefinitions = (props: { children: React.ReactNode }): React.ReactNode => {
  const { types } = useContext(TypeContext);
  return (
    <>
      <OutlineBlock type="Types" lists={types} />
    </>
  );
};

const AikenDefinitionsWrapper = (props: { children: React.ReactNode }): React.ReactNode => {
  return (
    <TypesProvider>
      {props.children}
      <AikenDefinitions {...props} />
    </TypesProvider>
  );
};

export default AikenDefinitionsWrapper;
