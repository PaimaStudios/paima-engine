PACKAGED_PATH="./batcher-standalone/packaged"
rm -rf $PACKAGED_PATH
mkdir -p $PACKAGED_PATH

BATCHER_PATH="$PACKAGED_PATH/paima-batcher"

# Prepare stage
rm -rf $BATCHER_PATH
mkdir $BATCHER_PATH
npm run build

# BATCHER_MODULES=( "address-validator" "batcher-transaction-poster" "db" "game-input-validator" "runtime" "utils" "webserver" )

# Prepare BATCHER modules
module="address-validator"
echo $BATCHER_PATH/$module
mkdir $BATCHER_PATH/$module
cp -a $module/build/. $BATCHER_PATH/$module/build/
cp $module/README.md $BATCHER_PATH/$module/README.md
cp $module/package.json $BATCHER_PATH/$module/package.json

module="batcher-transaction-poster"
echo $BATCHER_PATH/$module
mkdir $BATCHER_PATH/$module
cp -a $module/build/. $BATCHER_PATH/$module/build/
cp $module/README.md $BATCHER_PATH/$module/README.md
cp $module/package.json $BATCHER_PATH/$module/package.json

module="db"
echo $BATCHER_PATH/$module
mkdir $BATCHER_PATH/$module
cp -a $module/build/. $BATCHER_PATH/$module/build/
cp $module/README.md $BATCHER_PATH/$module/README.md
cp $module/package.json $BATCHER_PATH/$module/package.json

module="game-input-validator"
echo $BATCHER_PATH/$module
mkdir $BATCHER_PATH/$module
cp -a $module/build/. $BATCHER_PATH/$module/build/
cp $module/README.md $BATCHER_PATH/$module/README.md
cp $module/package.json $BATCHER_PATH/$module/package.json

module="runtime"
echo $BATCHER_PATH/$module
mkdir $BATCHER_PATH/$module
cp -a $module/build/. $BATCHER_PATH/$module/build/
cp $module/README.md $BATCHER_PATH/$module/README.md
cp $module/package.json $BATCHER_PATH/$module/package.json

module="utils"
echo $BATCHER_PATH/$module
mkdir $BATCHER_PATH/$module
cp -a $module/build/. $BATCHER_PATH/$module/build/
cp $module/README.md $BATCHER_PATH/$module/README.md
cp $module/package.json $BATCHER_PATH/$module/package.json

module="webserver"
echo $BATCHER_PATH/$module
mkdir $BATCHER_PATH/$module
cp -a $module/build/. $BATCHER_PATH/$module/build/
cp $module/README.md $BATCHER_PATH/$module/README.md
cp $module/package.json $BATCHER_PATH/$module/package.json
