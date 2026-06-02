# ABOUTME: Exports rich template-detail metadata from a committed aec-bench checkout.
# ABOUTME: Reads params.toml files and writes a static JSON artefact consumed by the site.

from __future__ import annotations

import argparse
import json
import subprocess
import tarfile
import tempfile
import tomllib
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT.parent / "aec-bench"
DEFAULT_OUTPUT = ROOT / "data" / "template-detail-supplements.json"


def slugify(value: str) -> str:
    return value.replace("_", "-").replace(" ", "-").lower()


def as_string(value: Any) -> str:
    if isinstance(value, float):
        return f"{value:g}"
    return str(value)


def list_values(value: Any) -> list[str]:
    if isinstance(value, list):
        return [as_string(v) for v in value]
    return [as_string(value)]


def git_short_sha(path: Path) -> str | None:
    result = subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"],
        cwd=path,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    sha = result.stdout.strip()
    return sha or None


def export_committed_tree(path: Path) -> tuple[tempfile.TemporaryDirectory[str], Path]:
    tmp = tempfile.TemporaryDirectory(prefix="aec-bench-template-details-")
    archive_path = Path(tmp.name) / "aec-bench-head.tar"
    with archive_path.open("wb") as fh:
        subprocess.run(["git", "archive", "HEAD"], cwd=path, stdout=fh, check=True)

    extract_root = Path(tmp.name) / "repo"
    extract_root.mkdir()
    with tarfile.open(archive_path) as tar:
        tar.extractall(extract_root, filter="data")
    return tmp, extract_root


def parameter_detail(name: str, raw: dict[str, Any]) -> dict[str, Any]:
    detail: dict[str, Any] = {
        "name": name,
        "type": raw.get("type", "float"),
        "description": raw.get("description", name),
    }
    if raw.get("unit") is not None:
        detail["unit"] = raw["unit"]
    if raw.get("min") is not None and raw.get("max") is not None:
        detail["range"] = {"min": raw["min"], "max": raw["max"]}
    if raw.get("values"):
        detail["values"] = list_values(raw["values"])
    if raw.get("default") is not None:
        detail["defaultValue"] = as_string(raw["default"])
    if raw.get("optional"):
        detail["optional"] = True
    if raw.get("derivable_from"):
        detail["derivableFrom"] = raw["derivable_from"]
    return detail


def archetype_detail(name: str, raw: dict[str, Any]) -> dict[str, Any]:
    fields: list[dict[str, Any]] = []
    for key, value in raw.items():
        if key in {"description", "site_contexts"}:
            continue
        field: dict[str, Any] = {"name": key}
        if isinstance(value, dict) and "min" in value and "max" in value:
            field["range"] = {"min": value["min"], "max": value["max"]}
        else:
            field["values"] = list_values(value)
        fields.append(field)

    return {
        "name": name,
        "description": raw.get("description", name),
        "siteContexts": raw.get("site_contexts", []),
        "fields": fields,
    }


def difficulty_detail(level: str, raw: dict[str, Any]) -> dict[str, Any]:
    known = {"description", "visibility", "archetypes", "hidden_params", "replacement_text"}
    locked_values = [
        {"name": key, "values": list_values(value)}
        for key, value in raw.items()
        if key not in known
    ]
    detail: dict[str, Any] = {
        "level": level,
        "description": raw.get("description", level),
        "visibility": raw.get("visibility", "all_given"),
        "archetypes": raw.get("archetypes", []),
        "hiddenParams": raw.get("hidden_params", []),
    }
    if raw.get("replacement_text"):
        detail["replacementText"] = raw["replacement_text"]
    if locked_values:
        detail["lockedValues"] = locked_values
    return detail


def representative_value(param: dict[str, Any], archetype: dict[str, Any] | None, difficulty: dict[str, Any]) -> str:
    name = param["name"]
    for locked in difficulty.get("lockedValues", []):
        if locked["name"] == name and locked["values"]:
            return locked["values"][0]
    if archetype:
        for field in archetype.get("fields", []):
            if field["name"] != name:
                continue
            if field.get("range"):
                r = field["range"]
                return f"{as_string(r['min'])} to {as_string(r['max'])}"
            if field.get("values"):
                return field["values"][0]
    if param.get("defaultValue") is not None:
        return param["defaultValue"]
    if param.get("range"):
        r = param["range"]
        return f"{as_string(r['min'])} to {as_string(r['max'])}"
    if param.get("values"):
        return param["values"][0]
    return "declared"


