from pathlib import Path
import json,re
R=Path(__file__).parent;x=json.loads((R/'argument-flow-fixture.v1.json').read_text());init=(R/'uki/initramfs/init').read_text();sup=(R/'measured-supervisor.c').read_text();launch=(R.parent/'external-admission-launcher-candidate/external-measured-admission-launcher.review-bytes').read_text()
a=x['initToSupervisor'];assert all(v in init for k,v in a.items() if k!='argv1');assert 'exec /bin/measured-supervisor "$ROOT_HASH" /reviewed-root /reviewed-input /reviewed-output/final /reviewed-evidence/final' in init
b=x['supervisorToLauncher'];assert 'char *const args[]={"/usr/bin/bash",fd,av[2],av[3],av[4],av[5],NULL}' in sup
assert 'REPO=$1; INPUT=$2; OUTPUT=$3; EVIDENCE=$4' in launch and '[ -d "$INPUT" ] && [ ! -e "$OUTPUT" ]' in launch
assert 'exec /usr/bin/bash --noprofile --norc "$fd" "$INPUT" "$OUTPUT"' in launch
assert all(x['simultaneousPreconditions'].values());assert '[ ! -e /verity-root/reviewed-output/final ]' in init and 'final.admission-stage' in init
print('ARGUMENT_FLOW_FIXTURE=PASS')
