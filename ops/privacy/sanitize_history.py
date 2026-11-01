"""Owner-authorized, email-only Git history rewrite. Never changes tree content."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

REPO = 'SUSANO-OOO/kongai-renai-action-simulator'
OWNER = b'SUSANO-OOO'
NOREPLY = b'301576978+SUSANO-OOO@users.noreply.github.com'
IDENTITY = re.compile(rb'^(author|committer|tagger) (.*) <([^<>]*)> (.+)$')

def git(*args: str, data: bytes | None = None) -> bytes:
    run = subprocess.run(['git', *args], input=data, capture_output=True)
    if run.returncode:
        raise RuntimeError('Git operation failed: ' + args[0] + ' (details suppressed to avoid publishing personal metadata)')
    return run.stdout

def records(header: bytes) -> list[bytes]:
    result: list[bytes] = []
    for line in header.split(b'\n'):
        if line.startswith(b' ') and result:
            result[-1] += b'\n' + line
        else:
            result.append(line)
    return result

def rewrite_commit(raw: bytes, parents: dict[str, str], emails: set[bytes]) -> bytes:
    head, body = raw.split(b'\n\n', 1)
    revised: list[bytes] = []
    changed = False
    for field in records(head):
        if field.startswith(b'parent '):
            old = field[7:].decode('ascii')
            new = parents.get(old, old)
            revised.append(b'parent ' + new.encode('ascii'))
            changed |= old != new
        else:
            match = IDENTITY.fullmatch(field)
            if match and match.group(3) in emails:
                revised.append(match.group(1) + b' ' + match.group(2) + b' <' + NOREPLY + b'> ' + match.group(4))
                changed |= match.group(3) != NOREPLY
            else:
                revised.append(field)
    if not changed:
        return raw
    # Signatures cannot remain valid after parent/identity bytes change.
    revised = [f for f in revised if not f.startswith((b'gpgsig ', b'gpgsig-sha256 ', b'mergetag '))]
    return b'\n'.join(revised) + b'\n\n' + body

def remote_refs() -> dict[str, str]:
    lines = git('ls-remote', '--refs', 'origin', 'refs/heads/*', 'refs/tags/*').decode().splitlines()
    refs: dict[str, str] = {}
    for line in lines:
        sha, name = line.split('\t')
        if not re.fullmatch(r'[a-f0-9]{40}', sha):
            raise RuntimeError('Unsupported Git object ID')
        refs[name] = sha
    return refs

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if not args.apply:
        raise SystemExit('No write performed. Explicit --apply is required.')
    if os.environ.get('GITHUB_REPOSITORY') != REPO or os.environ.get('GITHUB_REF') != 'refs/heads/main':
        raise RuntimeError('This operation is restricted to the authorized repository main workflow')
    auth = json.loads(Path('ops/privacy/authorization.json').read_text())
    if auth.get('repository') != REPO or auth.get('owner') != OWNER.decode() or auth.get('historyRewriteAuthorized') is not True:
        raise RuntimeError('Explicit owner authorization is missing')
    origin = git('config', '--get', 'remote.origin.url').decode().strip()
    if origin not in ['https://github.com/' + REPO, 'https://github.com/' + REPO + '.git']:
        raise RuntimeError('Origin is not the authorized GitHub repository')
    root = Path(git('rev-parse', '--show-toplevel').decode().strip())
    out = Path(os.environ.get('RUNNER_TEMP', tempfile.gettempdir())) / 'owner-email-privacy'
    out.mkdir(parents=True, exist_ok=True)
    before = remote_refs()
    if 'refs/heads/main' not in before:
        raise RuntimeError('Main is missing')
    for ref in before:
        git('fetch', '--no-tags', 'origin', '+' + ref + ':refs/privacy-input/' + ref.removeprefix('refs/'))
    if remote_refs() != before:
        raise RuntimeError('Remote changed during snapshot; no write performed')
    # Lightweight tags are supported. Annotated/signed tags need separate review.
    if any(git('cat-file', '-t', sha).strip() != b'commit' for sha in before.values()):
        raise RuntimeError('Annotated tag or non-commit ref found; no history written')
    commits = git('rev-list', '--reverse', '--topo-order', *sorted(set(before.values()))).decode().splitlines()
    raw = {sha: git('cat-file', 'commit', sha) for sha in commits}
    emails: set[bytes] = set()
    for content in raw.values():
        for field in records(content.split(b'\n\n', 1)[0]):
            match = IDENTITY.fullmatch(field)
            if match and match.group(2) == OWNER and not match.group(3).endswith((b'@users.noreply.github.com', b'@github.com')):
                emails.add(match.group(3))
    report = {'repository': REPO, 'status': 'no_change_needed', 'commitsInspected': len(commits), 'ownerAddressesMatched': len(emails), 'treeContentsUnchanged': True, 'remoteRefsVerified': False, 'serverPrRefsAndCachesErased': False}
    if not emails:
        report['remoteRefsVerified'] = True
        (out / 'verification.json').write_text(json.dumps(report, indent=2))
        print(json.dumps(report))
        return
    bundle = out / 'recovery.bundle'
    encrypted = out / 'recovery.bundle.p7m'
    try:
        git('bundle', 'create', str(bundle), '--all')
        process = subprocess.run(['openssl', 'cms', '-encrypt', '-binary', '-aes-256-cbc', '-in', str(bundle), '-out', str(encrypted), '-outform', 'DER', str(root / 'ops/privacy/recovery-public-cert.pem')], capture_output=True)
        if process.returncode or not encrypted.is_file():
            raise RuntimeError('Encrypted recovery creation failed; no remote write performed')
        report['encryptedBackupSha256'] = hashlib.sha256(encrypted.read_bytes()).hexdigest()
    finally:
        bundle.unlink(missing_ok=True)
    mapping: dict[str, str] = {}
    rewritten = 0
    for old in commits:
        new_bytes = rewrite_commit(raw[old], mapping, emails)
        new = git('hash-object', '-t', 'commit', '-w', '--stdin', data=new_bytes).decode().strip()
        if git('show', '-s', '--format=%T', old) != git('show', '-s', '--format=%T', new):
            raise RuntimeError('Tree preservation check failed; no remote write performed')
        mapping[old] = new
        rewritten += new != old
    desired = {ref: mapping[sha] for ref, sha in before.items()}
    for sha in mapping.values():
        for field in records(git('cat-file', 'commit', sha).split(b'\n\n', 1)[0]):
            match = IDENTITY.fullmatch(field)
            if match and match.group(3) in emails:
                raise RuntimeError('Email remains in reconstructed commits; no remote write performed')
    if remote_refs() != before:
        raise RuntimeError('Concurrent remote update detected; no write performed')
    changes = {ref: sha for ref, sha in desired.items() if sha != before[ref]}
    if changes:
        git('push', '--atomic', *['--force-with-lease=' + ref + ':' + before[ref] for ref in changes], 'origin', *[sha + ':' + ref for ref, sha in changes.items()])
    if remote_refs() != desired:
        raise RuntimeError('Post-push verification differs; inspect remote before further changes')
    report.update(status='published_refs_rewritten', commitsRewritten=rewritten, refsRewritten=len(changes), remoteRefsVerified=True, main=desired['refs/heads/main'], signedCommitHeadersRemovedWhenInvalidated=True)
    (out / 'verification.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report))

if __name__ == '__main__':
    main()
