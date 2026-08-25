#!/usr/bin/env python3
"""Apply the Audi Connect API-level-1 climate quick-start compatibility fix.

Some vehicles reject the climate request when the CARIAD endpoint receives a
JSON body, even though the same request works without a body. This script only
changes the API-level-1 start branch and leaves legacy climate control and all
other Audi Connect services untouched.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import sys
import tempfile


DEFAULT_TARGET = Path("/config/custom_components/audiconnect/audi_services.py")
PATCH_MARKER = "Smart ESS Audi climate quick-start compatibility"
FUNCTION_START = "    async def start_climate_control("
FUNCTION_END = "    async def set_window_heating("
API_LEVEL_BRANCH = "        elif api_level == 1:"


def patched_source(source: str) -> tuple[str, str]:
    """Return patched source and status: already-patched or patchable."""
    if PATCH_MARKER in source:
        return source, "already-patched"

    try:
        function_start = source.index(FUNCTION_START)
        function_end = source.index(FUNCTION_END, function_start)
    except ValueError as error:
        raise ValueError(
            "Audi Connect start_climate_control was not found; refusing to patch an unknown version."
        ) from error

    function_source = source[function_start:function_end]
    required_fragments = (
        API_LEVEL_BRANCH,
        '"climatisationMode"',
        '"climatisation/start"',
        "data = json.dumps(data)",
        "data=data",
    )
    if not all(fragment in function_source for fragment in required_fragments):
        raise ValueError(
            "The Audi Connect API-level-1 climate implementation is different from the supported version; refusing to patch it."
        )

    branch_offset = function_source.index(API_LEVEL_BRANCH)
    quick_start_branch = f'''        elif api_level == 1:
            # {PATCH_MARKER}: newer vehicles can reject every JSON climate
            # option while accepting the same start request without a body.
            headers = {{
                "Authorization": "Bearer "
                + self._bearer_token_json["access_token"],
                "Accept": "application/json",
                "User-Agent": AudiAPI.HDR_USER_AGENT,
                "X-App-Version": AudiAPI.HDR_XAPP_VERSION,
                "X-App-Name": "myAudi",
            }}
            await self._api.request(
                "POST",
                self.__get_cariad_url_for_vin(vin, "climatisation/start"),
                headers=headers,
                data=None,
            )
'''
    new_function = function_source[:branch_offset] + quick_start_branch
    return source[:function_start] + new_function + source[function_end:], "patchable"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Patch Audi Connect climate start for API-level-1 vehicles that require an empty request body."
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=DEFAULT_TARGET,
        help=f"Path to audi_services.py (default: {DEFAULT_TARGET})",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Only verify whether the installed integration is supported; do not write anything.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    target = args.target.resolve()
    if not target.is_file():
        print(f"Audi Connect source file not found: {target}", file=sys.stderr)
        return 2

    source = target.read_text(encoding="utf-8")
    try:
        result, status = patched_source(source)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 3

    if status == "already-patched":
        print(f"Audi Connect climate compatibility fix is already present in {target}")
        return 0
    if args.check:
        print(f"Audi Connect climate compatibility fix can be applied safely to {target}")
        return 0

    backup = target.with_name(target.name + ".before-smart-ess-climate-fix")
    if not backup.exists():
        shutil.copy2(target, backup)

    original_mode = target.stat().st_mode
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", newline="", dir=target.parent, delete=False
    ) as temporary:
        temporary.write(result)
        temporary_path = Path(temporary.name)
    os.chmod(temporary_path, original_mode)
    os.replace(temporary_path, target)
    print(f"Applied Audi Connect climate compatibility fix to {target}")
    print(f"Original source is available at {backup}")
    print("Restart Home Assistant before testing the climate button.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
