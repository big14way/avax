/**
 * DREMS Rent Collection Manager
 * 
 * Automated rent collection and processing system that:
 * 1. Connects to property management platforms
 * 2. Processes rent payments from tenants
 * 3. Handles payment failures and retries
 * 4. Calculates net rental income after expenses
 * 
 * @param {string} args[0] - Property ID
 * @param {string} args[1] - Expected monthly rent amount
 * @returns {string} - Net rent collected amount in wei
 */

// Main execution function
async function main() {
  try {
    const propertyId = args[0];
    const expectedRent = parseFloat(args[1]) || 0;
    
    if (!propertyId) {
      throw new Error("Property ID is required");
    }

    console.log(`Processing rent collection for property: ${propertyId}`);
    console.log(`Expected rent amount: $${expectedRent}`);

    // Run rent collection processes in parallel
    const [paymentData, expenseData, tenantData] = await Promise.allSettled([
      collectRentPayments(propertyId, expectedRent),
      calculatePropertyExpenses(propertyId),
      getTenantStatus(propertyId)
    ]);

    // Process the collected data
    const rentResult = processRentCollection(paymentData, expenseData, tenantData);
    
    console.log("Rent collection processed:", JSON.stringify(rentResult, null, 2));
    
    // Return net rent collected (scaled to 18 decimals for Solidity)
    const netRentInWei = Math.floor(rentResult.netRentCollected * 1e18);
    
    return Functions.encodeUint256(netRentInWei);
    
  } catch (error) {
    console.error("Error in rent collection:", error);
    throw error;
  }
}

/**
 * Collect rent payments from various sources
 */
async function collectRentPayments(propertyId, expectedRent) {
  try {
    // Connect to property management platform (e.g., AppFolio, Buildium)
    const paymentsRequest = Functions.makeHttpRequest({
      url: `https://api.appfolio.com/v1/properties/${propertyId}/payments`,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secrets.appfolioApiKey}`,
        "Content-Type": "application/json"
      },
      params: {
        start_date: getFirstDayOfMonth(),
        end_date: getCurrentDate(),
        payment_type: "rent"
      }
    });

    const paymentsResponse = await paymentsRequest;
    
    if (paymentsResponse.error) {
      console.log("Property management API error:", paymentsResponse.error);
      // Fallback to direct payment processing
      return await processDirectPayments(propertyId, expectedRent);
    }

    const payments = paymentsResponse.data.payments || [];
    
    // Calculate total rent collected this month
    let totalCollected = 0;
    let paymentDetails = [];
    
    payments.forEach(payment => {
      if (payment.status === 'completed' || payment.status === 'cleared') {
        totalCollected += parseFloat(payment.amount);
        paymentDetails.push({
          amount: payment.amount,
          date: payment.payment_date,
          method: payment.payment_method,
          tenant: payment.tenant_id,
          status: payment.status
        });
      }
    });

    return {
      totalCollected,
      expectedAmount: expectedRent,
      collectionRate: (totalCollected / expectedRent) * 100,
      paymentDetails,
      source: "property_management_platform"
    };
    
  } catch (error) {
    console.log("Error collecting rent payments:", error);
    return await processDirectPayments(propertyId, expectedRent);
  }
}

/**
 * Fallback: Process direct payments via payment processors
 */
async function processDirectPayments(propertyId, expectedRent) {
  try {
    // Connect to Stripe for direct payments
    const stripeRequest = Functions.makeHttpRequest({
      url: `https://api.stripe.com/v1/charges`,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secrets.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      params: {
        created: {
          gte: Math.floor(new Date(getFirstDayOfMonth()).getTime() / 1000)
        },
        metadata: {
          property_id: propertyId,
          payment_type: "rent"
        },
        limit: 100
      }
    });

    const stripeResponse = await stripeRequest;
    
    if (stripeResponse.error) {
      console.log("Stripe API error:", stripeResponse.error);
      return {
        totalCollected: 0,
        expectedAmount: expectedRent,
        collectionRate: 0,
        paymentDetails: [],
        source: "direct_payments_failed"
      };
    }

    const charges = stripeResponse.data.data || [];
    
    let totalCollected = 0;
    let paymentDetails = [];
    
    charges.forEach(charge => {
      if (charge.status === 'succeeded') {
        const amount = charge.amount / 100; // Convert from cents
        totalCollected += amount;
        paymentDetails.push({
          amount: amount,
          date: new Date(charge.created * 1000).toISOString(),
          method: "credit_card",
          status: "completed",
          chargeId: charge.id
        });
      }
    });

    return {
      totalCollected,
      expectedAmount: expectedRent,
      collectionRate: (totalCollected / expectedRent) * 100,
      paymentDetails,
      source: "stripe_direct"
    };
    
  } catch (error) {
    console.log("Error processing direct payments:", error);
    return {
      totalCollected: 0,
      expectedAmount: expectedRent,
      collectionRate: 0,
      paymentDetails: [],
      source: "payment_processing_failed"
    };
  }
}

/**
 * Calculate property expenses for the month
 */
