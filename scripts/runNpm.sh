#!/bin/bash

# This script runs an NPM command ($COMMAND) on all NPM projects
# We do this because NPM only supports fake nested workspaces at the time of writing
# i.e. a single root that contains workspaces from multiple folders
# workspaces: [ "engine/utils", "batcher/utils" ]

# Determine the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if the command argument is passed
if [ "$#" -ne 1 ] && [ "$#" -ne 2 ]; then
    echo "Usage: $0 <npm_command> <?project>"
    exit 1
fi

execute_npm_command() {
    local project="$1"
    local cmd="$2"

    echo "Running npm $cmd for project: $project"

    if [[ $cmd == run* ]]; then
        npm $cmd -if-present --prefix "$project"
    else
        npm "$cmd" --prefix "$project"
    fi
}


COMMAND=$1
PROJECT=$2

echo $COMMAND

# If a project is provided as an argument, use it. Otherwise, default to reading from projects.txt.
if [ -n "$PROJECT" ]; then
    execute_npm_command "$PROJECT" "$COMMAND"
else
    while read -r project; do
        execute_npm_command "$project" "$COMMAND"  
    done < "$DIR/projects.txt"
fi
