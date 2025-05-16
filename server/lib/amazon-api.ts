import playwright from 'playwright';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';

const execAsync = promisify(exec);

// Sleep function to handle rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Amazon Product API interface
interface AmazonProduct {
  title: string;
  asin: string;
  image_url: string;
  price_cents: number;
}

// Mobile user agent for more reliable scraping
const MOBILE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.amazon.com/"
};

// Extract ASIN from Amazon URL
export function extractAsin(url: string): string {
  // Regular expression to match ASIN patterns in Amazon URLs
  const asinPattern = /(?:\/dp\/|\/gp\/product\/|\/ASIN\/|%2Fdp%2F)([A-Z0-9]{10})/i;
  const match = url.match(asinPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  throw new Error("Could not extract ASIN from URL. Please provide a valid Amazon product URL.");
}

// Parse price string to cents
function parsePriceToCents(priceStr: string): number {
  // Remove currency symbols and commas, then extract numerical value
  const cleanedPrice = priceStr.replace(/[^\d.]/g, '');
  const price = parseFloat(cleanedPrice);
  
  if (isNaN(price)) {
    throw new Error(`Invalid price format: ${priceStr}`);
  }
  
  // Convert to cents
  return Math.round(price * 100);
}

// Scrape Amazon product using Playwright (updated for 2025)
async function scrapeWithPlaywright(url: string): Promise<AmazonProduct> {
  console.log(`Scraping Amazon product with Playwright: ${url}`);
  let browser = null;
  
  try {
    // Launch browser with short timeout (6 seconds as recommended)
    const browserTimeout = 6000; // 6 seconds max
    
    browser = await playwright.chromium.launch({
      headless: true,
      timeout: browserTimeout,
    });
    
    const context = await browser.newContext({
      userAgent: MOBILE_HEADERS["User-Agent"], // Use the mobile user agent
      extraHTTPHeaders: {
        "Accept-Language": MOBILE_HEADERS["Accept-Language"],
        "Referer": MOBILE_HEADERS["Referer"],
      }
    });
    
    const page = await context.newPage();
    
    // Navigate to product page with reduced timeout
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: browserTimeout });
    
    // Extract ASIN from URL
    const asin = extractAsin(url);
    
    // Wait for updated price selector (as of Feb 2025 according to the document)
    const priceSelectors = [
      '#corePriceDisplay_desktop_feature_div span.a-offscreen', // Updated 2025 selector
      '.a-price .a-offscreen',                                 // Older alternatives
      '#priceblock_ourprice',
      '#priceblock_dealprice'
    ];
    
    // Use Promise.race to enforce strict timeout
    const pagePromise = new Promise<AmazonProduct>(async (resolve, reject) => {
      try {
        // Wait for at least one of the selectors
        for (const selector of priceSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 }).catch(() => null);
            break; // If found, stop looking
          } catch {
            continue; // Try next selector
          }
        }
        
        // Extract product title - check og:title meta tag first (more reliable)
        let title = await page.evaluate(() => {
          const metaTitle = document.querySelector('meta[property="og:title"]');
          if (metaTitle && metaTitle.getAttribute('content')) {
            return metaTitle.getAttribute('content');
          }
          
          const titleElement = document.querySelector('#productTitle, #title');
          return titleElement && titleElement.textContent ? titleElement.textContent.trim() : '';
        });
        
        if (!title) {
          throw new Error("Could not extract product title");
        }
        
        // Extract product image - prioritize og:image meta tag
        const imageUrl = await page.evaluate(() => {
          const metaImage = document.querySelector('meta[property="og:image"]');
          if (metaImage && metaImage.getAttribute('content')) {
            return metaImage.getAttribute('content');
          }
          
          const imgElement = document.querySelector('#landingImage, #imgBlkFront');
          return imgElement ? imgElement.getAttribute('src') || '' : '';
        });
        
        // Extract price using updated selectors
        const priceStr = await page.evaluate((selectors) => {
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              return element.textContent.trim();
            }
          }
          return null;
        }, priceSelectors);
        
        if (!priceStr) {
          throw new Error("Could not extract product price");
        }
        
        const priceCents = parsePriceToCents(priceStr);
        
        resolve({
          title,
          asin,
          image_url: imageUrl,
          price_cents: priceCents,
        });
      } catch (error) {
        reject(error);
      }
    });
    
    // Set a hard timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Playwright scraping timed out after ${browserTimeout}ms`)), browserTimeout);
    });
    
    // Race the page processing against the timeout
    return await Promise.race([pagePromise, timeoutPromise]);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Fallback scraping using curl
