import React from 'react';

/**
 * For tools like Docusaurus, headers must be defined
 * - statically (ex: ## Foo)
 * - not dynamically (using tags like h1 in JSX)
 */
const HeaderWrapper = (props: { children: React.ReactNode }) => {
  return props.children;
};

export default HeaderWrapper;
