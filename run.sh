#! /bin/sh
# migrate the database, then run pm2

# migrate the database
echo "Migrating the database..."
yarn db-init

if ! [ -x "$(command -v pm2)" ]; then
  npm i -g pm2
fi

# run pm2
pm2-runtime ecosystem.config.js
