#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "langchain>=0.3.0",
#     "langchain-openai>=0.2.0",
#     "python-dotenv>=1.0.0",
#     "pyyaml>=6.0",
# ]
# ///
"""
Process a Genki lesson vocabulary file into MojiDoodle card YAML format.

Usage:
    uv run process_genki_lesson.py <source_csv> <target_yaml> --prefix <id_prefix>

Example:
    uv run process_genki_lesson.py ../processed/genki_vocab_L00.csv ../../cards/genki/genki_vocab_00.yaml --prefix g-00-
"""

import argparse
import csv
import os
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser


# Paths relative to this script
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent


# Few-shot examples for card generation
# Note: befuddlers use "answers" (plural, array) not "answer" (singular)
FEW_SHOT_EXAMPLES = """
Example 1 - Single hiragana character:
Input: word="い", english="I (Hiragana)", pos="n."
Output JSON:
{"prompt": "I (Hiragana)", "answer": "い", "hint": "2 strokes", "strokeCount": 2, "befuddlers": [{"answers": ["イ"], "toast": "That's katakana!\\nThe prompt asks for hiragana, which is curvy."}, {"answers": ["り"], "toast": "That's \\"RI\\"!\\nThis one has connected strokes."}]}

Example 2 - Verb with kanji:
Input: word="おもう", kanji="思う", english="To Think (Opinion/Feeling)", pos="v."
Output JSON:
{"prompt": "To Think (Opinion/Feeling)", "answer": "思う", "hint": "omou - subjective thinking", "strokeCount": null, "befuddlers": [{"answers": ["考える"], "toast": "That's \\"to reason/consider\\"!\\nThis one is for thinking through a problem logically."}, {"answers": ["知っている"], "toast": "That's \\"to know\\"!\\nThis one is about having information, not forming thoughts."}]}

Example 3 - Single kanji with no common befuddlers:
Input: word="さくら", kanji="桜", english="Sakura", pos="n."
Output JSON:
{"prompt": "Sakura", "answer": "桜", "hint": "10 strokes", "strokeCount": 10, "befuddlers": []}
"""


def load_dotenv_files():
    """Load .env files from script dir and project root."""
    load_dotenv(SCRIPT_DIR / ".env")
    load_dotenv(PROJECT_ROOT / ".env")


def load_csv_vocab(csv_path: Path) -> list[dict]:
    """Load vocabulary from a CSV file."""
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    vocab_items = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            vocab_items.append(row)
    return vocab_items


def create_card_prompt_template() -> ChatPromptTemplate:
    """Create the prompt template for generating a single card."""

    template = """You are a Japanese language expert creating flashcards for a handwriting practice app.

Given a Japanese vocabulary word, generate a flashcard card entry. The user will draw the Japanese word/character,
so the "answer" is what they need to write, and the "prompt" is the English meaning shown to them.

## Card Format Rules:
- prompt: The English meaning or description shown to the user (what they need to write in Japanese)
- answer: The Japanese word the user needs to draw (use kanji form if available, otherwise kana)
- hint: A helpful hint - can be reading (romaji), stroke count, mnemonic, or usage note
- strokeCount: ONLY include if the answer is a single kanji or kana character (omit for words/phrases)
- stage: Always -1 (locked by default)
- unlocks: Always "9999-12-31T23:59:59+00:00" (far future, unlocked by lessons)
- befuddlers: Array of similar-looking or commonly confused words/characters that the handwriting API might recognize instead. Each has:
  - answers: Array with the confused character/word (e.g. ["イ"])
  - toast: A helpful message explaining the difference (use \\n for newlines). NEVER reveal the correct answer in the toast!

## Guidelines for befuddlers:
- For expressions/phrases, befuddlers should be similar expressions that might be confused
- For words with kanji, befuddlers could be words with similar kanji or similar meaning
- For hiragana/katakana, include the opposite script version and visually similar characters
- Empty array [] is fine if no good befuddlers exist
- Maximum 3 befuddlers

{few_shot_examples}

## Input vocabulary item:
- Word (kana): {word_kana}
- Kanji form: {kanji_form}
- Part of speech: {pos}
- English meaning: {english}

Return ONLY a valid JSON object with these exact keys:
- prompt (string)
- answer (string)
- hint (string)
- strokeCount (number or null if not applicable)
- befuddlers (array of objects with "answers" (array) and "toast" keys)

Return ONLY the JSON, no markdown code blocks or other text."""

    return ChatPromptTemplate.from_messages([
        ("system", "You are a Japanese language expert creating educational flashcards."),
        ("human", template)
    ]).partial(few_shot_examples=FEW_SHOT_EXAMPLES)


