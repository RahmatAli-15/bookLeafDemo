from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.audiobook_agent import run_audiobook_agent
from app.agents.cover_agent import run_cover_agent
from app.agents.grammar_agent import run_grammar_agent
from app.agents.metadata_agent import run_metadata_agent
from app.agents.parser_agent import parser_agent
from app.agents.rag_agent import run_rag_prep_agent
from app.agents.social_agent import run_social_agent
from app.agents.summary_agent import run_summary_agent
from app.agents.translation_agent import run_translation_agent


class WorkflowState(TypedDict):
    project_id: int
    project_title: str
    manuscript_id: int
    chapters: list[dict[str, Any]]
    selected_agents: list[str]
    target_language: str
    voice: str
    genre_hint: str
    audio_dir: str
    outputs: dict[str, Any]
    agent_status: dict[str, str]
    errors: list[dict[str, str]]
    step: str


def _execute(state: WorkflowState, agent_key: str, agent_fn):
    state.setdefault("agent_status", {})
    if agent_key not in state.get("selected_agents", []):
        state["agent_status"][agent_key] = "pending"
        return state

    state["agent_status"][agent_key] = "running"
    try:
        next_state = agent_fn(state)
        next_state["agent_status"][agent_key] = "completed"
        return next_state
    except Exception as exc:  # noqa: BLE001
        state["agent_status"][agent_key] = "failed"
        state.setdefault("errors", []).append({"agent": agent_key, "error": str(exc)})
        return state


def upload_node(state: WorkflowState) -> WorkflowState:
    state["step"] = "upload_received"
    return state


def parser_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "parser", parser_agent)


def supervisor_node(state: WorkflowState) -> WorkflowState:
    state["step"] = "supervisor_routing"
    return state


def summary_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "summary", run_summary_agent)


def metadata_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "metadata", run_metadata_agent)


def social_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "social", run_social_agent)


def grammar_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "grammar", run_grammar_agent)


def translation_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "translation", run_translation_agent)


def cover_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "cover", run_cover_agent)


def audiobook_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "audiobook", run_audiobook_agent)


def rag_node(state: WorkflowState) -> WorkflowState:
    return _execute(state, "rag_prep", run_rag_prep_agent)


def save_node(state: WorkflowState) -> WorkflowState:
    state["step"] = "structured_data_saved"
    return state


def build_parser_workflow():
    graph = StateGraph(WorkflowState)
    graph.add_node("upload", upload_node)
    graph.add_node("parser", parser_node)
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("summary", summary_node)
    graph.add_node("metadata", metadata_node)
    graph.add_node("social", social_node)
    graph.add_node("grammar", grammar_node)
    graph.add_node("translation", translation_node)
    graph.add_node("cover", cover_node)
    graph.add_node("audiobook", audiobook_node)
    graph.add_node("rag", rag_node)
    graph.add_node("save", save_node)

    graph.add_edge(START, "upload")
    graph.add_edge("upload", "parser")
    graph.add_edge("parser", "supervisor")
    graph.add_edge("supervisor", "summary")
    graph.add_edge("summary", "metadata")
    graph.add_edge("metadata", "social")
    graph.add_edge("social", "grammar")
    graph.add_edge("grammar", "translation")
    graph.add_edge("translation", "cover")
    graph.add_edge("cover", "audiobook")
    graph.add_edge("audiobook", "rag")
    graph.add_edge("rag", "save")
    graph.add_edge("save", END)

    return graph.compile()
