import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('privacy', Path(__file__).with_name('sanitize_history.py'))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
class MetadataRewriteTests(unittest.TestCase):
    def test_only_owned_email_and_changed_parents(self):
        raw=(b'tree '+b'a'*40+b'\nparent '+b'b'*40+b'\nauthor SUSANO-OOO <private@example.test> 1000 +0900\ncommitter GitHub <noreply@github.com> 1001 +0000\ngpgsig invalid\n signature continuation\n\nmessage intact\n')
        updated=m.rewrite_commit(raw, {'b'*40:'c'*40}, {b'private@example.test'})
        self.assertIn(b'tree '+b'a'*40, updated)
        self.assertIn(b'parent '+b'c'*40, updated)
        self.assertIn(m.NOREPLY, updated)
        self.assertIn(b'committer GitHub <noreply@github.com> 1001 +0000', updated)
        self.assertTrue(updated.endswith(b'\n\nmessage intact\n'))
        self.assertNotIn(b'gpgsig', updated)
    def test_no_change_is_identical(self):
        raw=b'tree a\nauthor Other <other@example.test> 1 +0000\ngpgsig keep\n continuation\n\nbody'
        self.assertEqual(m.rewrite_commit(raw, {}, {b'owner@example.test'}),raw)
    def test_merge_parent_mapping(self):
        raw=b'tree a\nparent one\nparent two\nauthor SUSANO-OOO <owner@example.test> 1 +0000\n\nmerge'
        updated=m.rewrite_commit(raw, {'one':'newone','two':'newtwo'}, {b'owner@example.test'})
        self.assertIn(b'parent newone\nparent newtwo',updated)
if __name__=='__main__': unittest.main()
