import React, { useContext } from 'react';
import CommentBlock from '../utils/CommentBlock.js';
import { AnchorContext } from '../../context/AnchorProvider.js';

const AikenEnum = (props: {
  title: string;
  description: string;
  children: React.ReactNode;
}): React.ReactNode => {
  const rootAnchor = useContext(AnchorContext);
  return (
    <div>
      <CommentBlock comment={props.description} />
      <span id={`${rootAnchor}-${props.title}`}>
        <b>{props.title}</b>
      </span>{' '}
      = <div style={{ paddingLeft: '16px' }}>{props.children}</div>
      <br />
    </div>
  );
};

export default AikenEnum;
