import React from 'react';
import CommentBlock from '../utils/CommentBlock.js';

const AikenConstructorMap = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}): React.ReactNode => {
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
      {props.title} &#123; {commaSeparatedItems} &#125;
    </div>
  );
};

export default AikenConstructorMap;
