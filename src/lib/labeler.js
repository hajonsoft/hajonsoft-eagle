export async function labeler(page, additionalValue, selector) {
    // Get the innerText of the specified selector
    const originalText = await page.$eval(selector, (el) => el.innerText);
  
    // Combine the original text with the additional value
    const updatedText = `${originalText} ${additionalValue}`;
  
    // Update the innerText of the specified selector
    await page.$eval(
      selector,
      (el, newText) => {
        el.innerText = newText;
      },
      updatedText
    );
  
    // Return the updated text for reference
    return updatedText;
  }
  