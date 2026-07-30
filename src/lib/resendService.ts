export async function sendSuspensionEmail(params: {
  email: string;
  username: string;
  reason: string;
}) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch('/api/send-suspension-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: params.email,
        username: params.username,
        reason: params.reason,
        origin
      })
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error triggering suspension email:', err);
    return { success: false, error: 'Failed to dispatch suspension email.' };
  }
}
