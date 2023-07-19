const templates = [
  'generic',
  'chess',
  'rock-paper-scissors',
  'open-world',
  'nft-lvlup',
  'web-2.5',
] as const;
export type Template = (typeof templates)[number];
