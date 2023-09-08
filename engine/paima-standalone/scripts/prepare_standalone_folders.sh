PACKAGED_PATH="./paima-standalone/packaged"
mkdir -p $PACKAGED_PATH

SDK_PATH="$PACKAGED_PATH/paima-sdk"
CONTRACT_PATH="$PACKAGED_PATH/contracts"
DOC_PATH="$PACKAGED_PATH/documentation"
TEMPLATES_PATH="$PACKAGED_PATH/templates"
BATCHER_PATH="$PACKAGED_PATH/batcher"

# Prepare stage
rm -rf $SDK_PATH
mkdir $SDK_PATH
npm run build:sdk

# SDK_MODULES=( "paima-concise" "paima-db" "paima-executors" "paima-mw-core" "paima-prando" "paima-utils" "paima-crypto" "paima-providers" )

# Prepare SDK modules
module="paima-concise"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-executors"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-prando"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-utils"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-utils-backend"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-crypto"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-providers"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-mw-core"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
mkdir $SDK_PATH/$module/web
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json
cp $module/web/index.html $SDK_PATH/$module/web/index.html
cp -r $module/web/TemplateData $SDK_PATH/$module/web/TemplateData
cp $module/esbuildconfig.cjs $SDK_PATH/$module/esbuildconfig.cjs

module="paima-db"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json


# Prepare SDK root folder files
# remove husky from "SDK" package.json to avoid using it in user templates
sed 's/husky install && //g' package.json > $SDK_PATH/package.json
cp package-lock.json $SDK_PATH/package-lock.json


# Prepare smart contracts to be packed
paima="paima-l2-contract"
echo $CONTRACT_PATH
rm -rf $CONTRACT_PATH
mkdir -p $CONTRACT_PATH/$paima/src
cp -r ../contracts/$paima/src $CONTRACT_PATH/$paima
cp ../contracts/$paima/contract-addresses.json $CONTRACT_PATH/$paima
cp ../contracts/$paima/package.json $CONTRACT_PATH/$paima
cp ../contracts/$paima/package-lock.json $CONTRACT_PATH/$paima
cp ../contracts/$paima/truffle-config.js $CONTRACT_PATH/$paima
git clean -Xdf ../contracts/nft
cp -r ../contracts/nft $CONTRACT_PATH/nft

# Prepare batcher:
component="paima-batcher"
echo $BATCHER_PATH
rm -rf $BATCHER_PATH
cp -r ../batcher/batcher-standalone/packaged/@standalone/batcher $BATCHER_PATH

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
