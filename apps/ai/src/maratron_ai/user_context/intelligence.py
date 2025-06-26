"""Intelligent context analysis and personalization."""

from typing import Dict, List, Any
from datetime import datetime
from dataclasses import dataclass
import re


@dataclass
class UserInsight:
    """Actionable insight about the user."""
    type: str  # goal, pattern, concern, achievement
    description: str
    confidence: float  # 0-1
    action_suggestion: str
    data_source: str


class ContextIntelligence:
    """Analyzes user data to provide intelligent context."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        
    def analyze_running_patterns(self, runs_data: List[Dict]) -> List[UserInsight]:
        """Analyze running patterns for insights."""
        insights = []
        
        if not runs_data:
            return insights
            
        # Pattern 1: Training consistency
        recent_runs = [r for r in runs_data if self._is_recent(r.get('date', ''))]
        if len(recent_runs) >= 3:
            consistency = self._calculate_consistency(recent_runs)
            if consistency > 0.8:
                insights.append(UserInsight(
                    type="pattern",
                    description="Highly consistent training schedule",
                    confidence=0.9,
                    action_suggestion="Consider suggesting progressive training plans",
                    data_source="recent_runs"
                ))
                
        # Pattern 2: Distance progression
        if len(runs_data) >= 5:
            is_progressing = self._analyze_distance_progression(runs_data)
            if is_progressing:
                insights.append(UserInsight(
                    type="achievement",
                    description="Showing positive distance progression",
                    confidence=0.8,
                    action_suggestion="Celebrate progress and suggest next milestone",
                    data_source="run_distances"
                ))
                
        # Pattern 3: Potential overtraining
        if len(recent_runs) >= 4:
            overtraining_risk = self._check_overtraining_risk(recent_runs)
            if overtraining_risk:
                insights.append(UserInsight(
                    type="concern",
                    description="Possible overtraining - high frequency without rest",
                    confidence=0.7,
                    action_suggestion="Suggest incorporating rest days",
                    data_source="training_frequency"
                ))
                
        return insights
        
    def analyze_user_goals(self, user_data: Dict, conversation_history: List) -> List[UserInsight]:
        """Analyze potential user goals from data and conversations."""
        insights = []
        
        # Extract mentioned goals from conversations
        mentioned_goals = self._extract_goals_from_conversations(conversation_history)
        
        for goal in mentioned_goals:
            insights.append(UserInsight(
                type="goal",
                description=f"User mentioned goal: {goal}",
                confidence=0.8,
                action_suggestion=f"Provide specific guidance for achieving: {goal}",
                data_source="conversation"
            ))
            
        # Infer goals from running patterns
        if user_data.get('runs'):
            inferred_goals = self._infer_goals_from_runs(user_data['runs'])
            insights.extend(inferred_goals)
            
        return insights
        
    def get_personalization_context(self, user_data: Dict, preferences: Dict, 
                                  conversation_memory: Any) -> Dict[str, Any]:
        """Generate comprehensive personalization context for LLM."""
        
        # Analyze all available data
        running_insights = self.analyze_running_patterns(user_data.get('runs', []))
        goal_insights = self.analyze_user_goals(user_data, getattr(conversation_memory, 'entries', []))
        
        # Determine user's experience level
        experience_level = self._determine_experience_level(user_data)
        
        # Analyze communication preferences
        communication_style = self._analyze_communication_style(conversation_memory)
        
        return {
            "experience_level": experience_level,
            "communication_style": communication_style,
            "key_insights": [insight.__dict__ for insight in running_insights + goal_insights],
            "suggested_topics": self._suggest_relevant_topics(running_insights, goal_insights),
            "motivational_context": self._get_motivational_context(running_insights),
            "personalization_tips": self._get_personalization_tips(preferences, running_insights)
        }
        
    def _is_recent(self, date_str: str, days: int = 14) -> bool:
        """Check if date is within recent period."""
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            return (datetime.now() - date_obj).days <= days
        except (ValueError, TypeError):
            return False
            
    def _calculate_consistency(self, runs: List[Dict]) -> float:
        """Calculate training consistency score."""
        if len(runs) < 2:
            return 0.0
            
        dates = [datetime.strptime(r.get('date', ''), '%Y-%m-%d') for r in runs]
        dates.sort()
        
        # Calculate average gap between runs
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        avg_gap = sum(gaps) / len(gaps)
        
        # Consistency score: lower gaps = higher consistency
        return max(0, 1 - (avg_gap - 1) / 6)  # Ideal is every other day
        
    def _analyze_distance_progression(self, runs: List[Dict]) -> bool:
        """Check if user is showing distance progression."""
        if len(runs) < 5:
            return False
            
        # Sort by date
        sorted_runs = sorted(runs, key=lambda x: x.get('date', ''))
        recent_avg = sum(r.get('distance', 0) for r in sorted_runs[-3:]) / 3
        older_avg = sum(r.get('distance', 0) for r in sorted_runs[:3]) / 3
        
        return recent_avg > older_avg * 1.1  # 10% improvement
        
    def _check_overtraining_risk(self, recent_runs: List[Dict]) -> bool:
        """Check for signs of overtraining."""
        if len(recent_runs) < 4:
            return False
            
        # Check for consecutive days without rest
        dates = [datetime.strptime(r.get('date', ''), '%Y-%m-%d') for r in recent_runs]
        dates.sort()
        
        consecutive_days = 0
        max_consecutive = 0
        
        for i in range(1, len(dates)):
            if (dates[i] - dates[i-1]).days == 1:
                consecutive_days += 1
                max_consecutive = max(max_consecutive, consecutive_days)
            else:
                consecutive_days = 0
                
        return max_consecutive >= 4  # 4+ consecutive days
        
    def _extract_goals_from_conversations(self, conversations: List) -> List[str]:
        """Extract mentioned goals from conversation history."""
        goals = []
        goal_patterns = [
            r"want to (?:run|complete) (?:a )?(.+)",
            r"goal (?:is|was) (?:to )?(.+)",
            r"training for (?:a )?(.+)",
            r"hoping to (.+)",
            r"plan to (.+)"
        ]
        
        for conv in conversations:
            message = getattr(conv, 'user_message', '')
            for pattern in goal_patterns:
                matches = re.findall(pattern, message.lower())
                goals.extend(matches)
                
        return list(set(goals))  # Remove duplicates
        
    def _infer_goals_from_runs(self, runs: List[Dict]) -> List[UserInsight]:
        """Infer goals from running patterns."""
        insights = []
        
        if not runs:
            return insights
            
        # Check for distance goals
        max_distance = max(r.get('distance', 0) for r in runs)
        if max_distance >= 13.1:  # Half marathon distance
            insights.append(UserInsight(
                type="goal",
                description="Likely training for long-distance events",
                confidence=0.7,
                action_suggestion="Provide marathon/half-marathon training advice",
                data_source="run_distances"
            ))
            
        return insights
        
    def _determine_experience_level(self, user_data: Dict) -> str:
        """Determine user's running experience level."""
        runs = user_data.get('runs', [])
        total_runs = len(runs)
        
        if total_runs == 0:
            return "beginner"
        elif total_runs < 10:
            return "novice"
        elif total_runs < 50:
            return "intermediate"
        else:
            return "experienced"
            
    def _analyze_communication_style(self, conversation_memory: Any) -> str:
        """Analyze preferred communication style."""
        if not hasattr(conversation_memory, 'entries') or not conversation_memory.entries:
            return "balanced"
            
        # Analyze message length and complexity
        entries = conversation_memory.entries
        avg_length = sum(len(e.user_message) for e in entries) / len(entries)
        
        if avg_length < 50:
            return "concise"
        elif avg_length > 150:
            return "detailed"
        else:
            return "balanced"
            
    def _suggest_relevant_topics(self, running_insights: List, goal_insights: List) -> List[str]:
        """Suggest relevant discussion topics based on insights."""
        topics = []
        
        for insight in running_insights + goal_insights:
            if insight.type == "achievement":
                topics.append("Celebrating progress and setting new challenges")
            elif insight.type == "concern":
                topics.append("Injury prevention and recovery strategies")
            elif insight.type == "goal":
                topics.append("Goal-specific training plans and timelines")
                
        return list(set(topics))
        
    def _get_motivational_context(self, insights: List[UserInsight]) -> Dict[str, str]:
        """Get motivational context based on insights."""
        context = {"tone": "encouraging", "focus": "progress"}
        
        achievements = [i for i in insights if i.type == "achievement"]
        concerns = [i for i in insights if i.type == "concern"]
        
        if achievements:
            context["tone"] = "celebratory"
            context["focus"] = "building_on_success"
        elif concerns:
            context["tone"] = "supportive"
            context["focus"] = "addressing_concerns"
            
        return context
        
    def _get_personalization_tips(self, preferences: Dict, insights: List[UserInsight]) -> List[str]:
        """Get specific tips for personalizing responses."""
        tips = []
        
        # Distance unit preference
        unit = preferences.get('distance_unit', 'miles')
        tips.append(f"Always use {unit} for distances")
        
        # Response detail preference
        if preferences.get('detailed_responses', True):
            tips.append("Provide comprehensive explanations and context")
        else:
            tips.append("Keep responses concise and action-focused")
            
        # Social data preference
        if preferences.get('include_social_data', True):
            tips.append("Include community and social aspects when relevant")
            
        return tips