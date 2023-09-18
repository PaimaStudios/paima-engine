#!/usr/bin/env sh

echo "Packaging Middleware"

node --require dotenv/config ./esbuildconfig.cjs
echo "Finished Packaging"

echo "Vanilla Middleware (With Exports) Prepared In: packaged/middleware.js"

head -n $(( $(grep -n '^export {' packaged/middleware.js | head -1 | cut -d: -f1) - 1 )) packaged/middleware.js > packaged/paimaMiddleware.js
