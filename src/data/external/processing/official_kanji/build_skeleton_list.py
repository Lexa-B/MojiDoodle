#!/usr/bin/env python3
"""
Build skeleton YAML card files for joyo and jinmeiyo kanji lists.
Reads raw CSV files, enriches with KANJIDIC data, and outputs YAML card definitions.

Outputs separate files by grade:
- kanji_skeleton_joyo_gr{1-6,8}.yaml for Jōyō kanji
- kanji_skeleton_jinmeiyo_gr{9,10}.yaml for Jinmeiyō kanji

Skips CJK Compatibility Ideograph variants (U+F900-U+FAFF) when their canonical
equivalent is already in the lists.
"""

import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict

# Paths relative to this script
SCRIPT_DIR = Path(__file__).parent
RAW_DIR = SCRIPT_DIR.parent.parent / "raw"
OUTPUT_DIR = SCRIPT_DIR.parent.parent / "processed" / "official_kanji"
KANJIDIC_PATH = RAW_DIR / "kanjidic2.xml"

SOURCES = [
    {
        "input": RAW_DIR / "joyo-kanji-code-u.csv",
        "id_prefix": "joyo",
        "expected_grades": [1, 2, 3, 4, 5, 6, 8],
    },
    {
        "input": RAW_DIR / "jinmeiyou-kanji-code-u.csv",
        "id_prefix": "jinmeiyo",
        "expected_grades": [9, 10],
    },
]


def parse_kanjidic(filepath: Path) -> dict[str, dict]:
    """
    Parse KANJIDIC2 XML and return a dictionary keyed by UCS code (lowercase hex).
    Each entry contains: meanings (English), ja_on readings, ja_kun readings, grade.
    """
    print(f"Parsing KANJIDIC from {filepath}...")
    tree = ET.parse(filepath)
    root = tree.getroot()

    kanji_data = {}

    for character in root.findall("character"):
        # Get UCS code
        ucs_code = None
        codepoint = character.find("codepoint")
        if codepoint is not None:
            for cp_value in codepoint.findall("cp_value"):
                if cp_value.get("cp_type") == "ucs":
                    ucs_code = cp_value.text.lower()
                    break

        if not ucs_code:
            continue

        # Get grade from misc
        grade = None
        misc = character.find("misc")
        if misc is not None:
            grade_elem = misc.find("grade")
            if grade_elem is not None and grade_elem.text:
                grade = int(grade_elem.text)

        # Get readings and meanings from reading_meaning/rmgroup
        meanings = []
        ja_on = []
        ja_kun = []

        reading_meaning = character.find("reading_meaning")
        if reading_meaning is not None:
            for rmgroup in reading_meaning.findall("rmgroup"):
                # Get readings
                for reading in rmgroup.findall("reading"):
                    r_type = reading.get("r_type")
                    if r_type == "ja_on":
                        ja_on.append(reading.text)
                    elif r_type == "ja_kun":
                        ja_kun.append(reading.text)

                # Get English meanings (no m_lang attribute means English)
                for meaning in rmgroup.findall("meaning"):
                    if meaning.get("m_lang") is None:
                        meanings.append(meaning.text)

        kanji_data[ucs_code] = {
            "meanings": meanings,
            "ja_on": ja_on,
            "ja_kun": ja_kun,
            "grade": grade,
        }

    print(f"  Loaded {len(kanji_data)} kanji entries from KANJIDIC")
    return kanji_data


def parse_csv(filepath: Path) -> list[tuple[str, str]]:
    """
    Parse the kanji CSV file and return list of (kanji, unicode_id) tuples.
    Unicode ID is extracted without the 'U+' prefix.
    """
    entries = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if not line or line.startswith("#"):
                continue

            parts = line.split(",")
            if len(parts) >= 6:
                kanji = parts[0]
                unicode_code = parts[5]  # e.g., "U+4E9C"
                # Remove "U+" prefix
                unicode_id = unicode_code.replace("U+", "").lower()
                entries.append((kanji, unicode_id))

    return entries


def get_canonical_char(char: str) -> str | None:
    """
    Get the canonical equivalent of a CJK Compatibility Ideograph.
    Returns None if the character is not a compatibility ideograph or has no decomposition.
    """
    codepoint = ord(char)
    # CJK Compatibility Ideographs: U+F900-U+FAFF
    if not (0xF900 <= codepoint <= 0xFAFF):
        return None

    decomp = unicodedata.decomposition(char)
    if not decomp:
        return None

    # Decomposition format is like "<compat> 50E7" - last part is canonical codepoint
    parts = decomp.split()
    if parts:
        try:
            canon_codepoint = int(parts[-1], 16)
            return chr(canon_codepoint)
        except ValueError:
            return None
    return None


def filter_duplicate_variants(
    entries: list[tuple[str, str]], all_chars: set[str]
) -> tuple[list[tuple[str, str]], list[str]]:
    """
    Filter out CJK Compatibility Ideograph variants whose canonical equivalent
    is already in the character set.

    Returns (filtered_entries, list_of_skipped_messages).
    """
    filtered = []
    skipped = []

    for kanji, unicode_id in entries:
        canonical = get_canonical_char(kanji)
        if canonical and canonical in all_chars:
            skipped.append(
                f"  SKIPPED: {kanji} (U+{unicode_id.upper()}) - "
                f"duplicate of canonical {canonical}"
            )
        else:
            filtered.append((kanji, unicode_id))

    return filtered, skipped


