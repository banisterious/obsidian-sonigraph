#!/bin/bash

# Deploy script for Sonigraph plugin to Obsidian vault
# Copies built files from WSL to Windows Obsidian installation

PLUGIN_DIR="/home/fitz/projects/obsidian-plugins/sonigraph"
VAULT_PLUGIN_DIR="/mnt/d/Vaults/Banister/.obsidian/plugins/sonigraph"

echo "🔨 Building plugin..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"

    echo "📦 Copying files to Obsidian vault..."
    cp "$PLUGIN_DIR/main.js" "$VAULT_PLUGIN_DIR/main.js"
    cp "$PLUGIN_DIR/styles.css" "$VAULT_PLUGIN_DIR/styles.css"
    cp "$PLUGIN_DIR/manifest.json" "$VAULT_PLUGIN_DIR/manifest.json"

    if [ $? -eq 0 ]; then
        echo "✅ Files copied successfully!"
        echo "📍 Location: $VAULT_PLUGIN_DIR"
        echo ""
        echo "🔄 Next steps:"
        echo "   1. Reload Obsidian (Ctrl+R)"
        echo "   2. Test your changes!"
    else
        echo "❌ Failed to copy files"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
