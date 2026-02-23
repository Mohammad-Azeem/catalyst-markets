'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

interface UseWebSocketReturn {
  pricesMap: Map<string, PriceUpdate>;
  isConnected: boolean;
  getPrice: (symbol: string) => PriceUpdate | undefined;
}

// IMPORTANT: path must match server ('/ws')
const WS_URL = 'ws://localhost:3001/ws';

export function useWebSocket(): UseWebSocketReturn {
  const [pricesMap, setPricesMap] = useState<Map<string, PriceUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const pingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // added refs
  const reconnectAttemptsRef = useRef<number>(0);
  const pricesMapRef = useRef<Map<string, PriceUpdate>>(new Map());
  const MAX_RECONNECT_ATTEMPTS = 5; // max times to try reconnecting
  const RECONNECT_DELAY = 2000; // ms between reconnect attempts

  const connect = useCallback(() => {
  if (wsRef.current?.readyState === WebSocket.OPEN) return;

  try {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'INITIAL_DATA' || message.type === 'PRICE_UPDATE') {
          const newMap = new Map(pricesMapRef.current);
          message.data.forEach((update: PriceUpdate) => {
            newMap.set(update.symbol, update);
          });
          pricesMapRef.current = newMap;
          setPricesMap(newMap);
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('⚠️ WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = (error) => {
      // ✅ More descriptive error
      console.error('❌ WebSocket error:', error);
      console.log('Make sure backend is running on port 3001');
    };

    wsRef.current = ws;
  } catch (err) {
    console.error('WS connection failed:', err);
    console.log('Backend not running? Start with: cd backend && npm run dev'); // ✅ Helpful message
  }
}, []);
  const getPrice = useCallback((symbol: string): PriceUpdate | undefined => {
    return pricesMap.get(symbol);
  }, [pricesMap]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (pingRef.current) clearInterval(pingRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { pricesMap, isConnected, getPrice };
}


/*

//working code 

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

interface UseWebSocketReturn {
  pricesMap: Map<string, PriceUpdate>;
  isConnected: boolean;
}

// IMPORTANT: path must match server ('/ws')
const WS_URL = 'ws://localhost:3001/ws';

export function useWebSocket(): UseWebSocketReturn {
  const [pricesMap, setPricesMap] = useState<Map<string, PriceUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const pingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    // Don't reconnect if component unmounted
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('✅ WebSocket connected');
        setIsConnected(true);

        // Heartbeat ping every 25 seconds
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (
            (msg.type === 'INITIAL_DATA' || msg.type === 'PRICE_UPDATE') &&
            Array.isArray(msg.data)
          ) {
            setPricesMap((prev) => {
              const next = new Map(prev);
              (msg.data as PriceUpdate[]).forEach((u) => next.set(u.symbol, u));
              return next;
            });
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.log('⚠️ WebSocket disconnected - reconnecting in 5s...');
        setIsConnected(false);

        if (pingRef.current) {
          clearInterval(pingRef.current);
          pingRef.current = null;
        }

        // Auto-reconnect after 5 seconds
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        // onclose fires after onerror, so no extra handling needed
        console.error('❌ WebSocket error');
      };
    } catch (err) {
      console.error('WS connection failed:', err);
      // Retry in 5 seconds
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (pingRef.current) clearInterval(pingRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { pricesMap, isConnected };
}
*/

/*
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

interface WebSocketMessage {
  type: 'INITIAL_DATA' | 'PRICE_UPDATE' | 'PONG';
  data?: PriceUpdate[];
}

export function useWebSocket(url: string = 'ws://localhost:3001') {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Start sending ping every 25 seconds to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'INITIAL_DATA' || message.type === 'PRICE_UPDATE') {
            if (message.data) {
              setPrices((prev) => {
                const newPrices = new Map(prev);
                message.data!.forEach((update) => {
                  newPrices.set(update.symbol, update);
                });
                return newPrices;
              });
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket Error Event:', {
        type: event.type,
        target: (event.target as WebSocket).url,
        readyState: (event.target as WebSocket).readyState
      });
  setError('Connection failed. Check if backend is running on the correct port.');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 5000);
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to connect');
    }
  }, [url]);

  // Subscribe to specific symbols
  const subscribe = useCallback((symbols: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SUBSCRIBE',
        symbols,
      }));
    }
  }, []);

  // Get price for specific symbol
  const getPrice = useCallback((symbol: string): PriceUpdate | undefined => {
    return prices.get(symbol);
  }, [prices]);

  // Initialize connection
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    prices: Array.from(prices.values()),
    pricesMap: prices,
    isConnected,
    error,
    subscribe,
    getPrice,
  };
}

*/