const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fileUrl = 'file://' + path.resolve('index.html');
  await page.goto(fileUrl, { waitUntil: 'commit' });

  // Remove the font stylesheet to avoid network timeouts during tests
  await page.evaluate(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(l => l.remove());
  });

  // Wait for initial load
  await page.waitForSelector("#display span", { state: "attached" });

  // Helper to set state and call updateUI (which corresponds to applyStyles in the code logic)
  const setStateAndUpdate = async (text, speed) => {
    await page.evaluate(({ text, speed }) => {
      document.getElementById('editor').value = text;
      typingSpeed = speed;
      applyStyles();
    }, { text, speed });
  };

  try {
    // Test case 1: Empty input clears display
    await setStateAndUpdate('', 0);
    let spanCount = await page.locator("#display .char").count();
    if (spanCount !== 0) throw new Error(`Expected 0 spans, got ${spanCount}`);

    // Test case 2: Slow typing speed (<= 3)
    await setStateAndUpdate('a', 2);
    spanCount = await page.locator("#display .char").count();
    if (spanCount !== 1) throw new Error(`Expected 1 span, got ${spanCount}`);

    let fontWeight = await page.locator("#display .char").nth(0).evaluate(node => node.style.fontWeight);
    if (fontWeight !== '300') throw new Error(`Expected fontWeight 300, got ${fontWeight}`);

    let color = await page.locator("#display .char").nth(0).evaluate(node => node.style.color);
    if (color !== 'rgb(203, 213, 225)') throw new Error(`Expected color rgb(203, 213, 225), got ${color}`);

    // Test case 3: Moderate typing speed (3 < speed <= 8)
    await setStateAndUpdate('b', 5);
    fontWeight = await page.locator("#display .char").nth(0).evaluate(node => node.style.fontWeight);
    if (fontWeight !== '400') throw new Error(`Expected fontWeight 400, got ${fontWeight}`);

    color = await page.locator("#display .char").nth(0).evaluate(node => node.style.color);
    if (color !== 'rgb(226, 232, 240)') throw new Error(`Expected color rgb(226, 232, 240), got ${color}`);

    // Test case 4: Fast typing speed (8 < speed <= 15)
    await setStateAndUpdate('c', 10);
    fontWeight = await page.locator("#display .char").nth(0).evaluate(node => node.style.fontWeight);
    if (fontWeight !== '600') throw new Error(`Expected fontWeight 600, got ${fontWeight}`);

    color = await page.locator("#display .char").nth(0).evaluate(node => node.style.color);
    if (color !== 'rgb(148, 163, 184)') throw new Error(`Expected color rgb(148, 163, 184), got ${color}`);

    let letterSpacing = await page.locator("#display .char").nth(0).evaluate(node => node.style.letterSpacing);
    if (letterSpacing !== '0.02em') throw new Error(`Expected letterSpacing 0.02em, got ${letterSpacing}`);

    // Test case 5: Very Fast typing speed (> 15)
    await setStateAndUpdate('d', 20);
    fontWeight = await page.locator("#display .char").nth(0).evaluate(node => node.style.fontWeight);
    if (fontWeight !== '700') throw new Error(`Expected fontWeight 700, got ${fontWeight}`);

    color = await page.locator("#display .char").nth(0).evaluate(node => node.style.color);
    if (color !== 'rgb(43, 140, 238)') throw new Error(`Expected color rgb(43, 140, 238), got ${color}`);

    let fontStyle = await page.locator("#display .char").nth(0).evaluate(node => node.style.fontStyle);
    if (fontStyle !== 'italic') throw new Error(`Expected fontStyle italic, got ${fontStyle}`);

    letterSpacing = await page.locator("#display .char").nth(0).evaluate(node => node.style.letterSpacing);
    if (letterSpacing !== '0.05em') throw new Error(`Expected letterSpacing 0.05em, got ${letterSpacing}`);

    let transform = await page.locator("#display .char").nth(0).evaluate(node => node.style.transform);
    if (transform !== 'scale(1.05)') throw new Error(`Expected transform scale(1.05), got ${transform}`);

    // Test case 6: Spaces reset certain styles
    await setStateAndUpdate(' ', 20);
    fontStyle = await page.locator("#display .char").nth(0).evaluate(node => node.style.fontStyle);
    if (fontStyle !== 'normal') throw new Error(`Expected fontStyle normal for space, got ${fontStyle}`);

    letterSpacing = await page.locator("#display .char").nth(0).evaluate(node => node.style.letterSpacing);
    if (letterSpacing !== 'normal') throw new Error(`Expected letterSpacing normal for space, got ${letterSpacing}`);

    transform = await page.locator("#display .char").nth(0).evaluate(node => node.style.transform);
    if (transform !== 'none') throw new Error(`Expected transform none for space, got ${transform}`);

    console.log("All tests passed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