async function scrapeWithCurl(url: string): Promise<AmazonProduct> {
  try {
    // For shortened URLs, resolve the redirect first
    let fullUrl = url;
    
    // If it's a shortened URL, resolve it first
    if (url.includes('a.co/')) {
      try {
        // Execute curl with head request to get the redirect location
        const redirectCommand = `curl -s -L -I -o /dev/null -w %{url_effective} "${url}"`;
        console.log(`Resolving shortened URL: ${redirectCommand}`);
        const { stdout: redirectUrl } = await execAsync(redirectCommand);
        
        if (redirectUrl && redirectUrl !== url) {
          fullUrl = redirectUrl;
          console.log(`Resolved shortened URL to: ${fullUrl}`);
        }
      } catch (error: unknown) {
        console.error('Failed to resolve shortened URL:', error);
        // Continue with original URL if resolution fails
      }
    }
    
    let asin: string;
    try {
      asin = extractAsin(fullUrl);
    } catch (error) {
      // If we can't extract ASIN from the current URL, just use a dummy ASIN
      // The product details will still be scraped correctly from the page
      asin = 'UNKNOWN10X';
    }
    
    // Follow redirects (-L flag) and limit output size to avoid buffer overflow
    const curlCommand = `curl -s -L --max-filesize 500000 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "${fullUrl}"`;
    console.log(`Executing curl command: ${curlCommand}`);
    
    const { stdout } = await execAsync(curlCommand);
    
    // Check if we got a valid response
    if (!stdout || stdout.includes('Robot Check') || stdout.includes('captcha')) {
      throw new Error("Amazon is blocking our request. Please try again later.");
    }
    
    // Check if we got a product page or a search results page
    let isProductPage = stdout.includes('id="productTitle"') || 
                       stdout.includes('id="title"') ||
                       stdout.includes('id="dp-container"');
    
    // Basic regex patterns to extract info from HTML
    let title = "Unknown Product";
    const titleRegexes = [
      /<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i,
      /<h1 id="title"[^>]*>([\s\S]*?)<\/h1>/i,
      /<title>(.*?)(Amazon\.com|Amazon|):?\s*(.*?)<\/title>/i
    ];
    
    for (const regex of titleRegexes) {
      const match = stdout.match(regex);
      if (match) {
        if (regex.toString().includes('title>') && match[3]) {
          // Handle the title tag pattern
          title = match[3].trim();
        } else if (match[1]) {
          title = match[1].trim();
        }
        
        if (title && title !== "Unknown Product") {
          break;
        }
      }
    }
    
    // If it's a search result, try to extract the title differently
    if (!isProductPage && title === "Unknown Product") {
      const searchTitleRegex = /<h2 class="a-size-mini[^>]*><a[^>]*>([\s\S]*?)<\/a>/i;
      const searchTitleMatch = stdout.match(searchTitleRegex);
      if (searchTitleMatch && searchTitleMatch[1]) {
        title = searchTitleMatch[1].trim();
      }
    }
    
    // Clean HTML entities from title
    title = title.replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' '); // Normalize whitespace
    
    // Extract image - try multiple patterns
    let imageUrl = null;
    const imageRegexes = [
      /"large":"(https:\/\/[^"]+)"/i,
      /id="landingImage"[^>]*src="([^"]+)"/i,
      /id="imgBlkFront"[^>]*src="([^"]+)"/i,
      /"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i,
      /data-a-dynamic-image="{"([^"]+)":/i
    ];
    
    for (const regex of imageRegexes) {
      const match = stdout.match(regex);
      if (match && match[1]) {
        imageUrl = match[1].replace(/&amp;/g, '&');
        break;
      }
    }
    
    // Extract price - try multiple patterns
    let priceCents = 0;
    const priceRegexes = [
      /"price":{"value":([0-9.]+),/i,
      /id="priceblock_ourprice"[^>]*>([^<]+)</i,
      /class="a-offscreen">([^<]+)</i,
      /class="a-price[^"]*"[^>]*><span[^>]*>([^<]+)</i,
      /price":[^{]*{[^}]*"value":([0-9.]+),/i,
      /"priceAmount":([0-9.]+),/i,
      /class="a-color-price[^"]*"[^>]*>([^<]+)</i
    ];
    
    for (const regex of priceRegexes) {
      const match = stdout.match(regex);
      if (match && match[1]) {
        try {
          priceCents = parsePriceToCents(match[1]);
          if (priceCents > 0) {
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    if (priceCents === 0) {
      // Check for price range
      const priceRangeRegex = /([0-9.,]+) - \$?([0-9.,]+)/;
      const rangeMatch = stdout.match(priceRangeRegex);
      if (rangeMatch && rangeMatch[2]) {
        try {
          // Use the higher price in the range
          priceCents = parsePriceToCents(rangeMatch[2]);
        } catch (e) {
          // Use default fallback
          priceCents = 999;
        }
      } else {
        // Fallback price if we couldn't extract it
        priceCents = 999;
      }
    }
    
    return {
      title,
      asin,
      image_url: imageUrl || "https://placehold.co/400x400?text=No+Image",
      price_cents: priceCents,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Curl scraping failed: ${errorMessage}`);
  }
}

// CamelCamelCamel price scraper (more reliable than Amazon direct)
async function scrapeCamelPrice(asin: string): Promise<number> {
  console.log(`Scraping CamelCamelCamel for price: ${asin}`);
  const url = `https://camelcamelcamel.com/product/${asin}`;
  
  // Use curl with desktop headers, limit file size to prevent buffer overflow
  const curlCommand = `curl -s -L --max-filesize 500000 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" -H "Accept-Language: en-US,en;q=0.9" "${url}"`;
  
  const { stdout } = await execAsync(curlCommand);
  
  if (!stdout) {
    throw new Error("Empty response from CamelCamelCamel");
  }
  
  // Current Amazon price is in a <td class="largest"> ... $29.99 ...
  const priceRegex = /<td\s+class="largest[^"]*"[^>]*>\s*\$([0-9,\.]+)/i;
  const priceMatch = stdout.match(priceRegex);
  
  if (!priceMatch || !priceMatch[1]) {
    throw new Error("Price not found on CamelCamelCamel page");
  }
  
  // Convert price to cents
  const price = priceMatch[1].replace(/,/g, '');
  const priceCents = Math.round(parseFloat(price) * 100);
  
  // Add a delay to respect CamelCamelCamel rate limits
  await sleep(2000); // 2-second sleep to avoid rate limiting
  
  return priceCents;
}

// Mobile-first scraping approach (recommended for 2025)
async function scrapeMobilePDP(asin: string): Promise<AmazonProduct> {
  const url = `https://m.amazon.com/dp/${asin}?th=1&psc=1`;
  console.log(`Scraping mobile Amazon PDP: ${url}`);
  
  // Use curl with mobile headers to avoid detection, limit file size to prevent buffer overflow
  const curlCommand = `curl -s -L --max-filesize 500000 -A "${MOBILE_HEADERS["User-Agent"]}" -H "Accept-Language: ${MOBILE_HEADERS["Accept-Language"]}" -H "Referer: ${MOBILE_HEADERS["Referer"]}" "${url}"`;
  
  const { stdout } = await execAsync(curlCommand);
  
  if (!stdout || stdout.includes('Robot Check') || stdout.includes('captcha')) {
    throw new Error("Amazon is blocking our mobile request. Trying fallback method...");
  }
  
  // Extract title, often in og:title meta tag
  let title = "Unknown Product";
  const titleMatch = stdout.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  } else {
    // Try alternative title patterns
    const h1Match = stdout.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].trim();
    }
  }
  
  // Extract image URL from og:image meta tag
  let imageUrl = null;
  const imageMatch = stdout.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (imageMatch && imageMatch[1]) {
    imageUrl = imageMatch[1].trim();
  }
  
  // Extract price from span.a-offscreen (mobile site still has server-rendered prices)
  let priceCents = 0;
  const priceMatch = stdout.match(/<span[^>]*class="a-offscreen"[^>]*>([^<]+)<\/span>/i);
  if (priceMatch && priceMatch[1]) {
    try {
      priceCents = parsePriceToCents(priceMatch[1]);
    } catch (e) {
      console.error("Error parsing price:", e);
    }
  }
  
  if (!imageUrl || priceCents === 0) {
    throw new Error("Failed to extract required product details from mobile page");
  }
  
  return {
    title,
    asin,
    image_url: imageUrl,
    price_cents: priceCents
  };
}

