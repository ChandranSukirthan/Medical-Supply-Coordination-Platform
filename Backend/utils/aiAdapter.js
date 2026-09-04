const axios = require('axios');

exports.recommendSuppliers = async (requestData, availableStocks) => {
  // Try to reach Python Service
  try {
    const response = await axios.post(process.env.PYTHON_AI_URL || 'http://localhost:8000/api/v1/recommend/suppliers', {
      request: requestData,
      stocks: availableStocks
    }, { timeout: 3000 });
    return response.data.recommendations;
  } catch (error) {
    // Fallback logic if AI is unavailable or timeout
    console.log("AI Service unavailable. Using fallback matching.");
    const filtered = availableStocks.filter(s => s.medicine === requestData.medicine && s.quantity >= requestData.quantity);
    return filtered.map(s => ({ stockId: s.stockId, hospitalId: s.hospitalId, score: 0.8, reason: 'Fallback match' }));
  }
};
