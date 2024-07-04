import React from 'react';
import CommentBlock from '../utils/CommentBlock.js';

const AikenConstructorTuple = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  const childrenArray = React.Children.toArray(props.children);
  const commaSeparatedItems = childrenArray.reduce<React.ReactNode[]>((acc, curr, index) => {
    if (index === 0) {
      return [curr];
    }
    return [...acc, ', ', curr];
  }, []);
  return (
    <div>
      <CommentBlock comment={props.description} />
      {props.title}({commaSeparatedItems})
    </div>
  );
};

export default AikenConstructorTuple;
