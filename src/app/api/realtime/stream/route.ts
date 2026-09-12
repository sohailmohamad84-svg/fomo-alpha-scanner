import { NextRequest } from 'next/server';
import { eventBus, RealtimeMessage } from '@/lib/realtime/event-bus';
import { fomoWsManager } from '@/lib/realtime/ws-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Ensure the WebSocket or simulation manager is started
  fomoWsManager.start();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  writer.write(
    encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: fomoWsManager.getStatus(), timestamp: Date.now() })}\n\n`)
  );

  const eventListener = (msg: RealtimeMessage) => {
    try {
      const dataStr = `event: ${msg.type}\ndata: ${JSON.stringify(msg.data)}\n\n`;
      writer.write(encoder.encode(dataStr));
    } catch (err) {
      // client disconnected
      eventBus.offRealtimeEvent(eventListener);
    }
  };

  eventBus.onRealtimeEvent(eventListener);

  // Keep-alive heartbeat ping every 15 seconds
  const pingInterval = setInterval(() => {
    try {
      writer.write(encoder.encode(`: ping\n\n`));
    } catch {
      clearInterval(pingInterval);
      eventBus.offRealtimeEvent(eventListener);
    }
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(pingInterval);
    eventBus.offRealtimeEvent(eventListener);
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