def build_prompt(kanji_info: dict | None, kanji: str, unicode_id: str) -> tuple[str, list[str]]:
    """
    Build a multi-line prompt from KANJIDIC data.
    Line 1: Meanings: top 3 meanings
    Line 2: Onyomi: top 4 ja_on readings
    Line 3: Kunyomi: top 4 ja_kun readings

    Returns (prompt_string, list_of_warnings).
    """
    warnings = []

    if not kanji_info:
        warnings.append(f"  WARNING: {kanji} (U+{unicode_id.upper()}) not found in KANJIDIC")
        return "", warnings

    lines = []

    meanings = kanji_info.get("meanings", [])[:3]
    if meanings:
        lines.append(f"Meanings: {', '.join(meanings)}")
    else:
        warnings.append(f"  WARNING: {kanji} (U+{unicode_id.upper()}) has no meanings")

    ja_on = kanji_info.get("ja_on", [])[:4]
    if ja_on:
        lines.append(f"Onyomi: {', '.join(ja_on)}")
    else:
        warnings.append(f"  WARNING: {kanji} (U+{unicode_id.upper()}) has no onyomi readings")

    ja_kun = kanji_info.get("ja_kun", [])[:4]
    if ja_kun:
        lines.append(f"Kunyomi: {', '.join(ja_kun)}")
    else:
        warnings.append(f"  WARNING: {kanji} (U+{unicode_id.upper()}) has no kunyomi readings")

    return "\\n".join(lines), warnings


def generate_yaml(
    entries: list[tuple[str, str]], id_prefix: str, kanjidic: dict[str, dict]
) -> tuple[str, list[str]]:
    """Generate YAML content for the kanji entries. Returns (yaml_content, warnings)."""
    lines = []
    all_warnings = []

    for kanji, unicode_id in entries:
        kanji_info = kanjidic.get(unicode_id)
        prompt, warnings = build_prompt(kanji_info, kanji, unicode_id)
        all_warnings.extend(warnings)

        lines.append(f"- id: k-{id_prefix}-{unicode_id}")
        lines.append(f'  prompt: "{prompt}"')
        lines.append(f"  answers:")
        lines.append(f"    - {kanji}")
        lines.append(f'  hint: ""')
        lines.append(f"  stage: -1")
        lines.append(f"  unlocks: '9999-12-31T23:59:59+00:00'")
        lines.append(f"  befuddlers: []")
        lines.append("")  # Blank line between entries

    return "\n".join(lines), all_warnings


def group_by_grade(
    entries: list[tuple[str, str]], kanjidic: dict[str, dict], expected_grades: list[int]
) -> tuple[dict[int, list[tuple[str, str]]], list[tuple[str, str]]]:
    """
    Group entries by their KANJIDIC grade.
    Returns (grade_groups, no_grade_entries).
    """
    grade_groups: dict[int, list[tuple[str, str]]] = defaultdict(list)
    no_grade = []

    for kanji, unicode_id in entries:
        kanji_info = kanjidic.get(unicode_id)
        if kanji_info and kanji_info.get("grade") is not None:
            grade = kanji_info["grade"]
            grade_groups[grade].append((kanji, unicode_id))
        else:
            no_grade.append((kanji, unicode_id))

    return dict(grade_groups), no_grade


def main():
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load KANJIDIC data
    kanjidic = parse_kanjidic(KANJIDIC_PATH)

    # First pass: collect all characters from all sources
    all_entries = {}
    for source in SOURCES:
        entries = parse_csv(source["input"])
        all_entries[source["id_prefix"]] = entries

    # Build set of all characters (for duplicate detection)
    all_chars = set()
    for entries in all_entries.values():
        for kanji, _ in entries:
            all_chars.add(kanji)

    total_warnings = 0
    total_skipped = 0
    total_written = 0
    total_no_grade = 0

    for source in SOURCES:
        print(f"\nProcessing {source['input'].name}...")

        entries = all_entries[source["id_prefix"]]
        print(f"  Found {len(entries)} kanji in source")

        # Filter out duplicate variants
        filtered_entries, skipped = filter_duplicate_variants(entries, all_chars)
        if skipped:
            for msg in skipped:
                print(msg)
            total_skipped += len(skipped)
            print(f"  Filtered to {len(filtered_entries)} kanji (skipped {len(skipped)} duplicates)")

        # Group by grade
        grade_groups, no_grade = group_by_grade(
            filtered_entries, kanjidic, source["expected_grades"]
        )

        if no_grade:
            print(f"  WARNING: {len(no_grade)} kanji have no grade in KANJIDIC:")
            for kanji, unicode_id in no_grade:
                print(f"    {kanji} (U+{unicode_id.upper()})")
            total_no_grade += len(no_grade)

        # Check for unexpected grades
        for grade in grade_groups:
            if grade not in source["expected_grades"]:
                print(f"  WARNING: Found {len(grade_groups[grade])} kanji with unexpected grade {grade}")

        # Generate files for each expected grade
        for grade in source["expected_grades"]:
            grade_entries = grade_groups.get(grade, [])
            if not grade_entries:
                print(f"  Grade {grade}: 0 kanji (skipping file)")
                continue

            yaml_content, warnings = generate_yaml(grade_entries, source["id_prefix"], kanjidic)

            if warnings:
                for warning in warnings:
                    print(warning)
                total_warnings += len(warnings)

            output_file = OUTPUT_DIR / f"kanji_skeleton_{source['id_prefix']}_gr{grade}.yaml"
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(yaml_content)

            print(f"  Grade {grade}: {len(grade_entries)} kanji -> {output_file.name}")
            total_written += len(grade_entries)

    print(f"\n{'='*50}")
    print(f"Total kanji written: {total_written}")
    print(f"Total skipped duplicates: {total_skipped}")
    print(f"Total with no grade: {total_no_grade}")
    if total_warnings:
        print(f"Total warnings: {total_warnings}")
    else:
        print("No warnings!")

    print("Done!")


if __name__ == "__main__":
    main()
