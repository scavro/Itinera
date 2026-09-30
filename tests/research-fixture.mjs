// Test-only sources and model: every outbound request is intercepted. No live API calls.
export const externalCalls = [];
export const fixtureMode = {
  invalidQuote: false,
  failure: false,
  redirect: false,
  delay: 0,
};
const fixtureProposal = {
  summary: "Propuesta ficticia de integración",
  visits: [
    {
      title: "Museo de prueba",
      area: "Puglia",
      category: "Museo de historia",
      description: "Colección de historia de prueba",
      sourceIds: ["s1"],
      quote: "Colección de historia",
      quoteSourceId: "s1",
    },
  ],
  agendas: [],
  foods: [],
  pending: ["Programación pendiente de publicación"],
};
export const mockExternal = async (request) => {
  const url = new URL(request.url);
  externalCalls.push(url.hostname + url.pathname);
  const input = await request.json();
  if (fixtureMode.delay)
    await new Promise((r) => setTimeout(r, fixtureMode.delay));
  if (fixtureMode.redirect)
    return new Response(null, {
      status: 302,
      headers: { Location: "https://unauthorized.invalid/leak" },
    });
  if (fixtureMode.failure)
    return Response.json({ error: "fixture-only" }, { status: 429 });
  if (url.hostname === "api.tavily.com" && url.pathname === "/search") {
    const topic = input.query.includes("opera theatre")
      ? "agenda"
      : input.query.includes("traditional food")
        ? "food"
        : "museum";
    return Response.json({
      results: [
        {
          url: `https://museotaranto.cultura.gov.it/fixture-${topic}`,
          title: `Fuente ficticia ${topic}`,
          content: "Colección de historia · datos ficticios",
        },
      ],
    });
  }
  if (url.hostname === "api.tavily.com" && url.pathname === "/extract")
    return Response.json({
      results: input.urls.map((url) => ({
        url,
        raw_content: "Colección de historia · texto de prueba",
      })),
      failed_results: [],
    });
  if (url.hostname === "generativelanguage.googleapis.com") {
    const proposal = structuredClone(fixtureProposal);
    if (fixtureMode.invalidQuote)
      proposal.visits[0].quote = "Cita que la fuente nunca dijo";
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(proposal) }] },
        },
      ],
    });
  }
  throw new Error("Salida de red no prevista en la prueba");
};
