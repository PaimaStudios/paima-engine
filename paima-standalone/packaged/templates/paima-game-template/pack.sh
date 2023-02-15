npm run build

BUNDLE_WORKSPACE=api node ./esbuildconfig.cjs

BUNDLE_WORKSPACE=backend node ./esbuildconfig.cjs

cp -a ./packaged/. ..



echo "✅ Game code bundled and prepared in the parent folder."
echo "To start your game node, simply use: ./paima-engine run"
