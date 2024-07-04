import React from 'react';
import CommentBlock from '../utils/CommentBlock.js';

const AikenRedeemer = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <CommentBlock comment={props.description} />
      {props.title} = {props.children}
    </>
  );
};

export default AikenRedeemer;
