export function createConversationNameFromMessage(content: string): string {
  let value = content;
  try {
    const jsonContent = JSON.parse(content);
    for (const p of jsonContent) {
      if (p.type === 'text') {
        value = p.text;
        break;
      }
    }
  } catch (err) {
    // not a json string
  }

  return value.length > 30 ? value.substring(0, 30) + '...' : value;
}
