import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { insertLeadSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get all leads for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    
    const userId = req.user!.id;
    const leads = await storage.getLeadsByUserId(userId);
    
    res.json(leads);
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({ error: 'Failed to get leads' });
  }
});

// Get a specific lead by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    
    const userId = req.user!.id;
    const leadId = parseInt(req.params.id);
    
    const lead = await storage.getLead(leadId);
    
    if (!lead || lead.userId !== userId) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({ error: 'Failed to get lead' });
  }
});

// Create a new lead
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    
    const userId = req.user!.id;
    
    // Validate the request body against the schema
    const validatedData = insertLeadSchema.safeParse({ ...req.body, userId });
    
    if (!validatedData.success) {
      return res.status(400).json({ 
        error: 'Invalid lead data', 
        details: validatedData.error.format() 
      });
    }
    
    const lead = await storage.createLead(validatedData.data);
    
    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update a lead
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    
    const userId = req.user!.id;
    const leadId = parseInt(req.params.id);
    
    // Validate update fields
    const updateSchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      company: z.string().optional().nullable(),
      status: z.string().optional(),
      priority: z.string().optional(),
      nextContactDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      notes: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      value: z.number().optional().nullable()
    });
    
    const validatedData = updateSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ 
        error: 'Invalid lead data', 
        details: validatedData.error.format() 
      });
    }
    
    const updatedLead = await storage.updateLead(userId, leadId, validatedData.data);
    
    if (!updatedLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete a lead
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    
    const userId = req.user!.id;
    const leadId = parseInt(req.params.id);
    
    const success = await storage.deleteLead(userId, leadId);
    
    if (!success) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;