#!/usr/bin/env python3
"""
Fix sentence case violations in UI text while preserving feature names and proper nouns.
"""

import re
from pathlib import Path

# Terms that should always remain in their current case (feature names, proper nouns, etc.)
PRESERVE_TERMS = [
    'Sonigraph',
    'Sonic Graph',
    'Local Soundscape',
    'Control Center',
    'Content-Aware Mapping',
    'Freesound',
    'GitHub',
    'MIDI',
    'BPM',
    'API',
    'UI',
    'CSS',
    'JSON',
    'WAV',
    'MP3',
    'WebGL',
    'AI',
    'OK',
    'ID',
]

# Read the affected lines from the summary
affected_files = {
    'src/audio/mapping/ConnectionTypeMappingPanel.ts': [123, 180, 196, 197, 219, 245, 251, 262, 266, 280, 294, 311, 322, 338, 406, 430, 453, 466, 472, 486, 500, 514, 517, 529, 542, 545, 556, 567, 583, 588, 599, 612, 630, 635, 648, 661, 679, 684, 695, 706, 717, 736, 751, 785, 793, 801],
    'src/audio/mapping/ConnectionTypePresetManager.ts': [511],
    'src/export/ExportModal.ts': [88, 111, 149, 244, 254, 324, 328, 373, 378, 383, 384, 404, 405, 406, 420, 430, 431, 447, 470, 481, 534, 545, 548, 561, 575, 589, 619, 633, 809, 810, 811, 816, 818],
    'src/export/FileCollisionModal.ts': [52],
    'src/main.ts': [52, 59, 68, 77, 91],
    'src/templates/ui/TemplateTabsModal.ts': [66, 277, 295, 315, 355, 377, 388, 402, 414, 431, 445, 457, 469, 485, 591, 597, 602],
    'src/ui/FreesoundSearchModal.ts': [76, 101, 248, 251, 252, 253, 329, 632, 639],
    'src/ui/GraphDemoModal.ts': [46, 253, 262, 266, 270],
    'src/ui/LocalSoundscapeFilterModal.ts': [40, 57, 78, 85, 101, 137, 144, 160, 196, 222],
    'src/ui/LocalSoundscapeView.ts': [155, 261, 314, 588, 599, 603, 1263, 2098, 2186, 2228, 2402],
    'src/ui/SampleTableBrowser.ts': [77, 80, 137, 158, 275, 549, 647, 703, 709],
    'src/ui/SonicGraphView.ts': [150, 934, 973, 982, 1061, 1445, 1475, 1518, 1524, 1674, 1708, 1712, 1742, 1747, 1782, 1863, 2047, 2085, 2121, 2188, 2256, 2289, 2320, 2321, 2331, 2344, 2357, 2384, 2397, 2412, 2422, 2434, 2929, 2997, 2998, 2999, 3032, 3076, 3077, 3078, 3079, 3080, 3081, 3082, 3083, 3084, 3085, 3086, 3087, 3088, 3185, 3186, 3187, 3188, 3189, 3245, 3324, 3355, 3408, 3467, 3517, 3528, 3579, 3607, 3640, 3673, 3724, 3789, 3864, 3895, 3948, 3998, 4061, 4100, 4139, 4175, 4186, 4234, 4262, 4305, 4342, 4379, 4400, 4421, 4475, 4486, 4532, 4553, 4583, 4613, 4643, 4697, 4708, 4779, 4814, 4844, 4878, 5314, 5354, 6077],
    'src/ui/control-panel.ts': [475, 479, 483, 501, 503, 508, 515, 517, 522, 524, 540, 546, 548, 549, 550, 554, 556, 557, 561, 563, 564, 568, 585, 589, 593],
}

def to_sentence_case(text):
    """
    Convert text to sentence case while preserving certain terms.
    Handles multiple sentences separated by periods or colons.
    """
    if not text or not isinstance(text, str):
        return text

    # Don't modify if it's already all lowercase or already sentence case
    if text.islower() or (text[0].isupper() and text[1:].islower()):
        return text

    # Check if this contains any preserve terms - if so, handle carefully
    for term in PRESERVE_TERMS:
        if term in text:
            # Build a regex pattern that preserves the term
            # We'll do a more sophisticated replacement
            parts = []
            remaining = text

            while term in remaining:
                idx = remaining.find(term)
                before = remaining[:idx]
                after = remaining[idx + len(term):]

                # Convert the part before the preserved term
                if before:
                    before = before[0].upper() + before[1:].lower() if before else before

                parts.append(before)
                parts.append(term)  # Preserve exactly
                remaining = after

            # Handle remaining text
            if remaining:
                remaining = remaining[0].upper() + remaining[1:].lower() if remaining else remaining
                parts.append(remaining)

            return ''.join(parts)

    # Simple case: no preserved terms
    # Capitalize first letter, lowercase the rest
    return text[0].upper() + text[1:].lower()

def fix_sentence_case_in_file(file_path, line_numbers):
    """Fix sentence case on specific lines in a file."""
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
        modified_line = original_line

        # Find text in quotes (single or double)
        # Pattern: text: 'Some Text' or .setName('Some Text') or { text: 'Some Text' }
        patterns = [
            (r"text:\s*'([^']+)'", "'"),
            (r'text:\s*"([^"]+)"', '"'),
            (r"\.setName\('([^']+)'\)", "'"),
            (r'\.setName\("([^"]+)"\)', '"'),
            (r"\.setDesc\('([^']+)'\)", "'"),
            (r'\.setDesc\("([^"]+)"\)', '"'),
            (r"\.createEl\([^,]+,\s*\{\s*text:\s*'([^']+)'", "'"),
            (r'\.createEl\([^,]+,\s*\{\s*text:\s*"([^"]+)"', '"'),
        ]

        for pattern, quote in patterns:
            matches = re.finditer(pattern, modified_line)
            for match in matches:
                original_text = match.group(1)
                new_text = to_sentence_case(original_text)

                if original_text != new_text:
                    # Replace in the line
                    old_full = match.group(0)
                    new_full = old_full.replace(original_text, new_text)
                    modified_line = modified_line.replace(old_full, new_full)
                    changes.append({
                        'line': line_num,
                        'old': original_text,
                        'new': new_text
                    })

        if modified_line != original_line:
            lines[line_idx] = modified_line

    if changes:
        # Write back
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        print(f"\n✅ {path} - {len(changes)} changes:")
        for change in changes[:5]:  # Show first 5
            print(f"   Line {change['line']}: '{change['old']}' → '{change['new']}'")
        if len(changes) > 5:
            print(f"   ... and {len(changes) - 5} more")

    return len(changes)

def main():
    print("🔧 Fixing sentence case in UI text")
    print(f"📋 Preserving: {', '.join(PRESERVE_TERMS[:5])}... (and {len(PRESERVE_TERMS) - 5} more)")
    print()

    total_changes = 0

    for file_path, line_numbers in affected_files.items():
        changes = fix_sentence_case_in_file(file_path, line_numbers)
        total_changes += changes

    print(f"\n✨ Total changes: {total_changes}")
    print("\n⚠️  Note: Some feature names like 'Sonic Graph' and 'Local Soundscape'")
    print("   have been preserved and may still be flagged in the PR review.")
    print("   Use /skip for those cases.")

if __name__ == '__main__':
    main()
