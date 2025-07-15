const puppeteer = require('puppeteer');

async function testImplementation() {
    console.log('🧪 Testing studio dashboard implementation...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to studio dashboard
        console.log('📍 Navigating to studio dashboard...');
        await page.goto('http://localhost:3000/studio-dashboard', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Test 1: Check if rating shows 0.0 instead of 4.8
        console.log('🔍 Testing rating display...');
        const ratingElement = await page.$eval('[data-testid="studio-rating"], .rating, [class*="rating"]', 
            el => el?.textContent || '');
        
        if (ratingElement.includes('0.0')) {
            console.log('✅ Rating correctly shows 0.0 (no reviews)');
        } else if (ratingElement.includes('4.8')) {
            console.log('❌ Rating still shows hardcoded 4.8');
        } else {
            console.log('⚠️ Rating element found but unclear format:', ratingElement);
        }
        
        // Test 2: Check if calendar toggle exists and works
        console.log('🔍 Testing calendar toggle...');
        const selectElement = await page.$('select[value="week"], select[value="month"]');
        
        if (selectElement) {
            console.log('✅ Calendar toggle select element found');
            
            // Try to change to month view
            await page.select('select', 'month');
            console.log('🔄 Switched to month view');
            
            // Wait a bit for any state changes
            await page.waitForTimeout(1000);
            
            // Check if month view is active
            const monthSelected = await page.$eval('select', el => el.value === 'month');
            if (monthSelected) {
                console.log('✅ Month view successfully selected');
            } else {
                console.log('❌ Month view selection failed');
            }
            
            // Switch back to week view
            await page.select('select', 'week');
            console.log('🔄 Switched back to week view');
            
            const weekSelected = await page.$eval('select', el => el.value === 'week');
            if (weekSelected) {
                console.log('✅ Week view successfully selected');
            } else {
                console.log('❌ Week view selection failed');
            }
            
        } else {
            console.log('❌ Calendar toggle select element not found');
        }
        
        // Test 3: Check if review count shows 0
        console.log('🔍 Testing review count display...');
        const reviewText = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            for (let el of elements) {
                if (el.textContent && el.textContent.includes('reviews')) {
                    return el.textContent;
                }
            }
            return null;
        });
        
        if (reviewText && reviewText.includes('0 reviews')) {
            console.log('✅ Review count correctly shows 0 reviews');
        } else if (reviewText) {
            console.log('⚠️ Review text found:', reviewText);
        } else {
            console.log('❌ Review count element not found');
        }
        
        console.log('🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testImplementation().catch(console.error); 