STANDALONE_DIR="./packaged/@standalone"
SUBDIR="batcher"
ls "$STANDALONE_DIR/"
mv "$STANDALONE_DIR/paima-batcher-linux" "$STANDALONE_DIR/$SUBDIR"
mv "$STANDALONE_DIR/paima-batcher-macos" "$STANDALONE_DIR/$SUBDIR"
mv "$STANDALONE_DIR/dev-paima-batcher-linux" "$STANDALONE_DIR/$SUBDIR"
mv "$STANDALONE_DIR/dev-paima-batcher-macos" "$STANDALONE_DIR/$SUBDIR"
cp -r "$(dirname "$0")/docker/." "$STANDALONE_DIR/$SUBDIR"

ENV_TEMPLATE=.env.devnet
cp "../$ENV_TEMPLATE" "$STANDALONE_DIR/$SUBDIR/$ENV_TEMPLATE"
