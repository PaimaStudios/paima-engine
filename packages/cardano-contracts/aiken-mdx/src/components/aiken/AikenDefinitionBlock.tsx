import React, { useContext } from 'react';
import { TypeContext } from '../../context/TypesProvider.js';

const AikenDefinitionBlock = (props: {
  scope: string;
  isLocal: boolean;
  children: React.ReactNode;
}) => {
  const { addType } = useContext(TypeContext);
  React.useEffect(() => {
    addType({
      category: props.scope,
      isLocal: props.isLocal,
      lines: [props.children],
    });
  }, []);
  return <></>;
};

export default AikenDefinitionBlock;
