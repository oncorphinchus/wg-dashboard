import { Router } from 'express';
import { getServerStatus, listServers } from '../controllers/serverStatus';

const router = Router();

router.get('/', listServers);
router.get('/:serverId/status', getServerStatus);

export const serversRouter = router; 