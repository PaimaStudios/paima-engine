PACKAGED_PATH="./paima-standalone/packaged"
rm -rf $PACKAGED_PATH
mkdir -p $PACKAGED_PATH/@standalone

CONTRACT_PATH="$PACKAGED_PATH/contracts"
DOC_PATH="$PACKAGED_PATH/documentation"
TEMPLATES_PATH="$PACKAGED_PATH/templates"
BATCHER_PATH="$PACKAGED_PATH/batcher"

# Prepare smart contracts to be packed
paima="paima-l2-contract"
echo $CONTRACT_PATH
rm -rf $CONTRACT_PATH
mkdir -p $CONTRACT_PATH/$paima/src
cp -r ../../contracts/$paima/src $CONTRACT_PATH/$paima
cp ../../contracts/$paima/contract-addresses.json $CONTRACT_PATH/$paima
cp ../../contracts/$paima/package.json $CONTRACT_PATH/$paima
cp ../../contracts/$paima/truffle-config.js $CONTRACT_PATH/$paima
git clean -Xdf ../../contracts/nft
cp -r ../../contracts/nft $CONTRACT_PATH/nft

# Prepare batcher:
component="paima-batcher"
echo $BATCHER_PATH
rm -rf $BATCHER_PATH
cp -r ../../batcher/batcher-standalone/packaged/@standalone/batcher $BATCHER_PATH
echo $BATCHER_PATH-bin
rm -rf $BATCHER_PATH-bin
cp -r ../../batcher/batcher-standalone/packaged/@standalone/batcher-bin $BATCHER_PATH-bin

# Fetch documentation
echo $DOC_PATH
rm -rf $DOC_PATH
git clone --depth=1 git@github.com:PaimaStudios/paima-engine-docs.git $DOC_PATH
# Remove everything except docs/home
find $DOC_PATH/* -not -path "$DOC_PATH/docs*" -delete
# Move the contents of docs/home to the root of $DOC_PATH
mv $DOC_PATH/docs/home/* $DOC_PATH
# Remove docs directory
rm -rf $DOC_PATH/docs
# remove all images (to limit standalone size)
find $DOC_PATH -type f -regextype posix-extended -regex '.*\.(png|jpg|jpeg|svg|gif|webp|bmp)' -delete
rm -rf $DOC_PATH/.git*


# Fetch templates
rm -rf $TEMPLATES_PATH
git clone --depth=1 git@github.com:PaimaStudios/paima-standalone-templates.git $TEMPLATES_PATH
rm -rf $TEMPLATES_PATH/.git
