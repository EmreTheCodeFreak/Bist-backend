// Vercel Serverless Function - BIST Data API with Cache
// Cache'i Vercel KV yerine basit memory cache kullanıyoruz (ücretsiz)

const RAPIDAPI_KEY = 'a6b421a13cmshfff258d85702407p19ef6fjsn0e60e66f9b71';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

// In-memory cache (serverless ortamda her istek yeniden başlar ama aynı instance varsa cache kalır)
let cache = {
  data: null,
  timestamp: null
};

// BIST API'den fiyatları çek
async function fetchBistPrices() {
  const response = await fetch('https://bist100-stock-data-15-minutes-late-live.p.rapidapi.com/bist100/prices', {
    headers: {
      'x-rapidapi-host': 'bist100-stock-data-15-minutes-late-live.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY
    }
  });
  
  if (!response.ok) throw new Error('BIST API failed');
  const responseData = await response.json();
  return responseData.data || responseData;
}

// Yahoo API'den geçmiş veri çek
async function fetchYahooData(symbol) {
  const url = `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v3/get-chart?interval=1d&symbol=${symbol}.IS&range=1y&region=US`;
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY
    }
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  const chart = data.chart?.result?.[0];
  if (!chart) return null;
  const quote = chart.indicators?.quote?.[0];
  if (!quote) return null;
  
  return {
    close: quote.close,
    high: quote.high,
    low: quote.low,
    volume: quote.volume
  };
}

// Ana handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const now = Date.now();
    const today = new Date().toDateString();
    
    // Cache kontrolü (günlük)
    if (cache.data && cache.timestamp && new Date(cache.timestamp).toDateString() === today) {
      console.log('✅ Cache hit!');
      return res.status(200).json({
        success: true,
        cached: true,
        timestamp: cache.timestamp,
        data: cache.data
      });
    }
    
    console.log('🔍 Cache miss - fetching fresh data...');
    
    // 1. BIST fiyatlarını çek
    const bistPrices = await fetchBistPrices();
    console.log(`✅ BIST: ${Object.keys(bistPrices).length} stocks`);
    
    // 2. Popüler hisseler için Yahoo verisi çek (ilk 24 hisse)
    const popularStocks = ['GARAN', 'THYAO', 'KCHOL', 'AKBNK', 'EREGL', 'SAHOL', 'PETKM', 'TUPRS', 'SISE', 'TCELL', 'ASELS', 'BIMAS', 'ISCTR', 'KOZAL', 'VAKBN', 'SODA', 'FROTO', 'TOASO', 'HALKB', 'ENKAI', 'ARCLK', 'TAVHL', 'YKBNK', 'PGSUS'];
    
    const stocksData = {};
    
    for (const symbol of popularStocks) {
      try {
        const yahooData = await fetchYahooData(symbol);
        if (yahooData && bistPrices[symbol]) {
          stocksData[symbol] = {
            price: bistPrices[symbol].price,
            historical: yahooData
          };
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err.message);
      }
    }
    
    console.log(`✅ Processed ${Object.keys(stocksData).length} stocks`);
    
    // Cache'e kaydet
    cache.data = stocksData;
    cache.timestamp = now;
    
    return res.status(200).json({
      success: true,
      cached: false,
      timestamp: now,
      data: stocksData
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
