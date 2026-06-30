import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const MODEL = process.env.CLAUDE_VISION_MODEL || 'claude-opus-4-8';
const MAX_IMAGES = 4; // acota costo/tokens de visión

type ImgIn = { media_type: string; data: string };

const VALID_MEDIA = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Herramienta cuyo input es el formulario: forzando su uso obtenemos campos
// estructurados sin depender de parsear texto libre.
const TOOL = {
  name: 'completar_producto',
  description: 'Devuelve los datos del producto de moda de segunda mano extraídos de las fotos.',
  input_schema: {
    type: 'object' as const,
    properties: {
      titulo: { type: 'string', description: 'Título corto y claro, ej: "Nike Air Jordan 1 Retro High Bred". Marca + modelo + colorway si se ven.' },
      descripcion: { type: 'string', description: 'Descripción breve (1-3 oraciones) del producto y su estado visible.' },
      marca: { type: 'string', description: 'Marca, ej: Nike, Adidas, Jordan, The North Face.' },
      modelo: { type: 'string', description: 'Modelo, ej: Air Jordan 1, Dunk Low.' },
      colorway: { type: 'string', description: 'Combinación de colores o nombre del colorway, ej: Bred, Panda, Sail/Black.' },
      talla: { type: 'string', description: 'Talla SOLO si es visible en una etiqueta. Si no se ve, dejar vacío.' },
      categoria: { type: 'string', enum: ['ZAPATILLAS', 'PRENDAS', 'GORRAS', 'MOCHILAS'], description: 'Categoría del producto.' },
      estilo: { type: 'string', description: 'Estilo, ej: Casual, retro, deportivo, urbano.' },
      condicion: {
        type: 'string',
        enum: ['Nuevo con etiqueta', 'Nuevo sin etiqueta', 'Como nuevo', 'Usado - excelente', 'Usado - bueno', 'Usado - aceptable'],
        description: 'Condición estimada según el desgaste visible.',
      },
    },
    required: [],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `Sos un asistente experto en moda urbana de segunda mano (zapatillas, prendas, gorras y mochilas/bolsos de marca). Te dan fotos de UN producto y tenés que extraer sus datos para prellenar un formulario de venta.

Reglas:
- Basate SOLO en lo que se ve en las fotos. No inventes marca, modelo ni talla si no hay evidencia.
- Si un dato no se puede determinar con razonable seguridad, dejá ese campo vacío (no lo incluyas o ponelo como cadena vacía).
- La talla solo se completa si aparece en una etiqueta legible.
- La condición se estima por el desgaste visible.
- Respondé siempre llamando a la herramienta "completar_producto".`;

export async function POST(req: Request) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'La función de IA no está configurada (falta CLAUDE_API_KEY).' }, { status: 503 });
  }

  let images: ImgIn[];
  try {
    const body = await req.json();
    images = Array.isArray(body?.images) ? body.images : [];
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  const safeImages = images
    .filter((im) => im && typeof im.data === 'string' && VALID_MEDIA.has(im.media_type))
    .slice(0, MAX_IMAGES);

  if (safeImages.length === 0) {
    return Response.json({ error: 'Subí al menos una foto válida.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'completar_producto' },
      messages: [
        {
          role: 'user',
          content: [
            ...safeImages.map((im) => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: im.media_type as 'image/jpeg', data: im.data },
            })),
            { type: 'text' as const, text: 'Extraé los datos de este producto para prellenar el formulario.' },
          ],
        },
      ],
    });

    const toolUse = res.content.find((b) => b.type === 'tool_use');
    const fields = toolUse && toolUse.type === 'tool_use' ? toolUse.input : {};
    return Response.json({ fields });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de la IA';
    return Response.json({ error: msg }, { status: 502 });
  }
}
