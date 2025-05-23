#!/bin/bash


# List of packages to copy directly on the lambda or ALL packages, instead of the layer
copyAllPackages=false
for ARGUMENT in "$@"
do
  KEY=$(echo $ARGUMENT | cut -f1 -d=)

  if [[ $KEY == --copyAllPackages ]]; then
    copyAllPackages=true
  elif [[ $KEY == --packages-to-copy* ]]; then
    KEY_LENGTH=${#KEY}
    VALUE="${ARGUMENT:$KEY_LENGTH+1}"

    IFS=',' read -r -a packages_to_copy <<< "$VALUE"
  fi
done

# Clean-up old builds
rm -r .next
rm -r standalone
rm -r deployments

# Install necessary packages
npm i -D serverless@3.38.0 serverless-esbuild@1.49.0 esbuild@0.19.7 serverless-http@3.2.0 ns-img-opt@1.8.1 ns-img-rdr@1.8.1

# Inject code in build, and cleanup
cp -a ./app ./app-backup
find ./app -type f -name 'page.tsx' -exec sh -c 'printf "\nexport const runtime = '\''edge'\'';\n" >> "$0"' {} \;
set -e
npm run build
set +e
rm -r ./app
mv ./app-backup ./app

# Keep necessary files
cp -a .next/static .next/standalone/.next
cp -a .next/standalone standalone
rm standalone/server.js
cp node_modules/ns-build/server.js standalone
cp next.config.js standalone

# Prepare deployment
mkdir deployments
mkdir standalone
mkdir nodejs

# Keeps necessary node modules
cp -a standalone/node_modules nodejs
cp -a node_modules/serverless nodejs/node_modules
cp -a node_modules/serverless-esbuild nodejs/node_modules
cp -a node_modules/esbuild nodejs/node_modules
cp -a node_modules/serverless-http nodejs/node_modules

# Zip node modules
echo "Generating layer.zip ..."
zip -r -q deployments/layer.zip nodejs
echo "layer.zip generated !"

# Keep image optimization/redirection source code zips
cd deployments
mkdir ns-img-rdr
mkdir image-optimization
cd ..
cp node_modules/ns-img-rdr/source.zip deployments/ns-img-rdr/
cp node_modules/ns-img-opt/source.zip deployments/image-optimization/

# Keep necessary files
cd standalone
mkdir -p static/_next
cp -a .next/static static/_next

# Prepare source code
rm -r node_modules

# optinal: add node_modules
if [[ $copyAllPackages == true ]]; then
  cp -a ../.next/standalone/node_modules node_modules
else
  mkdir node_modules
  for package in "${packages_to_copy[@]}"
  do
    cp -a ../node_modules/$package node_modules/$package
  done
fi

# zip source code
echo "Generating source.zip ..."
zip -r -q ../deployments/source.zip * .[!.]*
echo "source.zip generated !"
cd ..

# Clean-up
rm -r .next
# rm -r standalone
rm -r nodejs

# Remove installed node modules
npm uninstall serverless serverless-esbuild esbuild serverless-http ns-img-opt ns-img-rdr
