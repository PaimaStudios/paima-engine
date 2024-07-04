import React from 'react';

const AikenTupleType = (props: { children: React.ReactNode[] }) => {
  const childrenArray = React.Children.toArray(props.children);
  const commaSeparatedItems = childrenArray.reduce<React.ReactNode[]>((acc, curr, index) => {
    if (index === 0) {
      return [curr];
    }
    return [...acc, ', ', curr];
  }, []);
  return <>({commaSeparatedItems})</>;
};

export default AikenTupleType;
