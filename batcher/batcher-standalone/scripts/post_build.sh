STANDALONE_DIR="./packaged/@standalone"
SUBDIR="batcher"
mv "$STANDALONE_DIR/paima-batcher-linux" "$STANDALONE_DIR/$SUBDIR/" 2>/dev/null
mv "$STANDALONE_DIR/paima-batcher-macos" "$STANDALONE_DIR/$SUBDIR/" 2>/dev/null
mv "$STANDALONE_DIR/dev-paima-batcher-linux" "$STANDALONE_DIR/$SUBDIR/" 2>/dev/null
mv "$STANDALONE_DIR/dev-paima-batcher-macos" "$STANDALONE_DIR/$SUBDIR/" 2>/dev/null
cp -r "./scripts/docker/." "$STANDALONE_DIR/$SUBDIR/"

ENV_TEMPLATE=.env.devnet
cp "../$ENV_TEMPLATE" "$STANDALONE_DIR/$SUBDIR/$ENV_TEMPLATE"

mkdir -p "$STANDALONE_DIR/$SUBDIR/db"
cp -r "../db/migrations" "$STANDALONE_DIR/$SUBDIR/db/"