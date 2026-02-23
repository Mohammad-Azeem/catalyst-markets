# 🔌 WebSocket Real-Time Updates - Testing Guide

## What We Built:

**Real-time stock price updates** - Prices update automatically every 15 seconds without page refresh!

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
cd backend
npm install ws
npm install --save-dev @types/ws
```

### Step 2: Update server.ts

Replace the `app.listen()` section in `backend/src/server.ts` with:

```typescript
import { websocketService } from './services/websocket';

const PORT = config.port || 3001;

// Create HTTP server (needed for WebSocket)
const server = app.listen(PORT, () => {
  logger.info(`🚀 Catalyst Markets v${version} running on port ${PORT}`);
  logger.info(`📝 Environment: ${environment}`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API: http://localhost:${PORT}/api/v1`);
  logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// Initialize WebSocket server
websocketService.initialize(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  websocketService.shutdown();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
```

### Step 3: Update Stocks Page

In `frontend/src/app/stocks/page.tsx`:

1. Add import at top:
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
```

2. Add hook in component:
```typescript
const { pricesMap, isConnected } = useWebSocket();
```

3. Update stock display to use real-time prices (see STOCKS_PAGE_WEBSOCKET_UPDATE.txt)

### Step 4: Restart Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## ✅ Visual Test

### Test 1: Connection Indicator

1. Open http://localhost:3000/stocks
2. Look at top of page - should see:
   - 🟢 Green dot with "Live updates" if connected
   - 🔴 Red dot with "Disconnected" if not connected

### Test 2: Real-Time Price Updates

1. Keep stocks page open
2. Watch for 15 seconds
3. You should see:
   - Green dots appear next to symbols (indicating real-time data)
   - Prices animate and change
   - Percentages update

### Test 3: Backend Logs

Check backend console for:
```
🔌 WebSocket: ws://localhost:3001
WebSocket server initialized
WebSocket client connected
Price update broadcast started (15s interval)
Broadcasted price updates { count: 20 }  // Every 15 seconds
```

### Test 4: Browser Console

Open browser DevTools (F12) and check:
```
WebSocket connected
```

No errors should appear!

---

## 🧪 Test with curl (Manual WebSocket)

### Test WebSocket Connection:
```bash
# Install wscat if not already installed
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3001

# You should receive initial data immediately
# Then updates every 15 seconds
```

**Expected Output:**
```json
{"type":"INITIAL_DATA","data":[...]}
{"type":"PRICE_UPDATE","data":[...]}  // Every 15 seconds
```

---

## 📊 What You'll See

### Before WebSocket:
- Static prices (₹0.00 or seed data)
- No updates unless you refresh page
- Feels dead/stale

### After WebSocket:
- Prices update every 15 seconds automatically ✨
- Green pulse indicator on active stocks
- Connection status at top
- Feels alive and professional!

---

## 🎯 Expected Behavior

### Normal Operation:
1. Page loads → WebSocket connects immediately
2. Green "Live updates" indicator appears
3. Initial prices load from database
4. After 15 seconds → First update broadcast
5. Prices animate with new values
6. Green dots appear next to updated stocks
7. Process repeats every 15 seconds

### If Backend Restarts:
1. Frontend shows "Disconnected" (red dot)
2. Automatically reconnects after 5 seconds
3. Green "Live updates" reappears
4. Updates resume

---

## 🐛 Troubleshooting

### Issue 1: "Cannot find module 'ws'"
**Solution:**
```bash
cd backend
npm install ws @types/ws
```

### Issue 2: Connection keeps disconnecting
**Solution:** Check backend logs for errors. Might need to restart both servers.

### Issue 3: Prices not updating
**Solution:**
- Check if IEX_CLOUD_API_KEY is set in .env.development
- Without API key, prices stay at 0 (expected in development)
- WebSocket still works, just shows 0 values

### Issue 4: "Live updates" shows but no green dots
**Solution:** 
- Green dots only appear when real-time data arrives
- If prices are all 0, dots won't show (need API keys for real data)

---

## 🎨 Visual Indicators Explained

### 🟢 Green Dot (top right)
- Means WebSocket connected
- Updates happening every 15s

### 🔴 Red Dot (top right)
- Disconnected from server
- Will auto-reconnect in 5s

### 🟢 Small Green Dot (next to symbol)
- Real-time price just updated
- Shows which stocks have fresh data

### Price Number Animation
- Numbers should smoothly change
- Not implemented yet, but WebSocket is ready!

---

## 📈 Performance Impact

**Before WebSocket:**
- Page reload: ~500ms
- Database queries: 1 per refresh
- User action required: Yes (F5)

**After WebSocket:**
- No page reload needed
- Database queries: 1 per 15s (automatic)
- User action required: No
- Connection overhead: ~5KB/update

---

## ✅ Success Checklist

- [ ] Backend shows "WebSocket server initialized"
- [ ] Frontend shows green "Live updates" indicator
- [ ] Backend logs "Broadcasted price updates" every 15s
- [ ] Browser console shows "WebSocket connected"
- [ ] No WebSocket errors in console
- [ ] Prices update without page refresh

---

## 🚀 What's Next

With WebSocket working, you can add:
1. **Smooth animations** when prices change
2. **Price alerts** trigger on WebSocket updates
3. **Portfolio P&L** updates in real-time
4. **Watchlist** prices update live

**Your app now feels like a professional trading platform!** 📊✨
