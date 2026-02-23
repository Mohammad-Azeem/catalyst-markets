import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import prisma from '../db/prisma';
import logger from '../utils/logger';

// ============================================
// WEBSOCKET SERVICE
// Uses simulated price movement for development
// Plug in Yahoo Finance service for real prices
// ============================================

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

// Simulate ±1% price movement from current price
function simulatePriceChange(current: number): {
  price: number;
  change: number;
  changePercent: number;
} {
  const base = current > 0 ? current : Math.random() * 2000 + 500;
  const changePercent = parseFloat(((Math.random() - 0.5) * 2.0).toFixed(2));
  const change = parseFloat(((base * changePercent) / 100).toFixed(2));
  const price = parseFloat((base + change).toFixed(2));
  return { price, change, changePercent };
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private connectedClients = new Set<WebSocket>();
  // Store simulated prices in memory so they drift realistically
  private simulatedPrices = new Map<string, number>();

  initialize(server: Server): void {
    // Use path '/ws' to avoid conflict with Express HTTP routes
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info(`WS client connected. Total: ${this.connectedClients.size + 1}`);
      this.connectedClients.add(ws);

      // Send current prices immediately on connect
      this.sendInitialData(ws);

      // Handle ping/pong heartbeat from frontend
      ws.on('message', (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG' }));
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        logger.info(`WS client disconnected. Remaining: ${this.connectedClients.size}`);
      });

      ws.on('error', (err) => {
        logger.error('WS client error:', err.message);
        this.connectedClients.delete(ws);
      });
    });

    this.startPriceUpdates();
    logger.info('✅ WebSocket server ready on ws://localhost:3001/ws');
  }

  private async sendInitialData(ws: WebSocket): Promise<void> {
    try {
      const stocks = await prisma.stock.findMany({
        take: 25,
        orderBy: { symbol: 'asc' },
        select: {
          symbol: true,
          currentPrice: true,
          dayChange: true,
          dayChangePercent: true,
        },
      });

      const data = stocks.map((s: any) => {
        // Convert Prisma Decimal to number
        const dbPrice = Number(s.currentPrice);

        // Seed in-memory price map if not already set
        if (!this.simulatedPrices.has(s.symbol)) {
          this.simulatedPrices.set(
            s.symbol,
            dbPrice > 0 ? dbPrice : Math.random() * 2000 + 500
          );
        }

        const price = this.simulatedPrices.get(s.symbol)!;

        return {
          symbol: s.symbol,
          price: parseFloat(price.toFixed(2)),
          change: Number(s.dayChange ?? 0),
          changePercent: Number(s.dayChangePercent ?? 0),
          timestamp: new Date().toISOString(),
        };
      });

      this.send(ws, { type: 'INITIAL_DATA', data });
    } catch (err) {
      logger.error('Error sending initial WS data:', err);
    }
  }

  private startPriceUpdates(): void {
    // Update every 5 minutes with real prices from Yahoo Finance
    this.updateInterval = setInterval(() => {
      this.broadcastPriceUpdates();
    }, 5 * 60 * 1000);

    logger.info('📡 Price update started (5min interval, Yahoo Finance)');
  }

  private async broadcastPriceUpdates(): Promise<void> {
  const openClients = [...this.connectedClients].filter(
    (c) => c.readyState === WebSocket.OPEN
  );
  if (openClients.length === 0) return;

  try {
    const stocks = await prisma.stock.findMany({
      take: 25,
      select: { id: true, symbol: true, exchange: true, currentPrice: true },
    });

    const updates: PriceUpdate[] = [];

    // Use Yahoo Finance for real prices
    const { yahooFinanceService } = await import('./yahooFinance');

    for (const stock of stocks) {
      const quote = await yahooFinanceService.getQuote(stock.symbol, stock.exchange);

      if (quote && quote.price > 0) {
        // Update database
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            currentPrice: quote.price,
            dayChange: quote.change,
            dayChangePercent: quote.changePercent,
            volume: BigInt(quote.volume),
            lastUpdated: new Date(),
          },
        });

        updates.push({
          symbol: stock.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          timestamp: new Date().toISOString(),
        });
      }

      // Rate limit: 200ms between requests
      await new Promise((r) => setTimeout(r, 200));
    }

    if (updates.length > 0) {
      const payload = JSON.stringify({ type: 'PRICE_UPDATE', data: updates });
      openClients.forEach((c) => c.send(payload));
      logger.info(`Sent ${updates.length} real price updates to ${openClients.length} clients`);
    }
  } catch (error) {
    logger.error('Error broadcasting prices:', error);
  }
}

  private send(ws: WebSocket, msg: object): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.connectedClients.forEach((c) => c.close());
    this.connectedClients.clear();
    this.wss?.close();
    logger.info('WebSocket service shut down');
  }

  getClientCount(): number {
    return this.connectedClients.size;
  }
}

