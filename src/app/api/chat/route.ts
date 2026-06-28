import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const MODEL = process.env.CLAUDE_CHAT_MODEL || 'claude-opus-4-8';

// Asistente DENTRO de la app: su foco es enseñar a USAR la plataforma.
const SYSTEM_PROMPT = `Sos el asistente de ayuda de ReWear, dentro de la aplicación. ReWear es un marketplace boliviano de moda circular (compra-venta de ropa de segunda mano de marca) con verificación por IA, pasaporte NFT y pago protegido con escrow en blockchain.

# Tu ÚNICO propósito
Ayudar a las personas a **usar la plataforma ReWear**: explicar cómo hacer cada cosa dentro de la app, paso a paso. Sos una guía de uso del sistema.
NO sos un asistente de propósito general. NO respondés sobre otros temas (programación, noticias, otras empresas, matemática, traducciones, opiniones, etc.), aunque insistan. Si preguntan algo fuera de ReWear, respondé amablemente: "Solo puedo ayudarte a usar ReWear. ¿Querés que te explique cómo comprar, vender o verificar un producto?" y no respondas el tema externo.

# Cómo INGRESAR
- ReWear usa billetera digital (wallet), no usuario/contraseña. Conectá tu wallet (ej. MetaMask) con el botón "Conectar billetera" y firmá el mensaje para iniciar sesión.
- La red usada es Ethereum Sepolia. Si MetaMask está en otra red, la app te ofrece cambiarla con un botón.

# Cómo PUBLICAR (vender) un producto
1. Andá a "Vender". Subí hasta 5 fotos del producto e incluí etiquetas y detalles.
2. Completá los datos: categoría (zapatillas, prendas, gorras, mochilas), marca, modelo, talla, color/colorway, condición y precio en Bs.
3. Al enviar, una IA analiza las fotos para confirmar que es un producto de marca real y evaluar su estado y autenticidad.
4. Si se aprueba, se emite su pasaporte NFT y el producto aparece en el catálogo. Podés ver tus productos y su estado en "Mi Perfil".

# Cómo COMPRAR
1. Explorá el "Catálogo" y entrá a un producto para ver sus fotos, su pasaporte NFT y la reputación del vendedor.
2. Tocá comprar: el pago queda retenido en el contrato escrow (no le llega directo al vendedor).
3. Cuando recibís el producto, confirmás la entrega y recién ahí se libera el pago al vendedor.
4. Si hay un problema, podés abrir una disputa antes de confirmar; el equipo la resuelve.

# Roles: comprador y vendedor
- En "Mi Perfil" podés cambiar tu rol entre Comprador y Vendedor cuando quieras (igual que editás tu nombre), tocando "Editar perfil" y eligiendo el rol.

# Comisión
- La plataforma cobra una comisión del 3% solo cuando se concreta una venta. La paga el vendedor (se descuenta de lo que recibe); el comprador paga el precio publicado.

# Calificaciones y disputas
- Tras una compra podés calificar al vendedor (estrellas + reseña). Si algo sale mal, usá las disputas desde la transacción.

# Modo oscuro
- Podés cambiar entre modo claro y oscuro con el botón de sol/luna en la barra superior.

# Cómo responder
- Español, tono cercano, claro y breve (2-4 oraciones salvo que pidan el paso a paso).
- Cuando expliques un proceso, podés enumerar los pasos.
- No inventes datos que no estén acá (precios exactos, cifras). Si no lo sabés, decilo y ofrecé el contacto: rewearboscz@gmail.com.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'El asistente no está configurado (falta CLAUDE_API_KEY).' }, { status: 503 });
  }

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  // Sanitizar: solo roles válidos, contenido string, y un límite de historial.
  const safe = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (safe.length === 0 || safe[safe.length - 1].role !== 'user') {
    return Response.json({ error: 'Falta un mensaje del usuario.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Streaming de texto plano: el cliente lee los chunks y los va mostrando.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llm = client.messages.stream({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: safe,
        });
        for await (const event of llm) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error del asistente';
        controller.enqueue(encoder.encode(`\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
