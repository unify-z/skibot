import express from 'express';
import { matchEvents } from '../bot/events.js';
const router = express.Router();
await import ('express-async-errors')
router.post('/put_msg', async(req, res) => {
    //console.time('matchEvents')
    matchEvents(req.body);
    //console.timeEnd('matchEvents')
    res.send('success'); 
});

export default router;
