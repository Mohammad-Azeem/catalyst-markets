import express from 'express';
const app = express();

app.get('/test', (req, res) => {
  res.json({ status: 'working' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
});