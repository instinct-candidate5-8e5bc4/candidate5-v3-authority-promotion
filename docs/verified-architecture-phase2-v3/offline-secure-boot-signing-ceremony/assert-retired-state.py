#!/usr/bin/env python3
from pathlib import Path
B=Path(__file__).resolve().parent
assert (B/'OWNER-SIGNING-RUNBOOK.ps1').read_text().splitlines()[0].startswith("throw 'E_RETIRED_")
assert (B/'Test-CeremonyContract.ps1').read_text().splitlines()[0].startswith("throw 'E_RETIRED_")
for name in ('README.md','WINDOWS-CEREMONY.md'):
    text=(B/name).read_text()
    assert text.startswith('> RETIRED / HISTORICAL / NON-AUTHORITATIVE.')
    assert 'Status: `RETIRED_HISTORICAL_NON_AUTHORITATIVE`' in text
    active=text.split('## Historical draft preserved for review provenance',1)[0]
    assert 'OWNER_CONFIRMATION_REQUIRED' not in active
    assert 'CEREMONY_READY' not in active
hard=(B/'WINDOWS-IMPLEMENTATION-HARD-STOP.md').read_text()
assert 'Status: `OWNER_DECISION_REQUIRED`' in hard
assert 'sole current status document' in hard
assert 'No ceremony, signer, verifier, qualification or key-generation executable is currently approved.' in hard
print('RETIRED_STATE_PASS')