def choose_preview_difficulty(difficulties: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not difficulties:
        return None
    by_level = {d["level"]: d for d in difficulties}
    return by_level.get("hard") or by_level.get("medium") or by_level.get("easy") or difficulties[-1]


def sample_preview(
    meta: dict[str, Any],
    parameters: list[dict[str, Any]],
    outputs: list[dict[str, Any]],
    archetypes: list[dict[str, Any]],
    difficulties: list[dict[str, Any]],
) -> dict[str, Any] | None:
    difficulty = choose_preview_difficulty(difficulties)
    if difficulty is None:
        return None

    archetype_name = difficulty.get("archetypes", [None])[0] if difficulty.get("archetypes") else None
    archetype = next((a for a in archetypes if a["name"] == archetype_name), None)
    site_context = ""
    if archetype and archetype.get("siteContexts"):
        site_context = archetype["siteContexts"][0]

    hidden = set(difficulty.get("hiddenParams", []))
    visible_inputs = [
        {
            "name": param["name"],
            "value": representative_value(param, archetype, difficulty),
            **({"unit": param["unit"]} if param.get("unit") else {}),
        }
        for param in parameters
        if param["name"] not in hidden
    ]

    output_names = [output["name"] for output in outputs]
    prompt_parts = []
    if archetype:
        prompt_parts.append(archetype["description"])
    if site_context:
        prompt_parts.append(site_context)
    if outputs:
        prompt_parts.append("Required outputs: " + ", ".join(output_names[:6]))

    return {
        "name": "-".join(filter(None, [site_context, slugify(archetype_name or "template"), "preview"])),
        "difficulty": difficulty["level"],
        "visibility": difficulty["visibility"],
        "archetype": archetype_name or "",
        "siteContext": site_context,
        "toolScripts": [f"{meta['name']}_calc.py"],
        "visibleInputs": visible_inputs,
        "hiddenInputs": list(hidden),
        "withheldOutputs": output_names,
        "promptExcerpt": ". ".join(prompt_parts),
    }


def template_detail(params_path: Path, source_root: Path) -> tuple[str, dict[str, Any]]:
    raw = tomllib.loads(params_path.read_text(encoding="utf-8"))
    meta = raw["meta"]
    key = f"{meta['discipline']}/{meta['name']}"
    parameters = [parameter_detail(name, value) for name, value in raw.get("params", {}).items()]
    outputs = [
        {
            "name": name,
            "description": value.get("description", name),
            **({"unit": value["unit"]} if value.get("unit") else {}),
            **({"tolerance": value["tolerance"]} if value.get("tolerance") is not None else {}),
        }
        for name, value in raw.get("outputs", {}).items()
    ]
    archetypes = [archetype_detail(name, value) for name, value in raw.get("archetypes", {}).items()]
    difficulties = [difficulty_detail(name, value) for name, value in raw.get("difficulty", {}).items()]

    detail: dict[str, Any] = {
        "key": key,
        "sourcePath": str(params_path.relative_to(source_root)),
        "parameters": parameters,
        "outputs": outputs,
        "archetypes": archetypes,
        "difficulty": difficulties,
    }
    sample = sample_preview(meta, parameters, outputs, archetypes, difficulties)
    if sample is not None:
        detail["sampleInstance"] = sample
    return key, detail


def build_export(source_root: Path, source_commit: str | None) -> dict[str, Any]:
    template_root = source_root / "src" / "aec_bench" / "templates" / "builtin"
    templates: dict[str, Any] = {}
    for params_path in sorted(template_root.glob("*/*/params.toml")):
        template_dir = params_path.parent
        if not (template_dir / "engine.py").exists() or not (template_dir / "instruction.md").exists():
            continue
        key, detail = template_detail(params_path, source_root)
        templates[key] = detail

    return {
        "schema_version": 1,
        "generated_at": datetime.now(UTC).isoformat(),
        "source_commit": source_commit,
        "template_count": len(templates),
        "templates": templates,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export task-template detail supplements")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--worktree", action="store_true", help="read the worktree instead of git archive HEAD")
    args = parser.parse_args()

    if args.worktree:
        source_root = args.source
        tmp = None
    else:
        tmp, source_root = export_committed_tree(args.source)

    try:
        payload = build_export(source_root, git_short_sha(args.source))
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(
            json.dumps(
                {
                    "output": str(args.out),
                    "template_count": payload["template_count"],
                    "source_commit": payload["source_commit"],
                }
            )
        )
    finally:
        if tmp is not None:
            tmp.cleanup()


if __name__ == "__main__":
    main()
