"""Usage examples for Maratron AI MCP Server web app integration."""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from maratron_ai import MaratronAPI, maratron_api, quick_add_run, quick_get_runs


async def basic_usage_example():
    """Basic usage example with manual cleanup."""
    print("=== Basic Usage Example ===")
    
    # Create API instance
    api = MaratronAPI()
    
    try:
        # Create a user
        result = await api.create_user("Alice Smith", "alice@example.com")
        print(f"Create user: {result}")
        
        if result["success"]:
            user_id = result["user_id"]
            
            # Set user context
            await api.set_user_context(user_id)
            
            # Add a run
            run_result = await api.add_run(
                user_id=user_id,
                date="2024-01-15",
                duration="00:30:00",
                distance=3.5
            )
            print(f"Add run: {run_result}")
            
            # Get user's runs
            runs = await api.get_user_runs(user_id)
            print(f"User runs: {runs}")
            
            # Get user profile
            profile = await api.get_user_profile(user_id)
            print(f"User profile: {profile}")
            
    finally:
        # Always cleanup
        await api.cleanup()


async def context_manager_example():
    """Example using async context manager for automatic cleanup."""
    print("\n=== Context Manager Example ===")
    
    async with maratron_api() as api:
        # Create a user
        result = await api.create_user("Bob Runner", "bob@example.com")
        print(f"Create user: {result}")
        
        if result["success"]:
            user_id = result["user_id"]
            
            # Add multiple runs
            runs_data = [
                {"date": "2024-01-10", "duration": "00:25:00", "distance": 3.0},
                {"date": "2024-01-12", "duration": "00:40:00", "distance": 5.0},
                {"date": "2024-01-14", "duration": "00:35:00", "distance": 4.2},
            ]
            
            for run_data in runs_data:
                result = await api.add_run(user_id=user_id, **run_data)
                print(f"Added run: {result.get('message', result)}")
            
            # Get run summary
            summary = await api.get_run_summary(user_id)
            print(f"Run summary: {summary}")
            
            # Add shoes
            shoe_result = await api.add_shoe(
                user_id=user_id,
                name="Nike Air Zoom",
                max_distance=500.0
            )
            print(f"Add shoe: {shoe_result}")
            
            # Get user shoes
            shoes = await api.get_user_shoes(user_id)
            print(f"User shoes: {shoes}")


async def quick_functions_example():
    """Example using quick convenience functions."""
    print("\n=== Quick Functions Example ===")
    
    # These functions handle their own API instance and cleanup
    user_id = "1"  # Assuming user exists
    
    # Quick add run
    result = await quick_add_run(
        user_id=user_id,
        date=datetime.now().strftime("%Y-%m-%d"),
        duration="00:28:00",
        distance=3.2
    )
    print(f"Quick add run: {result}")
    
    # Quick get runs
    runs = await quick_get_runs(user_id)
    print(f"Quick get runs: {runs}")


async def error_handling_example():
    """Example demonstrating error handling."""
    print("\n=== Error Handling Example ===")
    
    async with maratron_api() as api:
        # Try to get a non-existent user
        result = await api.get_user_profile("999999")
        print(f"Non-existent user: {result}")
        
        # Try to add run with invalid data
        result = await api.add_run("999999", "invalid-date", "invalid-duration", -1.0)
        print(f"Invalid run data: {result}")
        
        # Check system health
        health = await api.health_check()
        print(f"System health: {health}")


async def web_app_integration_example():
    """Example showing how to integrate with a web application."""
    print("\n=== Web App Integration Example ===")
    
    class ChatbotService:
        def __init__(self):
            self.api = MaratronAPI()
        
        async def handle_user_message(self, user_id: str, message: str) -> Dict[str, Any]:
            """Process user message and return response."""
            try:
                # Set user context
                await self.api.set_user_context(user_id)
                
                # Parse message and determine action
                if "add run" in message.lower():
                    # Extract run data from message (simplified)
                    result = await self.api.add_run(
                        user_id=user_id,
                        date=datetime.now().strftime("%Y-%m-%d"),
                        duration="00:30:00",
                        distance=3.0
                    )
                    return {"response": f"Added your run! {result.get('message', '')}", "success": True}
                
                elif "my runs" in message.lower():
                    result = await self.api.get_user_runs(user_id)
                    if result["success"]:
                        return {"response": f"Here are your recent runs:\n{result['data']}", "success": True}
                    else:
                        return {"response": "Sorry, couldn't fetch your runs.", "success": False}
                
                elif "profile" in message.lower():
                    result = await self.api.get_user_profile(user_id)
                    if result["success"]:
                        return {"response": f"Your profile:\n{result['data']}", "success": True}
                    else:
                        return {"response": "Sorry, couldn't fetch your profile.", "success": False}
                
                else:
                    return {"response": "I can help you add runs, view your runs, or show your profile.", "success": True}
                    
            except Exception as e:
                logging.error(f"Error handling message: {e}")
                return {"response": "Sorry, something went wrong.", "success": False}
        
        async def cleanup(self):
            """Cleanup resources."""
            await self.api.cleanup()
    
    # Example usage
    chatbot = ChatbotService()
    
    try:
        # Simulate user messages
        user_id = "1"
        messages = [
            "add run today",
            "show my runs",
            "show my profile"
        ]
        
        for message in messages:
            response = await chatbot.handle_user_message(user_id, message)
            print(f"User: {message}")
            print(f"Bot: {response['response']}\n")
            
    finally:
        await chatbot.cleanup()


async def batch_operations_example():
    """Example showing batch operations for better performance."""
    print("\n=== Batch Operations Example ===")
    
    async with maratron_api() as api:
        # Create multiple users
        users_data = [
            ("Charlie Runner", "charlie@example.com"),
            ("Diana Sprinter", "diana@example.com"),
            ("Eve Marathon", "eve@example.com")
        ]
        
        created_users = []
        for name, email in users_data:
            result = await api.create_user(name, email)
            if result["success"]:
                created_users.append(result["user_id"])
                print(f"Created user {name}: {result['user_id']}")
        
        # Add runs for each user
        for user_id in created_users:
            for i in range(3):
                date = f"2024-01-{10 + i:02d}"
                result = await api.add_run(
                    user_id=user_id,
                    date=date,
                    duration=f"00:{25 + i*5}:00",
                    distance=3.0 + i * 0.5
                )
                print(f"Added run for user {user_id}: {result.get('message', result)}")
        
        # Get database stats
        stats = await api.get_database_stats()
        print(f"Database stats: {stats}")


async def main():
    """Run all examples."""
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    
    try:
        await basic_usage_example()
        await context_manager_example()
        await quick_functions_example()
        await error_handling_example()
        await web_app_integration_example()
        await batch_operations_example()
        
    except Exception as e:
        print(f"Example failed: {e}")
        logging.error(f"Example error: {e}", exc_info=True)


if __name__ == "__main__":
    # Run examples
    asyncio.run(main())