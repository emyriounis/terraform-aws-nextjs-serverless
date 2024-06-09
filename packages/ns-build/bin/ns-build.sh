#!/bin/bash


# List of packages to copy directly on the lambda or ALL packages, instead of the layer
copyAllPackages=false
for ARGUMENT in "$@"
do
  KEY="$(echo "$ARGUMENT" | cut -f1 -d=)"

  if [ "$KEY" == --copyAllPackages ]; then
    copyAllPackages=true
  elif [[ "$KEY" == --packages-to-copy* ]]; then
    KEY_LENGTH=${#KEY}
    VALUE="${ARGUMENT:$KEY_LENGTH+1}"

    IFS=',' read -r -a packages_to_copy <<< "$VALUE"
  fi
done

# Clean-up old builds
test -d .next && rm -r .next
test -d .ns-build && rm -r .ns-build
test -d deployments && rm -r deployments

# Prepare build directory
mkdir -p .ns-build

# Hook for cleaning up failed builds.
function cleanup {
  # Clean up interrupted code injection build.
  if [ -d .ns-build/app-backup ] ; then
    # Try to be safe in preserving the original app directory.
    # However, note the lack of error checking.
    test -d .ns-build/app-injected && rm -r .ns-build/app-injected
    mv app .ns-build/app-injected
    test -d app && rm -r app
    mv .ns-build/app-backup app
  fi

  # Remove installed node modules
  npm uninstall serverless serverless-esbuild esbuild serverless-http ns-img-opt ns-img-rdr

  test -d .next && rm -r .next

  # Keep the '.ns-build' and 'deployments' directories.
  #   'deployments' contains the generated sources,
  #   '.ns-build' contains the back-ups for bad previous cleanup attempts.
  # Some parts of the .ns-build, though, do not need to stick around.
  test -d .ns-build/nodejs && rm -r .ns-build/nodejs
}
trap cleanup EXIT INT HUP TERM

# Install necessary packages
npm i -D \
  serverless@3.38.0 serverless-esbuild@1.49.0 esbuild@0.19.7 serverless-http@3.2.0 ns-img-opt@1.0.2 ns-img-rdr@1.0.2 \
  || exit 1

# Inject code in build
if [ -d app ] ; then
  # Note that cleanup from this happens if something fails.
  cp -a app .ns-build/app-backup || exit 1
  find app -type f -name 'page.tsx' -exec sh -c 'printf "\nexport const runtime = '\''edge'\'';\n" >> "$0"' {} \;
fi
npm run build || exit 1


# Prepare deployment
mkdir -p deployments || exit 1
mkdir -p .ns-build || exit 1

# Keep necessary files
cp -a .next/static .next/standalone/.next || exit 1
cp -a .next/standalone .ns-build/standalone || exit 1
rm .ns-build/standalone/server.js || exit 1
cp node_modules/ns-build/server.js .ns-build/standalone || exit 1
cp next.config.js .ns-build/standalone || exit 1

# Keeps necessary node modules
cp -a .ns-build/standalone/node_modules .ns-build/nodejs || exit 1
cp -a node_modules/serverless .ns-build/nodejs/node_modules || exit 1
cp -a node_modules/serverless-esbuild .ns-build/nodejs/node_modules || exit 1
cp -a node_modules/esbuild .ns-build/nodejs/node_modules || exit 1
cp -a node_modules/serverless-http .ns-build/nodejs/node_modules || exit 1

# Zip node modules
echo "Generating layer.zip ..."
( cd .ns-build/ && zip -r -q ../deployments/layer.zip nodejs ) || exit 1
echo "layer.zip generated !"

# Keep image optimization/redirection source code zips
mkdir -p deployments/ns-img-rdr || exit 1
mkdir -p deployments/image-optimization || exit 1
cp node_modules/ns-img-rdr/source.zip deployments/ns-img-rdr/ || exit 1
cp node_modules/ns-img-opt/source.zip deployments/image-optimization/ || exit 1

# Keep necessary files
mkdir -p .ns-build/standalone/static/_next || exit 1
cp -a .ns-build/standalone/.next/static .ns-build/standalone/static/_next || exit 1

# Prepare source code
test -d .ns-build/standalone/node_modules && rm -r .ns-build/standalone/node_modules

# optinal: add node_modules
if [ $copyAllPackages == true ]; then
  cp -a .next/standalone/node_modules .ns-build/standalone/node_modules || exit 1
else
  mkdir node_modules
  for package in "${packages_to_copy[@]}"
  do
    cp -a node_modules/$package .ns-build/standalonenode_modules/$package || exit 1
  done
fi

# zip source code
echo "Generating source.zip ..."
( cd .ns-build/standalone && zip -r -q ../../deployments/source.zip * .[!.]* ) || exit 1
echo "source.zip generated !"
