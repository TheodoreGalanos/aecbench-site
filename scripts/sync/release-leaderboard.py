# ABOUTME: Builds the committed site leaderboard artefacts from local release-eval analysis CSVs.
# ABOUTME: Distils large aec-bench result folders into small JSON files safe for Vercel builds.

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ANALYSIS = ROOT.parent / "aec-bench" / "artefacts" / "release-evals" / "analysis"
DEFAULT_DATASET = ROOT.parent / "aec-bench" / "tasks" / "generated" / "release-foundry-full-suite" / "dataset.json"
DEFAULT_OUTPUT = ROOT / "public" / "data"
DEFAULT_PUBLIC_VERSION = "release"
DOMAINS = ("civil", "electrical", "ground", "mechanical", "structural")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def f(row: dict[str, str], key: str) -> float | None:
    raw = row.get(key, "")
    if raw == "":
        return None
    return float(raw)


def i(row: dict[str, str], key: str) -> int:
    raw = row.get(key, "0")
    return int(float(raw or "0"))


def round4(value: float | None) -> float | None:
    if value is None:
        return None
    return round(value, 4)


def provider_for(model_slug: str) -> str:
    if model_slug.startswith("gpt"):
        return "openai"
    if model_slug.startswith("gemma"):
        return "google"
    return "other"


def display_name(raw: str, slug: str) -> str:
    aliases = {
        "gpt-4-1-mini": "GPT-4.1 Mini",
        "gpt-5-1": "GPT-5.1",
        "gpt-5-2": "GPT-5.2",
        "gpt-5-3-chat": "GPT-5.3 Chat",
        "gpt-oss-120b": "GPT-OSS 120B",
        "grok-4-1-fast-reasoning": "Grok 4.1 Fast Reasoning",
        "grok-4-20-reasoning": "Grok 4.20 Reasoning",
        "grok-4-3": "Grok 4.3",
        "kimi-k2-6": "Kimi K2.6",
        "lfm2-24b-a2b": "LFM2 24B A2B",
        "minimax-m2-7": "MiniMax M2.7",
        "qwen3-5-9b": "Qwen3.5 9B",
        "gemma-4-31b-it": "Gemma 4 31B IT",
    }
    return aliases.get(slug, raw.removeprefix("together:").replace("-", " "))


