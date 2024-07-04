import React, { useContext } from 'react';
import { AnchorContext } from '../../context/AnchorProvider.js';
import { IsLocalContext } from '../../context/IsLocalProvider.js';

const AikenBaseType = (props: { value: string; children: React.ReactNode }) => {
  const rootAnchor = useContext(AnchorContext);
  const isLocal = useContext(IsLocalContext);

  const isPrimitive = (() => {
    switch (props.value) {
      case 'Int':
      case 'ByteArray':
        return true;
      default:
        return false;
    }
  })();
  if (isPrimitive) {
    return props.value;
  }
  if (!isLocal) {
    return <div id={`${rootAnchor}-${props.value}`}>{props.value}</div>;
  }
  return (
    <a href={`#${rootAnchor}-${props.value}`} className="hover:underline text-[#1cc489]">
      {props.value}
    </a>
  );
};

export default AikenBaseType;
