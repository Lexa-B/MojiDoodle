#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "openai>=1.0.0",
#     "python-dotenv>=1.0.0",
#     "pyyaml>=6.0",
# ]
# ///
"""
Process common katakana word skeleton files into complete MojiDoodle card YAML.

Uses OpenAI to generate English meanings and befuddlers for each katakana word.

Usage:
    uv run process_common_katakana_lesson.py <lesson_number>
    uv run process_common_katakana_lesson.py 01
    uv run process_common_katakana_lesson.py 01 --dry-run
"""

import argparse
import json
import os
import sys
from pathlib import Path

import yaml
from dotenv import load_dotenv
from openai import OpenAI

# Paths relative to this script
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent.parent
SKELETON_DIR = SCRIPT_DIR.parent.parent / "processed" / "common_katakana_words"
OUTPUT_DIR = PROJECT_ROOT / "src" / "data" / "cards" / "common_katakana_words"

# Batch size for API calls
BATCH_SIZE = 5

# Few-shot examples for the prompt
FEW_SHOT_EXAMPLES = """
Example 1:
Input card:
```yaml
- id: ckw-l01-142
  prompt: ""
  answers:
    - パーセント
  hint: "noun/counter"
```

Output JSON:
{"prompt": "percent", "befuddlers": []}

Example 2:
Input card:
```yaml
- id: ckw-l01-592
  prompt: ""
  answers:
    - メール
  hint: "verbal noun (する verb)"
```

Output JSON:
{"prompt": "email, mail", "befuddlers": [{"answer": "メイル", "toast": "Check your spelling!\\nThe standard Japanese spelling uses ー (long vowel mark)."}]}

Example 3:
Input card:
```yaml
- id: ckw-l01-940
  prompt: ""
  answers:
    - クリック
  hint: "verbal noun (する verb)"
```

Output JSON:
{"prompt": "click", "befuddlers": [{"answer": "タップ", "toast": "That's \\"tap\\"!\\nクリック is specifically for mouse clicks."}]}

Example 4:
Input card:
```yaml
- id: ckw-l02-1000
  prompt: ""
  answers:
    - コンピューター
  hint: "noun"
```

Output JSON:
{"prompt": "computer", "befuddlers": [{"answer": "コンピュータ", "toast": "Almost!\\nBoth spellings are used, but this prompt expects the longer form with ー."}]}

Example 5:
Input card:
```yaml
- id: ckw-l03-1234
  prompt: ""
  answers:
    - テレビ
  hint: "noun"
```

Output JSON:
{"prompt": "television, TV", "befuddlers": []}
"""

SYSTEM_PROMPT = """You are a Japanese language expert helping create flashcards for a handwriting practice app.

For each katakana loanword, provide:
1. "prompt": The English meaning shown to the user (a simple string, e.g. "computer" or "email, mail")
2. "befuddlers": Common mistakes or similar words that might be confused (0-4 items)

Prompt rules:
- Keep it concise - just the English meaning(s)
- If multiple meanings, separate with comma (e.g. "email, mail")
- No parentheses or extra formatting unless necessary for clarity

Befuddler rules:
- Each befuddler has "answer" (the wrong katakana) and "toast" (helpful explanation)
- Use \\n for newlines in toast messages
- NEVER reveal the correct answer in the toast
- Good befuddlers: alternate spellings, similar-sounding words, related concepts
- Empty array [] is fine if no good befuddlers exist

Return ONLY valid JSON with no markdown, no explanation, just the raw JSON object."""


def load_dotenv_files():
    """Load .env files from script dir and project root."""
    load_dotenv(SCRIPT_DIR / ".env")
    load_dotenv(PROJECT_ROOT / ".env")


def load_skeleton(lesson_num: str) -> list[dict]:
    """Load a skeleton YAML file."""
    skeleton_path = SKELETON_DIR / f"common_katakana_skeleton_l{lesson_num}.yaml"
    if not skeleton_path.exists():
        raise FileNotFoundError(f"Skeleton file not found: {skeleton_path}")

    with open(skeleton_path, "r", encoding="utf-8") as f:
        cards = yaml.safe_load(f)

    return cards


def card_to_yaml_string(card: dict) -> str:
    """Convert a card dict to YAML string for the prompt."""
    return yaml.dump([card], allow_unicode=True, default_flow_style=False)


def create_batch_prompt(cards: list[dict]) -> str:
    """Create a prompt for a batch of cards."""
    cards_yaml = "\n---\n".join(card_to_yaml_string(card) for card in cards)

    return f"""Process these {len(cards)} katakana word cards. For each card, return a JSON object with "prompt" and "befuddlers".

Return a JSON array with exactly {len(cards)} objects, one per card, in the same order.

{FEW_SHOT_EXAMPLES}

Cards to process:
{cards_yaml}

Return ONLY a valid JSON array, no other text."""


def validate_response(response: list, expected_count: int) -> tuple[bool, str]:
    """Validate the API response structure."""
    if not isinstance(response, list):
        return False, "Response is not a list"

    if len(response) != expected_count:
        return False, f"Expected {expected_count} items, got {len(response)}"

    for i, item in enumerate(response):
        if not isinstance(item, dict):
            return False, f"Item {i} is not a dict"

        if "prompt" not in item:
            return False, f"Item {i} missing 'prompt'"

        if not isinstance(item["prompt"], str):
            return False, f"Item {i} 'prompt' is not a string"

        if len(item["prompt"].strip()) == 0:
            return False, f"Item {i} has empty prompt"

        if "befuddlers" not in item:
            return False, f"Item {i} missing 'befuddlers'"

        if not isinstance(item["befuddlers"], list):
            return False, f"Item {i} 'befuddlers' is not a list"

        if len(item["befuddlers"]) > 4:
            return False, f"Item {i} has more than 4 befuddlers"

        for j, bef in enumerate(item["befuddlers"]):
            if not isinstance(bef, dict):
                return False, f"Item {i} befuddler {j} is not a dict"
            if "answer" not in bef or "toast" not in bef:
                return False, f"Item {i} befuddler {j} missing answer or toast"

    return True, ""


