import asyncio
from honcho import Honcho

async def main():
    # Initialize client - SDK handles /v3 internally
    client = Honcho(base_url="http://localhost:8000")
    
    try:
        # v3 uses simple property access and direct method names
        # 1. Get the workspace
        workspace = await client.workspaces.get("zerwiz-test-space")
        
        # 2. Get the peer (Agent)
        peer = await client.peers.get("LocalLlamaAgent", workspace_id=workspace.id)
        
        # 3. Create or get a session
        session = await client.sessions.create(
            workspace_id=workspace.id,
            name="interactive-chat"
        )
        
        print(f"Connected to Workspace: {workspace.id}")
        print("Agent: LocalLlamaAgent (Powered by RTX A5000)")
        print("Type 'exit' to quit.")
        
        while True:
            user_msg = input("\nYou: ")
            if user_msg.lower() in ["exit", "quit"]:
                break
            
            # 4. Chat directly through the peer
            response = await peer.chat(
                messages=[{"content": user_msg, "is_user": True}],
                session_id=session.id
            )
            
            print(f"\nAgent: {response.content}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
