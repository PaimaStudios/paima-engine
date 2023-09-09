STANDALONE_DIR="./packaged/@standalone"
SUBDIR="batcher"
SUBDIR_BIN=$SUBDIR-bin

echo "batcher post-build"

# binaries
mkdir -p "$STANDALONE_DIR/$SUBDIR_BIN/"
mv "$STANDALONE_DIR/paima-batcher-linux" "$STANDALONE_DIR/$SUBDIR_BIN/" 2>/dev/null
mv "$STANDALONE_DIR/paima-batcher-macos" "$STANDALONE_DIR/$SUBDIR_BIN/" 2>/dev/null
mv "$STANDALONE_DIR/dev-paima-batcher-linux" "$STANDALONE_DIR/$SUBDIR_BIN/" 2>/dev/null
mv "$STANDALONE_DIR/dev-paima-batcher-macos" "$STANDALONE_DIR/$SUBDIR_BIN/" 2>/dev/null

# docker configs
cp -r "./scripts/docker/." "$STANDALONE_DIR/$SUBDIR/"

# default env vars
ENV_TEMPLATE=.env.devnet
cp "../$ENV_TEMPLATE" "$STANDALONE_DIR/$SUBDIR/$ENV_TEMPLATE"

# SQL initialization
mkdir -p "$STANDALONE_DIR/$SUBDIR/db"
cp -r "../db/migrations" "$STANDALONE_DIR/$SUBDIR/db/"