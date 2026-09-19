#!/usr/bin/env python3
from pathlib import Path
B=Path(__file__).resolve().parent
R=B.parent
assert (B/'OWNER-SIGNING-RUNBOOK.ps1').read_text().splitlines()[0].startswith("throw 'E_RETIRED_")
assert (B/'Test-CeremonyContract.ps1').read_text().splitlines()[0].startswith("throw 'E_RETIRED_")
for name in ('README.md','WINDOWS-CEREMONY.md'):
    text=(B/name).read_text()
    assert text.startswith('> RETIRED / HISTORICAL / NON-AUTHORITATIVE.')
    assert 'Status: `RETIRED_HISTORICAL_NON_AUTHORITATIVE`' in text
for name in ('successor-uki-signing-key-hard-stop.md','new-secure-boot-key-custody-hard-stop.md'):
    assert (R/name).read_text().startswith('> SUPERSEDED / HISTORICAL / NON-AUTHORITATIVE.')
hard=(B/'WINDOWS-IMPLEMENTATION-HARD-STOP.md').read_text()
assert hard.startswith('> SUPERSEDED / HISTORICAL / NON-AUTHORITATIVE.')
design=(R/'minimal-successor-uki-design.md').read_text()
assert 'Status: `MINIMAL_SUCCESSOR_UKI_DESIGN_READY_FOR_INDEPENDENT_REVIEW`' in design
assert 'The two historical PowerShell entrypoints remain inert' in design
print('RETIRED_STATE_PASS')
