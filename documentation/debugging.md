
# Debugging 

Paima-Engine includes 4 binaries:
linux production
linux development
macos x64 production
macos x64 development
The binaries named "dev-*" run a node.js inspector. 
We recommend that for the development process, you use these dev builds and that for production environments, you use the production builds.

## How to debug

1. Launching your game with the `./dev-paima-engine-linux run` or `./dev-paima-engine-macos run` you will see a message similar to:

```
Debugger listening on ws://127.0.0.1:9229/e6e784f8-bcd8-4ace-8b17-9b515ae45f7d
For help, see: https://nodejs.org/en/docs/inspector
```

2 Open in a Google Chrome browser: `chrome://inspect`
You should see in `Remote Target` an entry with the name `PKG_DUMMY_ENTRYPOINT file:///` click on inspect.

NOTE: If you do not see the entry, in `Configure...` add `localhost:9229` where the actual port is the one informed in the message in step 1.

A new debug "DevTools" window will pop up. 

3 In the new DevTools, go to the `Sources` tab and click on `+ Add folder to workspace` select the folder `packaged` where your compiled game is located you should see `endpoints.cjs` and `gameCode.cjs` select this folder. 

The first time DevTools might request permission to access your hard drive: allow access.

4 Now you are ready to DEBUG.
In the `sources` tab you can place breakpoints in endpoint.cjs and gameCode.cjs by clicking on line-number on the left side of the line. 