export const websocketService = new WebSocketService();
/*
// working code

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import prisma from '../db/prisma';
import logger from '../utils/logger';
import { mockPriceService } from './mockPrice';

// ============================================
// WEBSOCKET SERVICE - REAL-TIME PRICE UPDATES
// Using MOCK PRICES for development
// ============================================

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private connectedClients = new Set<WebSocket>();

  
  // Initialize WebSocket server
  
  async initialize(server: Server): Promise<void> {
    this.wss = new WebSocketServer({ server });

    // Initialize mock price service
    await mockPriceService.initialize();

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');
      this.connectedClients.add(ws);

      // Send initial data on connection
      this.sendInitialData(ws);

      // Handle client messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          logger.error('Error parsing WebSocket message', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.connectedClients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', error);
        this.connectedClients.delete(ws);
      });
    });

    // Start broadcasting price updates
    this.startPriceUpdates();

    logger.info('WebSocket server initialized with MOCK prices');
  }

  //
  // Send initial stock data to newly connected client
  
  private async sendInitialData(ws: WebSocket): Promise<void> {
    try {
      const stocks = await prisma.stock.findMany({
        take: 25,
        orderBy: { symbol: 'asc' },
      });

      const initialData = stocks.map(stock => ({
        symbol: stock.symbol,
        price: stock.currentPrice,
        change: stock.dayChange,
        changePercent: stock.dayChangePercent,
        timestamp: new Date().toISOString(),
      }));

      this.sendToClient(ws, {
        type: 'INITIAL_DATA',
        data: initialData,
      });

      logger.info('Sent initial data to client', { count: initialData.length });
    } catch (error) {
      logger.error('Error sending initial data', error);
    }
  }

  
  // Handle messages from clients
   
  private handleClientMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'SUBSCRIBE':
        this.handleSubscribe(ws, data.symbols);
        break;
      
      case 'PING':
        this.sendToClient(ws, { type: 'PONG' });
        break;
      
      default:
        logger.warn('Unknown message type', data.type);
    }
  }

  
  // Handle client subscription to specific stocks
  
  private handleSubscribe(ws: WebSocket, symbols: string[]): void {
    (ws as any).subscribedSymbols = symbols;
    logger.info('Client subscribed to symbols', { symbols });
  }

  
  // Start broadcasting price updates every 15 seconds
   
  private startPriceUpdates(): void {
    // Update every 15 seconds
    this.updateInterval = setInterval(() => {
      this.broadcastPriceUpdates();
    }, 15000);

    logger.info('Price update broadcast started (15s interval, MOCK mode)');
  }

  
  // Fetch latest prices and broadcast to all connected clients
  // USING MOCK PRICES - No external API calls
  
  private async broadcastPriceUpdates(): Promise<void> {
    if (this.connectedClients.size === 0) {
      return; // No clients connected, skip update
    }

    try {
      // Update all prices using mock service
      const updateCount = await mockPriceService.updateAllPrices();

      // Fetch updated stocks from database
      const stocks = await prisma.stock.findMany({
        take: 25,
        orderBy: { symbol: 'asc' },
      });

      const updates: PriceUpdate[] = stocks.map(stock => ({
        symbol: stock.symbol,
        price: Number(stock.currentPrice),
        change: Number(stock.dayChange),
        changePercent: Number(stock.dayChangePercent),
        timestamp: new Date().toISOString(),
      }));

      // Broadcast updates to all connected clients
      if (updates.length > 0) {
        this.broadcast({
          type: 'PRICE_UPDATE',
          data: updates,
        });

        logger.info('Broadcasted MOCK price updates', { 
          count: updates.length,
          clients: this.connectedClients.size 
        });
      }
    } catch (error) {
      logger.error('Error broadcasting price updates', error);
    }
  }

  
  // Send message to specific client
  
  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  
  //  Broadcast message to all connected clients
   
  private broadcast(message: any): void {
    const payload = JSON.stringify(message);
    
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const subscribedSymbols = (client as any).subscribedSymbols;
        
        if (!subscribedSymbols || message.type === 'INITIAL_DATA') {
          client.send(payload);
        } else if (message.type === 'PRICE_UPDATE') {
          const filteredData = message.data.filter((update: PriceUpdate) =>
            subscribedSymbols.includes(update.symbol)
          );
          
          if (filteredData.length > 0) {
            client.send(JSON.stringify({
              type: 'PRICE_UPDATE',
              data: filteredData,
            }));
          }
        }
      }
    });
  }

  
  // Stop price updates and close all connections
  
  shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.connectedClients.forEach((client) => {
      client.close();
    });

    this.connectedClients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    logger.info('WebSocket service shut down');
  }

  
  // Get number of connected clients
   
  getClientCount(): number {
    return this.connectedClients.size;
  }
}


export const websocketService = new WebSocketService();

*/