def process_batch(client: OpenAI, cards: list[dict], model: str) -> list[dict]:
    """Process a batch of cards through the API."""
    prompt = create_batch_prompt(cards)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content

    # Parse JSON response
    try:
        parsed = json.loads(content)
        # Handle case where response is wrapped in an object
        if isinstance(parsed, dict) and "results" in parsed:
            parsed = parsed["results"]
        elif isinstance(parsed, dict) and "cards" in parsed:
            parsed = parsed["cards"]
        elif isinstance(parsed, dict) and "prompt" in parsed:
            # Single card response, wrap in list
            parsed = [parsed]
        elif isinstance(parsed, dict) and len(parsed) == 1:
            # Single key wrapping the array
            parsed = list(parsed.values())[0]
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}\nContent: {content[:500]}")

    # Validate
    valid, error = validate_response(parsed, len(cards))
    if not valid:
        raise ValueError(f"Invalid response structure: {error}\nContent: {content[:500]}")

    return parsed


def normalize_string(s: str) -> str:
    """Convert escaped newlines to actual newlines."""
    if not isinstance(s, str):
        return s
    return s.replace("\\n", "\n")


def apply_results_to_cards(cards: list[dict], results: list[dict]) -> list[dict]:
    """Apply API results to the card data."""
    updated_cards = []

    for card, result in zip(cards, results):
        # Process befuddlers
        befuddlers = []
        for bef in result["befuddlers"]:
            befuddlers.append({
                "answers": [bef["answer"]],
                "toast": normalize_string(bef["toast"])
            })

        updated_card = {
            "id": card["id"],
            "prompt": result["prompt"],
            "answers": card["answers"],
            "hint": card["hint"],
            "stage": -1,
            "unlocks": "9999-12-31T23:59:59+00:00",
            "invulnerable": False,
            "max_stage": -1,
            "learned": False,
            "hidden": False,
            "befuddlers": befuddlers
        }

        updated_cards.append(updated_card)

    return updated_cards


def _str_representer(dumper, data):
    """Custom YAML representer: use literal block style for multiline strings."""
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)


# Register the custom representer globally
yaml.add_representer(str, _str_representer)


class IndentedDumper(yaml.SafeDumper):
    """Custom YAML dumper with proper indentation for nested lists."""
    pass

def _str_representer_indented(dumper, data):
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

IndentedDumper.add_representer(str, _str_representer_indented)

def write_yaml_file(cards: list[dict], output_path: Path):
    """Write cards to YAML file with proper formatting."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        yaml.dump(cards, f, Dumper=IndentedDumper, allow_unicode=True,
                  default_flow_style=False, sort_keys=False, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="Process common katakana word skeletons into complete cards"
    )
    parser.add_argument(
        "lesson",
        type=str,
        help="Lesson number (e.g., '01', '02', ...)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gpt-5-mini",
        help="OpenAI model to use (default: gpt-4o-mini)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Process items but don't write to file"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=BATCH_SIZE,
        help=f"Cards per API call (default: {BATCH_SIZE})"
    )

    args = parser.parse_args()

    # Normalize lesson number to 2 digits
    lesson_num = args.lesson.zfill(2)

    # Load environment variables
    load_dotenv_files()

    # Check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set")
        print("Set it in .env file or export OPENAI_API_KEY=...")
        sys.exit(1)

    print(f"Processing lesson {lesson_num}")
    print(f"Model: {args.model}")
    print(f"Batch size: {args.batch_size}")
    print()

    # Load skeleton
    try:
        cards = load_skeleton(lesson_num)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)

    print(f"Loaded {len(cards)} cards from skeleton")
    print()

    # Initialize OpenAI client
    client = OpenAI()

    # Process in batches
    all_results = []
    num_batches = (len(cards) + args.batch_size - 1) // args.batch_size

    for batch_idx in range(num_batches):
        start = batch_idx * args.batch_size
        end = min(start + args.batch_size, len(cards))
        batch_cards = cards[start:end]

        words = [c["answers"][0] for c in batch_cards]
        print(f"Batch {batch_idx + 1}/{num_batches}: {', '.join(words)}...", end=" ", flush=True)

        try:
            results = process_batch(client, batch_cards, args.model)
            all_results.extend(results)
            print("✓")
        except Exception as e:
            print(f"✗ Error: {e}")
            sys.exit(1)

    print()

    # Apply results to cards
    print("Applying results to cards...")
    updated_cards = apply_results_to_cards(cards, all_results)
    print("✓")
    print()

    # Output
    output_path = OUTPUT_DIR / f"common_katakana_l{lesson_num}.yaml"

    if args.dry_run:
        print("--- DRY RUN OUTPUT ---")
        print(yaml.dump(updated_cards, allow_unicode=True, default_flow_style=False, sort_keys=False))
    else:
        print(f"Writing to {output_path}...")
        write_yaml_file(updated_cards, output_path)
        print("✓")

    print()
    print(f"Summary: {len(updated_cards)} cards processed")
    for card in updated_cards:
        bef_count = len(card["befuddlers"])
        print(f"  - {card['answers'][0]}: {card['prompt']} ({bef_count} befuddlers)")


if __name__ == "__main__":
    main()
