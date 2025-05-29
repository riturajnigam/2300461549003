const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;

const API_URLS = {
  p: 'http://20.244.56.144/evaluation-service/primes',
  f: 'http://20.244.56.144/evaluation-service/fibo',
  e: 'http://20.244.56.144/evaluation-service/even',
  r: 'http://20.244.56.144/evaluation-service/rand',
};

const windows = { p: [], f: [], e: [], r: [] };

app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
  if (!API_URLS[numberid]) {
    return res.status(400).json({ error: 'Invalid numberid' });
  }

  const prevWindow = [...windows[numberid]];

  let numbers = [];
  try {
    const response = await Promise.race([
      axios.get(API_URLS[numberid]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500)),
    ]);
    numbers = response.data.numbers || [];
  } catch (err) {
    // Ignore errors/timeouts, respond with previous state
    return res.json({
      windowPrevState: prevWindow,
      windowCurrState: prevWindow,
      numbers: [],
      avg: prevWindow.length ? (prevWindow.reduce((a, b) => a + b, 0) / prevWindow.length).toFixed(2) : 0,
    });
  }

  // Add unique numbers, FIFO, up to WINDOW_SIZE
  const set = new Set(windows[numberid]);
  for (const num of numbers) {
    if (!set.has(num)) {
      windows[numberid].push(num);
      set.add(num);
      if (windows[numberid].length > WINDOW_SIZE) {
        windows[numberid].shift();
      }
    }
  }

  const currWindow = [...windows[numberid]];
  const avg = currWindow.length ? (currWindow.reduce((a, b) => a + b, 0) / currWindow.length).toFixed(2) : 0;

  res.json({
    windowPrevState: prevWindow,
    windowCurrState: currWindow,
    numbers,
    avg: Number(avg),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 