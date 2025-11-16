#!/usr/bin/env python3
"""
Fix no-explicit-any violations by removing eslint-disable comments and replacing 'any' with proper types.
"""

from pathlib import Path
import re

# Map of files to line numbers where the eslint-disable comment appears
# The format is: (comment_line, replacement_map)
# replacement_map is a dict of old_type -> new_type for that line's code
fixes = {
    'src/audio/engine.ts': {
        67: ('any', 'ToneAudioNode'),  # instrumentEffects Map value
        172: ('any[]', 'ToneAudioNode[]'),  # getEffectChain return
        177: ('any', 'new (...args: unknown[]) => ToneAudioNode'),  # addEffectToChain effectType
        194: ('any[]', 'ToneAudioNode[]'),  # setEffectChain effects param
        202: ('any', 'ToneAudioNode'),  # getEffect return
        207: ('any', 'new (...args: unknown[]) => ToneAudioNode'),  # replaceEffect newEffectType
        227: ('any', 'ToneAudioNode'),  # getEffectInstance return
        235: ('any', 'new (...args: unknown[]) => ToneAudioNode'),  # createEffect EffectClass
        240: ('any', 'ToneAudioNode'),  # effect variable
        245: ('any', 'ToneAudioNode'),  # effect variable
        251: ('any', 'ToneAudioNode'),  # effect variable
        257: ('any', 'ToneAudioNode'),  # effect variable
        262: ('any', 'ToneAudioNode'),  # effect variable
        267: ('any', 'ToneAudioNode'),  # effect variable
        272: ('any', 'ToneAudioNode'),  # effect variable
        277: ('any', 'ToneAudioNode'),  # effect variable
        282: ('any', 'ToneAudioNode'),  # effect variable
        602: ('any', 'unknown'),  # effects array element
        859: ('any', 'unknown'),  # effects array element
        1351: ('any', 'ToneAudioNode'),  # effect
        5418: ('any', 'unknown'),  # error catch
        5493: ('any', 'unknown'),  # error catch
    },
    'src/audio/layers/MusicalGenreEngine.ts': {
        68: ('any', 'unknown'),
        73: ('any', 'unknown'),
        75: ('any', 'unknown'),
        80: ('any', 'unknown'),
        314: ('any', 'unknown'),
        383: ('any', 'unknown'),
        467: ('any', 'unknown'),
        535: ('any', 'unknown'),
    },
    'src/graph/GraphRenderer.ts': {
        1057: ('any', 'unknown'),
        1076: ('any', 'unknown'),
        1567: ('any', 'unknown'),
        1569: ('any', 'unknown'),
        1571: ('any', 'unknown'),
        1599: ('any', 'unknown'),
        1661: ('any', 'unknown'),
        1701: ('any', 'unknown'),
        2033: ('any', 'unknown'),
        2084: ('any', 'unknown'),
    },
    'src/graph/TemporalGraphAnimator.ts': {
        646: ('any', 'unknown'),
        648: ('any', 'unknown'),
        650: ('any', 'unknown'),
    },
    'src/graph/musical-mapper.ts': {
        612: ('any', 'unknown'),
    },
    'src/graph/types.ts': {
        40: ('any', 'Record<string, unknown>'),
        123: ('any', 'unknown'),
        125: ('any', 'unknown'),
        127: ('any', 'unknown'),
    },
    'src/logging.ts': {
        179: ('any', 'Record<string, unknown>'),
    },
    'src/main.ts': {
        1002: ('any', 'unknown'),
    },
    'src/ui/GraphDemoModal.ts': {
        27: ('any', 'unknown'),
        29: ('any', 'unknown'),
        151: ('any', 'unknown'),
        155: ('any', 'unknown'),
        195: ('any', 'unknown'),
        200: ('any', 'unknown'),
        211: ('any', 'unknown'),
        217: ('any', 'unknown'),
        222: ('any', 'unknown'),
        235: ('any', 'unknown'),
        237: ('any', 'unknown'),
        239: ('any', 'unknown'),
        241: ('any', 'unknown'),
        304: ('any', 'unknown'),
        338: ('any', 'unknown'),
    },
    'src/ui/LocalSoundscapeView.ts': {
        55: ('any', 'unknown'),
        1217: ('any', 'unknown'),
        2854: ('any', 'unknown'),
    },
    'src/ui/SonicGraphView.ts': {
        157: ('any', 'unknown'),
        230: ('any', 'unknown'),
        759: ('any', 'unknown'),
        4932: ('any', 'unknown'),
        4974: ('any', 'unknown'),
        5060: ('any', 'unknown'),
        5138: ('any', 'unknown'),
        5559: ('any', 'unknown'),
        5687: ('any', 'unknown'),
        6257: ('any', 'unknown'),
        6485: ('any', 'unknown'),
        6609: ('any', 'unknown'),
        6772: ('any', 'unknown'),
        6843: ('any', 'unknown'),
        7577: ('any', 'unknown'),
        7703: ('any', 'unknown'),
        7912: ('any', 'unknown'),
        8125: ('any', 'unknown'),
    },
    'src/ui/control-panel.ts': {
        45: ('any', 'unknown'),
        49: ('any', 'unknown'),
        51: ('any', 'unknown'),
        66: ('any', 'unknown'),
        75: ('any', 'unknown'),
        80: ('any', 'unknown'),
        88: ('any', 'unknown'),
        1055: ('any', 'unknown'),
        1067: ('any', 'unknown'),
        1168: ('any', 'unknown'),
        2240: ('any', 'unknown'),
        2810: ('any', 'unknown'),
        2863: ('any', 'unknown'),
        3121: ('any', 'unknown'),
        3884: ('any', 'unknown'),
    },
    'src/ui/material-components.ts': {
        18: ('any', 'unknown'),
        792: ('any', 'unknown'),
    },
    'src/visualization/SpectrumRenderer.ts': {
        70: ('any', 'unknown'),
    },
}

