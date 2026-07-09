/**
 * Triggers the Just-In-Time native Android microphone authorization prompt 
 * and polls the status matrix until clearance is granted or denied.
 */
export async function requestMicrophoneClearance() {
  const micPermission = 'android.permission.RECORD_AUDIO';
  const payloadData = { permissions: [micPermission] };

  try {
    // 1. FAST-PATH PRE-CHECK: Inspect current state first to avoid flashing dialogs
    const statusResponse = await fetch('/api/permissions/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadData)
    });
    
    if (statusResponse.ok) {
      const matrixData = await statusResponse.json();
      if (matrixData.permissions_matrix[micPermission] === 'GRANTED') {
        console.log('-> [MIC-FAST-PATH] Microphone already verified as GRANTED. Proceeding.');
        return true;
      }
    }

    // 2. TRIGGER PROMPT: Dispatch the async native platform dialog alert window overlay
    console.log('-> Requesting native microphone hardware clearance alert overlay...');
    const reqResponse = await fetch('/api/permissions/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadData)
    });

    if (reqResponse.status !== 202) {
      throw new Error(`Native permissions event bus rejected query with status: ${reqResponse.status}`);
    }

    // 3. NON-BLOCKING POLLING LOOP: Poll status metrics every 500ms for user selection
    const maxAttempts = 40; // 20-second total validation timeout window safety rail
    let currentAttempt = 0;
    let isGranted = false;

    while (currentAttempt < maxAttempts) {
      // Yield execution thread safely to prevent browser layout lockups
      await new Promise(resolve => setTimeout(resolve, 500));
      currentAttempt++;

      const checkResponse = await fetch('/api/permissions/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData)
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.permissions_matrix[micPermission] === 'GRANTED') {
          isGranted = true;
          break;
        }
      }
    }

    // 4. FINAL STATUS EVALUATION
    if (!isGranted) {
      console.warn('-> [MIC-DENIED] Microphone access was explicitly rejected by the operator.');
      alert('Microphone access is required to use this application feature.');
      return false;
    }

    console.log('-> [MIC-SUCCESS] Microphone clearance successfully captured dynamically!');
    return true;

  } catch (err) {
    console.error('Microphone request transaction pipeline crash:', err.message);
    return false;
  }
}

