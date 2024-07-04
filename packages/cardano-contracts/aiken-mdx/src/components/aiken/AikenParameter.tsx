import React from 'react';

const AikenParameter = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      {props.title} = {props.children}
    </>
  );
};

export default AikenParameter;
