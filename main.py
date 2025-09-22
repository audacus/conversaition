import asyncio

from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langchain.chat_models import init_chat_model
from langchain_experimental.tools import PythonAstREPLTool


def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return f"It's always sunny in {city}!"


model = init_chat_model(
    model="gemini-2.5-pro",
    model_provider="google_genai",
    api_key="AIzaSyC2WudKEf5j6w2uOJUtSmjtgEeMq0da9rc",
)

tools = [
    get_weather,
    PythonAstREPLTool(),
]
agent = create_react_agent(
    model=model,
    tools=tools,
    prompt="You are helpful assistant",
)

message = HumanMessage("Calculate the 7th fibonacci number using Python and then calculate the date x years ago, where x is the calculated fibonacci number. And tell me if that year was a leap year or not. And by the way: Do you know Genspark AI?")

agent_input = {"messages": [message]}
events = agent.astream_events(agent_input)
# events = agent.astream(agent_input, stream_mode="messages")


async def main():

    async for event in events:
        print("\n===")
        print(event.get('data').get(''))
        print("===\n")


asyncio.run(main())
