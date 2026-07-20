let commentEventHandlers = [];

export const subscribeToCommentEvents = (handler) => {
  commentEventHandlers.push(handler);
  return () => {
    commentEventHandlers = commentEventHandlers.filter((item) => item !== handler);
  };
};

export const broadcastCommentEvent = async (event, payload) => {
  for (const handler of commentEventHandlers) {
    try {
      await handler(event, payload);
    } catch (error) {
      console.error('Comment event handler failed:', error);
    }
  }
};