// Main export function - using CamelCamelCamel as first choice for pricing
export async function scrapeAmazon(url: string): Promise<AmazonProduct> {
  try {
    // First, extract the ASIN from the URL
    const asin = extractAsin(url);
    
    // Try to get the price from CamelCamelCamel first (most reliable)
    let priceCents = 0;
    let camelSuccess = false;
    
    try {
      priceCents = await scrapeCamelPrice(asin);
      camelSuccess = true;
      console.log(`Successfully got price from CamelCamelCamel: $${(priceCents/100).toFixed(2)}`);
    } catch (camelError) {
      console.error("CamelCamelCamel scraping failed:", camelError);
      console.log("Continuing with Amazon scraping approaches...");
    }
    
    // Try the mobile-first approach for other product data
    try {
      const mobileResult = await scrapeMobilePDP(asin);
      
      // If we got the price from Camel, use that instead of the Amazon price
      if (camelSuccess) {
        return {
          ...mobileResult,
          price_cents: priceCents
        };
      }
      
      return mobileResult;
    } catch (mobileError) {
      console.error("Mobile scraping failed:", mobileError);
      console.log("Trying Playwright fallback...");
      
      // If mobile approach fails, try Playwright
      try {
        const playwrightResult = await scrapeWithPlaywright(url);
        
        // If we got the price from Camel, use that instead of the Amazon price
        if (camelSuccess) {
          return {
            ...playwrightResult,
            price_cents: priceCents
          };
        }
        
        return playwrightResult;
      } catch (playwrightError) {
        console.error("Playwright scraping failed:", playwrightError);
        console.log("Trying curl fallback...");
        
        // Last resort - try curl with desktop UA
        const curlResult = await scrapeWithCurl(url);
        
        // If we got the price from Camel, use that instead of the Amazon price
        if (camelSuccess) {
          return {
            ...curlResult,
            price_cents: priceCents
          };
        }
        
        return curlResult;
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`All scraping methods failed: ${errorMessage}`);
  }
}
