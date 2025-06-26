"""Enhanced conversation memory for better user context."""

from typing import Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class ConversationEntry:
    """Individual conversation turn with rich context."""
    timestamp: datetime
    user_message: str
    ai_response: str
    intent: str  # question, request, complaint, celebration, etc.
    entities: Dict[str, List[str]]  # extracted runs, dates, goals, etc.
    sentiment: str  # positive, negative, neutral, frustrated, excited
    context_used: List[str]  # what context was used to respond
    follow_up_needed: bool = False
    
    def to_summary(self) -> str:
        """Create a brief summary of this conversation."""
        return f"{self.timestamp.strftime('%Y-%m-%d')}: {self.intent} about {', '.join(self.entities.get('topics', ['general']))}"


class ConversationMemory:
    """Manages rich conversation history and context."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.entries: List[ConversationEntry] = []
        self.recurring_topics: Dict[str, int] = {}  # topic -> frequency
        self.user_patterns: Dict[str, Any] = {}
        self.unresolved_questions: List[str] = []
        
    def add_conversation(self, user_message: str, ai_response: str, 
                        intent: str = "general", entities: Dict = None,
                        sentiment: str = "neutral"):
        """Add a new conversation entry."""
        entry = ConversationEntry(
            timestamp=datetime.utcnow(),
            user_message=user_message,
            ai_response=ai_response,
            intent=intent,
            entities=entities or {},
            sentiment=sentiment,
            context_used=[]
        )
        
        self.entries.append(entry)
        self._update_patterns(entry)
        self._cleanup_old_entries()
        
    def _update_patterns(self, entry: ConversationEntry):
        """Update user patterns based on conversation."""
        # Track recurring topics
        for topic in entry.entities.get('topics', []):
            self.recurring_topics[topic] = self.recurring_topics.get(topic, 0) + 1
            
        # Track question patterns
        if entry.intent == 'question' and '?' in entry.user_message:
            self.unresolved_questions.append(entry.user_message)
            
    def _cleanup_old_entries(self, keep_days: int = 30):
        """Keep only recent conversations."""
        cutoff = datetime.utcnow() - timedelta(days=keep_days)
        self.entries = [e for e in self.entries if e.timestamp > cutoff]
        
    def get_recent_context(self, limit: int = 5) -> str:
        """Get formatted recent conversation context."""
        if not self.entries:
            return "No recent conversation history."
            
        recent = self.entries[-limit:]
        context_lines = []
        
        for entry in recent:
            context_lines.append(f"• {entry.to_summary()}")
            if entry.sentiment != "neutral":
                context_lines.append(f"  Mood: {entry.sentiment}")
                
        return "Recent conversation:\n" + "\n".join(context_lines)
        
    def get_user_interests(self) -> List[str]:
        """Get user's main interests based on conversation patterns."""
        sorted_topics = sorted(self.recurring_topics.items(), 
                             key=lambda x: x[1], reverse=True)
        return [topic for topic, count in sorted_topics[:5] if count >= 2]
        
    def has_unresolved_issues(self) -> bool:
        """Check if user has unresolved questions or concerns."""
        return len(self.unresolved_questions) > 0
        
    def get_context_for_llm(self) -> Dict[str, Any]:
        """Get comprehensive context for LLM."""
        return {
            "recent_conversations": self.get_recent_context(),
            "main_interests": self.get_user_interests(),
            "conversation_mood": self.entries[-1].sentiment if self.entries else "neutral",
            "unresolved_questions": self.unresolved_questions[-3:],
            "total_conversations": len(self.entries),
            "engagement_level": "high" if len(self.entries) > 10 else "medium" if len(self.entries) > 3 else "new"
        }