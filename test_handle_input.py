import os
import unittest
from playwright.sync_api import sync_playwright

class TestHandleInput(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()
        current_dir = os.path.dirname(os.path.abspath(__file__))
        cls.file_url = f"file://{os.path.join(current_dir, 'index.html')}"

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.page = self.browser.new_page()

        # Block external font requests to prevent timeouts
        self.page.route("**/*.{ttf,woff,woff2}", lambda route: route.abort())
        self.page.route("**/*fonts.googleapis.com*", lambda route: route.abort())
        self.page.route("**/*fonts.gstatic.com*", lambda route: route.abort())

        # Use domcontentloaded so event listeners are fully registered before test
        self.page.goto(self.file_url, wait_until='domcontentloaded')

    def tearDown(self):
        self.page.close()

    def test_words_count_updates(self):
        editor = self.page.locator('#editor')
        words_count = self.page.locator('#words-count')

        # Explicit wait to make sure elements are ready
        editor.wait_for(state="attached")

        editor.fill("Hello World")
        self.assertEqual(words_count.inner_text(), "02")

        editor.fill("")
        self.assertEqual(words_count.inner_text(), "00")

    def test_display_spans_created(self):
        editor = self.page.locator('#editor')
        display = self.page.locator('#display')

        editor.wait_for(state="attached")

        editor.fill("Test")
        # Verify 4 spans are created in #display
        spans = display.locator('span.char')

        # Need to wait for spans to be rendered
        self.page.wait_for_selector('#display span.char')

        self.assertEqual(spans.count(), 4)

        # Verify characters
        self.assertEqual(spans.nth(0).inner_text(), "T")
        self.assertEqual(spans.nth(1).inner_text(), "e")
        self.assertEqual(spans.nth(2).inner_text(), "s")
        self.assertEqual(spans.nth(3).inner_text(), "t")

        editor.fill("Hello")
        self.assertEqual(spans.count(), 5)

    def test_handle_input_triggered_on_input_event(self):
        # We need to make sure the dom is loaded before we evaluate this script.
        # Wait for the editor to exist.
        self.page.locator('#editor').wait_for(state="attached")

        self.page.evaluate("""
            const ed = document.getElementById('editor');
            if (ed) {
                ed.value = 'Direct Input';
                ed.dispatchEvent(new Event('input'));
            }
        """)

        words_count = self.page.locator('#words-count')
        self.assertEqual(words_count.inner_text(), "02")

        display = self.page.locator('#display')
        spans = display.locator('span.char')
        self.assertEqual(spans.count(), 12)

if __name__ == '__main__':
    unittest.main()
