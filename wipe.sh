rm -rf node_modules */node_modules */*/node_modules
rm -rf */build
rm -f tsconfig.tsbuildinfo */tsconfig.tsbuildinfo

# Don't always want to delete package-lock (especially for CI)
if [[ "$1" != "keep-package-lock" ]]; then
    rm -f package-lock.json */package-lock.json
fi