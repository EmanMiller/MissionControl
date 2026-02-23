import cron from 'node-cron';
import { pollOpenClawSessions } from './openclaw.js';

// Poll OpenClaw sessions every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  try {
    console.log('Starting OpenClaw session polling...');
    const polledCount = await pollOpenClawSessions();
    console.log(`OpenClaw polling complete: ${polledCount} sessions checked`);
  } catch (error) {
    console.error('Error during OpenClaw session polling:', error);
  }
});

console.log('🔄 OpenClaw session polling scheduled (every 2 minutes)');

export default { pollOpenClawSessions };