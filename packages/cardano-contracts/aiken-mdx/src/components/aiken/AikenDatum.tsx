import React from 'react';
import AikenRedeemer from './AikenRedeemer.js';

const AikenDatum = (props: { title: string; description: string; children: React.ReactNode }) => {
  return <AikenRedeemer {...props} />;
};

export default AikenDatum;
