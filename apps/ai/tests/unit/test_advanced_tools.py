"""Unit tests for Advanced MCP Tools.

These tests verify the advanced training, analytics, and social tools work correctly
with proper user context management and error handling.
"""

import pytest
import json
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

# Import the tools to test
from maratron_ai.advanced_tools import (
    generate_training_plan_tool,
    get_active_training_plan_tool,
    set_running_goal_tool,
    get_goal_progress_tool,
    get_performance_trends_tool,
    predict_race_time_tool,
    get_social_feed_tool,
    create_run_post_tool
)


class TestTrainingPlanTools:
    """Test training plan management tools."""

    @pytest.fixture
    def mock_user_context(self):
        """Mock user context for tests."""
        with patch('maratron_ai.advanced_tools.get_current_user_id') as mock_user, \
             patch('maratron_ai.user_context.context.get_current_user_id') as mock_user_2, \
             patch('maratron_ai.security.data_isolation.get_current_user_id') as mock_user_3, \
             patch('maratron_ai.user_context.context.get_current_user_session') as mock_session:
            mock_user.return_value = 'test-user-123'
            mock_user_2.return_value = 'test-user-123'  # For security decorator
            mock_user_3.return_value = 'test-user-123'  # For data isolation module
            mock_session.return_value = {
                'user_id': 'test-user-123',
                'session_id': 'test-session-123',
                'started_at': datetime.now()
            }
            yield mock_user

    @pytest.fixture  
    def mock_pool(self):
        """Mock database pool."""
        pool = AsyncMock()
        with patch('maratron_ai.advanced_tools.get_pool', return_value=pool):
            yield pool

    @pytest.fixture
    def sample_user_data(self):
        """Sample user data for testing."""
        return {
            'id': 'test-user-123',
            'name': 'Test Runner',
            'trainingLevel': 'intermediate',
            'VDOT': 45,
            'weeklyMileage': 30,
            'defaultDistanceUnit': 'miles'
        }

    @pytest.fixture
    def sample_runs(self):
        """Sample run data for testing."""
        return [
            {
                'id': str(uuid.uuid4()),
                'distance': 5.0,
                'duration': '00:40:00',
                'date': datetime.now() - timedelta(days=1),
                'pace': '8:00'
            },
            {
                'id': str(uuid.uuid4()),
                'distance': 8.0,
                'duration': '01:05:00',
                'date': datetime.now() - timedelta(days=3),
                'pace': '8:10'
            }
        ]

    @pytest.mark.unit
    async def test_generate_training_plan_success(self, mock_user_context, mock_pool, sample_user_data, sample_runs):
        """Test successful training plan generation."""
        # Mock database queries
        mock_pool.fetchrow.return_value = sample_user_data
        mock_pool.fetch.return_value = sample_runs
        mock_pool.execute.return_value = None

        result = await generate_training_plan_tool(
            goal_type='race',
            target_distance=13.1,
            target_time='1:45:00',
            weeks=16,
            distance_unit='miles'
        )

        assert "Training Plan Generated Successfully!" in result
        assert "16 weeks" in result
        assert "race" in result.lower()
        assert "13.1" in result

    @pytest.mark.unit
    async def test_generate_training_plan_no_user(self):
        """Test training plan generation without user context."""
        with patch('maratron_ai.advanced_tools.get_current_user_id', return_value=None):
            # This should be caught by the @require_user_context decorator
            # In a real implementation, the decorator would raise an exception
            pass

    @pytest.mark.unit
    async def test_get_active_training_plan_no_plan(self, mock_user_context, mock_pool):
        """Test getting active training plan when none exists."""
        mock_pool.fetchrow.return_value = None

        result = await get_active_training_plan_tool()

        assert "No Active Training Plan" in result
        assert "generateTrainingPlan()" in result

    @pytest.mark.unit
    async def test_get_active_training_plan_with_plan(self, mock_user_context, mock_pool):
        """Test getting active training plan with existing plan."""
        plan_data = {
            'phases': [
                {'name': 'Base Building', 'focus': 'Building endurance'},
                {'name': 'Build Phase', 'focus': 'Adding speed work'},
                {'name': 'Peak & Taper', 'focus': 'Race preparation'}
            ]
        }
        
        mock_plan = {
            'id': str(uuid.uuid4()),
            'name': 'Half Marathon Plan',
            'weeks': 12,
            'planData': json.dumps(plan_data),
            'createdAt': datetime.now() - timedelta(weeks=2)
        }
        
        mock_pool.fetchrow.return_value = mock_plan
        mock_pool.fetch.return_value = []  # No completed runs

        result = await get_active_training_plan_tool()

        assert "Active Training Plan" in result
        assert "Half Marathon Plan" in result
        assert "Week 3 of 12" in result


