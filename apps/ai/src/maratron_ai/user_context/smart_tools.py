"""Smart MCP tools that provide intelligent user context."""

from typing import Dict, Any, List, Optional
import json
from ..database_utils import handle_database_errors
from .intelligence import ContextIntelligence
from .memory import ConversationMemory
from .context import get_current_user_session, get_current_user_id


@handle_database_errors
async def get_smart_user_context_tool() -> str:
    """Get comprehensive, intelligent user context for the LLM.
    
    This tool provides rich context including:
    - User preferences and patterns
    - Recent conversation history
    - Running insights and achievements
    - Personalized recommendations
    - Motivational context
    """
    try:
        session = get_current_user_session()
        if not session:
            return "❌ No active user session. Please set a user first."
            
        user_id = get_current_user_id()
        
        # Get user data from session cache
        user_data = session.cached_user_data
        preferences = session.preferences.dict() if session.preferences else {}
        
        # Initialize intelligence system
        intelligence = ContextIntelligence(user_id)
        
        # Get conversation memory (simplified for now)
        conversation_context = session.conversation_context
        
        # Generate comprehensive context
        context = intelligence.get_personalization_context(
            user_data, preferences, conversation_context
        )
        
        # Format for LLM consumption
        llm_context = {
            "user_profile": {
                "user_id": user_id,
                "experience_level": context["experience_level"],
                "communication_preference": context["communication_style"],
                "total_runs": len(user_data.get('runs', [])),
                "preferred_units": preferences.get('distance_unit', 'miles')
            },
            "insights": context["key_insights"],
            "conversation_context": {
                "recent_topics": getattr(conversation_context, 'last_topic', None),
                "conversation_mood": getattr(conversation_context, 'conversation_mood', 'neutral'),
                "last_action": getattr(conversation_context, 'last_action', None)
            },
            "personalization_guidance": {
                "motivational_tone": context["motivational_context"]["tone"],
                "response_focus": context["motivational_context"]["focus"],
                "suggested_topics": context["suggested_topics"],
                "personalization_tips": context["personalization_tips"]
            },
            "actionable_insights": [
                insight for insight in context["key_insights"] 
                if insight.get("confidence", 0) > 0.7
            ]
        }
        
        return f"""🧠 **Smart User Context**

**User Profile:**
• Experience Level: {llm_context['user_profile']['experience_level'].title()}
• Communication Style: {llm_context['user_profile']['communication_preference'].title()}
• Total Runs: {llm_context['user_profile']['total_runs']}
• Preferred Units: {llm_context['user_profile']['preferred_units']}

**Current Context:**
• Recent Topic: {llm_context['conversation_context']['recent_topics'] or 'None'}
• Mood: {llm_context['conversation_context']['conversation_mood'].title()}
• Last Action: {llm_context['conversation_context']['last_action'] or 'None'}

**Personalization Guidance:**
• Motivational Tone: {llm_context['personalization_guidance']['motivational_tone'].title()}
• Response Focus: {llm_context['personalization_guidance']['response_focus'].replace('_', ' ').title()}

**Key Insights:**
{chr(10).join(f"• {insight.get('description', 'No description')}" for insight in llm_context['insights'][:3])}

**Suggested Topics:**
{chr(10).join(f"• {topic}" for topic in llm_context['personalization_guidance']['suggested_topics'][:3])}

**Personalization Tips:**
{chr(10).join(f"• {tip}" for tip in llm_context['personalization_guidance']['personalization_tips'])}

---
*This context should guide your responses to be more personalized and helpful.*"""

    except Exception as e:
        return f"❌ Error generating smart context: {str(e)}"


@handle_database_errors  
async def analyze_user_patterns_tool() -> str:
    """Analyze user patterns and provide insights about their running journey."""
    try:
        session = get_current_user_session()
        if not session:
            return "❌ No active user session. Please set a user first."
            
        user_id = get_current_user_id()
        user_data = session.cached_user_data
        
        intelligence = ContextIntelligence(user_id)
        running_insights = intelligence.analyze_running_patterns(user_data.get('runs', []))
        goal_insights = intelligence.analyze_user_goals(user_data, [])
        
        if not running_insights and not goal_insights:
            return "📊 **Pattern Analysis**: Not enough data for meaningful insights. Encourage more running data entry!"
            
        result = "📊 **User Pattern Analysis**\n\n"
        
        # Group insights by type
        achievements = [i for i in running_insights if i.type == "achievement"]
        concerns = [i for i in running_insights if i.type == "concern"]
        patterns = [i for i in running_insights if i.type == "pattern"]
        goals = goal_insights
        
        if achievements:
            result += "🏆 **Achievements & Progress:**\n"
            for insight in achievements:
                result += f"• {insight.description} (confidence: {insight.confidence:.0%})\n"
                result += f"  → {insight.action_suggestion}\n\n"
                
        if patterns:
            result += "📈 **Training Patterns:**\n" 
            for insight in patterns:
                result += f"• {insight.description} (confidence: {insight.confidence:.0%})\n"
                result += f"  → {insight.action_suggestion}\n\n"
                
        if concerns:
            result += "⚠️ **Areas for Improvement:**\n"
            for insight in concerns:
                result += f"• {insight.description} (confidence: {insight.confidence:.0%})\n"
                result += f"  → {insight.action_suggestion}\n\n"
                
        if goals:
            result += "🎯 **Detected Goals:**\n"
            for insight in goals:
                result += f"• {insight.description}\n"
                result += f"  → {insight.action_suggestion}\n\n"
                
        return result
        
    except Exception as e:
        return f"❌ Error analyzing patterns: {str(e)}"


