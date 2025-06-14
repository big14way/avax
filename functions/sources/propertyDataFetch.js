/**
 * DREMS Property Data Fetching Function
 * 
 * Fetches real-time property data from multiple sources:
 * 1. Zillow API - Property values and market trends
 * 2. Rentspree API - Rental market data
 * 3. Public records APIs - Property details and history
 * 
 * @param {string} args[0] - Property ID (MLS number or unique identifier)
 * @returns {string} - JSON encoded property data
 */

// Main execution function
async function main() {
  try {
    const propertyId = args[0];
    
    if (!propertyId) {
      throw new Error("Property ID is required");
    }

    console.log(`Fetching data for property: ${propertyId}`);

    // Fetch data from multiple sources in parallel
    const [zillowData, rentData, marketData] = await Promise.allSettled([
      fetchZillowData(propertyId),
      fetchRentalData(propertyId),
      fetchMarketData(propertyId)
    ]);

    // Process and combine the data
    const propertyData = processPropertyData(zillowData, rentData, marketData);
    
    console.log("Property data processed:", JSON.stringify(propertyData, null, 2));
    
    // Return the current property value (scaled to 18 decimals for Solidity)
    const valueInWei = Math.floor(propertyData.currentValue * 1e18);
    
    return Functions.encodeUint256(valueInWei);
    
  } catch (error) {
    console.error("Error in property data fetch:", error);
    throw error;
  }
}

/**
 * Fetch property data from Zillow API
 */
async function fetchZillowData(propertyId) {
  try {
    // Using RapidAPI Zillow endpoint
    const zillowRequest = Functions.makeHttpRequest({
      url: `https://zillow-com1.p.rapidapi.com/property`,
      method: "GET",
      headers: {
        "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
        "X-RapidAPI-Key": secrets.rapidApiKey
      },
      params: {
        zpid: propertyId
      }
    });

    const zillowResponse = await zillowRequest;
    
    if (zillowResponse.error) {
      console.log("Zillow API error:", zillowResponse.error);
      return null;
    }

    const data = zillowResponse.data;
    
    return {
      currentValue: data.price || data.zestimate || 0,
      priceHistory: data.priceHistory || [],
      propertyType: data.propertyType || "UNKNOWN",
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      sqft: data.livingArea || 0,
      yearBuilt: data.yearBuilt || 0,
      address: data.address || "",
      lastSoldPrice: data.lastSoldPrice || 0,
      lastSoldDate: data.lastSoldDate || ""
    };
    
  } catch (error) {
    console.log("Error fetching Zillow data:", error);
    return null;
  }
}

/**
 * Fetch rental market data
 */
async function fetchRentalData(propertyId) {
  try {
    // Using Rentspree API for rental market data
    const rentalRequest = Functions.makeHttpRequest({
      url: `https://api.rentspree.com/v1/properties/${propertyId}/rental-estimate`,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secrets.rentspreeApiKey}`,
        "Content-Type": "application/json"
      }
    });

    const rentalResponse = await rentalRequest;
    
    if (rentalResponse.error) {
      console.log("Rentspree API error:", rentalResponse.error);
      return null;
    }

    const data = rentalResponse.data;
    
    return {
      monthlyRent: data.monthlyRent || 0,
      rentalYield: data.annualYield || 0,
      occupancyRate: data.occupancyRate || 95, // Default 95%
      daysOnMarket: data.averageDaysOnMarket || 30,
      comparableRents: data.comparables || []
    };
    
  } catch (error) {
    console.log("Error fetching rental data:", error);
    return null;
  }
}

/**
 * Fetch general market data and trends
 */
async function fetchMarketData(propertyId) {
  try {
    // Using Realtor.com API for market trends
    const marketRequest = Functions.makeHttpRequest({
      url: `https://realtor.p.rapidapi.com/properties/v3/detail`,
      method: "GET",
      headers: {
        "X-RapidAPI-Host": "realtor.p.rapidapi.com",
        "X-RapidAPI-Key": secrets.rapidApiKey
      },
      params: {
        property_id: propertyId
      }
    });

    const marketResponse = await marketRequest;
    
    if (marketResponse.error) {
      console.log("Realtor API error:", marketResponse.error);
      return null;
    }

    const data = marketResponse.data;
    const property = data.property || {};
    
    return {
      marketValue: property.estimate?.estimate || 0,
      pricePerSqft: property.estimate?.estimate_per_sqft || 0,
      marketTrend: property.market_trend || "STABLE",
      daysOnMarket: property.list_date ? 
        Math.floor((Date.now() - new Date(property.list_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      localMarketStats: {
        medianPrice: property.neighborhood?.median_price || 0,
        priceGrowth: property.neighborhood?.price_growth || 0,
        inventoryLevel: property.neighborhood?.inventory_level || "NORMAL"
      }
    };
    
  } catch (error) {
    console.log("Error fetching market data:", error);
    return null;
  }
}

/**
 * Process and combine data from all sources
 */
function processPropertyData(zillowResult, rentalResult, marketResult) {
  const zillow = zillowResult.status === 'fulfilled' ? zillowResult.value : null;
  const rental = rentalResult.status === 'fulfilled' ? rentalResult.value : null;
  const market = marketResult.status === 'fulfilled' ? marketResult.value : null;

  // Calculate weighted average of property values
  const values = [];
  const weights = [];

  if (zillow?.currentValue > 0) {
    values.push(zillow.currentValue);
    weights.push(0.4); // 40% weight for Zillow
  }

  if (market?.marketValue > 0) {
    values.push(market.marketValue);
    weights.push(0.6); // 60% weight for Realtor.com
  }

  // Fallback to any available value if only one source
  let currentValue = 0;
  if (values.length > 0) {
    const weightedSum = values.reduce((sum, value, index) => sum + (value * weights[index]), 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    currentValue = weightedSum / totalWeight;
  }

  // Calculate rental yield if rental data is available
  let rentalYield = 0;
  if (rental?.monthlyRent > 0 && currentValue > 0) {
    const annualRent = rental.monthlyRent * 12;
    rentalYield = (annualRent / currentValue) * 100; // Percentage
  }

  return {
    currentValue: Math.round(currentValue),
    rentalYield: Math.round(rentalYield * 100) / 100, // 2 decimal places
    monthlyRent: rental?.monthlyRent || 0,
    occupancyRate: rental?.occupancyRate || 95,
    marketTrend: market?.marketTrend || "STABLE",
    lastUpdated: Math.floor(Date.now() / 1000),
    dataQuality: {
      hasZillowData: !!zillow,
      hasRentalData: !!rental,
      hasMarketData: !!market,
      confidence: calculateConfidenceScore(zillow, rental, market)
    }
  };
}

/**
 * Calculate confidence score based on available data sources
 */
function calculateConfidenceScore(zillow, rental, market) {
  let score = 0;
  
  if (zillow) score += 30;
  if (rental) score += 30;
  if (market) score += 40;
  
  return score;
}

// Execute the main function
return main(); 