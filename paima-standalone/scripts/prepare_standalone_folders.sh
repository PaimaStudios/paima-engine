PACKAGED_PATH="./paima-standalone/packaged"

SDK_PATH="$PACKAGED_PATH/paima-sdk"
CONTRACT_PATH="$PACKAGED_PATH/smart-contract"
DOC_PATH="$PACKAGED_PATH/documentation"
TEMPLATES_PATH="$PACKAGED_PATH/templates"

# Prepare stage
rm -rf $SDK_PATH
mkdir $SDK_PATH
npm run build:sdk

# SDK_MODULES=( "paima-concise" "paima-db" "paima-executors" "paima-mw-core" "paima-prando" "paima-utils" )

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

module="paima-mw-core"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

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


# Prepare smart contract project to be packed
echo $CONTRACT_PATH
rm -rf $CONTRACT_PATH
mkdir $CONTRACT_PATH
cp -r paima-l2-contract/src $CONTRACT_PATH
cp -r paima-l2-contract/package.json $CONTRACT_PATH
cp -r paima-l2-contract/truffle-config.js $CONTRACT_PATH
# cp -r storage-contract/ $CONTRACT_PATH


# Prepare documentation to be packed
echo $DOC_PATH
rm -rf $DOC_PATH
cp -r paima-standalone/user-documentation $DOC_PATH


# Fetch templates
rm -rf $TEMPLATES_PATH
git clone --depth=1 git@github.com:PaimaStudios/paima-standalone-templates.git $TEMPLATES_PATH
rm -rf $TEMPLATES_PATH/.git
