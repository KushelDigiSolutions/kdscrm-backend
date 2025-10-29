import express from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  getTicketByClientId,
  updateTicket,
  deleteTicket,
  assignTicket,
  startTicketWork,
  resolveTicket,
  closeTicket,
  addMessageToTicket,
  getMessageThreads,
  editMessageInTicket,
  deleteMessageFromTicket
} from '../controller/ticketController.js';
import isAuthenticated from '../middleware/auth.js';

const router = express.Router();

router.post('/', createTicket);
router.get('/', isAuthenticated, getAllTickets);
router.get('/:id', getTicketById);
router.get('/my/:id', getTicketByClientId);
router.put('/:id',  updateTicket);
router.delete('/:id',  deleteTicket);

// Workflow Actions
router.put('/:id/assign', assignTicket);
router.put('/:id/start', startTicketWork);
router.put('/:id/resolve', resolveTicket);
router.put('/:id/close', closeTicket);

router.post('/:id/message', addMessageToTicket);
router.get('/:id/messages', getMessageThreads);
router.put('/:id/message/:messageId', editMessageInTicket);
router.delete('/:id/message/:messageId', deleteMessageFromTicket);

export default router;
