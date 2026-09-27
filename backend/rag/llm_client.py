"""
LLM fallback chain built with LangChain's native `.with_fallbacks()` — one
unified interface instead of separate hand-written functions per provider.

Order comes from config.LLM_PROVIDER_ORDER. A provider is silently skipped
if its API key isn't set. Each provider is wrapped so a failure (missing
key, rate limit, timeout, bad response) raises, letting with_fallbacks()
move to the next one automatically.
"""
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from . import config

SYSTEM_PROMPT = (
    "You are PakGenie's packaging assistant. Answer the user's question about "
    "food packaging, shelf life, and storage conditions using ONLY the context "
    "provided below. If the context does not contain the answer, say you don't "
    "have enough recorded data to answer confidently. Be concise and specific."
)


def _build_messages(question: str, context_chunks: list[str]):
    context = "\n".join(f"- {c}" for c in context_chunks)
    user_content = f"Context (retrieved packaging/food records):\n{context}\n\nQuestion: {question}"
    return [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_content)]


def _make_gemini():
    if not config.GEMINI_API_KEY:
        print("[llm_client] gemini: no API key set, skipping")
        return None
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=config.GEMINI_MODEL,
        google_api_key=config.GEMINI_API_KEY,
        max_output_tokens=config.MAX_TOKENS,
    )


def _make_mistral():
    if not config.MISTRAL_API_KEY:
        print("[llm_client] mistral: no API key set, skipping")
        return None
    from langchain_mistralai import ChatMistralAI

    return ChatMistralAI(
        model=config.MISTRAL_MODEL,
        api_key=config.MISTRAL_API_KEY,
        max_tokens=config.MAX_TOKENS,
    )


def _make_sambanova():
    if not config.SAMBANOVA_API_KEY:
        print("[llm_client] sambanova: no API key set, skipping")
        return None
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=config.SAMBANOVA_MODEL,
        api_key=config.SAMBANOVA_API_KEY,
        base_url="https://api.sambanova.ai/v1",
        max_tokens=config.MAX_TOKENS,
    )


_PROVIDER_BUILDERS = {
    "gemini": _make_gemini,
    "mistral": _make_mistral,
    "sambanova": _make_sambanova,
}


def _extract_text(content) -> str:
    """response.content can be a plain string, or (e.g. with Gemini) a list
    of content parts — each either a string or a dict like {"text": "..."}.
    Normalize whatever comes back into a single plain string."""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                parts.append(part["text"])
        return "".join(parts).strip()
    return str(content).strip()


def _wrap_with_provider_name(name: str, chat_model):
    """Wrap a chat model so a successful call also reports which provider
    answered — with_fallbacks() alone doesn't expose that, since it just
    returns the first success and swallows which step produced it.

    Also logs every attempt to console, since with_fallbacks() only
    re-raises the FIRST error even if every provider in the chain failed —
    without this logging we can't tell whether later providers were tried
    at all or what error each one hit."""

    def _invoke(messages):
        print(f"[llm_client] attempting provider: {name}")
        try:
            response = chat_model.invoke(messages)
        except Exception as e:
            print(f"[llm_client] provider {name} FAILED: {type(e).__name__}: {e}")
            raise
        text = _extract_text(response.content)
        if not text:
            print(f"[llm_client] provider {name} returned empty response")
            raise RuntimeError(f"{name} returned an empty response")
        print(f"[llm_client] provider {name} SUCCEEDED")
        return {"answer": text, "provider": name}

    return RunnableLambda(_invoke)


def _build_chain():
    runnables = []
    for provider_name in config.LLM_PROVIDER_ORDER:
        provider_name = provider_name.strip().lower()
        builder = _PROVIDER_BUILDERS.get(provider_name)
        if builder is None:
            print(f"[llm_client] '{provider_name}' is not a known provider, skipping")
            continue
        chat_model = builder()
        if chat_model is None:
            continue  # no API key set for this provider — skip it
        runnables.append(_wrap_with_provider_name(provider_name, chat_model))

    print(f"[llm_client] chain built with providers (in order): "
          f"{[p.strip().lower() for p in config.LLM_PROVIDER_ORDER]}")

    if not runnables:
        raise RuntimeError(
            "No LLM providers are configured — check your .env file has at "
            "least one of GEMINI_API_KEY, MISTRAL_API_KEY, SAMBANOVA_API_KEY set."
        )

    primary, *fallbacks = runnables
    return primary.with_fallbacks(fallbacks)


def generate_answer(question: str, context_chunks: list[str]) -> dict:
    """
    Returns {"answer": str, "provider": str} from the first provider in the
    chain that succeeds. Raises if every configured provider fails.
    """
    chain = _build_chain()
    messages = _build_messages(question, context_chunks)
    return chain.invoke(messages)