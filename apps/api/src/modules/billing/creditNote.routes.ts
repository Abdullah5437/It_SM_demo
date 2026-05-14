import { Router } from 'express';
import { creditNoteController } from './creditNote.controller';
import { creditNoteCreateSchema, creditNoteApplySchema } from '@i-itsm/shared';
import { authenticate, requireRole, validateRequest } from '../../middlewares';

const router = Router();

// All credit note routes require authentication and accounts/admin role
router.use(authenticate);
router.use(requireRole('accounts', 'admin'));

// Create credit note
router.post(
  '/',
  validateRequest(creditNoteCreateSchema),
  creditNoteController.createCreditNote.bind(creditNoteController)
);

// Get credit note
router.get('/:id', creditNoteController.getCreditNote.bind(creditNoteController));

// List credit notes
router.get('/', creditNoteController.listCreditNotes.bind(creditNoteController));

// Apply credit to invoice
router.post(
  '/:creditNoteId/apply',
  validateRequest(creditNoteApplySchema),
  creditNoteController.applyCredit.bind(creditNoteController)
);

export const creditNoteRoutes = router;
