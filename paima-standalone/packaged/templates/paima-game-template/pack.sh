npm run build

BUNDLE_WORKSPACE=api node ./esbuildconfig.cjs

BUNDLE_WORKSPACE=backend node ./esbuildconfig.cjs

cp -a ./packaged/. ..

echo "✅ User code prepared in standalone parent folder."
