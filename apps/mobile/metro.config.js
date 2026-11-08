// Expo's default config already understands npm workspaces (watches packages/*,
// resolves hoisted node_modules), so the monorepo needs no extra Metro setup.
const { getDefaultConfig } = require('expo/metro-config')

module.exports = getDefaultConfig(__dirname)
