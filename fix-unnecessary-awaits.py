#!/usr/bin/env python3
"""
Fix unnecessary await keywords on non-Promise expressions.
"""

from pathlib import Path
import re

# Map of file paths to line numbers where unnecessary awaits exist
affected_files = {
    'src/audio/clustering/CommunityAudioAnalyzer.ts': [84],
    'src/audio/engine.ts': [480, 491],
    'src/audio/layers/ContinuousLayerManager.ts': [458],
    'src/audio/layers/FreesoundSampleLoader.ts': [76],
    'src/audio/layers/MusicalGenreEngine.ts': [236, 351, 558],
    'src/audio/mapping/ContentAwareMapper.ts': [188, 235, 242, 1614, 1636, 1915],
    'src/audio/mapping/DepthBasedMapper.ts': [517, 535],
    'src/audio/mapping/FileTypeAnalyzer.ts': [166, 172],
    'src/external/freesound/client.ts': [298],
    'src/external/freesound/whale-audio-manager.ts': [486],
    'src/graph/GraphRenderer.ts': [1534],
    'src/graph/musical-mapper.ts': [385],
    'src/ui/LocalSoundscapeView.ts': [1276, 1422, 1457, 2233],
    'src/ui/SonicGraphView.ts': [1179, 6105],
    'src/ui/components.ts': [114],
    'src/ui/control-panel.ts': [2467, 2498],
}

def remove_unnecessary_await(file_path, line_numbers):
    """Remove unnecessary await keywords from specific lines in a file."""
    path = Path(file_path)
    if not path.exists():
        print(f"❌ File not found: {file_path}")
        return 0

    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changes = []

    for line_num in line_numbers:
        if line_num > len(lines):
            continue

        line_idx = line_num - 1
        original_line = lines[line_idx]

        # Remove 'await ' (with trailing space) from the line
        # This pattern handles various cases like:
        # - await someFunc()
        # - const x = await value
        # - return await result
        modified_line = re.sub(r'\bawait\s+', '', original_line, count=1)

        if modified_line != original_line:
            lines[line_idx] = modified_line
            changes.append({
                'line': line_num,
                'old': original_line.strip(),
                'new': modified_line.strip()
            })

    if changes:
        # Write back
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        print(f"\n✅ {path} - {len(changes)} changes:")
        for change in changes[:3]:  # Show first 3
            print(f"   Line {change['line']}:")
            print(f"     - {change['old']}")
            print(f"     + {change['new']}")
        if len(changes) > 3:
            print(f"   ... and {len(changes) - 3} more")

    return len(changes)

def main():
    print("🔧 Removing unnecessary await keywords")
    print()

    total_changes = 0

    for file_path, line_numbers in affected_files.items():
        changes = remove_unnecessary_await(file_path, line_numbers)
        total_changes += changes

    print(f"\n✨ Total changes: {total_changes}")
    print("\n💡 After running this script, verify with:")
    print("   npm run lint 2>&1 | grep '@typescript-eslint/await-thenable'")

if __name__ == '__main__':
    main()