@handle_database_errors
async def get_motivational_context_tool() -> str:
    """Get motivational context to help the LLM provide encouraging responses."""
    try:
        session = get_current_user_session()
        if not session:
            return "❌ No active user session. Please set a user first."
            
        user_id = get_current_user_id()
        user_data = session.cached_user_data
        
        intelligence = ContextIntelligence(user_id)
        insights = intelligence.analyze_running_patterns(user_data.get('runs', []))
        motivational_context = intelligence._get_motivational_context(insights)
        
        # Get recent performance data
        recent_runs = [r for r in user_data.get('runs', []) if intelligence._is_recent(r.get('date', ''))]
        
        result = "💪 **Motivational Context**\n\n"
        result += f"**Recommended Tone:** {motivational_context['tone'].title()}\n"
        result += f"**Focus Area:** {motivational_context['focus'].replace('_', ' ').title()}\n\n"
        
        if recent_runs:
            total_distance = sum(r.get('distance', 0) for r in recent_runs)
            avg_distance = total_distance / len(recent_runs)
            result += f"**Recent Activity:** {len(recent_runs)} runs, {total_distance:.1f} total miles, {avg_distance:.1f} avg distance\n\n"
            
        # Provide specific motivational guidance
        if motivational_context['tone'] == 'celebratory':
            result += "🎉 **Guidance:** Celebrate their achievements! Acknowledge progress and suggest building on success.\n"
        elif motivational_context['tone'] == 'supportive':
            result += "🤝 **Guidance:** Be supportive and understanding. Focus on solutions and encouragement.\n"
        else:
            result += "🌟 **Guidance:** Maintain an encouraging tone while providing helpful information.\n"
            
        return result
        
    except Exception as e:
        return f"❌ Error getting motivational context: {str(e)}"


@handle_database_errors
async def update_conversation_intelligence_tool(user_message: str, ai_response: str, 
                                               intent: str = "general", sentiment: str = "neutral") -> str:
    """Update conversation intelligence with rich context from the current interaction.
    
    Args:
        user_message: The user's message
        ai_response: The AI's response  
        intent: The intent of the conversation (question, request, complaint, etc.)
        sentiment: The user's sentiment (positive, negative, neutral, etc.)
    """
    try:
        session = get_current_user_session()
        if not session:
            return "❌ No active user session. Please set a user first."
            
        # Update conversation context with rich information
        context = session.conversation_context
        
        # Extract entities and topics from the message
        entities = _extract_entities(user_message)
        
        # Update context
        if entities.get('topics'):
            context.last_topic = entities['topics'][0]
            
        context.conversation_mood = sentiment
        context.last_action = intent
        
        # Track mentioned items
        if entities.get('runs'):
            context.mentioned_runs.extend(entities['runs'])
            
        if entities.get('goals'):
            context.mentioned_goals.extend(entities['goals'])
            
        session.update_activity()
        
        return f"✅ Updated conversation intelligence - Intent: {intent}, Sentiment: {sentiment}, Topics: {', '.join(entities.get('topics', ['none']))}"
        
    except Exception as e:
        return f"❌ Error updating conversation intelligence: {str(e)}"


def _extract_entities(message: str) -> Dict[str, List[str]]:
    """Extract entities from user message."""
    entities = {
        'topics': [],
        'runs': [],
        'goals': [],
        'distances': [],
        'dates': []
    }
    
    # Simple entity extraction (could be enhanced with NLP)
    message_lower = message.lower()
    
    # Topics
    topic_keywords = {
        'training': ['training', 'workout', 'exercise'],
        'race': ['race', 'marathon', 'half marathon', '5k', '10k'],
        'injury': ['injury', 'pain', 'hurt', 'sore'],
        'goals': ['goal', 'target', 'aim', 'want to'],
        'progress': ['progress', 'improvement', 'better', 'faster']
    }
    
    for topic, keywords in topic_keywords.items():
        if any(keyword in message_lower for keyword in keywords):
            entities['topics'].append(topic)
            
    # Goals
    goal_patterns = ['want to', 'goal', 'hoping to', 'plan to', 'training for']
    for pattern in goal_patterns:
        if pattern in message_lower:
            entities['goals'].append(f"mentioned {pattern}")
            
    return entities