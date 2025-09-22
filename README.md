# conversaition

## Idea

"Bringing multiple AIs to the table for a conversation (with a human in the loop)."

## Functional requirements

- Let multiple AIs and a human (user) talk together.
- The different AIs shall not interrupt each other, but wait for the "talking" AI to finish the current step.
- Challenge/issue: it should not always be the fastest AI that should always be talking/responding first -> a complex system to allow all participants to bring their points to the conversation, not just order-based, maybe request-based and taking into account which AI has talked how much (amount of messages, frequency of messages, length of messages, ...) already.
- Hint: use the LLM events (thinking, output start, output end, step start, step end, ...) to control the flow/order of the conversation.
- Challenge/issue: an AI should not try to respond to their own output, except it is not satisfied with its last input and wants to correct it/add additional information.
- At the beginning the user needs to start the conversation by giving a manual input, or by tasking an AI participant to provide a conversation starter.
- As a user I want to be able to configure the AIs that should be available as participants.
- Conversation participants can be saved in a pool to be re-used over and over again.
- Conversation participants can be configured: system prompt (overriding the default system prompt), temperature (if applicable), etc.
- As a user I want to be able to pause the conversation (the AIs talking) and be able to do following:
  - Alter the existing messages (chat history).
  - Add my own messages to the conversation.
  - Add/remove conversation participants (existing from the pool or create a new one).

## Non-functional requirements

- Docker-based
- Web UI
