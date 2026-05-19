from typing import Any


def run_rag_prep_agent(state: dict[str, Any]) -> dict[str, Any]:
    state["outputs"]["rag_prep"] = {
        "status": "ready",
        "chunks_indexed": len(state.get("chapters", [])),
        "note": "Chunk-based retrieval index prepared from manuscript chapters.",
    }
    return state
