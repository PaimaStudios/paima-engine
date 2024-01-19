if ! pgrep -u "$USER" ssh-agent > /dev/null; then
    echo "Error: ssh-agent not detected. Build process may hang. Are you sure you want to conitnue?" >&2
    echo "To run an ssh-agent, use the following:"
    echo 'eval "$(ssh-agent -s)"'
    echo "ssh-add ~/.ssh/your_github_key"
    echo 'Press any key to continue once done'
    read _
fi