def fix_file(file_path, line_map):
    """Fix no-explicit-any violations in a file."""
    path = Path(file_path)
    if not path.exists():
        print(f"❌ File not found: {file_path}")
        return 0

    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changes = 0
    needs_tone_import = False

    for comment_line, (old_type, new_type) in line_map.items():
        if comment_line > len(lines):
            continue

        comment_idx = comment_line - 1
        code_idx = comment_line  # The actual code with 'any' is on the next line

        # Remove the eslint-disable comment line
        if comment_idx < len(lines) and 'eslint-disable-next-line @typescript-eslint/no-explicit-any' in lines[comment_idx]:
            lines[comment_idx] = ''
            changes += 1

            # Replace 'any' with the proper type on the next line
            if code_idx < len(lines):
                original_line = lines[code_idx]
                # Use regex to replace the type more precisely
                # Handle cases like: ': any', ': any[]', ': any,', ': any)', ': any {', 'Map<string, any>'
                modified_line = re.sub(
                    r'\b' + re.escape(old_type) + r'\b',
                    new_type,
                    original_line,
                    count=1
                )

                if modified_line != original_line:
                    lines[code_idx] = modified_line
                    changes += 1

                    if 'ToneAudioNode' in new_type:
                        needs_tone_import = True

    # Add ToneAudioNode import if needed
    if needs_tone_import:
        # Check if tone import exists and if ToneAudioNode is already imported
        tone_import_idx = None
        has_tone_audio_node = False

        for i, line in enumerate(lines[:50]):
            if 'from \'tone\'' in line or 'from "tone"' in line:
                tone_import_idx = i
                if 'ToneAudioNode' in line:
                    has_tone_audio_node = True
                break

        if tone_import_idx is not None and not has_tone_audio_node:
            # Add ToneAudioNode to existing import
            import_line = lines[tone_import_idx]
            # Handle different import styles
            if import_line.strip().startswith('import {'):
                # Add to destructured import
                modified = import_line.rstrip().rstrip(';').rstrip()
                if modified.endswith('}'):
                    modified = modified[:-1] + ', ToneAudioNode }'
                    lines[tone_import_idx] = modified + ';\n'
                    changes += 1
            elif 'import *' in import_line:
                # Add a separate import line after the * import
                lines.insert(tone_import_idx + 1, 'import { ToneAudioNode } from \'tone\';\n')
                changes += 1

    if changes > 0:
        # Remove empty lines that were left by removing comments, but only if they create double blank lines
        cleaned_lines = []
        prev_was_empty = False
        for line in lines:
            is_empty = line.strip() == ''
            if is_empty and prev_was_empty:
                continue  # Skip consecutive empty lines
            cleaned_lines.append(line)
            prev_was_empty = is_empty

        # Write back
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(cleaned_lines)

        print(f"✅ {path} - {changes} changes")

    return changes

def main():
    print("🔧 Fixing no-explicit-any violations")
    print("   Removing eslint-disable comments and replacing 'any' with proper types")
    print()

    total_changes = 0

    for file_path, line_map in fixes.items():
        changes = fix_file(file_path, line_map)
        total_changes += changes

    print(f"\n✨ Total changes: {total_changes}")
    print("\n💡 After running this script, verify with:")
    print("   npm run lint 2>&1 | grep 'no-explicit-any' | wc -l")

if __name__ == '__main__':
    main()
