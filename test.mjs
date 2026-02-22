import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage()

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`)
    passed++
  } else {
    console.log(`  FAIL: ${msg}`)
    failed++
  }
}

try {
  // Load app and clear data from previous runs via settings
  console.log('\n--- Loading app ---')
  await page.goto('http://localhost:5173/hypomnemata/#/settings')
  await page.waitForSelector('.app-header')
  await page.waitForTimeout(300)
  const clearBtn = await page.$('button:text("Clear all data")')
  if (clearBtn) {
    await clearBtn.click()
    await page.waitForTimeout(100)
    const confirmBtn = await page.$('button:text("Click again to confirm")')
    if (confirmBtn) await confirmBtn.click()
    await page.waitForTimeout(300)
  }
  await page.goto('http://localhost:5173/hypomnemata/')
  await page.waitForSelector('.app-header')
  assert(true, 'App loads with header')

  // Check empty state
  const emptyState = await page.textContent('.empty-state')
  assert(emptyState.includes('Nothing here yet'), 'Empty state shown')

  // Check navigation links
  const navLinks = await page.$$('.app-header nav a')
  assert(navLinks.length === 5, 'Five nav links present')

  // --- Test adding an entry ---
  console.log('\n--- Adding entries ---')
  await page.click('.fab')
  await page.waitForSelector('.entry-form')
  assert(true, 'Entry form opens on FAB click')

  await page.fill('.entry-form textarea', 'The unexamined life is not worth living. #philosophy #wisdom')
  // Wait a moment for tag parsing
  await page.waitForTimeout(100)

  // Check tags are parsed
  const tags = await page.$$('.entry-form-tags .tag')
  assert(tags.length === 2, 'Two tags parsed from text')

  // Add source
  await page.click('.source-toggle')
  await page.fill('.entry-form-source input', 'Socrates, via Plato')

  // Save
  await page.click('button.primary')
  await page.waitForTimeout(300)

  // Entry should appear
  const card = await page.waitForSelector('.entry-card')
  assert(card !== null, 'Entry card appears after save')

  const cardText = await page.textContent('.entry-card-text')
  assert(cardText.includes('unexamined life'), 'Entry text displayed correctly')
  assert(!cardText.includes('#philosophy'), 'Hashtags stripped from card display')

  const cardSource = await page.textContent('.entry-card-source')
  assert(cardSource.includes('Socrates'), 'Source displayed correctly')

  const cardTags = await page.$$('.entry-card-tags .tag')
  assert(cardTags.length === 2, 'Tags displayed on card')

  // --- Add a second entry ---
  console.log('\n--- Adding second entry ---')
  await page.click('.fab')
  await page.waitForSelector('.entry-form textarea')
  await page.fill('.entry-form textarea', 'We suffer more in imagination than in reality. #stoicism #wisdom')
  await page.click('button.primary')
  await page.waitForTimeout(300)

  const cards = await page.$$('.entry-card')
  assert(cards.length === 2, 'Two entry cards displayed')

  // --- Add a third entry with auto-detect source ---
  console.log('\n--- Auto-detect source pattern ---')
  await page.click('.fab')
  await page.waitForSelector('.entry-form textarea')
  await page.fill('.entry-form textarea', 'Know thyself\n— Delphic maxim')
  await page.click('button.primary')
  await page.waitForTimeout(300)

  const allCards = await page.$$('.entry-card')
  assert(allCards.length === 3, 'Three entry cards after third add')

  // Check that source was auto-extracted
  const sources = await page.$$('.entry-card-source')
  const sourcesText = await Promise.all(sources.map(s => s.textContent()))
  const hasDelphic = sourcesText.some(s => s.includes('Delphic'))
  assert(hasDelphic, 'Auto-detected source from "— Author" pattern')

  // --- Test search ---
  console.log('\n--- Testing search ---')
  await page.fill('.search-bar input', 'unexamined')
  await page.waitForTimeout(200)

  const searchResultCount = await page.textContent('.search-results-count')
  assert(searchResultCount.includes('1 result'), 'Search finds 1 result for "unexamined"')

  // Clear search
  await page.fill('.search-bar input', '')
  await page.waitForTimeout(100)

  // --- Test tag filtering ---
  console.log('\n--- Testing tag filtering ---')
  // Click a tag
  const anyTag = await page.$('.entry-card-tags .tag')
  const tagText = await anyTag.textContent()
  console.log('  Clicking tag:', tagText)
  await anyTag.click()
  await page.waitForTimeout(500)

  const filterBar = await page.$('.filter-bar')
  assert(filterBar !== null, 'Filter bar shown after clicking tag')

  if (filterBar) {
    // Clear filter
    await page.click('.filter-bar .clear')
    await page.waitForTimeout(300)
  }

  // --- Test editing ---
  console.log('\n--- Testing edit ---')
  const firstCard = await page.$('.entry-card')
  await firstCard.click()
  await page.waitForSelector('.entry-form')
  assert(true, 'Entry form opens for editing')

  // Cancel edit
  const cancelBtn = await page.$('button:text("cancel")')
  await cancelBtn.click()
  await page.waitForTimeout(100)

  // --- Test Tags view ---
  console.log('\n--- Testing tags view ---')
  await page.click('a[href="#/tags"]')
  await page.waitForTimeout(200)

  const tagRows = await page.$$('.tag-management-row')
  assert(tagRows.length > 0, 'Tags view shows tags')

  // --- Test Meditate view ---
  console.log('\n--- Testing meditate view ---')
  await page.click('a[href="#/meditate"]')
  await page.waitForTimeout(200)

  const meditateText = await page.$('.meditate-entry .text')
  assert(meditateText !== null, 'Meditate view shows an entry')

  const meditatePrompt = await page.$('.meditate-prompt')
  assert(meditatePrompt !== null, 'Meditate view shows a reflection prompt')

  // Draw another
  await page.click('button:text("draw another")')
  await page.waitForTimeout(200)
  assert(true, 'Draw another works without error')

  // --- Test Settings view ---
  console.log('\n--- Testing settings view ---')
  await page.click('a[href="#/settings"]')
  await page.waitForTimeout(200)

  const settingsH2 = await page.textContent('h2')
  assert(settingsH2 === 'Settings', 'Settings view renders')

  // --- Test export ---
  console.log('\n--- Testing export ---')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:text("Export JSON")'),
  ])
  const downloadPath = await download.path()
  assert(downloadPath !== null, 'Export produces a download')

  // Read the exported file
  const fs = await import('fs')
  const exportedJson = fs.readFileSync(downloadPath, 'utf-8')
  const exportedData = JSON.parse(exportedJson)
  assert(exportedData.entries.length === 3, 'Export contains 3 entries')
  assert(exportedData.version === 1, 'Export has version field')

  // --- Test data persistence ---
  console.log('\n--- Testing persistence ---')
  // Check DB contents before reload
  const countBefore = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('hypo')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const tx = db.transaction('entries', 'readonly')
    const store = tx.objectStore('entries')
    const count = await new Promise((resolve, reject) => {
      const req = store.count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return count
  })
  console.log('  Entries in IndexedDB before reload:', countBefore)

  await page.goto('http://localhost:5173/hypomnemata/#/')
  await page.waitForSelector('.app-header')
  await page.waitForTimeout(1000)
  const cardsAfterReload = await page.$$('.entry-card')
  console.log('  Cards after reload:', cardsAfterReload.length)
  assert(cardsAfterReload.length === 3, 'Entries persist after reload')

  // --- Test keyboard shortcut ---
  console.log('\n--- Testing keyboard shortcut ---')
  await page.click('a[href="#/"]')
  await page.waitForTimeout(200)
  await page.keyboard.press('n')
  await page.waitForSelector('.entry-form')
  assert(true, '"n" key opens new entry form')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)
  const formAfterEscape = await page.$('.entry-form')
  assert(formAfterEscape === null, 'Escape closes form')

  // --- Test delete ---
  console.log('\n--- Testing delete ---')
  const cardToDelete = await page.$('.entry-card')
  await cardToDelete.click()
  await page.waitForSelector('.entry-form')
  // Click delete once (shows confirm)
  await page.click('button:text("delete")')
  await page.waitForTimeout(100)
  // Click confirm
  await page.click('button:text("confirm delete")')
  await page.waitForTimeout(300)
  const cardsAfterDelete = await page.$$('.entry-card')
  assert(cardsAfterDelete.length === 2, 'Entry deleted successfully')

  // --- Test import ---
  console.log('\n--- Testing import round-trip ---')
  await page.click('a[href="#/settings"]')
  await page.waitForTimeout(200)

  // Clear all data first
  await page.click('button:text("Clear all data")')
  await page.waitForTimeout(100)
  await page.click('button:text("Click again to confirm")')
  await page.waitForTimeout(300)

  // Navigate back to entries to verify cleared
  await page.click('a[href="#/"]')
  await page.waitForTimeout(200)
  const cardsAfterClear = await page.$$('.entry-card')
  assert(cardsAfterClear.length === 0, 'All entries cleared')

  // Import the previously exported file
  await page.click('a[href="#/settings"]')
  await page.waitForTimeout(200)

  // Write the export data to a temp file for import
  const tempFile = '/tmp/hypo-test-import.json'
  fs.writeFileSync(tempFile, exportedJson)

  const fileInput = await page.$('input[type="file"]')
  await fileInput.setInputFiles(tempFile)
  await page.waitForTimeout(500)

  // Verify import message
  const msg = await page.textContent('.settings')
  assert(msg.includes('Imported 3 entries'), 'Import reports 3 entries')

  // Verify entries are back
  await page.click('a[href="#/"]')
  await page.waitForTimeout(300)
  const cardsAfterImport = await page.$$('.entry-card')
  assert(cardsAfterImport.length === 3, 'Import restores all 3 entries')

  // ============================================================
  // EXTENDED TESTS — deeper coverage
  // ============================================================

  // --- Test editing actually saves changes ---
  console.log('\n--- Testing edit saves changes ---')
  await page.click('a[href="#/"]')
  await page.waitForTimeout(300)
  const editCard = await page.$('.entry-card')
  const originalText = await editCard.textContent()
  await editCard.click()
  await page.waitForSelector('.entry-form textarea')

  // Modify the text
  await page.fill('.entry-form textarea', 'EDITED: The unexamined life is not worth living. #philosophy #wisdom #edited')
  await page.waitForTimeout(100)

  // Verify new tag appears in preview
  const editTags = await page.$$('.entry-form-tags .tag')
  const editTagTexts = await Promise.all(editTags.map(t => t.textContent()))
  assert(editTagTexts.some(t => t === '#edited'), 'New tag previewed during edit')

  // Save via button
  await page.click('button.primary')
  await page.waitForTimeout(300)

  const editedCardText = await page.textContent('.entry-card-text')
  assert(editedCardText.includes('EDITED:'), 'Edit changes saved and displayed')

  // --- Test Cmd+Enter save shortcut ---
  console.log('\n--- Testing Cmd+Enter save ---')
  await page.click('.fab')
  await page.waitForSelector('.entry-form textarea')
  await page.fill('.entry-form textarea', 'Saved via shortcut #shortcut')
  await page.waitForTimeout(100)
  await page.keyboard.press('Meta+Enter')
  await page.waitForTimeout(400)

  const formGone = await page.$('.entry-form')
  assert(formGone === null, 'Cmd+Enter closes form after save')

  const allCardsNow = await page.$$('.entry-card')
  const allTexts = await Promise.all(allCardsNow.map(c => c.textContent()))
  assert(allTexts.some(t => t.includes('Saved via shortcut')), 'Cmd+Enter entry appears in feed')

  // --- Test empty form cannot be saved ---
  console.log('\n--- Testing empty form validation ---')
  await page.click('.fab')
  await page.waitForSelector('.entry-form textarea')
  await page.fill('.entry-form textarea', '   ')
  await page.click('button.primary')
  await page.waitForTimeout(200)
  const formStillOpen = await page.$('.entry-form')
  assert(formStillOpen !== null, 'Empty/whitespace entry cannot be saved')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  // --- Test search with multiple results ---
  console.log('\n--- Testing search with multiple results ---')
  await page.fill('.search-bar input', 'wisdom')
  await page.waitForTimeout(200)
  const multiResultCount = await page.textContent('.search-results-count')
  const multiCount = parseInt(multiResultCount)
  assert(multiCount >= 2, `Search for "wisdom" finds multiple results (${multiCount})`)

  // --- Test fuzzy/prefix search ---
  await page.fill('.search-bar input', 'unexam')  // prefix of "unexamined"
  await page.waitForTimeout(200)
  const fuzzyResults = await page.$$('.entry-card')
  assert(fuzzyResults.length >= 1, 'Prefix search finds partial matches')

  // --- Test search with no results ---
  await page.fill('.search-bar input', 'xyznonexistent')
  await page.waitForTimeout(200)
  const noResultCount = await page.textContent('.search-results-count')
  assert(noResultCount.includes('0 result'), 'Search shows 0 results for gibberish')

  // Clear search
  await page.fill('.search-bar input', '')
  await page.waitForTimeout(100)

  // --- Test tag rename ---
  console.log('\n--- Testing tag rename ---')
  await page.click('a[href="#/tags"]')
  await page.waitForTimeout(300)

  const tagRowsBefore = await page.$$('.tag-management-row')
  const tagCountBefore = tagRowsBefore.length
  assert(tagCountBefore > 0, `Tags view has ${tagCountBefore} tags`)

  // Find and click rename on the first tag
  const renameBtn = await page.$('.tag-management-row button:text("rename")')
  if (renameBtn) {
    await renameBtn.click()
    await page.waitForTimeout(100)

    // An input should appear
    const renameInput = await page.$('.tag-management-row input[type="text"]')
    assert(renameInput !== null, 'Rename input appears')

    if (renameInput) {
      await renameInput.fill('renamed-tag')
      await renameInput.press('Enter')
      await page.waitForTimeout(300)

      // Verify the renamed tag appears
      const allTagTexts = await page.$$eval('.tag-management-row .tag', els => els.map(e => e.textContent))
      assert(allTagTexts.some(t => t.includes('renamed-tag')), 'Tag successfully renamed')
    }
  }

  // --- Test tag filtering shows correct count ---
  console.log('\n--- Testing tag filter result count ---')
  await page.click('a[href="#/"]')
  await page.waitForTimeout(300)

  const totalCardsBefore = (await page.$$('.entry-card')).length
  console.log(`  Total entries: ${totalCardsBefore}`)

  // Click a tag that should filter
  const filterTag2 = await page.$('.entry-card-tags .tag')
  if (filterTag2) {
    const filterTagName = await filterTag2.textContent()
    console.log(`  Filtering by: ${filterTagName}`)
    await filterTag2.click()
    await page.waitForTimeout(500)

    const filteredCards = (await page.$$('.entry-card')).length
    assert(filteredCards <= totalCardsBefore, `Filtered entries (${filteredCards}) <= total (${totalCardsBefore})`)
    assert(filteredCards > 0, 'Filter shows at least one entry')

    // Clear filter
    await page.click('.filter-bar .clear')
    await page.waitForTimeout(300)

    const unfilteredCards = (await page.$$('.entry-card')).length
    assert(unfilteredCards === totalCardsBefore, 'Clearing filter restores all entries')
  }

  // --- Test navigation active states ---
  console.log('\n--- Testing navigation ---')
  await page.click('a[href="#/tags"]')
  await page.waitForTimeout(200)
  const tagsLink = await page.$('a[href="#/tags"]')
  const tagsClass = await tagsLink.getAttribute('class')
  assert(tagsClass.includes('active'), 'Tags nav link has active class')

  await page.click('a[href="#/meditate"]')
  await page.waitForTimeout(200)
  const medLink = await page.$('a[href="#/meditate"]')
  const medClass = await medLink.getAttribute('class')
  assert(medClass.includes('active'), 'Meditate nav link has active class')

  await page.click('a[href="#/"]')
  await page.waitForTimeout(300)
  const entriesLink = await page.$('a[href="#/"].active')
  assert(entriesLink !== null, 'Entries nav link has active class')

  // --- Test meditate shows different entries ---
  console.log('\n--- Testing meditate randomness ---')
  await page.click('a[href="#/meditate"]')
  await page.waitForTimeout(300)

  const texts = new Set()
  for (let i = 0; i < 10; i++) {
    const t = await page.textContent('.meditate-entry .text')
    texts.add(t)
    await page.click('button:text("draw another")')
    await page.waitForTimeout(200)
  }
  assert(texts.size > 1, `Meditate shows variety (${texts.size} unique entries in 10 draws)`)

  // --- Test meditate prompt text exists ---
  const promptText = await page.textContent('.meditate-prompt')
  assert(promptText.length > 5, 'Meditate prompt is non-empty meaningful text')

  // --- Test relative dates render ---
  console.log('\n--- Testing relative dates ---')
  await page.click('a[href="#/"]')
  await page.waitForTimeout(300)
  const dateEl = await page.$('.entry-card-date')
  const dateText = await dateEl.textContent()
  assert(dateText.includes('ago') || dateText === 'just now', `Relative date displayed: "${dateText}"`)

  // --- Test source field toggle ---
  console.log('\n--- Testing source field toggle ---')
  await page.click('.fab')
  await page.waitForSelector('.entry-form')
  // Source toggle should be visible
  const srcToggle = await page.$('.source-toggle')
  assert(srcToggle !== null, 'Source toggle visible on new entry')
  await srcToggle.click()
  const srcInput = await page.$('.entry-form-source input')
  assert(srcInput !== null, 'Source input appears after toggle')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)

  // --- Test editing entry with source pre-fills source field ---
  console.log('\n--- Testing edit pre-fills source ---')
  // Find an entry with a source
  const entryWithSource = await page.$('.entry-card-source')
  if (entryWithSource) {
    const parentCard = await entryWithSource.evaluateHandle(el => el.closest('.entry-card'))
    await parentCard.click()
    await page.waitForSelector('.entry-form')
    const srcField = await page.$('.entry-form-source input')
    assert(srcField !== null, 'Source field shown when editing entry with source')
    if (srcField) {
      const srcValue = await srcField.inputValue()
      assert(srcValue.length > 0, `Source pre-filled: "${srcValue}"`)
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }

  // --- Test entries display newest first ---
  console.log('\n--- Testing sort order ---')
  const entryDates = await page.$$eval('.entry-card-date', els => els.map(e => e.textContent))
  console.log(`  Entry dates: ${entryDates.join(', ')}`)
  assert(entryDates.length > 0, 'Entries have dates displayed')
  // The "Saved via shortcut" entry should be newest (first card)
  const allEntryCards = await page.$$('.entry-card')
  const firstEntryText = await allEntryCards[0].textContent()
  assert(firstEntryText.includes('Saved via shortcut'), 'Newest entry appears first')

  // --- Test export data format integrity ---
  console.log('\n--- Testing export data integrity ---')
  await page.click('a[href="#/settings"]')
  await page.waitForTimeout(200)
  const [download2] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:text("Export JSON")'),
  ])
  const downloadPath2 = await download2.path()
  const exportedJson2 = fs.readFileSync(downloadPath2, 'utf-8')
  const data2 = JSON.parse(exportedJson2)

  assert(data2.exportedAt !== undefined, 'Export has exportedAt timestamp')
  assert(Array.isArray(data2.entries), 'Export entries is an array')
  for (const entry of data2.entries) {
    assert(typeof entry.text === 'string' && entry.text.length > 0, `Entry has text: "${entry.text.slice(0,30)}..."`)
    assert(typeof entry.createdAt === 'number', 'Entry has numeric createdAt')
    assert(typeof entry.updatedAt === 'number', 'Entry has numeric updatedAt')
    assert(Array.isArray(entry.tags), 'Entry has tags array')
  }

  // --- Final state check ---
  console.log('\n--- Final state check ---')
  await page.click('a[href="#/"]')
  await page.waitForTimeout(300)
  const finalCount = (await page.$$('.entry-card')).length
  console.log(`  Total entries at end: ${finalCount}`)
  assert(finalCount > 0, 'App has entries at end of test run')

} catch (err) {
  console.error('\nERROR:', err.message)
  failed++
} finally {
  await browser.close()
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
  process.exit(failed > 0 ? 1 : 0)
}
