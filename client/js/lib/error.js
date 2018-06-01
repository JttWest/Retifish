const parseMessage = (err) => {
  const message = {
    type: 'negative',
    header: 'An error has occured',
  }

  if (err && err.message)
    message.content = err.message

  return message
}

export default {
  parseMessage
}
