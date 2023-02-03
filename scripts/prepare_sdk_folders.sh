SDK_PATH="./paima-standalone/packaged/sdk"

# Prepare stage
rm -rf $SDK_PATH
mkdir $SDK_PATH
npm run build:sdk

# SDK_MODULES=( "paima-concise" "paima-executors" "paima-prando" "paima-tx" "paima-utils")

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

module="paima-tx"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

module="paima-utils"
echo $SDK_PATH/$module
mkdir $SDK_PATH/$module
cp -a $module/build/. $SDK_PATH/$module/build/
cp $module/README.md $SDK_PATH/$module/README.md
cp $module/package.json $SDK_PATH/$module/package.json

# Prepare SDK root folder files
cp -a node_modules/. $SDK_PATH/node_modules/
cp package.json $SDK_PATH/package.json
cp package-lock.json $SDK_PATH/package-lock.json
