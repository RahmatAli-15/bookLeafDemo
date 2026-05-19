from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Chapter(Base):
    __tablename__ = "chapters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    manuscript_id: Mapped[int] = mapped_column(ForeignKey("manuscripts.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chapter_number: Mapped[int] = mapped_column(Integer, nullable=False)

    manuscript = relationship("Manuscript", back_populates="chapters")
    chunks = relationship("Chunk", back_populates="chapter", cascade="all, delete-orphan")
