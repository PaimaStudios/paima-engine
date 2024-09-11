function copyAssetsForBundle(outDir) {
  const path = require('path');
  const fs = require('fs');
  (() => {
    let asyncApiPath = path.dirname(require.resolve('@paima/runtime'));

    const from = path.join(asyncApiPath, 'public');
    const to = path.join(outDir, 'public');

    fs.cpSync(from, to, { recursive: true });
  })();

  (() => {
    let modulePath = path.dirname(require.resolve('@dcspark/cardano-multiplatform-lib-nodejs'));

    const wasm = 'cardano_multiplatform_lib_bg.wasm';

    const from = path.join(modulePath, wasm);

    fs.cpSync(from, path.join(outDir, wasm));
  })();

  (() => {
    let modulePath = path.dirname(require.resolve('swagger-ui-dist'));

    const from = modulePath;

    fs.cpSync(from, path.join(outDir, 'swagger-ui'), { recursive: true });
  })();
}

module.exports = { copyAssetsForBundle };