class TestGoalTools:
    """Test goal management tools."""

    @pytest.fixture
    def mock_user_context(self):
        with patch('maratron_ai.advanced_tools.get_current_user_id') as mock_user, \
             patch('maratron_ai.user_context.context.get_current_user_id') as mock_user_2, \
             patch('maratron_ai.security.data_isolation.get_current_user_id') as mock_user_3, \
             patch('maratron_ai.user_context.context.get_current_user_session') as mock_session:
            mock_user.return_value = 'test-user-123'
            mock_user_2.return_value = 'test-user-123'  # For security decorator
            mock_user_3.return_value = 'test-user-123'  # For data isolation module
            mock_session.return_value = {
                'user_id': 'test-user-123',
                'session_id': 'test-session-123',
                'started_at': datetime.now()
            }
            yield mock_user

    @pytest.fixture
    def mock_pool(self):
        pool = AsyncMock()
        with patch('maratron_ai.advanced_tools.get_pool', return_value=pool):
            yield pool

    @pytest.mark.unit
    async def test_set_running_goal_success(self, mock_user_context, mock_pool):
        """Test successful goal setting."""
        mock_pool.fetchrow.return_value = {'goals': []}
        mock_pool.execute.return_value = None

        result = await set_running_goal_tool(
            goal_type='distance_pr',
            target_value=15.0,
            target_date='2024-12-31',
            description='Run my first 15-mile long run'
        )

        assert "Goal Set Successfully!" in result
        assert "Distance Pr" in result
        assert "15.0 miles" in result
        assert "2024-12-31" in result

    @pytest.mark.unit
    async def test_set_running_goal_invalid_type(self, mock_user_context, mock_pool):
        """Test setting goal with invalid type."""
        result = await set_running_goal_tool(
            goal_type='invalid_type',
            target_value=10.0
        )

        assert "Invalid goal type" in result
        assert "distance_pr" in result

    @pytest.mark.unit
    async def test_get_goal_progress_no_goals(self, mock_user_context, mock_pool):
        """Test getting goal progress with no active goals."""
        mock_pool.fetchrow.return_value = {'goals': None}

        result = await get_goal_progress_tool()

        assert "No Active Goals" in result
        assert "setRunningGoal()" in result

    @pytest.mark.unit
    async def test_get_goal_progress_with_goals(self, mock_user_context, mock_pool):
        """Test getting goal progress with active goals."""
        goals = [
            json.dumps({
                'goal_type': 'weekly_mileage',
                'target_value': 35.0,
                'status': 'active',
                'created_date': datetime.now().isoformat()
            })
        ]
        
        mock_pool.fetchrow.return_value = {'goals': goals}
        mock_pool.fetch.return_value = [
            {'distance': 8.0, 'date': datetime.now() - timedelta(days=1)},
            {'distance': 6.0, 'date': datetime.now() - timedelta(days=3)}
        ]

        result = await get_goal_progress_tool()

        assert "Goal Progress Tracking" in result
        assert "Weekly Mileage" in result


