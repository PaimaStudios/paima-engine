import React from 'react';

const AikenMapType = (props: { mapKey: React.ReactNode; children: React.ReactNode }) => {
  return (
    <>
      Map&lt;{props.mapKey}, {props.children}&gt;
    </>
  );
};

export default AikenMapType;