/*
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { stockPriceService } from './stockPrice';
import prisma from '../db/prisma';
import logger from '../utils/logger';

// ============================================
// WEBSOCKET SERVICE - REAL-TIME PRICE UPDATES
// ============================================

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private connectedClients = new Set<WebSocket>();

  
  // Initialize WebSocket server
   
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');
      this.connectedClients.add(ws);

      // Send initial data on connection
      this.sendInitialData(ws);

      // Handle client messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          logger.error('Error parsing WebSocket message', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.connectedClients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', error);
        this.connectedClients.delete(ws);
      });
    });

    // Start broadcasting price updates
    this.startPriceUpdates();

    logger.info('WebSocket server initialized');
  }

  
   // Send initial stock data to newly connected client
   
  private async sendInitialData(ws: WebSocket): Promise<void> {
    try {
      const stocks = await prisma.stock.findMany({
        take: 20,
        orderBy: { symbol: 'asc' },
      });

      const initialData = stocks.map(stock => ({
        symbol: stock.symbol,
        price: stock.currentPrice,
        change: stock.dayChange,
        changePercent: stock.dayChangePercent,
        timestamp: new Date().toISOString(),
      }));

      this.sendToClient(ws, {
        type: 'INITIAL_DATA',
        data: initialData,
      });
    } catch (error) {
      logger.error('Error sending initial data', error);
    }
  }

  
   // Handle messages from clients
   
  private handleClientMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'SUBSCRIBE':
        // Client wants to subscribe to specific symbols
        this.handleSubscribe(ws, data.symbols);
        break;
      
      case 'PING':
        // Client sending heartbeat
        this.sendToClient(ws, { type: 'PONG' });
        break;
      
      default:
        logger.warn('Unknown message type', data.type);
    }
  }

  
   // Handle client subscription to specific stocks
   
  private handleSubscribe(ws: WebSocket, symbols: string[]): void {
    // Store subscribed symbols on the WebSocket object
    (ws as any).subscribedSymbols = symbols;
    logger.info('Client subscribed to symbols', { symbols });
  }

  
   // Start broadcasting price updates every 15 seconds
   
  private startPriceUpdates(): void {
    // Update every 15 seconds
    this.updateInterval = setInterval(() => {
      this.broadcastPriceUpdates();
    }, 15000);

    logger.info('Price update broadcast started (15s interval)');
  }

  
   // Fetch latest prices and broadcast to all connected clients
   
  private async broadcastPriceUpdates(): Promise<void> {
    if (this.connectedClients.size === 0) {
      return; // No clients connected, skip update
    }

    try {
      // Get list of stocks to update
      const stocks = await prisma.stock.findMany({
        take: 20, // Update top 20 most active stocks
        orderBy: { volume: 'desc' },
      });

      const updates: PriceUpdate[] = [];

      // Fetch updated prices (with rate limiting)
      for (const stock of stocks) {
        try {
          const quote = await stockPriceService.getQuote(
            stock.symbol,
            stock.exchange
          );

          if (quote) {
            // Update database
            await prisma.stock.update({
              where: { id: stock.id },
              data: {
                currentPrice: quote.price,
                dayChange: quote.change,
                dayChangePercent: quote.changePercent,
                volume: quote.volume,
                lastUpdated: new Date(),
              },
            });

            updates.push({
              symbol: stock.symbol,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          logger.error(`Error updating price for ${stock.symbol}`, error);
        }
      }

      // Broadcast updates to all connected clients
      if (updates.length > 0) {
        this.broadcast({
          type: 'PRICE_UPDATE',
          data: updates,
        });

        logger.info('Broadcasted price updates', { count: updates.length });
      }
    } catch (error) {
      logger.error('Error broadcasting price updates', error);
    }
  }

  
   // Send message to specific client
   
  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  //
   // Broadcast message to all connected clients
   
  private broadcast(message: any): void {
    const payload = JSON.stringify(message);
    
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Check if client has subscribed to specific symbols
        const subscribedSymbols = (client as any).subscribedSymbols;
        
        if (!subscribedSymbols || message.type === 'INITIAL_DATA') {
          // Send to all if no subscription or initial data
          client.send(payload);
        } else if (message.type === 'PRICE_UPDATE') {
          // Filter updates for subscribed symbols
          const filteredData = message.data.filter((update: PriceUpdate) =>
            subscribedSymbols.includes(update.symbol)
          );
          
          if (filteredData.length > 0) {
            client.send(JSON.stringify({
              type: 'PRICE_UPDATE',
              data: filteredData,
            }));
          }
        }
      }
    });
  }

  
   // Stop price updates and close all connections
   
  shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.connectedClients.forEach((client) => {
      client.close();
    });

    this.connectedClients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    logger.info('WebSocket service shut down');
  }

  
   // Get number of connected clients
   
  getClientCount(): number {
    return this.connectedClients.size;
  }
}

export const websocketService = new WebSocketService();

*/