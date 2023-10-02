# Paima Build Utils

A common place to store utility scripts to help build Paima projects on various platforms

These are provided as part of Paima itself to avoid the need for projects depending on Paima to update their build scripts for every internal change in Paima engine

**Note**: This module comes with both ESM and CommonJS files, but only the ESM files are exposed through `paima-sdk`. Use this module directly if you need CommonJS.

You can find the full docs for Paima [here](https://docs.paimastudios.com/). \
**Note**: This is not part of the [@paima/sdk](https://www.npmjs.com/package/@paima/sdk) package as typically you will want this in your `devDependencies` unlike `@paima/sdk`, and unlike `@paima/sdk` this package is not purely ESM modules.
