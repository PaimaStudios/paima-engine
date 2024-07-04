import React from 'react';
import OutlineBlock from '../utils/OutlineBlock.js';
import type { LineList } from '../utils/OutlineBlock.js';

const AikenValidator = (props: {
  title: string;
  description: string;
  datum?: React.ReactNode;
  redeemer: React.ReactNode;
  parameters: React.ReactNode[];
}) => {
  const lists: LineList[] = [];
  if (props.datum) {
    lists.push({
      category: 'Datum',
      isLocal: true,
      lines: [props.datum],
    });
  }
  lists.push({
    category: 'Redeemer',
    isLocal: true,
    lines: [props.redeemer],
  });
  lists.push({
    category: 'Parameters',
    isLocal: true,
    lines: props.parameters,
  });
  return (
    <>
      {props.description}
      <OutlineBlock type={props.title} lists={lists} />
    </>
  );
};

export default AikenValidator;
