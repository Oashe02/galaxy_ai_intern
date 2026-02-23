import { task } from "@trigger.dev/sdk/v3";

export const runLLMTask = task({
    id: "run-llm",
    maxDuration: 120,
    run: async (payload: {
        model: string;
        systemPrompt?: string;
        userMessage: string;
        images?: string[];
        temperature?: number;
    }) => {
        const { model, systemPrompt, userMessage, images, temperature = 0.7 } = payload;
        if (model.startsWith("gemini")) {
            return await callGemini({ model, systemPrompt, userMessage, images, temperature });
        } else if (model.startsWith("gpt")) {
            return await callOpenAI({ model, systemPrompt, userMessage, images, temperature });
        } else if (model.startsWith("claude")) {
            return await callClaude({ model, systemPrompt, userMessage, images, temperature });
        }

        throw new Error(`Unknown model: ${model}`);
    },
});

async function callGemini(opts: LLMOpts): Promise<LLMResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    ...(opts.systemPrompt ? [{ role: "user", parts: [{ text: opts.systemPrompt }] }] : []),
                    { role: "user", parts: [{ text: opts.userMessage }] },
                ],
                generationConfig: { temperature: opts.temperature },
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error: ${res.status} — ${err}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { text, model: opts.model, tokensUsed: text.length };
}

async function callOpenAI(opts: LLMOpts): Promise<LLMResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: opts.model,
            temperature: opts.temperature,
            messages: [
                ...(opts.systemPrompt ? [{ role: "system" as const, content: opts.systemPrompt }] : []),
                { role: "user" as const, content: opts.userMessage },
            ],
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API error: ${res.status} — ${err}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return { text, model: opts.model, tokensUsed: data?.usage?.total_tokens ?? 0 };
}

async function callClaude(opts: LLMOpts): Promise<LLMResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: opts.model,
            max_tokens: 4096,
            ...(opts.systemPrompt ? { system: opts.systemPrompt } : {}),
            messages: [{ role: "user", content: opts.userMessage }],
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Claude API error: ${res.status} — ${err}`);
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    return { text, model: opts.model, tokensUsed: (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0) };
}

// --- types ---

interface LLMOpts {
    model: string;
    systemPrompt?: string;
    userMessage: string;
    images?: string[];
    temperature: number;
}

interface LLMResult {
    text: string;
    model: string;
    tokensUsed: number;
}