def create_id_generation_prompt_template() -> ChatPromptTemplate:
    """Create the prompt template for generating meaningful ID suffixes."""

    template = """You are generating short, meaningful ID suffixes for Japanese vocabulary flashcards.

Given a list of cards with their prompts and answers, generate a unique, short ID suffix for each.

## Rules for ID suffixes:
- Use lowercase letters, numbers, and hyphens only
- Keep them short (2-10 characters)
- Make them memorable and related to the word
- For expressions, use a key word from the phrase
- For greetings, use an abbreviated form
- Ensure NO duplicates in the batch
- Examples: "thanks", "morning", "goodbye", "excuse", "home"

## Cards to process:
{cards_json}

Return a JSON array of strings, one ID suffix per card, in the same order as the input.
Example: ["thanks", "thanks-polite", "no", "itadaki", "itteki"]

Return ONLY the JSON array, no other text."""

    return ChatPromptTemplate.from_messages([
        ("system", "You are generating short, unique identifiers for vocabulary items."),
        ("human", template)
    ])


def process_single_card(llm, prompt_template, parser, item: dict) -> dict:
    """Process a single vocabulary item through the LLM to generate card data."""

    word_kana = item.get("単語", "")
    kanji_form = item.get("漢字表記", "") or word_kana
    pos = item.get("品詞", "")
    english = item.get("英訳", "")

    chain = prompt_template | llm | parser

    result = chain.invoke({
        "word_kana": word_kana,
        "kanji_form": kanji_form,
        "pos": pos,
        "english": english
    })

    return result


def generate_id_suffixes(llm, prompt_template, parser, cards: list[dict]) -> list[str]:
    """Generate meaningful ID suffixes for all cards."""

    import json
    cards_summary = [{"prompt": c["prompt"], "answer": c["answers"][0]} for c in cards]
    cards_json = json.dumps(cards_summary, ensure_ascii=False, indent=2)

    chain = prompt_template | llm | parser

    result = chain.invoke({"cards_json": cards_json})

    return result


def normalize_string(s: str) -> str:
    """Normalize a string by converting escaped newlines to actual newlines."""
    if not isinstance(s, str):
        return s
    # Convert escaped \n to actual newlines (from JSON responses)
    return s.replace("\\n", "\n")


def normalize_card(card_data: dict) -> dict:
    """Normalize all string fields in a card, especially befuddler toasts."""
    normalized = {}
    for key, value in card_data.items():
        if isinstance(value, str):
            normalized[key] = normalize_string(value)
        elif isinstance(value, list) and key == "befuddlers":
            normalized[key] = [
                {
                    "answers": [normalize_string(a) for a in b.get("answers", [])],
                    "toast": normalize_string(b.get("toast", ""))
                }
                for b in value
            ]
        else:
            normalized[key] = value
    return normalized


def build_card_yaml(card_data: dict, card_id: str) -> dict:
    """Build a complete card dict ready for YAML serialization."""

    # Normalize strings first (convert escaped \n to real newlines)
    card_data = normalize_card(card_data)

    card = {
        "id": card_id,
        "prompt": card_data["prompt"],
        "answers": [card_data["answer"]],  # Wrap single answer in list
        "hint": card_data["hint"],
    }

    # Only include strokeCount if it's a valid number
    if card_data.get("strokeCount") is not None:
        card["strokeCount"] = card_data["strokeCount"]

    card["stage"] = -1
    card["unlocks"] = "9999-12-31T23:59:59+00:00"
    card["befuddlers"] = card_data.get("befuddlers", [])

    return card


def validate_yaml(cards: list[dict]) -> tuple[bool, list[str]]:
    """Validate that the cards can be serialized to valid YAML and check for issues."""
    issues = []

    # Check for escaped newlines that weren't normalized
    for i, card in enumerate(cards):
        card_id = card.get("id", f"card_{i}")

        # Check hint field
        hint = card.get("hint", "")
        if "\\n" in hint:
            issues.append(f"{card_id}: hint contains escaped \\n")

        # Check befuddler toasts
        for j, befuddler in enumerate(card.get("befuddlers", [])):
            toast = befuddler.get("toast", "")
            if "\\n" in toast:
                issues.append(f"{card_id}: befuddler[{j}] toast contains escaped \\n")

    # Try to serialize and parse back
    try:
        yaml_str = yaml.dump(cards, allow_unicode=True, default_flow_style=False, sort_keys=False)
        parsed = yaml.safe_load(yaml_str)
        if parsed is None or len(parsed) != len(cards):
            issues.append("YAML round-trip failed: card count mismatch")
    except Exception as e:
        issues.append(f"YAML serialization error: {e}")

    return len(issues) == 0, issues