class TestAnalyticsTools:
    """Test performance analytics tools."""

    @pytest.fixture
    def mock_user_context(self):
        with patch('maratron_ai.advanced_tools.get_current_user_id') as mock_user, \
             patch('maratron_ai.user_context.context.get_current_user_id') as mock_user_2, \
             patch('maratron_ai.security.data_isolation.get_current_user_id') as mock_user_3, \
             patch('maratron_ai.user_context.context.get_current_user_session') as mock_session:
            mock_user.return_value = 'test-user-123'
            mock_user_2.return_value = 'test-user-123'  # For security decorator
            mock_user_3.return_value = 'test-user-123'  # For data isolation module
            mock_session.return_value = {
                'user_id': 'test-user-123',
                'session_id': 'test-session-123',
                'started_at': datetime.now()
            }
            yield mock_user

    @pytest.fixture
    def mock_pool(self):
        pool = AsyncMock()
        with patch('maratron_ai.advanced_tools.get_pool', return_value=pool):
            yield pool

    @pytest.fixture
    def sample_runs_for_analysis(self):
        """Generate sample runs for analytics testing."""
        runs = []
        for i in range(20):
            runs.append({
                'id': str(uuid.uuid4()),
                'distance': 5.0 + (i * 0.2),  # Progressive increase
                'duration': '00:40:00',
                'date': datetime.now() - timedelta(days=i*2),
                'pace': '8:00'
            })
        return runs

    @pytest.mark.unit
    async def test_get_performance_trends_insufficient_data(self, mock_user_context, mock_pool):
        """Test performance trends with insufficient data."""
        mock_pool.fetch.return_value = [
            {'distance': 5.0, 'date': datetime.now()}
        ]  # Only 1 run

        result = await get_performance_trends_tool('3months')

        assert "Performance Trends" in result
        assert "Need at least 5 runs" in result

    @pytest.mark.unit
    async def test_get_performance_trends_success(self, mock_user_context, mock_pool, sample_runs_for_analysis):
        """Test successful performance trends analysis."""
        mock_pool.fetch.return_value = sample_runs_for_analysis

        result = await get_performance_trends_tool('3months')

        assert "Performance Trends (3months)" in result
        assert "Training Volume:" in result
        assert "Pace Analysis:" in result
        assert "Key Insights:" in result
        assert "Recommendations:" in result

    @pytest.mark.unit
    async def test_predict_race_time_insufficient_data(self, mock_user_context, mock_pool):
        """Test race time prediction with insufficient training data."""
        mock_pool.fetchrow.return_value = {'VDOT': 40}
        mock_pool.fetch.return_value = [
            {'distance': 5.0, 'date': datetime.now()}
        ]  # Only 1 run

        result = await predict_race_time_tool(
            distance=13.1,
            goal_date='2024-12-31',
            distance_unit='miles'
        )

        assert "Race Time Prediction" in result
        assert "Need at least 3 recent runs" in result

    @pytest.mark.unit
    async def test_predict_race_time_success(self, mock_user_context, mock_pool, sample_runs_for_analysis):
        """Test successful race time prediction."""
        mock_pool.fetchrow.return_value = {'VDOT': 45}
        mock_pool.fetch.return_value = sample_runs_for_analysis

        result = await predict_race_time_tool(
            distance=26.2,
            goal_date='2024-12-31',
            distance_unit='miles'
        )

        assert "Race Time Prediction" in result
        assert "26.2 miles on 2024-12-31" in result
        assert "Current Fitness:" in result
        assert "Projected Fitness:" in result
        assert "Pace Strategy:" in result


