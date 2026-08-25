from __future__ import annotations

import importlib.util
from pathlib import Path
import sys


sys.dont_write_bytecode = True


SCRIPT = Path(__file__).parents[1] / "scripts" / "patch-audiconnect-climate.py"
SPEC = importlib.util.spec_from_file_location("audiconnect_climate_patcher", SCRIPT)
assert SPEC and SPEC.loader
PATCHER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PATCHER)

SOURCE = '''    async def start_climate_control(
        self, vin
    ):
        if api_level == 0:
            keep_legacy = True
        elif api_level == 1:
            data = {"climatisationMode": "comfort"}
            data = json.dumps(data)
            await self._api.request(
                "POST",
                self.__get_cariad_url_for_vin(vin, "climatisation/start"),
                data=data,
            )
    async def set_window_heating(
        self, vin
    ):
        pass
'''

result, status = PATCHER.patched_source(SOURCE)
assert status == "patchable"
assert PATCHER.PATCH_MARKER in result
assert "data=None" in result
assert '"climatisationMode"' not in result
assert "keep_legacy = True" in result

second_result, second_status = PATCHER.patched_source(result)
assert second_status == "already-patched"
assert second_result == result

print("Audi Connect-compatibiliteitsfix: OK")
