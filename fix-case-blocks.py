#!/usr/bin/env python3
"""
Fix 'Unexpected lexical declaration in case block' errors by wrapping case bodies in braces.
"""

import re
from pathlib import Path

# Affected files and line numbers from PR review
affected_files = {
    'src/audio/engine.ts': [3754, 3755, 3756, 5551, 5557, 5563, 5572, 5649, 5655, 5661, 5662, 5687, 5697, 5704],
    'src/audio/mapping/ContentAwareMapper.ts': [361, 362, 503, 607],
    'src/audio/mapping/FileTypeAnalyzer.ts': [292, 293, 296],
    'src/audio/mapping/NoteCentricMapper.ts': [355, 362, 368, 375, 381, 386, 1390],
}

def fix_case_block(file_path, line_numbers):
    """
    Fix case blocks by wrapping their bodies in braces.
    This is tricky because we need to find the start and end of each case block.
    """
    path = Path(file_path)
    if not path.exists():
        print(f"❌ File not found: {file_path}")
        return 0

    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    changes = []
    modified_lines = set()

    # Sort line numbers to process from top to bottom
    for line_num in sorted(line_numbers):
        if line_num > len(lines) or line_num in modified_lines:
            continue

        line_idx = line_num - 1
        line = lines[line_idx]

        # Check if this line contains a lexical declaration (const, let, const)
        if not re.search(r'\b(const|let|var)\b', line):
            continue

        # Find the case statement above this line
        case_idx = line_idx - 1
        while case_idx >= 0:
            if re.match(r'\s*case\s+', lines[case_idx]):
                break
            case_idx -= 1

        if case_idx < 0:
            continue

        # Check if case block already has braces
        case_line = lines[case_idx]
        if '{' in case_line or (case_idx + 1 < len(lines) and '{' in lines[case_idx + 1]):
            continue  # Already has braces

        # Find the end of the case block (next case: or default: or closing brace)
        end_idx = line_idx + 1
        indent_level = len(lines[case_idx]) - len(lines[case_idx].lstrip())

        while end_idx < len(lines):
            next_line = lines[end_idx]
            next_indent = len(next_line) - len(next_line.lstrip())

            # Stop at next case, default, or closing brace at same or lower indent
            if next_indent <= indent_level:
                if re.match(r'\s*(case\s+|default\s*:|})', next_line):
                    break

            # Also stop at break/return statement
            if re.search(r'\b(break|return)\s*;?\s*$', next_line):
                end_idx += 1
                break

            end_idx += 1

        # Insert opening brace after case statement
        case_line_stripped = case_line.rstrip()
        if case_line_stripped.endswith(':'):
            lines[case_idx] = case_line_stripped + ' {\n'
        else:
            lines[case_idx] = case_line_stripped + ' {\n'

        # Insert closing brace before end
        end_line_indent = ' ' * (indent_level + 4)  # Match case body indent
        lines.insert(end_idx, end_line_indent + '}\n')

        changes.append({
            'case_line': case_idx + 1,
            'declaration_line': line_num,
            'end_line': end_idx + 1
        })

        # Mark all modified lines
        for i in range(case_idx, end_idx + 2):
            modified_lines.add(i + 1)

    if changes:
        # Write back
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        print(f"\n✅ {path} - {len(changes)} case blocks wrapped:")
        for change in changes[:3]:
            print(f"   Case at line {change['case_line']} (declaration at {change['declaration_line']})")
        if len(changes) > 3:
            print(f"   ... and {len(changes) - 3} more")

    return len(changes)

def main():
    print("🔧 Fixing case block lexical declarations")
    print("   Wrapping case bodies in braces where needed")
    print()

    total_changes = 0

    for file_path, line_numbers in affected_files.items():
        changes = fix_case_block(file_path, line_numbers)
        total_changes += changes

    print(f"\n✨ Total case blocks fixed: {total_changes}")

if __name__ == '__main__':
    main()