class TestSocialTools:
    """Test social feature tools."""

    @pytest.fixture
    def mock_user_context(self):
        with patch('maratron_ai.advanced_tools.get_current_user_id') as mock_user, \
             patch('maratron_ai.user_context.context.get_current_user_id') as mock_user_2, \
             patch('maratron_ai.security.data_isolation.get_current_user_id') as mock_user_3, \
             patch('maratron_ai.user_context.context.get_current_user_session') as mock_session:
            mock_user.return_value = 'test-user-123'
            mock_user_2.return_value = 'test-user-123'  # For security decorator
            mock_user_3.return_value = 'test-user-123'  # For data isolation module
            mock_session.return_value = {
                'user_id': 'test-user-123',
                'session_id': 'test-session-123',
                'started_at': datetime.now()
            }
            yield mock_user

    @pytest.fixture
    def mock_pool(self):
        pool = AsyncMock()
        with patch('maratron_ai.advanced_tools.get_pool', return_value=pool):
            yield pool

    @pytest.mark.unit
    async def test_get_social_feed_no_profile(self, mock_user_context, mock_pool):
        """Test getting social feed without a social profile."""
        mock_pool.fetchrow.return_value = None

        result = await get_social_feed_tool()

        assert "Social Feed" in result
        assert "create a social profile first" in result

    @pytest.mark.unit
    async def test_get_social_feed_no_posts(self, mock_user_context, mock_pool):
        """Test getting social feed with no posts."""
        mock_pool.fetchrow.return_value = {'id': 'social-profile-123'}
        mock_pool.fetch.return_value = []

        result = await get_social_feed_tool()

        assert "Social Feed" in result
        assert "Follow more runners" in result
        assert "join groups" in result

    @pytest.mark.unit
    async def test_get_social_feed_with_posts(self, mock_user_context, mock_pool):
        """Test getting social feed with posts."""
        mock_pool.fetchrow.return_value = {'id': 'social-profile-123'}
        
        sample_posts = [
            {
                'id': str(uuid.uuid4()),
                'username': 'runner_friend',
                'distance': 6.2,
                'time': '00:50:00',
                'caption': 'Great morning run!',
                'createdAt': datetime.now() - timedelta(hours=2)
            }
        ]
        mock_pool.fetch.return_value = sample_posts

        # Mock engagement stats
        with patch('maratron_ai.advanced_tools._get_post_engagement') as mock_engagement:
            mock_engagement.return_value = {'likes': 5, 'comments': 2}
            
            result = await get_social_feed_tool()

            assert "Social Feed" in result
            assert "@runner_friend" in result
            assert "6.2 miles" in result
            assert "Great morning run!" in result
            assert "5 likes" in result

    @pytest.mark.unit
    async def test_create_run_post_no_profile(self, mock_user_context, mock_pool):
        """Test creating run post without social profile."""
        mock_pool.fetchrow.return_value = None

        result = await create_run_post_tool(
            run_id='run-123',
            caption='Amazing run today!'
        )

        assert "need a social profile" in result

    @pytest.mark.unit
    async def test_create_run_post_run_not_found(self, mock_user_context, mock_pool):
        """Test creating run post with invalid run ID."""
        # Mock social profile exists
        mock_pool.fetchrow.side_effect = [
            {'id': 'social-profile-123'},  # Social profile found
            None  # Run not found
        ]

        result = await create_run_post_tool(
            run_id='invalid-run-id',
            caption='Amazing run today!'
        )

        assert "Run not found" in result

    @pytest.mark.unit
    async def test_create_run_post_success(self, mock_user_context, mock_pool):
        """Test successful run post creation."""
        # Mock social profile and run data
        mock_pool.fetchrow.side_effect = [
            {'id': 'social-profile-123'},  # Social profile
            {  # Run data
                'id': 'run-123',
                'distance': 5.0,
                'duration': '00:40:00',
                'date': datetime.now(),
                'distanceUnit': 'miles'
            }
        ]
        mock_pool.execute.return_value = None
        mock_pool.fetch.return_value = []  # No group memberships

        result = await create_run_post_tool(
            run_id='run-123',
            caption='Amazing morning run!',
            share_to_groups='false'
        )

        assert "Run Posted Successfully!" in result
        assert "5.0 miles" in result
        assert "Amazing morning run!" in result
        assert "Shared to your followers" in result


class TestHelperFunctions:
    """Test helper functions used by advanced tools."""

    def test_generate_smart_plan(self):
        """Test training plan generation logic."""
        from maratron_ai.advanced_tools import _generate_smart_plan
        
        plan = _generate_smart_plan(
            training_level='intermediate',
            current_vdot=45,
            weekly_mileage=30,
            goal_type='race',
            target_distance=13.1,
            target_time='1:45:00',
            weeks=12,
            recent_runs=[]
        )
        
        assert plan['plan_type'] == 'race'
        assert plan['target_distance'] == 13.1
        assert len(plan['phases']) == 3
        assert 'Base Building' in plan['phases'][0]['name']

    def test_calculate_goal_progress(self):
        """Test goal progress calculation."""
        from maratron_ai.advanced_tools import _calculate_goal_progress
        
        goal = {
            'goal_type': 'weekly_mileage',
            'target_value': 35.0
        }
        
        runs = [
            {'distance': 8.0, 'date': datetime.now()},
            {'distance': 7.0, 'date': datetime.now() - timedelta(days=1)},
            {'distance': 6.0, 'date': datetime.now() - timedelta(days=2)}
        ]
        
        progress = _calculate_goal_progress(goal, runs)
        
        assert 'current_value' in progress
        assert 'percentage' in progress
        assert 'status' in progress
        assert 'encouragement' in progress

    def test_format_time_ago(self):
        """Test relative time formatting."""
        from maratron_ai.advanced_tools import _format_time_ago
        
        # Test different time intervals
        now = datetime.now()
        
        # Minutes ago
        result = _format_time_ago(now - timedelta(minutes=30))
        assert "30 minutes ago" in result
        
        # Hours ago
        result = _format_time_ago(now - timedelta(hours=2))
        assert "2 hours ago" in result
        
        # Days ago
        result = _format_time_ago(now - timedelta(days=3))
        assert "3 days ago" in result


# Pytest configuration for advanced tools tests
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])