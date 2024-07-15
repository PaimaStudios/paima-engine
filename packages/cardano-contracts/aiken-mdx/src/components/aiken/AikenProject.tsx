import React from 'react';
import AnchorProvider from '../../context/AnchorProvider.js';
import CodeBlock from '@docusaurus/theme-classic/lib/theme/CodeBlock';

const AikenProject = (props: {
  anchor: string;
  namespace: string;
  description: string;
  plutusVersion: string;
  githubLink: string;
  children: React.ReactNode;
}): React.ReactNode => {
  const [title, ...rest] = React.Children.toArray(props.children);
  return (
    <AnchorProvider anchor={props.anchor}>
      <div id={props.anchor} className="flex justify-between">
        <span style={{ fontFamily: "'Roboto Mono', monospace" }}>{title}</span>
        <span>
          <a href={props.githubLink}>
            <img
              className="-mb-0.5 mr-2"
              width="16`"
              height="16"
              src="https://github.githubassets.com/favicons/favicon-dark.png"
            />
          </a>
          <a href={`#${props.anchor}`}>#</a>
        </span>
      </div>
      <CodeBlock language="rust">{`use ${props.namespace}`}</CodeBlock>
      {props.description}
      {rest}
    </AnchorProvider>
  );
};

export default AikenProject;
