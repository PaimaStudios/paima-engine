import React from 'react';

const AikenConstructorMapField = (props: { mapKey: string; children: React.ReactNode }) => {
  return (
    <>
      {props.mapKey}: {props.children}
    </>
  );
};

export default AikenConstructorMapField;
