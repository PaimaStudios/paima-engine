import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaucetLink } from './FaucetLink';

test('renders usable external navigation without wallet state', () => {
  const href = 'https://mint-test-tokens.pages.dev/?network=preprod';

  expect(renderToStaticMarkup(createElement(FaucetLink, { href }))).toContain(
    `<a class="zs-nav-tab" href="${href}">Faucet</a>`,
  );
  expect(renderToStaticMarkup(createElement(FaucetLink, { href, mobile: true }))).toContain(
    `href="${href}"`,
  );
});
