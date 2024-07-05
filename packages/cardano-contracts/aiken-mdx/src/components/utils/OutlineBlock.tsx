import React from 'react';
import IsLocalProvider from '../../context/IsLocalProvider.js';

export type LineList = {
  category: string;
  isLocal: boolean;
  lines: React.ReactNode[];
};
const OutlineBlock = ({ type, lists }: { type: string; lists: LineList[] }): React.ReactNode => {
  return (
    <div
      style={{ fontFamily: "'Roboto Mono', monospace" }}
      className="bg-[#151B1B] p-4 rounded-lg mb-8"
    >
      <h2 className="text-xl text-[#1cc489] font-bold mb-4">{type}</h2>
      {lists
        .filter(list => list.lines.length > 0)
        .map((list, index, filteredList) => (
          <IsLocalProvider isLocal={list.isLocal}>
            <div key={index} className="relative">
              {list.category && (
                <h3 className="text-[0.7rem] text-[#688787] font-semibold absolute top-0 right-0 px-2">
                  {list.category}
                </h3>
              )}
              <ul className="list-none pl-0 mt-8">
                {list.lines.map((line, lineIndex) => (
                  <li key={lineIndex} className="my-1">
                    <div className={`${!list.isLocal ? 'text-[#a9bcbc]' : 'text-[#e2e9e9]'}`}>
                      {line}
                    </div>
                  </li>
                ))}
              </ul>
              {index !== filteredList.length - 1 && <hr className="border-t border-gray-300" />}
            </div>
          </IsLocalProvider>
        ))}
    </div>
  );
};

export default OutlineBlock;
