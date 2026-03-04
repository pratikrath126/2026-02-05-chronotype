import os
from playwright.sync_api import sync_playwright, expect

def test_initial_message_state():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Block external resources
        page.route("https://fonts.googleapis.com/**", lambda route: route.abort())
        page.route("https://fonts.gstatic.com/**", lambda route: route.abort())

        path = os.path.abspath("index.html")
        page.goto(f"file://{path}", wait_until="domcontentloaded")

        # 1. Check editor is empty after initialization
        editor = page.locator("#editor")
        expect(editor).to_have_value("")

        # 2. Check editor placeholder
        expect(editor).to_have_attribute("placeholder", "Start typing...")

        # 3. Check display contains the expected placeholder text
        display = page.locator("#display")
        expected_text = "Welcome to ChronoType."
        expect(display).to_contain_text(expected_text)

        # Check that it contains spans (characters styled by applyStyles)
        span_count = page.evaluate("document.querySelectorAll('#display span.char').length")
        assert span_count > 0

        print("test_initial_message_state passed")
        browser.close()

def test_initial_message_full_text():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.route("https://fonts.googleapis.com/**", lambda route: route.abort())
        page.route("https://fonts.gstatic.com/**", lambda route: route.abort())

        path = os.path.abspath("index.html")
        page.goto(f"file://{path}", wait_until="domcontentloaded")

        display_text = page.evaluate("document.getElementById('display').textContent")

        assert "Welcome to ChronoType." in display_text
        assert "Your words shape themselves by the rhythm of your thoughts." in display_text
        assert "Type fast for a bold, futuristic feel." in display_text
        assert "Type slow and deliberate for an elegant, classic script." in display_text
        assert "Pauses create moments of digital decay." in display_text
        assert "Begin typing to start your temporal story..." in display_text

        print("test_initial_message_full_text passed")
        browser.close()

if __name__ == "__main__":
    test_initial_message_state()
    test_initial_message_full_text()
    print("All tests passed!")
