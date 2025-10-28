import express from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  startTicketWork,
  resolveTicket,
  closeTicket
} from '../controller/ticketController.js';

const router = express.Router();

router.post('/', createTicket);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);

// Workflow Actions
router.put('/:id/assign', assignTicket);
router.put('/:id/start', startTicketWork);
router.put('/:id/resolve', resolveTicket);
router.put('/:id/close', closeTicket);

export default router;
