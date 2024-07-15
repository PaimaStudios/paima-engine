import React from 'react';
import CommentBlock from '../utils/CommentBlock.js';

const AikenConstructorSimple = (props: { title: string; description: string }): React.ReactNode => {
  return (
    <div>
      <CommentBlock comment={props.description} />
      {props.title}
    </div>
  );
};

export default AikenConstructorSimple;