def _str_representer(dumper, data):
    """Custom YAML representer: use literal block style for multiline strings."""
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)


# Register the custom representer globally
yaml.add_representer(str, _str_representer)


def write_yaml_file(cards: list[dict], output_path: Path):
    """Write cards to YAML file with proper formatting."""
    # Ensure parent directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        yaml.dump(cards, f, allow_unicode=True, default_flow_style=False, sort_keys=False)


def main():
    parser = argparse.ArgumentParser(
        description="Process Genki lesson vocabulary into MojiDoodle card format"
    )
    parser.add_argument(
        "source",
        type=str,
        help="Source CSV file path (relative to this script or absolute)"
    )
    parser.add_argument(
        "target",
        type=str,
        help="Target YAML file path (relative to this script or absolute)"
    )
    parser.add_argument(
        "--prefix",
        type=str,
        required=True,
        help="ID prefix for cards (e.g., 'g-00-')"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gpt-5.2",
        help="OpenAI model to use (default: gpt-4o-mini)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Process items but don't write to file"
    )

    args = parser.parse_args()

    # Load environment variables
    load_dotenv_files()

    # Check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set")
        sys.exit(1)

    # Resolve paths (relative to current working directory)
    source_path = Path(args.source).resolve()
    target_path = Path(args.target).resolve()

    print(f"Source: {source_path}")
    print(f"Target: {target_path}")
    print(f"Prefix: {args.prefix}")
    print(f"Model: {args.model}")
    print()

    # Load vocabulary
    try:
        vocab_items = load_csv_vocab(source_path)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)

    print(f"Found {len(vocab_items)} vocabulary items")
    print()

    # Initialize LangChain components
    llm = ChatOpenAI(model=args.model, temperature=0.3)
    card_prompt = create_card_prompt_template()
    id_prompt = create_id_generation_prompt_template()
    json_parser = JsonOutputParser()

    # Phase 1: Generate cards with temporary IDs
    print("Phase 1: Generating cards...")
    cards = []

    for i, item in enumerate(vocab_items):
        word = item.get("単語", "")
        english = item.get("英訳", "")
        print(f"  [{i+1}/{len(vocab_items)}] {word} - {english}...", end=" ", flush=True)

        try:
            card_data = process_single_card(llm, card_prompt, json_parser, item)
            temp_id = f"{args.prefix}{i}"
            card = build_card_yaml(card_data, temp_id)
            cards.append(card)
            print("✓")
        except Exception as e:
            print(f"✗ Error: {e}")
            continue

    if not cards:
        print("No cards generated. Exiting.")
        sys.exit(1)

    print(f"\nGenerated {len(cards)} cards")
    print()

    # Phase 2: Generate meaningful ID suffixes
    print("Phase 2: Generating meaningful IDs...")
    try:
        id_suffixes = generate_id_suffixes(llm, id_prompt, json_parser, cards)

        if len(id_suffixes) != len(cards):
            print(f"Warning: Got {len(id_suffixes)} IDs for {len(cards)} cards. Using numeric fallback for missing.")
            while len(id_suffixes) < len(cards):
                id_suffixes.append(str(len(id_suffixes)))

        # Check for duplicates and fix
        seen = set()
        for i, suffix in enumerate(id_suffixes):
            original = suffix
            counter = 2
            while suffix in seen:
                suffix = f"{original}-{counter}"
                counter += 1
            id_suffixes[i] = suffix
            seen.add(suffix)

        # Update card IDs
        for i, card in enumerate(cards):
            card["id"] = f"{args.prefix}{id_suffixes[i]}"

        print("✓ IDs generated")
    except Exception as e:
        print(f"✗ Error generating IDs: {e}")
        print("Keeping numeric IDs as fallback")

    print()

    # Phase 3: Validate and write YAML
    print("Phase 3: Validating YAML...")
    valid, issues = validate_yaml(cards)
    if valid:
        print("✓ YAML validation passed")
    else:
        print("✗ YAML validation failed:")
        for issue in issues:
            print(f"  - {issue}")
        sys.exit(1)

    if args.dry_run:
        print("\n--- DRY RUN OUTPUT ---")
        print(yaml.dump(cards, allow_unicode=True, default_flow_style=False, sort_keys=False))
    else:
        print(f"\nWriting to {target_path}...")
        write_yaml_file(cards, target_path)
        print("✓ Done!")

    print(f"\nSummary: {len(cards)} cards written")
    for card in cards:
        print(f"  - {card['id']}: {card['prompt']} → {card['answers'][0]}")


if __name__ == "__main__":
    main()