async function calculatePropertyExpenses(propertyId) {
  try {
    // Fetch expenses from property management platform
    const expensesRequest = Functions.makeHttpRequest({
      url: `https://api.appfolio.com/v1/properties/${propertyId}/expenses`,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secrets.appfolioApiKey}`,
        "Content-Type": "application/json"
      },
      params: {
        start_date: getFirstDayOfMonth(),
        end_date: getCurrentDate()
      }
    });

    const expensesResponse = await expensesRequest;
    
    if (expensesResponse.error) {
      console.log("Expenses API error:", expensesResponse.error);
      return getDefaultExpenses();
    }

    const expenses = expensesResponse.data.expenses || [];
    
    let totalExpenses = 0;
    let expenseBreakdown = {
      maintenance: 0,
      utilities: 0,
      insurance: 0,
      propertyManagement: 0,
      other: 0
    };
    
    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      totalExpenses += amount;
      
      // Categorize expenses
      const category = categorizeExpense(expense.description, expense.category);
      expenseBreakdown[category] += amount;
    });

    return {
      totalExpenses,
      expenseBreakdown,
      source: "property_management_platform"
    };
    
  } catch (error) {
    console.log("Error calculating expenses:", error);
    return getDefaultExpenses();
  }
}

/**
 * Get tenant status and occupancy information
 */
async function getTenantStatus(propertyId) {
  try {
    const tenantRequest = Functions.makeHttpRequest({
      url: `https://api.appfolio.com/v1/properties/${propertyId}/tenants`,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secrets.appfolioApiKey}`,
        "Content-Type": "application/json"
      }
    });

    const tenantResponse = await tenantRequest;
    
    if (tenantResponse.error) {
      console.log("Tenant API error:", tenantResponse.error);
      return getDefaultTenantStatus();
    }

    const tenants = tenantResponse.data.tenants || [];
    
    let occupiedUnits = 0;
    let totalUnits = tenants.length || 1;
    let tenantDetails = [];
    
    tenants.forEach(tenant => {
      if (tenant.status === 'active' && tenant.lease_end_date > getCurrentDate()) {
        occupiedUnits++;
      }
      
      tenantDetails.push({
        id: tenant.id,
        status: tenant.status,
        leaseStart: tenant.lease_start_date,
        leaseEnd: tenant.lease_end_date,
        rentAmount: tenant.rent_amount
      });
    });

    const occupancyRate = (occupiedUnits / totalUnits) * 100;

    return {
      occupancyRate,
      occupiedUnits,
      totalUnits,
      tenantDetails,
      source: "property_management_platform"
    };
    
  } catch (error) {
    console.log("Error getting tenant status:", error);
    return getDefaultTenantStatus();
  }
}

/**
 * Process and combine all rent collection data
 */
function processRentCollection(paymentResult, expenseResult, tenantResult) {
  const payment = paymentResult.status === 'fulfilled' ? paymentResult.value : { totalCollected: 0, expectedAmount: 0 };
  const expense = expenseResult.status === 'fulfilled' ? expenseResult.value : { totalExpenses: 0 };
  const tenant = tenantResult.status === 'fulfilled' ? tenantResult.value : { occupancyRate: 100 };

  // Calculate net rent after expenses
  const grossRent = payment.totalCollected || 0;
  const totalExpenses = expense.totalExpenses || 0;
  const netRentCollected = Math.max(0, grossRent - totalExpenses);

  // Calculate performance metrics
  const collectionEfficiency = payment.expectedAmount > 0 ? 
    (grossRent / payment.expectedAmount) * 100 : 0;

  return {
    grossRentCollected: grossRent,
    totalExpenses: totalExpenses,
    netRentCollected: netRentCollected,
    expectedRent: payment.expectedAmount || 0,
    collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
    occupancyRate: tenant.occupancyRate || 100,
    paymentDetails: payment.paymentDetails || [],
    expenseBreakdown: expense.expenseBreakdown || {},
    lastUpdated: Math.floor(Date.now() / 1000),
    dataQuality: {
      hasPaymentData: payment.source !== 'payment_processing_failed',
      hasExpenseData: expense.source !== 'default',
      hasTenantData: tenant.source !== 'default'
    }
  };
}

/**
 * Helper functions
 */
function getFirstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

function categorizeExpense(description, category) {
  const desc = description.toLowerCase();
  
  if (desc.includes('maintenance') || desc.includes('repair')) return 'maintenance';
  if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) return 'utilities';
  if (desc.includes('insurance')) return 'insurance';
  if (desc.includes('management') || desc.includes('fee')) return 'propertyManagement';
  
  return 'other';
}

function getDefaultExpenses() {
  return {
    totalExpenses: 0,
    expenseBreakdown: {
      maintenance: 0,
      utilities: 0,
      insurance: 0,
      propertyManagement: 0,
      other: 0
    },
    source: "default"
  };
}

function getDefaultTenantStatus() {
  return {
    occupancyRate: 100,
    occupiedUnits: 1,
    totalUnits: 1,
    tenantDetails: [],
    source: "default"
  };
}

// Execute the main function
return main(); 