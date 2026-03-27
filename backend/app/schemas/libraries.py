from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class LibraryTreeNodeResponse(BaseModel):
    id: str
    name: str
    node_type: str
    path: str
    stage_status: str
    source: str
    staged_item_count: int
    security_profiles: list[str]
    owner: str | None = None
    notes: str | None = None
    last_synced_at: datetime | None = None
    children: list[LibraryTreeNodeResponse] = Field(default_factory=list)


class LibraryStatsResponse(BaseModel):
    total_sites: int
    staged_nodes: int
    secured_nodes: int
    referenced_profiles: int


class LibraryListResponse(BaseModel):
    items: list[LibraryTreeNodeResponse]
    stats: LibraryStatsResponse
