"""Structural regressions for readable mobile forms; not a browser/layout test."""
import unittest
from html.parser import HTMLParser
from pathlib import Path
class Node:
 def __init__(self,tag,attrs,parent=None):
  self.tag=tag;self.attrs=dict(attrs);self.parent=parent;self.children=[]
 def inside(self,parent):
  n=self.parent
  while n:
   if n is parent:return True
   n=n.parent
  return False
class Tree(HTMLParser):
 def __init__(self,html):
  super().__init__();self.root=Node('root',[]);self.stack=[self.root];self.ids={};self.feed(html)
 def handle_starttag(self,tag,attrs):
  n=Node(tag,attrs,self.stack[-1]);self.stack[-1].children.append(n)
  if 'id' in n.attrs:
   assert n.attrs['id'] not in self.ids,'Duplicate id '+n.attrs['id']
   self.ids[n.attrs['id']]=n
  if tag not in ['input','meta','link','br','hr','img','source']:self.stack.append(n)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==tag:
    self.stack=self.stack[:i];return
class Contract(unittest.TestCase):
 def setUp(self):
  self.nodes=Tree((Path(__file__).resolve().parents[1]/'pages/login.html').read_text(encoding='utf-8')).ids
 def test_controls_keep_form_scope_but_navigation_is_outside_answer_scroller(self):
  n=self.nodes;form=n['cdf-register-form'];answers=n['register-answers']
  self.assertTrue(answers.inside(form))
  for name in ['reg-username','reg-email','reg-password','cdf-account-consent']:
   self.assertTrue(n[name].inside(answers),name)
  self.assertTrue(n['journey-next'].inside(form));self.assertFalse(n['journey-next'].inside(answers))
  self.assertEqual(n['journey-next'].attrs['type'],'submit')
  self.assertEqual(n['journey-back'].attrs['type'],'button')
 def test_consent_and_password_semantics_are_preserved(self):
  n=self.nodes
  self.assertEqual(n['reg-password'].attrs['type'],'password');self.assertIn('required',n['reg-password'].attrs)
  self.assertEqual(n['cdf-account-consent'].attrs['type'],'checkbox');self.assertIn('required',n['cdf-account-consent'].attrs)
  self.assertNotIn('checked',n['cdf-account-consent'].attrs)
  self.assertFalse(n['cdf-login-form'].inside(n['register-answers']))
 def test_speech_question_does_not_replace_original_help_or_live_copy(self):
  n=self.nodes
  self.assertEqual(n['flowee-question'].attrs['aria-live'],'polite')
  self.assertEqual(n['flowee-more'].tag,'details')
  for name in ['flowee-dialogue','flowee-help','flowee-help-copy']:self.assertTrue(n[name].inside(n['flowee-more']))
if __name__=='__main__':unittest.main()