def mean(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def build_dataset(dataset_path: Path, public_version: str) -> tuple[dict[str, Any], dict[str, Any]]:
    raw = dataset_path.read_bytes()
    source = json.loads(raw)
    tasks = []
    for instance in source["instances"]:
        domain = instance["path"].split("/", 1)[0]
        tasks.append(
            {
                "task_id": instance["path"],
                "domain": domain,
                "difficulty": instance["difficulty"],
                "tags": [
                    f"template:{instance['template']}",
                    f"visibility:{instance['visibility']}",
                    f"tool_mode:{instance['tool_mode']}",
                ],
            }
        )
    dataset = {
        "name": "aec-bench",
        "version": public_version,
        "content_hash": hashlib.sha256(raw).hexdigest(),
        "description": {
            "summary": "Release Foundry full suite generated from built AEC-Bench templates.",
            "task_count": source["summary"]["total_instances"],
        },
        "tasks": tasks,
    }
    return dataset, source


def compute_per_discipline(trials: list[dict[str, str]]) -> dict[str, dict[str, float]]:
    buckets: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    for row in trials:
        if row["status"] != "completed":
            continue
        reward = f(row, "reward")
        if reward is None:
            continue
        buckets[row["model_slug"]][row["discipline"]].append(reward)
    return {
        model: {domain: round(mean(values) or 0, 4) for domain, values in domains.items()}
        for model, domains in buckets.items()
    }


def build_entries(
    analysis_dir: Path,
    dataset_key: str,
    generated_at: str,
    expected_trials: int,
) -> list[dict[str, Any]]:
    model_rows = read_csv(analysis_dir / "model_summary_rectified.csv")
    trial_rows = read_csv(analysis_dir / "release_trials_rectified.csv")
    frontier_rows = {
        row["model_slug"]: row
        for row in read_csv(analysis_dir / "cost_speed_quality_frontier_finished.csv")
    }
    per_discipline = compute_per_discipline(trial_rows)

    entries: list[dict[str, Any]] = []
    for row in model_rows:
        slug = row["model_slug"]
        frontier = frontier_rows.get(slug, {})
        input_tokens = f(row, "mean_input_tokens")
        output_tokens = f(row, "mean_output_tokens")
        total_tokens = None
        if input_tokens is not None or output_tokens is not None:
            total_tokens = (input_tokens or 0) + (output_tokens or 0)
        trials = i(row, "n_trials")
        completed = i(row, "n_completed")
        failed = i(row, "n_failed")
        expected = max(trials, expected_trials)
        entry = {
            "rank": 0,
            "model_key": f"{slug}/tool_loop",
            "model_display": display_name(row["model_name"], slug),
            "provider": provider_for(slug),
            "adapter": "tool_loop",
            "reward": round4(f(row, "mean_reward")) or 0,
            "reward_ci": None,
            "per_discipline": per_discipline.get(slug, {}),
            "trials": trials,
            "complete_trials": completed,
            "repetitions": 3,
            "expected_trials": expected,
            "failed_trials": failed,
            "completion_rate": round4(completed / expected if expected else 0),
            "suite_done": row.get("suite_done") == "True",
            "mean_cost_usd": None,
            "total_cost_usd": None,
            "mean_tokens": round(total_tokens) if total_tokens is not None else None,
            "mean_input_tokens": round(input_tokens) if input_tokens is not None else None,
            "mean_output_tokens": round(output_tokens) if output_tokens is not None else None,
            "mean_duration_seconds": round4(f(frontier, "median_seconds")),
            "latency_p95_seconds": round4(f(frontier, "p95_seconds")),
            "reward_stddev": round4(f(row, "reward_stddev")),
            "reliability_adjusted_reward": round4(f(frontier, "reliability_adjusted_reward")),
            "zero_reward_rate": round4(f(row, "zero_reward_rate")) or 0,
            "partial_credit_rate": round4(f(row, "partial_credit_rate")) or 0,
            "perfect_reward_rate": round4(f(row, "perfect_reward_rate")) or 0,
            "dataset": dataset_key,
            "last_submission": generated_at,
            "submission_count": 1,
            "delta_vs_previous": None,
            "is_mock": False,
        }
        entries.append(entry)

    entries.sort(key=lambda item: (-item["reward"], -(item["complete_trials"])))
    for rank, entry in enumerate(entries, 1):
        entry["rank"] = rank
    return entries


def emit(output_dir: Path, artefact: dict[str, Any]) -> None:
    if output_dir.exists():
        for path in sorted(output_dir.rglob("*"), reverse=True):
            if path.is_file():
                path.unlink()
            elif path.is_dir():
                path.rmdir()
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "leaderboard.json").write_text(json.dumps(artefact, indent=2) + "\n", encoding="utf-8")

    disciplines_dir = output_dir / "disciplines"
    disciplines_dir.mkdir()
    for domain in DOMAINS:
        entries = [
            {**entry, "reward": entry["per_discipline"][domain]}
            for entry in artefact["entries"]
            if domain in entry["per_discipline"]
        ]
        entries.sort(key=lambda item: (-item["reward"], -(item["complete_trials"])))
        for rank, entry in enumerate(entries, 1):
            entry["rank"] = rank
        (disciplines_dir / f"{domain}.json").write_text(
            json.dumps({**artefact, "entries": entries}, indent=2) + "\n",
            encoding="utf-8",
        )

    models_dir = output_dir / "models"
    models_dir.mkdir()
    for entry in artefact["entries"]:
        model_file = entry["model_key"].replace("/", "-") + ".json"
        (models_dir / model_file).write_text(json.dumps(entry, indent=2) + "\n", encoding="utf-8")


def build(analysis_dir: Path, dataset_path: Path, public_version: str = DEFAULT_PUBLIC_VERSION) -> dict[str, Any]:
    dataset, source = build_dataset(dataset_path, public_version)
    generated_at = source["created"]
    dataset_key = f"{dataset['name']}@{dataset['version']}"
    entries = build_entries(
        analysis_dir,
        dataset_key,
        generated_at,
        source["summary"]["total_instances"] * 3,
    )
    return {
        "generated_at": generated_at,
        "dataset": dataset,
        "entries": entries,
        "is_mock": False,
        "run_status": {
            "tasks": source["summary"]["total_instances"],
            "models": len(entries),
            "adapters": 1,
            "disciplines": len(source["summary"]["by_discipline"]),
            "last_submission": generated_at,
            "generated_at": generated_at,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--analysis-dir", type=Path, default=DEFAULT_ANALYSIS)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--public-version", default=DEFAULT_PUBLIC_VERSION)
    args = parser.parse_args()

    artefact = build(args.analysis_dir, args.dataset, args.public_version)
    emit(args.output_dir, artefact)
    print(
        json.dumps(
            {
                "output": str(args.output_dir),
                "models": len(artefact["entries"]),
                "tasks": artefact["run_status"]["tasks"],
                "top_model": artefact["entries"][0]["model_key"],
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
